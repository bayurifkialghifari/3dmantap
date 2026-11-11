import type { Inquiry } from '@3dmantap/shared';
import { productionBlockers, validateDesign } from '@3dmantap/shared';
import { fail } from '../../lib/http';
export function requireInquiryAccess(i: Inquiry, ownerId: string, token: string, role: string) {
  if (role !== 'admin' && i.ownerId !== ownerId && i.accessToken !== token)
    fail('Pengajuan ini bersifat privat', 403);
}
export function requireEditable(i: Inquiry) {
  if (['production', 'ready', 'shipped', 'completed', 'cancelled'].includes(i.status))
    fail('Revisi tidak dapat dilakukan pada status ini', 409);
}
export function archiveRevision(i: Inquiry) {
  (i.history ??= []).push({
    revision: i.revision,
    document: structuredClone(i.document),
    quote: i.quote ? structuredClone(i.quote) : null,
    recordedAt: new Date().toISOString(),
  });
}
export function approve(i: Inquiry, revision: number) {
  if (i.revision !== revision || i.status !== 'awaiting_approval' || !i.quote?.adminApproved)
    fail('Penawaran berubah. Muat revisi terbaru.', 409);
  const issues = validateDesign(i.template, i.document);
  if (issues.length) fail(issues.join(' '), 422);
  i.approvedRevision = revision;
  i.status = 'awaiting_payment';
}
export function startProduction(i: Inquiry) {
  if (i.status !== 'awaiting_payment') fail('Status belum siap produksi', 409);
  const issues = productionBlockers(i);
  if (issues.length) fail(issues.join(' '), 409);
  i.status = 'production';
}
export function advanceStatus(i: Inquiry, status: Inquiry['status']) {
  const allowed: Partial<Record<Inquiry['status'], Inquiry['status'][]>> = {
    submitted: ['consulting', 'cancelled'],
    consulting: ['cancelled'],
    awaiting_approval: ['cancelled'],
    awaiting_payment: ['cancelled'],
    production: ['ready'],
    ready: ['shipped', 'completed'],
    shipped: ['completed'],
  };
  if (!allowed[i.status]?.includes(status)) fail('Perubahan status tidak diizinkan', 409);
  if ((status === 'shipped' || status === 'completed') && i.quote) {
    const paid = i.payments
      .filter((p) => p.verified && p.revision === i.revision)
      .reduce((n, p) => n + p.amount, 0);
    if (paid < i.quote.total + i.quote.shipping + i.quote.installation)
      fail('Pelunasan belum terverifikasi', 409);
  }
  i.status = status;
}
