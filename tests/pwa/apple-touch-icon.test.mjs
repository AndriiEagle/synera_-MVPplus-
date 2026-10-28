import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkEntryHead, fileExistsUnder } from './pwa-checks.mjs';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const positiveDir = new URL('./fixtures/positive/', import.meta.url).pathname;

test('positive fixture links a PNG apple-touch-icon that exists next to the page', () => {
  const result = checkEntryHead(read('./fixtures/positive/index.html'), { exists: fileExistsUnder(positiveDir) });
  assert.equal(result.appleTouchIcon, '/apple-touch-icon.png');
  assert.ok(!result.problems.some(p => /apple-touch-icon/.test(p)), JSON.stringify(result.problems));
  assert.ok(fs.statSync(positiveDir + 'apple-touch-icon.png').size > 0);
});

test('negative fixture: SVG apple-touch-icon and missing manifest link are rejected', () => {
  const result = checkEntryHead(read('./fixtures/negative/index.html'), { exists: () => false });
  assert.ok(result.problems.some(p => p.includes('is not PNG')));
  assert.ok(result.problems.includes('link rel=manifest missing'));
});

test('a referenced icon that does not exist on disk is a failure, not a pass', () => {
  const result = checkEntryHead(read('./fixtures/positive/index.html'), { exists: () => false });
  assert.ok(result.problems.some(p => p.startsWith('apple-touch-icon file missing')));
  assert.ok(result.problems.some(p => p.startsWith('manifest file missing')));
});
