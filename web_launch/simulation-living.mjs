import { BOT_PROFILES } from './simulation-personas.mjs';
import { copy } from './simulation-copy.mjs';
// The existing local simulator's session-paced mode. No API, auth or provider.
const keyOf = id => id.replace(/^bot-/, '');
const hashSeed = seed => [...String(seed)].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
export function livingFeed(seed, lang = 'uk') {
  const n = hashSeed(seed), groups = [['mira', 'leo', 'tessa'], ['nora', 'felix'], ['ines', 'sam', 'noah'], ['lina', 'omar']];
  const threads = groups.map((keys, i) => {
    const people = keys.map(k => `bot-${k}`), thread = `demo-${n}-${i}`;
    const event = (kind, actor, text) => ({ thread, people, kind, actor, text, demo: true });
    return [event('proposal', people[0], copy(lang, 'feedProposal', { topic: copy(lang, `topic${i}`) })),
      event('question', people[1], copy(lang, 'feedQuestion')),
      event('change', people[0], copy(lang, 'feedChange')),
      event('confirmation', people[0], copy(lang, 'feedYes')),
      event('confirmation', people[1], copy(lang, 'feedYes')),
      ...(people[2] ? [event('confirmation', people[2], copy(lang, 'feedThird'))] : []),
      event('meeting', people[1], copy(lang, 'meetingReply', { meeting: copy(lang, 'defaultTime', { hour: 10 + (n + i) % 6 }) })),
      event('result', people[0], copy(lang, 'feedResult'))];
  });
  const order = threads.map((_, i) => (i + n % threads.length) % threads.length);
  return Array.from({ length: Math.max(...threads.map(t => t.length)) }, (_, row) => order.map(i => threads[i][row]).filter(Boolean)).flat();
}
export function classifyIntent(text) {
  const t = String(text).trim().toLocaleLowerCase();
  if (/не погод|не згод|do not agree|don't agree|nicht einverstanden|lehne ab/u.test(t)) return 'decline';
  if (/^(ні\b|ні[,.! ]|ні$|не погод|не згод|не хочу|відмов|no\b|no thanks|nein\b|decline|stop\b|стоп)/u.test(t)) return 'decline';
  if (/\d{1,2}[:.]\d{2}|\b(tomorrow|monday|tuesday|meeting|morgen|uhr)\b|завтра|зустрі|(?:о|об) \d/u.test(t)) return 'time';
  if (/\b(chf|reward|payment|exchange|tausch|bezahlung)\b|винагород|оплат|обмін|безкоштов/u.test(t)) return 'reward';
  if (/\b(only|limit|minutes|but|nur|minuten|grenz)\b|лише|тільки|хвилин|але|меж/u.test(t)) return 'limits';
  if (/\b(instead|scope|sketch|draft|stattdessen|statt|skizze|umfang)\b|замість|обсяг|ескіз|чернетк/u.test(t)) return 'scope';
  if (/\?|\b(what|why|how|can you|was|wie|warum)\b|що|як|чому/u.test(t)) return 'question';
  if (/^(так|погоджуюсь|згод[еа]н|yes|i agree|accept|ja|ich stimme)(?:$|[\s,.!])/u.test(t)) return 'accept';
  return 'unknown';
}
const spoken = (actor, kind, text) => ({ actor, kind, text, demo: true });
export function startVisitor(personId, profile, seed, lang = 'uk') {
  if (!BOT_PROFILES.some(p => p.id === personId)) throw Error('Demo person required');
  if (![profile.name, profile.offers, profile.seeks].every(v => typeof v === 'string' && v.trim())) throw Error('Complete card required');
  const terms = { scope: profile.seeks, reward: profile.offers, limits: copy(lang, 'defaultLimits'), meeting: copy(lang, 'defaultTime', { hour: 10 + hashSeed(seed) % 6 }) };
  return { personId, profile: structuredClone(profile), seed, version: 1, terms, approvals: { visitor: false, persona: false }, status: 'negotiating', pendingIntent: null,
    messages: [spoken(personId, 'proposal', `${copy(lang, `voice_${keyOf(personId)}`)} ${copy(lang, 'intro', { name: profile.name, need: profile.seeks, offer: profile.offers })}`)] };
}
export function visitorMessage(previous, text, lang = 'uk') {
  if (previous.status === 'declined' || previous.pendingIntent || !String(text).trim()) throw Error('Conversation not ready');
  const s = structuredClone(previous), intent = classifyIntent(text);
  s.pendingIntent = intent;
  if (['scope', 'reward', 'limits', 'time'].includes(intent)) {
    s.version++; s.terms[intent === 'time' ? 'meeting' : intent] = text;
    s.approvals = { visitor: false, persona: false }; s.status = 'negotiating';
  }
  if (intent === 'accept') s.approvals.visitor = true;
  if (intent === 'decline') { s.approvals = { visitor: false, persona: false }; s.status = 'declined'; }
  s.messages.push(spoken('visitor', intent === 'accept' ? 'confirmation' : ['scope', 'reward', 'limits', 'time'].includes(intent) ? 'change' : intent === 'question' ? 'question' : 'message', text));
  return s;
}
export function personaRespond(previous, lang = 'uk') {
  const s = structuredClone(previous), intent = s.pendingIntent;
  if (!intent) return s;
  s.pendingIntent = null;
  let reply = intent === 'decline' ? 'noReply' : intent === 'accept' ? 'yesReply' : intent === 'question' ? 'questionReply' : intent === 'unknown' ? 'unknownReply' : 'changeReply';
  s.messages.push(spoken(s.personId, intent === 'accept' ? 'confirmation' : 'message', `${copy(lang, `voice_${keyOf(s.personId)}`)} ${copy(lang, reply, s.terms)}`));
  if (intent === 'accept') {
    s.approvals.persona = true; s.status = 'agreed';
    s.messages.push(spoken(s.personId, 'meeting', copy(lang, 'meetingReply', s.terms)));
  }
  return s;
}
export function recordVisitorResult(previous, lang = 'uk') {
  if (previous.status !== 'agreed' || !previous.approvals.visitor || !previous.approvals.persona || previous.pendingIntent) throw Error('Two approvals required');
  const s = structuredClone(previous); s.status = 'result';
  s.messages.push(spoken(s.personId, 'result', copy(lang, 'result'))); return s;
}
