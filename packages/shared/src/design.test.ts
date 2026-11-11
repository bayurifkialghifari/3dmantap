import { describe, expect, test } from 'bun:test';
import { starterTemplates } from './templates';
import {
  createDesign,
  furniturePanels,
  priceDesign,
  validateDesign,
  validRoom,
  surfacesFor,
} from './design';
import { mmToPixels, productionBlockers, whatsappLink } from './production';
import type { Inquiry } from './contracts';
import { defaultRoom } from './templates';

describe('physical design contracts', () => {
  test('rotated artwork crossing the physical surface is invalid', () => {
    const t = starterTemplates[0],
      d = createDesign(t);
    d.layers = [
      {
        id: 'a',
        kind: 'text',
        surfaceId: 'front',
        text: 'Hello',
        font: 'sans',
        color: '#000000',
        x: 120,
        y: 0,
        width: 80,
        height: 50,
        rotation: 45,
        opacity: 1,
      },
    ];
    expect(validateDesign(t, d)).toContain('Artwork keluar dari area Depan.');
  });
  test('furniture cut list and price increase with physical width', () => {
    const t = starterTemplates.find((t) => t.modelKind === 'desk')!,
      a = createDesign(t),
      b = { ...a, dimensions: { ...a.dimensions, width: 2000 } };
    expect(furniturePanels(t, a).find((p) => p.id === 'top')?.width).toBe(1400);
    expect(priceDesign(t, b).total).toBeGreaterThan(priceDesign(t, a).total);
  });
  test('drawer column remains clear of doors and shelves', () => {
    const t = starterTemplates.find((t) => t.modelKind === 'cabinet')!;
    const d = createDesign(t);
    d.doors = 2;
    d.drawers = 3;
    const panels = furniturePanels(t, d);
    const drawer = panels.find((p) => p.id === 'drawer-front-2')!;
    for (const door of panels.filter((p) => p.id.startsWith('door-')))
      expect(door.position[0] - door.width / 2).toBeGreaterThan(
        drawer.position[0] + drawer.width / 2,
      );
    for (const shelf of panels.filter((p) => p.id.startsWith('shelf-0-')))
      expect(shelf.position[1] - shelf.thickness / 2).toBeGreaterThan(
        drawer.position[1] + drawer.height / 2,
      );
    const door = panels.find((p) => p.id === 'door-0')!;
    expect(surfacesFor(t, d).find((s) => s.id === door.id)?.centerX).toBe(door.position[0]);
    expect(validateDesign(t, d)).toEqual([]);
    d.dimensions.height = 800;
    expect(validateDesign(t, d)).toContain('Ruang ambalan di atas laci minimal 10 cm.');
    d.doors = 3;
    expect(validateDesign(t, d)).toContain('Sisakan satu kolom tanpa pintu untuk laci.');
  });
  test('mixed sizes determine actual quantity', () => {
    const t = starterTemplates[0],
      d = createDesign(t);
    d.variants = [
      { size: 'M', quantity: 2 },
      { size: 'L', quantity: 3 },
    ];
    expect(priceDesign(t, d).quantity).toBe(5);
  });
  test('one physical inch exports exactly 300 pixels', () => expect(mmToPixels(25.4)).toBe(300));
  test('self-intersecting room and invalid opening fail', () => {
    expect(validRoom(defaultRoom)).toEqual([]);
    expect(
      validRoom({
        ...defaultRoom,
        points: [
          { x: 0, y: 0 },
          { x: 4000, y: 4000 },
          { x: 4000, y: 0 },
          { x: 0, y: 4000 },
        ],
      }).length,
    ).toBeGreaterThan(0);
    expect(
      validRoom({
        ...defaultRoom,
        openings: [{ id: 'd', kind: 'door', wall: 0, offset: 4800, width: 900, height: 2100 }],
      }),
    ).toContain('Bukaan keluar dari batas dinding.');
  });
  test('WhatsApp only links to a configured phone', () => {
    expect(whatsappLink('', 'x')).toBeNull();
    expect(whatsappLink('081234567890', 'a b')).toBe('https://wa.me/6281234567890?text=a%20b');
  });
});
test('production enforces current approval and verified payment', () => {
  const t = starterTemplates[0];
  const i = {
    template: t,
    document: createDesign(t),
    quote: {
      total: 100000,
      requiredPayment: 50000,
      shipping: 0,
      installation: 0,
      fulfillment: 'pickup',
      leadDays: 7,
      notes: '',
      adminApproved: true,
    },
    revision: 2,
    approvedRevision: 1,
    payments: [
      { id: 'p', assetId: 'a', amount: 50000, revision: 1, verified: true, createdAt: '' },
    ],
    status: 'awaiting_payment',
  } as Inquiry;
  expect(productionBlockers(i)).toHaveLength(2);
  i.approvedRevision = 2;
  i.payments[0].revision = 2;
  expect(productionBlockers(i)).toEqual([]);
  i.payments[0].verified = false;
  expect(productionBlockers(i)).toHaveLength(1);
});
