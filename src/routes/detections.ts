import { FastifyInstance } from 'fastify';
import { listDetectionsByJob } from '../db/repositories/detectionsRepo';
import { requireRole } from '../plugins/rbac';

export function registerDetectionRoutes(app: FastifyInstance) {
  app.get('/api/jobs/:jobId/detections', { preHandler: requireRole('operator') }, async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;
    if (!jobId) return reply.status(400).send({ error: 'jobId is required' });

    const detections = await listDetectionsByJob(jobId);
    return {
      jobId,
      total: detections.length,
      detections
    };
  });
}
