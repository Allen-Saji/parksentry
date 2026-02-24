CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  plate_text TEXT,
  event_type TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  confidence NUMERIC,
  snapshot_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processing_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  progress NUMERIC NOT NULL DEFAULT 0,
  stage TEXT,
  camera_id TEXT,
  source_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cameras (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  line_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
