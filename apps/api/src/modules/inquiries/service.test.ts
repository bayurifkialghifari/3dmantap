import { test, expect } from 'bun:test';
import { createDesign, starterTemplates, type Inquiry } from '@3dmantap/shared';
import { approve, startProduction, advanceStatus, requireInquiryAccess } from './service';
const fixture = (): Inquiry => ({
  id: 'i',
  code: 'QA',
  customerName: 'Customer',
  phone: '081234567890',
  address: '',
  notes: '',
  consultation: [],
  createdAt: '',
  updatedAt: '',
  estimate: {
    base: 100000,
    material: 0,
    hardware: 0,
    artwork: 0,
    unit: 100000,
    quantity: 1,
    total: 100000,
  },
  ownerId: 'guest:owner',
  accessToken: 'private',
  previewToken: 'view',
  template: starterTemplates[0],
  document: createDesign(starterTemplates[0]),
  revision: 2,
  approvedRevision: null,
  status: 'awaiting_approval',
  quote: {
    total: 100000,
    requiredPayment: 50000,
    shipping: 10000,
    installation: 0,
    fulfillment: 'shipping',
    leadDays: 7,
    notes: 'approved specs',
    adminApproved: true,
  },
  payments: [],
});
test('read-only preview token never grants private inquiry access', () => {
  expect(() => requireInquiryAccess(fixture(), 'other', 'view', 'guest')).toThrow(
    'Pengajuan ini bersifat privat',
  );
  expect(() => requireInquiryAccess(fixture(), 'other', 'private', 'guest')).not.toThrow();
});
test('stale revisions cannot approve and unpaid approved quote cannot start', () => {
  const i = fixture();
  expect(() => approve(i, 1)).toThrow();
  approve(i, 2);
  expect(i.status).toBe('awaiting_payment');
  expect(() => startProduction(i)).toThrow('Pembayaran praproduksi belum terverifikasi');
});
test('shipment requires full balance and respects forward state transitions', () => {
  const i = fixture();
  approve(i, 2);
  i.payments = [
    { id: 'p', assetId: 'a', amount: 50000, revision: 2, verified: true, createdAt: '' },
  ];
  startProduction(i);
  advanceStatus(i, 'ready');
  expect(() => advanceStatus(i, 'shipped')).toThrow('Pelunasan belum terverifikasi');
  i.payments[0].amount = 110000;
  advanceStatus(i, 'shipped');
  advanceStatus(i, 'completed');
  expect(() => advanceStatus(i, 'production')).toThrow();
});
