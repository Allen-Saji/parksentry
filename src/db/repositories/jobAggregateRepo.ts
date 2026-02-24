import { db } from '../client';
import { updateJobProgress } from './jobsUpdateRepo';

export async function refreshParentJobProgress(jobId: string) {
  const agg = await db.query<{ done: number; total: number; failed: number }>(
    `
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed')::int AS done,
      COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
      COUNT(*)::int AS total
    FROM chunk_jobs
    WHERE parent_job_id = $1
    `,
    [jobId]
  );

  const done = agg.rows[0]?.done ?? 0;
  const failed = agg.rows[0]?.failed ?? 0;
  const total = agg.rows[0]?.total ?? 0;

  const progress = total ? Math.round((done / total) * 100) : 0;

  const isComplete = done === total && total > 0;
  const hasFailure = failed > 0 && !isComplete;

  await updateJobProgress({
    id: jobId,
    progress,
    stage: isComplete ? 'completed' : hasFailure ? 'processing_with_failures' : 'processing_chunks',
    status: isComplete ? 'completed' : hasFailure ? 'processing' : 'processing'
  });

  return { done, failed, total, progress, isComplete };
}
