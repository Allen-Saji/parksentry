import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { API_KEYS, AUTH_ENABLED } from '../config/security';

const PUBLIC_PATHS = new Set(['/health', '/ready', '/']);

function extractApiKey(req: FastifyRequest): string | null {
  const header = req.headers['x-api-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }

  return null;
}

export async function authHook(request: FastifyRequest, reply: FastifyReply) {
  if (!AUTH_ENABLED) return;
  const path = request.url.split('?')[0];
  if (PUBLIC_PATHS.has(path)) return;

  const key = extractApiKey(request);
  if (!key || !API_KEYS.includes(key)) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function registerAuth(app: FastifyInstance) {
  app.addHook('onRequest', authHook);
}
