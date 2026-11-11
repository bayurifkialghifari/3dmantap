import { beforeAll, afterAll, test, expect } from 'bun:test';
import { eq, inArray } from 'drizzle-orm';
import { unzipSync, strFromU8 } from 'fflate';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { createDesign, starterTemplates, type Inquiry } from '@3dmantap/shared';
import { app } from './app';
import { config } from './config';
import { db } from './db/client';
import { inquiries, jobs, assets, audit } from './db/schema';
import { exportPacket } from './modules/production/export';
let cookie = '';
const visitor = crypto.randomUUID() + crypto.randomUUID();
const ids: string[] = [];
const assetIds: string[] = [];
const req = (path: string, method = 'GET', data?: unknown, isAdmin = false) =>
  app.request('/api/v1' + path, {
    method,
    headers: {
      Origin: config.appUrl,
      'x-visitor-token': visitor,
      ...(isAdmin ? { Cookie: cookie } : {}),
      ...(data ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
beforeAll(async () => {
  const login = await req('/auth/sign-in/email', 'POST', {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  });
  expect(login.status).toBe(200);
  cookie = login.headers
    .getSetCookie()
    .map((s) => s.split(';')[0])
    .join('; ');
});
afterAll(async () => {
  if (ids.length) {
    await db.delete(jobs).where(inArray(jobs.inquiryId, ids));
    await db.delete(audit).where(inArray(audit.targetId, ids));
    await db.delete(inquiries).where(inArray(inquiries.id, ids));
  }
  if (assetIds.length) await db.delete(assets).where(inArray(assets.id, assetIds));
});
test('upload validates SVG and blocks unrelated visitors', async () => {
  const form = new FormData();
  form.append(
    'file',
    new File(
      [
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#164b3b"/></svg>',
      ],
      'safe.svg',
      { type: 'image/svg+xml' },
    ),
  );
  const response = await app.request('/api/v1/assets', {
    method: 'POST',
    headers: { 'x-visitor-token': visitor, Origin: config.appUrl },
    body: form,
  });
  expect(response.status).toBe(201);
  const a = (await response.json()) as { id: string };
  assetIds.push(a.id);
  expect(
    (
      await app.request('/api/v1/assets/' + a.id, {
        headers: { 'x-visitor-token': crypto.randomUUID() + crypto.randomUUID() },
      })
    ).status,
  ).toBe(403);
  const bad = new FormData();
  bad.append(
    'file',
    new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
      'bad.svg',
      { type: 'image/svg+xml' },
    ),
  );
  expect(
    (
      await app.request('/api/v1/assets', {
        method: 'POST',
        headers: { 'x-visitor-token': visitor },
        body: bad,
      })
    ).status,
  ).toBe(400);
});
test('malformed GLB JSON is rejected as validation error', async () => {
  for (const source of [
    'not json',
    'null',
    '{"asset":{"version":"2.0"},"meshes":[{}],"scenes":[{}],"buffers":{}}',
  ]) {
    const payload = Buffer.from(source.padEnd(Math.ceil(source.length / 4) * 4));
    const glb = Buffer.alloc(20 + payload.length);
    glb.write('glTF');
    glb.writeUInt32LE(2, 4);
    glb.writeUInt32LE(glb.length, 8);
    glb.writeUInt32LE(payload.length, 12);
    glb.writeUInt32LE(0x4e4f534a, 16);
    payload.copy(glb, 20);
    const form = new FormData();
    form.append('kind', 'model');
    form.append('file', new File([glb], 'broken.glb', { type: 'model/gltf-binary' }));
    const response = await app.request('/api/v1/assets', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: config.appUrl },
      body: form,
    });
    expect(response.status).toBe(400);
  }
});
test('complete consultation approval transfer and production workflow', async () => {
  const d = createDesign(starterTemplates[0]);
  d.layers = [
    {
      id: 'one-inch',
      kind: 'text',
      surfaceId: 'front',
      text: 'MANTAP',
      font: 'sans',
      color: '#123f35',
      x: 0,
      y: 0,
      width: 25.4,
      height: 25.4,
      rotation: 0,
      opacity: 1,
    },
  ];
  const body = {
    document: d,
    customerName: 'Integration QA',
    phone: '081234567890',
    address: 'Test',
    notes: 'Automated test',
    idempotencyKey: crypto.randomUUID(),
  };
  const submit = await req('/inquiries', 'POST', body);
  expect(submit.status).toBe(201);
  let i = (await submit.json()) as Inquiry;
  ids.push(i.id);
  const replay = await req('/inquiries', 'POST', body);
  expect(((await replay.json()) as Inquiry).id).toBe(i.id);
  expect((await req('/admin/inquiries')).status).toBe(403);
  expect((await req('/admin/inquiries/' + i.id + '/production', 'POST', {}, true)).status).toBe(
    409,
  );
  const quote = {
    total: 100000,
    requiredPayment: 50000,
    shipping: 10000,
    installation: 0,
    fulfillment: 'shipping',
    leadDays: 7,
    notes: 'Agreed production specs',
    adminApproved: true,
  };
  expect((await req('/admin/inquiries/' + i.id + '/quote', 'POST', quote, true)).status).toBe(409);
  expect(
    (
      await req(
        '/admin/inquiries/' + i.id + '/note',
        'POST',
        { text: 'Consulted via WhatsApp, final design agreed', kind: 'note' },
        true,
      )
    ).status,
  ).toBe(200);
  i = (await (
    await req('/admin/inquiries/' + i.id + '/quote', 'POST', quote, true)
  ).json()) as Inquiry;
  expect(i.history?.length).toBe(1);
  expect((await req('/inquiries/' + i.id + '/approve', 'POST', { revision: 1 })).status).toBe(409);
  expect(
    (await req('/inquiries/' + i.id + '/approve', 'POST', { revision: i.revision })).status,
  ).toBe(200);
  const proof = await sharp({
    create: { width: 200, height: 200, channels: 3, background: '#ffffff' },
  })
    .png()
    .toBuffer();
  const form = new FormData();
  form.append('file', new File([new Uint8Array(proof)], 'proof.png', { type: 'image/png' }));
  form.append('kind', 'proof');
  const uploaded = await app.request('/api/v1/assets', {
    method: 'POST',
    headers: { 'x-visitor-token': visitor },
    body: form,
  });
  const a = (await uploaded.json()) as { id: string };
  assetIds.push(a.id);
  i = (await (
    await req('/inquiries/' + i.id + '/payments', 'POST', {
      amount: 50000,
      assetId: a.id,
      revision: i.revision,
    })
  ).json()) as Inquiry;
  const paymentId = i.payments[0].id;
  expect(
    (await req('/admin/inquiries/' + i.id + '/payments/' + paymentId + '/verify', 'POST', {}))
      .status,
  ).toBe(403);
  expect((await req('/admin/inquiries/' + i.id + '/production', 'POST', {}, true)).status).toBe(
    409,
  );
  expect(
    (await req('/admin/inquiries/' + i.id + '/payments/' + paymentId + '/verify', 'POST', {}, true))
      .status,
  ).toBe(200);
  const production = await req('/admin/inquiries/' + i.id + '/production', 'POST', {}, true);
  expect(production.status).toBe(201);
  const result = (await production.json()) as { inquiry: Inquiry; job: { id: string } };
  expect(result.inquiry.status).toBe('production');
  expect((await req('/admin/inquiries/' + i.id + '/production', 'POST', {}, true)).status).toBe(
    409,
  );
  const archive = unzipSync(await exportPacket(result.inquiry));
  expect(archive['production-sheet.pdf']).toBeDefined();
  expect(archive['approved-design.json']).toBeDefined();
  const manifest = JSON.parse(strFromU8(archive['manifest.json'])) as {
    revision: number;
    printTiles: { filename: string; width: number; height: number }[];
  };
  expect(manifest.revision).toBe(i.revision);
  const file = manifest.printTiles[0].filename;
  const png = await sharp(archive['artwork/' + file + '-300dpi.png']).metadata();
  expect(png.width).toBeCloseTo(300, -1);
  const pdf = await PDFDocument.load(archive['artwork/' + file + '-actual-size.pdf']);
  expect(pdf.getPage(0).getWidth()).toBeCloseTo((manifest.printTiles[0].width * 72) / 25.4, 3);
  const cabinet = starterTemplates.find((t) => t.modelKind === 'cabinet')!;
  const furniture = createDesign(cabinet);
  furniture.doors = 2;
  furniture.drawers = 3;
  furniture.layers = [{ ...d.layers[0], surfaceId: 'door-0' }];
  const furnitureArchive = unzipSync(
    await exportPacket({ ...result.inquiry, template: cabinet, document: furniture }),
  );
  const furnitureManifest = JSON.parse(strFromU8(furnitureArchive['manifest.json'])) as {
    surfaces: { id: string; centerX: number }[];
    panels: { id: string; position: number[] }[];
    printTiles: { surface: string }[];
  };
  expect(furnitureManifest.printTiles[0].surface).toBe('door-0');
  expect(furnitureManifest.surfaces.find((s) => s.id === 'door-0')?.centerX).toBe(
    furnitureManifest.panels.find((p) => p.id === 'door-0')?.position[0],
  );
  expect(strFromU8(furnitureArchive['cut-list.csv'])).toContain('"door-0"');
  expect(
    (await req('/admin/inquiries/' + i.id + '/status', 'POST', { status: 'ready' }, true)).status,
  ).toBe(200);
  expect(
    (await req('/admin/inquiries/' + i.id + '/status', 'POST', { status: 'shipped' }, true)).status,
  ).toBe(409);
  if (!process.env.CI)
    for (let attempt = 0; attempt < 100; attempt++) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, result.job.id));
      if (job.status === 'completed' || job.status === 'failed') break;
      await Bun.sleep(100);
    }
}, 15000);
