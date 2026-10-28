import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkEntryHead } from './pwa-checks.mjs';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('positive fixture head has a responsive, zoomable viewport with safe-area support', () => {
  const result = checkEntryHead(read('./fixtures/positive/index.html'), { requireViewportFit: true });
  assert.deepEqual(result.problems, []);
});

test('negative fixture head: fixed-width, zoom-blocking viewport is rejected', () => {
  const result = checkEntryHead(read('./fixtures/negative/index.html'), { requireViewportFit: true });
  for (const expected of ['width=device-width', 'initial-scale=1', 'pinch zoom', 'viewport-fit=cover', 'theme-color missing', 'html lang attribute missing'])
    assert.ok(result.problems.some(p => p.includes(expected)), `expected "${expected}" in ${JSON.stringify(result.problems)}`);
});

test('a head without any viewport meta is reported', () => {
  assert.ok(checkEntryHead('<html lang="de"><head></head></html>').problems.includes('meta viewport missing'));
});
