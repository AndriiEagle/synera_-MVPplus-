import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkManifest, fileExistsUnder } from './pwa-checks.mjs';
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

test('positive fixture manifest is installable', () => {
  const result = checkManifest(read('./fixtures/positive/manifest.webmanifest'), { exists: fileExistsUnder(new URL('./fixtures/positive/', import.meta.url).pathname) });
  assert.deepEqual(result.problems, []);
  assert.equal(result.manifest.display, 'standalone');
});

test('negative fixture manifest reports every install blocker', () => {
  const result = checkManifest(read('./fixtures/negative/manifest.webmanifest'), { exists: () => false });
  assert.equal(result.ok, false);
  for (const expected of ['manifest.name empty', 'short_name longer than 12', 'does not open as an app', 'must be same-origin relative', 'outside manifest.scope', 'icon file missing: /icon-180.png', 'no 192x192 icon', 'no 512x512 icon', 'no maskable icon', 'theme_color is not a 6-digit hex colour'])
    assert.ok(result.problems.some(p => p.includes(expected)), `expected problem "${expected}" in ${JSON.stringify(result.problems)}`);
});

test('malformed manifest text is a single clear failure', () => {
  assert.match(checkManifest('{ "name": ').problems[0], /not valid JSON/);
  assert.match(checkManifest('[]').problems[0], /must be a JSON object/);
});
