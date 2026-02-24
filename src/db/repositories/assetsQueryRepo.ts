import { db } from '../client';

export async function findAssetPathBySource(params: { cameraId?: string | null; sourceName?: string | null }) {
  if (!params.sourceName) return null;

  const res = await db.query<{ storage_path: string }>(
    `
    SELECT storage_path
    FROM uploaded_assets
    WHERE source_name = $1
      AND ($2::text IS NULL OR camera_id = $2)
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [params.sourceName, params.cameraId ?? null]
  );

  return res.rows[0]?.storage_path ?? null;
}
