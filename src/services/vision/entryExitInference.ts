import { DetectionInput } from '../../db/repositories/detectionsRepo';
import { EntryExitEventInput } from '../../db/repositories/entryExitRepo';

function inferType(index: number): 'entry' | 'exit' {
  return index % 2 === 0 ? 'entry' : 'exit';
}

export function inferEntryExitEvents(params: {
  jobId: string;
  chunkId: string;
  detections: DetectionInput[];
}): EntryExitEventInput[] {
  const top = params.detections
    .filter((d) => d.detectedClass === 'car' || d.detectedClass === 'motorbike')
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20);

  return top.map((d, i) => ({
    jobId: params.jobId,
    chunkId: params.chunkId,
    eventType: inferType(i),
    eventTime: new Date(Date.now() + i * 1000).toISOString(),
    confidence: Number(Math.min(0.99, d.confidence).toFixed(3)),
    evidenceFramePath: d.framePath,
    plateText: undefined
  }));
}
