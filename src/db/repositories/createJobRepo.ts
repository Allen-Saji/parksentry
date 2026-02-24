import { db } from '../client';
import { randomUUID } from 'node:crypto';

export interface CreatedJob {
  id: string;
  status: string;
  progress: number;
  stage: string;
}

export async function createProcessingJob(stage = 'uploaded'): Promise<CreatedJob> {
  const id = `job_${randomUUID()}`;
  const status = 'queued';
  const progress = 0;

  const res = await db.query<CreatedJob>(
    `
    INSERT INTO processing_jobs (id, status, progress, stage)
    VALUES ($1, $2, $3, $4)
    RETURNING id, status, progress, stage
    `,
    [id, status, progress, stage]
  );

  return res.rows[0];
}
