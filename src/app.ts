import Fastify from 'fastify';
import { logger } from './config/logger';
import { env } from './config/env';
import { registerHealthRoutes } from './routes/health';
import { registerSearchRoutes } from './routes/search';
import { registerJobsRoutes } from './routes/jobs';
import { registerEventRoutes } from './routes/events';
import { registerDashboardRoutes } from './routes/dashboard';

export function buildApp() {
  const app = Fastify({ logger });

  app.get('/', async () => ({
    service: 'parksentry-api',
    status: 'ok',
    env: env.NODE_ENV
  }));

  registerHealthRoutes(app);
  registerSearchRoutes(app);
  registerJobsRoutes(app);
  registerEventRoutes(app);
  registerDashboardRoutes(app);

  return app;
}
