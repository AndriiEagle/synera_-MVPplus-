import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SWISS_CANTONS,
  SWISS_VAT_THRESHOLD_CHF,
  validateSwissCanton,
  getCantonInfo,
  formatSwissFrancs,
  getSwissVatDisclaimer,
} from './swiss-compliance.mjs';

test('DE-CH: exactly 26 official Swiss cantons are defined with multilingual names', () => {
  const codes = Object.keys(SWISS_CANTONS);
  assert.equal(codes.length, 26, 'Must have exactly 26 Swiss cantons');

  for (const code of codes) {
    assert.equal(code.length, 2, `Canton code ${code} must be 2 characters`);
    assert.equal(code, code.toUpperCase(), `Canton code ${code} must be uppercase`);
    const info = SWISS_CANTONS[code];
    assert.ok(info.name.de, `Canton ${code} must have German name`);
    assert.ok(info.name.fr, `Canton ${code} must have French name`);
    assert.ok(info.name.it, `Canton ${code} must have Italian name`);
    assert.ok(info.name.en, `Canton ${code} must have English name`);
    assert.ok(['de', 'fr', 'it', 'rm'].includes(info.primaryLang), `Valid Swiss language for ${code}`);
  }
});

test('DE-CH: validateSwissCanton validates case-insensitively and rejects invalid codes', () => {
  assert.equal(validateSwissCanton('ZH'), true);
  assert.equal(validateSwissCanton('zh'), true);
  assert.equal(validateSwissCanton(' Ge '), true);
  assert.equal(validateSwissCanton('TI'), true);
  assert.equal(validateSwissCanton('XX'), false);
  assert.equal(validateSwissCanton('DE'), false);
  assert.equal(validateSwissCanton(''), false);
  assert.equal(validateSwissCanton(null), false);
  assert.equal(validateSwissCanton(123), false);
});

test('DE-CH: getCantonInfo returns complete metadata for valid cantons and null for invalid', () => {
  const zh = getCantonInfo('zh');
  assert.equal(zh.code, 'ZH');
  assert.equal(zh.name.de, 'Zürich');
  assert.equal(zh.primaryLang, 'de');

  const ge = getCantonInfo('GE');
  assert.equal(ge.code, 'GE');
  assert.equal(ge.name.fr, 'Genève');
  assert.equal(ge.primaryLang, 'fr');

  assert.equal(getCantonInfo('INVALID'), null);
});

test('DE-CH: formatSwissFrancs formats CHF with Swiss apostrophe thousand separators', () => {
  assert.equal(formatSwissFrancs(0), 'CHF 0.00');
  assert.equal(formatSwissFrancs(50), 'CHF 0.50');
  assert.equal(formatSwissFrancs(15000), 'CHF 150.00');
  assert.equal(formatSwissFrancs(125000), "CHF 1'250.00");
  assert.equal(formatSwissFrancs(10000000), "CHF 100'000.00");
  assert.equal(formatSwissFrancs(-100), 'CHF 0.00');
  assert.equal(formatSwissFrancs('invalid'), 'CHF 0.00');
});

test('DE-CH: getSwissVatDisclaimer returns statutory MWSTG Art. 10 educational disclaimers', () => {
  const underLimitDe = getSwissVatDisclaimer(50000, 'de');
  assert.equal(underLimitDe.appliesExemption, true);
  assert.match(underLimitDe.text, /Art\. 10 MWSTG/);
  assert.match(underLimitDe.text, /befreit/);
  assert.match(underLimitDe.text, /keine Steuer- oder Rechtsberatung/);

  const aboveLimitDe = getSwissVatDisclaimer(120000, 'de');
  assert.equal(aboveLimitDe.appliesExemption, false);
  assert.match(aboveLimitDe.text, /mindestens CHF 100'000/);
  assert.match(aboveLimitDe.text, /ESTV/);

  const underLimitEn = getSwissVatDisclaimer(75000, 'en');
  assert.equal(underLimitEn.appliesExemption, true);
  assert.match(underLimitEn.text, /below CHF 100'000/);
  assert.match(underLimitEn.text, /no legal or tax advice/);
});
