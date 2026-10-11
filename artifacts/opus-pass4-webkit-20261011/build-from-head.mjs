// Reuse the accepted exact-blob build recipe. No dirty work, archive EOL conversion, or publication.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const expected = 'd3d85b0ea8705282a808fa8fb2c5cb77fcd4ab1b';
const name = 'dist-neon-opus-pass4-webkit-20261011';
const source = path.resolve('C:/Users/Andrii/.codex/tmp/synera-opus-pass4-webkit-20261011/source-head');
const candidate = path.join(root, 'web_launch', name);
const out = path.join(root, 'artifacts/opus-pass4-webkit-20261011');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const head = git(['rev-parse', 'HEAD']).toString().trim();
assert.equal(head, expected, 'Reconcile the source before creating another candidate');
for (const target of [source, candidate]) assert.equal(await fs.access(target).then(() => true, () => false), false, 'Already exists: ' + target);
const names = git(['ls-tree', '-r', '--name-only', head, '--', 'web_launch', 'neon']).toString().trim().split('\n');
for (const file of names) {
  const target = path.resolve(source, file);
  assert.ok(target.startsWith(source + path.sep));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, git(['cat-file', 'blob', head + ':' + file]));
}
execFileSync(process.execPath, [path.join(source, 'neon/build.mjs'), name], { stdio: 'pipe' });
await fs.cp(path.join(source, 'web_launch', name), candidate, { recursive: true, errorOnExist: true, force: false });
const release = await fs.readFile(path.join(candidate, 'release.json')), manifest = JSON.parse(release);
const files = await fs.readdir(candidate); assert.equal(files.length, manifest.files.length + 1);
let tracked = 0;
for (const item of manifest.files) {
  const bytes = await fs.readFile(path.join(candidate, item.name));
  assert.equal(bytes.length, item.bytes, item.name + ' size'); assert.equal(sha(bytes), item.sha256, item.name + ' manifest');
  assert.equal(sha(bytes), sha(await fs.readFile(path.join(source, 'web_launch', name, item.name))), item.name + ' copy');
  if (!item.name.startsWith('_')) { assert.equal(sha(bytes), sha(git(['cat-file', 'blob', head + ':web_launch/' + item.name])), item.name + ' committed blob'); tracked++; }
}
const dirtyHash = sha(await fs.readFile(path.join(root, 'web_launch/journey-ui.mjs')));
assert.equal(dirtyHash, '68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b');
const committedHash = sha(git(['cat-file', 'blob', head + ':web_launch/journey-ui.mjs'])); assert.notEqual(dirtyHash, committedHash);
const sql = JSON.parse(await fs.readFile(path.join(root, 'artifacts/opus-review-20261009/pass3/PG18_SQL_ACCEPTANCE.json')));
const sqlHashes = Object.entries(sql.source_sha256).map(([file, hash]) => {
  assert.equal(sha(git(['cat-file', 'blob', head + ':' + file])), hash, file + ' PG18 receipt source');
  return file;
});
const receipt = { status: 'PASS_COMMITTED_HEAD_BUILD_AND_COPY', source_head: head, generated_at: new Date().toISOString(),
  candidate: path.relative(root, candidate), release_sha256: sha(release), public_files: files.length,
  manifest_files_verified: manifest.files.length, committed_public_assets_verified: tracked, exported_source_files: names.length,
  pg18_receipt_source_hashes_verified: sqlHashes.length, pg18_receipt_version: sql.server.version,
  pg18_reexecuted_here: false, pg18_production_version: '18.6 (previous metadata, not this local runtime)',
  foreign_worktree_journey_ui_sha256: dirtyHash, candidate_journey_ui_sha256: committedHash, foreign_dirty_excluded: true,
  published: false, production_applied: false, provider_calls: 0, usd: 0 };
await fs.writeFile(path.join(out, 'BUILD.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
