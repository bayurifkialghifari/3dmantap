import { Hono } from 'hono';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  designSchema,
  publicDesign,
  quoteSchema,
  priceDesign,
  validateDesign,
  statuses,
  whatsappLink,
  rupiah,
  type Inquiry,
} from '@3dmantap/shared';
import { db } from '../../db/client';
import { inquiries, templates, assets, settings } from '../../db/schema';
import { admin, owner, parse, fail, type ApiEnv } from '../../lib/http';
import { config } from '../../config';
import { findInquiry, changeInquiry, createProductionJob } from './repository';
import {
  requireInquiryAccess,
  requireEditable,
  approve,
  archiveRevision,
  advanceStatus,
} from './service';
export const inquiryRoutes = new Hono<ApiEnv>();
const submitSchema = z.object({
  document: designSchema,
  customerName: z.string().min(2).max(120),
  phone: z.string().regex(/^\+?[0-9 ()-]{9,20}$/),
  address: z.string().max(2000),
  notes: z.string().max(5000),
  idempotencyKey: z.string().uuid(),
});
const access = async (c: Parameters<typeof owner>[0], id: string) => {
  const i = await findInquiry(id);
  requireInquiryAccess(
    i,
    c.get('ownerId'),
    c.req.query('token') ?? c.req.header('x-inquiry-token') ?? '',
    c.get('role'),
  );
  return i;
};
inquiryRoutes.get('/', async (c) =>
  c.json(
    (
      await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.ownerId, owner(c)))
    ).map((r) => r.data),
  ),
);
inquiryRoutes.post('/', async (c) => {
  const input = await parse(c, submitSchema);
  const ownerId = owner(c);
  const [existing] = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.idempotencyKey, input.idempotencyKey));
  if (existing) {
    if (existing.ownerId !== ownerId) fail('Kunci pengajuan sudah digunakan', 409);
    return c.json(existing.data);
  }
  const [row] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, input.document.templateId));
  if (!row?.data.active) fail('Produk tidak tersedia', 404);
  const template = row.data;
  const issues = validateDesign(template, input.document);
  if (issues.length) fail(issues.join(' '), 422);
  for (const layer of input.document.layers.filter((l) => l.assetId)) {
    const [a] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, layer.assetId!), eq(assets.ownerId, ownerId)));
    if (!a || a.kind !== 'artwork') fail('Artwork tidak tersedia untuk pengajuan ini', 403);
  }
  const id = crypto.randomUUID(),
    now = new Date().toISOString();
  const i: Inquiry = {
    id,
    code: '3DM-' + Date.now().toString(36).toUpperCase(),
    ownerId,
    customerName: input.customerName,
    phone: input.phone,
    address: input.address,
    notes: input.notes,
    document: input.document,
    template,
    estimate: priceDesign(template, input.document),
    status: 'submitted',
    revision: 1,
    quote: null,
    approvedRevision: null,
    payments: [],
    consultation: [],
    accessToken: randomBytes(32).toString('hex'),
    previewToken: randomBytes(24).toString('hex'),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(inquiries).values({ id, ownerId, idempotencyKey: input.idempotencyKey, data: i });
  return c.json(i, 201);
});
inquiryRoutes.get('/preview/:id', async (c) => {
  const i = await findInquiry(c.req.param('id'));
  if (i.previewToken !== c.req.query('token')) fail('Preview tidak tersedia', 404);
  return c.json({
    id: i.id,
    code: i.code,
    document: publicDesign(i.document),
    template: i.template,
    revision: i.revision,
  });
});
inquiryRoutes.get('/:id', async (c) => c.json(await access(c, c.req.param('id'))));
inquiryRoutes.get('/:id/whatsapp', async (c) => {
  const i = await access(c, c.req.param('id'));
  const [s] = await db.select().from(settings).where(eq(settings.id, 'business'));
  const link = config.appUrl + '/preview/' + i.id + '?token=' + i.previewToken;
  return c.json({
    url: whatsappLink(
      s?.data.whatsapp ?? '',
      'Halo ' +
        (s?.data.name ?? '3DMantap') +
        ', saya ingin konsultasi ' +
        i.code +
        '. ' +
        i.document.name +
        ', ' +
        i.estimate.quantity +
        ' item, estimasi ' +
        rupiah(i.estimate.total) +
        '. Preview: ' +
        link,
    ),
  });
});
inquiryRoutes.post('/:id/approve', async (c) => {
  await access(c, c.req.param('id'));
  const { revision } = await parse(c, z.object({ revision: z.number().int() }));
  return c.json(
    await changeInquiry(c.req.param('id'), owner(c), 'customer.approve', (i) =>
      approve(i, revision),
    ),
  );
});
inquiryRoutes.post('/:id/payments', async (c) => {
  const current = await access(c, c.req.param('id'));
  const input = await parse(
    c,
    z.object({
      amount: z.number().int().positive(),
      assetId: z.string(),
      revision: z.number().int(),
    }),
  );
  if (current.approvedRevision !== input.revision || current.revision !== input.revision)
    fail('Setujui penawaran terbaru terlebih dahulu', 409);
  const [a] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, input.assetId), eq(assets.ownerId, owner(c))));
  if (!a || a.kind !== 'proof') fail('Bukti transfer tidak tersedia');
  return c.json(
    await changeInquiry(current.id, owner(c), 'payment.submitted', (i) => {
      if (i.revision !== input.revision || i.approvedRevision !== input.revision)
        fail('Revisi telah berubah', 409);
      if (['cancelled', 'completed'].includes(i.status))
        fail('Pesanan tidak menerima pembayaran', 409);
      i.payments.push({
        id: crypto.randomUUID(),
        ...input,
        verified: false,
        createdAt: new Date().toISOString(),
      });
    }),
  );
});
export const adminInquiryRoutes = new Hono<ApiEnv>();
adminInquiryRoutes.use('*', async (c, next) => {
  admin(c);
  await next();
});
adminInquiryRoutes.get('/', async (c) =>
  c.json((await db.select().from(inquiries)).map((r) => r.data)),
);
adminInquiryRoutes.post('/:id/note', async (c) => {
  const input = await parse(
    c,
    z.object({
      text: z.string().min(1).max(5000),
      kind: z.enum(['note', 'progress']).default('note'),
      assetId: z.string().optional(),
    }),
  );
  return c.json(
    await changeInquiry(c.req.param('id'), owner(c), 'consultation.note', (i) => {
      i.consultation.push({
        id: crypto.randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      });
      if (i.status === 'submitted') i.status = 'consulting';
    }),
  );
});
adminInquiryRoutes.post('/:id/quote', async (c) => {
  const quote = await parse(c, quoteSchema);
  return c.json(
    await changeInquiry(c.req.param('id'), owner(c), 'quote.revised', (i) => {
      requireEditable(i);
      if (!i.consultation.some((n) => n.kind === 'note'))
        fail('Catat hasil konsultasi terlebih dahulu', 409);
      archiveRevision(i);
      i.revision++;
      i.quote = quote;
      i.payments = i.payments.map((p) => ({ ...p, revision: i.revision, verified: false }));
      i.approvedRevision = null;
      i.status = 'awaiting_approval';
    }),
  );
});
adminInquiryRoutes.post('/:id/revise', async (c) => {
  const document = await parse(c, designSchema);
  return c.json(
    await changeInquiry(c.req.param('id'), owner(c), 'design.revised', (i) => {
      requireEditable(i);
      const issues = validateDesign(i.template, document);
      if (issues.length) fail(issues.join(' '), 422);
      archiveRevision(i);
      i.document = document;
      i.estimate = priceDesign(i.template, document);
      i.revision++;
      i.approvedRevision = null;
      i.quote = null;
      i.status = 'consulting';
    }),
  );
});
adminInquiryRoutes.post('/:id/payments/:paymentId/verify', async (c) =>
  c.json(
    await changeInquiry(c.req.param('id'), owner(c), 'payment.verified', (i) => {
      const p = i.payments.find((p) => p.id === c.req.param('paymentId'));
      if (!p || p.revision !== i.revision || i.approvedRevision !== i.revision)
        fail('Bukti pembayaran tidak cocok dengan revisi terbaru', 409);
      p.verified = true;
    }),
  ),
);
adminInquiryRoutes.post('/:id/production', async (c) => {
  return c.json(await createProductionJob(c.req.param('id'), owner(c)), 201);
});
adminInquiryRoutes.post('/:id/status', async (c) => {
  const { status } = await parse(c, z.object({ status: z.enum(statuses) }));
  return c.json(
    await changeInquiry(c.req.param('id'), owner(c), 'status.changed', (i) =>
      advanceStatus(i, status),
    ),
  );
});
