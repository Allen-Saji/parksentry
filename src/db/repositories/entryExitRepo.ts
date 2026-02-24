import { randomUUID } from 'node:crypto';
import { db } from '../client';

export interface EntryExitEventInput {
  jobId: string;
  chunkId: string;
  eventType: 'entry' | 'exit';
  eventTime: string;
  confidence?: number;
  evidenceFramePath?: string;
  plateText?: string;
}

export async function insertEntryExitEvents(events: EntryExitEventInput[]) {
  if (!events.length) return;

  const values: unknown[] = [];
  const tuples: string[] = [];

  events.forEach((e, i) => {
    const base = i * 8;
    tuples.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8})`);
    values.push(
      `ee_${randomUUID()}`,
      e.jobId,
      e.chunkId,
      e.plateText ?? null,
      e.eventType,
      e.eventTime,
      e.confidence ?? null,
      e.evidenceFramePath ?? null
    );
  });

  await db.query(
    `INSERT INTO entry_exit_events (id, job_id, chunk_id, plate_text, event_type, event_time, confidence, evidence_frame_path)
     VALUES ${tuples.join(', ')}`,
    values
  );
}

export async function listEntryExitEventsByJob(jobId: string) {
  const res = await db.query(
    `SELECT id, job_id, chunk_id, plate_text, event_type, event_time, confidence, evidence_frame_path, created_at
     FROM entry_exit_events WHERE job_id = $1 ORDER BY event_time DESC LIMIT 1000`,
    [jobId]
  );
  return res.rows;
}
