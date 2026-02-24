import { FastifyInstance } from 'fastify';
import { getJobById } from '../db/repositories/jobsRepo';
import { createProcessingJob } from '../db/repositories/createJobRepo';

export function registerJobsRoutes(app: FastifyInstance) {
  app.post('/api/videos/upload', async () => {
    const job = await createProcessingJob('upload_received');

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      stage: job.stage,
      note: 'Upload storage/chunking worker will be wired in next phase'
    };
  });

  app.get('/api/jobs/:jobId/status', async (request, reply) => {
    const jobId = (request.params as { jobId?: string }).jobId;

    if (!jobId) {
      return reply.status(400).send({ error: 'jobId is required' });
    }

    const job = await getJobById(jobId);
    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return job;
  });
}
