import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { assets, designs, rooms, inquiries } from '../db/schema';
export async function claimVisitor(userId: string, visitor: string) {
  if (!/^[-a-zA-Z0-9_]{40,128}$/.test(visitor)) return;
  const previous = 'guest:' + visitor;
  await db.transaction(async (tx) => {
    await tx.update(assets).set({ ownerId: userId }).where(eq(assets.ownerId, previous));
    await tx.update(designs).set({ ownerId: userId }).where(eq(designs.ownerId, previous));
    await tx.update(rooms).set({ ownerId: userId }).where(eq(rooms.ownerId, previous));
    const rows = await tx
      .select()
      .from(inquiries)
      .where(eq(inquiries.ownerId, previous))
      .for('update');
    for (const row of rows)
      await tx
        .update(inquiries)
        .set({ ownerId: userId, data: { ...row.data, ownerId: userId } })
        .where(eq(inquiries.id, row.id));
  });
}
