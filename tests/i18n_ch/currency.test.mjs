import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCHF, formatCHFPlain, CH_LOCALES } from '../../web_launch/i18n-ch.mjs';
import { formatSwissFrancs } from '../../web_launch/swiss-compliance.mjs';

const NBSP = ' ', APO = '’', NNBSP = ' ';

test('CHF per locale follows CLDR: code position, grouping and point decimal', () => {
  assert.equal(formatCHF(125050, 'de-CH'), `CHF${NBSP}1${APO}250.50`);
  assert.equal(formatCHF(125050, 'fr-CH'), `1${NNBSP}250.50${NBSP}CHF`);
  assert.equal(formatCHF(125050, 'it-CH'), `CHF${NBSP}1250.50`, 'Italian groups only from five integer digits');
  assert.equal(formatCHF(1234567, 'it-CH'), `CHF${NBSP}12${APO}345.67`);
  assert.equal(formatCHF(123456789, 'de-CH'), `CHF${NBSP}1${APO}234${APO}567.89`);
  assert.equal(formatCHF(123456789, 'fr-CH'), `1${NNBSP}234${NNBSP}567.89${NBSP}CHF`);
});

test('zero, single rappen and amounts below one franc keep two decimals', () => {
  for (const locale of CH_LOCALES) {
    assert.match(formatCHF(0, locale), /0\.00/);
    assert.match(formatCHF(5, locale), /\b0\.05\b/);
    assert.match(formatCHF(750, locale), /\b7\.50\b/);
  }
});

test('hand-built output agrees with the engine Intl.NumberFormat after separator normalisation', () => {
  // The grouping glyph is ICU/CLDR data, not our contract: Node 22 and Node 24 (CLDR 48) print an ASCII apostrophe
  // for de-CH/it-CH and fr-CH currency; formatCHF keeps U+2019 / U+202F, which the first test pins. Compare code
  // position, digits and the decimal point; ignore which grouping and space glyph the runtime uses.
  const norm = s => s.replace(/[\s\u00a0\u202f\u2019']/g, '');
  for (const locale of CH_LOCALES) for (const minor of [0, 5, 750, 125050, 1234567, 123456789]) {
    const intl = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CHF' }).format(minor / 100);
    assert.equal(norm(formatCHF(minor, locale)), norm(intl), `${locale} ${minor}`);
  }
});

test('negative, fractional, NaN and string inputs are rejected instead of silently zeroed', () => {
  for (const bad of [-1, 12.5, NaN, Infinity, '1250', null, undefined, 2 ** 53]) assert.throws(() => formatCHF(bad, 'de-CH'), TypeError, String(bad));
  assert.throws(() => formatCHF(100, 'de-DE'), /unsupported Swiss locale/);
  assert.throws(() => formatCHF(100, 'en'), /unsupported Swiss locale/);
});

test('plain ASCII variant for ICS/CSV', () => {
  assert.equal(formatCHFPlain(125050), 'CHF 1250.50');
  assert.equal(formatCHFPlain(5), 'CHF 0.05');
  assert.throws(() => formatCHFPlain(-5), TypeError);
});

test('documented divergence: legacy swiss-compliance.formatSwissFrancs uses an ASCII apostrophe', () => {
  // Kept as a fact, not a target: product screens that mix both helpers show two different grouping marks.
  assert.equal(formatSwissFrancs(125000), "CHF 1'250.00");
  assert.notEqual(formatSwissFrancs(125000).replace(' ', NBSP), formatCHF(125000, 'de-CH'));
});
