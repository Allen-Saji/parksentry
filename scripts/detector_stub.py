#!/usr/bin/env python3
"""
Minimal HTTP detector stub for ParkSentry.

- Endpoint: POST /detect
- Reads frameDir, returns synthetic detections over sampled JPG files
- No third-party dependencies (stdlib only)
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any

HOST = os.getenv("DETECTOR_STUB_HOST", "0.0.0.0")
PORT = int(os.getenv("DETECTOR_STUB_PORT", "8000"))


def seeded_confidence(name: str) -> float:
    h = 0
    for ch in name:
        h = (h * 31 + ord(ch)) % 1000
    return round(0.5 + (h / 1000) * 0.49, 3)


class Handler(BaseHTTPRequestHandler):
    def _json(self, code: int, payload: dict[str, Any]) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def log_message(self, format: str, *args: Any) -> None:
        # keep logs clean but visible
        print("[detector-stub]", format % args)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/detect":
            self._json(404, {"error": "not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(content_length).decode("utf-8")
            payload = json.loads(body) if body else {}

            frame_dir = Path(payload.get("frameDir", ""))
            sample_every = max(1, int(payload.get("sampleEvery", 6)))
            max_frames = max(1, int(payload.get("maxFrames", 100)))

            if not frame_dir.exists() or not frame_dir.is_dir():
                self._json(400, {"error": f"invalid frameDir: {frame_dir}"})
                return

            files = sorted([f for f in frame_dir.iterdir() if f.suffix.lower() == ".jpg"])
            sampled = files[::sample_every][:max_frames]

            detections = []
            for i, f in enumerate(sampled):
                detections.append(
                    {
                        "framePath": str(f.resolve()),
                        "detectedClass": "motorbike" if i % 3 == 0 else "car",
                        "confidence": seeded_confidence(f.name),
                        "bbox": {
                            "x": (i * 13) % 300,
                            "y": (i * 7) % 180,
                            "w": 120,
                            "h": 70,
                        },
                    }
                )

            self._json(200, {"detections": detections})
        except Exception as exc:  # pragma: no cover
            self._json(500, {"error": str(exc)})


def main() -> None:
    server = HTTPServer((HOST, PORT), Handler)
    print(f"[detector-stub] listening on http://{HOST}:{PORT}")
    print("[detector-stub] POST /detect")
    server.serve_forever()


if __name__ == "__main__":
    main()
