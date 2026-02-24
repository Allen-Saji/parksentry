import fs from 'node:fs/promises';
import path from 'node:path';
import { CandidateInput } from '../../db/repositories/candidatesRepo';

function parseFrameIndex(file: string): number {
  const m = file.match(/frame_(\d+)\.jpg$/);
  return m ? Number(m[1]) : 0;
}

export async function buildChunkCandidates(params: {
  jobId: string;
  chunkId: string;
  chunkStartSecond: number;
  outputDir: string;
  fps: number;
}): Promise<CandidateInput[]> {
  const files = (await fs.readdir(params.outputDir)).filter((f) => f.endsWith('.jpg')).sort();
  if (!files.length) return [];

  const picks = files.filter((_, i) => i % 5 === 0).slice(0, 50);

  return picks.map((file, i) => {
    const idx = parseFrameIndex(file);
    const secondOffset = params.fps > 0 ? Math.floor(idx / params.fps) : i;
    const eventTime = new Date((params.chunkStartSecond + secondOffset) * 1000).toISOString();

    return {
      jobId: params.jobId,
      chunkId: params.chunkId,
      candidateType: 'frame_sample',
      eventTime,
      confidence: 0.5,
      payload: {
        frame: file,
        framePath: path.join(params.outputDir, file),
        note: 'sampled frame candidate for downstream vehicle/plate detection'
      }
    };
  });
}
