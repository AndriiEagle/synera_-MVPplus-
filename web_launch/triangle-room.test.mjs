import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, setContribution, addMessage, addTask, toggleTask, parseCHF, splitBudget, proposeBudget,
  voteBudget, budgetStatus, startRound, roundAction, roundRemaining, facilitatorNote, exportRoom } from './triangle-room.mjs';
const t = Date.parse('2026-10-02T13:00:00Z');
const room = () => createRoom({ goal: 'Показати перший прототип', names: ['Mara', 'Leo', 'Noor'] });
const proposal = r => proposeBudget(r, { amountMinor: 100000, purpose: 'Прототип', deadline: t + 60000 }, t);
test('three distinct local members; money parses exactly and shares conserve cents across unequal cases', () => {
  assert.throws(() => createRoom({ goal: 'x', names: ['A', 'a', 'B'] }));
  assert.throws(() => createRoom({ goal: 'x', names: ['A', 'B'] }));
  assert.equal(parseCHF('1000,00'), 100000);
  assert.throws(() => parseCHF('10.001')); assert.throws(() => parseCHF('-2'));
  assert.deepEqual(splitBudget(100000), [33334, 33333, 33333]);
  for (const total of [0, 1, 2, 100, 100001, 999999999]) for (const weights of [[1,1,1],[1,3,7],[1000,1,1000]]) {
    const result = splitBudget(total, weights);
    assert.equal(result.reduce((a,b)=>a+b,0),total);
    assert.ok(result.every(n => Number.isSafeInteger(n) && n >= 0));
  }
});
test('silence and deadline never fabricate consent; explicit no/abstention block unanimity', () => {
  let r = proposal(room()); r = voteBudget(r, 'a', 'yes', t);
  assert.equal(budgetStatus(r, t), 'awaiting_responses');
  assert.equal(budgetStatus(r, t+60000), 'expired_without_agreement');
  assert.throws(() => voteBudget(r, 'c', 'yes', t+60000));
  assert.throws(() => voteBudget(r, 'outside', 'yes', t));
  r = voteBudget(r,'b','yes',t); r = voteBudget(r,'c','abstain',t);
  assert.notEqual(budgetStatus(r,t),'unanimous_local_notes');
  r = voteBudget(r,'c','no',t); assert.equal(budgetStatus(r,t),'declined');
});
test('all current explicit yes notes are required; revised terms and withdrawn response invalidate them', () => {
  let r = proposal(room()); for (const id of ['a','b','c']) r = voteBudget(r,id,'yes',t);
  assert.equal(budgetStatus(r,t),'unanimous_local_notes');
  assert.equal(budgetStatus(r,t+100000),'unanimous_local_notes');
  const withdrawn = voteBudget(r,'b','withdraw',t);
  assert.equal(budgetStatus(withdrawn,t),'awaiting_responses');
  const changed = proposeBudget(r,{amountMinor:90000,weights:[1,2,3],purpose:'Інший обсяг',deadline:t+70000},t);
  assert.equal(changed.proposal.revision,r.proposal.revision+1);
  assert.equal(budgetStatus(changed,t),'awaiting_responses');
  assert.deepEqual(changed.proposal.votes,{});
  assert.equal(Object.keys(r.proposal.votes).length,3);
  const newContribution = setContribution(r,'a','Можу зробити менший обсяг');
  assert.equal(budgetStatus(newContribution,t),'awaiting_responses');
  assert.equal(newContribution.proposal.revision,r.proposal.revision+1);
});
test('round is voluntary, expiry only advises, next/pause stay under human control', () => {
  assert.throws(()=>startRound(room(),90,false));
  let r=startRound(room(),90,true); r=roundAction(r,'start',t);
  assert.equal(roundRemaining(r,t+90000),0);
  assert.equal(r.round.index,0); // expiry did not advance or mute anybody
  r=roundAction(r,'next',t+95000); assert.equal(r.round.index,1); assert.equal(r.round.running,false);
  r=roundAction(r,'start',t+95000); r=roundAction(r,'pause',t+96000);
  assert.equal(r.round.startedAt,null);
});
test('facilitator uses declared contributions/tasks, exports notes with optional chat and no binding claim', () => {
  let r=room(); assert.match(facilitatorNote(r,t),/Mara, Leo, Noor/);
  for(const id of ['a','b','c'])r=setContribution(r,id,'Можу перевірити прототип');
  r=addMessage(r,'a','Приватна ідея',t); r=addTask(r,'b','Перший тест');
  assert.match(facilitatorNote(r,t),/відкритий крок/);
  r=toggleTask(r,1); assert.equal(r.tasks[0].done,true);
  const exported=JSON.parse(exportRoom(r)); assert.equal(exported.binding,false); assert.equal(exported.identityVerified,false);
  assert.deepEqual(exported.messages,[]); assert.equal(exported.tasks[0].title,'Перший тест');
  assert.equal(JSON.parse(exportRoom(r,true)).messages[0].body,'Приватна ідея');
});
