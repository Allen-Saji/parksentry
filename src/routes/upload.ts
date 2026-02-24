import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { createProcessingJob } from '../db/repositories/createJobRepo';
import { createChunkJobs } from '../db/repositories/chunksRepo';
import { updateJobProgress } from '../db/repositories/jobsUpdateRepo';
import { makeChunkPlan } from '../domain/chunking';
import { withDbFallback } from '../lib/dbFallback';
import { mockJob } from '../domain/mockData';

const UploadBody = z.object({
  cameraId: z.string().min(2),
  sourceName: z.string().min(2),
  durationSeconds: z.number().int().positive().max(24 * 60 * 60)
});

export function registerUploadRoutes(app: FastifyInstance) {
  app.post('/api/videos/upload', async (request, reply) => {
    const parsed = UploadBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid upload payload', details: parsed.error.flatten() });
    }

    const meta = parsed.data;
    const job = await withDbFallback(
      () =>
        createProcessingJob('upload_received', {
          cameraId: meta.cameraId,
          sourceName: meta.sourceName
        }),
      () => ({ ...mockJob, id: `job_${randomUUID()}` })
    );

    const chunks = makeChunkPlan(job.id, meta.durationSeconds, 300);

    await withDbFallback(
      async () => {
        await createChunkJobs(chunks);
        await updateJobProgress({ id: job.id, stage: 'chunked', status: 'queued', progress: 5 });
        return true;
      },
      () => true
    );

    return {
      jobId: job.id,
      status: 'queued',
      stage: 'chunked',
      progress: 5,
      chunks: chunks.length,
      meta,
      note: 'Chunk jobs queued for worker processing'
    };
  });
}
