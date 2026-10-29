import test from 'node:test';
import assert from 'node:assert/strict';
import { livingFeed, startVisitor, visitorMessage, personaRespond, recordVisitorResult, classifyIntent } from './simulation.mjs';
import { createJournal, JOURNAL_KEY } from './journal.mjs';
import { COPY } from './simulation-copy.mjs';

test('A1: seeded conversations cover all ten existing people, triads and separate consents before meeting/result', () => {
  const feed = livingFeed(29, 'en');
  assert.deepEqual(feed, livingFeed(29, 'en'));
  assert.notDeepEqual(feed, livingFeed(30, 'en'));
  assert.equal(new Set(feed.flatMap(e => e.people)).size, 10);
  assert.ok(feed.some(e => e.people.length === 3));
  for (const thread of new Set(feed.map(e => e.thread))) {
    const events = feed.filter(e => e.thread === thread);
    assert.deepEqual(events.slice(0, 3).map(e => e.kind), ['proposal', 'question', 'change']);
    const consents = events.filter(e => e.kind === 'confirmation');
    assert.equal(new Set(consents.map(e => e.actor)).size, events[0].people.length);
    assert.ok(events.findIndex(e => e.kind === 'meeting') > events.findLastIndex(e => e.kind === 'confirmation'));
    assert.equal(events.at(-1).kind, 'result');
    assert.ok(events.every(e => e.demo === true && e.text));
    assert.match(events.find(e => e.kind === 'meeting').text, /Zürich/);
  }
});
test('A2: a question and a counter-offer cannot consent; two actors confirm separately, then result', () => {
  let s = startVisitor('bot-mira', { name: 'Guest', offers: 'research', seeks: 'a page' }, 29, 'en');
  s = visitorMessage(s, 'What will I receive?', 'en');
  s = personaRespond(s, 'en');
  assert.deepEqual(s.approvals, { visitor: false, persona: false });
  s = visitorMessage(s, 'Yes, but only 10 minutes', 'en');
  s = personaRespond(s, 'en');
  assert.equal(s.terms.limits, 'Yes, but only 10 minutes');
  assert.deepEqual(s.approvals, { visitor: false, persona: false });
  s = visitorMessage(s, 'Yes', 'en');
  assert.deepEqual(s.approvals, { visitor: true, persona: false });
  assert.throws(() => recordVisitorResult(s, 'en'));
  s = personaRespond(s, 'en');
  assert.deepEqual(s.approvals, { visitor: true, persona: true });
  assert.ok(s.messages.some(e => e.kind === 'meeting'));
  assert.equal(recordVisitorResult(s, 'en').status, 'result');
  const old = s.version;
  s = personaRespond(visitorMessage(s, 'Instead, a draft of two screens', 'en'), 'en');
  assert.ok(s.version > old);
  assert.deepEqual(s.approvals, { visitor: false, persona: false });
  assert.throws(() => recordVisitorResult(s, 'en'));
});
test('A2: decline is terminal, typed time and reward are preserved, unknown text asks instead of agreeing', () => {
  let s = startVisitor('bot-omar', { name: 'Guest', offers: 'design', seeks: 'intro' }, 9, 'de');
  for (const text of ['Morgen um 14:30', 'CHF 40 statt Tausch', 'lorem ipsum']) {
    s = personaRespond(visitorMessage(s, text, 'de'), 'de');
    assert.deepEqual(s.approvals, { visitor: false, persona: false });
  }
  assert.equal(s.terms.meeting, 'Morgen um 14:30');
  assert.equal(s.terms.reward, 'CHF 40 statt Tausch');
  s = personaRespond(visitorMessage(s, 'Nein danke', 'de'), 'de');
  assert.equal(s.status, 'declined');
  assert.throws(() => visitorMessage(s, 'Ja', 'de'));
  assert.throws(() => startVisitor('real-person', {}, 9));
  for (const [text, expected] of [['Так', 'accept'], ['ні', 'decline'], ['Yes, but no calls', 'limits'], ['Не погоджуюсь', 'decline'], ['Can you explain?', 'question'], ['Давай о 16:00', 'time'], ['замість цього один ескіз', 'scope']]) assert.equal(classifyIntent(text), expected, text);
  for (const text of ['Так, не погоджуюсь', 'Yes, I do not agree', 'Ja, aber ich bin nicht einverstanden']) assert.equal(classifyIntent(text), 'decline', text);
});
test('A3: journal has one key, exact timestamped envelope, profile recovery, filter/export/erase', () => {
  const map = new Map(), storage = { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) };
  const journal = createJournal(storage, () => '2026-10-29T20:00:00.000Z');
  journal.add('profile', 'visitor', 'Saved draft', { source: 'profile', profile: { name: 'M', offers: 'UX', seeks: 'sales' } });
  journal.add('consent', 'visitor', 'Only on device', { source: 'visitor' });
  assert.deepEqual([...map.keys()], ['synera.journal.v1']);
  assert.equal(JOURNAL_KEY, 'synera.journal.v1');
  assert.deepEqual(Object.keys(journal.entries()[0]), ['at', 'kind', 'actor', 'text', 'data']);
  assert.equal(createJournal(storage).profile().name, 'M');
  assert.equal(journal.entries('profile').length, 1);
  assert.equal(JSON.parse(journal.export()).entries.length, 2);
  journal.erase();
  assert.deepEqual(journal.entries(), []);
  assert.equal(map.has(JOURNAL_KEY), false);
});
test('A3: corrupt storage is preserved, denied storage retains current session and reports failure', () => {
  let raw = '{broken';
  const j = createJournal({ getItem: () => raw, setItem: (k,v) => { raw = v; } });
  j.add('message', 'visitor', 'test', {});
  assert.equal(raw, '{broken');
  assert.equal(j.persistent, false);
  const denied = createJournal({ getItem: () => { throw Error('denied'); } });
  denied.add('message', 'visitor', 'test', {});
  assert.equal(denied.entries().length, 1);
  assert.equal(denied.persistent, false);
});
test('A1–A5: all new interface, scenario and persona keys have uk/de/en symmetry', () => {
  assert.deepEqual(Object.keys(COPY.uk).sort(), Object.keys(COPY.de).sort());
  assert.deepEqual(Object.keys(COPY.uk).sort(), Object.keys(COPY.en).sort());
  for (const lang of ['uk', 'de', 'en']) assert.ok(Object.values(COPY[lang]).every(v => typeof v === 'string' && v.trim()));
});
