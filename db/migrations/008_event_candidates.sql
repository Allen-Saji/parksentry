CREATE TABLE IF NOT EXISTS event_candidates (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  candidate_type TEXT NOT NULL,
  event_time TIMESTAMPTZ,
  confidence NUMERIC,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_candidates_job ON event_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_event_candidates_chunk ON event_candidates(chunk_id);
