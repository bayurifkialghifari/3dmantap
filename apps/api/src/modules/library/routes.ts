import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import { designSchema, roomSchema } from '@3dmantap/shared';
import { prepareRoom } from './service';
import { db } from '../../db/client';
import { designs, rooms, templates } from '../../db/schema';
import { fail, owner, parse, type ApiEnv } from '../../lib/http';
export const libraryRoutes = new Hono<ApiEnv>();
libraryRoutes.get('/designs', async (c) =>
  c.json(
    await db
      .select()
      .from(designs)
      .where(eq(designs.ownerId, owner(c))),
  ),
);
libraryRoutes.post('/designs', async (c) => {
  const document = await parse(c, designSchema);
  const row = {
    id: crypto.randomUUID(),
    ownerId: owner(c),
    name: document.name,
    document,
    shareToken: randomBytes(24).toString('hex'),
    updatedAt: new Date(),
  };
  await db.insert(designs).values(row);
  return c.json(row, 201);
});
libraryRoutes.put('/designs/:id', async (c) => {
  const document = await parse(c, designSchema);
  const condition = and(eq(designs.id, c.req.param('id')), eq(designs.ownerId, owner(c)));
  const [row] = await db.select().from(designs).where(condition);
  if (!row) fail('Desain tidak ditemukan', 404);
  await db
    .update(designs)
    .set({ name: document.name, document, updatedAt: new Date() })
    .where(condition);
  return c.json({ ...row, document });
});
libraryRoutes.delete('/designs/:id', async (c) => {
  await db
    .delete(designs)
    .where(and(eq(designs.id, c.req.param('id')), eq(designs.ownerId, owner(c))));
  return c.json({ ok: true });
});
libraryRoutes.get('/share/:id', async (c) => {
  const [row] = await db
    .select()
    .from(designs)
    .where(
      and(eq(designs.id, c.req.param('id')), eq(designs.shareToken, c.req.query('token') ?? '')),
    );
  if (!row) fail('Link tidak tersedia', 404);
  return c.json({ id: row.id, name: row.name, document: row.document });
});
libraryRoutes.post('/designs/:id/revoke', async (c) => {
  const condition = and(eq(designs.id, c.req.param('id')), eq(designs.ownerId, owner(c)));
  await db
    .update(designs)
    .set({ shareToken: randomBytes(24).toString('hex') })
    .where(condition);
  return c.json({ ok: true });
});
libraryRoutes.get('/rooms', async (c) =>
  c.json(
    await db
      .select()
      .from(rooms)
      .where(eq(rooms.ownerId, owner(c))),
  ),
);
libraryRoutes.delete('/rooms/:id', async (c) => {
  await db.delete(rooms).where(and(eq(rooms.id, c.req.param('id')), eq(rooms.ownerId, owner(c))));
  return c.json({ ok: true });
});
libraryRoutes.post('/rooms', async (c) => {
  const input = await parse(c, roomSchema);
  const catalog = (await db.select().from(templates)).map((t) => t.data);
  const document = prepareRoom(input, catalog);
  const row = {
    id: crypto.randomUUID(),
    ownerId: owner(c),
    document,
    shareToken: randomBytes(24).toString('hex'),
    updatedAt: new Date(),
  };
  await db.insert(rooms).values(row);
  return c.json(row, 201);
});
libraryRoutes.get('/rooms/share/:id', async (c) => {
  const [row] = await db
    .select()
    .from(rooms)
    .where(and(eq(rooms.id, c.req.param('id')), eq(rooms.shareToken, c.req.query('token') ?? '')));
  if (!row) fail('Link tidak tersedia', 404);
  return c.json({ document: row.document });
});
