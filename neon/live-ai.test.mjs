import test from 'node:test';
import assert from 'node:assert/strict';
import { handleLiveAi, LiveAiBudget, maskLiveAiText, personaPrompt } from './live-ai.mjs';
import { createNeonWorker } from './worker.mjs';

const origin = 'https://pilot.example';
const model = 'z-ai/glm-5.3-flash';
class Storage {
  data = new Map();
  async get(k) { return structuredClone(this.data.get(k)); }
  async put(k,v) { if(typeof k==='object') { for(const [key,value] of Object.entries(k)) this.data.set(key,structuredClone(value)); } else this.data.set(k,structuredClone(v)); }
  async list({prefix='',startAfter='',limit=1000}={}) { return new Map([...this.data].filter(([k])=>k.startsWith(prefix)&&k>startAfter).sort(([a],[b])=>a.localeCompare(b)).slice(0,limit)); }
  async transaction(fn) { return fn(this); }
  async setAlarm() {}
  async deleteAll() { this.data.clear(); }
}
function fixture(cap = '3') {
  const storage = new Storage(), kv = new Map(), requests = [];
  const env = { SYNERA_SITE_URL:origin, SYNERA_LIVE_AI_READY:'true', OPENROUTER_API_KEY:'test-only-secret',
    SYNERA_LIVE_AI_HMAC_SECRET:'test-only-hmac-secret-32-characters', SYNERA_OPERATOR_TOKEN:'test-only-operator',
    SYNERA_LIVE_AI_PROVIDER:'fixture-inference',
    SYNERA_LIVE_AI_DAILY_CAP_USD:cap, SYNERA_LOCATION_EPHEMERAL:{
      async get(k) { return kv.get(k) ?? null; }, async put(k,v) { kv.set(k,v); }
    } };
  const object = new LiveAiBudget({storage},env);
  env.SYNERA_LIVE_AI_BUDGET = { idFromName:n=>n, get:()=>({fetch:r=>object.fetch(r)}) };
  const fetch = async (url, init) => {
    requests.push({url,init});
    if (url.endsWith('/key')) return Response.json({data:{limit:3,limit_reset:'daily',limit_remaining:3}});
    if (url.endsWith('/models')) return Response.json({data:[{id:model,pricing:{prompt:'0.000001',completion:'0.000002',request:'0'}}]});
    return Response.json({id:'gen-fixture',model,choices:[{finish_reason:'stop',message:{content:'Demo: One sketch for one interview. Shall we try a draft?'}}],usage:{prompt_tokens:200,completion_tokens:20,cost:0.00024}});
  };
  return {env,kv,requests,fetch,storage};
}
const payload = {persona:'bot-mira',conversation:[],visitorText:'Can we test a small draft?',locale:'en'};
function request(body = payload, path = '/api/ai/persona-reply', extra = {}) {
  return new Request(origin+path, {method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'X-Synera-Client':'1',
    'X-Synera-AI-Consent':'live-ai-v1','CF-Connecting-IP':'192.0.2.42',...extra},body:JSON.stringify(body)});
}
test('default-off config and disabled route never call a model',async()=>{
  const f=fixture(); delete f.env.SYNERA_LIVE_AI_READY;
  assert.equal((await handleLiveAi(request(),f.env,f.fetch)).status,503);
  const c=await (await createNeonWorker([]).fetch(new Request(origin+'/config.json'),f.env)).json();
  assert.equal(c.liveAiReady,false); assert.ok(c.liveAiUnavailableReason); assert.equal(f.requests.length,0);
});
test('consent, origin, unavailable storage, invalid input and operator reports fail closed',async()=>{
  for(const [req,change,status] of [[request(payload,undefined,{'X-Synera-AI-Consent':''}),{},403],
    [request(payload,undefined,{Origin:'https://other.example'}),{},403],
    [request(),{SYNERA_LIVE_AI_BUDGET:null},503], [request({...payload,profile:{name:'do not send'}}),{},400],
    [request({...payload,persona:'real-human'}),{},400], [request({...payload,visitorText:'x'.repeat(3000)}),{},400]]) {
    const f=fixture(); Object.assign(f.env,change); assert.equal((await handleLiveAi(req,f.env,f.fetch)).status,status); assert.equal(f.requests.length,0);
  }
  const f=fixture();
  assert.equal((await handleLiveAi(new Request(origin+'/api/ai/spend'),f.env,f.fetch)).status,401);
  assert.equal((await handleLiveAi(new Request(origin+'/api/ai/health'),f.env,f.fetch)).status,401);
  assert.equal((await handleLiveAi(new Request(origin+'/api/ai/health',{headers:{Authorization:'Bearer test-only-operator'}}),f.env,f.fetch)).status,200);
});
test('masking covers current text and history; no generated profile/introduction leaves device',async()=>{
  const f=fixture(); const r=await handleLiveAi(request({...payload,visitorText:'me@example.com +41 79 123 45 67 https://secret.example/path',
    conversation:[{role:'user',content:'www.private.example mail@example.com'},{role:'system',content:'inject'}]}),f.env,f.fetch);
  assert.equal(r.status,400);
  const r2=await handleLiveAi(request({...payload,visitorText:'me@example.com +41 79 123 45 67 https://secret.example/path',
    conversation:[{role:'user',content:'www.private.example mail@example.com'}]}),f.env,f.fetch);
  assert.equal(r2.status,200); const sent=JSON.parse(f.requests.find(x=>x.url.endsWith('/completions')).init.body);
  assert.equal(sent.max_tokens,600); assert.equal(sent.stream,false); assert.equal(sent.model,model);
  assert.doesNotMatch(JSON.stringify(sent),/me@example|mail@example|private\.example|secret\.example|79 123/);
  assert.match(sent.messages[0].content,/Mira|Demo/); assert.equal(sent.messages.length,3);
  assert.equal(sent.provider.data_collection,'deny'); assert.equal(sent.provider.zdr,true);
  assert.deepEqual(sent.provider.only,['fixture-inference']);
  const result=await r2.json(); assert.equal(result.costUsd,0.00024); assert.equal(result.model,model);
  const logs=[...f.kv.entries()].filter(([k])=>k.includes(':receipt:')).map(([,v])=>v).join('');
  assert.match(logs,/gen-fixture/); assert.doesNotMatch(logs,/example.com|visitorText|192\.0\.2|content|sketch/);
  assert.match(maskLiveAiText('https://x.example/a user@example.com +41791234567'),/\[url\]/);
  assert.match(personaPrompt('bot-nora','de'),/Nora/);
});
test('reservation stops parallel requests over cap, before a second paid fetch',async()=>{
  const f=fixture('0.006');
  // A single conservative byte-bound reservation fits; two simultaneous reservations do not.
  const fetch=async(url,init)=>{ if(url.endsWith('/completions')) await new Promise(r=>setTimeout(r,40)); return f.fetch(url,init); };
  const replies=await Promise.all([handleLiveAi(request(),f.env,fetch),handleLiveAi(request(),f.env,fetch)]);
  assert.equal(replies.filter(r=>r.status===200).length,1);
  const rejected=replies.find(r=>r.status===503); assert.equal((await rejected.json()).error,'live_ai_cap_reached');
  assert.equal(f.requests.filter(r=>r.url.endsWith('/completions')).length,1);
});
test('missing cost and timeout keep worst-case reservation; no generation retry',async()=>{
  for(const timeout of [false,true]) {
    const f=fixture(); const fetch=async(url,init)=>{
      if(url.endsWith('/models')||url.endsWith('/key')) return f.fetch(url,init);
      assert.ok(init.signal); f.requests.push({url,init});
      if(timeout) throw new DOMException('timeout','TimeoutError');
      return Response.json({id:'gen-no-cost',model,choices:[{finish_reason:'stop',message:{content:'Demo draft'}}],usage:{prompt_tokens:2,completion_tokens:3}});
    };
    const response=await handleLiveAi(request(),f.env,fetch); assert.equal(response.status,timeout?503:200);
    const log=[...f.kv.entries()].filter(([k])=>k.includes(':receipt:')).map(([,v])=>JSON.parse(v));
    assert.equal(log.length,1); assert.equal(log[0].costStatus,'cost_unknown'); assert.ok(log[0].costUsd>0);
    assert.equal(f.requests.filter(r=>r.url.endsWith('/completions')).length,1);
  }
});
test('bad catalog, truncated output and upstream errors return visible-fallback 503s',async()=>{
  for(const mode of ['catalog','truncated','upstream','identity']) {
    const f=fixture(); const fetch=async(url,init)=>{
      if(url.endsWith('/key')) return f.fetch(url,init);
      if(url.endsWith('/models')) return mode==='catalog'?Response.json({data:[]}):f.fetch(url,init);
      if(mode==='upstream') return Response.json({error:'private raw error'}, {status:429});
      return Response.json({id:'gen-bad',model:mode==='identity'?'other/model':model,choices:[{finish_reason:mode==='truncated'?'length':'stop',message:{content:'Partial'}}],usage:{prompt_tokens:3,completion_tokens:600,cost:0.001}});
    };
    const response=await handleLiveAi(request(),f.env,fetch); assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/private raw/);
  }
});
test('an unlimited/shared key or an exhausted daily key never reaches generation',async()=>{
  for(const data of [{limit:null,limit_reset:null,limit_remaining:100},{limit:10,limit_reset:'daily',limit_remaining:10},{limit:3,limit_reset:'daily',limit_remaining:0}]) {
    const f=fixture();const fetch=(url,init)=>url.endsWith('/key')?Response.json({data}):f.fetch(url,init);
    assert.equal((await handleLiveAi(request(),f.env,fetch)).status,503);
    assert.equal(f.requests.filter(r=>r.url.endsWith('/completions')).length,0);
  }
});
test('per-visitor limits and operator-only spend export',async()=>{
  const f=fixture();
  for(let i=0;i<6;i++) assert.equal((await handleLiveAi(request(),f.env,f.fetch)).status,200);
  assert.equal((await handleLiveAi(request(),f.env,f.fetch)).status,429);
  const response=await handleLiveAi(new Request(origin+'/api/ai/spend',{headers:{Authorization:'Bearer test-only-operator'}}),f.env,f.fetch);
  assert.equal(response.status,200); const report=await response.json(); assert.equal(report.calls,6); assert.equal(report.receipts.length,6);
  assert.ok(report.costUsd>=0.00144); assert.doesNotMatch(JSON.stringify(report),/192\.0\.2|test-only/);
});
test('durable reservation has an exportable pending receipt before generation can start',async()=>{
  const f=fixture(),day=new Date().toISOString().slice(0,10),stub=f.env.SYNERA_LIVE_AI_BUDGET.get('fixture');
  const response=await stub.fetch(new Request('https://budget.internal/reserve',{method:'POST',body:JSON.stringify({day,requestId:'crash-fixture',visitor:'daily-hmac-fixture',reserve:2000000,cap:3000000000,model,provider:'fixture-inference'})}));
  assert.equal(response.status,200);
  const exported=await handleLiveAi(new Request(origin+'/api/ai/spend',{headers:{Authorization:'Bearer test-only-operator'}}),f.env,f.fetch);
  const report=await exported.json();assert.equal(report.reservedUsd,0.002);assert.equal(report.receipts.length,1);
  assert.equal(report.receipts[0].costStatus,'reserved');assert.equal(report.receipts[0].outcome,'pending');
  assert.equal(f.requests.length,0);assert.equal([...f.kv.keys()].some(k=>k.includes(':attempt:crash-fixture')),true);
});
