import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readJourneyAICapability, requestJourneyReply } from './journey-ai-client.mjs';
import { appendAIReply, appendUserMessage, startJourney } from './journey-core.mjs';

globalThis.crypto ||= webcrypto;
globalThis.location ||= { hostname: '127.0.0.1' };
const digest = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(value => value.toString(16).padStart(2, '0')).join('');
const hash = 'b'.repeat(64);
const state = messages => ({ phase: 'chat', personId: 'mara', mine: { gives: ['automation'], needs: ['design'] }, messages });
const latest = 'Потрібен макет MVP 🧩';
const goodMessages = [{ id: 'message-1', author: 'you', text: latest }];
const coreMine = { id: 'you', fitConsent: true, publicVisibility: true, gives: ['automation'], needs: ['design'], languages: ['en'], modes: ['joint_project'], timePreferences: ['weekday_afternoon'], preferences: { communication: { enabled: true, values: ['async'] }, work: { enabled: true, values: ['collaborative'] } } };
const coreState = () => appendUserMessage(startJourney({ personId: 'mara', mine: coreMine, at: 1, sessionId: 'journey-client-test' }), { text: latest, at: 2 });
const response = body => ({ ok: true, json: async () => body });
const receipt = (overrides = {}) => ({ engine: 'local-domovyk', actualModel: 'test-local', modelSha256: hash, finishReason: 'stop', providerCalls: 0, actualUsd: 0, promptSha256: hash, outputSha256: hash, usage: { inputTokens: null, outputTokens: null, totalTokens: null }, ...overrides });
async function enable(fetchImpl) {
  globalThis.fetch = fetchImpl;
  const result = await readJourneyAICapability();
  assert.equal(result.enabled, true);
}

test('client sends canonical exact message IDs and verifies a bound Unicode reply', async () => {
  const reply = 'Опиши перший екран, будь ласка.'; const replySha256 = await digest(reply); const input = coreState(); const turnId = input.messages.at(-1).id; let sent;
  await enable(async (url, options) => {
    if (url === '/config.json') return response({ journeyAI: { enabled: true, mode: 'local', nonce: 'nonce', model: 'local' } });
    sent = JSON.parse(options.body); return response({ text: reply, turnId, replySha256, receipt: receipt() });
  });
  const result = await requestJourneyReply({ state: input, text: latest, consent: true });
  assert.equal(result.text, reply); assert.deepEqual(sent.messages, input.messages.map(message => ({ id: message.id, author: message.author, text: message.text }))); assert.equal(sent.turnId, turnId);
  assert.equal(result.receipt.turnId, turnId); assert.equal(result.receipt.replySha256, replySha256);
  const accepted = await appendAIReply(input, { text: result.text, at: 10, receipt: result.receipt });
  assert.equal(accepted.messages.at(-1).source, 'ai');
});

test('client rejects old identical historical text before any request', async () => {
  let requests = 0; await enable(async url => { if (url === '/config.json') return response({ journeyAI: { enabled: true, mode: 'local', nonce: 'nonce', model: 'local' } }); requests++; throw Error('must not call'); });
  const messages = [{ id: 'message-1', author: 'you', text: 'same' }, { id: 'message-2', author: 'profile', text: 'same' }];
  await assert.rejects(requestJourneyReply({ state: state(messages), text: 'same', consent: true }), /останнє точне/); assert.equal(requests, 0);
});

test('client rejects forged reply binding, missing stop reason and forged receipts without fallback', async () => {
  const reply = 'Ось відповідь.'; const correct = await digest(reply);
  for (const body of [
    { text: reply, turnId: 'other-turn', replySha256: correct, receipt: receipt() },
    { text: reply, turnId: 'message-1', replySha256: hash, receipt: receipt() },
    { text: reply, turnId: 'message-1', replySha256: correct, receipt: receipt({ finishReason: 'length' }) },
    { text: reply, turnId: 'message-1', replySha256: correct, receipt: receipt({ providerCalls: 1 }) },
  ]) {
    await enable(async url => url === '/config.json' ? response({ journeyAI: { enabled: true, mode: 'local', nonce: 'nonce', model: 'local' } }) : response(body));
    await assert.rejects(requestJourneyReply({ state: state(goodMessages), text: latest, consent: true }), /перевіреного локального/);
  }
});

test('full Unicode input is sent whole; client does not trim or silently truncate it', async () => {
  const text = `План ${'🧩'.repeat(2000)}`; const messages = [{ id: 'message-unicode', author: 'you', text }]; let sent;
  const reply = 'Коротка відповідь.';
  await enable(async (url, options) => {
    if (url === '/config.json') return response({ journeyAI: { enabled: true, mode: 'local', nonce: 'nonce', model: 'local' } });
    sent = JSON.parse(options.body); return response({ text: reply, turnId: 'message-unicode', replySha256: await digest(reply), receipt: receipt() });
  });
  await requestJourneyReply({ state: state(messages), text, consent: true });
  assert.equal(sent.messages[0].text, text);
});
