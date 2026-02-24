import { db } from '../client';

export interface ChunkJobRecord {
  id: string;
  parent_job_id: string;
  chunk_index: number;
  start_second: number;
  end_second: number;
  status: string;
  progress: number;
}

export async function ensureChunkJobsTable() {
  await db.query(`
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
    )
  `);
}

export async function createChunkJobs(rows: ChunkJobRecord[]) {
  if (!rows.length) return;

  const values: unknown[] = [];
  const tuples: string[] = [];

  rows.forEach((r, i) => {
    const base = i * 7;
    tuples.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`);
    values.push(r.id, r.parent_job_id, r.chunk_index, r.start_second, r.end_second, r.status, r.progress);
  });

  await db.query(
    `INSERT INTO chunk_jobs (id, parent_job_id, chunk_index, start_second, end_second, status, progress)
     VALUES ${tuples.join(', ')}
     ON CONFLICT (id) DO NOTHING`,
    values
  );
}
