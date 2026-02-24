import fs from 'node:fs/promises';
import path from 'node:path';
import { exportChunkFrames } from './ffmpeg';

export async function runChunkFrameExtraction(params: {
  inputPath: string;
  jobId: string;
  chunkId: string;
  startSecond: number;
  endSecond: number;
  fps?: number;
}) {
  const base = path.join(process.cwd(), 'var', 'chunks', params.jobId, params.chunkId);
  await fs.mkdir(base, { recursive: true });

  await exportChunkFrames(params.inputPath, base, params.startSecond, params.endSecond, params.fps ?? 2);

  const files = (await fs.readdir(base)).filter((f) => f.endsWith('.jpg')).length;
  return {
    outputDir: base,
    framesExtracted: files
  };
}
