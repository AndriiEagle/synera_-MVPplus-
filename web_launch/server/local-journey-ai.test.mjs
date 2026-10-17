import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createLocalJourneyAI } from './local-journey-ai.mjs';
const hash = text => createHash('sha256').update(text).digest('hex');
const modelSha = 'a'.repeat(64);
const receiptFor = (prompt, content, extra = {}) => ({engine:'local-domovyk',actualModel:'test-local-model',modelSha256:modelSha,finishReason:'stop',providerCalls:0,actualUsd:0,promptSha256:hash(prompt),outputSha256:hash(content),...extra});
const request = (messages = [{id:'message-1',author:'you',text:'Потрібен макет MVP.'}], turnId = messages.at(-1).id) => ({method:'POST',origin:'http://127.0.0.1:4444',expectedOrigin:'http://127.0.0.1:4444',host:'127.0.0.1:4444',access:'test-nonce',contentType:'application/json',body:JSON.stringify({version:1,consent:true,personId:'mara',mine:{gives:['automation'],needs:['design']},messages,turnId})});
test('local conversation needs exact origin, nonce and explicit consent before inference', async () => {
  let calls=0; const api=createLocalJourneyAI({nonce:'test-nonce',runModel:async()=>{calls++;throw Error();}});
  for(const delta of [{origin:'https://example.org'},{access:'wrong'},{host:'example.org'},{method:'GET'}]) assert.ok((await api({...request(),...delta})).status>=400);
  const r=request();r.body=r.body.replace('"consent":true','"consent":false');assert.equal((await api(r)).status,422);assert.equal(calls,0);
});
test('accepted answer binds exact turn IDs, Unicode transcript and authoritative local receipt', async () => {
  let reviewed=0,promptSeen='';const api=createLocalJourneyAI({nonce:'test-nonce',runModel:async prompt=>{promptSeen=prompt;const content=JSON.stringify({reply:'Який перший екран потрібен?'});return{content,receipt:receiptFor(prompt,content,{usage:{prompt_tokens:11}}),review:async()=>{reviewed++;}};}});
  const messages=[{id:'message-1',author:'profile',text:'Вигаданий вступ.'},{id:'message-2',author:'you',text:'Потрібен макет MVP. 🧩'}];const r=await api(request(messages));assert.equal(r.status,200);assert.equal(r.body.approvalsChanged,false);assert.equal(r.body.turnId,'message-2');assert.equal(r.body.replySha256,hash(r.body.text));assert.equal(r.body.text,'Який перший екран потрібен?');assert.ok(promptSeen.includes('Потрібен макет MVP. 🧩'));assert.deepEqual(r.body.receipt.usage,{inputTokens:11,outputTokens:null,totalTokens:null});assert.equal(reviewed,1);
});
test('missing or forged receipt and malformed model output are rejected without scripted fallback', async () => {
  for(const content of ['not-json',JSON.stringify({reply:'Approved',approve:true}),JSON.stringify({reply:'Reply'})]) {const api=createLocalJourneyAI({nonce:'test-nonce',runModel:async()=>({content,receipt:{engine:'local-domovyk',actualModel:'unknown',providerCalls:0,actualUsd:0,outputSha256:'forged'},review:async()=>{throw Error('should not review');}})});const r=await api(request());assert.equal(r.status,503);assert.equal(r.body.text,undefined);}
});
test('rejects an old identical historical text, missing stop reason, oversized Unicode and duplicate IDs', async () => {
  const validModel=async prompt=>{const content=JSON.stringify({reply:'ok'});return{content,receipt:receiptFor(prompt,content),review:async()=>{}};};
  const oldSame=[{id:'message-1',author:'you',text:'same'},{id:'message-2',author:'profile',text:'reply'}];
  assert.equal((await createLocalJourneyAI({nonce:'test-nonce',runModel:validModel})(request(oldSame,'message-1'))).status,422);
  const duplicate=[{id:'message-1',author:'profile',text:'first'},{id:'message-1',author:'you',text:'second'}];
  assert.equal((await createLocalJourneyAI({nonce:'test-nonce',runModel:validModel})(request(duplicate))).status,422);
  const missingStop=createLocalJourneyAI({nonce:'test-nonce',runModel:async prompt=>{const content=JSON.stringify({reply:'ok'});const receipt=receiptFor(prompt,content);delete receipt.finishReason;return{content,receipt,review:async()=>{}};}});
  assert.equal((await missingStop(request())).status,503);
  const huge='🧩'.repeat(9000);assert.equal((await createLocalJourneyAI({nonce:'test-nonce',runModel:validModel})(request([{id:'message-1',author:'you',text:huge}]))).status,413);
});
test('one in-flight call is preserved and a second request cannot run another model', async () => {
  let finish,calls=0;const api=createLocalJourneyAI({nonce:'test-nonce',runModel:()=>{calls++;return new Promise(resolve=>{finish=resolve;});}});
  const first=api(request());assert.equal((await api(request())).status,429);assert.equal(calls,1);finish({content:'bad'});assert.equal((await first).status,503);
});
test('resource pressure is explained and never disguised as an AI or scenario response',async()=>{
 const api=createLocalJourneyAI({nonce:'test-nonce',runModel:async()=>{throw Object.assign(new Error('resource pressure'),{code:'LOCAL_RESOURCE_BUSY'});}});
 const result=await api(request());assert.equal(result.status,503);assert.match(result.body.message,/перевантажений/);assert.equal(result.body.text,undefined);assert.equal(result.body.receipt,undefined);
});
