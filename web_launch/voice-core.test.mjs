import test from 'node:test';
import assert from 'node:assert/strict';
import { splitCapture, insertPhrase, speechLanguage, SPEECH_LOCALES } from './voice-core.mjs';
import { VOICE_COPY } from './voice-copy.mjs';
import { readInputDraft, writeInputDraft, restoreProfileDraft, saveProfileDraft } from './input-drafts.mjs';
test('capture preserves phrases, punctuation and unassigned words in all three languages', () => {
  for (const [offer, need, goal] of [['Можу робити сайти.','Шукаю фотографа!','Мета: три клієнти.'],['Ich kann Webseiten bauen.','Ich suche Fotos.','Ziel: drei Kunden.'],['I can build sites.','I need photos.','Goal: three clients.']]) {
    const parsed = splitCapture(`Demo. ${offer} ${need} ${goal}`);
    assert.deepEqual(parsed, { offers: offer, seeks: need, goal, unassigned:'Demo.' });
  }
  assert.deepEqual(splitCapture('Вмію малювати; пропоную логотип. Потрібно фото.'), { offers:'Вмію малювати;\nпропоную логотип.', seeks:'Потрібно фото.', goal:'', unassigned:'' });
  assert.equal(splitCapture('Нічого не позначено.').unassigned, 'Нічого не позначено.');
  assert.equal(splitCapture('Не можу сьогодні.').offers, '');
  assert.equal(splitCapture('Безшукаю та canary.').seeks, '');
});
test('dictation replaces only selection, adds spacing and never silently truncates', () => {
  assert.equal(insertPhrase('Старе слово тут.', 'нове', 6, 11).value, 'Старе нове тут.');
  assert.equal(insertPhrase('Привіт', 'світе').value, 'Привіт світе');
  assert.equal(insertPhrase('Привіт', '.', 6).value, 'Привіт.');
  assert.equal(insertPhrase('Кіт', 'і пес', 3, 3, 5).value, 'Кіт');
  assert.equal(insertPhrase('Кіт', 'і пес', 3, 3, 5).full, true);
  assert.equal(insertPhrase('', '   ').changed, false);
});

test('capture preserves complete subject phrases including spoken English contractions', () => {
  for (const phrase of ['Я шукаю сайт.', 'Ich suche eine Webseite.', 'I am looking for a website.', "I'm looking for a website.", 'I’m looking for a website.']) {
    assert.deepEqual(splitCapture(phrase), { offers:'', seeks:phrase, goal:'', unassigned:'' });
  }
});
test('voice labels have exact key symmetry and locale follows only supported UI choices', () => {
  for (const lang of ['de','en']) assert.deepEqual(Object.keys(VOICE_COPY[lang]).sort(), Object.keys(VOICE_COPY.uk).sort());
  assert.equal(speechLanguage('de'), 'de'); assert.equal(speechLanguage('fr'), 'uk');
  assert.equal(SPEECH_LOCALES.de, 'de-CH');
});
test('tab autosave restores exact words but never restores visibility or consent', () => {
  const map = new Map(); globalThis.sessionStorage = { getItem:k=>map.get(k) ?? null, setItem:(k,v)=>map.set(k,v) };
  const fields = Object.fromEntries(['display_name','city','offers','seeks','goal','is_discoverable'].map(k=>[k,{ value:k, checked:false }]));
  const form = { elements: { namedItem:key=>fields[key] } };
  assert.equal(saveProfileDraft(form), true); fields.offers.value = ''; restoreProfileDraft(form); assert.equal(fields.offers.value,'offers');
  assert.equal(fields.is_discoverable.checked,false); assert.equal(readInputDraft('profile').is_discoverable,undefined);
  map.set('synera.voice.draft.v1:profile','broken'); assert.equal(readInputDraft('profile'),null);
  delete globalThis.sessionStorage; assert.equal(writeInputDraft('profile',{ offers:'x' }),false);
});
