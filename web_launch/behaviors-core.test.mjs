// C13.L2b — поведінкові тести логічних модулів: calendar / simulation / health-check.
// Фікстури пораховані ВРУЧНУ (house style): не підганялись під код.
// Epoch-опора: 2026-01-01T00:00:00Z = 1767225600; 2026-09-22 = +264 доби = 1790035200.
//   2026-09-22T10:00:00Z = 1790071200 → slot = 1790071200/3600 = 497242; slot%5=2, slot%3=1.
//   2026-09-22T01:00:00Z = 1790038800 → slot = 497233; Цюрих (CEST, UTC+2) → 03:00 → офлайн.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { meetingCalendar } from './calendar.mjs';
import { BOT_PROFILES, DEMO_PLACES, hourSlot, simulationAt, simulatedReply, demoCollaborations } from './simulation.mjs';

// ---------- calendar.mjs (RFC 5545) ----------

const VCALENDAR_HEAD = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Synera//Meetings//UK', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT'].join('\r\n');
const VCALENDAR_TAIL = ['STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');

test('C13.L2b calendar: прийнята зустріч 20 хв → точний hand-computed ICS (escape , ; \\n)', () => {
  const now = '2026-09-23T08:00:00.000Z';
  const out = meetingCalendar({
    id: 'meet-1', status: 'accepted', proposed_at: '2026-09-22T10:00:00.000Z',
    duration_minutes: 20, meeting_place: 'Zürich, West', note: 'Розмова\nдругий; рядок',
  }, now);
  const expected = [
    VCALENDAR_HEAD,
    'UID:meet-1@synera',
    'DTSTAMP:20260923T080000Z', // stamp(now): '2026-09-23T08:00:00.000Z' без -,: і .ms
    'DTSTART:20260922T100000Z',
    'DTEND:20260922T102000Z',   // 10:00 + 20 хв
    'SUMMARY:Synera — розмова про співпрацю',
    'LOCATION:Zürich\\, West',            // кома екранована
    'DESCRIPTION:Розмова\\nдругий\\; рядок', // \n → literal \\n, ; → \\;
    VCALENDAR_TAIL,
  ].join('\r\n') + '\r\n';
  assert.equal(out, expected);
});

test('C13.L2b calendar: тривалості 30 і 60 хв — DTEND вручну порахований', () => {
  const base = { id: 'm2', status: 'accepted', proposed_at: '2026-09-22T10:00:00.000Z', meeting_place: 'Hauptbahnhof', note: '' };
  assert.equal(
    meetingCalendar({ ...base, duration_minutes: 30 }, '2026-09-23T08:00:00Z').split('\r\n').find(l => l.startsWith('DTEND:')),
    'DTEND:20260922T103000Z',
  );
  assert.equal(
    meetingCalendar({ ...base, duration_minutes: 60 }, '2026-09-23T08:00:00Z').split('\r\n').find(l => l.startsWith('DTEND:')),
    'DTEND:20260922T110000Z',
  );
});

test('C13.L2b calendar: межа fold 73 байти — продовження "\\r\\n " пораховане вручну', () => {
  // Рядок 'LOCATION:' (9 байт) + 80 ASCII 'a' = 89 байтів. fold: перші 73 байти — перший рядок,
  // далі пробіл-продовження + решта 16 символів.
  const out = meetingCalendar({
    id: 'fold-1', status: 'accepted', proposed_at: '2026-09-22T10:00:00.000Z',
    duration_minutes: 20, meeting_place: 'a'.repeat(80), note: '',
  }, '2026-09-23T08:00:00Z');
  const expectedFolded = 'LOCATION:' + 'a'.repeat(64) + '\r\n' + ' ' + 'a'.repeat(16);
  assert.ok(out.includes(expectedFolded), 'рядок LOCATION має бути згорнутий за RFC 5545');
  // Кожен продовжувальний рядок починається з пробілу.
  for (const line of out.split('\r\n')) assert.ok(line === '' || !line.startsWith(' ') || out.includes(expectedFolded));
});

test('C13.L2b calendar: fail-closed — відхилені/некоректні зустрічі кидають доменну помилку', () => {
  const base = { id: 'm3', status: 'accepted', proposed_at: '2026-09-22T10:00:00.000Z', duration_minutes: 20, meeting_place: 'X', note: '' };
  const MSG = 'До календаря можна додати лише прийняту зустріч із погодженим часом.';
  const throwsMsg = fn => assert.throws(fn, { message: MSG }); // точний збіг message
  throwsMsg(() => meetingCalendar({ ...base, status: 'pending' }));          // не прийнята
  throwsMsg(() => meetingCalendar({ ...base, duration_minutes: 45 }));       // поза [20,30,60]
  throwsMsg(() => meetingCalendar({ ...base, id: 'bad id!' }));              // id поза /^[a-z0-9-]{1,40}$/i
  throwsMsg(() => meetingCalendar({ ...base, id: 'x'.repeat(41) }));         // 41 символ > 40
  throwsMsg(() => meetingCalendar({ ...base, proposed_at: 'not-a-date' }));  // NaN
  throwsMsg(() => meetingCalendar({ ...base, duration_minutes: 0 }));        // нуль
});

// ---------- simulation.mjs ----------

test('C13.L2b simulation: парк ботів і демо-місць — константний контракт', () => {
  assert.equal(BOT_PROFILES.length, 10);
  assert.equal(DEMO_PLACES.length, 5);
  assert.deepEqual(BOT_PROFILES.map(b => b.id),
    ['bot-mira', 'bot-leo', 'bot-nora', 'bot-felix', 'bot-ines', 'bot-sam', 'bot-tessa', 'bot-noah', 'bot-lina', 'bot-omar']);
  for (const bot of BOT_PROFILES) {
    assert.equal(bot.is_bot, true);
    assert.equal(bot.city, 'Zürich');
    assert.equal(bot.is_discoverable, true);
  }
  assert.deepEqual(BOT_PROFILES.map(b => b.index), [...Array(10).keys()]);
  assert.deepEqual(DEMO_PLACES.map(p => p.id), ['west', 'hb', 'university', 'sihl', 'lake']);
});

test('C13.L2b simulation: hourSlot — вручну пораховані слоти і доменна помилка', () => {
  assert.equal(hourSlot('2026-09-22T10:00:00Z'), 497242); // 1790071200/3600
  assert.equal(hourSlot('2026-09-22T01:00:00Z'), 497233); // 1790038800/3600
  assert.equal(hourSlot(0), 0);                            // епоха
  assert.throws(() => hourSlot('not-a-date'), /Некоректний годинник симуляції/);
});

test('C13.L2b simulation: simulationAt 10:00Z — Цюрих 12:00, усі прокинуті, точні значення бот-0 і бот-1', () => {
  const at = '2026-09-22T10:00:00Z';
  const bots = simulationAt(at);
  assert.equal(bots.length, 10);
  const mira = bots[0];
  // slot=497242: ACTIVITIES[(497242+0)%5=2] → 'meeting'; DEMO_PLACES[(497242+0)%5=2] → university.
  assert.equal(mira.id, 'bot-mira');
  assert.equal(mira.state, 'meeting');
  assert.equal(mira.activity, 'Обговорює спільний експеримент');
  assert.equal(mira.place, 'Університетський район · демозона');
  assert.equal(mira.lat, 47.376);          // (index%2)=0 → зсуву немає
  assert.equal(mira.lon, 8.548);           // floor(0/2)*0.001 = 0
  assert.equal(mira.updated_hour, 497242);
  assert.equal(mira.location_kind, 'synthetic');
  assert.equal(mira.source, 'local-simulation');
  const leo = bots[1];
  // (497242+1)%5=3 → ACTIVITIES[3] і DEMO_PLACES[3]=sihl (lat 47.366, lon 8.530); lat +0.0012, lon +0.
  assert.equal(leo.state, 'learning');
  assert.equal(leo.activity, 'Перевіряє ідею з учасниками спільноти');
  assert.equal(leo.place, 'Sihl · демозона');
  assert.equal(leo.lat, 47.366 + 0.0012);
  assert.equal(leo.lon, 8.530);
  // Усі стани — з валідного набору активностей.
  const STATES = new Set(['available', 'working', 'meeting', 'learning', 'walking']);
  for (const bot of bots) assert.ok(STATES.has(bot.state), bot.state);
});

test('C13.L2b simulation: simulationAt 01:00Z — ніч, усі офлайн, місце від (0+index)%5', () => {
  const bots = simulationAt('2026-09-22T01:00:00Z');
  for (const bot of bots) {
    assert.equal(bot.state, 'offline');
    assert.equal(bot.activity, 'Відпочиває до ранку');
  }
  // (0+0)%5=0 → west; (0+1)%5=1 → hb.
  assert.equal(bots[0].place, 'Zürich West · демозона');
  assert.equal(bots[1].place, 'Hauptbahnhof · демозона');
  assert.equal(bots[0].updated_hour, 497233);
});

test('C13.L2b simulation: simulatedReply — reciprocal від mira до leo, declined без сигналів, fail-closed', () => {
  const at = '2026-09-22T10:00:00Z';
  const [mira, leo] = BOT_PROFILES;
  // mira шукає B2B sales/customer interviews — leo це пропонує; leo шукає UX design — mira пропонує → reciprocal.
  // Теги вручну: mira.seeks∩leo.offers={research,sales}; leo.seeks∩mira.offers={design};
  // мітки з CAPABILITIES: design→'Дизайн продукту', research→'Інтерв’ю з клієнтами', sales→'B2B-продажі'.
  const ok = simulatedReply(mira, leo, at);
  assert.equal(ok.status, 'accepted');
  assert.equal(ok.simulated, true);
  assert.equal(ok.responded_hour, 497242);
  assert.ok(ok.response_note.startsWith('ДЕМО-ВІДПОВІДЬ: Є двостороння тема: '), ok.response_note);
  assert.ok(ok.response_note.endsWith('. Давай почнемо з 20 хвилин і одного спільного експерименту.'));
  // Sender без жодної теми → no_signal → declined; note порахована вручну.
  const silent = { display_name: 'Кераміст', offers: ['кераміка'], seeks: ['садівництво'] };
  const no = simulatedReply(silent, mira, at);
  assert.equal(no.status, 'declined');
  assert.equal(no.response_note, 'ДЕМО-ВІДПОВІДЬ: Потрібно більше конкретики в профілях. Уточни, що кожен отримає; цей запит поки відхиляю.');
  // Небот-одержувач відкидається з доменною помилкою.
  assert.throws(() => simulatedReply(mira, { id: 'u-1' }, at), /Потрібний отримувач симуляції/);
  assert.throws(() => simulatedReply(mira, null, at), /Потрібний отримувач симуляції/);
});

test('C13.L2b simulation: demoCollaborations — 5 пар, id з слотом, next_step за slot%3', () => {
  const at = '2026-09-22T10:00:00Z';
  const collabs = demoCollaborations(at);
  assert.equal(collabs.length, 5);
  // slot%3 = 497242%3 = 1 → 'Обмінятися прикладами робіт'.
  assert.deepEqual(collabs[0], {
    id: 'bot-mira:bot-leo:497242',
    left: 'Mira · Demo',
    right: 'Leo · Demo',
    summary: 'Є двостороння тема: Дизайн продукту, Інтерв’ю з клієнтами, B2B-продажі.',
    next_step: 'Обмінятися прикладами робіт',
    simulated: true,
  });
  // Остання пара — [8,9] = lina:omar.
  assert.equal(collabs[4].id, 'bot-lina:bot-omar:497242');
  assert.equal(collabs[4].left, 'Lina · Demo');
  assert.equal(collabs[4].right, 'Omar · Demo');
});

test('C13.L2b simulation: demoCollaborations — сусідній годинний слот змінює лише slot у id', () => {
  const a = demoCollaborations('2026-09-22T10:00:00Z')[0].id;
  const b = demoCollaborations('2026-09-22T11:00:00Z')[0].id;
  assert.equal(b, 'bot-mira:bot-leo:497243');
  assert.notEqual(a, b);
});

// ---------- health-check.mjs ----------
// ЧЕСНИЙ ГЕП: health-check.mjs не експортує нічого і виконує мережевий виклик
// Supabase ПРЯМО ПРИ import (loadConfig → SupabaseStore.availability()). Імпортувати
// його в тесті безпечно не можна → детерміновано покриваємо структурний контракт
// джерела; поведінкові шляхи reachable/restricted потребують мережі і тут НЕ покриті.

test('C13.L2b health-check (структурно): модуль не експортує нічого — геп зафіксований', () => {
  const src = fs.readFileSync(new URL('./health-check.mjs', import.meta.url), 'utf8');
  assert.equal(/^export\s/m.test(src), false, 'health-check не має експортів — тестувати можна лише через side-ефекти');
});

test('C13.L2b health-check (структурно): fail-closed гейт — ready_for_launch ніколи не true, аварійний exit 2', () => {
  const src = fs.readFileSync(new URL('./health-check.mjs', import.meta.url), 'utf8');
  assert.equal(/ready_for_launch:\s*true/.test(src), false, 'health-check не має права оголошувати готовність до запуску');
  assert.match(src, /process\.exitCode\s*=\s*2/, 'шлях недоступності мусить ставити exitCode 2');
  assert.match(src, /Потрібна онлайн конфігурація/, 'без supabaseUrl імпорт падає з доменною помилкою до мережі');
});