import { FastifyInstance } from 'fastify';
import { listEntryExitEventsByJob } from '../db/repositories/entryExitRepo';
import { requireRole } from '../plugins/rbac';

export function registerEntryExitRoutes(app: FastifyInstance) {
  app.get('/api/jobs/:jobId/entry-exit-events', { preHandler: requireRole('operator') }, async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) return reply.status(400).send({ error: 'jobId is required' });

    const events = await listEntryExitEventsByJob(jobId);
    return {
      jobId,
      total: events.length,
      events
    };
  });
}
