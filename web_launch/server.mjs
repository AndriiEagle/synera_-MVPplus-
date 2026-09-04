import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, securityHeaders } from './config.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const config = await loadConfig({ demo: process.argv.includes('--demo') });
const allowed = new Map([['/', ['index.html', 'text/html']], ['/app.mjs', ['app.mjs', 'text/javascript']], ['/data.mjs', ['data.mjs', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
const server = http.createServer(async (req, res) => {
  const requestPath = new URL(req.url, 'http://localhost').pathname;
  const headers = securityHeaders(config);
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, headers); res.end(); return; }
  if (requestPath === '/config.json') { res.writeHead(200, { ...headers, 'Content-Type': 'application/json; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : JSON.stringify(config)); return; }
  const asset = allowed.get(requestPath);
  if (!asset) { res.writeHead(404, headers); res.end('Not found'); return; }
  try { const content = await fs.readFile(path.join(root, asset[0])); res.writeHead(200, { ...headers, 'Content-Type': asset[1] + '; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : content); }
  catch { res.writeHead(500, headers); res.end('Asset unavailable'); }
});
server.listen(Number(process.env.SYNERA_PORT || 0), '127.0.0.1', () => console.log(`Synera ${config.supabaseUrl ? 'configured Supabase' : 'local demo'}: http://127.0.0.1:${server.address().port}`));
