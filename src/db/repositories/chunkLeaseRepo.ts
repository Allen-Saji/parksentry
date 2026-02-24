import { db } from '../client';

export interface LeasedChunk {
  id: string;
  parent_job_id: string;
  chunk_index: number;
  start_second: number;
  end_second: number;
  attempts: number;
}

export async function leaseNextChunk(): Promise<LeasedChunk | null> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const pick = await client.query<LeasedChunk>(
      `
      SELECT id, parent_job_id, chunk_index, start_second, end_second, attempts
      FROM chunk_jobs
      WHERE status IN ('queued', 'retry')
      ORDER BY created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
      `
    );

    const row = pick.rows[0];
    if (!row) {
      await client.query('COMMIT');
      return null;
    }

    await client.query(
      `
      UPDATE chunk_jobs
      SET status = 'processing', attempts = attempts + 1, processing_started_at = NOW(), updated_at = NOW()
      WHERE id = $1
      `,
      [row.id]
    );

    await client.query('COMMIT');
    return row;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function markChunkCompleted(id: string) {
  await db.query(
    `UPDATE chunk_jobs SET status = 'completed', progress = 100, completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [id]
  );
}

export async function markChunkFailed(id: string, error: string, maxAttempts = 3) {
  const res = await db.query<{ attempts: number }>(`SELECT attempts FROM chunk_jobs WHERE id = $1`, [id]);
  const attempts = res.rows[0]?.attempts ?? 0;
  const nextStatus = attempts >= maxAttempts ? 'failed' : 'retry';

  await db.query(
    `UPDATE chunk_jobs SET status = $1, last_error = $2, updated_at = NOW() WHERE id = $3`,
    [nextStatus, error.slice(0, 2000), id]
  );
}
