import { logger } from '../config/logger';

export async function withDbFallback<T>(run: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    logger.warn({ err: error }, 'DB unavailable, using fallback response');
    return fallback();
  }
}
