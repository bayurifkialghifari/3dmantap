import { designSchema } from './contracts';
import { roomAttachmentIssues } from './room-placement';
import type {
  DesignDocument,
  ProductTemplate,
  Panel,
  PrintSurface,
  PriceBreakdown,
  ArtworkLayer,
  RoomProject,
} from './contracts';

export function createDesign(template: ProductTemplate): DesignDocument {
  return {
    schemaVersion: 1,
    templateId: template.id,
    name: template.name,
    dimensions: { ...template.dimensions },
    color: template.color,
    accentColor: '#eee9df',
    material: template.studio === 'fashion' ? 'fabric' : 'oak',
    size: template.sizes[1] ?? template.sizes[0] ?? '',
    columns: template.modelKind === 'desk' ? 1 : 3,
    shelves: template.modelKind === 'shelf' ? 4 : 2,
    doors: template.modelKind === 'cabinet' ? 3 : template.modelKind === 'sideboard' ? 2 : 0,
    drawers: 0,
    layers: [],
    quantity: 1,
    variants: [],
  };
}
export function surfacesFor(template: ProductTemplate, d: DesignDocument): PrintSurface[] {
  if (template.studio === 'fashion') return template.surfaces;
  const base = template.surfaces
    .filter(
      (s) => s.face !== 'front' || !['cabinet', 'shelf', 'sideboard'].includes(template.modelKind),
    )
    .map((s) => ({
      ...s,
      meshName:
        s.meshName ?? (template.glbAssetId ? undefined : s.face === 'front' ? 'surface' : s.face),
      width: s.face === 'left' || s.face === 'right' ? d.dimensions.depth : d.dimensions.width,
      height: s.face === 'top' ? d.dimensions.depth : d.dimensions.height,
    }));
  if (['cabinet', 'shelf', 'sideboard'].includes(template.modelKind)) {
    const front = furniturePanels(template, d)
      .filter((p) => p.id.startsWith('door-') || p.id.startsWith('drawer-front-'))
      .map((p) => ({
        id: p.id,
        label: p.name + ' ' + (Number(p.id.split('-').at(-1)) + 1),
        width: p.width,
        height: p.height,
        face: 'front' as const,
        meshName: template.glbAssetId ? undefined : p.id,
        centerX: p.position[0],
        centerY: d.dimensions.height / 2 - p.position[1],
      }));
    return [...front, ...base];
  }
  return base;
}
export function artworkBounds(layer: ArtworkLayer) {
  const angle = (layer.rotation * Math.PI) / 180;
  const halfW =
    (Math.abs(Math.cos(angle)) * layer.width + Math.abs(Math.sin(angle)) * layer.height) / 2;
  const halfH =
    (Math.abs(Math.sin(angle)) * layer.width + Math.abs(Math.cos(angle)) * layer.height) / 2;
  return {
    left: layer.x - halfW,
    right: layer.x + halfW,
    top: layer.y - halfH,
    bottom: layer.y + halfH,
  };
}
export function validateDesign(template: ProductTemplate, d: DesignDocument): string[] {
  const issues: string[] = [];
  const parsed = designSchema.safeParse(d);
  if (!parsed.success) return parsed.error.issues.map((i) => i.message);
  if (d.templateId !== template.id) issues.push('Template desain tidak cocok.');
  if (template.studio === 'fashion' && !template.sizes.includes(d.size))
    issues.push('Ukuran tidak tersedia pada template.');
  if (d.variants.some((v) => !template.sizes.includes(v.size)))
    issues.push('Varian ukuran tidak tersedia.');
  if (
    template.studio === 'interior' &&
    ['cabinet', 'shelf', 'sideboard'].includes(template.modelKind)
  ) {
    if (d.dimensions.width / d.columns < 180) issues.push('Lebar setiap kolom minimal 18 cm.');
    if ((d.dimensions.height - 36 - d.shelves * 18) / (d.shelves + 1) < 100)
      issues.push('Jarak antar ambalan minimal 10 cm.');
    if (
      d.drawers > 0 &&
      d.shelves > 0 &&
      (d.dimensions.height - 18 - (d.drawers * 180 + 40) - d.shelves * 18) / (d.shelves + 1) < 100
    )
      issues.push('Ruang ambalan di atas laci minimal 10 cm.');
    if (d.drawers * 180 + 40 > d.dimensions.height)
      issues.push('Laci tidak muat pada tinggi furnitur.');
    if (d.drawers > 0 && d.doors >= d.columns)
      issues.push('Sisakan satu kolom tanpa pintu untuk laci.');
    if (d.doors > d.columns) issues.push('Jumlah pintu tidak boleh melebihi kolom.');
  }
  for (const layer of d.layers) {
    const s = surfacesFor(template, d).find((s) => s.id === layer.surfaceId);
    if (!s) {
      issues.push('Area cetak tidak ditemukan.');
      continue;
    }
    const b = artworkBounds(layer);
    if (
      b.left < -s.width / 2 - 0.01 ||
      b.right > s.width / 2 + 0.01 ||
      b.top < -s.height / 2 - 0.01 ||
      b.bottom > s.height / 2 + 0.01
    )
      issues.push(`Artwork keluar dari area ${s.label}.`);
    if (layer.kind === 'image' && !layer.assetId) issues.push('File artwork belum tersedia.');
    if (layer.kind === 'text' && !layer.text.trim()) issues.push('Teks artwork masih kosong.');
  }
  return [...new Set(issues)];
}
export function furniturePanels(template: ProductTemplate, d: DesignDocument): Panel[] {
  if (template.studio !== 'interior') return [];
  const { width: w, height: h, depth: dep } = d.dimensions;
  const t = 18;
  const panels: Panel[] = [];
  const add = (
    id: string,
    name: string,
    width: number,
    height: number,
    position: Panel['position'],
    rotation: Panel['rotation'] = [0, 0, 0],
    thickness = t,
  ) =>
    panels.push({
      id,
      name,
      width: Math.round(width),
      height: Math.round(height),
      thickness,
      quantity: 1,
      position,
      rotation,
    });
  if (template.modelKind === 'door' || template.modelKind === 'panel') {
    add('surface', 'Panel utama', w, h, [0, h / 2, 0], [0, 0, 0], dep);
    return panels;
  }
  if (template.modelKind === 'desk') {
    add('top', 'Permukaan meja', w, dep, [0, h - t / 2, 0], [-Math.PI / 2, 0, 0]);
    for (const sign of [-1, 1])
      add(
        `leg-${sign}`,
        'Panel kaki',
        dep,
        h - t,
        [sign * (w / 2 - t / 2), (h - t) / 2, 0],
        [0, Math.PI / 2, 0],
      );
    add('brace', 'Penguat belakang', w - 2 * t, 200, [0, h - 180, -dep / 2 + t / 2]);
    return panels;
  }
  add('left', 'Sisi kiri', dep, h, [-w / 2 + t / 2, h / 2, 0], [0, Math.PI / 2, 0]);
  add('right', 'Sisi kanan', dep, h, [w / 2 - t / 2, h / 2, 0], [0, Math.PI / 2, 0]);
  add('bottom', 'Dasar', w - 2 * t, dep, [0, t / 2, 0], [-Math.PI / 2, 0, 0]);
  add('top', 'Atas', w - 2 * t, dep, [0, h - t / 2, 0], [-Math.PI / 2, 0, 0]);
  add('back', 'Panel belakang', w - 2 * t, h - 2 * t, [0, h / 2, -dep / 2 + 3], [0, 0, 0], 6);
  const cw = (w - t * (d.columns + 1)) / d.columns;
  for (let c = 1; c < d.columns; c++)
    add(
      `divider-${c}`,
      'Sekat vertikal',
      dep - t,
      h - 2 * t,
      [-w / 2 + t + c * (cw + t) - t / 2, h / 2, 0],
      [0, Math.PI / 2, 0],
    );
  for (let c = 0; c < d.columns; c++) {
    const bottom = c === 0 && d.drawers > 0 ? d.drawers * 180 + 40 : t;
    for (let r = 1; r <= d.shelves; r++)
      add(
        `shelf-${c}-${r}`,
        'Ambalan',
        cw,
        dep - t,
        [-w / 2 + t + cw / 2 + c * (cw + t), bottom + (r * (h - t - bottom)) / (d.shelves + 1), 0],
        [-Math.PI / 2, 0, 0],
      );
  }
  for (let c = 0; c < d.doors; c++)
    add(`door-${c}`, 'Pintu', cw - 3, h - 6, [
      -w / 2 + t + cw / 2 + (c + (d.drawers > 0 ? 1 : 0)) * (cw + t),
      h / 2,
      dep / 2 + t / 2,
    ]);
  for (let r = 0; r < d.drawers; r++) {
    const x = -w / 2 + t + cw / 2;
    const y = 120 + r * 180;
    add(`drawer-front-${r}`, 'Muka laci', cw - 3, 160, [x, y, dep / 2 + t / 2]);
    add(
      `drawer-base-${r}`,
      'Dasar laci',
      Math.max(80, cw - 36),
      Math.max(50, dep - 70),
      [x, y - 70, 0],
      [-Math.PI / 2, 0, 0],
      6,
    );
    for (const sign of [-1, 1])
      add(
        `drawer-side-${r}-${sign}`,
        'Sisi laci',
        Math.max(50, dep - 70),
        140,
        [x + sign * (cw / 2 - 27), y, 0],
        [0, Math.PI / 2, 0],
      );
    add(`drawer-back-${r}`, 'Belakang laci', Math.max(80, cw - 36), 140, [x, y, -dep / 2 + 45]);
  }
  return panels;
}
export function priceDesign(template: ProductTemplate, d: DesignDocument): PriceBreakdown {
  const panels = furniturePanels(template, d);
  const material = Math.round(
    panels.reduce(
      (sum, p) =>
        sum +
        ((p.width * p.height) / 1e6) * template.rates.boardM2 +
        (((p.width + p.height) * 2) / 1000) * template.rates.edgeMeter,
      0,
    ),
  );
  const hardware =
    template.studio === 'interior'
      ? d.doors * template.rates.door + d.drawers * template.rates.drawer
      : 0;
  const artwork = d.layers.length
    ? Math.round(
        Math.max(
          template.rates.minimumPrint,
          d.layers.reduce(
            (sum, l) => sum + ((l.width * l.height) / 100) * template.rates.printCm2,
            0,
          ),
        ),
      )
    : 0;
  const unit = template.basePrice + material + hardware + artwork;
  const quantity = d.variants.length ? d.variants.reduce((n, v) => n + v.quantity, 0) : d.quantity;
  return {
    base: template.basePrice,
    material,
    hardware,
    artwork,
    unit,
    quantity,
    total: unit * quantity,
  };
}
export const rupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
export function validRoom(room: RoomProject): string[] {
  const issues: string[] = roomAttachmentIssues(room);
  let area = 0;
  room.points.forEach((p, i) => {
    const n = room.points[(i + 1) % room.points.length];
    area += p.x * n.y - n.x * p.y;
    if (Math.hypot(n.x - p.x, n.y - p.y) < 300) issues.push('Dinding minimal 30 cm.');
  });
  if (Math.abs(area) < 2e6) issues.push('Luas ruangan minimal 1 m².');
  const cross = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number },
  ) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (let i = 0; i < room.points.length; i++)
    for (let j = i + 2; j < room.points.length; j++) {
      if (i === 0 && j === room.points.length - 1) continue;
      const a = room.points[i],
        b = room.points[(i + 1) % room.points.length],
        c = room.points[j],
        d = room.points[(j + 1) % room.points.length];
      if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0)
        issues.push('Dinding ruangan tidak boleh berpotongan.');
    }
  for (const o of room.openings) {
    const a = room.points[o.wall],
      b = room.points[(o.wall + 1) % room.points.length];
    if (
      !a ||
      !b ||
      o.offset + o.width > Math.hypot(b.x - a.x, b.y - a.y) ||
      o.height + (o.kind === 'window' ? 900 : 0) > room.height
    )
      issues.push('Bukaan keluar dari batas dinding.');
  }
  return [...new Set(issues)];
}
