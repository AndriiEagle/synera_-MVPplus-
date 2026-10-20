import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSimulationServer } from './simulation-server.mjs';
import { validateDecision } from './simulation-runner.mjs';

test('private HTTP sessions reject wrong origin, forged actor, stale request and private cache', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'synera-simulation-'));
  const app = await createSimulationServer({ directory });
  let cookie;
  const post = (route, value, origin = app.origin) => fetch(app.origin + route, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(value) });
  try {
    assert.equal((await fetch(app.origin + '/api/sim/session?person=bot-mira')).status, 401);
    assert.equal((await post('/api/sim/login', { key: app.ownerKey }, 'https://evil.example')).status, 403);
    const login = await post('/api/sim/login', { key: app.ownerKey });
    assert.equal(login.status, 200); cookie = login.headers.get('set-cookie').split(';')[0];
    assert.match(login.headers.get('set-cookie'), /HttpOnly/);
    const before = await fetch(app.origin + '/api/sim/session?person=bot-mira', { headers: { Cookie: cookie } });
    assert.equal(before.headers.get('cache-control'), 'no-store');
    const state = (await before.json()).state;
    const changed = await post('/api/sim/action', { personId: 'bot-mira', revision: state.revision, actor: 'bot-mira', kind: 'message', text: 'Моя власна думка' });
    assert.equal(changed.status, 200);
    assert.equal((await changed.json()).state.messages.at(-1).actor, 'owner');
    assert.equal((await post('/api/sim/action', { personId: 'bot-mira', revision: 0, kind: 'message', text: 'stale' })).status, 409);
    assert.equal((await post('/api/sim/run', { personId: 'bot-mira', consent: true })).status, 503);
    assert.equal((await fetch(app.origin + '/sessions.json', { headers: { Cookie: cookie } })).status, 404);
    const exported = await fetch(app.origin + '/api/sim/export?person=bot-mira', { headers: { Cookie: cookie } });
    assert.equal((await exported.json()).customerEvidence, false);
    assert.equal(JSON.parse(await fs.readFile(path.join(directory, 'sessions.json')))[state.personId].messages.at(-1).text, 'Моя власна думка');
  } finally {
    await app.close();
    // Exact test-created temp directory; no computed workspace deletion.
    if (path.dirname(directory) === os.tmpdir() && path.basename(directory).startsWith('synera-simulation-')) await fs.rm(directory, { recursive: true });
  }
});
test('executor refuses stale, cross-action payloads and unbounded fields', () => {
  assert.throws(() => validateDecision({ action: 'message', revision: 1, text: 'hello' }, 2));
  assert.throws(() => validateDecision({ action: 'approve', revision: 2, actor: 'owner' }, 2));
  assert.throws(() => validateDecision({ action: 'fill', revision: 2, field: '__proto__', text: 'x' }, 2));
  assert.throws(() => validateDecision({ action: 'deliver', revision: 2, index: 88, text: 'x' }, 2));
  assert.equal(validateDecision({ action: 'wait', revision: 2 }, 2).action, 'wait');
});

test('provider consent belongs to the selected pair and STOP rejects an in-flight actor', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'synera-simulation-'));
  const runs = [];
  let release;
  const app = await createSimulationServer({ directory, runner: async run => {
    runs.push(run);
    if (runs.length === 2) await new Promise(resolve => { release = resolve; });
  } });
  let cookie;
  const post = (route, value, identity = cookie) => fetch(app.origin + '/api/sim/' + route, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: app.origin, ...(identity ? { Cookie: identity } : {}) },
    body: JSON.stringify(value),
  });
  try {
    const login = await post('login', { key: app.ownerKey });
    cookie = login.headers.get('set-cookie').split(';')[0];
    assert.equal((await post('run', { personId: 'bot-mira', consent: true })).status, 202);
    assert.equal(runs.length, 1);
    await post('action', { personId: 'bot-jan', revision: 0, kind: 'message', text: 'Unconsented pair' });
    assert.equal(runs.length, 1, 'another pair must not inherit consent');
    await post('run', { personId: 'bot-mira', consent: true });
    const run = runs[1], token = run.cookie();
    run.authorizeFrame(token, { revision: 0, evidence: { syntheticTest: true } });
    await post('stop', {});
    assert.equal(run.valid(), false);
    assert.equal((await post('action', { personId: 'bot-mira', revision: 0, kind: 'message', text: 'late' },
      'synera_sim=' + token)).status, 409);
    release();
    await new Promise(resolve => setImmediate(resolve));
    await post('action', { personId: 'bot-mira', revision: 0, kind: 'message', text: 'Owner after STOP' });
    assert.equal(runs.length, 2, 'STOP revokes future automatic turns');
  } finally {
    release?.();
    await app.close();
    if (path.dirname(directory) === os.tmpdir() && path.basename(directory).startsWith('synera-simulation-')) await fs.rm(directory, { recursive: true });
  }
});
