import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getJobById } from '../db/repositories/jobsRepo';
import { createProcessingJob } from '../db/repositories/createJobRepo';
import { withDbFallback } from '../lib/dbFallback';
import { mockJob } from '../domain/mockData';

const UploadBody = z.object({
  cameraId: z.string().min(2),
  sourceName: z.string().min(2),
  durationSeconds: z.number().int().positive().max(24 * 60 * 60).optional()
});

export function registerJobsRoutes(app: FastifyInstance) {
  app.post('/api/videos/upload', async (request, reply) => {
    const parsed = UploadBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid upload payload', details: parsed.error.flatten() });
    }

    const job = await withDbFallback(
      () =>
        createProcessingJob('upload_received', {
          cameraId: parsed.data.cameraId,
          sourceName: parsed.data.sourceName
        }),
      () => mockJob
    );

    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      stage: job.stage,
      meta: parsed.data,
      note: 'Upload storage/chunking worker will be wired in next phase'
    };
  });

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
