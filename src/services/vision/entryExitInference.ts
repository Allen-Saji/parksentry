import path from 'node:path';
import { DetectionInput } from '../../db/repositories/detectionsRepo';
import { EntryExitEventInput } from '../../db/repositories/entryExitRepo';

type MotionPoint = {
  frameIndex: number;
  centerX: number;
  confidence: number;
  framePath: string;
};

function parseFrameIndex(framePath: string): number {
  const name = path.basename(framePath);
  const m = name.match(/frame_(\d+)\.jpg$/);
  return m ? Number(m[1]) : 0;
}

function toEventTime(chunkStartSecond: number, frameIndex: number, fps: number): string {
  const secondOffset = fps > 0 ? frameIndex / fps : 0;
  return new Date((chunkStartSecond + secondOffset) * 1000).toISOString();
}

function inferCrossingEvent(points: MotionPoint[], gateX: number): {
  eventType: 'entry' | 'exit';
  frameIndex: number;
  framePath: string;
  confidence: number;
} | null {
  if (points.length < 2) return null;

  const sorted = points.slice().sort((a, b) => a.frameIndex - b.frameIndex);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const movedFromLeftToRight = prev.centerX < gateX && curr.centerX >= gateX;
    const movedFromRightToLeft = prev.centerX > gateX && curr.centerX <= gateX;

    if (movedFromLeftToRight) {
      return {
        eventType: 'entry',
        frameIndex: curr.frameIndex,
        framePath: curr.framePath,
        confidence: Number(Math.min(0.99, curr.confidence).toFixed(3))
      };
    }

    if (movedFromRightToLeft) {
      return {
        eventType: 'exit',
        frameIndex: curr.frameIndex,
        framePath: curr.framePath,
        confidence: Number(Math.min(0.99, curr.confidence).toFixed(3))
      };
    }
  }

  return null;
}

/**
 * Temporary crossing inference without full multi-object tracking.
 *
 * We approximate a single dominant vehicle trajectory per class in each chunk,
 * then emit entry/exit only if a gate-line crossing transition is observed.
 */
export function inferEntryExitEvents(params: {
  jobId: string;
  chunkId: string;
  detections: DetectionInput[];
  chunkStartSecond: number;
  fps: number;
}): EntryExitEventInput[] {
  const gateX = Number(process.env.GATE_LINE_X || 160);

  const relevant = params.detections.filter(
    (d) => (d.detectedClass === 'car' || d.detectedClass === 'motorbike') && d.bbox.w > 0 && d.bbox.h > 0
  );

  const byClass = new Map<string, MotionPoint[]>();
  for (const d of relevant) {
    const frameIndex = parseFrameIndex(d.framePath);
    const centerX = d.bbox.x + d.bbox.w / 2;
    const points = byClass.get(d.detectedClass) ?? [];
    points.push({ frameIndex, centerX, confidence: d.confidence, framePath: d.framePath });
    byClass.set(d.detectedClass, points);
  }

  const events: EntryExitEventInput[] = [];

  for (const [, points] of byClass.entries()) {
    // Keep one point per frame (highest confidence) to stabilize trajectory.
    const bestByFrame = new Map<number, MotionPoint>();
    for (const p of points) {
      const prev = bestByFrame.get(p.frameIndex);
      if (!prev || p.confidence > prev.confidence) bestByFrame.set(p.frameIndex, p);
    }

    const trajectory = [...bestByFrame.values()].sort((a, b) => a.frameIndex - b.frameIndex);
    const crossing = inferCrossingEvent(trajectory, gateX);
    if (!crossing) continue;

    events.push({
      jobId: params.jobId,
      chunkId: params.chunkId,
      eventType: crossing.eventType,
      eventTime: toEventTime(params.chunkStartSecond, crossing.frameIndex, params.fps),
      confidence: crossing.confidence,
      evidenceFramePath: crossing.framePath,
      plateText: undefined
    });
  }

  return events.sort((a, b) => +new Date(a.eventTime) - +new Date(b.eventTime));
}
