import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { db } from '../../db/client';
import { assets, inquiries, designs, templates, rooms } from '../../db/schema';
import { config } from '../../config';
import { fail, owner, type ApiEnv } from '../../lib/http';
export const assetRoutes = new Hono<ApiEnv>();
assetRoutes.post('/', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) fail('Pilih file terlebih dahulu');
  const kind = String(body.kind ?? 'artwork');
  if (!['artwork', 'proof', 'model', 'progress'].includes(kind)) fail('Jenis file tidak valid');
  if (['model', 'progress'].includes(kind) && c.get('role') !== 'admin')
    fail('Akses admin diperlukan', 403);
  if (file.size > 20 * 1024 * 1024) fail('Ukuran file maksimal 20 MB', 413);
  const buffer = Buffer.from(await file.arrayBuffer());
  let mime = file.type,
    width: number | null = null,
    height: number | null = null;
  if (kind === 'model') {
    if (
      buffer.length < 20 ||
      buffer.subarray(0, 4).toString() !== 'glTF' ||
      buffer.readUInt32LE(4) !== 2 ||
      buffer.readUInt32LE(8) !== buffer.length ||
      buffer.readUInt32LE(16) !== 0x4e4f534a
    )
      fail('Model harus berformat GLB 2.0 yang valid');
    const chunkLength = buffer.readUInt32LE(12);
    if (20 + chunkLength > buffer.length) fail('GLB tidak lengkap');
    let json: unknown;
    try {
      json = JSON.parse(buffer.subarray(20, 20 + chunkLength).toString());
    } catch {
      fail('JSON model GLB tidak valid');
    }
    const parsed = z
      .object({
        asset: z.object({ version: z.literal('2.0') }),
        meshes: z.array(z.unknown()).min(1),
        scenes: z.array(z.unknown()).min(1),
        buffers: z.array(z.object({ uri: z.string().optional() })).optional(),
        images: z.array(z.object({ uri: z.string().optional() })).optional(),
      })
      .safeParse(json);
    if (!parsed.success) fail('GLB harus memiliki scene dan mesh yang valid');
    const model = parsed.data;
    if (
      [...(model.buffers ?? []), ...(model.images ?? [])].some(
        (item) => item.uri && !item.uri.startsWith('data:'),
      )
    )
      fail('GLB harus menyertakan asset tanpa referensi eksternal');
    mime = 'model/gltf-binary';
  } else if (mime === 'image/svg+xml' && kind === 'artwork') {
    const svg = buffer.toString();
    if (
      /<script|<foreignObject|<!DOCTYPE|<!ENTITY|\bon\w+\s*=|javascript:|file:|https?:|url\s*\(/i.test(
        svg
          .replaceAll('http://www.w3.org/2000/svg', '')
          .replaceAll('http://www.w3.org/1999/xlink', ''),
      )
    )
      fail('SVG mengandung konten yang tidak diizinkan');
    const metadata = await sharp(buffer, { limitInputPixels: 40000000 })
      .metadata()
      .catch(() => fail('SVG tidak valid'));
    width = metadata.width ?? null;
    height = metadata.height ?? null;
  } else {
    const metadata = await sharp(buffer, { limitInputPixels: 40000000 })
      .metadata()
      .catch(() => fail('File gambar tidak valid'));
    if (!['png', 'jpeg', 'webp'].includes(metadata.format ?? ''))
      fail('Gunakan PNG, JPEG, WebP atau SVG');
    mime = 'image/' + (metadata.format === 'jpeg' ? 'jpeg' : metadata.format);
    width = metadata.width ?? null;
    height = metadata.height ?? null;
  }
  const id = crypto.randomUUID();
  await mkdir(config.uploadDir, { recursive: true });
  await writeFile(join(config.uploadDir, id), buffer);
  const row = { id, ownerId: owner(c), name: file.name.slice(0, 255), mime, kind, width, height };
  await db.insert(assets).values(row);
  return c.json(row, 201);
});
assetRoutes.get('/:id', async (c) => {
  const [a] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, c.req.param('id')));
  if (!a) fail('File tidak ditemukan', 404);
  let allowed = a.ownerId === c.get('ownerId') || c.get('role') === 'admin';
  const inquiryId = c.req.query('inquiry');
  if (!allowed && inquiryId) {
    const [r] = await db.select().from(inquiries).where(eq(inquiries.id, inquiryId));
    const token = c.req.query('token');
    if (r) {
      const i = r.data;
      allowed =
        (i.accessToken === token || i.ownerId === c.get('ownerId')) &&
        (i.document.layers.some((l) => l.assetId === a.id) ||
          i.payments.some((p) => p.assetId === a.id) ||
          i.consultation.some((n) => n.assetId === a.id));
      if (!allowed && i.previewToken === token)
        allowed = i.document.layers.some((l) => l.assetId === a.id);
    }
  }
  if (!allowed && c.req.query('design')) {
    const [d] = await db
      .select()
      .from(designs)
      .where(eq(designs.id, c.req.query('design')!));
    allowed =
      !!d &&
      d.shareToken === c.req.query('token') &&
      d.document.layers.some((l) => l.assetId === a.id);
  }
  if (!allowed && c.req.query('room')) {
    const [r] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, c.req.query('room')!));
    allowed =
      !!r &&
      r.shareToken === c.req.query('token') &&
      r.document.items.some((item) => item.document.layers.some((l) => l.assetId === a.id));
  }
  if (!allowed && a.kind === 'model')
    allowed = (await db.select().from(templates)).some(
      (t) => t.data.active && t.data.glbAssetId === a.id,
    );
  if (!allowed) fail('File ini bersifat privat', 403);
  const file = Bun.file(join(config.uploadDir, a.id));
  c.header('Cache-Control', 'private, no-store');
  c.header('Content-Type', a.mime);
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  return c.body(await file.arrayBuffer());
});
