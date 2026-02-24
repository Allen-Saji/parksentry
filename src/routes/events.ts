import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { searchEventsRepo } from '../db/repositories/eventsRepo';
import { withDbFallback } from '../lib/dbFallback';
import { mockEvents } from '../domain/mockData';

const QuerySchema = z.object({
  plate: z.string().optional(),
  direction: z.enum(['entry', 'exit', 'any']).default('any')
});

export function registerEventRoutes(app: FastifyInstance) {
  app.get('/api/events', async (request, reply) => {
    const parsed = QuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query params' });
    }

    const rows = await withDbFallback(
      () => searchEventsRepo(parsed.data),
      () => mockEvents
    );

    return {
      count: rows.length,
      events: rows
    };
  });
}
