import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterProfileForAudience,
  resolveViewerAudienceLevel,
  canViewField,
  DEFAULT_FIELD_AUDIENCE,
} from './field-audience.mjs';

const fullProfile = {
  id: 'usr-100',
  display_name: 'Elena (Zurich Tech)',
  city: 'Zürich',
  brief: { goal: 'Launch MVPs', offer_tags: ['automation'], need_tags: ['sales'] },
  offer_tags: ['automation'],
  need_tags: ['sales'],
  languages: ['de', 'en'],
  modes: ['exchange', 'paid_service'],
  mode_details: { paid_service: { role: 'supplier' } },
  contact_email: 'elena@private-agency.ch',
  contact_phone: '+41 79 123 4567',
  portfolio_samples: ['https://example.com/case1.pdf'],
  private_notes: 'Targeting 20k CHF monthly revenue',
  billing_account: 'CH93 0000 0000 0000 0000 0',
  auth_metadata: { last_ip: '127.0.0.1' },
};

test('C04.L3: resolves viewer audience level based on relationship context', () => {
  assert.equal(resolveViewerAudienceLevel({}), 'public');
  assert.equal(resolveViewerAudienceLevel({ inCommunity: true }), 'community');
  assert.equal(resolveViewerAudienceLevel({ inCommunity: true, hasMet: true }), 'after_meeting');
  assert.equal(resolveViewerAudienceLevel({ isOwner: true }), 'self_only');
});

test('C04.L3: public viewer cannot see community, contact, or private fields', () => {
  const filtered = filterProfileForAudience(fullProfile, { inCommunity: false, hasMet: false, isOwner: false });

  // Public fields exist
  assert.equal(filtered.id, 'usr-100');
  assert.equal(filtered.display_name, 'Elena (Zurich Tech)');
  assert.equal(filtered.city, 'Zürich');
  assert.deepEqual(filtered.languages, ['de', 'en']);

  // Community fields stripped
  assert.equal(filtered.modes, undefined);
  assert.equal(filtered.mode_details, undefined);

  // Contact fields stripped
  assert.equal(filtered.contact_email, undefined);
  assert.equal(filtered.contact_phone, undefined);
  assert.equal(filtered.portfolio_samples, undefined);

  // Private fields stripped
  assert.equal(filtered.private_notes, undefined);
  assert.equal(filtered.billing_account, undefined);
  assert.equal(filtered.auth_metadata, undefined);
});

test('C04.L3: community viewer sees public and community fields, but NOT contacts or private data', () => {
  const filtered = filterProfileForAudience(fullProfile, { inCommunity: true, hasMet: false, isOwner: false });

  // Community fields accessible
  assert.deepEqual(filtered.modes, ['exchange', 'paid_service']);
  assert.deepEqual(filtered.mode_details, { paid_service: { role: 'supplier' } });

  // Contact fields strictly hidden
  assert.equal(filtered.contact_email, undefined);
  assert.equal(filtered.contact_phone, undefined);

  // Private fields strictly hidden
  assert.equal(filtered.private_notes, undefined);
  assert.equal(filtered.billing_account, undefined);
});

test('C04.L3: after meeting viewer unlocks contact fields, but never private notes or billing', () => {
  const filtered = filterProfileForAudience(fullProfile, { inCommunity: true, hasMet: true, isOwner: false });

  // Contacts unlocked
  assert.equal(filtered.contact_email, 'elena@private-agency.ch');
  assert.equal(filtered.contact_phone, '+41 79 123 4567');
  assert.deepEqual(filtered.portfolio_samples, ['https://example.com/case1.pdf']);

  // Private notes and billing remain hidden
  assert.equal(filtered.private_notes, undefined);
  assert.equal(filtered.billing_account, undefined);
  assert.equal(filtered.auth_metadata, undefined);
});

test('C04.L3: profile owner sees all fields', () => {
  const filtered = filterProfileForAudience(fullProfile, { isOwner: true });

  assert.equal(filtered.private_notes, 'Targeting 20k CHF monthly revenue');
  assert.equal(filtered.billing_account, 'CH93 0000 0000 0000 0000 0');
  assert.equal(filtered.contact_email, 'elena@private-agency.ch');
});

test('C04.L3: fail-closed on unknown fields', () => {
  const withUnknown = {
    ...fullProfile,
    experimental_telemetry: 'confidential_vector',
  };

  const filtered = filterProfileForAudience(withUnknown, { inCommunity: true, hasMet: true, isOwner: false });
  assert.equal(filtered.experimental_telemetry, undefined, 'Unknown fields must default to self_only (fail-closed)');
});
