import { randomUUID } from 'node:crypto';
import { db } from '../client';

export async function writeAuditLog(input: {
  eventType: string;
  actor?: string;
  requestId?: string;
  payload?: unknown;
}) {
  await db.query(
    `INSERT INTO audit_logs (id, event_type, actor, request_id, payload) VALUES ($1,$2,$3,$4,$5::jsonb)`,
    [
      `audit_${randomUUID()}`,
      input.eventType,
      input.actor ?? null,
      input.requestId ?? null,
      JSON.stringify(input.payload ?? {})
    ]
  );
}
