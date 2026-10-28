import test from 'node:test';
import assert from 'node:assert/strict';
import { negotiateLocale, parseAcceptLanguage, CH_LOCALES, DEFAULT_CH_LOCALE } from '../../web_launch/i18n-ch.mjs';

test('Accept-Language parsing honours q-values, drops q=0 and junk, keeps order for ties', () => {
  assert.deepEqual(parseAcceptLanguage('fr-CH, fr;q=0.9, de;q=0.9, en;q=0.1, it;q=0'), ['fr-ch', 'fr', 'de', 'en']);
  assert.deepEqual(parseAcceptLanguage('de;q=0.5, it-CH;q=0.8'), ['it-ch', 'de']);
  assert.deepEqual(parseAcceptLanguage('<script>, en;q=abc, DE-ch'), ['de-ch']);
  assert.deepEqual(parseAcceptLanguage(''), []);
  assert.deepEqual(parseAcceptLanguage(undefined), []);
  assert.deepEqual(parseAcceptLanguage(['fr-FR', 'de']), ['fr-fr', 'de']);
});

test('exact Swiss tag wins over an earlier same-language tag only when it has equal or higher q', () => {
  assert.deepEqual(negotiateLocale('fr-CH,de;q=0.9'), { locale: 'fr-CH', matched: 'exact', requested: ['fr-ch', 'de'] });
  assert.equal(negotiateLocale('de-DE, it-CH;q=0.8').locale, 'it-CH', 'exact Swiss tag beats a language-only match');
  assert.equal(negotiateLocale('DE-CH').locale, 'de-CH', 'case-insensitive');
});

test('same language maps onto the Swiss variant: fr-FR → fr-CH, it-IT → it-CH, gsw → de-CH', () => {
  assert.equal(negotiateLocale('fr-FR,fr;q=0.9,en;q=0.8').locale, 'fr-CH');
  assert.equal(negotiateLocale(['it-IT', 'en-US']).locale, 'it-CH');
  assert.deepEqual(negotiateLocale('gsw-CH'), { locale: 'de-CH', matched: 'language', requested: ['gsw-ch'] });
  assert.equal(negotiateLocale('de-AT').matched, 'language');
});

test('unsupported, wildcard and empty requests fall back to de-CH (the Zürich pilot default)', () => {
  for (const input of ['en-US,en;q=0.9', '*', '', 'rm-CH', 'uk-UA', undefined, []]) {
    const result = negotiateLocale(input);
    assert.equal(result.locale, DEFAULT_CH_LOCALE, JSON.stringify(input));
    assert.equal(result.matched, 'fallback');
  }
});

test('wildcard stops the search at its position: higher-q "*" means fallback, lower-q "*" is ignored', () => {
  assert.deepEqual(negotiateLocale('*, fr-CH;q=0.5'), { locale: 'de-CH', matched: 'fallback', requested: ['*', 'fr-ch'] });
  assert.equal(negotiateLocale('fr-CH, *;q=0.1').matched, 'exact');
});

test('custom supported set keeps the product languages (uk is the source language)', () => {
  const supported = ['uk', ...CH_LOCALES, 'en'];
  assert.equal(negotiateLocale('uk-UA', { supported, fallback: 'uk' }).locale, 'uk');
  assert.equal(negotiateLocale('en-GB', { supported, fallback: 'uk' }).locale, 'en');
  assert.equal(negotiateLocale('pt-BR', { supported, fallback: 'uk' }).locale, 'uk');
  assert.throws(() => negotiateLocale('de', { supported: CH_LOCALES, fallback: 'uk' }), /fallback must be one of the supported/);
});
