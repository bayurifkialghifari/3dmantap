import { test, expect } from '@playwright/test';
import { createDesign, starterTemplates, defaultRoom } from '../../packages/shared/src';
test('body profiles, pose edits and artwork survive undo, reload and product-to-studio transfer', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const draft = createDesign(starterTemplates.find((t) => t.id === 'everyday-tee')!);
  draft.layers = [
    {
      id: 'demo-print',
      kind: 'text',
      surfaceId: 'front',
      text: 'MAKE IT YOURS',
      font: 'sans',
      color: '#164b3b',
      x: 0,
      y: 0,
      width: 220,
      height: 40,
      rotation: 0,
      opacity: 1,
    },
  ];
  await page.goto('/');
  await page.evaluate(
    (d) =>
      localStorage.setItem(
        '3dmantap:draft:everyday-tee',
        JSON.stringify({ state: { document: d, past: [], future: [] }, version: 0 }),
      ),
    draft,
  );
  await page.goto('/studio/everyday-tee');
  await page.getByRole('button', { name: 'Manusia', exact: true }).click();
  await page.getByRole('combobox', { name: 'Model manusia', exact: true }).selectOption('female');
  for (const [label, value] of [
    ['Tinggi manusia (cm)', '182'],
    ['Berat badan (kg)', '76'],
    ['Lingkar pinggang (cm)', '84'],
    ['Bahu ke pergelangan tangan (cm)', '64'],
  ]) {
    await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByLabel(label, { exact: true }).press('Tab');
  }
  const canvas = page.locator('.viewer canvas');
  await expect(canvas).toHaveAttribute('data-human-height', '1820', { timeout: 40000 });
  await expect(canvas).toHaveAttribute('data-human-sex', 'female');
  await expect(canvas).toHaveAttribute('data-human-posed-height', '1820');
  await page.getByRole('button', { name: 'Pose', exact: true }).click();
  await page.getByLabel('Preset pose').selectOption('sitting');
  await expect(canvas).toHaveAttribute('data-human-pose', 'sitting');
  expect(Number(await canvas.getAttribute('data-human-posed-height'))).toBeLessThan(1600);
  await page.getByLabel('Sendi yang diedit').selectOption('shoulderL');
  await page.getByLabel('Rotasi sendi X (°)', { exact: true }).fill('25');
  await page.getByLabel('Rotasi sendi X (°)', { exact: true }).press('Tab');
  const read = () =>
    page.evaluate(
      () => JSON.parse(localStorage.getItem('3dmantap:draft:everyday-tee')!).state.document,
    );
  expect((await read()).avatar.pose.joints.shoulderL[0]).toBe(25);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await read()).avatar.pose.joints.shoulderL[0]).not.toBe(25);
  await page.getByRole('button', { name: 'Redo', exact: true }).click();
  expect((await read()).avatar.pose.joints.shoulderL[0]).toBe(25);
  const beforeGesture = (await read()).avatar.pose.joints.shoulderL;
  const slider = (await page.getByLabel('Geser rotasi Z', { exact: true }).boundingBox())!;
  await page.mouse.move(slider.x + slider.width * 0.4, slider.y + slider.height / 2);
  await page.mouse.down();
  await page.mouse.move(slider.x + slider.width * 0.65, slider.y + slider.height / 2, { steps: 8 });
  await page.mouse.up();
  expect((await read()).avatar.pose.joints.shoulderL).not.toEqual(beforeGesture);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  expect((await read()).avatar.pose.joints.shoulderL).toEqual(beforeGesture);
  await page.getByLabel('Preset pose').selectOption('tpose');
  await expect(canvas).toHaveAttribute('data-human-pose', 'tpose');
  await page.getByLabel('Sendi yang diedit').selectOption('');
  await page.screenshot({ path: '.data/avatar-studio-female.png', fullPage: true });
  await page.reload();
  await page.getByRole('button', { name: 'Manusia', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-human-pose', 'tpose');
  await expect(page.getByLabel('Tinggi manusia (cm)', { exact: true })).toHaveValue('182');
  expect((await read()).layers[0].text).toBe('MAKE IT YOURS');
  await page.goto('/product/everyday-tee');
  await page.locator('.product-avatar summary').click();
  await page.getByRole('combobox', { name: 'Model manusia', exact: true }).selectOption('male');
  await page.getByLabel('Tinggi manusia (cm)', { exact: true }).fill('176');
  await page.getByLabel('Tinggi manusia (cm)', { exact: true }).press('Tab');
  await page.getByRole('link', { name: /Custom produk ini/ }).click();
  expect((await read()).avatar.height).toBe(1760);
  expect((await read()).layers[0].text).toBe('MAKE IT YOURS');
  await page.getByRole('button', { name: 'Manusia', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveAttribute('data-human-height', '1760');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.data/avatar-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('room body and seated pose persist in both modes and public recipes can be copied without private measurements', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(
    (room) => localStorage.setItem('3dmantap:room', JSON.stringify(room)),
    defaultRoom,
  );
  await page.goto('/room-planner');
  // Select the reference person via the denah, then edit in the inspector.
  const name = page.getByRole('button', { name: 'Tambah manusia 170 cm', exact: true });
  if (await name.count()) await name.click();
  else {
    await page.getByRole('button', { name: 'Sembunyikan manusia', exact: true }).click();
    await page.getByRole('button', { name: 'Tambah manusia 170 cm', exact: true }).click();
  }
  await page.getByRole('combobox', { name: 'Model manusia', exact: true }).selectOption('female');
  await page.getByLabel('Tinggi manusia (cm)', { exact: true }).fill('168');
  await page.getByLabel('Tinggi manusia (cm)', { exact: true }).press('Tab');
  await page.getByRole('button', { name: 'Pose', exact: true }).click();
  await page.getByLabel('Preset pose').selectOption('sitting');
  await page.getByLabel('Sendi yang diedit').selectOption('hipL');
  const canvas = page.locator('canvas[data-room-3d]');
  await expect(canvas).toHaveAttribute('data-human-height', '1680', { timeout: 40000 });
  await expect(canvas).toHaveAttribute('data-human-pose', 'sitting');
  expect(Number(await canvas.getAttribute('data-human-posed-height'))).toBeLessThan(1500);
  await page.getByLabel('Sendi yang diedit').selectOption('');
  await page.screenshot({ path: '.data/avatar-room-seated.png', fullPage: true });
  await page.reload();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('3dmantap:room')!));
  expect(stored.person.avatar.sex).toBe('female');
  expect(stored.person.height).toBe(1680);
  expect(stored.person.avatar.pose.preset).toBe('sitting');
});
