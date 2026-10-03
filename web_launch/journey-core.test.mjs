import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_PEOPLE, appendAIReply, appendUserMessage, completeDemo, createJourneyArchive,
  createJourneySocial, proposeMeeting, rankDemoPeople, replyScenario, respondToProposal,
  startJourney,
} from './journey-core.mjs';
import { importSessionArchive } from './session-value.mjs';
import {createHash} from 'node:crypto';

const mine = {
  id: 'you', fitConsent: true, publicVisibility: true, gives: ['automation'], needs: ['design'],
  languages: ['en', 'uk'], modes: ['joint_project'], timePreferences: ['weekday_afternoon'],
  preferences: { communication: { enabled: true, values: ['async'] }, work: { enabled: true, values: ['collaborative'] } },
};
const started = () => startJourney({ personId: 'mara', mine, at: 100, sessionId: 'journey-1' });
const proposed = () => proposeMeeting(started(), { place: 'Demo room', when: '2026-10-03 10:00', durationMinutes: 30, scope: 'Review a fictional workflow.', at: 200 });
const agreed = () => respondToProposal(respondToProposal(proposed(), { actor: 'you', choice: 'yes', revision: 1, at: 210 }), { actor: 'profile', choice: 'yes', revision: 1, at: 220 });
const receipt = (turnId,text='') => ({engine:'local-domovyk',actualModel:'local-test-model',modelSha256:'a'.repeat(64),promptSha256:'b'.repeat(64),outputSha256:'c'.repeat(64),replySha256:createHash('sha256').update(text).digest('hex'),turnId,finishReason:'stop',providerCalls:0,actualUsd:0,usage:null,elapsedS:1,requestId:'test-run'});

test('archive provenance cannot be reused with a substituted AI reply',async()=>{
  const user=appendUserMessage(started(),{text:'Запропонуй результат.',at:110});
  await assert.rejects(async()=>appendAIReply(user,{text:'Підміна тексту.',at:120,receipt:receipt(user.messages.at(-1).id,'Оригінальна порада.')}),/хеш|походження/);
});

test('mutual declared value comes before incomplete matches for a different give and need', () => {
  assert.equal(rankDemoPeople({...mine,gives:['design'],needs:['sales']})[0].person.id,'leo');
});

test('verified AI provenance survives completed archive next to its exact message', async () => {
  const user=appendUserMessage(started(),{text:'Я підготую автоматизацію. Що має показати перший екран?',at:110});
  const ai=await appendAIReply(user,{text:'Уточнімо ціль першого екрана.',at:120,receipt:receipt(user.messages.at(-1).id,'Уточнімо ціль першого екрана.')});
  assert.equal(ai.messages.at(-1).receipt.actualModel,'local-test-model');
  let state=proposeMeeting(ai,{place:'Demo room',when:'2026-10-04 10:00',durationMinutes:30,scope:'Review the first screen.',at:200});
  for(const actor of ['you','profile'])state=respondToProposal(state,{actor,choice:'yes',revision:1,at:210});
  const archive=importSessionArchive(createJourneyArchive(completeDemo(state,{at:300}),{at:310}));
  const provenance=JSON.parse(archive.session.notes.find(note=>note.sourceId.startsWith('receipt-')).text);
  assert.equal(provenance.actualModel,'local-test-model');
  assert.equal(provenance.finishReason,'stop');
  assert.equal(archive.session.notes.find(note=>note.sourceId==='goal').text,'Review the first screen.');
  await assert.rejects(()=>appendAIReply(user,{text:'Unverified',at:120,receipt:{invented:true}}),/receipt|походження/);
});

test('archive preserves the entire accepted maximum-length user message without prefix overflow',()=>{
  const text='ї'.repeat(6000);
  let state=appendUserMessage(started(),{text,at:110});
  state=proposeMeeting(state,{place:'Demo room',when:'2026-10-04 10:00',durationMinutes:30,scope:'Exact words.',at:200});
  for(const actor of ['you','profile'])state=respondToProposal(state,{actor,choice:'yes',revision:1,at:210});
  const archive=importSessionArchive(createJourneyArchive(completeDemo(state,{at:300}),{at:310}));
  assert(archive.session.notes.some(note=>note.text===text));
});

test('fixture is a consented three-person reciprocal cycle without people discovery', () => {
  assert.deepEqual(DEMO_PEOPLE.map(person => [person.id, person.role]), [['mara', 'design'], ['noor', 'automation'], ['leo', 'sales']]);
  assert.deepEqual(DEMO_PEOPLE.map(person => person.profile.gives[0]), ['design', 'automation', 'sales']);
  assert.equal(rankDemoPeople(mine).find(entry => entry.person.id === 'mara').reciprocal, true);
  assert.deepEqual(rankDemoPeople({ ...mine, fitConsent: false }), []);
  assert.deepEqual(rankDemoPeople({ ...mine, publicVisibility: false }), []);
});

test('chat preserves exact source-labelled transcript and scenario reply uses actual user context', async () => {
  const withUser = appendUserMessage(started(), { text: 'Could we discuss the workflow on Tuesday?', at: 110 });
  const scenario = replyScenario(withUser, { at: 120 });
  const aiUser=appendUserMessage(scenario,{text:'What should I prepare?',at:125});
  const advisory = await appendAIReply(aiUser, { text: 'Consider bringing a draft.', at: 130, receipt: receipt(aiUser.messages.at(-1).id,'Consider bringing a draft.') });
  assert.deepEqual(advisory.messages.map(message => [message.author, message.source]), [['profile', 'scenario'], ['you', 'user'], ['profile', 'scenario'], ['you','user'], ['L', 'ai']]);
  assert.equal(scenario.messages[1].text,'Could we discuss the workflow on Tuesday?');
  assert.equal(scenario.proposal,null);
  assert.equal(advisory.proposal, null);
  assert.equal(Object.isFrozen(advisory), true);
});

test('a proposal is isolated to its chosen person, revisions reset approval, and stale approval is rejected', () => {
  const one = proposed();
  assert.equal(one.personId, 'mara');
  const onceApproved = respondToProposal(one, { actor: 'you', choice: 'yes', revision: 1, at: 210 });
  const revised = proposeMeeting(onceApproved, { place: 'Other demo room', when: '2026-10-04 10:00', durationMinutes: 45, scope: 'Changed fictional scope.', at: 220 });
  assert.equal(revised.proposal.revision, 2);
  assert.deepEqual(revised.proposal.approvals, {});
  assert.throws(() => respondToProposal(revised, { actor: 'profile', choice: 'yes', revision: 1, at: 230 }), /exact current/);
});

test('decline and withdrawal do not silently retain approval', () => {
  const yes = respondToProposal(proposed(), { actor: 'you', choice: 'yes', revision: 1, at: 210 });
  const declined = respondToProposal(yes, { actor: 'profile', choice: 'no', revision: 1, at: 220 });
  assert.equal(declined.phase, 'chat');
  assert.deepEqual(declined.proposal.approvals, {});
  const withdrawn = respondToProposal(proposed(), { actor: 'you', choice: 'withdraw', revision: 1, at: 210 });
  assert.equal(withdrawn.proposal.status, 'withdrawn');
  assert.throws(() => completeDemo(declined, { at: 230 }), /Both sides/);
});

test('AI text is advisory and cannot grant approval or complete a fictional meeting', async () => {
  const user=appendUserMessage(started(),{text:'Can everyone approve?',at:105});
  const advisory = await appendAIReply(user, { text: 'Approved by everyone.', at: 110,receipt:receipt(user.messages.at(-1).id,'Approved by everyone.') });
  assert.throws(() => completeDemo(advisory, { at: 120 }), /current meeting proposal/);
  const unilateral = respondToProposal(proposed(), { actor: 'you', choice: 'yes', revision: 1, at: 210 });
  assert.throws(() => completeDemo(unilateral, { at: 220 }), /Both sides/);
});

test('completed demo creates truthful roundtrippable archive and retains synthetic label in private social draft', () => {
  const complete = completeDemo(agreed(), { at: 300 });
  assert.equal(complete.phase, 'completed');
  const archive = importSessionArchive(createJourneyArchive(complete, { at: 310 }));
  assert.match(archive.session.outcome.facts[0].text, /Демонстраційний цикл/);
  assert.match(archive.session.outcome.facts[0].text, /Справжня зустріч.*не відбулася/);
  const social = createJourneySocial(complete);
  assert.equal(social.publishable, false);
  assert.equal(social.demo, true);
  assert.match(social.text, /Демонстраційний цикл/);
});

test('counterexample guard: changing the current-revision equality would allow a stale consent to complete', () => {
  const two = proposeMeeting(proposed(), { place: 'Changed room', when: '2026-10-04 10:00', durationMinutes: 30, scope: 'Changed scope.', at: 205 });
  const stale = { ...two, phase: 'agreed', proposal: { ...two.proposal, approvals: { you: { revision: 1, at: 210 }, profile: { revision: 1, at: 220 } } } };
  assert.throws(() => completeDemo(stale, { at: 230 }), /Both sides/);
});
