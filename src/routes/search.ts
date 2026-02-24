import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const SearchBody = z.object({
  query: z.string().min(2)
});

export function registerSearchRoutes(app: FastifyInstance) {
  app.post('/api/search', async (request, reply) => {
    const parsed = SearchBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid query payload' });
    }

    return {
      query: parsed.data.query,
      parsedIntent: 'unknown',
      hits: [],
      note: 'Search parser and event store integration pending'
    };
  });
}
