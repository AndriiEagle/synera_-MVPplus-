// Local, same-device workspace. Labels and votes are notes, never authenticated consent.
// No network, durable storage, media capture, profiling or payment authority.
export const ROOM_MODES = Object.freeze(['project', 'brainstorm', 'resolve', 'focus', 'conversation']);
const ids = ['a', 'b', 'c'];
const copy = value => structuredClone(value);
function text(value, limit = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > limit) throw new Error('Введи текст у межах поля.');
  return value.trim();
}
function instant(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 8640000000000000) throw new Error('Некоректний час.');
  return value;
}
function member(room, id) {
  if (!room.members.some(m => m.id === id)) throw new Error('Немає такого учасника.');
}
export function createRoom({ goal, names = ['Учасник 1', 'Учасник 2', 'Учасник 3'], mode = 'project' }) {
  if (!Array.isArray(names) || names.length !== 3) throw new Error('Потрібні три учасники.');
  const labels = names.map(name => text(name, 60));
  if (new Set(labels.map(name => name.toLocaleLowerCase())).size !== 3) throw new Error('Дай кожному окреме ім’я або позначення.');
  if (!ROOM_MODES.includes(mode)) throw new Error('Невідомий режим.');
  return { schema: 'synera.triangle.local.v1', goal: text(goal, 500), mode,
    members: labels.map((name, i) => ({ id: ids[i], name, contribution: '' })),
    messages: [], tasks: [], proposal: null, proposalRevision: 0, round: null };
}
export function setContribution(room, id, value) {
  member(room, id); const next = copy(room);
  const m = next.members.find(m => m.id === id), changed = value === '' ? '' : text(value, 500);
  if (m.contribution !== changed && next.proposal) {
    next.proposalRevision++;
    next.proposal.revision = next.proposalRevision;
    next.proposal.votes = {};
  }
  m.contribution = changed;
  return next;
}
export function addMessage(room, id, body, now) {
  member(room, id); instant(now); const next = copy(room);
  if (next.messages.length >= 150) throw new Error('Експортуй нотатки й почни нову сесію.');
  next.messages.push({ member: id, body: text(body), at: now }); return next;
}
export function addTask(room, id, title) {
  member(room, id); const next = copy(room);
  if (next.tasks.length >= 50) throw new Error('Завершіть або експортуйте поточні кроки.');
  next.tasks.push({ id: next.tasks.length + 1, owner: id, title: text(title, 300), done: false }); return next;
}
export function toggleTask(room, id) {
  const next = copy(room), task = next.tasks.find(t => t.id === id);
  if (!task) throw new Error('Немає такого кроку.');
  task.done = !task.done; return next;
}
export function parseCHF(value) {
  if (typeof value !== 'string' || !/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value.trim())) throw new Error('Сума CHF: до двох знаків після коми.');
  const [whole, part = ''] = value.trim().replace(',', '.').split('.');
  return Number(whole) * 100 + Number(part.padEnd(2, '0'));
}
// Largest-remainder allocation: exact minor-unit sum, no claim about labour/equity fairness.
export function splitBudget(amountMinor, weights = [1, 1, 1]) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0 || amountMinor > 999999999 ||
      !Array.isArray(weights) || weights.length !== 3 || weights.some(w => !Number.isSafeInteger(w) || w < 1 || w > 1000)) throw new Error('Некоректний бюджет або пропорції.');
  const total = weights.reduce((a, b) => a + b, 0);
  const result = weights.map(w => Math.floor(amountMinor * w / total));
  const order = weights.map((w, i) => ({ i, remainder: (amountMinor * w) % total }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const remaining = amountMinor - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < remaining; i++) result[order[i].i]++;
  return result;
}
export function proposeBudget(room, { amountMinor, weights = [1, 1, 1], purpose, deadline }, now) {
  instant(now); instant(deadline);
  if (deadline <= now) throw new Error('Дедлайн має бути в майбутньому.');
  const shares = splitBudget(amountMinor, weights), next = copy(room);
  next.proposalRevision++;
  next.proposal = { revision: next.proposalRevision, amountMinor, currency: 'CHF', weights: [...weights],
    shares, purpose: text(purpose, 500), deadline, votes: {} }; return next;
}
export function voteBudget(room, id, choice, now) {
  member(room, id); instant(now);
  if (!room.proposal || now >= room.proposal.deadline) throw new Error('Голосування закрите. Створи нову пропозицію.');
  if (!['yes', 'no', 'abstain', 'withdraw'].includes(choice)) throw new Error('Невідома відповідь.');
  const next = copy(room);
  if (choice === 'withdraw') delete next.proposal.votes[id];
  else next.proposal.votes[id] = { choice, revision: next.proposal.revision, at: now };
  return next;
}
export function budgetStatus(room, now) {
  instant(now); const p = room.proposal;
  if (!p) return 'none';
  const votes = room.members.map(m => p.votes[m.id]);
  const valid = vote => vote && vote.revision === p.revision && vote.at < p.deadline;
  if (votes.every(v => valid(v) && v.choice === 'yes')) return 'unanimous_local_notes';
  if (votes.some(v => valid(v) && v.choice === 'no')) return 'declined';
  if (now >= p.deadline) return 'expired_without_agreement';
  return 'awaiting_responses';
}
export function startRound(room, seconds, agreed) {
  if (agreed !== true) throw new Error('Спочатку погодьте чергу й час на спільному екрані.');
  if (!Number.isInteger(seconds) || seconds < 15 || seconds > 600) throw new Error('Час черги: 15–600 секунд.');
  const next = copy(room); next.round = { index: 0, seconds, running: false, startedAt: null }; return next;
}
export function roundAction(room, action, now) {
  instant(now); if (!room.round) throw new Error('Спочатку погодьте чергу.');
  const next = copy(room), r = next.round;
  if (action === 'start') { r.running = true; r.startedAt = now; }
  else if (action === 'pause') { r.running = false; r.startedAt = null; }
  else if (action === 'next') { r.index = (r.index + 1) % 3; r.running = false; r.startedAt = null; }
  else throw new Error('Невідома дія черги.');
  return next;
}
export function roundRemaining(room, now) {
  instant(now); const r = room.round;
  return !r ? null : !r.running ? r.seconds : Math.max(0, r.seconds - Math.floor((now - r.startedAt) / 1000));
}
export function facilitatorNote(room, now) {
  instant(now);
  const missing = room.members.filter(m => !m.contribution).map(m => m.name);
  if (room.proposal && budgetStatus(room, now) === 'expired_without_agreement') return 'Час відповідей минув. Домовленості немає. Уточніть умови й запропонуйте нову версію.';
  if (missing.length) return `Щоб рухатися до «${room.goal}», уточніть внесок: ${missing.join(', ')}.`;
  if (!room.tasks.length) return `Внески записані. Оберіть один перевірний крок до «${room.goal}» і відповідального.`;
  if (room.tasks.some(t => !t.done)) return 'Є відкритий крок. Уточніть, що потрібно для його завершення; допомогу й зміну обсягу погодьте разом.';
  return 'Кроки позначені виконаними. Перевірте результат разом і вирішіть, чи потрібна наступна ітерація.';
}
export function exportRoom(room, includeMessages = false) {
  const value = copy(room);
  if (!includeMessages) value.messages = [];
  value.round = null;
  return JSON.stringify({ ...value, scope: 'same_device_unverified_notes', binding: false, identityVerified: false }, null, 2);
}
