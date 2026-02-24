import { randomUUID } from 'node:crypto';
import { ChunkJobRecord } from '../db/repositories/chunksRepo';

export function makeChunkPlan(parentJobId: string, durationSeconds: number, chunkSizeSeconds = 300): ChunkJobRecord[] {
  const chunks: ChunkJobRecord[] = [];
  let start = 0;
  let idx = 0;

  while (start < durationSeconds) {
    const end = Math.min(start + chunkSizeSeconds, durationSeconds);
    chunks.push({
      id: `chunk_${randomUUID()}`,
      parent_job_id: parentJobId,
      chunk_index: idx,
      start_second: start,
      end_second: end,
      status: 'queued',
      progress: 0
    });
    start = end;
    idx += 1;
  }

  return chunks;
}
