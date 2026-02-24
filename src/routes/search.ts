import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { parseSearchQuery } from '../domain/queryParser';
import { searchEvents } from '../domain/eventStore';

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

    const hits = searchEvents(intent.plate, intent.direction ?? 'any');

    return {
      query,
      parsedIntent: intent,
      hits,
      note: 'Backed by in-memory mock store for MVP scaffold'
    };
  });
}
