import fs from 'node:fs/promises';
import path from 'node:path';
import { DetectionInput } from '../../db/repositories/detectionsRepo';

function seededConfidence(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 1000;
  return 0.5 + (h / 1000) * 0.49;
}

export async function detectVehiclesFromChunkFrames(params: {
  jobId: string;
  chunkId: string;
  frameDir: string;
}): Promise<DetectionInput[]> {
  const files = (await fs.readdir(params.frameDir)).filter((f) => f.endsWith('.jpg')).sort();
  const sampled = files.filter((_, i) => i % 6 === 0).slice(0, 100);

  return sampled.map((f, i) => ({
    jobId: params.jobId,
    chunkId: params.chunkId,
    framePath: path.join(params.frameDir, f),
    detectedClass: i % 3 === 0 ? 'motorbike' : 'car',
    confidence: Number(seededConfidence(f).toFixed(3)),
    bbox: {
      x: (i * 13) % 300,
      y: (i * 7) % 180,
      w: 120,
      h: 70
    }
  }));
}
