import { FastifyInstance } from 'fastify';
import { searchEventsRepo } from '../db/repositories/eventsRepo';
import { withDbFallback } from '../lib/dbFallback';
import { mockEvents } from '../domain/mockData';

export function registerDashboardRoutes(app: FastifyInstance) {
  app.get('/api/dashboard/summary', async () => {
    const events = await withDbFallback(
      () => searchEventsRepo({ direction: 'any' }),
      () => mockEvents
    );

    const entries = events.filter((e) => e.event_type === 'entry').length;
    const exits = events.filter((e) => e.event_type === 'exit').length;

    return {
      totalEvents: events.length,
      entries,
      exits,
      currentlyInside: Math.max(entries - exits, 0)
    };
  });
}
