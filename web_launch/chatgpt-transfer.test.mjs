import test from 'node:test';
import assert from 'node:assert/strict';
import { CHATGPT_PROFILE_PROMPT, summarizeTransfer } from './chatgpt-transfer.mjs';
import { CAPABILITIES, CITIES, LANGUAGES, MODES } from './profile-brief.mjs';

const values = summary => Object.fromEntries(summary.map(item => [item.label, item.value]));

test('ChatGPT transfer prompt specifies every supported ID and fail-closed profile defaults', () => {
  for (const id of [...Object.keys(CAPABILITIES), ...Object.keys(CITIES), ...Object.keys(LANGUAGES), ...Object.keys(MODES)]) assert.match(CHATGPT_PROFILE_PROMPT, new RegExp(`\\b${id}\\b`));
  for (const field of ['synera-profile-2', 'display_name', 'city', 'offers', 'seeks', 'goal', 'available_from', 'available_until', 'is_discoverable', 'map_visible', 'confidentiality', 'accepts_confidentiality']) assert.match(CHATGPT_PROFILE_PROMPT, new RegExp(field));
  assert.match(CHATGPT_PROFILE_PROMPT, /не мати доступу до повної історії/u);
  assert.match(CHATGPT_PROFILE_PROMPT, /не вигадуй/u);
});

test('transfer summary normalizes known fields into the review labels', () => {
  const summary = values(summarizeTransfer({ brief: {
    goal: '  Знайти партнера для одного пілоту  ', offer_tags: ['automation', 'automation', 'design'], need_tags: ['sales'],
    languages: ['uk', 'de'], modes: ['exchange'], city_code: 'zurich', remote: true, max_km: 100,
    available_from: '2026-10-01', available_until: '2026-10-15', confidentiality: true, accepts_confidentiality: true,
  } }));
  assert.deepEqual(summary, {
    'Ціль': 'Знайти партнера для одного пілоту', 'Пропоную': 'Автоматизація процесів, Дизайн продукту',
    'Шукаю': 'B2B-продажі', 'Мови': 'Українська, Deutsch', 'Формати': 'Обмін допомогою',
    'Місто або онлайн': 'Zürich', 'Онлайн': 'Так', 'Максимальна відстань': '100 км',
    'Доступність': '2026-10-01 — 2026-10-15', 'Потребує конфіденційності': 'Так', 'Приймає конфіденційність': 'Так',
  });
});

test('transfer summary fails closed for malformed, unknown, and prototype-supplied identifiers', () => {
  const inherited = Object.create({ brief: { goal: 'hidden', offer_tags: ['automation'] } });
  const polluted = { brief: { goal: 42, offer_tags: ['unknown'], need_tags: ['__proto__'], languages: ['xx'], modes: ['constructor'], city_code: 'toString', remote: 'true', available_from: 'not-a-date' } };
  assert.deepEqual(values(summarizeTransfer(inherited)), {
    'Ціль': 'Не вказано', 'Пропоную': 'Не вказано', 'Шукаю': 'Не вказано', 'Мови': 'Не вказано', 'Формати': 'Не вказано', 'Місто або онлайн': 'Не вказано', 'Онлайн': 'Ні', 'Максимальна відстань': '25 км', 'Доступність': 'Не вказано', 'Потребує конфіденційності': 'Ні', 'Приймає конфіденційність': 'Ні',
  });
  assert.deepEqual(values(summarizeTransfer(polluted)), values(summarizeTransfer(null)));
});

test('transfer summary never infers availability from partial or dated input', () => {
  const fromOnly = values(summarizeTransfer({ brief: { available_from: '2026-12-01' } }));
  const untilOnly = values(summarizeTransfer({ brief: { available_until: '2026-12-10' } }));
  assert.equal(fromOnly['Доступність'], '2026-12-01');
  assert.equal(untilOnly['Доступність'], '2026-12-10');
  assert.equal(values(summarizeTransfer({ brief: { available_from: '2026-02-30', available_until: '2026-12-10' } }))['Доступність'], '2026-12-10');
});
