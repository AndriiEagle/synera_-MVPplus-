import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const out = 'artifacts/message-reload-20261010/';
const build = JSON.parse(await fs.readFile(out + 'BUILD.json'));
const directory = 'web_launch/dist-neon-message-reload-20261010/';
const bytes = await fs.readFile(directory + 'release.json');
assert.equal(sha(bytes), build.release_sha256);
const current = JSON.parse(bytes);
const prior = JSON.parse(await fs.readFile('web_launch/dist-neon-opus-pass3-webkit-20261010/release.json'));
assert.deepEqual(current.files.map(file => file.name).sort(), prior.files.map(file => file.name).sort());
const changed = [];
for (const file of current.files) {
  const data = await fs.readFile(directory + file.name);
  assert.equal(sha(data), file.sha256, file.name); assert.equal(data.length, file.bytes);
  if (prior.files.find(other => other.name === file.name).sha256 !== file.sha256) changed.push(file.name);
}
assert.deepEqual(changed.sort(), ['legal.html', 'real-journey-client.mjs']);
assert.equal(sha(await fs.readFile('web_launch/journey-ui.mjs')), build.foreign_worktree_journey_ui_sha256);
const receipt = { status: 'PASS_MANIFEST_AND_CHANGED_SURFACE', source_head: build.source_head, release_sha256: build.release_sha256,
  manifest_rows_verified: current.files.length, changed_from_pass3: changed, unchanged_manifest_rows: current.files.length - changed.length,
  inherited_proof: { language: 'artifacts/opus-pass3-webkit-20261010/language-webkit-accepted/RESULT.json',
    mobile: 'artifacts/mobile-webkit-20261009/opus-pass3/RESULT.json', rationale: 'All UI, CSS, translation and Worker bytes unchanged; client delta independently tested in Node and fresh reload browser gates.' },
  foreign_dirty_preserved: true, published: false, live_accounts_accepted: false, provider_calls: 0, usd: 0 };
await fs.writeFile(out + 'READBACK.json', JSON.stringify(receipt, null, 2) + '\n'); console.log(JSON.stringify(receipt));
