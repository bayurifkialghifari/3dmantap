import { test, expect } from 'bun:test';
import { parse } from 'opentype.js';
import { resolve } from 'node:path';
import { artworkFonts, layerSvg } from './artwork';
import type { ArtworkLayer } from './contracts';
test('bundled artwork fonts outline complete Latin words without unsupported substitutions', async () => {
  for (const name of ['sans', 'serif', 'mono'] as const) {
    const font = parse(
      await Bun.file(
        resolve(
          import.meta.dir,
          '../../../apps/web/public/fonts/artwork',
          artworkFonts[name] + '.ttf',
        ),
      ).arrayBuffer(),
    );
    const layer: ArtworkLayer = {
      id: 'font-regression',
      kind: 'text',
      surfaceId: 'front',
      text: 'MANTAP office 123',
      font: name,
      color: '#123f35',
      x: 0,
      y: 0,
      width: 100,
      height: 25,
      rotation: 0,
      opacity: 1,
    };
    const svg = await layerSvg(layer, { font: async () => font, image: async () => '' });
    expect(svg).toContain('<path d=');
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('<text');
  }
});
