import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { starterTemplates } from '../../packages/shared/src';
async function credentials() {
  const env = await readFile(resolve('.env'), 'utf8').catch(() => '');
  const values = Object.fromEntries(
    env.split(/\r?\n/).map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
  );
  return {
    email: process.env.ADMIN_EMAIL ?? values.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD ?? values.ADMIN_PASSWORD,
  };
}
test('homepage, catalog and all product previews render', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Bikin yang pas/ })).toBeVisible();
  await page.screenshot({ path: '.data/home-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Buka Fashion Studio' }).click();
  await expect(page.getByRole('heading', { name: /Fashion Studio/ })).toBeVisible();
  for (const template of starterTemplates) {
    await page.goto('/product/' + template.id);
    await expect(page.getByRole('heading', { name: template.name, exact: true })).toBeVisible();
    await expect(page.locator('.detail-preview canvas')).toBeVisible();
    await expect(page.locator('.detail-preview canvas')).toHaveAttribute(
      'data-model-loaded',
      template.modelKind,
      { timeout: 40000 },
    );
  }
  expect(errors).toEqual([]);
});
test('fashion artwork autosaves and submission persists before WhatsApp', async ({ page }) => {
  await page.goto('/studio/everyday-tee');
  await page.getByRole('button', { name: 'Artwork', exact: true }).click();
  await page.getByRole('button', { name: 'Teks', exact: true }).click();
  await page.getByLabel('Teks', { exact: true }).fill('MANTAP');
  await page.getByRole('button', { name: 'Area cetak 2D' }).click();
  await expect(page.locator('.artwork-canvas canvas')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Artwork', exact: true }).click();
  await expect(page.getByRole('button', { name: /MANTAP/ })).toBeVisible();
  await page.getByRole('button', { name: 'Konsultasikan desain', exact: true }).click();
  await page.getByLabel('Nama kamu').fill('Playwright Customer');
  await page.getByLabel('Nomor WhatsApp').fill('081234567890');
  await page.getByLabel('Alamat / area proyek').fill('Jakarta');
  await page.getByRole('button', { name: 'Submit & lanjut konsultasi' }).click();
  await expect(page).toHaveURL(/\/inquiry\//);
  await expect(page.getByText('Desain sudah masuk ke tim kami.')).toBeVisible();
  await expect(page.getByText('Pengajuan diterima', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Setujui desain/ })).toHaveCount(0);
  await page.screenshot({ path: '.data/inquiry-desktop.png', fullPage: true });
});
test('cap and cabinet artwork survives editing and renders in 2D and 3D', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const id of ['signature-cap', 'modular-wardrobe']) {
    await page.goto('/studio/' + id);
    if (id === 'modular-wardrobe') {
      await page.getByLabel('Pintu', { exact: true }).fill('2');
      await page.getByLabel('Laci', { exact: true }).fill('3');
    }
    await page.getByRole('button', { name: 'Artwork', exact: true }).click();
    await page.getByRole('button', { name: 'Teks', exact: true }).click();
    await page.getByLabel('Teks', { exact: true }).fill('MANTAP');
    await page.getByLabel('Warna teks', { exact: true }).fill('#ffffff');
    await page.locator('input[type=file]').setInputFiles({
      name: 'qa-sticker.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="45" fill="#ed5545"/></svg>',
      ),
    });
    await expect(page.getByRole('button', { name: /Artwork 2/ })).toBeVisible();
    await page.getByLabel('Lebar (cm)', { exact: true }).fill('2');
    await page.getByLabel('Tinggi (cm)', { exact: true }).fill('2');
    await page.getByLabel('Posisi Y (cm)', { exact: true }).fill('1.5');
    await page.getByRole('button', { name: 'Area cetak 2D' }).click();
    await expect(page.locator('.artwork-canvas canvas')).toBeVisible();
    await page.getByRole('button', { name: 'Preview 3D' }).click();
    await expect(page.locator('.viewer canvas')).toBeVisible();
    const saved = page.waitForResponse(
      (r) => r.url().endsWith('/library/designs') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Simpan', exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const snapshot = await response.json();
    expect(snapshot.document.layers).toHaveLength(2);
    expect(snapshot.document.layers[0].surfaceId).toBe(id === 'signature-cap' ? 'front' : 'door-0');
    await expect(page.getByText('Desain disimpan ke pustaka.')).toBeVisible();
    await page.screenshot({ path: '.data/artwork-' + id + '.png', fullPage: true });
  }
  expect(errors).toEqual([]);
});
test('room planner adds furniture, switches to 3D and saves', async ({ page }) => {
  await page.goto('/room-planner');
  await page.getByRole('button', { name: 'Tambah furnitur' }).click();
  await page.getByRole('button', { name: 'Work Desk', exact: true }).click();
  await expect(page.getByText('1 furnitur · 4 dinding')).toBeVisible();
  await page.getByRole('button', { name: 'Ruang 3D' }).click();
  await expect(page.locator('.room-3d canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Simpan ruangan', exact: true }).click();
  await expect(page.getByText('Ruangan disimpan. Link berbagi siap.')).toBeVisible();
});
test('admin receives submissions and rejects unapproved production', async ({ page, request }) => {
  const c = await credentials();
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(c.email);
  await page.getByLabel('Password', { exact: true }).fill(c.password);
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page).toHaveURL(/\/library/);
  await page.getByRole('link', { name: 'CMS', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dari ide sampai jadi.' })).toBeVisible();
  await expect(page.getByText('Playwright Customer').first()).toBeVisible();
  const login = await request.post('/api/v1/auth/sign-in/email', {
    data: { email: c.email, password: c.password },
    headers: { Origin: 'http://localhost:5173' },
  });
  expect(login.ok()).toBe(true);
  const adminList = await request.get('/api/v1/admin/inquiries');
  expect(adminList.ok()).toBe(true);
  const list = await adminList.json();
  const i = list.find((x: { customerName: string }) => x.customerName === 'Playwright Customer');
  const start = await request.post('/api/v1/admin/inquiries/' + i.id + '/production', {
    data: {},
    headers: { Origin: 'http://localhost:5173' },
  });
  expect(start.status()).toBe(409);
  await page.screenshot({ path: '.data/cms-desktop.png', fullPage: true });
});
test('mobile homepage and fashion controls fit screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Bikin yang pas/ })).toBeVisible();
  await page.screenshot({ path: '.data/home-mobile.png', fullPage: true });
  await page.goto('/studio/signature-cap');
  await page.getByRole('button', { name: 'Warna', exact: true }).click();
  await expect(page.getByLabel('Warna utama')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
