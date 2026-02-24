import { db } from '../client';

export interface CreateAssetInput {
  id: string;
  cameraId: string;
  sourceName: string;
  storagePath: string;
  mimeType?: string;
  sizeBytes: number;
  durationSeconds?: number;
  checksumSha256?: string;
}

export async function createAsset(input: CreateAssetInput) {
  await db.query(
    `
    INSERT INTO uploaded_assets (
      id, camera_id, source_name, storage_path, mime_type, size_bytes, duration_seconds, checksum_sha256
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `,
    [
      input.id,
      input.cameraId,
      input.sourceName,
      input.storagePath,
      input.mimeType ?? null,
      input.sizeBytes,
      input.durationSeconds ?? null,
      input.checksumSha256 ?? null
    ]
  );
}
