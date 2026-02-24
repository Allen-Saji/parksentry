import { randomUUID } from 'node:crypto';
import { db } from '../client';

export interface DetectionInput {
  jobId: string;
  chunkId: string;
  candidateId?: string;
  framePath: string;
  detectedClass: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export async function insertDetections(items: DetectionInput[]) {
  if (!items.length) return;
  const values: unknown[] = [];
  const tuples: string[] = [];

  items.forEach((d, i) => {
    const base = i * 11;
    tuples.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11})`);
    values.push(
      `det_${randomUUID()}`,
      d.jobId,
      d.chunkId,
      d.candidateId ?? null,
      d.framePath,
      d.detectedClass,
      d.confidence,
      d.bbox.x,
      d.bbox.y,
      d.bbox.w,
      d.bbox.h
    );
  });

  await db.query(
    `INSERT INTO detections (id, job_id, chunk_id, candidate_id, frame_path, detected_class, confidence, bbox_x, bbox_y, bbox_w, bbox_h)
     VALUES ${tuples.join(', ')}`,
    values
  );
}

export async function listDetectionsByJob(jobId: string) {
  const res = await db.query(
    `SELECT id, job_id, chunk_id, candidate_id, frame_path, detected_class, confidence, bbox_x, bbox_y, bbox_w, bbox_h, created_at
     FROM detections WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1000`,
    [jobId]
  );
  return res.rows;
}
