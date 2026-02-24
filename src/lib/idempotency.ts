import { createHash } from 'node:crypto';
import { FastifyRequest } from 'fastify';

export function getIdempotencyKey(req: FastifyRequest): string | null {
  const header = req.headers['idempotency-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();
  return null;
}

export function hashRequestBody(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body ?? {})).digest('hex');
}
