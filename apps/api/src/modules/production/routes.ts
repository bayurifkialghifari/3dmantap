import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { join } from 'node:path';
import { db } from '../../db/client';
import { jobs } from '../../db/schema';
import { fail, type ApiEnv } from '../../lib/http';
import { config } from '../../config';
import { findInquiry } from '../inquiries/repository';
import { requireInquiryAccess } from '../inquiries/service';
export const productionRoutes = new Hono<ApiEnv>();
productionRoutes.get('/:inquiryId', async (c) => {
  const i = await findInquiry(c.req.param('inquiryId'));
  requireInquiryAccess(i, c.get('ownerId'), c.req.query('token') ?? '', c.get('role'));
  return c.json(
    (await db.select().from(jobs).where(eq(jobs.inquiryId, i.id))).map(
      ({ snapshot: _snapshot, ...job }) => job,
    ),
  );
});
productionRoutes.get('/:inquiryId/:jobId/download', async (c) => {
  const i = await findInquiry(c.req.param('inquiryId'));
  requireInquiryAccess(i, c.get('ownerId'), c.req.query('token') ?? '', c.get('role'));
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, c.req.param('jobId')));
  if (
    !job ||
    job.inquiryId !== i.id ||
    job.status !== 'completed' ||
    job.revision !== i.approvedRevision
  )
    fail('Paket produksi belum tersedia', 409);
  c.header('Content-Type', 'application/zip');
  c.header(
    'Content-Disposition',
    'attachment; filename="' + i.code + '-r' + job.revision + '.zip"',
  );
  c.header('Cache-Control', 'private, no-store');
  return c.body(await Bun.file(join(config.uploadDir, 'exports', job.id + '.zip')).arrayBuffer());
});
