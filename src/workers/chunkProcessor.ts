import { leaseNextChunk, markChunkCompleted, markChunkFailed } from '../db/repositories/chunkLeaseRepo';
import { refreshParentJobProgress } from '../db/repositories/jobAggregateRepo';
import { logger } from '../config/logger';
import { getJobById } from '../db/repositories/jobsRepo';
import { findAssetPathBySource } from '../db/repositories/assetsQueryRepo';
import { runChunkFrameExtraction } from '../services/media/chunkRunner';
import { buildChunkCandidates } from '../services/vision/frameCandidateExtractor';
import { insertCandidates } from '../db/repositories/candidatesRepo';
import { detectVehiclesFromChunkFrames } from '../services/vision/detector';
import { insertDetections } from '../db/repositories/detectionsRepo';
import { inferEntryExitEvents } from '../services/vision/entryExitInference';
import { insertEntryExitEvents } from '../db/repositories/entryExitRepo';

export async function processOneChunk() {
  const leased = await leaseNextChunk();
  if (!leased) return { worked: false };

  try {
    const job = await getJobById(leased.parent_job_id);
    if (!job) {
      throw new Error(`Parent job not found: ${leased.parent_job_id}`);
    }

    const inputPath = await findAssetPathBySource({
      cameraId: job.camera_id,
      sourceName: job.source_name
    });

    if (!inputPath) {
      throw new Error(`No uploaded asset found for job ${leased.parent_job_id}`);
    }

    const fps = 2;
    const extraction = await runChunkFrameExtraction({
      inputPath,
      jobId: leased.parent_job_id,
      chunkId: leased.id,
      startSecond: leased.start_second,
      endSecond: leased.end_second,
      fps
    });

    const candidates = await buildChunkCandidates({
      jobId: leased.parent_job_id,
      chunkId: leased.id,
      chunkStartSecond: leased.start_second,
      outputDir: extraction.outputDir,
      fps
    });
    await insertCandidates(candidates);

    const detections = await detectVehiclesFromChunkFrames({
      jobId: leased.parent_job_id,
      chunkId: leased.id,
      frameDir: extraction.outputDir
    });
    await insertDetections(detections);

    const entryExitEvents = inferEntryExitEvents({
      jobId: leased.parent_job_id,
      chunkId: leased.id,
      detections,
      chunkStartSecond: leased.start_second,
      fps
    });
    await insertEntryExitEvents(entryExitEvents);

    await markChunkCompleted(leased.id);
    const parent = await refreshParentJobProgress(leased.parent_job_id);

    return {
      worked: true,
      jobId: leased.parent_job_id,
      chunkId: leased.id,
      framesExtracted: extraction.framesExtracted,
      candidatesCreated: candidates.length,
      detectionsCreated: detections.length,
      entryExitEventsCreated: entryExitEvents.length,
      outputDir: extraction.outputDir,
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
