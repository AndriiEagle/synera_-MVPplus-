// Same-device logistics preferences only. No booking, payment or attendance authority.
const copy = value => structuredClone(value);
const member = (state, id) => { if (!state.members.includes(id)) throw new Error('Невідомий учасник.'); };
function proposal(input) {
  if (typeof input.place !== 'string' || !input.place.trim() || input.place.length > 200 ||
      typeof input.when !== 'string' || !Number.isFinite(Date.parse(input.when)) ||
      !Number.isSafeInteger(input.deadline)) throw new Error('Задай місце, дату й дедлайн.');
  return {place: input.place.trim(), when: input.when, deadline: input.deadline};
}
export function createLogistics(members, input, now = Date.now()) {
  if (!Array.isArray(members) || members.length < 2 || members.length > 3 || new Set(members).size !== members.length ||
      members.some(id => typeof id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,59}$/i.test(id) || ['constructor','prototype'].includes(id))) throw new Error('Потрібні 2–3 окремі учасники.');
  const p = proposal(input);
  if (p.deadline <= now || Date.parse(p.when) <= p.deadline) throw new Error('Дедлайн має бути перед майбутньою зустріччю.');
  return {members: [...members], proposal: {...p, revision: 1}, votes: {}, fallbacks: {}};
}
export function reviseLogistics(state, input, now = Date.now()) {
  const next = createLogistics(state.members, input, now);
  next.proposal.revision = state.proposal.revision + 1;
  return next;
}
export function recordLogisticsPreference(state, id, choice, now = Date.now(), fallback = false) {
  member(state, id);
  if (!['yes','no','withdraw'].includes(choice) || !Number.isSafeInteger(now) || now >= state.proposal.deadline) throw new Error('Відповідь недоступна після дедлайну.');
  const next = copy(state), target = fallback ? next.fallbacks : next.votes;
  if (choice === 'withdraw') delete target[id];
  else target[id] = {choice, revision: state.proposal.revision, at: now};
  return next;
}
export function resolveLogistics(state, now = Date.now()) {
  const deadlinePassed = now >= state.proposal.deadline;
  const responses = state.members.map(id => {
    const vote = state.votes[id], fallback = state.fallbacks[id];
    if (vote?.revision === state.proposal.revision) return {id, choice: vote.choice, source:'explicit'};
    if (deadlinePassed && fallback?.revision === state.proposal.revision) return {id, choice:fallback.choice, source:'preselected_fallback'};
    return {id, choice:null, source:'no_response'};
  });
  const status = responses.some(r => r.choice === 'no') ? 'declined' : responses.every(r => r.choice === 'yes') ? 'all_prefer_yes' : deadlinePassed ? 'expired_incomplete' : 'awaiting';
  return {status, responses, binding:false, attendanceConfirmed:false, revision:state.proposal.revision};
}
