import test from 'node:test';
import assert from 'node:assert/strict';
import { localeForCanton, CH_LOCALES } from '../../web_launch/i18n-ch.mjs';
import { SWISS_CANTONS } from '../../web_launch/swiss-compliance.mjs';

test('canton primary language maps to the matching Swiss locale', () => {
  assert.equal(localeForCanton('ZH'), 'de-CH');
  assert.equal(localeForCanton('ge'), 'fr-CH');
  assert.equal(localeForCanton(' TI '), 'it-CH');
  assert.equal(localeForCanton('VS'), 'fr-CH', 'bilingual Valais keeps its registered primary language');
});

test('every canton resolves to one of the three locales; unknown codes resolve to null', () => {
  for (const code of Object.keys(SWISS_CANTONS)) assert.ok(CH_LOCALES.includes(localeForCanton(code)), code);
  assert.equal(Object.keys(SWISS_CANTONS).length, 26);
  for (const bad of ['XX', '', null, 12, 'ZHH']) assert.equal(localeForCanton(bad), null, String(bad));
});
