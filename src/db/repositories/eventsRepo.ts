import { db } from '../client';

export interface EventRecord {
  id: string;
  plate_text: string | null;
  event_type: 'entry' | 'exit';
  event_time: string;
  confidence: number | null;
  snapshot_url: string | null;
}

export async function searchEventsRepo(params: {
  plate?: string;
  direction?: 'entry' | 'exit' | 'any';
}) {
  const direction = params.direction ?? 'any';
  const values: unknown[] = [];
  const where: string[] = [];

  if (params.plate) {
    values.push(params.plate);
    where.push(`plate_text = $${values.length}`);
  }

  if (direction !== 'any') {
    values.push(direction);
    where.push(`event_type = $${values.length}`);
  }

  const sql = `
    SELECT id, plate_text, event_type, event_time::text, confidence, snapshot_url
    FROM events
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY event_time DESC
    LIMIT 100
  `;

  const res = await db.query<EventRecord>(sql, values);
  return res.rows;
}
