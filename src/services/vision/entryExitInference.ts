import path from 'node:path';
import { DetectionInput } from '../../db/repositories/detectionsRepo';
import { EntryExitEventInput } from '../../db/repositories/entryExitRepo';

function parseFrameIndex(framePath: string): number {
  const name = path.basename(framePath);
  const m = name.match(/frame_(\d+)\.jpg$/);
  return m ? Number(m[1]) : 0;
}

function inferTypeFromPosition(centerX: number, gateX: number): 'entry' | 'exit' {
  return centerX < gateX ? 'entry' : 'exit';
}

export function inferEntryExitEvents(params: {
  jobId: string;
  chunkId: string;
  detections: DetectionInput[];
  chunkStartSecond: number;
  fps: number;
}): EntryExitEventInput[] {
  const gateX = Number(process.env.GATE_LINE_X || 160);

  const events = params.detections
    .filter((d) => d.detectedClass === 'car' || d.detectedClass === 'motorbike')
    .map((d) => {
      const frameIndex = parseFrameIndex(d.framePath);
      const centerX = d.bbox.x + d.bbox.w / 2;
      const secondOffset = params.fps > 0 ? frameIndex / params.fps : 0;
      const eventTime = new Date((params.chunkStartSecond + secondOffset) * 1000).toISOString();

      return {
        jobId: params.jobId,
        chunkId: params.chunkId,
        eventType: inferTypeFromPosition(centerX, gateX),
        eventTime,
        confidence: Number(Math.min(0.99, d.confidence).toFixed(3)),
        evidenceFramePath: d.framePath,
        plateText: undefined,
        frameIndex
      };
    })
    .sort((a, b) => a.frameIndex - b.frameIndex || b.confidence - a.confidence)
    .slice(0, 20);

  return events.map(({ frameIndex, ...event }) => event);
}
