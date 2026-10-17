import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSoftBlock,
  addHiddenPerson,
  addHiddenCategory,
  removeHidden,
  isViewerHidden,
  applyVisibility,
  filterDiscoverable,
} from './soft-block.mjs';

const ownerProfile = () => ({
  id: 'owner-1',
  display_name: 'Олена',
  city: 'Zürich',
  offers: ['design'],
  contact_email: 'olena@example.invalid',
  private_notes: 'PRIVATE_SENTINEL',
});

test('C04.L4: прихована ЛЮДИНА не бачить жодного поля', () => {
  const block = createSoftBlock({ hiddenPeople: ['u-2'] });
  const viewer = { id: 'u-2' };
  assert.equal(isViewerHidden(viewer, block), true);
  assert.deepEqual(applyVisibility(ownerProfile(), viewer, { softBlock: block }), {});
});

test('C04.L4: прихована КАТЕГОРІЯ не бачить жодного поля', () => {
  const block = createSoftBlock({ hiddenCategories: ['recruiter'] });
  const viewer = { id: 'u-9', categories: ['recruiter'] };
  assert.equal(isViewerHidden(viewer, block), true);
  assert.deepEqual(applyVisibility(ownerProfile(), viewer, { softBlock: block }), {});
  // Інший глядач із тією ж категорією теж прихований; глядач без категорії — ні.
  assert.equal(isViewerHidden({ id: 'u-9', categories: ['other'] }, block), false);
  assert.equal(isViewerHidden({ id: 'u-9' }, block), false);
});

test('C04.L4: неприхований глядач бачить лише дозволені аудиторією поля (C04.L3)', () => {
  const block = createSoftBlock({ hiddenPeople: ['u-999'] });
  const publicView = applyVisibility(ownerProfile(), { id: 'u-2' }, { softBlock: block });
  assert.equal(publicView.display_name, 'Олена');
  assert.equal(publicView.city, 'Zürich');
  assert.deepEqual(publicView.offers, ['design']);
  assert.equal('contact_email' in publicView, false);
  assert.equal('private_notes' in publicView, false);

  const afterMeeting = applyVisibility(ownerProfile(), { id: 'u-2', hasMet: true }, { softBlock: block });
  assert.equal(afterMeeting.contact_email, 'olena@example.invalid');
  assert.equal('private_notes' in afterMeeting, false);
});

test('C04.L4: fail-closed — невідоме поле не витікає сторонньому глядачу', () => {
  const block = createSoftBlock();
  const withUnknown = { ...ownerProfile(), secret_token: 'SHOULD_NOT_LEAK' };
  const filtered = applyVisibility(withUnknown, { id: 'u-2' }, { softBlock: block });
  assert.equal('secret_token' in filtered, false);
  // Власник бачить власні невідомі поля (self_only = власник), це не витік.
  const owner = applyVisibility(withUnknown, { id: 'owner-1', isOwner: true }, { softBlock: block });
  assert.equal(owner.secret_token, 'SHOULD_NOT_LEAK');
});

test('C04.L4: жодного сповіщення — функції чисті, ідемпотентні, без мутацій', () => {
  const block = createSoftBlock({ hiddenPeople: ['u-2'] });
  const profile = ownerProfile();
  const viewer = { id: 'u-2' };
  const before = JSON.stringify({ block, profile, viewer });
  const first = applyVisibility(profile, viewer, { softBlock: block });
  const second = applyVisibility(profile, viewer, { softBlock: block });
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify({ block, profile, viewer }), before);
  // Ніяких ключів-маркерів сповіщення у результаті.
  for (const key of Object.keys(first)) assert.ok(!/notif|alert|email_sent|message/i.test(key));
  // Модуль не експортує жодної функції надсилання.
  const module = { createSoftBlock, addHiddenPerson, addHiddenCategory, removeHidden, isViewerHidden, applyVisibility, filterDiscoverable };
  for (const [name] of Object.entries(module)) assert.ok(!/notify|emit|send|push|mail/i.test(name), name);
});

test('C04.L4: add/remove не мутують вхід і ідемпотентні', () => {
  const original = createSoftBlock();
  const withPerson = addHiddenPerson(original, 'u-2');
  assert.deepEqual(original, { hiddenPeople: [], hiddenCategories: [] });
  assert.deepEqual(withPerson.hiddenPeople, ['u-2']);
  assert.deepEqual(addHiddenPerson(withPerson, 'u-2').hiddenPeople, ['u-2']); // ідемпотентно
  const withCategory = addHiddenCategory(withPerson, 'recruiter');
  assert.deepEqual(withCategory, { hiddenPeople: ['u-2'], hiddenCategories: ['recruiter'] });
  const removed = removeHidden(withCategory, 'u-2');
  assert.deepEqual(removed, { hiddenPeople: [], hiddenCategories: ['recruiter'] });
});

test('C04.L4/P2: fail-closed — некоректний підпис НЕ мовчки відкидається, а повертає reason', () => {
  const original = createSoftBlock();
  const LONG = 'x'.repeat(65);
  // Додавання некоректної людини/категорії повертає вердикт відмови, а не блок.
  assert.deepEqual(addHiddenPerson(original, 42), { valid: false, reason: 'INVALID_LABEL' });
  assert.deepEqual(addHiddenPerson(original, ''), { valid: false, reason: 'INVALID_LABEL' });
  assert.deepEqual(addHiddenPerson(original, LONG), { valid: false, reason: 'INVALID_LABEL' });
  assert.deepEqual(addHiddenPerson(original, null), { valid: false, reason: 'INVALID_LABEL' });
  assert.deepEqual(addHiddenCategory(original, ''), { valid: false, reason: 'INVALID_LABEL' });
  assert.deepEqual(addHiddenCategory(original, 7), { valid: false, reason: 'INVALID_LABEL' });
  assert.deepEqual(addHiddenCategory(original, LONG), { valid: false, reason: 'INVALID_LABEL' });
  // Видалення некоректного підпису теж не мовчазний no-op.
  assert.deepEqual(removeHidden(original, 42), { valid: false, reason: 'INVALID_LABEL' });
  // Коректний вхід повертає звичайний блок без маркерів відмови.
  const ok = addHiddenPerson(original, 'u-2');
  assert.deepEqual(ok, { hiddenPeople: ['u-2'], hiddenCategories: [] });
  assert.equal('valid' in ok, false);
  // Некоректні сирі значення НЕ потрапляють у блок — власник бачить звіт dropped.
  const cleaned = createSoftBlock({ hiddenPeople: ['a', 'a', '', 7], hiddenCategories: [null, 'ok'] });
  assert.deepEqual(cleaned.hiddenPeople, ['a']);
  assert.deepEqual(cleaned.hiddenCategories, ['ok']);
  assert.deepEqual(cleaned.dropped, { people: 3, categories: 1 });
  // Чистий вхід — без поля dropped (форма блоку не розростається).
  assert.deepEqual(createSoftBlock({ hiddenPeople: ['u-2'] }), { hiddenPeople: ['u-2'], hiddenCategories: [] });
});

test('C04.L4: порожній блок не змінює нормальну поведінку аудиторії', () => {
  const block = createSoftBlock();
  const viewer = { id: 'u-2' };
  assert.equal(isViewerHidden(viewer, block), false);
  const filtered = applyVisibility(ownerProfile(), viewer, { softBlock: block });
  assert.equal(filtered.display_name, 'Олена');
  // Відсутній блок поводиться як порожній.
  assert.deepEqual(applyVisibility(ownerProfile(), viewer), filtered);
});

test('C04.L4: filterDiscoverable виключає профілі власників, що приховали глядача', () => {
  const profiles = [{ id: 'owner-1' }, { id: 'owner-2' }, { id: 'owner-3' }];
  const viewer = { id: 'u-2', categories: ['recruiter'] };
  const blocks = {
    'owner-1': createSoftBlock({ hiddenPeople: ['u-2'] }),
    'owner-2': createSoftBlock({ hiddenCategories: ['recruiter'] }),
    'owner-3': createSoftBlock(),
  };
  assert.deepEqual(filterDiscoverable(profiles, viewer, blocks), [{ id: 'owner-3' }]);
  assert.deepEqual(filterDiscoverable(profiles, { id: 'u-5' }, blocks), profiles);
  assert.deepEqual(filterDiscoverable(null, viewer, blocks), []);
});