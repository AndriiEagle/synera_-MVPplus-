import test from 'node:test';
import assert from 'node:assert/strict';
import { explainDeclaredFit, normalizeDeclaredFitProfile } from './declared-fit.mjs';

const profile = (id, overrides = {}) => ({
  id, publicVisibility: true, fitConsent: true,
  gives: ['automation'], needs: ['sales'], languages: ['uk', 'en'],
  modes: ['exchange'], timePreferences: ['weekday_evening'],
  preferences: {
    communication: { enabled: true, values: ['async'] },
    work: { enabled: true, values: ['structured'] },
  },
  ...overrides,
});

test('declared fit explains two-way complementary self-declared skills without a score', () => {
  const result = explainDeclaredFit(
    profile('alina', { gives: ['automation'], needs: ['sales'] }),
    profile('bohdan', { gives: ['sales'], needs: ['automation'] }),
  );
  assert.equal(result.status, 'explained');
  assert.equal(result.ranking, null);
  assert.equal(result.explanation.complementarity.status, 'matched');
  assert.deepEqual(result.explanation.complementarity.toA, { status: 'matched', tags: ['sales'] });
  assert.deepEqual(result.explanation.complementarity.toB, { status: 'matched', tags: ['automation'] });
  assert.deepEqual(result.explanation.preferences.language, { status: 'matched', shared: ['en', 'uk'] });
});

test('declared fit keeps missing preferences unknown and known conflict distinct', () => {
  const result = explainDeclaredFit(
    profile('alina', { timePreferences: [], preferences: { communication: { enabled: true, values: ['async'] } } }),
    profile('bohdan', { gives: ['sales'], needs: ['automation'], timePreferences: ['weekend'], preferences: { communication: { enabled: true, values: ['phone'] } } }),
  );
  assert.deepEqual(result.explanation.preferences.time, { status: 'unknown', shared: [] });
  assert.deepEqual(result.explanation.preferences.communication, { status: 'mismatch', shared: [] });
  assert.deepEqual(result.explanation.preferences.work, { status: 'unknown', shared: [] });
});

test('revoked fit consent blocks comparison before any trait is emitted', () => {
  const result = explainDeclaredFit(profile('alina', { fitConsent: false }), profile('bohdan'));
  assert.equal(result.status, 'ineligible');
  assert.deepEqual(result.reasons, ['FIT_CONSENT_REQUIRED']);
  assert.equal(result.explanation, null);
});

test('fit consent never makes a hidden profile public', () => {
  const result = explainDeclaredFit(profile('alina', { publicVisibility: false }), profile('bohdan'));
  assert.equal(result.status, 'excluded');
  assert.deepEqual(result.reasons, ['CANDIDATE_NOT_PUBLIC']);
  assert.equal(result.explanation, null);
});

test('optional traits require explicit enablement on both sides and normalization drops undeclared fields', () => {
  const normalized = normalizeDeclaredFitProfile(profile('alina', {
    diagnosis: 'not allowed', personality: 'not allowed',
    preferences: { communication: { enabled: true, values: ['async'] }, work: { enabled: false, values: ['structured'] } },
  }));
  assert.deepEqual(Object.keys(normalized).sort(), ['fitConsent', 'gives', 'id', 'languages', 'needs', 'preferences', 'publicVisibility', 'modes', 'timePreferences'].sort());
  const result = explainDeclaredFit({ ...normalized }, profile('bohdan', { preferences: { communication: { enabled: false, values: ['async'] }, work: { enabled: true, values: ['structured'] } } }));
  assert.deepEqual(result.explanation.preferences.communication, { status: 'unknown', shared: [] });
  assert.deepEqual(result.explanation.preferences.work, { status: 'unknown', shared: [] });
});
