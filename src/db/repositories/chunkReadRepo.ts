import { db } from '../client';

export interface ChunkRow {
  id: string;
  parent_job_id: string;
  chunk_index: number;
  start_second: number;
  end_second: number;
  status: string;
  progress: number;
}

export async function listChunksByJob(jobId: string): Promise<ChunkRow[]> {
  const res = await db.query<ChunkRow>(
    `
    SELECT id, parent_job_id, chunk_index, start_second, end_second, status, progress
    FROM chunk_jobs
    WHERE parent_job_id = $1
    ORDER BY chunk_index ASC
    `,
    [jobId]
  );
  return res.rows;
}

export async function getNextPendingChunk(jobId: string): Promise<ChunkRow | null> {
  const res = await db.query<ChunkRow>(
    `
    SELECT id, parent_job_id, chunk_index, start_second, end_second, status, progress
    FROM chunk_jobs
    WHERE parent_job_id = $1 AND status != 'completed'
    ORDER BY chunk_index ASC
    LIMIT 1
    `,
    [jobId]
  );
  return res.rows[0] ?? null;
}
