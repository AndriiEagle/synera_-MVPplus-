import test from 'node:test';
import assert from 'node:assert/strict';
import { renderProfilePreview } from './pwa.mjs';

// The preview only mirrors the user's own fields; empty fields show an honest placeholder.
function field(value) { return { value }; }
function slot(key, empty) {
  const classes = new Set();
  return { dataset: { preview: key, ...(empty ? { empty } : {}) }, textContent: '', classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) }, classes };
}

test('preview mirrors own fields, marks empty ones and uppercases the initial', () => {
  const values = { display_name: 'олена', city: '', offers: 'Проведу три інтерв’ю', seeks: '  ', goal: 'Перевірити пропозицію' };
  const form = { elements: { namedItem: name => (name in values ? field(values[name]) : null) } };
  const nodes = [slot('initial'), slot('display_name', 'Твоє ім’я'), slot('city', 'Місто або онлайн'), slot('offers', 'x'), slot('seeks', 'Тут з’явиться те, що тобі потрібно.'), slot('goal', 'Не вказано')];
  const root = { querySelectorAll: () => nodes };
  assert.equal(renderProfilePreview(form, root), true);
  assert.deepEqual(nodes.map(n => n.textContent), ['О', 'олена', 'Місто або онлайн', 'Проведу три інтерв’ю', 'Тут з’явиться те, що тобі потрібно.', 'Перевірити пропозицію']);
  assert.equal(nodes[2].classes.has('is-empty'), true);
  assert.equal(nodes[4].classes.has('is-empty'), true);
  assert.equal(nodes[3].classes.has('is-empty'), false);
});

test('preview with no name shows a neutral mark, and a missing form does nothing', () => {
  const form = { elements: { namedItem: () => null } };
  const initial = slot('initial');
  assert.equal(renderProfilePreview(form, { querySelectorAll: () => [initial] }), true);
  assert.equal(initial.textContent, '·');
  assert.equal(renderProfilePreview(null, null), false);
});

test('user text is written as text, never parsed as markup', () => {
  const form = { elements: { namedItem: () => field('<img src=x onerror=alert(1)>') } };
  const node = slot('offers', 'x');
  renderProfilePreview(form, { querySelectorAll: () => [node] });
  assert.equal(node.textContent, '<img src=x onerror=alert(1)>');
  assert.equal('innerHTML' in node, false);
});
