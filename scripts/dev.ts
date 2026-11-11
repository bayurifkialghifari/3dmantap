export {};
const children = [
  Bun.spawn(['bun', '--watch', 'apps/api/src/index.ts'], { stdout: 'inherit', stderr: 'inherit' }),
  Bun.spawn(['bun', 'run', '--cwd', 'apps/web', 'dev'], { stdout: 'inherit', stderr: 'inherit' }),
  Bun.spawn(['bun', '--watch', 'apps/api/src/worker.ts'], { stdout: 'inherit', stderr: 'inherit' }),
];
const stop = () => {
  children.forEach((c) => c.kill());
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
await Promise.all(children.map((c) => c.exited));
