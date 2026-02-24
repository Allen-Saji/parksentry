import { randomUUID } from 'node:crypto';
import { db } from '../client';

export interface CandidateInput {
  jobId: string;
  chunkId: string;
  candidateType: string;
  eventTime?: string;
  confidence?: number;
  payload: unknown;
}

export async function insertCandidates(candidates: CandidateInput[]) {
  if (!candidates.length) return;

  const values: unknown[] = [];
  const tuples: string[] = [];

  candidates.forEach((c, i) => {
    const base = i * 7;
    tuples.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}::jsonb)`);
    values.push(
      `cand_${randomUUID()}`,
      c.jobId,
      c.chunkId,
      c.candidateType,
      c.eventTime ?? null,
      c.confidence ?? null,
      JSON.stringify(c.payload ?? {})
    );
  });

  await db.query(
    `INSERT INTO event_candidates (id, job_id, chunk_id, candidate_type, event_time, confidence, payload) VALUES ${tuples.join(', ')}`,
    values
  );
}

export async function listCandidatesByJob(jobId: string) {
  const res = await db.query(
    `
    SELECT id, job_id, chunk_id, candidate_type, event_time, confidence, payload, created_at
    FROM event_candidates
    WHERE job_id = $1
    ORDER BY created_at DESC
    LIMIT 500
    `,
    [jobId]
  );
  return res.rows;
}
