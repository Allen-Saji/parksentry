import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createHash, randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { createAsset } from '../db/repositories/assetsRepo';
import { createProcessingJob } from '../db/repositories/createJobRepo';
import { createChunkJobs } from '../db/repositories/chunksRepo';
import { makeChunkPlan } from '../domain/chunking';
import { updateJobProgress } from '../db/repositories/jobsUpdateRepo';
import { UPLOAD_ROOT } from '../config/paths';
import { writeAuditLog } from '../db/repositories/auditRepo';
import { withDbFallback } from '../lib/dbFallback';

export function registerUploadFileRoutes(app: FastifyInstance) {
  app.post('/api/videos/upload-file', async (request, reply) => {
    const mp = await request.file();
    if (!mp) return reply.status(400).send({ error: 'multipart file is required (field: file)' });

    const cameraIdField = mp.fields.cameraId;
    const durationField = mp.fields.durationSeconds;
    const cameraId =
      cameraIdField && !Array.isArray(cameraIdField) && 'value' in cameraIdField
        ? String(cameraIdField.value)
        : 'cam_gate_1';
    const durationSeconds =
      durationField && !Array.isArray(durationField) && 'value' in durationField
        ? Number(durationField.value)
        : 0;
    if (!durationSeconds || durationSeconds <= 0) {
      return reply.status(400).send({ error: 'durationSeconds is required and must be > 0' });
    }

    const assetId = `asset_${randomUUID()}`;
    const subdir = path.join(UPLOAD_ROOT, cameraId);
    await fs.mkdir(subdir, { recursive: true });

    const filename = `${Date.now()}_${mp.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = path.join(subdir, filename);

    const hash = createHash('sha256');
    let size = 0;
    const out = createWriteStream(storagePath);
    mp.file.on('data', (chunk: Buffer) => {
      size += chunk.length;
      hash.update(chunk);
    });

    await pipeline(mp.file, out);

    const checksumSha256 = hash.digest('hex');

    await createAsset({
      id: assetId,
      cameraId,
      sourceName: mp.filename,
      storagePath,
      mimeType: mp.mimetype,
      sizeBytes: size,
      durationSeconds,
      checksumSha256
    });

    const job = await createProcessingJob('upload_received', { cameraId, sourceName: mp.filename });
    const chunks = makeChunkPlan(job.id, durationSeconds, 300);
    await createChunkJobs(chunks);
    await updateJobProgress({ id: job.id, stage: 'chunked', status: 'queued', progress: 5 });

    await withDbFallback(
      () =>
        writeAuditLog({
          eventType: 'video_file_uploaded',
          actor: 'api',
          requestId: request.id,
          payload: { assetId, jobId: job.id, cameraId, chunks: chunks.length, sizeBytes: size }
        }),
      () => undefined
    );

    return {
      assetId,
      jobId: job.id,
      chunks: chunks.length,
      sizeBytes: size,
      mimeType: mp.mimetype,
      checksumSha256
    };
  });
}
