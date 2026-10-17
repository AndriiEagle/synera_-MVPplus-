import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  DICTIONARY,
  getLocale,
  setLocale,
  t,
  detectLocale
} from './i18n.mjs';

test('i18n: supports uk, de, and en with default uk', () => {
  assert.deepEqual(SUPPORTED_LOCALES, ['uk', 'de', 'en']);
  assert.equal(DEFAULT_LOCALE, 'uk');
  assert.equal(getLocale(), 'uk');
});

test('i18n: dictionary key symmetry across all languages', () => {
  const ukKeys = Object.keys(DICTIONARY.uk).sort();
  const deKeys = Object.keys(DICTIONARY.de).sort();
  const enKeys = Object.keys(DICTIONARY.en).sort();

  assert.deepEqual(deKeys, ukKeys, 'German dictionary keys must match Ukrainian keys 1:1');
  assert.deepEqual(enKeys, ukKeys, 'English dictionary keys must match Ukrainian keys 1:1');
});

test('i18n: switching locale updates translated output', () => {
  setLocale('de');
  assert.equal(getLocale(), 'de');
  assert.equal(t('nav.people'), 'Personen');
  assert.equal(t('nav.profile'), 'Mein Profil');

  setLocale('en');
  assert.equal(getLocale(), 'en');
  assert.equal(t('nav.people'), 'People');

  setLocale('uk');
  assert.equal(getLocale(), 'uk');
  assert.equal(t('nav.people'), 'Люди');
});

test('i18n: falls back cleanly for unknown locale or missing keys', () => {
  assert.equal(setLocale('fr'), false);
  assert.equal(getLocale(), 'uk');
  assert.equal(t('nonexistent.key'), 'nonexistent.key');
});

test('i18n: detects locale from browser language header', () => {
  assert.equal(detectLocale('de-CH'), 'de');
  assert.equal(detectLocale('de-DE'), 'de');
  assert.equal(detectLocale('en-US'), 'en');
  assert.equal(detectLocale('uk-UA'), 'uk');
  assert.equal(detectLocale('it-CH'), 'uk'); // fallback to default
});
