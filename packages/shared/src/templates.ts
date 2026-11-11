import type { ProductTemplate, RoomProject } from './contracts';

const rates = {
  boardM2: 420000,
  edgeMeter: 6500,
  door: 85000,
  drawer: 125000,
  printCm2: 18,
  minimumPrint: 25000,
};
function fashion(
  id: string,
  name: string,
  category: string,
  kind: ProductTemplate['modelKind'],
  price: number,
  color: string,
  width = 600,
  height = 720,
): ProductTemplate {
  return {
    id,
    name,
    slug: id,
    category,
    studio: 'fashion',
    description:
      'Pilih warna, ukuran, dan artwork. Template awal original; validasi ukuran cetak dengan tim produksi.',
    modelKind: kind,
    color,
    basePrice: price,
    sizes:
      kind === 'shoe'
        ? ['38', '39', '40', '41', '42', '43', '44']
        : kind === 'cap' || kind === 'bag'
          ? ['One Size']
          : ['S', 'M', 'L', 'XL', 'XXL'],
    dimensions: { width, height, depth: kind === 'shoe' ? 300 : 140 },
    surfaces: [
      {
        id: 'front',
        label: kind === 'shoe' ? 'Sisi luar' : 'Depan',
        width: kind === 'cap' ? 120 : kind === 'shoe' ? 160 : kind === 'pants' ? 120 : 280,
        height: kind === 'cap' ? 60 : kind === 'shoe' ? 60 : kind === 'pants' ? 180 : 320,
        face: 'front',
        centerX: kind === 'pants' ? -width / 4 : 0,
        centerY: kind === 'cap' ? 30 : 0,
      },
      {
        id: 'back',
        label: 'Belakang',
        width: kind === 'cap' ? 80 : kind === 'pants' ? 120 : 250,
        height: kind === 'cap' ? 40 : kind === 'pants' ? 180 : 300,
        face: 'back',
        centerX: kind === 'pants' ? -width / 4 : 0,
        centerY: kind === 'cap' ? 40 : 0,
      },
    ],
    active: true,
    demo: true,
    rates,
  };
}
function interior(
  id: string,
  name: string,
  category: string,
  kind: ProductTemplate['modelKind'],
  width: number,
  height: number,
  depth: number,
  color: string,
): ProductTemplate {
  return {
    id,
    name,
    slug: id,
    category,
    studio: 'interior',
    description:
      'Furnitur parametrik sesuai ruangmu. Atur ukuran, finishing, dan detail sebelum konsultasi produksi.',
    modelKind: kind,
    color,
    basePrice: 250000,
    sizes: [],
    dimensions: { width, height, depth },
    surfaces: [
      { id: 'front', label: 'Permukaan depan', width, height, face: 'front' },
      { id: 'left', label: 'Sisi kiri', width: depth, height, face: 'left' },
      { id: 'right', label: 'Sisi kanan', width: depth, height, face: 'right' },
      { id: 'top', label: 'Permukaan atas', width, height: depth, face: 'top' },
    ],
    active: true,
    demo: true,
    rates,
  };
}
export const starterTemplates: ProductTemplate[] = [
  fashion('everyday-tee', 'Everyday Tee', 'Baju', 'shirt', 95000, '#e6dfd2'),
  fashion('essential-hoodie', 'Essential Hoodie', 'Hoodie', 'hoodie', 225000, '#638177', 650, 760),
  fashion('utility-jacket', 'Utility Jacket', 'Jaket', 'jacket', 285000, '#b3a187', 650, 760),
  fashion('daily-pants', 'Daily Pants', 'Celana', 'pants', 195000, '#596365', 450, 1000),
  fashion('signature-cap', 'Signature Cap', 'Topi', 'cap', 85000, '#b47654', 240, 180),
  fashion('canvas-sneaker', 'Canvas Sneaker', 'Sepatu', 'shoe', 325000, '#ded9cf', 320, 140),
  fashion('canvas-tote', 'Canvas Tote', 'Aksesori Fashion', 'bag', 75000, '#c9b896', 400, 420),
  interior('modular-wardrobe', 'Modular Wardrobe', 'Lemari', 'cabinet', 1800, 2200, 600, '#bb9670'),
  interior('open-bookshelf', 'Open Bookshelf', 'Rak', 'shelf', 1200, 1800, 350, '#dcc9aa'),
  interior('work-desk', 'Work Desk', 'Meja', 'desk', 1400, 750, 650, '#bb9670'),
  interior('low-sideboard', 'Low Sideboard', 'Kabinet', 'sideboard', 1800, 700, 450, '#7d8a81'),
  interior('custom-door', 'Custom Door', 'Pintu', 'door', 850, 2100, 40, '#bb9670'),
  interior(
    'feature-panel',
    'Feature Wall Panel',
    'Panel & Dekorasi',
    'panel',
    1200,
    2400,
    40,
    '#c5b295',
  ),
];
export const defaultRoom: RoomProject = {
  name: 'Ruang kreatifku',
  height: 2800,
  floorColor: '#c6b69e',
  wallColor: '#eee9df',
  points: [
    { x: 0, y: 0 },
    { x: 5000, y: 0 },
    { x: 5000, y: 4000 },
    { x: 0, y: 4000 },
  ],
  partitions: [],
  openings: [],
  items: [],
};
