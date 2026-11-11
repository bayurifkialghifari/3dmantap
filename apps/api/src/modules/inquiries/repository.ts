import { eq } from 'drizzle-orm';
import type { Inquiry } from '@3dmantap/shared';
import { db } from '../../db/client';
import { inquiries, audit, jobs } from '../../db/schema';
import { startProduction } from './service';
import { fail } from '../../lib/http';
export async function findInquiry(id: string) {
  const [row] = await db.select().from(inquiries).where(eq(inquiries.id, id));
  if (!row) fail('Pengajuan tidak ditemukan', 404);
  return row.data;
}
export async function changeInquiry(
  id: string,
  actorId: string,
  action: string,
  change: (i: Inquiry) => void,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(inquiries).where(eq(inquiries.id, id)).for('update');
    if (!row) fail('Pengajuan tidak ditemukan', 404);
    const i = row.data;
    change(i);
    i.updatedAt = new Date().toISOString();
    await tx.update(inquiries).set({ data: i, updatedAt: new Date() }).where(eq(inquiries.id, id));
    await tx.insert(audit).values({ id: crypto.randomUUID(), actorId, action, targetId: id });
    return i;
  });
}
export async function createProductionJob(id: string, actorId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(inquiries).where(eq(inquiries.id, id)).for('update');
    if (!row) fail('Pengajuan tidak ditemukan', 404);
    const i = row.data;
    startProduction(i);
    i.updatedAt = new Date().toISOString();
    const job = {
      id: crypto.randomUUID(),
      inquiryId: i.id,
      revision: i.revision,
      status: 'pending',
      snapshot: i,
      attempts: 0,
    };
    await tx.update(inquiries).set({ data: i, updatedAt: new Date() }).where(eq(inquiries.id, id));
    await tx.insert(jobs).values(job);
    await tx
      .insert(audit)
      .values({ id: crypto.randomUUID(), actorId, action: 'production.started', targetId: id });
    return { inquiry: i, job };
  });
}
