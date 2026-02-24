import { db } from '../client';

export interface JobRecord {
  id: string;
  status: string;
  progress: number;
  stage: string | null;
}

export async function getJobById(id: string): Promise<JobRecord | null> {
  const res = await db.query<JobRecord>(
    `SELECT id, status, progress, stage FROM processing_jobs WHERE id = $1 LIMIT 1`,
    [id]
  );
  return res.rows[0] ?? null;
}
