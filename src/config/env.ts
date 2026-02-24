import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.string().default('info'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/parksentry'),
  REDIS_URL: z.string().default('redis://localhost:6379')
});

export const env = EnvSchema.parse(process.env);
