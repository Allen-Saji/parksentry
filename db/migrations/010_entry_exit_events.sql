CREATE TABLE IF NOT EXISTS entry_exit_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  plate_text TEXT,
  event_type TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  confidence NUMERIC,
  evidence_frame_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entry_exit_events_job ON entry_exit_events(job_id);
CREATE INDEX IF NOT EXISTS idx_entry_exit_events_chunk ON entry_exit_events(chunk_id);
