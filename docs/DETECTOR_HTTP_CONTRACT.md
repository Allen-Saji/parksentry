# Detector HTTP Contract (ParkSentry)

This defines the request/response contract for `DETECTOR_MODE=http` used by:
- `src/services/vision/detector.ts`

## Endpoint

- **Method:** `POST`
- **Path:** configurable (example: `/detect`)
- **Content-Type:** `application/json`

Configure in API/worker env:

```env
DETECTOR_MODE=http
DETECTOR_HTTP_ENDPOINT=http://localhost:8000/detect
DETECTOR_FALLBACK_MOCK=true
DETECTOR_SAMPLE_EVERY=6
DETECTOR_MAX_FRAMES=100
```

---

## Request Body

```json
{
  "jobId": "job_123",
  "chunkId": "chunk_abc",
  "frameDir": "/abs/path/to/frames",
  "sampleEvery": 6,
  "maxFrames": 100
}
```

### Fields
- `jobId` (string, required)
- `chunkId` (string, required)
- `frameDir` (string, required): local path containing extracted `*.jpg` frames
- `sampleEvery` (number, optional): detector sampling stride hint
- `maxFrames` (number, optional): detector cap hint

---

## Success Response (200)

```json
{
  "detections": [
    {
      "framePath": "/abs/path/to/frames/frame_000012.jpg",
      "detectedClass": "car",
      "confidence": 0.93,
      "bbox": { "x": 102, "y": 74, "w": 190, "h": 120 }
    }
  ]
}
```

### Detection fields
- `framePath` (string, required)
- `detectedClass` (string, required) — expected values currently used: `car`, `motorbike`
- `confidence` (number, required) — 0 to 1
- `bbox` (object, required)
  - `x`, `y`, `w`, `h` (numbers)

---

## Error Response

Any non-2xx status is treated as failure by ParkSentry. Example:

```json
{
  "error": "detector unavailable"
}
```

When `DETECTOR_FALLBACK_MOCK=true`, ParkSentry falls back to mock detector automatically.
When `DETECTOR_FALLBACK_MOCK=false`, chunk processing fails (expected for strict mode).

---

## Local Quick Test

Run the included Python stub detector:

```bash
npm run detector:stub
```

Then run ParkSentry worker with:

```bash
DETECTOR_MODE=http \
DETECTOR_HTTP_ENDPOINT=http://localhost:8000/detect \
npm run worker
```

---

## Contract Compatibility Notes

- Keep response shape stable (`detections[]`) to avoid worker breakage.
- Extra fields are allowed and ignored by current adapter.
- Recommended future extension:
  - `trackId` for MOT
  - `plate` + `plateConfidence` for early ANPR fusion
  - per-frame metadata (`ts`, `cameraId`)
