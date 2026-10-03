import { explainDeclaredFit, normalizeDeclaredFitProfile } from './declared-fit.mjs';
import { archiveSession, confirmOutcome, createSession, createSocialDraft, SESSION_VALUE_LIMITS } from './session-value.mjs';

export const JOURNEY_FORMAT = 'synera.connected-demo-journey.v1';

const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

const validInstant = value => Number.isSafeInteger(value) && value >= 0 && value <= 8640000000000000;
const requireInstant = value => {
  if (!validInstant(value)) throw new Error('A safe integer timestamp is required.');
  return value;
};
const requireText = (value, label, max = 6000) => {
  if (typeof value !== 'string' || !value.length || value.length > max) throw new Error(`${label} is required and must fit the existing session limits.`);
  return value;
};
const requireId = (value, label) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(value)) throw new Error(`${label} is invalid.`);
  return value;
};

const profile = ({ id, gives, needs, languages, modes, timePreferences, communication, work }) => ({
  id, fitConsent: true, publicVisibility: true, gives, needs, languages, modes, timePreferences,
  preferences: {
    communication: { enabled: true, values: communication },
    work: { enabled: true, values: work },
  },
});

export const DEMO_PEOPLE = freeze([
  { id: 'mara', name: 'Mara', role: 'design', x: 26, y: 34, profile: profile({ id: 'mara', gives: ['design'], needs: ['automation'], languages: ['en', 'uk'], modes: ['joint_project'], timePreferences: ['weekday_afternoon'], communication: ['async'], work: ['collaborative'] }) },
  { id: 'noor', name: 'Noor', role: 'automation', x: 52, y: 49, profile: profile({ id: 'noor', gives: ['automation'], needs: ['sales'], languages: ['en', 'uk'], modes: ['joint_project'], timePreferences: ['weekday_afternoon'], communication: ['async'], work: ['collaborative'] }) },
  { id: 'leo', name: 'Leo', role: 'sales', x: 77, y: 31, profile: profile({ id: 'leo', gives: ['sales'], needs: ['design'], languages: ['en', 'uk'], modes: ['joint_project'], timePreferences: ['weekday_afternoon'], communication: ['async'], work: ['collaborative'] }) },
]);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function personFor(personId) {
  const person = DEMO_PEOPLE.find(candidate => candidate.id === personId);
  if (!person) throw new Error('Unknown demo person.');
  return person;
}
function currentProposal(state) {
  if (!state.proposal) throw new Error('A current meeting proposal is required.');
  return state.proposal;
}
function journeyState(state) {
  if (!state || typeof state !== 'object' || state.format !== JOURNEY_FORMAT || !['chat', 'proposal', 'agreed', 'completed'].includes(state.phase) || !Array.isArray(state.messages)) throw new Error('Invalid journey state.');
  personFor(state.personId);
  return clone(state);
}
function nextMessage(state, { author, text, at, source }) {
  requireText(text, 'Message text'); requireInstant(at);
  const archiveNotes=3+state.messages.length+state.messages.filter(message=>message.receipt).length+1+(source==='ai'?1:0);
  if(archiveNotes>SESSION_VALUE_LIMITS.maxNotes)throw new Error('Місткість одного архіву вичерпана. Заверши й експортуй цей цикл, потім почни новий; слова не скорочувались.');
  return { id: `message-${state.messages.length + 1}`, author, text, at, source };
}
function proposalApprovals(proposal) {
  return proposal.approvals.you?.revision === proposal.revision && proposal.approvals.profile?.revision === proposal.revision;
}
function reciprocalReason(explanation) {
  const complementarity = explanation?.complementarity;
  if (!complementarity) return [];
  return [
    ...complementarity.toA.tags.map(tag => `Ти отримуєш: ${skillName(tag)}.`),
    ...complementarity.toB.tags.map(tag => `Твій внесок: ${skillName(tag)}.`),
  ];
}
const skillName=tag=>({design:'дизайн',automation:'код / автоматизація',sales:'продажі'}[tag]||tag);

// This is a fixed fictional fixture. It does not discover people, rank humans by
// value, or infer anything beyond the two explicit declared-fit profiles.
export function rankDemoPeople(mine) {
  const own = normalizeDeclaredFitProfile(mine);
  if (!own.fitConsent || !own.publicVisibility) return freeze([]);
  return freeze(DEMO_PEOPLE
    .filter(person => person.profile.fitConsent && person.profile.publicVisibility)
    .map(person => {
      const result = explainDeclaredFit(own, person.profile);
      if (result.status !== 'explained') return null;
      const reciprocal = result.explanation.complementarity.status === 'matched';
      return { person, explanation: result.explanation, reciprocal, reasons: reciprocalReason(result.explanation) };
    })
    .filter(Boolean).sort((a,b)=>Number(b.reciprocal)-Number(a.reciprocal)));
}

export function startJourney({ personId, mine, at, sessionId } = {}) {
  const person = personFor(personId); requireInstant(at); requireId(sessionId, 'Session ID');
  const fit = explainDeclaredFit(normalizeDeclaredFitProfile(mine), person.profile);
  if (fit.status !== 'explained') throw new Error('The selected fictional profile is not eligible for this declared-fit demo.');
  const opening = `${person.name} · вигаданий персонаж. Можу дати ${person.profile.gives.map(skillName).join(', ')}, шукаю ${person.profile.needs.map(skillName).join(', ')}. Що хочеш зробити разом і який перший результат буде корисний нам обом?`;
  return freeze({ format: JOURNEY_FORMAT, phase: 'chat', personId, mine: clone(mine), messages: [nextMessage({ messages: [] }, { author: 'profile', text: opening, at, source: 'scenario' })], proposal: null, session: null, sessionId });
}

export function appendUserMessage(state, { text, at } = {}) {
  const next = journeyState(state);
  if (next.phase !== 'chat') throw new Error('Messages can only be added while the journey is in chat.');
  next.messages.push(nextMessage(next, { author: 'you', text, at, source: 'user' }));
  return freeze(next);
}

export function replyScenario(state, { at } = {}) {
  const next = journeyState(state); requireInstant(at);
  if (next.phase !== 'chat') throw new Error('Scenario replies require the chat phase.');
  const person = personFor(next.personId);
  const latestUser = [...next.messages].reverse().find(message => message.author === 'you');
  if(!latestUser||next.messages.at(-1).author!=='you')throw new Error('Спочатку додай своє повідомлення.');
  const input=latestUser.text.toLocaleLowerCase();
  let response;
  if(/\b(no|cancel|stop)\b|не хочу|скасу|відмов|стоп/.test(input))response='Не погоджуємо зустріч. Можна уточнити іншу потребу або завершити цю розмову.';
  else if(/\b(pay|money|price|budget)\b|грош|бюджет|плат|кошту/.test(input))response='Платежу тут немає. Спершу запишімо конкретні внески й результат обох сторін; фінансові умови потребують окремої явної згоди.';
  else if(/\b(tuesday|tomorrow|meet|time)\b|вівтор|завтра|зустр|час|годин/.test(input))response='Можемо перейти до конкретного часу, формату й результату. Запропонуй умови нижче: остаточне «так» стосуватиметься лише їхньої поточної версії.';
  else response=`Твою пропозицію збережено дослівно вище. Я можу дати ${person.profile.gives.map(skillName).join(', ')}, а від тебе шукаю ${person.profile.needs.map(skillName).join(', ')}. Що саме підготує кожна сторона до першої розмови?`;
  const text=`${person.name} · сценарна відповідь. ${response}`;
  next.messages.push(nextMessage(next, { author: 'profile', text, at, source: 'scenario' }));
  return freeze(next);
}

export async function appendAIReply(state, { text, at, receipt } = {}) {
  const next = journeyState(state);
  if (next.phase !== 'chat') throw new Error('Advisory replies require the chat phase.');
  const latest=next.messages.at(-1);
  const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
  if(!receipt||receipt.engine!=='local-domovyk'||receipt.providerCalls!==0||receipt.actualUsd!==0||receipt.finishReason!=='stop'||!receipt.actualModel||!hash(receipt.modelSha256)||!hash(receipt.promptSha256)||!hash(receipt.outputSha256)||!hash(receipt.replySha256)||latest?.author!=='you'||receipt.turnId!==latest.id)throw new Error('AI-відповідь не має перевіреного походження (receipt) для поточного повідомлення.');
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(value=>value.toString(16).padStart(2,'0')).join('');
  if(digest!==receipt.replySha256)throw new Error('Хеш AI-відповіді не відповідає чеку походження.');
  const provenance=Object.fromEntries(['engine','actualModel','modelSha256','promptSha256','outputSha256','replySha256','turnId','finishReason','providerCalls','actualUsd','requestId','elapsedS','usage'].map(key=>[key,receipt[key]??null]));
  next.messages.push({...nextMessage(next, { author: 'L', text, at, source: 'ai' }),receipt:provenance});
  return freeze(next);
}

export function proposeMeeting(state, { place, when, durationMinutes, scope, at } = {}) {
  const next = journeyState(state); requireInstant(at);
  if (!['chat', 'proposal', 'agreed'].includes(next.phase)) throw new Error('Completed demos cannot be changed.');
  requireText(place, 'Place'); requireText(when, 'When'); requireText(scope, 'Scope');
  if (!Number.isSafeInteger(durationMinutes) || durationMinutes < 1) throw new Error('A positive whole duration in minutes is required.');
  const revision = (next.proposal?.revision ?? 0) + 1;
  next.proposal = { revision, place, when, durationMinutes, scope, at, approvals: {} };
  next.phase = 'proposal';
  return freeze(next);
}

export function respondToProposal(state, { actor, choice, revision, at } = {}) {
  const next = journeyState(state); requireInstant(at);
  if (!['you', 'profile'].includes(actor) || !['yes', 'no', 'withdraw'].includes(choice)) throw new Error('Invalid proposal response.');
  const proposal = currentProposal(next);
  if (next.phase !== 'proposal' && next.phase !== 'agreed') throw new Error('The proposal is no longer open.');
  if (revision !== proposal.revision) throw new Error('Only the exact current proposal revision can be answered.');
  if (choice === 'yes') {
    proposal.approvals[actor] = { revision, at };
    next.phase = proposalApprovals(proposal) ? 'agreed' : 'proposal';
  } else {
    proposal.approvals = {};
    proposal.status = choice === 'withdraw' ? 'withdrawn' : 'declined';
    proposal.respondedBy = actor;
    proposal.respondedAt = at;
    next.phase = 'chat';
  }
  return freeze(next);
}

export function completeDemo(state, { at } = {}) {
  const next = journeyState(state); requireInstant(at);
  const proposal = currentProposal(next);
  if (next.phase !== 'agreed' || !proposalApprovals(proposal)) throw new Error('Both sides must explicitly approve the exact current proposal before this demo can complete.');
  const person = personFor(next.personId);
  const notes = [{sourceId:'goal',text:proposal.scope,at},{sourceId:'member-you',text:'Ти · локальний учасник',at},{sourceId:`member-${person.id}`,text:`${person.name} · вигаданий персонаж`,at},...next.messages.flatMap(message=>[
    {sourceId:`${message.author==='profile'?person.id:message.author}.${message.id}`,text:message.text,at:message.at},
    ...(message.receipt?[{sourceId:`receipt-${message.id}`,text:JSON.stringify(message.receipt),at:message.at}]:[])
  ])];
  const facts = [
    { sourceId: 'demo-label', text: 'Демонстраційний цикл Synera з вигаданим персонажем. Справжня зустріч не бронювалась і не відбулася.' },
    { sourceId: 'proposal-version', text: `У цій демонстрації ти й персонаж ${person.name} явно погодили версію ${proposal.revision}: ${proposal.scope}` },
    { sourceId: 'demo-terms', text: `${proposal.place} · ${proposal.when} · ${proposal.durationMinutes} хв. Умовний час і місце; це не підтверджений календарний запис.` },
  ];
  let session = createSession({ sessionId: next.sessionId, participantIds: ['you', person.id], notes, outcome: { revision: 1, facts }, consentScopes: [
    { scope: 'synthetic_demo_outcome', participantId: 'you', at },
    { scope: 'synthetic_demo_outcome', participantId: person.id, at },
  ] });
  session = confirmOutcome(session, { participantId: 'you', revision: 1, at });
  session = confirmOutcome(session, { participantId: person.id, revision: 1, at });
  next.session = session;
  next.phase = 'completed';
  return freeze(next);
}

export function createJourneyArchive(state, { at } = {}) {
  const value = journeyState(state); requireInstant(at);
  if (value.phase !== 'completed' || !value.session) throw new Error('Only a completed synthetic demo can be archived.');
  return archiveSession(value.session, { archiveId: `journey-${value.sessionId}`, createdAt: at });
}

export function createJourneySocial(state) {
  const value = journeyState(state);
  if (value.phase !== 'completed' || !value.session) throw new Error('Only a completed synthetic demo can create a social draft.');
  return freeze({ ...createSocialDraft(value.session), demo: true });
}
