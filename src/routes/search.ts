import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parseSearchQuery } from '../domain/queryParser';
import { searchEventsRepo } from '../db/repositories/eventsRepo';

const SearchBody = z.object({
  query: z.string().min(2)
});

export function registerSearchRoutes(app: FastifyInstance) {
  app.post('/api/search', async (request, reply) => {
    const parsed = SearchBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query payload' });
    }

    const query = parsed.data.query;
    const intent = parseSearchQuery(query);

    const hits = await searchEventsRepo({
      plate: intent.plate,
      direction: intent.direction ?? 'any'
    });

    return {
      query,
      parsedIntent: intent,
      hits,
      note: 'Backed by PostgreSQL events table'
    };
  });
}
