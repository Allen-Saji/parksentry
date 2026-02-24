import { FastifyInstance } from 'fastify';
import { listChunksByJob } from '../db/repositories/chunkReadRepo';

export function registerChunkRoutes(app: FastifyInstance) {
  app.get('/api/jobs/:jobId/chunks', async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) return reply.status(400).send({ error: 'jobId is required' });

    const chunks = await listChunksByJob(jobId);
    return {
      jobId,
      total: chunks.length,
      chunks
    };
  });
}
