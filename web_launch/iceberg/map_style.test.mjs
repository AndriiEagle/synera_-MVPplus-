// C15.L3 — тести Map Style Switcher. Запуск з КОРЕНЯ: node web_launch/iceberg/map_style.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TILE_STYLES, listTileStyles, resolveTileLayer, markerTokens, viewportRadius, geoGuard } from './map_style.mjs';

// listTileStyles — у модулі неекспортована функція? Експортуємо через обʼєкт: список стилів сам TILE_STYLES.
// Тест іде через публічний API.

test('C15.L3: три стилі з attribution, заморожені', () => {
  assert.equal(listTileStyles().length, 3);
  assert.deepEqual(listTileStyles().map(s => s.id), ['osm', 'satellite', 'schematic']);
  for (const s of listTileStyles()) {
    assert.ok(s.attribution && s.attribution.length > 0, s.id + ' attribution');
    assert.ok(s.id === 'schematic' ? s.urlTemplate.startsWith('local:') : s.urlTemplate.includes('{z}'), s.id + ' url template');
    assert.ok(Object.isFrozen(s));
  }
});

test('C15.L3: превʼязаність user > event > cohort > default(osm)', () => {
  assert.equal(resolveTileLayer('satellite'), 'satellite');
  assert.equal(resolveTileLayer(undefined, { eventStyle: 'schematic' }), 'schematic');
  assert.equal(resolveTileLayer(undefined, { cohortDefault: 'satellite' }), 'satellite');
  assert.equal(resolveTileLayer(undefined, { eventStyle: 'schematic', cohortDefault: 'satellite' }), 'schematic', 'event > cohort');
  assert.equal(resolveTileLayer(undefined, {}), 'osm');
  assert.equal(resolveTileLayer('osm', { eventStyle: 'schematic' }), 'osm', 'user вибір найсильніший');
});

test('C15.L3: невідомий стиль — українська доменна помилка', () => {
  assert.throws(() => resolveTileLayer('holographic'), /Невідома карта-підкладка/);
  assert.throws(() => resolveTileLayer(undefined, { eventStyle: 'nope' }), /Невідома карта-підкладка/);
});

test('C15.L3: маркер-токени заморожені, різні між стилями, валідні hex', () => {
  const osm = markerTokens('osm');
  const sat = markerTokens('satellite');
  assert.ok(Object.isFrozen(osm));
  assert.notDeepEqual(osm, sat);
  for (const set of [osm, sat, markerTokens('schematic')]) {
    for (const [key, value] of Object.entries(set)) {
      assert.ok(key.startsWith('--color-'), key);
      assert.match(value, /^#[0-9a-fA-F]{6}$/);
    }
  }
});

test('C15.L3: viewportRadius — без згоди null, зі згодою >= 15 км (GEO-01)', () => {
  assert.equal(viewportRadius({ map_visible: false, is_discoverable: true }), null);
  assert.equal(viewportRadius({ map_visible: true, is_discoverable: false }), null);
  assert.equal(viewportRadius(null), null);
  assert.equal(viewportRadius({ map_visible: true, is_discoverable: true }), 15);
  assert.equal(viewportRadius({ map_visible: true, is_discoverable: true }, { radiusKm: 20 }), 20);
  // clamp знизу: оператор не може виставити точніший за 15 км радіус
  assert.equal(viewportRadius({ map_visible: true, is_discoverable: true }, { radiusKm: 0.001 }), 15);
  assert.equal(viewportRadius({ map_visible: true, is_discoverable: true }, { radiusKm: 99 }), 25);
});

test('C15.L3: viewportRadius fail-closed на некоректному радіусі', () => {
  assert.throws(() => viewportRadius({ map_visible: true, is_discoverable: true }, { radiusKm: 'wide' }), /Некоректний радіус/);
});

test('C15.L3: geoGuard відкидає live GPS без гранту', () => {
  const result = geoGuard({ tileStyle: 'schematic', liveGps: true });
  assert.equal(result.pass, false);
  assert.ok(result.violations.includes('LIVE GPS БЕЗ ЯВНОГО ГРАНТУ'));
});

test('C15.L3: geoGuard відкидає торкання consent-гейтів і невідомий стиль', () => {
  const r1 = geoGuard({ featureFlags: { 'consent.visibility': true } });
  assert.equal(r1.pass, false);
  assert.ok(r1.violations.some(v => v.includes('consent.visibility')));
  const r2 = geoGuard({ tileStyle: 'hologram' });
  assert.equal(r1.pass, false);
  assert.ok(r1.violations.length > 0 && r2.violations.includes('НЕВІДОМА КАРТА-ПІДКЛАДКА'));
});

test('C15.L3: geoGuard приймає чисту подію теми', () => {
  const ok = geoGuard({ tileStyle: 'schematic', markers: { '--color-bg-map-marker': '#19513e' } });
  assert.equal(ok.pass, true);
  const badMarker = geoGuard({ markers: { 'marker-icon': 'snowflake.svg' } });
  assert.equal(badMarker.pass, false);
});

test('C15.L3: всі стилі мають шаблон тайлів; satellite від osm відрізняється', () => {
  const [osm, satellite] = TILE_STYLES;
  assert.notEqual(osm.urlTemplate, satellite.urlTemplate);
});

// Інваріант канону: машина карти не мутує consentState і не тягне app.mjs.
test('C15.L3: інваріант — без мутацій consentState, без імпорту app.mjs', () => {
  const src = fs.readFileSync(new URL('./map_style.mjs', import.meta.url), 'utf8');
  assert.ok(!src.includes('consentState['), 'мутації consentState заборонені');
  assert.ok(!src.includes("from '../app.mjs'"), 'app.mjs не імпортується');
});