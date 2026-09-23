import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDesign, DESIGN_STORAGE_KEY, initDesignSwitch, normalizeDesign } from './pwa.mjs';

class Control {
  constructor(choice) { this.dataset = { designChoice: choice }; this.attrs = new Map(); this.listeners = new Map(); }
  setAttribute(key, value) { this.attrs.set(key, value); }
  addEventListener(type, handler) { this.listeners.set(type, handler); }
  click() { this.listeners.get('click')(); }
}

test('design switch defaults to premium but preserves the full classic interface as a keyboard-reachable choice', () => {
  const root = { dataset: { design: 'premium' } };
  const premium = new Control('premium');
  const classic = new Control('classic');
  const writes = new Map();
  const doc = { documentElement: root, querySelectorAll: () => [premium, classic] };
  const result = initDesignSwitch({ doc, storage: { getItem: () => null, setItem: (key, value) => writes.set(key, value) } });
  assert.equal(result.selected, 'premium');
  assert.equal(root.dataset.design, 'premium');
  assert.equal(premium.attrs.get('aria-pressed'), 'true');
  classic.click();
  assert.equal(root.dataset.design, 'classic');
  assert.equal(classic.attrs.get('aria-pressed'), 'true');
  assert.equal(premium.attrs.get('aria-pressed'), 'false');
  assert.equal(writes.get(DESIGN_STORAGE_KEY), 'classic');
});

test('design choice fails safely to premium when storage is unavailable or corrupted', () => {
  assert.equal(normalizeDesign('unknown'), 'premium');
  const root = { dataset: {} };
  assert.equal(applyDesign(root, 'unknown'), 'premium');
  const control = new Control('classic');
  const doc = { documentElement: root, querySelectorAll: () => [control] };
  assert.doesNotThrow(() => initDesignSwitch({ doc, storage: { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } } }));
  assert.equal(root.dataset.design, 'premium');
});
