import type { Font } from 'opentype.js';
import type { ArtworkLayer, PrintSurface } from './contracts';
export type ArtworkResolver = {
  font: (font: ArtworkLayer['font']) => Promise<Font>;
  image: (id: string) => Promise<string>;
};
export const artworkFonts = { sans: 'NotoSans', serif: 'NotoSerif', mono: 'NotoSansMono' } as const;
export const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export async function layerSvg(l: ArtworkLayer, resolver: ArtworkResolver): Promise<string> {
  if (l.kind === 'image' && l.assetId)
    return (
      '<image x="' +
      -l.width / 2 +
      '" y="' +
      -l.height / 2 +
      '" width="' +
      l.width +
      '" height="' +
      l.height +
      '" preserveAspectRatio="none" href="' +
      escapeXml(await resolver.image(l.assetId)) +
      '"/>'
    );
  if (!l.text.trim()) return '';
  const font = await resolver.font(l.font);
  // Outline explicit glyphs: Noto contextual substitutions exceed opentype.js support.
  // Use the same glyphs and kerning in the browser and production exports.
  const glyphs = Array.from(l.text.normalize('NFC').replace(/\s+/g, ' '), (c) =>
    font.charToGlyph(c),
  );
  const path = glyphs[0].getPath(0, 0, 100, undefined, font);
  let penX = 0;
  glyphs.forEach((glyph, index) => {
    if (index > 0) path.extend(glyph.getPath(penX, 0, 100, undefined, font));
    const next = glyphs[index + 1];
    penX +=
      (((glyph.advanceWidth ?? 0) + (next ? font.getKerningValue(glyph, next) : 0)) * 100) /
      font.unitsPerEm;
  });
  const b = path.getBoundingBox();
  // Avoid opentype.js exponent-based rounding producing NaN near integer coordinates.
  const pathData = path.commands
    .map((command) => {
      if (command.type === 'Z') return 'Z';
      const points =
        command.type === 'C'
          ? [command.x1, command.y1, command.x2, command.y2, command.x, command.y]
          : command.type === 'Q'
            ? [command.x1, command.y1, command.x, command.y]
            : [command.x, command.y];
      return command.type + points.map((value) => Number(value.toFixed(4))).join(' ');
    })
    .join('');
  const sx = l.width / Math.max(0.001, b.x2 - b.x1),
    sy = l.height / Math.max(0.001, b.y2 - b.y1);
  return (
    '<g transform="translate(' +
    -l.width / 2 +
    ' ' +
    -l.height / 2 +
    ') scale(' +
    sx +
    ' ' +
    sy +
    ') translate(' +
    -b.x1 +
    ' ' +
    -b.y1 +
    ')"><path d="' +
    pathData +
    '" fill="' +
    l.color +
    '"/></g>'
  );
}
export async function surfaceSvg(
  s: PrintSurface,
  layers: ArtworkLayer[],
  resolver: ArtworkResolver,
  pixelWidth: number,
  view?: { x: number; y: number; width: number; height: number },
): Promise<string> {
  let content = '';
  for (const l of layers) {
    content +=
      '<g opacity="' +
      l.opacity +
      '" transform="translate(' +
      (s.width / 2 + l.x) +
      ' ' +
      (s.height / 2 + l.y) +
      ') rotate(' +
      l.rotation +
      ')">' +
      (await layerSvg(l, resolver)) +
      '</g>';
  }
  const v = view ?? { x: 0, y: 0, width: s.width, height: s.height };
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    pixelWidth +
    '" height="' +
    Math.round((pixelWidth * v.height) / v.width) +
    '" viewBox="' +
    [v.x, v.y, v.width, v.height].join(' ') +
    '">' +
    content +
    '</svg>'
  );
}
