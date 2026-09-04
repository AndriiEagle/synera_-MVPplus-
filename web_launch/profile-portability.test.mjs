import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvitationDraft, createPortableProfile, createPortableProfileJson, createShareCard, parseProfileImport, profileCompletion, profileMatchHint, profileSafetyFindings } from './profile-portability.mjs';

const profile = { display_name: 'Anna Keller', city: 'Zürich', offers: 'AI workflow automation for small teams', seeks: 'B2B sales intros and pricing feedback', is_discoverable: true };

test('profile import: consent is required before profile content is emitted', () => {
  const result = parseProfileImport('Name: Anna\nCity: Zürich\nI can help with: Design', { authorized: false });
  assert.equal(result.status, 'consent_required');
  assert.deepEqual(result.profile, { display_name: '', city: '', offers: '', seeks: '', is_discoverable: false });
});

test('profile import: labeled text is mapped into the existing profile fields', () => {
  const result = parseProfileImport('Ім’я: Анна\nМісто: Zürich\nМожу допомогти: UX design\nШукаю: B2B sales', { authorized: true });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.profile, { display_name: 'Анна', city: 'Zürich', offers: 'UX design', seeks: 'B2B sales', is_discoverable: false });
});

test('profile import: generic pasted profile stays in review mode', () => {
  const result = parseProfileImport('Anna Keller\nFounder building AI matchmaking in Zurich', { authorized: true });
  assert.equal(result.status, 'needs_review');
  assert.equal(result.profile.display_name, 'Anna Keller');
  assert.equal(result.profile.offers, '');
});

test('profile import: contacts and provider secrets block import before preview', () => {
  const contact = parseProfileImport('Name: Anna\nEmail: anna@example.invalid\nI can help with: design', { authorized: true });
  assert.equal(contact.status, 'blocked_sensitive');
  assert.deepEqual(contact.profile, { display_name: '', city: '', offers: '', seeks: '', is_discoverable: false });
  assert.equal(parseProfileImport('Name: Anna\nKey: sb_secret_abcdef', { authorized: true }).status, 'blocked_sensitive');
});

test('profile export: JSON roundtrip uses only portable public fields and disables visibility', () => {
  const json = createPortableProfileJson({ ...profile, id: 'owner-id', email: 'hidden@example.invalid' }, { exportedAt: '2026-09-04T12:00:00.000Z' });
  assert.equal(json.includes('owner-id'), false);
  assert.equal(json.includes('hidden@example'), false);
  const imported = parseProfileImport(json, { authorized: true });
  assert.equal(imported.status, 'ready');
  assert.equal(imported.profile.is_discoverable, false);
  assert.deepEqual(createPortableProfile(profile, { exportedAt: '2026-09-04T12:00:00.000Z' }).profile.is_discoverable, false);
});

test('profile sharing: localhost is omitted and sensitive fields are rejected', () => {
  const card = createShareCard(profile, { publicUrl: 'http://127.0.0.1:50877/' });
  assert.ok(card.includes('Synera profile: Anna Keller'));
  assert.equal(card.includes('127.0.0.1'), false);
  assert.throws(() => createShareCard({ ...profile, offers: 'Write me at anna@example.invalid' }));
  assert.deepEqual(profileSafetyFindings({ display_name: 'Anna', city: '', offers: 'sk-123456789012345678901234', seeks: '' }), ['можу допомогти:secret']);
});

test('profile completion: reports the four public fields users need for matchmaking', () => {
  assert.deepEqual(profileCompletion({ display_name: 'Anna', city: '', offers: '', seeks: 'Sales' }), { completed: 2, total: 4, missing: ['місто', 'що можеш дати'] });
});

test('profile match hint: distinguishes reciprocal, one-way and missing signal', () => {
  const left = { offers: 'UX design and AI automation', seeks: 'B2B sales intros' };
  const right = { offers: 'B2B sales and outreach', seeks: 'product design help' };
  assert.equal(profileMatchHint(left, right).status, 'reciprocal');
  assert.equal(profileMatchHint(left, { offers: 'B2B sales', seeks: '' }).status, 'one_way');
  assert.equal(profileMatchHint({ offers: 'gardening', seeks: 'hiking' }, { offers: 'cooking', seeks: 'music' }).status, 'no_signal');
  assert.ok(createInvitationDraft(left, right).includes('20 хвилин'));
});

test('profile match hint: Ukrainian compound words produce a reciprocal demo signal', () => {
  const left = { offers: 'Відеопрезентація і дизайн профілю', seeks: 'B2B-продажі та перші інтро' };
  const right = { offers: 'B2B-продажі та customer interviews', seeks: 'Відеопрезентація продукту' };
  const hint = profileMatchHint(left, right);
  assert.equal(hint.status, 'reciprocal');
  assert.ok(hint.label.includes('Відеопрезентація'));
  assert.ok(hint.label.includes('B2B-продажі'));
});
