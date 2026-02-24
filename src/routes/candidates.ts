import { FastifyInstance } from 'fastify';
import { listCandidatesByJob } from '../db/repositories/candidatesRepo';
import { requireRole } from '../plugins/rbac';

export function registerCandidateRoutes(app: FastifyInstance) {
  app.get('/api/jobs/:jobId/candidates', { preHandler: requireRole('operator') }, async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) return reply.status(400).send({ error: 'jobId is required' });

    const items = await listCandidatesByJob(jobId);
    return {
      jobId,
      total: items.length,
      candidates: items
    };
  });
}
