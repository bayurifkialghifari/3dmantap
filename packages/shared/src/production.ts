import type { Inquiry } from './contracts';
import { validateDesign } from './design';

export function productionBlockers(inquiry: Inquiry): string[] {
  const issues = validateDesign(inquiry.template, inquiry.document);
  if (!inquiry.quote?.adminApproved)
    issues.push('Admin belum mengonfirmasi spesifikasi dan penawaran.');
  if (inquiry.approvedRevision !== inquiry.revision)
    issues.push('Pelanggan belum menyetujui revisi terbaru.');
  const paid = inquiry.payments
    .filter((p) => p.verified && p.revision === inquiry.revision)
    .reduce((n, p) => n + p.amount, 0);
  if (!inquiry.quote || paid < inquiry.quote.requiredPayment)
    issues.push('Pembayaran praproduksi belum terverifikasi.');
  if (inquiry.status === 'cancelled') issues.push('Pesanan dibatalkan.');
  return issues;
}
export const mmToPixels = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
export function whatsappLink(number: string, text: string): string | null {
  const normalized = number.replace(/[^0-9]/g, '').replace(/^0/, '62');
  return normalized.length >= 9 && normalized.length <= 15
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`
    : null;
}
