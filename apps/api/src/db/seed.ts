import { eq } from 'drizzle-orm';
import { starterTemplates } from '@3dmantap/shared';
import { db, pool } from './client';
import { templates, settings, user } from './schema';
import { auth } from '../auth';
for (const t of starterTemplates)
  await db
    .insert(templates)
    .values({ id: t.id, data: t })
    .onDuplicateKeyUpdate({ set: { id: t.id } });
await db
  .insert(settings)
  .values({
    id: 'business',
    data: {
      name: '3DMantap',
      whatsapp: process.env.WHATSAPP_NUMBER ?? '',
      bankName: '',
      bankAccount: '',
      bankOwner: '',
      address: '',
      announcement: 'Desainmu, caramu. Konsultasikan sebelum produksi.',
    },
  })
  .onDuplicateKeyUpdate({ set: { id: 'business' } });
const email = process.env.ADMIN_EMAIL ?? 'admin@3dmantap.local';
const found = await db.select().from(user).where(eq(user.email, email));
if (!found.length) {
  if (!process.env.ADMIN_PASSWORD) throw new Error('Configure ADMIN_PASSWORD first');
  await auth.api.signUpEmail({
    body: { name: 'Admin 3DMantap', email, password: process.env.ADMIN_PASSWORD },
  });
  await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));
}
console.log('Seed complete: original starter templates and admin account.');
await pool.end();
