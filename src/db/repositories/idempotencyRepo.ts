import { db } from '../client';

export interface IdempotencyRecord {
  key: string;
  endpoint: string;
  request_hash: string;
  response_json: unknown;
  status_code: number;
}

export async function getIdempotency(key: string): Promise<IdempotencyRecord | null> {
  const res = await db.query<IdempotencyRecord>(
    `SELECT key, endpoint, request_hash, response_json, status_code FROM idempotency_keys WHERE key = $1 LIMIT 1`,
    [key]
  );
  return res.rows[0] ?? null;
}

export async function saveIdempotency(record: IdempotencyRecord): Promise<void> {
  await db.query(
    `
    INSERT INTO idempotency_keys (key, endpoint, request_hash, response_json, status_code)
    VALUES ($1, $2, $3, $4::jsonb, $5)
    ON CONFLICT (key) DO NOTHING
    `,
    [record.key, record.endpoint, record.request_hash, JSON.stringify(record.response_json), record.status_code]
  );
}
