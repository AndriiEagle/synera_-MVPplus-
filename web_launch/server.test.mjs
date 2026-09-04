import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { PUBLIC_ASSETS } from './assets.mjs';
test('HTTP: public lab assets load; private files and writes stay inaccessible', async t => {
  const process = spawn(globalThis.process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...globalThis.process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => process.kill());
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timeout')), 10000); let text = '';
    process.stdout.on('data', chunk => { text += chunk; const match = text.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } });
    process.on('error', error => { clearTimeout(timer); reject(error); }); process.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}`)); });
  });
  for (const name of Object.keys(PUBLIC_ASSETS)) { const r = await fetch(`${url}/${name}`); assert.equal(r.status, 200, name); assert.ok(r.headers.get('content-security-policy').includes("connect-src 'self';")); }
  for (const name of ['.git/config', 'config.public.json', 'matching.test.mjs', 'assets.mjs', '../supabase/schema.sql']) assert.equal((await fetch(`${url}/${name}`)).status, 404, name);
  assert.equal((await fetch(url, { method: 'POST', body: 'do not store' })).status, 405);
  assert.deepEqual(await (await fetch(`${url}/config.json`)).json(), { supabaseUrl: '', publishableKey: '', registrationEnabled: false });
});
