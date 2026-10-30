import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
test('P6: security headers cover success, HEAD, config, API errors, 404 and 405', async t => {
  const child = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  const origin = await new Promise((resolve, reject) => { let output = ''; const timer = setTimeout(() => reject(Error('start timeout')), 10000); child.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (match) { clearTimeout(timer); resolve(match[0]); } }); child.on('error', reject); });
  for (const [route, method, status] of [['/','GET',200],['/','HEAD',200],['/config.json','GET',200],['/api/profile-ai','POST',503],['/api/journey-ai','POST',503],['/missing','GET',404],['/server/ops-log.mjs','GET',404],['/','DELETE',405]]) {
    const response = await fetch(origin + route, { method }); assert.equal(response.status, status);
    for (const [key, expected] of Object.entries({ 'strict-transport-security': 'max-age=31536000', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'permissions-policy': 'camera=(), microphone=(self), geolocation=()' })) assert.equal(response.headers.get(key), expected, route + ' ' + key);
    const csp = response.headers.get('content-security-policy'); assert.ok(csp.includes("script-src 'self'")); assert.ok(!csp.includes('unsafe-inline')); assert.ok(csp.includes("object-src 'none'")); assert.ok(csp.includes("frame-ancestors 'none'"));
  }
});
