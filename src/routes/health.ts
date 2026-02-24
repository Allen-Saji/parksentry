import { FastifyInstance } from 'fastify';
import { healthcheckDb } from '../db/client';

export function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  app.get('/ready', async (_req, reply) => {
    try {
      const dbOk = await healthcheckDb();
      if (!dbOk) return reply.status(503).send({ ready: false, db: false });
      return { ready: true, db: true };
    } catch {
      return reply.status(503).send({ ready: false, db: false });
    }
  });
}
