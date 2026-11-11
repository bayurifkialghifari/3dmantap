import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
const root = resolve(import.meta.dir, '..');
await mkdir(join(root, '.data'), { recursive: true });
if (!(await Bun.file(join(root, '.env')).exists())) {
  const password = randomBytes(18).toString('base64url');
  const env = (await Bun.file(join(root, '.env.example')).text())
    .replace('replace-with-at-least-32-random-characters', randomBytes(32).toString('hex'))
    .replace('replace-with-a-strong-password', password);
  await writeFile(join(root, '.env'), env);
  await writeFile(
    join(root, '.data/bootstrap-admin.txt'),
    ['Email: admin@3dmantap.local', 'Password: ' + password, ''].join('\n'),
  );
  console.log('Environment created. Admin credentials: .data/bootstrap-admin.txt');
}
if (process.platform === 'win32') {
  const located = await new Response(
    Bun.spawn(['where.exe', 'mysqld'], { stdout: 'pipe', stderr: 'pipe' }).stdout,
  ).text();
  const exe = located.trim().split(/\r?\n/)[0];
  if (!exe) {
    console.log('MySQL server not found. Set DATABASE_URL to your MySQL server.');
    process.exit(0);
  }
  const dir = join(root, '.data/mysql');
  await mkdir(dir, { recursive: true });
  let initialized = true;
  try {
    await access(join(dir, 'mysql'));
  } catch {
    initialized = false;
  }
  if (!initialized) {
    const child = Bun.spawn([exe, '--no-defaults', '--initialize-insecure', '--datadir=' + dir], {
      stdout: 'inherit',
      stderr: 'inherit',
    });
    if ((await child.exited) !== 0) throw new Error('MySQL initialization failed');
  }
  const probe = await Bun.connect({
    hostname: '127.0.0.1',
    port: 33307,
    socket: {
      data() {},
      open(socket) {
        socket.end();
      },
      error() {},
    },
  })
    .then(() => true)
    .catch(() => false);
  if (!probe) {
    const quote = (s: string) => "'" + s.replaceAll("'", "''") + "'";
    const args =
      '--no-defaults --datadir="' +
      dir +
      '" --port=33307 --bind-address=127.0.0.1 --mysqlx=OFF --log-error="' +
      join(root, '.data/mysql.log') +
      '"';
    const command =
      'Start-Process -FilePath ' +
      quote(exe) +
      ' -ArgumentList ' +
      quote(args) +
      ' -WindowStyle Hidden';
    const child = Bun.spawn(['powershell', '-NoProfile', '-Command', command], {
      stdout: 'inherit',
      stderr: 'inherit',
    });
    if ((await child.exited) !== 0) throw new Error('Could not start local MySQL');
    console.log('Started isolated development MySQL on 127.0.0.1:33307.');
  }
}
