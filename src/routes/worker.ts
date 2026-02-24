import { FastifyInstance } from 'fastify';
import { processNextChunk } from '../domain/workerProgress';
import { requireRole } from '../plugins/rbac';

export function registerWorkerRoutes(app: FastifyInstance) {
  app.post('/api/dev/jobs/:jobId/process-next', { preHandler: requireRole('worker') }, async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) return reply.status(400).send({ error: 'jobId is required' });

    const result = await processNextChunk(jobId);
    if (result.done) {
      return { jobId, ...result };
    }

    return {
      jobId,
      chunkId: result.chunkId,
      chunkProgress: result.chunkProgress,
      done: result.summary.done,
      total: result.summary.total,
      overall: result.summary.overall
    };
  });
}
