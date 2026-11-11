import { test, expect, type Page } from '@playwright/test';
import { defaultRoom, type RoomProject, roomItemPose } from '../../packages/shared/src';
const snapshot = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('3dmantap:room')!) as RoomProject);
async function drag(page: Page, start: { x: number; y: number }, end: { x: number; y: number }) {
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.mouse.up();
}
// Project a world point using the initial room camera (8,7,8), target (0,.5,0), FOV 42.
function project3D(
  bounds: { x: number; y: number; width: number; height: number },
  room: RoomProject,
  x: number,
  y: number,
  z: number,
) {
  const centerX =
    (Math.min(...room.points.map((p) => p.x)) + Math.max(...room.points.map((p) => p.x))) / 2000;
  const centerZ =
    (Math.min(...room.points.map((p) => p.y)) + Math.max(...room.points.map((p) => p.y))) / 2000;
  const dx = x - centerX - 8,
    dy = y - 7,
    dz = z - centerZ - 8;
  const length = Math.hypot(8, 6.5, 8),
    horizontal = Math.sqrt(128);
  const right = (dx - dz) / Math.sqrt(2);
  const up = (-(dx + dz) * 6.5) / (length * Math.sqrt(2)) + (dy * horizontal) / length;
  const depth = -(dx * 8 + dy * 6.5 + dz * 8) / length;
  const factor = bounds.height / 2 / Math.tan((21 * Math.PI) / 180) / depth;
  return {
    x: bounds.x + bounds.width / 2 + right * factor,
    y: bounds.y + bounds.height / 2 - up * factor,
  };
}
test('doors stay mounted while furniture and the reference person drag in 2D and 3D', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/room-planner');
  await page.evaluate((room) => localStorage.setItem('3dmantap:room', JSON.stringify(room)), {
    ...defaultRoom,
    person: { x: 1200, y: 2800, rotation: 0, height: 1700 },
  });
  await page.reload();
  await page.getByRole('button', { name: '+ Pintu', exact: true }).click();
  await page.getByRole('button', { name: 'Tambah furnitur', exact: true }).click();
  await page.getByRole('button', { name: 'Modular Wardrobe', exact: true }).click();
  const plan = (await page.locator('.room-2d canvas').boundingBox())!;
  const scale = Math.min((plan.width - 120) / 5000, (650 - 150) / 4000);
  const point = (x: number, y: number) => ({
    x: plan.x + plan.width / 2 + (x - 2500) * scale,
    y: plan.y + 325 + (y - 2000) * scale,
  });
  let room = await snapshot(page);
  const leafId = room.items[0].id,
    cabinetId = room.items[1].id;
  await drag(page, point(room.items[1].x, room.items[1].y), point(2100, 2200));
  await expect.poll(async () => (await snapshot(page)).items[1].x).toBe(2100);
  room = await snapshot(page);
  const leaf = roomItemPose(room, room.items[0]);
  await drag(page, point(leaf.x, leaf.y), point(5000, 1400));
  await expect.poll(async () => (await snapshot(page)).openings[0].wall).toBe(1);
  await expect(page.getByRole('combobox', { name: 'Dinding pintu', exact: true })).toHaveValue('1');
  await drag(page, point(1200, 2800), point(1500, 3050));
  await expect.poll(async () => (await snapshot(page)).person?.x).toBe(1500);
  await page.getByRole('button', { name: 'Ruang 3D', exact: true }).click();
  const canvas = page.locator('.room-3d canvas');
  await expect(canvas).toHaveAttribute('data-human-height', '1700', { timeout: 40000 });
  const bounds = (await canvas.boundingBox())!;
  room = await snapshot(page);
  const cabinet = room.items.find((i) => i.id === cabinetId)!;
  const start = project3D(bounds, room, cabinet.x / 1000 - 0.4, 1.2, cabinet.y / 1000 + 0.3);
  await drag(page, start, { x: start.x + 100, y: start.y + 35 });
  await expect
    .poll(async () => (await snapshot(page)).items.find((i) => i.id === cabinetId)!.x)
    .not.toBe(cabinet.x);
  await expect(page.getByLabel('Posisi X (cm)', { exact: true })).toBeVisible();
  room = await snapshot(page);
  const door = room.items.find((i) => i.id === leafId)!;
  const oldOffset = room.openings.find((o) => o.id === door.openingId)!.offset;
  const mounted = project3D(bounds, room, door.x / 1000, 1.05, door.y / 1000);
  await drag(page, mounted, { x: mounted.x - 65, y: mounted.y + 15 });
  await expect(page.getByRole('combobox', { name: 'Dinding pintu', exact: true })).toBeVisible();
  await expect
    .poll(async () => (await snapshot(page)).openings.find((o) => o.id === door.openingId)!.offset)
    .not.toBe(oldOffset);
  room = await snapshot(page);
  const person = room.person!;
  const human = project3D(bounds, room, person.x / 1000, 1.58, person.y / 1000);
  await drag(page, human, { x: human.x + 75, y: human.y - 15 });
  await expect.poll(async () => (await snapshot(page)).person!.x).not.toBe(person.x);
  await expect(page.getByLabel('Tinggi manusia (cm)', { exact: true })).toBeVisible();
  room = await snapshot(page);
  const pose = roomItemPose(
    room,
    room.items.find((i) => i.id === leafId)!,
  );
  expect(room.items.find((i) => i.id === leafId)).toMatchObject(pose);
  const saving = page.waitForResponse(
    (r) => r.url().endsWith('/library/rooms') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Simpan ruangan', exact: true }).click();
  const response = await saving;
  expect(response.status()).toBe(201);
  const saved = await response.json();
  expect(saved.document.items).toEqual(room.items);
  expect(saved.document.person.height).toBe(1700);
  await page.reload();
  expect((await snapshot(page)).items).toEqual(room.items);
  await page.screenshot({ path: '.data/room-drag-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: '.data/room-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('shirts, hoodies, jackets and pants can be worn and edited artwork persists', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const id of ['everyday-tee', 'essential-hoodie', 'utility-jacket', 'daily-pants']) {
    await page.goto('/product/' + id);
    await page.getByRole('button', { name: 'Preview dipakai', exact: true }).click();
    await expect(page.locator('.detail-preview canvas')).toHaveAttribute(
      'data-human-height',
      '1700',
      { timeout: 40000 },
    );
    await expect(
      page.getByRole('button', { name: 'Lihat produk saja', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.detail-preview').screenshot({ path: '.data/worn-' + id + '.png' });
    await page.getByRole('button', { name: 'Lihat produk saja', exact: true }).click();
    await expect(page.locator('.detail-preview canvas')).not.toHaveAttribute('data-human-height');
  }
  await page.goto('/studio/everyday-tee');
  await page.getByRole('button', { name: 'Artwork', exact: true }).click();
  await page.getByRole('button', { name: 'Teks', exact: true }).click();
  await page.getByLabel('Teks', { exact: true }).fill('STUDIO');
  await page.getByRole('button', { name: 'Preview dipakai', exact: true }).click();
  await expect(page.locator('.viewer canvas')).toHaveAttribute('data-human-height', '1700', {
    timeout: 40000,
  });
  await page.locator('.viewer').screenshot({ path: '.data/worn-artwork.png' });
  await page.reload();
  await page.getByRole('button', { name: 'Artwork', exact: true }).click();
  await expect(page.getByRole('button', { name: /STUDIO/ })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Preview dipakai', exact: true }).click();
  await expect(page.locator('.viewer canvas')).toHaveAttribute('data-human-height', '1700', {
    timeout: 40000,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});
