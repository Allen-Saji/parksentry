# ParkSentry

**AI Parking Entry/Exit Intelligence with ANPR + Natural Language Search**

ParkSentry is a real-time and replay-capable parking surveillance copilot.
It detects vehicle entry/exit events, reads number plates, and lets operators query events in plain language.

Example queries:
- "When did KA01AB1234 enter?"
- "Did MH12XY7788 exit today?"
- "Show all exits between 8 PM and 10 PM"

---

## Why this project

Parking operations rely on manual CCTV review and handwritten logs. This causes delays, missed incidents, and poor auditability.

ParkSentry automates the full loop:
1. Detect vehicles at gate camera
2. Infer entry/exit direction
3. Read plate with confidence
4. Store timestamped events
5. Retrieve instantly with natural-language queries

---

## Core Features (MVP)

- Real-time stream ingestion (Stream/Vision Agents compatible)
- Vehicle detection and multi-object tracking
- Virtual gate-line crossing logic for entry/exit detection
- ANPR pipeline (plate detection + OCR + confidence scoring)
- Event timeline with snapshots and short clips
- Query API for plate/time-based search
- Operator dashboard with live feed + event table

---

## Architecture (high level)

```text
Camera Stream -> Ingest -> Detection/Tracking -> Line Crossing -> ANPR -> Event Store
                                                      |                        |
                                                      +---- Alerts/UI --------+

User Query -> NL Parser -> Search Engine -> Event Results + Clips
```

### Two processing modes

1. **Live mode (low latency):** detect events as they happen
2. **Replay mode (batch workers):** process long uploaded footage with chunked parallel jobs

---

## Technology Stack

- **Backend API:** Node.js + TypeScript + Fastify
- **Vision workers:** Python + OpenCV + YOLO + OCR
- **Queue:** Redis + BullMQ/Celery
- **Database:** PostgreSQL (+ optional pgvector)
- **Storage:** S3/R2 for clips and snapshots
- **Frontend:** Next.js dashboard
- **Realtime transport:** Stream Vision Agents / WebRTC path

---

## Repo Contents

- `README.md` — project overview
- `IMPLEMENTATION_PLAN.md` — detailed architecture + delivery phases
- `docs/DETECTOR_HTTP_CONTRACT.md` — detector service request/response contract

## Detector integration (current)

- Worker detector adapter supports:
  - `DETECTOR_MODE=mock` (default)
  - `DETECTOR_MODE=http` + `DETECTOR_HTTP_ENDPOINT`
- Local detector stub (for integration testing):

```bash
npm run detector:stub
```

Then run worker with HTTP mode:

```bash
DETECTOR_MODE=http DETECTOR_HTTP_ENDPOINT=http://localhost:8000/detect npm run worker
```

---

## Success criteria (hackathon)

- Correctly logs entry/exit for test vehicles
- Plate query returns accurate timestamps and evidence clips
- Live demo shows low-latency eventing + searchable history
- Clear "best use of Stream" integration in architecture and demo

---

## Suggested demo script

1. Start live parking feed
2. Vehicle crosses gate line -> log ENTRY
3. Same vehicle exits later -> log EXIT
4. Ask query: "When did KA01AB1234 exit?"
5. Show timestamp, confidence, and clip

---

## Future roadmap

- Multi-camera reconciliation
- Whitelist/blacklist alerts
- Billing and slot utilization analytics
- Abandoned vehicle and unauthorized parking detection
