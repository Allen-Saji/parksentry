import { FastifyInstance } from 'fastify';

export function registerHealthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));
  app.get('/ready', async () => ({ ready: true }));
}
