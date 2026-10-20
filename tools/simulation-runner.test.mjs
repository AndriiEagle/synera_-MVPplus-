import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createHash, randomUUID } from 'node:crypto';
import { sensitiveFindings } from '../web_launch/profile-portability.mjs';

// Controlled scheduling at the real runner's screenshot seam; no browser/provider/network.
async function exercise(change) {
  const source = (await fs.readFile(new URL('./simulation-runner.mjs', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '').replace(/^export /gm, '')
    .replace(/^const adapter = .*;$/m, "const adapter = 'unused';") + '\nthis.runner = createScreenshotRunner;';
  let valid = true, revision = 0, calls = 0, captured = false;
  const saved = new Map();
  const page = {
    goto: async () => {}, waitForFunction: async () => {},
    evaluate: async () => ({ revision, text: 'Fictional conversation',
      inputs: captured && change === 'draft' ? ['private@example.org'] : [] }),
    screenshot: async () => {
      captured = true;
      if (change === 'stop') valid = false;
      if (change === 'revision') revision = 1;
      return Buffer.from('controlled screenshot bytes');
    },
  };
  const scope = { Buffer, path, process: { env: {} }, createHash, randomUUID,
    promisify: () => () => { throw Error('Subprocess forbidden'); }, execFile: () => {},
    fs: { mkdir: async () => {}, writeFile: async (file, data) => saved.set(file, data) },
    chromium: { launch: async () => ({ newContext: async () => ({ addCookies: async () => {}, newPage: async () => page }), close: async () => {} }) },
    SIMULATION_PEOPLE: [{ id: 'bot-mira' }], sensitiveFindings };
  vm.runInNewContext(source, scope);
  let error;
  try {
    await scope.runner({ maxSteps: 1, preflight: async () => {}, model: async () => {
      calls++;
      return { decision: { action: 'wait', revision: 0 }, receipt: { syntheticTest: true } };
    } })({ id: 'bot-mira', directory: '/test-only', origin: 'http://unused.invalid',
      valid: () => valid, cookie: () => '', revokeCookie: () => {}, authorizeFrame: () => {},
      snapshot: async () => ({ revision, messages: [{ text: revision ? 'private@example.org' : 'clean' }], outputs: {} }) });
  } catch (caught) { error = caught; }
  return { calls, error, records: [...saved.entries()].filter(([file]) => file.endsWith('result.json')).map(([, text]) => JSON.parse(text)) };
}
for (const change of ['stop', 'revision', 'draft']) test(`no provider dispatch when ${change} changes during capture`, async () => {
  const result = await exercise(change);
  assert.equal(result.calls, 0, 'data/cost must stay local before provider invocation');
  if (change === 'draft') assert.match(result.error?.message || '', /контакт|приват|ключ/i);
});
test('unchanged clean frame reaches one model call and records the UI result', async () => {
  const result = await exercise('none');
  assert.equal(result.error, undefined);
  assert.equal(result.calls, 1);
  assert.equal(result.records[0].status, 'APPLIED');
});
