import test from 'node:test';
import assert from 'node:assert/strict';
import { recordView, visibleViewers, optOut } from './viewers.mjs';

const view = overrides => ({ viewerId: 'u-2', ownerId: 'u-1', at: '2026-09-20T10:00:00.000Z', ...overrides });

test('C11.L5: взаємна опція — власник з опцією бачить лише взаємних переглядачів', () => {
  const views = [view(), view({ viewerId: 'u-3', at: '2026-09-20T11:00:00.000Z' })];
  const prefs = { 'u-2': { mutualViewersEnabled: false }, 'u-3': { mutualViewersEnabled: true } };
  const result = visibleViewers(views, { id: 'u-1', mutualViewersEnabled: true }, prefs);
  assert.deepEqual(result.viewers.map(v => v.viewerId), ['u-3'], 'u-2 без взаємності не показується; u-3 з взаємністю показується');
});

test('C11.L5: gate — власник без опції не бачить НІКОГО (відмова від стеження)', () => {
  const views = [view(), view({ viewerId: 'u-3' })];
  const result = visibleViewers(views, { id: 'u-1', mutualViewersEnabled: false }, { 'u-2': { mutualViewersEnabled: true } });
  assert.deepEqual(result.viewers, []);
});

test('C11.L5: останній перегляд кожного переглядача, новіші перші', () => {
  const views = [view({ at: '2026-09-20T10:00:00.000Z' }), view({ at: '2026-09-21T10:00:00.000Z' }), view({ viewerId: 'u-3', at: '2026-09-20T09:00:00.000Z' })];
  const result = visibleViewers(views, { id: 'u-1', mutualViewersEnabled: true }, { 'u-2': { mutualViewersEnabled: true }, 'u-3': { mutualViewersEnabled: true } });
  assert.deepEqual(result.viewers.map(v => v.viewerId), ['u-2', 'u-3']);
  assert.equal(result.viewers[0].at, '2026-09-21T10:00:00.000Z');
});

test('C11.L5: optOut — власник миттєво сліпий', () => {
  const views = [view()];
  const result = optOut(views, { id: 'u-1' });
  assert.deepEqual(result.viewers, []);
});

test('C11.L5: append-only і валідація — самоперегляд і сміття відхилені', () => {
  const views = [];
  const first = recordView(views, view());
  assert.equal(first.valid, true);
  assert.equal(views.length, 0);
  assert.equal(first.views.length, 1);
  for (const bad of [null, 'x', view({ viewerId: 'u-1' }), view({ ownerId: '' }), view({ at: 'soon' }), view({ viewerId: 7 })]) {
    assert.equal(recordView([], bad).reason, 'INVALID_VIEW', JSON.stringify(bad));
  }
  assert.equal(recordView('nope', view()).reason, 'INVALID_VIEWS');
  assert.equal(visibleViewers('nope', { id: 'u-1', mutualViewersEnabled: true }).reason, 'INVALID_VIEWS');
  assert.equal(visibleViewers([], { id: '', mutualViewersEnabled: true }).reason, 'INVALID_OWNER');
  assert.equal(optOut([], { id: 42 }).reason, 'INVALID_OWNER');
});