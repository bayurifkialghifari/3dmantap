import { z } from 'zod';

export const studioSchema = z.enum(['fashion', 'interior']);
export type Studio = z.infer<typeof studioSchema>;
export const dimensionsSchema = z.object({
  width: z.number().min(100).max(6000),
  height: z.number().min(100).max(4000),
  depth: z.number().min(10).max(1500),
});
export type Dimensions = z.infer<typeof dimensionsSchema>;
export const surfaceSchema = z.object({
  id: z.string(),
  label: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  face: z.enum(['front', 'back', 'left', 'right', 'top']),
  meshName: z.string().optional(),
  centerX: z.number().optional(),
  centerY: z.number().optional(),
});
export type PrintSurface = z.infer<typeof surfaceSchema>;
export const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  slug: z.string(),
  category: z.string(),
  studio: studioSchema,
  description: z.string(),
  modelKind: z.enum([
    'shirt',
    'hoodie',
    'jacket',
    'pants',
    'cap',
    'shoe',
    'bag',
    'cabinet',
    'shelf',
    'desk',
    'door',
    'panel',
    'sideboard',
  ]),
  glbAssetId: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  basePrice: z.number().int().nonnegative(),
  sizes: z.array(z.string()),
  dimensions: dimensionsSchema,
  surfaces: z.array(surfaceSchema),
  active: z.boolean(),
  demo: z.boolean(),
  rates: z.object({
    boardM2: z.number().nonnegative(),
    edgeMeter: z.number().nonnegative(),
    door: z.number().nonnegative(),
    drawer: z.number().nonnegative(),
    printCm2: z.number().nonnegative(),
    minimumPrint: z.number().nonnegative(),
  }),
});
export type ProductTemplate = z.infer<typeof templateSchema>;
export const layerSchema = z.object({
  id: z.string(),
  kind: z.enum(['text', 'image']),
  surfaceId: z.string(),
  text: z.string().max(200).default(''),
  assetId: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  font: z.enum(['sans', 'serif', 'mono']).default('sans'),
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive().max(6000),
  height: z.number().positive().max(4000),
  rotation: z.number().min(-360).max(360),
  opacity: z.number().min(0).max(1),
});
export type ArtworkLayer = z.infer<typeof layerSchema>;
export const designSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.string(),
  name: z.string().min(1).max(120),
  dimensions: dimensionsSchema,
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  material: z.enum(['oak', 'walnut', 'white', 'graphite', 'fabric']),
  size: z.string(),
  columns: z.number().int().min(1).max(8),
  shelves: z.number().int().min(0).max(8),
  doors: z.number().int().min(0).max(8),
  drawers: z.number().int().min(0).max(8),
  layers: z.array(layerSchema).max(40),
  quantity: z.number().int().min(1).max(10000),
  variants: z
    .array(z.object({ size: z.string(), quantity: z.number().int().min(1).max(10000) }))
    .max(30)
    .default([]),
});
export type DesignDocument = z.infer<typeof designSchema>;
export type Panel = {
  id: string;
  name: string;
  width: number;
  height: number;
  thickness: number;
  quantity: number;
  position: [number, number, number];
  rotation: [number, number, number];
};
export type PriceBreakdown = {
  base: number;
  material: number;
  hardware: number;
  artwork: number;
  unit: number;
  quantity: number;
  total: number;
};
export const roomSchema = z.object({
  name: z.string().min(1).max(120),
  height: z.number().min(2000).max(6000),
  floorColor: z.string(),
  wallColor: z.string(),
  points: z
    .array(z.object({ x: z.number().min(-20000).max(20000), y: z.number().min(-20000).max(20000) }))
    .min(3)
    .max(30),
  partitions: z
    .array(
      z.object({ id: z.string(), x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() }),
    )
    .max(40),
  openings: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(['door', 'window']),
        wall: z.number().int().min(0),
        offset: z.number().nonnegative(),
        width: z.number().min(300).max(4000),
        height: z.number().min(300).max(3000),
      }),
    )
    .max(40),
  items: z
    .array(
      z.object({
        id: z.string(),
        document: designSchema,
        x: z.number(),
        y: z.number(),
        rotation: z.number(),
      }),
    )
    .max(60),
});
export type RoomProject = z.infer<typeof roomSchema>;
export const statuses = [
  'submitted',
  'consulting',
  'awaiting_approval',
  'awaiting_payment',
  'production',
  'ready',
  'shipped',
  'completed',
  'cancelled',
] as const;
export type InquiryStatus = (typeof statuses)[number];
export const statusLabels: Record<InquiryStatus, string> = {
  submitted: 'Pengajuan diterima',
  consulting: 'Konsultasi',
  awaiting_approval: 'Menunggu persetujuan',
  awaiting_payment: 'Menunggu pembayaran',
  production: 'Dalam produksi',
  ready: 'Siap dikirim / diambil',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};
export const quoteSchema = z
  .object({
    total: z.number().int().positive(),
    requiredPayment: z.number().int().positive(),
    shipping: z.number().int().nonnegative(),
    installation: z.number().int().nonnegative(),
    fulfillment: z.enum(['shipping', 'pickup']),
    leadDays: z.number().int().min(1).max(365),
    notes: z.string().max(5000),
    adminApproved: z.literal(true),
  })
  .refine(
    (q) => q.requiredPayment <= q.total + q.shipping + q.installation,
    'DP tidak boleh melebihi total',
  );
export type Quote = z.infer<typeof quoteSchema>;
export type PaymentRecord = {
  id: string;
  assetId: string;
  amount: number;
  revision: number;
  verified: boolean;
  createdAt: string;
};
export type ConsultationNote = {
  id: string;
  text: string;
  createdAt: string;
  kind: 'note' | 'progress';
  assetId?: string;
};
export type Inquiry = {
  id: string;
  code: string;
  ownerId: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  document: DesignDocument;
  template: ProductTemplate;
  estimate: PriceBreakdown;
  status: InquiryStatus;
  revision: number;
  quote: Quote | null;
  approvedRevision: number | null;
  history?: {
    revision: number;
    document: DesignDocument;
    quote: Quote | null;
    recordedAt: string;
  }[];
  payments: PaymentRecord[];
  consultation: ConsultationNote[];
  accessToken: string;
  previewToken: string;
  createdAt: string;
  updatedAt: string;
};
export type BusinessSettings = {
  name: string;
  whatsapp: string;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
  address: string;
  announcement: string;
};
export type SavedDesign = {
  id: string;
  name: string;
  document: DesignDocument;
  shareToken: string;
  updatedAt: string;
};
