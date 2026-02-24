import { db } from '../db/client';
import { getNextPendingChunk } from '../db/repositories/chunkReadRepo';
import { updateJobProgress } from '../db/repositories/jobsUpdateRepo';

export type ProcessNextResult =
  | { done: true; message: string }
  | { done: false; chunkId: string; chunkProgress: number; summary: { done: number; total: number; overall: number } };

export async function processNextChunk(jobId: string): Promise<ProcessNextResult> {
  const chunk = await getNextPendingChunk(jobId);

  if (!chunk) {
    await updateJobProgress({ id: jobId, progress: 100, stage: 'completed', status: 'completed' });
    return { done: true, message: 'All chunks already completed' };
  }

  const nextProgress = Math.min(Number(chunk.progress) + 50, 100);
  const nextStatus = nextProgress >= 100 ? 'completed' : 'processing';

  await db.query(
    `UPDATE chunk_jobs SET progress = $1, status = $2, updated_at = NOW() WHERE id = $3`,
    [nextProgress, nextStatus, chunk.id]
  );

  const agg = await db.query<{ done: number; total: number }>(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed')::int AS done,
      COUNT(*)::int AS total
    FROM chunk_jobs
    WHERE parent_job_id = $1
    `,
    [jobId]
  );

  const done = agg.rows[0]?.done ?? 0;
  const total = agg.rows[0]?.total ?? 0;
  const overall = total ? Math.round((done / total) * 100) : 0;

  await updateJobProgress({
    id: jobId,
    progress: overall,
    stage: overall >= 100 ? 'completed' : 'processing_chunks',
    status: overall >= 100 ? 'completed' : 'processing'
  });

  return {
    done: false,
    chunkId: chunk.id,
    chunkProgress: nextProgress,
    summary: { done, total, overall }
  };
}
