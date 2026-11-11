import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { auth } from '../auth';
import { claimVisitor } from './claim-visitor';
export type ApiEnv = {
  Variables: {
    ownerId: string;
    role: string;
    user: { id: string; name: string; email: string } | null;
  };
};
export function fail(
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 413 | 422 = 400,
): never {
  throw new HTTPException(status, { message });
}
export async function parse<T>(c: Context<ApiEnv>, schema: z.ZodType<T>): Promise<T> {
  const body = await c.req.json().catch(() => fail('JSON tidak valid'));
  const result = schema.safeParse(body);
  if (!result.success) fail(result.error.issues.map((i) => i.message).join('; '), 422);
  return result.data;
}
export async function identity(c: Context<ApiEnv>) {
  const s = await auth.api.getSession({ headers: c.req.raw.headers });
  const visitor = c.req.header('x-visitor-token') ?? c.req.query('accessToken') ?? '';
  if (s && c.req.path === '/api/v1/me') await claimVisitor(s.user.id, visitor);
  c.set('user', s?.user ?? null);
  c.set('role', (s?.user as { role?: string } | undefined)?.role ?? 'guest');
  c.set(
    'ownerId',
    s?.user.id ?? (/^[-a-zA-Z0-9_]{40,128}$/.test(visitor) ? 'guest:' + visitor : ''),
  );
}
export function owner(c: Context<ApiEnv>) {
  return c.get('ownerId') || fail('Sesi pengunjung tidak tersedia', 401);
}
export function admin(c: Context<ApiEnv>) {
  if (c.get('role') !== 'admin') fail('Akses admin diperlukan', 403);
}
