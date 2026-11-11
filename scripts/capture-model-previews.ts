import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { starterTemplates, createDesign, defaultRoom } from '../packages/shared/src';
import { captureHero } from './capture-hero-preview';

const base = process.env.PREVIEW_BASE_URL ?? 'http://localhost:5173';
const kinds = process.argv.slice(2);
const output = resolve(import.meta.dir, '../apps/web/public/models/previews');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  for (const template of starterTemplates) {
    if (kinds.length && !kinds.includes(template.modelKind)) continue;
    await page.goto(base + '/product/' + template.id + '?capture');
    await page.addStyleTag({
      content:
        '.detail-preview:has(.capture-viewer){width:900px!important;height:900px!important}.capture-viewer{height:900px!important}',
    });
    const canvas = page.locator('.detail-preview canvas');
    await canvas
      .locator('xpath=self::*[@data-model-loaded]')
      .waitFor({ state: 'attached', timeout: 40000 });
    await page.waitForTimeout(500);
    const bytes = await canvas.screenshot();
    await sharp(bytes)
      .webp({ quality: 90 })
      .toFile(resolve(output, template.modelKind + '.webp'));
    console.log('Rendered ' + template.modelKind);
  }
  if (kinds.length && !kinds.includes('room') && !kinds.includes('hero')) {
    if (errors.length) throw new Error('Preview rendering failed: ' + errors.join('; '));
  } else {
    const room = structuredClone(defaultRoom);
    room.wallColor = '#e6e3dd';
    room.floorColor = '#c6b9a4';
    room.openings = [
      { id: 'window', wall: 0, kind: 'window', offset: 1100, width: 1800, height: 1200 },
    ];
    room.items = [
      {
        id: 'desk',
        document: createDesign(starterTemplates.find((t) => t.modelKind === 'desk')!),
        x: 1600,
        y: 1600,
        rotation: 0,
      },
      {
        id: 'shelf',
        document: createDesign(starterTemplates.find((t) => t.modelKind === 'shelf')!),
        x: 600,
        y: 2900,
        rotation: 90,
      },
      {
        id: 'sideboard',
        document: createDesign(starterTemplates.find((t) => t.modelKind === 'sideboard')!),
        x: 3700,
        y: 650,
        rotation: 0,
      },
    ];
    await page.goto(base + '/room-planner');
    await page.evaluate(
      (value) => localStorage.setItem('3dmantap:room', JSON.stringify(value)),
      room,
    );
    await page.reload();
    await page.getByRole('button', { name: 'Ruang 3D', exact: true }).click();
    await page.addStyleTag({ content: '.canvas-mode{visibility:hidden}' });
    const canvas = page.locator('.room-3d canvas');
    await canvas
      .locator('xpath=self::*[@data-model-loaded]')
      .waitFor({ state: 'attached', timeout: 40000 });
    await page.waitForTimeout(800);
    await sharp(await canvas.screenshot())
      .resize(1100, 800, { fit: 'contain', background: '#ededeb' })
      .webp({ quality: 90 })
      .toFile(resolve(output, 'room.webp'));
    if (errors.length) throw new Error('Preview rendering failed: ' + errors.join('; '));
    console.log('Rendered room planner with three sourced furniture models.');
    if (!kinds.length || kinds.includes('hero')) await captureHero(page, base, output);
  }
} finally {
  await browser.close();
}
