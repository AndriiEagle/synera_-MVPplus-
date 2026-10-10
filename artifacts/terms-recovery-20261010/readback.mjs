import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const out = 'artifacts/terms-recovery-20261010/';
const build = JSON.parse(await fs.readFile(out + 'BUILD.json'));
const directory = 'web_launch/dist-neon-terms-recovery-20261010/';
const bytes = await fs.readFile(directory + 'release.json');
assert.equal(sha(bytes), build.release_sha256);
const current = JSON.parse(bytes);
const prior = JSON.parse(await fs.readFile('web_launch/dist-neon-message-reload-20261010/release.json'));
assert.deepEqual(current.files.map(row => row.name).sort(), prior.files.map(row => row.name).sort());
const changed = [];
for (const file of current.files) {
  const data = await fs.readFile(directory + file.name);
  assert.equal(sha(data), file.sha256, file.name); assert.equal(data.length, file.bytes);
  if (prior.files.find(row => row.name === file.name).sha256 !== file.sha256) changed.push(file.name);
}
assert.deepEqual(changed.sort(), ['real-journey-i18n.mjs', 'real-journey.mjs']);
assert.equal(sha(await fs.readFile('web_launch/journey-ui.mjs')), build.foreign_worktree_journey_ui_sha256);
const browsers = [];
for (const engine of ['webkit', 'chrome']) {
  const main = JSON.parse(await fs.readFile(out + `final-${engine}/RESULT.json`));
  const auth = JSON.parse(await fs.readFile(out + `auth-${engine}/RESULT.json`));
  for (const result of [main, auth]) {
    assert.equal(result.status, 'PASS'); assert.equal(result.release_sha256, build.release_sha256);
    assert.deepEqual(result.source_overrides, {}); assert.equal(result.failures.length, 0);
  }
  const names = [...main.checks, ...auth.checks].map(row => row.name);
  assert.equal(new Set(names).size, 9); assert.equal(names.length, 9);
  browsers.push({ engine: main.engine, version: main.browser_version, accepted_distinct_scenarios: names });
}
const mutant = JSON.parse(await fs.readFile(out + 'review-mutation/RESULT.json'));
assert.equal(mutant.mutation, true); assert.equal(mutant.status, 'NOT_ACCEPTED');
for (const name of ['uncommitted-uk', 'committed-de', 'revision-de']) {
  assert.ok(mutant.failures.some(row => row.name === name && row.message.includes('transient terms write hid the active workspace')));
}
const receipt = { status: 'PASS_MANIFEST_AND_AFFECTED_BROWSER_SURFACE', source_head: build.source_head,
  release_sha256: build.release_sha256, manifest_rows_verified: current.files.length,
  changed_from_message_reload: changed, unchanged_manifest_rows: current.files.length - changed.length, browsers,
  mutation_reproduced_draft_loss: true, foreign_dirty_preserved: true,
  inherited_proof: { message_recovery: 'artifacts/message-reload-20261010/READBACK.json',
    mobile: 'artifacts/mobile-webkit-20261009/opus-pass3/RESULT.json',
    language: 'artifacts/opus-pass3-webkit-20261010/language-webkit-accepted/RESULT.json',
    rationale: 'The 95 unchanged manifest assets include the client, Worker and CSS. SQL receipt source hashes also match. Only terms error recovery and one translated status row changed; their own browser gates do not constitute a rerun of the whole UI.' },
  published: false, production_applied: false, live_accounts_accepted: false, provider_calls: 0, usd: 0 };
await fs.writeFile(out + 'READBACK.json', JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
