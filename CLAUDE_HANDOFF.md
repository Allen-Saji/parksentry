# Claude Handoff — ParkSentry

## Repository
- **Repo:** https://github.com/Allen-Saji/parksentry
- **Branch:** `master`
- **Latest commit:** `TBD` — crossing-transition based entry/exit inference (no alternating heuristic)

## Project Goal
Parking-area video intelligence backend:
1. ingest uploaded footage,
2. chunk and process in workers,
3. detect vehicles + infer entry/exit,
4. expose queryable event timeline APIs.

Current implementation is backend-first with staged pipeline components and mock/placeholder vision logic where needed.

---

## What is already implemented

### 1) Core API + infrastructure
- Fastify API with:
  - health/readiness routes
  - search routes
  - jobs routes
  - upload routes (JSON + multipart)
  - events/dashboard routes
- PostgreSQL repositories + migration runner
- Local storage for uploaded files (`var/uploads/...`)
- Worker loop process (`npm run worker`)

### 2) Security / reliability
- API key auth (`x-api-key` / Bearer)
- role header parsing (`x-roles`) and route RBAC:
  - `operator` for upload/query ops
  - `worker` for worker endpoints
  - `admin` override
- global rate limiting
- idempotency support for upload endpoint (`Idempotency-Key`)
- audit logs table + write hooks

### 3) Processing pipeline stages done
1. Upload -> create parent job
2. Chunk planning and chunk_jobs creation
3. Worker leases chunks safely (`FOR UPDATE SKIP LOCKED`)
4. ffmpeg frame extraction per chunk
5. Candidate creation from sampled frames
6. Detection persistence (currently mock detector)
7. Entry/exit event inference (currently heuristic) and persistence
8. Parent job progress aggregation

### 4) Data model (migrations)
Applied migrations include:
- `001_init.sql` (events, jobs, cameras)
- `003_jobs_columns.sql`
- `004_chunk_jobs.sql`
- `005_uploaded_assets.sql`
- `006_chunk_job_reliability.sql`
- `007_idempotency_audit.sql`
- `008_event_candidates.sql`
- `009_detections.sql`
- `010_entry_exit_events.sql`

### 5) Implemented endpoints (high-level)
- `POST /api/videos/upload`
- `POST /api/videos/upload-file`
- `GET /api/jobs/:jobId/status`
- `GET /api/jobs/:jobId/chunks`
- `POST /api/videos/probe`
- `GET /api/jobs/:jobId/candidates`
- `GET /api/jobs/:jobId/detections`
- `GET /api/jobs/:jobId/entry-exit-events`
- `GET /api/events`
- `GET /api/dashboard/summary`
- dev worker endpoint for stepping jobs

See `docs/API_SPEC.md` for current request/response examples.

---

## Current architecture reality (important)
- Vision detection is still mocked (`src/services/vision/mockDetector.ts`)
- Entry/exit inference is still heuristic, but now upgraded to gate-crossing transition logic per class (no index alternation) in `src/services/vision/entryExitInference.ts`
- No ANPR plate OCR pipeline yet
- No real tracking (ByteTrack/DeepSORT) yet

So pipeline is structurally wired, but model quality is not production-grade yet.

---

## Files to inspect first
- `src/workers/chunkProcessor.ts`
- `src/workers/chunkWorker.ts`
- `src/services/media/ffmpeg.ts`
- `src/services/media/chunkRunner.ts`
- `src/services/vision/frameCandidateExtractor.ts`
- `src/services/vision/mockDetector.ts`
- `src/services/vision/entryExitInference.ts`
- `src/db/repositories/*`
- `src/routes/*`
- `docs/API_SPEC.md`
- `docs/OPERATIONS.md`

---

## Suggested immediate next steps

### Priority 1: Replace mock detector
- Detector routing scaffold is now added via `src/services/vision/detector.ts`:
  - `DETECTOR_MODE=mock|http`
  - `DETECTOR_HTTP_ENDPOINT` for external detector service
  - automatic fallback to mock controlled by `DETECTOR_FALLBACK_MOCK`
- Next step: point `DETECTOR_HTTP_ENDPOINT` to real detector service and finalize response schema contract.
- Keep interface shape stable (`DetectionInput[]`).

### Priority 2: Add tracking + proper line crossing
- Baseline improvement done: event type no longer alternates by index.
  - It now uses bbox center vs configurable virtual line (`GATE_LINE_X`) in `entryExitInference.ts`.
  - Event timestamps are now derived from `chunkStartSecond + frameIndex/fps`.
- Remaining upgrade:
  - Introduce true per-track IDs across frames
  - Generate events on *crossing transitions* by trajectory, not static side classification.

### Priority 3: ANPR pipeline
- Plate crop detection
- OCR extraction + normalization
- confidence merge across adjacent frames
- attach `plate_text` to `entry_exit_events`

### Priority 4: Event quality controls
- deduplicate events (same plate + direction + short time window)
- reject low-confidence noise
- keep raw candidates for auditability

### Priority 5: Query upgrades
- better NL parsing for:
  - "did KA01AB1234 exit today"
  - "vehicles currently inside"
  - time-range filters with timezone handling

---

## Runbook (local)
```bash
# 1) Ensure postgres is running and DATABASE_URL is set
npm run migrate
npm run dev
# separate terminal
npm run worker
```

Prereqs:
- ffmpeg + ffprobe installed on PATH
- PostgreSQL running

---

## Development style requested by user
- Commit **feature-by-feature**
- Keep commits reasonably scoped and descriptive
- User prefers steady progress updates with commit hashes
- Avoid fluff in status updates

---

## Notes for continuity
- User is okay with safe and verified pace (build checks before push)
- User may hand over to Claude after this point
- Keep architecture practical and implementation-focused
