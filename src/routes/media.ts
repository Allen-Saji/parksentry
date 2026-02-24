import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getAssetById } from '../db/repositories/assetsReadRepo';
import { probeVideo } from '../services/media/ffmpeg';
import { requireRole } from '../plugins/rbac';

const ProbeBody = z.object({
  assetId: z.string().min(5)
});

export function registerMediaRoutes(app: FastifyInstance) {
  app.post('/api/videos/probe', { preHandler: requireRole('operator') }, async (request, reply) => {
    const parsed = ProbeBody.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const asset = await getAssetById(parsed.data.assetId);
    if (!asset) return reply.status(404).send({ error: 'Asset not found' });

    const probe = await probeVideo(asset.storage_path);

    return {
      assetId: asset.id,
      sourceName: asset.source_name,
      probe
    };
  });
}
