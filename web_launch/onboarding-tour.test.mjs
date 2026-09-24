import test from 'node:test';
import assert from 'node:assert/strict';
import { TOUR_STEPS, TOUR_STORAGE_KEY, nextTourStep, shouldOfferTour } from './onboarding-tour.mjs';

test('first-user tour preserves a finite keyboard-safe step sequence', () => {
  assert.equal(TOUR_STEPS.length, 5);
  assert.equal(nextTourStep(0, -1), 0);
  assert.equal(nextTourStep(4, 1), 4);
  assert.equal(nextTourStep(2, 1), 3);
  assert.ok(TOUR_STEPS.every(step => step.target.startsWith('[data-tour=')));
  assert.match(TOUR_STEPS.map(step => step.body).join(' '), /не обіцяють збіг/);
});

test('tour is offered once but can be replayed from its explicit control', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  assert.equal(shouldOfferTour(storage), true);
  storage.setItem(TOUR_STORAGE_KEY, 'done');
  assert.equal(shouldOfferTour(storage), false);
});
