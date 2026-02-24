# ParkSentry API Spec (MVP)

Base URL: `http://localhost:8080`

Authentication: `x-api-key: <key>` (required for non-health endpoints when API keys are configured)

## Health

### GET `/health`
Response:
```json
{ "ok": true }
```

### GET `/ready`
Response:
```json
{ "ready": true }
```

---

## Search

### POST `/api/search`
Request:
```json
{ "query": "When did KA01AB1234 exit?" }
```
Response:
```json
{
  "query": "When did KA01AB1234 exit?",
  "parsedIntent": { "intent": "plate_lookup", "plate": "KA01AB1234", "direction": "exit" },
  "hits": []
}
```

---

## Upload Jobs

### POST `/api/videos/upload`
(JSON metadata mode)
Headers:
- `Idempotency-Key` (optional but recommended in production)
Request:
```json
{
  "cameraId": "cam_gate_1",
  "sourceName": "parking_2026_02_24.mp4",
  "durationSeconds": 7200
}
```
Response:
```json
{
  "jobId": "job_...",
  "status": "queued",
  "progress": 5,
  "stage": "chunked",
  "chunks": 24
}
```

### POST `/api/videos/upload-file`
(multipart mode)
Form fields:
- `file` (required)
- `cameraId` (required)
- `durationSeconds` (required)

Response:
```json
{
  "assetId": "asset_...",
  "jobId": "job_...",
  "chunks": 24,
  "sizeBytes": 12345678,
  "mimeType": "video/mp4",
  "checksumSha256": "..."
}
```

### GET `/api/jobs/:jobId/status`
Response:
```json
{
  "id": "job_...",
  "status": "queued",
  "progress": 5,
  "stage": "chunked"
}
```

### GET `/api/jobs/:jobId/chunks`
Response:
```json
{
  "jobId": "job_...",
  "total": 24,
  "chunks": [{ "id": "chunk_...", "chunk_index": 0, "status": "queued" }]
}
```

### POST `/api/videos/probe`
Request:
```json
{ "assetId": "asset_..." }
```
Response:
```json
{
  "assetId": "asset_...",
  "sourceName": "parking.mp4",
  "probe": { "durationSeconds": 7200, "width": 1920, "height": 1080, "fps": 30 }
}
```

---

## Events

### GET `/api/events?plate=KA01AB1234&direction=exit`
Response:
```json
{
  "count": 1,
  "events": [
    {
      "id": "evt_2",
      "plate_text": "KA01AB1234",
      "event_type": "exit",
      "event_time": "2026-02-24T14:42:00Z",
      "confidence": 0.91,
      "snapshot_url": null
    }
  ]
}
```

---

## Dev Worker Simulation

### POST `/api/dev/jobs/:jobId/process-next`
Advances one queued chunk for demo/testing and updates parent job progress.

Response:
```json
{
  "jobId": "job_...",
  "chunkId": "chunk_...",
  "chunkProgress": 100,
  "done": 7,
  "total": 24,
  "overall": 29
}
```

---

## Dashboard

### GET `/api/dashboard/summary`
Response:
```json
{
  "totalEvents": 2,
  "entries": 1,
  "exits": 1,
  "currentlyInside": 0
}
```
