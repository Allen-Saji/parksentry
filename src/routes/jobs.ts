import { FastifyInstance } from 'fastify';
import { getJobById } from '../db/repositories/jobsRepo';
import { withDbFallback } from '../lib/dbFallback';
import { mockJob } from '../domain/mockData';

export function registerJobsRoutes(app: FastifyInstance) {
  app.get('/api/jobs/:jobId/status', async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;

    if (!jobId) {
      return reply.status(400).send({ error: 'jobId is required' });
    }

    const job = await withDbFallback(
      () => getJobById(jobId),
      () => mockJob
    );
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });
}
