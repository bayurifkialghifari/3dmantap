import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { parse, type Font } from 'opentype.js';
import sharp from 'sharp';
import { zipSync, strToU8 } from 'fflate';
import { join } from 'node:path';
import {
  furniturePanels,
  surfacesFor,
  mmToPixels,
  productionBlockers,
  surfaceSvg,
  artworkBounds,
  artworkFonts,
  type Inquiry,
  type ArtworkResolver,
} from '@3dmantap/shared';
import { db } from '../../db/client';
import { assets } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { config, root } from '../../config';
const fonts = new Map<string, Font>();
export async function exportPacket(i: Inquiry): Promise<Uint8Array> {
  const blockers = productionBlockers(i);
  if (blockers.length) throw new Error(blockers.join(' '));
  const files: Record<string, Uint8Array> = {};
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let page = pdf.addPage([595, 842]),
    y = 800;
  const line = (text: string, size = 11) => {
    if (y < 50) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
    page.drawText(text.replace(/[^\x20-\x7E]/g, '?'), {
      x: 40,
      y,
      size,
      font,
      color: rgb(0.1, 0.15, 0.13),
    });
    y -= size + 8;
  };
  line('3DMantap | PRODUCTION PACKET', 20);
  line(i.code + ' / approved revision ' + i.revision);
  line(i.document.name, 16);
  line('Customer: ' + i.customerName);
  line('Quantity: ' + i.estimate.quantity + ' | Size: ' + i.document.size);
  line('Dimensions (mm): ' + Object.values(i.document.dimensions).join(' x '));
  line('Color: ' + i.document.color + ' | Material: ' + i.document.material);
  line('Final quote IDR: ' + i.quote!.total);
  line('Lead days: ' + i.quote!.leadDays);
  line('Fulfillment: ' + i.quote!.fulfillment);
  line('Notes: ' + i.quote!.notes.slice(0, 90));
  for (const v of i.document.variants) line('Size ' + v.size + ': ' + v.quantity + ' pieces');
  files['approved-design.json'] = strToU8(
    JSON.stringify(
      { revision: i.revision, document: i.document, template: i.template, quote: i.quote },
      null,
      2,
    ),
  );
  const panels = furniturePanels(i.template, i.document);
  if (panels.length) {
    line('Furniture cutting list (millimeters)', 15);
    const rows = [
      [
        'Panel ID',
        'Part',
        'Width mm',
        'Height mm',
        'Thickness mm',
        'Qty',
        'Center X mm',
        'Center Y mm',
        'Center Z mm',
      ],
      ...panels.map((p) => [
        p.id,
        p.name,
        p.width,
        p.height,
        p.thickness,
        p.quantity,
        ...p.position,
      ]),
    ];
    files['cut-list.csv'] = strToU8(
      rows
        .map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(','))
        .join('\r\n'),
    );
    for (const p of panels)
      line(p.id + ': ' + p.name + ' / ' + p.width + ' x ' + p.height + ' x ' + p.thickness + ' mm');
    line('Hardware: ' + i.document.doors + ' door sets, ' + i.document.drawers + ' drawer sets');
    const drawing = pdf.addPage([595, 842]);
    drawing.drawText('Front assembly reference (mm)', { x: 40, y: 800, size: 16, font });
    const scale = Math.min(500 / i.document.dimensions.width, 620 / i.document.dimensions.height);
    const w = i.document.dimensions.width,
      h = i.document.dimensions.height;
    drawing.drawRectangle({
      x: 45,
      y: 100,
      width: w * scale,
      height: h * scale,
      borderColor: rgb(0.3, 0.5, 0.3),
      borderWidth: 1,
    });
    for (const p of panels.filter((p) => p.id !== 'back')) {
      const panelWidth = Math.abs(p.rotation[1]) > 1 ? p.thickness : p.width;
      const panelHeight = Math.abs(p.rotation[0]) > 1 ? p.thickness : p.height;
      const x = 45 + (p.position[0] + w / 2 - panelWidth / 2) * scale;
      const panelY = 100 + (p.position[1] - panelHeight / 2) * scale;
      drawing.drawRectangle({
        x,
        y: panelY,
        width: panelWidth * scale,
        height: panelHeight * scale,
        borderWidth: 0.6,
        borderColor: rgb(0.5, 0.6, 0.4),
      });
      if (p.id.startsWith('door-') || p.id.startsWith('drawer-front-'))
        drawing.drawText(p.id, { x: x + 4, y: panelY + (panelHeight * scale) / 2, size: 8, font });
    }
    drawing.drawText('W ' + w + ' / H ' + h + ' / D ' + i.document.dimensions.depth, {
      x: 45,
      y: 75,
      size: 11,
      font,
    });
    drawing.drawText('Follow cut-list.csv and approved-design.json for exact construction.', {
      x: 45,
      y: 55,
      size: 9,
      font,
    });
  }
  const resolver: ArtworkResolver = {
    async font(name) {
      const filename = artworkFonts[name];
      if (!fonts.has(filename))
        fonts.set(
          filename,
          parse(
            await Bun.file(
              join(root, 'apps/web/public/fonts/artwork', filename + '.ttf'),
            ).arrayBuffer(),
          ),
        );
      return fonts.get(filename)!;
    },
    async image(id) {
      const [a] = await db.select().from(assets).where(eq(assets.id, id));
      if (!a) throw new Error('Artwork asset missing');
      const buffer = await Bun.file(join(config.uploadDir, a.id)).arrayBuffer();
      files['sources/' + a.id + '-' + a.name.replace(/[^a-zA-Z0-9._-]/g, '_')] = new Uint8Array(
        buffer,
      );
      return 'data:' + a.mime + ';base64,' + Buffer.from(buffer).toString('base64');
    },
  };
  const printManifest: {
    surface: string;
    filename: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  for (const s of surfacesFor(i.template, i.document)) {
    const layers = i.document.layers.filter((l) => l.surfaceId === s.id);
    if (!layers.length) continue;
    const bounds = layers.map(artworkBounds);
    const left = Math.max(0, Math.min(...bounds.map((b) => b.left)) + s.width / 2);
    const top = Math.max(0, Math.min(...bounds.map((b) => b.top)) + s.height / 2);
    const right = Math.min(s.width, Math.max(...bounds.map((b) => b.right)) + s.width / 2);
    const bottom = Math.min(s.height, Math.max(...bounds.map((b) => b.bottom)) + s.height / 2);
    // Crop transparent margins; tile large artwork to keep 300-DPI processing bounded.
    let tile = 0;
    for (let x = left; x < right; x += 500)
      for (let yy = top; yy < bottom; yy += 500) {
        const view = {
          x,
          y: yy,
          width: Math.min(500, right - x),
          height: Math.min(500, bottom - yy),
        };
        const filename = s.id + '-' + ++tile;
        const svg = await surfaceSvg(s, layers, resolver, mmToPixels(view.width), view);
        files['artwork/' + filename + '.svg'] = strToU8(svg);
        const png = await sharp(Buffer.from(svg), { limitInputPixels: 40000000 })
          .png()
          .withMetadata({ density: 300 })
          .toBuffer();
        files['artwork/' + filename + '-300dpi.png'] = png;
        const artPdf = await PDFDocument.create();
        const artPage = artPdf.addPage([(view.width * 72) / 25.4, (view.height * 72) / 25.4]);
        const image = await artPdf.embedPng(png);
        artPage.drawImage(image, {
          x: 0,
          y: 0,
          width: artPage.getWidth(),
          height: artPage.getHeight(),
        });
        files['artwork/' + filename + '-actual-size.pdf'] = await artPdf.save();
        printManifest.push({
          surface: s.id,
          filename,
          x: x - s.width / 2,
          y: yy - s.height / 2,
          width: view.width,
          height: view.height,
        });
      }
    line('Print area ' + s.label + ': ' + s.width + ' x ' + s.height + ' mm, 300 DPI', 13);
    for (const l of layers)
      line(
        'Layer ' +
          l.id.slice(0, 8) +
          ': center ' +
          l.x +
          ',' +
          l.y +
          ' mm; ' +
          l.width +
          ' x ' +
          l.height +
          ' mm; rotate ' +
          l.rotation,
      );
  }
  files['production-sheet.pdf'] = await pdf.save();
  files['manifest.json'] = strToU8(
    JSON.stringify(
      {
        code: i.code,
        revision: i.revision,
        approvedRevision: i.approvedRevision,
        units: 'mm',
        dpi: 300,
        surfaces: surfacesFor(i.template, i.document),
        panels,
        coordinates: {
          panel:
            'X from product center, Y from floor, Z toward front; millimeters; rotations in radians',
          artwork: 'X right, Y down from print surface center; millimeters; rotations in degrees',
        },
        printTiles: printManifest,
        generatedAt: new Date().toISOString(),
        files: Object.keys(files),
      },
      null,
      2,
    ),
  );
  return zipSync(files, { level: 6 });
}
