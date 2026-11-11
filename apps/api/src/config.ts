import { resolve } from 'node:path';
export const root = resolve(import.meta.dir, '../../..');
const envFile = Bun.file(resolve(root, '.env'));
if (await envFile.exists())
  for (const line of (await envFile.text()).split(/\r?\n/)) {
    const pos = line.indexOf('=');
    if (pos > 0 && !line.startsWith('#')) {
      const key = line.slice(0, pos).trim();
      process.env[key] ??= line.slice(pos + 1).trim();
    }
  }
export const config = {
  databaseUrl: process.env.DATABASE_URL ?? 'mysql://root@127.0.0.1:33307/3dmantap',
  port: Number(process.env.PORT ?? 3001),
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  secret: process.env.BETTER_AUTH_SECRET ?? '',
  uploadDir: resolve(root, process.env.UPLOAD_DIR ?? '.data/uploads'),
  production: process.env.NODE_ENV === 'production',
};
if (config.secret.length < 32)
  throw new Error('BETTER_AUTH_SECRET must have at least 32 characters. Run bun run setup.');
