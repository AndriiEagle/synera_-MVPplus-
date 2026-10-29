// Real product path: web_launch/index.html + manifest + pwa.mjs + sw.mjs as served by
// web_launch/server.mjs. Fixture tests prove the checks can fail; this file proves the shipped files pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkManifest, checkServiceWorkerRegistration, checkEntryHead, probeServiceWorkerOffline, fileExistsUnder } from './pwa-checks.mjs';
import { PUBLIC_ASSETS } from '../../web_launch/assets.mjs';

const root = path.resolve(fileURLToPath(new URL('../../web_launch/', import.meta.url)));
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const exists = fileExistsUnder(root);

test('index.html head: viewport, apple-touch-icon, manifest, theme-color, lang', () => {
  const result = checkEntryHead(read('index.html'), { exists });
  assert.deepEqual(result.problems, []);
  assert.equal(result.manifestHref, '/manifest.webmanifest');
  assert.equal(result.appleTouchIcon, '/apple-touch-icon.png');
});

test('manifest.webmanifest is installable and its icons exist', () => {
  const result = checkManifest(read('manifest.webmanifest'), { exists });
  assert.deepEqual(result.problems, []);
  assert.equal(result.manifest.start_url, '/');
  assert.equal(result.manifest.lang, 'uk', 'Ukrainian stays the source language (CLAUDE.md)');
});

test('pwa.mjs registers /sw.mjs as a guarded module worker and never reloads on its own', () => {
  const result = checkServiceWorkerRegistration(read('pwa.mjs'));
  assert.deepEqual(result.problems, []);
  assert.equal(result.scriptURL, '/sw.mjs');
});

test('sw.mjs precaches the shell, serves / from cache offline, answers /config.json with 503 offline JSON', async () => {
  const probe = await probeServiceWorkerOffline(read('sw.mjs'));
  for (const must of ['/', '/index.html', '/app.mjs', '/style.css', '/manifest.webmanifest', '/apple-touch-icon.png']) assert.ok(probe.shellCached.includes(must), must + ' precached');
  assert.equal(probe.rootOffline, 'cache');
  assert.equal(probe.configOffline.status, 503);
  assert.deepEqual(JSON.parse(probe.configOffline.body), { offline: true });
});

test('every precached shell path is a file the server actually serves (dead-path guard)', async () => {
  const probe = await probeServiceWorkerOffline(read('sw.mjs'));
  const served = new Set(['/', ...Object.keys(PUBLIC_ASSETS).map(n => '/' + n)]);
  const dead = probe.shellCached.filter(p => !served.has(p) || (p !== '/' && !exists(p)));
  assert.deepEqual(dead, [], 'cache.addAll rejects the whole install if one path 404s');
});

test('every served page that registers the worker is itself in the shell (cold start offline)', async () => {
  const probe = await probeServiceWorkerOffline(read('sw.mjs'));
  const registering = Object.keys(PUBLIC_ASSETS).filter(n => n.endsWith('.html') && /src="\/pwa\.mjs"/.test(read(n)));
  assert.ok(registering.includes('index.html'));
  for (const page of registering) assert.ok(probe.shellCached.includes('/' + page), page + ' registers /sw.mjs but is not precached');
});

// Tripwire: the other served entry pages are NOT installable today. The mobile audit lists this as a fix item.
// When a page gains a manifest/apple-touch-icon, move it out of this list so the strict checks above cover it.
test('known gaps on secondary entry pages are recorded, not hidden', () => {
  const pages = Object.keys(PUBLIC_ASSETS).filter(n => n.endsWith('.html'));
  const gaps = Object.fromEntries(pages.map(n => [n, checkEntryHead(read(n), { exists }).problems]));
  assert.deepEqual(gaps['index.html'], []);
  assert.ok(gaps['real-journey.html'].includes('apple-touch-icon link missing (iOS home-screen icon falls back to a page screenshot)'));
  assert.ok(gaps['real-journey.html'].includes('link rel=manifest missing'));
  // F5 closes this specific gap everywhere; retain the unrelated manifest/icon tripwires.
  for (const page of pages) assert.equal(gaps[page].includes('meta theme-color missing (status bar keeps browser default)'), false, page + ' must declare its browser chrome colour');
  const summary = Object.entries(gaps).filter(([, p]) => p.length).map(([n, p]) => `${n}: ${p.length}`);
  assert.ok(summary.length >= 2, 'if the secondary pages were all fixed, delete this tripwire: ' + summary.join(', '));
});
