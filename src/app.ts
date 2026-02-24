import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { UPLOAD_ROOT } from './config/paths';
import { logger } from './config/logger';
import { env } from './config/env';
import { registerHealthRoutes } from './routes/health';
import { registerSearchRoutes } from './routes/search';
import { registerJobsRoutes } from './routes/jobs';
import { registerEventRoutes } from './routes/events';
import { registerDashboardRoutes } from './routes/dashboard';
import { registerUploadRoutes } from './routes/upload';
import { registerUploadFileRoutes } from './routes/uploadFile';
import { registerWorkerRoutes } from './routes/worker';
import { registerChunkRoutes } from './routes/chunks';

export function buildApp() {
  const app = Fastify({ logger });

  app.register(multipart, {
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB
  });

  app.register(fastifyStatic, {
    root: UPLOAD_ROOT,
    prefix: '/files/'
  });

  app.get('/', async () => ({
    service: 'parksentry-api',
    status: 'ok',
    env: env.NODE_ENV
  }));

  registerHealthRoutes(app);
  registerSearchRoutes(app);
  registerUploadRoutes(app);
  registerUploadFileRoutes(app);
  registerJobsRoutes(app);
  registerChunkRoutes(app);
  registerEventRoutes(app);
  registerDashboardRoutes(app);
  registerWorkerRoutes(app);

  return app;
}
