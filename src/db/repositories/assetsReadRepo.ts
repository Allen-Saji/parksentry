import { db } from '../client';

export interface AssetRecord {
  id: string;
  camera_id: string;
  source_name: string;
  storage_path: string;
  duration_seconds: number | null;
  size_bytes: string;
}

export async function getAssetById(id: string): Promise<AssetRecord | null> {
  const res = await db.query<AssetRecord>(
    `SELECT id, camera_id, source_name, storage_path, duration_seconds, size_bytes FROM uploaded_assets WHERE id = $1 LIMIT 1`,
    [id]
  );
  return res.rows[0] ?? null;
}
