import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { templateSchema } from '@3dmantap/shared';
import { db } from '../../db/client';
import { templates, assets } from '../../db/schema';
import { admin, fail, parse, type ApiEnv } from '../../lib/http';
export const catalogRoutes = new Hono<ApiEnv>();
catalogRoutes.get('/', async (c) =>
  c.json(
    (await db.select().from(templates))
      .map((t) => t.data)
      .filter((t) => t.active || c.get('role') === 'admin'),
  ),
);
catalogRoutes.get('/:id', async (c) => {
  const [t] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, c.req.param('id')));
  if (!t || (!t.data.active && c.get('role') !== 'admin')) fail('Produk tidak ditemukan', 404);
  return c.json(t.data);
});
catalogRoutes.put('/:id', async (c) => {
  admin(c);
  const t = await parse(c, templateSchema);
  if (t.id !== c.req.param('id')) fail('ID template tidak cocok');
  if (t.active && t.surfaces.length === 0) fail('Produk custom memerlukan area cetak');
  if (t.glbAssetId) {
    const [asset] = await db.select().from(assets).where(eq(assets.id, t.glbAssetId));
    if (!asset || asset.kind !== 'model') fail('Model GLB tidak tersedia');
  }
  await db
    .insert(templates)
    .values({ id: t.id, data: t })
    .onDuplicateKeyUpdate({ set: { data: t } });
  return c.json(t);
});
