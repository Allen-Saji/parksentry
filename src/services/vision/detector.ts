import { DetectionInput } from '../../db/repositories/detectionsRepo';
import { detectVehiclesFromChunkFrames as runMockDetector } from './mockDetector';

type DetectorMode = 'mock' | 'http';

type HttpDetectorResponse = {
  detections?: Array<{
    framePath: string;
    detectedClass: string;
    confidence: number;
    bbox: { x: number; y: number; w: number; h: number };
  }>;
};

function getDetectorMode(): DetectorMode {
  const mode = (process.env.DETECTOR_MODE || 'mock').toLowerCase();
  return mode === 'http' ? 'http' : 'mock';
}

function shouldFallbackToMock() {
  return (process.env.DETECTOR_FALLBACK_MOCK || 'true').toLowerCase() !== 'false';
}

async function runHttpDetector(params: {
  jobId: string;
  chunkId: string;
  frameDir: string;
}): Promise<DetectionInput[]> {
  const endpoint = process.env.DETECTOR_HTTP_ENDPOINT;
  if (!endpoint) {
    throw new Error('DETECTOR_HTTP_ENDPOINT is required when DETECTOR_MODE=http');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jobId: params.jobId,
      chunkId: params.chunkId,
      frameDir: params.frameDir,
      sampleEvery: Number(process.env.DETECTOR_SAMPLE_EVERY || 6),
      maxFrames: Number(process.env.DETECTOR_MAX_FRAMES || 100)
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP detector failed: ${response.status} ${body}`);
  }

  const json = (await response.json()) as HttpDetectorResponse;
  const detections = json.detections ?? [];

  return detections.map((d) => ({
    jobId: params.jobId,
    chunkId: params.chunkId,
    framePath: d.framePath,
    detectedClass: d.detectedClass,
    confidence: d.confidence,
    bbox: d.bbox
  }));
}

export async function detectVehiclesFromChunkFrames(params: {
  jobId: string;
  chunkId: string;
  frameDir: string;
}): Promise<DetectionInput[]> {
  const mode = getDetectorMode();

  if (mode === 'mock') {
    return runMockDetector(params);
  }

  try {
    return await runHttpDetector(params);
  } catch (error) {
    if (!shouldFallbackToMock()) throw error;
    return runMockDetector(params);
  }
}
