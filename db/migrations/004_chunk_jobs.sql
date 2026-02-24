CREATE TABLE IF NOT EXISTS chunk_jobs (
  id TEXT PRIMARY KEY,
  parent_job_id TEXT NOT NULL,
  chunk_index INT NOT NULL,
  start_second INT NOT NULL,
  end_second INT NOT NULL,
  status TEXT NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);