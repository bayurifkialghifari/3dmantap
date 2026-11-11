import { serveStatic } from 'hono/bun';
import { app } from './app';
import { config, root } from './config';
import { relative } from 'node:path';
const webRoot = relative(process.cwd(), root + '/apps/web/dist').replaceAll(
  String.fromCharCode(92),
  '/',
);
app.use('/*', serveStatic({ root: webRoot }));
app.get('*', serveStatic({ path: webRoot + '/index.html' }));
console.log('3DMantap API: http://localhost:' + config.port);
export default { port: config.port, fetch: app.fetch, maxRequestBodySize: 21 * 1024 * 1024 };
