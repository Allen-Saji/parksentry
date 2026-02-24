# ParkSentry - Full Technical Implementation Plan

This document is implementation-ready and intended for coding agents to execute directly.

## 1. Product Scope

### 1.1 MVP Objectives

Build a production-lean system that can:
1. Ingest live parking gate video
2. Detect vehicles and infer entry/exit events
3. Read number plates (ANPR)
4. Persist structured event logs with evidence
5. Support natural-language retrieval for operators

### 1.2 Out of Scope (MVP)

- Traffic signal integration
- Fine-grained vehicle make/model classification
- Automated challan issuance
- Multi-site tenancy and enterprise RBAC
- Legal-grade evidence signing

---

## 2. Core Use Cases

1. "When did KA01AB1234 enter?"
2. "Did KA01AB1234 exit today?"
3. "Show all exits between 20:00 and 22:00"
4. "List vehicles still inside parking"

---

## 3. System Architecture

## 3.1 Components

1. **Stream Ingest Gateway**
   - Pulls frames from live source (Stream/WebRTC/RTSP bridge)
   - Normalizes frame rate for processing

2. **Vision Processing Service**
   - Vehicle detection
   - Tracking IDs across frames
   - Direction inference using virtual line crossing

3. **ANPR Service**
   - Plate region detection
   - OCR and cleanup
   - Confidence and validation rules

4. **Event Engine**
   - Creates canonical ENTRY/EXIT events
   - Deduplicates repeat detections
   - Attaches snapshots and clip references

5. **Storage Layer**
   - PostgreSQL for structured events
   - Object storage for media artifacts

6. **Search & Query Service**
   - Parses NL queries
   - Executes plate/time/direction filters
   - Returns ranked results

7. **Dashboard/API Layer**
   - Live feed + event table
   - Search UI
   - Alert widgets

8. **Batch Replay Pipeline**
   - Chunk-based long video processing
   - Parallel workers
   - Aggregate and merge events

---

## 3.2 Data Flow (Live)

1. Frame arrives from ingest
2. Detector finds vehicles (bbox/class/confidence)
3. Tracker assigns stable track IDs
4. For each track, check line crossing state
5. If crossing event occurs -> trigger ANPR on best frame window
6. Parse plate text and validate format/confidence
7. Create ENTRY/EXIT event with timestamp + evidence
8. Persist to DB + push realtime UI update

---

## 3.3 Data Flow (Replay / Upload)

1. Upload video -> store object -> create `job_id`
2. Chunk video into 5-minute segments with 2-second overlap
3. Enqueue chunk jobs
4. Worker pool processes chunks in parallel
5. Aggregator merges boundary overlaps and deduplicates events
6. Persist final indexed event timeline
7. Mark job completed and expose query endpoint

---

## 4. Detailed Processing Design

## 4.1 Vehicle Detection

- Model: YOLO family (n/s for latency, m if GPU budget allows)
- Target classes: `car`, `motorbike`, `bus`, `truck`
- Confidence threshold: start at 0.35 and tune
- NMS IoU: 0.5 baseline

## 4.2 Multi-object Tracking

- Tracker: ByteTrack/DeepSORT
- Goal: stable track ID through occlusion and motion blur
- Keep short history per track:
  - centroids by frame
  - velocity vector
  - visibility score

## 4.3 Entry/Exit Inference

- Configure virtual line in scene coordinates (gate boundary)
- Infer crossing direction by centroid trajectory before/after crossing
- Hysteresis window to avoid bounce/noise
- Event emitted only once per track crossing state

## 4.4 ANPR Pipeline

1. Candidate frame selection:
   - highest plate visibility score around crossing window
2. Plate detection model (or ROI from vehicle bbox + heuristic)
3. OCR model run on plate crop
4. Post-processing:
   - uppercase
   - remove non-alphanumerics
   - validate against expected plate regex patterns
5. Confidence scoring:
   - OCR confidence
   - consensus across adjacent frames
6. Final output with `plate_text`, `plate_confidence`

## 4.5 Event Deduplication Rules

- Same plate + same direction + nearby timestamp (e.g., <= 60s) -> merge
- If plate uncertain, fallback to track signature hash and merge cautiously
- Keep raw candidate events in audit table for debugging

---

## 5. Query Understanding

## 5.1 Query Types

1. Plate lookup (`KA01AB1234`)
2. Time-range lookup (`between 8 and 10 PM`)
3. Status query (`is this vehicle inside?`)
4. Aggregate query (`how many exits today?`)

## 5.2 NL Parser Strategy

- Rule-first parser for deterministic entities (plate/time keywords)
- LLM fallback only for ambiguous phrasing
- Parse output contract:

```json
{
  "intent": "plate_lookup|range_lookup|inside_status|aggregate",
  "plate": "KA01AB1234",
  "direction": "entry|exit|any",
  "start_time": "ISO",
  "end_time": "ISO",
  "timezone": "Asia/Kolkata"
}
```

---

## 6. API Specification (MVP)

## 6.1 Ingest and jobs
- `POST /api/videos/upload` -> `{ jobId }`
- `GET /api/jobs/:jobId/status` -> `{ state, progress, stage }`

## 6.2 Events
- `GET /api/events` with filters:
  - `plate`
  - `direction`
  - `from`
  - `to`
  - `camera_id`
- `GET /api/events/:eventId` -> detailed record + media URLs

## 6.3 Search
- `POST /api/search`
  - body: `{ query: "When did KA01AB1234 exit?" }`
  - returns structured hits with confidence

## 6.4 Live
- `GET /api/live/health`
- `WS /api/live/events` realtime event stream

---

## 7. Data Model

### `cameras`
- `id` UUID PK
- `name` TEXT
- `location` TEXT
- `line_config` JSONB
- `created_at`

### `processing_jobs`
- `id` UUID PK
- `source_type` TEXT (`upload|live`)
- `status` TEXT
- `progress` NUMERIC
- `meta` JSONB
- `created_at`, `updated_at`

### `vehicle_tracks`
- `id` UUID PK
- `camera_id` UUID
- `track_uid` TEXT
- `first_seen_at`, `last_seen_at`
- `meta` JSONB

### `events`
- `id` UUID PK
- `camera_id` UUID
- `event_type` TEXT (`entry|exit`)
- `event_time` TIMESTAMPTZ
- `plate_text` TEXT NULL
- `plate_confidence` NUMERIC NULL
- `track_uid` TEXT
- `vehicle_class` TEXT
- `confidence` NUMERIC
- `snapshot_url` TEXT
- `clip_url` TEXT
- `created_at`

### `event_candidates`
- `id` UUID PK
- `event_id` UUID NULL
- `raw_payload` JSONB
- `created_at`

### `search_queries`
- `id` UUID PK
- `query_text` TEXT
- `parsed_intent` JSONB
- `latency_ms` INT
- `created_at`

---

## 8. Infra and Deployment

## 8.1 Services

- `api-service` (Node/Fastify)
- `vision-worker` (Python, GPU optional)
- `anpr-worker` (Python)
- `queue` (Redis)
- `db` (Postgres)
- `object-store` (S3/R2 external)
- `frontend` (Next.js)

## 8.2 Runtime Profiles

### Dev profile
- CPU-only YOLO tiny model
- single worker
- local Postgres + Redis

### Demo profile
- 1 GPU worker + 1 CPU backup worker
- 1 API instance
- 1 dashboard instance

### Scale profile
- autoscale workers by queue depth
- camera sharding by site

---

## 9. Performance Targets

- Live detection event latency: <= 2.5s p95
- Query response latency: <= 1s p95 for indexed events
- Replay throughput target: >= 4x realtime with parallel workers
- Plate read precision target (demo setup): >= 90% on clear plates

---

## 10. Reliability and Observability

- Structured logs with `camera_id`, `track_uid`, `event_id`
- Metrics:
  - detection fps
  - queue depth
  - OCR success rate
  - event precision/recall samples
- Alerts for dropped stream, worker crash, queue stalls
- Dead-letter queue for failed chunk jobs

---

## 11. Security and Privacy

- Encrypt media URLs (signed URLs, short TTL)
- Redact plate data in non-admin logs
- Keep retention policy configurable by site
- Add explicit data purge endpoint for demo compliance

---

## 12. Implementation Phases

## Phase 0 - Bootstrap (Day 0)
- Repo scaffold
- CI setup
- Docker compose (api, workers, db, redis)
- env config templates

## Phase 1 - Live core (Day 1)
- Frame ingest
- vehicle detection + tracking
- line crossing eventing
- basic event persistence

## Phase 2 - ANPR (Day 1-2)
- plate detection + OCR
- regex normalization
- confidence and consensus
- attach plate to events

## Phase 3 - Search and dashboard (Day 2)
- event list UI
- NL query parser + search endpoint
- clip/snapshot retrieval

## Phase 4 - Replay workers (Day 2-3)
- upload + chunking
- distributed chunk processing
- aggregation + dedup
- progress updates

## Phase 5 - Hardening (Day 3)
- latency tuning
- quality tuning thresholds
- observability dashboards
- demo script and fallback paths

---

## 13. Demo Strategy (Hackathon)

1. Start live feed with gate line visible
2. Vehicle passes inward -> ENTRY event appears
3. Vehicle exits -> EXIT event appears
4. Query: "When did KA01AB1234 exit?"
5. Show exact timestamp + clip + confidence
6. Show replay upload and parallel processing progress for longer footage

---

## 14. Risks and Mitigations

1. **Blurred plates**
   - Mitigation: multi-frame OCR consensus, trigger on best angle frames
2. **Night lighting**
   - Mitigation: pre-processing (contrast/denoise), separate thresholds
3. **Occlusion at gate**
   - Mitigation: better camera placement + tracker hysteresis
4. **False duplicate events**
   - Mitigation: dedup window + track continuity checks
5. **Compute cost spikes**
   - Mitigation: adaptive FPS and staged processing

---

## 15. Suggested Name and Brand

Project name: **ParkSentry**
Tagline: **"Ask your parking camera anything."**

Alternate names:
- GatePulse
- ParkTrace
- EntryLens

---

## 16. Next files to add (post-plan)

- `docs/API_SPEC.md`
- `docs/DEPLOYMENT.md`
- `docs/DEMO_SCRIPT.md`
- `infra/docker-compose.yml`
- `src/` scaffold for API + workers

This plan is optimized for quick hackathon execution while remaining extensible to production architecture.
