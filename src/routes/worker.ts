import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { updateJobProgress } from '../db/repositories/jobsUpdateRepo';

export function registerWorkerRoutes(app: FastifyInstance) {
  app.post('/api/dev/jobs/:jobId/process-next', async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) return reply.status(400).send({ error: 'jobId is required' });

    const chunkRes = await db.query<{
      id: string;
      progress: number;
      status: string;
    }>(
      `
      SELECT id, progress, status
      FROM chunk_jobs
      WHERE parent_job_id = $1 AND status != 'completed'
      ORDER BY chunk_index ASC
      LIMIT 1
      `,
      [jobId]
    );

    const chunk = chunkRes.rows[0];
    if (!chunk) {
      await updateJobProgress({ id: jobId, progress: 100, stage: 'completed', status: 'completed' });
      return { jobId, done: true, message: 'All chunks already completed' };
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
      jobId,
      chunkId: chunk.id,
      chunkProgress: nextProgress,
      done,
      total,
      overall
    };
  });
}
