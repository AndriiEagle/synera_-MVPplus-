import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createLiveAi, parseJevVerdict } from '../vercel/live-ai.mjs';
import { liveAiSmoke } from '../tools/live-ai-smoke.mjs';

const model='z-ai/glm-5.3-flash', judge='typesafe/jev-1.14';
const payload={persona:'bot-mira',conversation:[],visitorText:'Can we try one draft?',locale:'en'};
const request=(body=payload,headers={})=>new Request('https://preview.example/api/ai/persona-reply',{method:'POST',headers:{Origin:'https://preview.example','Content-Type':'application/json','X-Synera-Client':'1','X-Synera-AI-Consent':'live-ai-v1',...headers},body:JSON.stringify(body)});
function fixture({env={},verdict='yes',chat={},decision={},limit=3,remaining=3,missingCost=false,transportError=false,holdDraft=false,priceData}={}) {
  const calls=[],logs=[];
  let release,started;const held=new Promise(r=>release=r),waiting=new Promise(r=>started=r);
  env={OPENROUTER_API_KEY:'fixture-only',...env};
  let clock=new Date('2026-10-30T10:00:00Z');
  const ai=createLiveAi({env,now:()=>clock,log:line=>logs.push(JSON.parse(line)),fetchImpl:async(url,options={})=>{
    if(url.endsWith('/key')) return Response.json({data:{limit,limit_reset:'daily',limit_remaining:remaining}});
    if(url.endsWith('/endpoints')) return Response.json(priceData??{data:{endpoints:[{tag:'fixture',pricing:{prompt:'0.000001',completion:'0.000002'}},{tag:'other',pricing:{prompt:'0.000002',completion:'0.000003'}}]}});
    const body=JSON.parse(options.body);calls.push({url,body,options});
    if(transportError) throw Error('ambiguous timeout');
    const usage=missingCost?{}:{cost:0.001};
    if(url.endsWith('/chat/completions')) {
      if(holdDraft) {started();await held;}
      return Response.json({id:'gen-glm',model,usage:{prompt_tokens:100,completion_tokens:30,...usage},choices:[{finish_reason:'stop',message:{content:'Demo · I can sketch one screen for one interview. Shall we choose a draft?'}}],...chat});
    }
    return Response.json({id:'gen-jev',model:judge+'-20261014',usage:{input_tokens:200,output_tokens:10,...usage},answers:{safe:{type:'choice',choice:verdict,probabilities:{yes:verdict==='yes'?1:0,no:verdict==='no'?1:0}}},...decision});
  }});
  return {ai,calls,logs,env,release,waiting,setDay:value=>clock=new Date(value)};
}
test('Vercel masks this conversation, judges via Decisions and logs both billed calls without text',async()=>{
  const {ai,calls,logs}=fixture({env:{SYNERA_LIVE_AI_PROVIDER:'fixture'}});
  const response=await ai.handle(request({...payload,visitorText:'a@example.com +41 79 123 45 67 https://private.example/path',conversation:[{role:'user',content:'old@example.com www.private.ch'}]}));
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.judged,'accepted');assert.equal(data.costUsd,0.002);assert.equal(data.costStatus,'reported');assert.match(data.text,/Demo/);
  assert.equal(calls.length,2);assert.equal(calls[0].body.max_tokens,600);assert.equal(calls[0].body.stream,false);
  assert.deepEqual(calls[0].body.reasoning,{enabled:false});
  assert.deepEqual(calls[0].body.provider.only,['fixture']);assert.equal(calls[0].options.signal,calls[1].options.signal);
  const outbound=JSON.stringify(calls.map(c=>c.body));
  for(const value of ['a@example.com','old@example.com','+41 79 123 45 67','private.example','www.private.ch']) assert.ok(!outbound.includes(value));
  assert.match(outbound,/\[email\]/);assert.match(outbound,/\[phone\]/);assert.match(outbound,/\[url\]/);
  assert.match(calls[1].url,/\/api\/alpha\/decisions$/);assert.equal(calls[1].body.model,judge);
  assert.equal(calls[1].body.questions.safe.type,'choice');
  assert.equal(logs.length,2);assert.deepEqual(logs.map(l=>l.judged),['pending','accepted']);
  assert.equal(logs[1].model,judge+'-20261014');assert.equal(logs[0].requestId,data.requestId);
  assert.ok(!JSON.stringify(logs).includes('sketch'));assert.ok(!JSON.stringify(logs).includes('fixture-only'));
  const spend=await (await ai.handle(new Request('https://preview.example/api/ai/spend'))).json();
  assert.equal(spend.durable,false);assert.equal(spend.calls,2);assert.equal(spend.costUsd,0.002);assert.equal(spend.reservedUsd,0);
});
test('concurrent requests cannot spend the reservation already held for both calls',async()=>{
  const {ai,calls,env,waiting,release}=fixture({holdDraft:true});const first=ai.handle(request());await waiting;
  const spend=await (await ai.handle(new Request('https://preview.example/api/ai/spend'))).json();
  assert.ok(spend.reservedUsd>0);env.SYNERA_LIVE_AI_DAILY_CAP_USD=String(spend.reservedUsd);
  const second=await ai.handle(request());assert.equal(second.status,503);assert.equal((await second.json()).error,'live_ai_cap_reached');
  assert.equal(calls.length,1);release();assert.equal((await first).status,200);
});
test('unknown prices, incomplete text and mismatched identity never escape as AI replies',async()=>{
  for(const options of [{priceData:{data:{endpoints:[]}}},{priceData:{data:{endpoints:[{pricing:{prompt:'',completion:'0'}}]}}},{chat:{model:'unexpected/model'}},{chat:{choices:[{finish_reason:'length',message:{content:'must not escape'}}]}},{chat:{choices:[]}}]) {
    const {ai,calls}=fixture(options);const response=await ai.handle(request());const data=await response.json();
    assert.equal(response.status,503);assert.equal(data.scripted,true);assert.equal(data.judged,'rejected');assert.ok(!data.text.includes('must not escape'));assert.ok(calls.length<=1);
  }
});
test('provider.only accepts a provider slug with priced sub-provider endpoints',async()=>{
  const {ai,calls}=fixture({env:{SYNERA_LIVE_AI_PROVIDER:'fixture'},priceData:{data:{endpoints:[{tag:'fixture/fp8',pricing:{prompt:'0.000002',completion:'0.000003'}}]}}});
  assert.equal((await ai.handle(request())).status,200);assert.deepEqual(calls[0].body.provider.only,['fixture']);
});
test('Jev no returns only scripted text and no model text',async()=>{
  const {ai,calls,logs}=fixture({verdict:'no'});const response=await ai.handle(request());const data=await response.json();
  assert.equal(response.status,200);assert.equal(data.judged,'rejected');assert.equal(data.scripted,true);
  assert.ok(!data.text.includes('sketch one screen'));assert.match(data.text,/Demo/);assert.equal(calls.length,2);assert.equal(logs[1].judged,'rejected');
});
test('strict yes/no parsing rejects malformed, prose, wrong types, ties and unexpected identities',()=>{
  const good={model:judge,answers:{safe:{type:'choice',choice:'yes',probabilities:{yes:1,no:0}}}};
  assert.equal(parseJevVerdict(good),true);
  for(const answer of [null,{},'yes',{...good,model:'z-ai/glm-5.3-flash'}, {...good,answers:{safe:{type:'choice',choice:'no',probabilities:{yes:0,no:1}}}}, {...good,answers:{safe:{type:'choice',choice:'yes please',probabilities:{yes:1,no:0}}}}, {...good,answers:{safe:{type:'choice',choice:'yes',probabilities:{yes:'1',no:0}}}}, {...good,answers:{safe:{type:'choice',choice:'yes',probabilities:{yes:0.5,no:0.5}}}}]) assert.equal(parseJevVerdict(answer),false);
});
test('cap reached or unsafe key stops before either model call and returns scripted fallback',async()=>{
  for(const options of [{remaining:0},{remaining:0.00001},{limit:4},{env:{SYNERA_LIVE_AI_DAILY_CAP_USD:'0.00001'}}]) {
    const {ai,calls}=fixture(options);const response=await ai.handle(request());const data=await response.json();
    assert.equal(response.status,503);assert.equal(data.scripted,true);assert.match(data.text,/Demo/);assert.equal(calls.length,0);
  }
});
test('missing key returns live_ai_not_configured and health is false',async()=>{
  const {ai,calls}=fixture({env:{OPENROUTER_API_KEY:''}});const r=await ai.handle(request());
  assert.equal(r.status,503);assert.equal((await r.json()).error,'live_ai_not_configured');assert.equal(calls.length,0);
  assert.equal((await (await ai.handle(new Request('https://preview.example/api/ai/health'))).json()).liveAiReady,false);
});
test('untrusted body, missing consent and cross-origin input never reaches a provider',async()=>{
  const {ai,calls}=fixture();
  for(const r of [request({...payload,profile:{name:'private'}}),request({...payload,conversation:[{role:'assistant',content:'private profile'}]}),request(payload,{'X-Synera-AI-Consent':''}),request(payload,{Origin:'https://other.example'}),request({...payload,persona:'not-a-demo-person'})]) assert.ok((await ai.handle(r)).status>=400);
  assert.equal(calls.length,0);
});
test('missing cost retains catalog worst-case reservation and does not claim reported cost',async()=>{
  const {ai,logs}=fixture({missingCost:true});const response=await ai.handle(request());const data=await response.json();
  assert.equal(data.costStatus,'reserved');assert.ok(data.costUsd>0.002);assert.equal(logs.length,2);
  assert.ok(logs.every(l=>l.costStatus==='reserved'));
});
test('ambiguous paid outcome halts the instance without retry; UTC rollover resets the advisory counter',async()=>{
  const {ai,calls,logs,setDay}=fixture({transportError:true});
  assert.equal((await ai.handle(request())).status,503);assert.equal((await ai.handle(request())).status,503);
  assert.equal(calls.length,1);assert.equal(logs.length,1);assert.equal(logs[0].costStatus,'reserved');
  setDay('2026-10-31T00:00:01Z');const spend=await (await ai.handle(new Request('https://preview.example/api/ai/spend'))).json();
  assert.equal(spend.calls,0);assert.equal(spend.costUsd,0);assert.equal(spend.day,'2026-10-31');
});
test('one-shot smoke exercises the Vercel handler with both fake provider calls and records total cost',async()=>{
  await fs.mkdir('tmp',{recursive:true});const directory=await fs.mkdtemp(path.resolve('tmp/vercel-handler-smoke-'));
  const {ai,calls}=fixture();let posts=0;
  const args={origin:'https://preview.example',receiptPath:path.join(directory,'receipt.json'),fetchImpl:async(url,options)=>{
    if(url.endsWith('/config.json')) return Response.json({liveAiReady:true,liveAiModel:model,liveAiRuntime:'vercel'});
    if(options?.method==='POST') posts++;
    return ai.handle(new Request(url,options));
  }};
  const result=await liveAiSmoke(args);assert.equal(result.status,'PASS_TRANSPORT_AND_COST');assert.equal(result.costUsd,0.002);assert.equal(result.judged,'accepted');
  await assert.rejects(liveAiSmoke(args),{code:'EEXIST'});assert.equal(posts,1);assert.equal(calls.length,2);
});
