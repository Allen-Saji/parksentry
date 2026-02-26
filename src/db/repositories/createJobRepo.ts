import { db } from '../client';
import { randomUUID } from 'node:crypto';

export interface CreatedJob {
  id: string;
  status: string;
  progress: number;
  stage: string;
}

export async function createProcessingJob(
  stage = 'uploaded',
  meta?: { cameraId?: string; sourceName?: string }
): Promise<CreatedJob> {
  const id = `job_${randomUUID()}`;
  const status = 'queued';
  const progress = 0;

  const res = await db.query<CreatedJob>(
    `
    INSERT INTO processing_jobs (id, status, progress, stage, camera_id, source_name)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, status, progress, stage
    `,
    [id, status, progress, stage, meta?.cameraId ?? null, meta?.sourceName ?? null]
  );

  return res.rows[0];
}
