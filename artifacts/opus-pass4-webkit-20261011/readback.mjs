// Read-only acceptance of the recorded candidate and receipts; writes only this report directory.
// Run from the repository root after the source commit. No build, provider, DB or publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out = 'artifacts/opus-pass4-webkit-20261011';
const source = '0f109afbdf502e4733bd13d469f78f655e74818c';
const git = args => execFileSync('git', args, { maxBuffer: 16 * 1024 * 1024 });
const sha = b => createHash('sha256').update(b).digest('hex');
const read = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const build = await read(out + '/STORAGE-BUILD.json');
const initial = await read(out + '/BUILD.json');
git(['merge-base', '--is-ancestor', source, 'HEAD']);
const releaseBytes = await fs.readFile(path.join(build.candidate, 'release.json'));
assert.equal(sha(releaseBytes), build.release_sha256);
const manifest = JSON.parse(releaseBytes);
assert.equal((await fs.readdir(build.candidate)).length, 103);
assert.equal(manifest.files.length, 102);
const original = await read(path.join(initial.candidate, 'release.json'));
let committed = 0; const changed = [];
for (const row of manifest.files) {
  const bytes = await fs.readFile(path.join(build.candidate, row.name));
  assert.equal(bytes.length, row.bytes, row.name + ' size'); assert.equal(sha(bytes), row.sha256, row.name + ' manifest');
  if (!row.name.startsWith('_')) {
    assert.equal(sha(git(['cat-file', 'blob', source + ':web_launch/' + row.name])), row.sha256, row.name + ' source commit'); committed++;
  }
  if (original.files.find(old => old.name === row.name)?.sha256 !== row.sha256) changed.push(row.name);
}
assert.equal(committed, 100);
assert.deepEqual(changed.sort(), ['index-i18n.mjs', 'onboarding-tour.mjs', 'style-switcher.mjs']);
const foreignHash = sha(await fs.readFile('web_launch/journey-ui.mjs'));
assert.equal(foreignHash, initial.foreign_worktree_journey_ui_sha256);
assert.notEqual(foreignHash, manifest.files.find(row => row.name === 'journey-ui.mjs').sha256);
const pg = await read('artifacts/opus-review-20261009/pass3/PG18_SQL_ACCEPTANCE.json');
for (const [file, hash] of Object.entries(pg.source_sha256)) assert.equal(sha(git(['cat-file', 'blob', source + ':' + file])), hash, file + ' prior PG18 proof');
const receipts = {};
for (const name of ['accepted-index-webkit', 'accepted-people-chrome', 'storage-green-webkit', 'storage-green-chrome']) {
  const file = out + '/' + name + '/RESULT.json', result = await read(file);
  assert.ok(result.status.startsWith('PASS_'), name); assert.equal(result.releaseHash, build.release_sha256, name + ' release');
  assert.equal(result.candidate, path.basename(build.candidate.replaceAll('\\', '/')), name + ' candidate');
  assert.deepEqual(result.failures, [], name + ' runtime errors');
  assert.ok((result.checks || []).every(row => row.pass), name + ' checks');
  if (name === 'accepted-index-webkit') {
    assert.equal(result.summary.passed, 9); assert.equal(result.summary.steps, 195); assert.equal(result.summary.problems, 0);
  } else assert.equal(result.checks.length, name === 'accepted-people-chrome' ? 7 : 20);
  receipts[name] = sha(await fs.readFile(file));
}
const mutation = await read(out + '/accepted-mutation-webkit/RESULT.json');
assert.equal(mutation.status, 'NEEDS_REVIEW'); assert.deepEqual(mutation.failures, []);
assert.equal(mutation.checks.filter(row => !row.pass).length, 6);
const mutationSetup = await read(out + '/FINAL-MUTATION-SETUP.json');
assert.equal(mutationSetup.release_metadata_is_not_valid_for_this_mutant, true);
assert.equal(sha(await fs.readFile(path.join(mutationSetup.candidate, 'index-i18n.mjs'))), mutationSetup.mutated_asset_sha256);
const red = await read(out + '/link-red-webkit/RESULT.json');
assert.equal(red.status, 'NEEDS_REVIEW'); assert.deepEqual(red.failures, []); assert.equal(red.checks.filter(row => !row.pass).length, 4);
const storageRed = await read(out + '/storage-red-webkit/RESULT.json');
assert.ok(storageRed.checks.some(row => row.name.includes('design cycle') && !row.pass));
assert.ok(storageRed.checks.some(row => row.name.includes('explicit tour') && !row.pass));
const tap = await fs.readFile(out + '/storage-node-green.tap', 'utf8'); assert.match(tap, /tests 27/); assert.match(tap, /pass 27/); assert.match(tap, /fail 0/);
const journey = await read(out + '/journey-webkit/RESULT.json');
assert.equal(journey.status, 'PASS_DESKTOP_WEBKIT_SYNTHETIC'); assert.equal(journey.summary.steps, 144);
assert.equal(journey.releaseHash, initial.release_sha256);
for (const row of manifest.files.filter(row => /^(real-journey|pilot-policy|neon-client|neon-store)/.test(row.name))) {
  assert.equal(row.sha256, original.files.find(old => old.name === row.name)?.sha256, row.name + ' unchanged journey source');
}
const result = { status: 'PASS_LOCAL_SOURCE_CANDIDATE_AND_RECEIPTS', source_commit: source, checked_head: git(['rev-parse', 'HEAD']).toString().trim(),
  candidate: build.candidate, release_sha256: build.release_sha256, public_files: 103, manifest_files_verified: 102,
  committed_public_assets_verified: committed, changed_from_opus: changed, foreign_dirty_preserved: true, foreign_dirty_excluded: true,
  pg18_receipt_source_hashes_verified: Object.keys(pg.source_sha256).length, pg18_version: pg.server.version, pg18_reexecuted: false,
  accepted_receipt_hashes: receipts, target_node_tests: 27, final_mutation_failed_checks: 6, final_mutation_runtime_errors: 0,
  reused_journey_webkit_steps: 144, reused_journey_candidate: initial.candidate, published: false, production_changed: false, provider_calls: 0, usd: 0 };
await fs.writeFile(out + '/ACCEPTANCE.json', JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify(result));
