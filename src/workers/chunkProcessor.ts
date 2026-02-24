import { leaseNextChunk, markChunkCompleted, markChunkFailed } from '../db/repositories/chunkLeaseRepo';
import { refreshParentJobProgress } from '../db/repositories/jobAggregateRepo';
import { logger } from '../config/logger';

async function processChunkSimulation(chunkId: string) {
  await new Promise((r) => setTimeout(r, 500));
  return { chunkId };
}

export async function processOneChunk() {
  const leased = await leaseNextChunk();
  if (!leased) return { worked: false };

  try {
    await processChunkSimulation(leased.id);
    await markChunkCompleted(leased.id);
    const parent = await refreshParentJobProgress(leased.parent_job_id);

    return {
      worked: true,
      jobId: leased.parent_job_id,
      chunkId: leased.id,
      parent
    };
  } catch (error) {
    await markChunkFailed(leased.id, error instanceof Error ? error.message : 'unknown error');
    await refreshParentJobProgress(leased.parent_job_id);
    throw error;
  }
}

export async function runWorkerLoop(pollMs = 1000) {
  logger.info({ pollMs }, 'chunk worker loop started');
  while (true) {
    try {
      const result = await processOneChunk();
      if (!result.worked) {
        await new Promise((r) => setTimeout(r, pollMs));
      } else {
        logger.info(result, 'processed chunk');
      }
    } catch (error) {
      logger.error({ err: error }, 'chunk processing failed');
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }
}
