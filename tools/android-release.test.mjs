import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { assetLinks, buildManifest, releaseOutput } from './android-release.mjs';

test('release manifest binds the approved host and private signing key without changing the template', async () => {
  const source = JSON.parse(await fs.readFile(new URL('../android/twa-manifest.json', import.meta.url)));
  const result = buildManifest(source, 'C:/private');
  assert.equal(result.packageId, 'ch.synera.app');
  assert.equal(result.host, 'synera-phone-preview.vercel.app');
  assert.equal(result.iconUrl, `https://${result.host}/icon-512.png`);
  assert.equal(result.webManifestUrl, `https://${result.host}/manifest.webmanifest`);
  assert.equal(result.signingKey.alias, 'synera');
  assert.equal(result.signingKey.path, 'C:/private/synera-upload.keystore');
  assert.equal(result.minSdkVersion, 24);
  assert.equal(source.host, 'SYNERA_HOST');
  assert.equal(source.signingKey.alias, 'synera-upload');
});

test('DAL uses certificate fingerprint, rejects malformed input', () => {
  const fingerprint = Array(32).fill('A7').join(':');
  assert.deepEqual(assetLinks(fingerprint), [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: 'ch.synera.app', sha256_cert_fingerprints: [fingerprint] },
  }]);
  for (const bad of ['', 'SYNERA_HOST', 'A7:00', 'ab'.repeat(32)]) assert.throws(() => assetLinks(bad));
});

test('output cannot overwrite source or private toolchain; accepts separate static release directory', () => {
  const repo = path.resolve('.');
  const home = path.resolve('../private-android');
  for (const bad of [repo, path.join(repo, 'web_launch'), path.join(home, 'twa'), path.dirname(home)]) {
    assert.throws(() => releaseOutput(bad, repo, home));
  }
  if (process.platform === 'win32') assert.throws(() => releaseOutput(path.join(repo.toUpperCase(), 'web_launch'), repo, home));
  assert.equal(releaseOutput(path.join(repo, 'tmp/release'), repo, home), path.join(repo, 'tmp/release'));
  assert.equal(releaseOutput(path.join(repo, 'web_launch/dist-real'), repo, home), path.join(repo, 'web_launch/dist-real'));
  assert.equal(releaseOutput(path.join(path.dirname(repo), 'preview-release'), repo, home), path.join(path.dirname(repo), 'preview-release'));
});

test('get-lane snippet exposes the download only after HEAD 200 and valid release metadata, in all three languages', async () => {
  const report = await fs.readFile(new URL('../docs/APK-20261030.uk.md', import.meta.url), 'utf8');
  const snippet = report.match(/```js\r?\n([\s\S]*?)```/)[1];
  for (const [status, valid, lang, expected] of [
    [200, true, 'uk', 'Завантажити APK'], [200, true, 'de-CH', 'APK herunterladen'],
    [200, true, 'en', 'Download APK'], [404, true, 'uk', null],
    [500, true, 'uk', null], [200, false, 'uk', null], ['network', true, 'uk', null],
  ]) {
    const button = {}, hash = {};
    await new vm.Script(snippet).runInNewContext({
      document: { documentElement: { lang }, getElementById: id => id === 'apk-download' ? button : hash },
      fetch: async (_url, options) => {
        if (status === 'network') throw new Error('offline');
        if (options.method === 'HEAD') return { status };
        return { status: 200, json: async () => ({ packageId: 'ch.synera.app', sha256: valid ? 'a'.repeat(64) : 'wrong' }) };
      },
    });
    assert.equal(button.hidden, expected === null);
    assert.equal(hash.hidden, expected === null);
    if (expected) { assert.equal(button.textContent, expected); assert.equal(hash.textContent, `SHA-256: ${'a'.repeat(64)}`); }
  }
});
