import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/client';
import { settings, user, audit, jobs } from '../../db/schema';
import { admin, parse, type ApiEnv } from '../../lib/http';
export const settingsRoutes = new Hono<ApiEnv>();
settingsRoutes.get('/', async (c) => {
  const [s] = await db.select().from(settings).where(eq(settings.id, 'business'));
  return c.json(s?.data ?? null);
});
settingsRoutes.put('/', async (c) => {
  admin(c);
  const data = await parse(
    c,
    z.object({
      name: z.string().min(2).max(120),
      whatsapp: z.string().max(20),
      bankName: z.string().max(120),
      bankAccount: z.string().max(100),
      bankOwner: z.string().max(120),
      address: z.string().max(2000),
      announcement: z.string().max(500),
    }),
  );
  await db
    .insert(settings)
    .values({ id: 'business', data })
    .onDuplicateKeyUpdate({ set: { data } });
  return c.json(data);
});
export const adminRoutes = new Hono<ApiEnv>();
adminRoutes.use('*', async (c, next) => {
  admin(c);
  await next();
});
adminRoutes.get('/customers', async (c) =>
  c.json(
    await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user),
  ),
);
adminRoutes.get('/audit', async (c) =>
  c.json(await db.select().from(audit).orderBy(desc(audit.createdAt)).limit(100)),
);
adminRoutes.get('/jobs', async (c) =>
  c.json(
    (await db.select().from(jobs).orderBy(desc(jobs.createdAt))).map(
      ({ snapshot: _snapshot, ...job }) => job,
    ),
  ),
);
