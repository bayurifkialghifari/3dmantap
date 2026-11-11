import { chromium, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { createDesign, starterTemplates } from '../packages/shared/src';

export async function captureHero(page: Page, base: string, output: string) {
  const template = starterTemplates.find((t) => t.modelKind === 'cap')!;
  const document = createDesign(template);
  document.color = '#687664';
  document.layers = [
    {
      id: 'studio-wordmark',
      kind: 'text',
      surfaceId: 'front',
      text: 'MANTAP',
      font: 'sans',
      color: '#ffffff',
      x: 0,
      y: -8,
      width: 80,
      height: 16,
      rotation: 0,
      opacity: 1,
    },
  ];
  await page.goto(base);
  await page.evaluate(
    ({ templateId, document }) =>
      localStorage.setItem(
        '3dmantap:draft:' + templateId,
        JSON.stringify({ state: { document, past: [], future: [] }, version: 0 }),
      ),
    { templateId: template.id, document },
  );
  await page.goto(base + '/studio/' + template.id);
  await page.addStyleTag({
    content:
      '.studio-canvas{width:900px!important}.studio-canvas .viewer{width:900px!important;height:900px!important}.canvas-mode,.viewer-hint,.viewer-reset{visibility:hidden}',
  });
  const canvas = page.locator('.viewer canvas');
  await canvas
    .locator('xpath=self::*[@data-model-loaded]')
    .waitFor({ state: 'attached', timeout: 40000 });
  await page.waitForTimeout(1200);
  await sharp(await canvas.screenshot())
    .webp({ quality: 92 })
    .toFile(resolve(output, 'studio-edition.webp'));
  console.log('Rendered custom bucket hat with actual projected text.');
}
if (import.meta.main) {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 1,
    });
    await captureHero(
      page,
      process.env.PREVIEW_BASE_URL ?? 'http://localhost:5173',
      resolve(import.meta.dir, '../apps/web/public/models/previews'),
    );
  } finally {
    await browser.close();
  }
}
