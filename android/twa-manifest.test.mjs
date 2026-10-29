import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const android = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(android, '../web_launch');
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const twa = json(path.join(android, 'twa-manifest.json'));
const pwa = json(path.join(web, 'manifest.webmanifest'));

function validateManifest(m) {
  assert.match(m.packageId, /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}$/);
  assert.equal(m.name, pwa.short_name);
  assert.equal(m.launcherName, pwa.short_name);
  assert.equal(m.host, 'SYNERA_HOST'); // Deliberate template; no production host approved.
  assert.equal(m.startUrl, '/');
  assert.equal(m.display, 'standalone');
  assert.equal(m.themeColor, pwa.theme_color);
  assert.equal(m.backgroundColor, pwa.background_color);
  for (const key of ['themeColor', 'themeColorDark', 'navigationColor', 'navigationColorDark',
    'navigationDividerColor', 'navigationDividerColorDark', 'backgroundColor']) {
    assert.match(m[key], /^#[\da-f]{6}$/i, key);
  }
  assert.equal(m.enableNotifications, false);
  assert.equal(m.fallbackType, 'customtabs');
  assert.ok(Number.isInteger(m.appVersionCode) && m.appVersionCode > 0);
  assert.match(m.appVersion, /^\d+\.\d+\.\d+$/); // JSON key is appVersion, not appVersionName.
  assert.ok(Number.isInteger(m.splashScreenFadeOutDuration) && m.splashScreenFadeOutDuration >= 0);
  assert.equal(m.signingKey.alias, 'synera-upload');
  assert.equal(m.signingKey.path, '__KEYSTORE_PATH__/synera-upload.keystore');
  assert.equal(m.webManifestUrl, `https://${m.host}/manifest.webmanifest`);
  assert.ok(Number.isInteger(m.minSdkVersion) && m.minSdkVersion >= 23);
  assert.deepEqual(m.features, {});
  assert.deepEqual(m.additionalTrustedOrigins, []);
  assert.deepEqual(m.shortcuts, []); // PWA currently declares none; invent no destinations.
  for (const key of ['start_url', 'theme_color', 'background_color', 'icons', 'appVersionName']) {
    assert.equal(Object.hasOwn(m, key), false, `${key} is not the Bubblewrap JSON field`);
  }
}

function iconFile(src) {
  assert.equal(typeof src, 'string');
  // Check the original path too: URL parsing would silently normalize /../ away.
  const rawPath = src.replace(/^https:\/\/[^/]+/, '').split(/[?#]/, 1)[0];
  const decoded = decodeURIComponent(rawPath);
  assert.ok(!decoded.includes('\\') && !decoded.split('/').includes('..'), 'icon path traversal');
  const url = new URL(src, `https://${twa.host}/`);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, twa.host.toLowerCase(), 'icon must belong to the approved origin');
  assert.equal(url.search + url.hash, '');
  const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  assert.ok(relative && !relative.includes(':'));
  const file = path.resolve(web, relative);
  assert.ok(file.startsWith(web + path.sep), 'icon must remain in web_launch');
  assert.ok(fs.existsSync(file) && fs.statSync(file).isFile(), `missing icon: ${relative}`);
  return file;
}

function assertPng(src, minimum) {
  const data = fs.readFileSync(iconFile(src));
  assert.deepEqual(data.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(data.toString('ascii', 12, 16), 'IHDR');
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  assert.equal(width, height, src);
  assert.ok(width >= minimum, `${src}: ${width}px is below ${minimum}px`);
}

function validateMetadata(value, limit, singleLine) {
  assert.equal(value, value.trim(), 'metadata must not have surrounding whitespace');
  assert.ok(value.length > 0, 'empty metadata');
  assert.ok(!value.includes('\uFFFD'), 'invalid UTF-8 replacement character');
  assert.ok(Array.from(value).length <= limit && value.length <= limit, `metadata exceeds ${limit}`);
  if (singleLine) assert.ok(!/[\r\n]/.test(value), 'single-line metadata field');
}

test('Bubblewrap manifest matches the existing PWA and files-only template contract', () => {
  validateManifest(twa);
});

test('every PWA, TWA and shortcut icon exists; launcher and maskable PNG are at least 512px', () => {
  for (const icon of pwa.icons) {
    iconFile(icon.src);
    if (icon.type === 'image/png') assertPng(icon.src, Number.parseInt(icon.sizes, 10));
  }
  for (const key of ['iconUrl', 'maskableIconUrl', 'monochromeIconUrl']) {
    if (twa[key]) assertPng(twa[key], 512);
  }
  for (const shortcut of twa.shortcuts) {
    for (const key of ['chosenIconUrl', 'chosenMaskableIconUrl', 'chosenMonochromeIconUrl']) {
      if (shortcut[key]) iconFile(shortcut[key]);
    }
  }
  const maskable = pwa.icons.find((icon) => icon.purpose?.split(/\s+/).includes('maskable'));
  assert.ok(maskable, 'PWA must declare a maskable icon');
  assert.equal(iconFile(twa.maskableIconUrl), iconFile(maskable.src));
});

test('three fastlane locales contain complete text within 30/80/4000 limits', () => {
  const base = path.join(android, 'fastlane/metadata/android');
  assert.deepEqual(fs.readdirSync(base).sort(), ['de-CH', 'en-US', 'uk']);
  for (const locale of fs.readdirSync(base)) {
    for (const [name, limit, singleLine] of [
      ['title', 30, true], ['short_description', 80, true], ['full_description', 4000, false],
    ]) {
      const bytes = fs.readFileSync(path.join(base, locale, `${name}.txt`));
      assert.notDeepEqual(bytes.subarray(0, 3), Buffer.from([239, 187, 191]), 'UTF-8 without BOM');
      assert.ok(bytes.toString('utf8').endsWith('\n'));
      validateMetadata(bytes.toString('utf8').replace(/\r?\n$/, ''), limit, singleLine);
    }
  }
});

test('Digital Asset Links template binds the same package and explicitly awaits the Play certificate', () => {
  const statements = json(path.join(android, 'assetlinks.template.json'));
  assert.equal(statements.length, 1);
  assert.deepEqual(statements[0].relation, ['delegate_permission/common.handle_all_urls']);
  assert.equal(statements[0].target.namespace, 'android_app');
  assert.equal(statements[0].target.package_name, twa.packageId);
  assert.deepEqual(statements[0].target.sha256_cert_fingerprints,
    ['__PLAY_APP_SIGNING_CERTIFICATE_SHA256__']);
});

test('negative controls reject schema, permissions, color drift, missing and escaped icons', () => {
  for (const change of [
    { packageId: 'invalid' }, { startUrl: undefined, start_url: '/' },
    { appVersion: undefined, appVersionName: '1.0.0' }, { enableNotifications: true },
    { fallbackType: 'webview' }, { themeColor: '#000000' }, { appVersionCode: 0 },
  ]) assert.throws(() => validateManifest({ ...twa, ...change }));
  for (const src of ['/missing-synera-icon.png', '/../package.json', '/%2e%2e/package.json',
    'https://elsewhere.invalid/icon-512.png', 'file:///icon-512.png']) {
    assert.throws(() => iconFile(src));
  }
  assert.throws(() => assertPng('/icon-192.png', 512));
});

test('negative controls reject overflow, missing text and invalid single-line fields', () => {
  for (const limit of [30, 80, 4000]) {
    assert.doesNotThrow(() => validateMetadata('x'.repeat(limit), limit, false));
    assert.throws(() => validateMetadata('x'.repeat(limit + 1), limit, false));
  }
  for (const value of ['', ' text', 'text\nnext', '\uFFFD']) {
    assert.throws(() => validateMetadata(value, 80, true));
  }
});
