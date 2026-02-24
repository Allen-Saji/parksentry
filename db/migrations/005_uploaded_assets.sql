CREATE TABLE IF NOT EXISTS uploaded_assets (
  id TEXT PRIMARY KEY,
  camera_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL,
  duration_seconds INT,
  checksum_sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
