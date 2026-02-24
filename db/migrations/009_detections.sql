CREATE TABLE IF NOT EXISTS detections (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  candidate_id TEXT,
  frame_path TEXT NOT NULL,
  detected_class TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  bbox_x NUMERIC NOT NULL,
  bbox_y NUMERIC NOT NULL,
  bbox_w NUMERIC NOT NULL,
  bbox_h NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_detections_job ON detections(job_id);
CREATE INDEX IF NOT EXISTS idx_detections_chunk ON detections(chunk_id);
