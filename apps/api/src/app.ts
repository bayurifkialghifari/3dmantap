import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { auth } from './auth';
import { pool } from './db/client';
import { config } from './config';
import { identity, type ApiEnv } from './lib/http';
import { catalogRoutes } from './modules/catalog/routes';
import { libraryRoutes } from './modules/library/routes';
import { inquiryRoutes, adminInquiryRoutes } from './modules/inquiries/routes';
import { assetRoutes } from './modules/assets/routes';
import { settingsRoutes, adminRoutes } from './modules/admin/routes';
import { productionRoutes } from './modules/production/routes';
export const app = new Hono<ApiEnv>();
app.use('*', secureHeaders({ crossOriginEmbedderPolicy: false }));
app.use(
  '/api/*',
  cors({
    origin: config.appUrl,
    credentials: true,
    allowHeaders: ['Content-Type', 'x-visitor-token', 'x-inquiry-token'],
  }),
);
app.use('/api/*', async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin');
    if (origin && origin !== config.appUrl)
      throw new HTTPException(403, { message: 'Origin tidak diizinkan' });
  }
  await next();
});
app.on(['GET', 'POST'], '/api/v1/auth/*', (c) => auth.handler(c.req.raw));
app.use('/api/v1/*', async (c, next) => {
  await identity(c);
  await next();
});
app.get('/api/v1/health', async (c) => {
  await pool.query('SELECT 1');
  return c.json({ ok: true, name: '3DMantap' });
});
app.get('/api/v1/me', (c) => c.json({ user: c.get('user'), role: c.get('role') }));
app.route('/api/v1/templates', catalogRoutes);
app.route('/api/v1/library', libraryRoutes);
app.route('/api/v1/inquiries', inquiryRoutes);
app.route('/api/v1/assets', assetRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/admin/inquiries', adminInquiryRoutes);
app.route('/api/v1/admin', adminRoutes);
app.route('/api/v1/production', productionRoutes);
app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  console.error(error);
  return c.json({ error: 'Terjadi kesalahan server. Silakan coba kembali.' }, 500);
});
