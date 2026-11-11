import mysql from 'mysql2/promise';
import { config, root } from '../config';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
const url = new URL(config.databaseUrl);
const name = url.pathname.slice(1);
if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid database name');
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
});
await connection.query(
  'CREATE DATABASE IF NOT EXISTS ' +
    String.fromCharCode(96) +
    name +
    String.fromCharCode(96) +
    ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
);
await connection.end();
const directory = resolve(root, 'apps/api');
try {
  await access(resolve(directory, 'drizzle/meta/_journal.json'));
} catch {
  const generate = Bun.spawn(['bunx', 'drizzle-kit', 'generate'], {
    cwd: directory,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if ((await generate.exited) !== 0) throw new Error('Migration generation failed');
}
const { migrate } = await import('drizzle-orm/mysql2/migrator');
const { db, pool } = await import('./client');
await migrate(db, { migrationsFolder: resolve(directory, 'drizzle') });
console.log('Database migrations applied.');
await pool.end();
