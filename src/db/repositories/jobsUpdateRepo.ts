import { db } from '../client';

export async function updateJobProgress(params: {
  id: string;
  status?: string;
  progress?: number;
  stage?: string;
}) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (params.status !== undefined) {
    values.push(params.status);
    fields.push(`status = $${values.length}`);
  }

  if (params.progress !== undefined) {
    values.push(params.progress);
    fields.push(`progress = $${values.length}`);
  }

  if (params.stage !== undefined) {
    values.push(params.stage);
    fields.push(`stage = $${values.length}`);
  }

  values.push(params.id);
  fields.push(`updated_at = NOW()`);

  await db.query(
    `UPDATE processing_jobs SET ${fields.join(', ')} WHERE id = $${values.length}`,
    values
  );
}
