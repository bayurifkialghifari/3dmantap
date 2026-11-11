import { eq, and, lt, gte } from 'drizzle-orm';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { db } from './db/client';
import { jobs } from './db/schema';
import { config } from './config';
import { exportPacket } from './modules/production/export';
await mkdir(join(config.uploadDir, 'exports'), { recursive: true });
console.log('Production export worker ready');
let stopping = false;
process.on('SIGINT', () => {
  stopping = true;
});
process.on('SIGTERM', () => {
  stopping = true;
});
while (!stopping) {
  await db
    .update(jobs)
    .set({ status: 'pending' })
    .where(
      and(
        eq(jobs.status, 'running'),
        lt(jobs.attempts, 3),
        lt(jobs.updatedAt, new Date(Date.now() - 10 * 60 * 1000)),
      ),
    );
  await db
    .update(jobs)
    .set({
      status: 'failed',
      error: 'Export lease expired after three attempts',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(jobs.status, 'running'),
        gte(jobs.attempts, 3),
        lt(jobs.updatedAt, new Date(Date.now() - 10 * 60 * 1000)),
      ),
    );
  const job = await db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(jobs)
      .where(and(eq(jobs.status, 'pending'), lt(jobs.attempts, 3)))
      .limit(1)
      .for('update', { skipLocked: true });
    if (!row) return null;
    await tx
      .update(jobs)
      .set({ status: 'running', attempts: row.attempts + 1, updatedAt: new Date() })
      .where(eq(jobs.id, row.id));
    return row;
  });
  if (!job) {
    await Bun.sleep(1500);
    continue;
  }
  try {
    const packet = await exportPacket(job.snapshot);
    await writeFile(join(config.uploadDir, 'exports', job.id + '.zip'), packet);
    await db
      .update(jobs)
      .set({ status: 'completed', error: null, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
  } catch (error) {
    console.error('Export failed', job.id, error);
    await db
      .update(jobs)
      .set({
        status: job.attempts >= 2 ? 'failed' : 'pending',
        error: error instanceof Error ? error.message : 'Export failed',
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
  }
}
