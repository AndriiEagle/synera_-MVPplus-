import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, securityHeaders } from './config.mjs';
import { PUBLIC_ASSETS } from './assets.mjs';
import { randomBytes } from 'node:crypto';
import { createLocalProfileAI, readSmallBody } from './server/local-profile-ai.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const config = await loadConfig({ demo: process.argv.includes('--demo') });
const localAI = process.argv.includes('--local-ai') ? { enabled: true, nonce: randomBytes(24).toString('hex') } : null;
const profileAI = localAI ? createLocalProfileAI({ nonce: localAI.nonce }) : null;
const allowed = new Map(Object.entries(PUBLIC_ASSETS).map(([name, type]) => ['/' + name, [name, type]]));
allowed.set('/', ['index.html', 'text/html']);
const server = http.createServer(async (req, res) => {
  const requestPath = new URL(req.url, 'http://localhost').pathname;
  const headers = securityHeaders(config);
  if (requestPath === '/api/profile-ai') {
    if (!profileAI) { res.writeHead(503, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ message: 'AI на цьому сервері ще не активований.' })); return; }
    try {
      const body = await readSmallBody(req);
      const result = await profileAI({ method: req.method, origin: req.headers.origin, expectedOrigin: 'http://127.0.0.1:' + server.address().port, host: req.headers.host, access: req.headers['x-synera-local'], contentType: req.headers['content-type'], body });
      res.writeHead(result.status, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(result.body));
    } catch { res.writeHead(413, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ message: 'Запит завеликий або перерваний.' })); }
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, headers); res.end(); return; }
  if (requestPath === '/config.json') { res.writeHead(200, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ ...config, ...(localAI ? { localAI } : {}) })); return; }
  const asset = allowed.get(requestPath);
  if (!asset) { res.writeHead(404, headers); res.end('Not found'); return; }
  try { const content = await fs.readFile(path.join(root, asset[0])); res.writeHead(200, { ...headers, 'Content-Type': asset[1] + '; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : content); }
  catch { res.writeHead(500, headers); res.end('Asset unavailable'); }
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.listen(Number(process.env.SYNERA_PORT || 0), '127.0.0.1', () => console.log(`Synera real-user pilot: http://127.0.0.1:${server.address().port}`));
