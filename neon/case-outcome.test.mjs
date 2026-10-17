import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {handleNeon,createNeonWorker} from './worker.mjs';
import {validateConfig} from '../web_launch/config.mjs';

const origin='https://outcome-fixture.pages.dev',actor='11111111-1111-4111-8111-111111111111';
const jwt='fixture.identity.signature',cookie='__Host-synera-session=opaque-fixture';
const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
  SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:'fixture@example.com',
  SYNERA_PILOT_READY:'true',SYNERA_REAL_JOURNEY_READY:'true',SYNERA_CASE_OUTCOMES_READY:'true'};
const reviewed={action:'state',version:3,termsHash:'a'.repeat(64)};
const intent='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const request=(body=reviewed,{path='/outcomes/pair-case-ab',headers={},method='POST',raw}={})=>new Request(origin+'/api/neon'+path,{method,
  headers:{Origin:origin,'Content-Type':'application/json','X-Synera-Client':'1',Cookie:cookie,...headers},
  ...(method==='GET'?{}:{body:raw??JSON.stringify(body)})});
const session=()=>Response.json({user:{id:actor,email:'fixture@example.com',emailVerified:true},session:{id:'s'}},{headers:{'set-auth-jwt':jwt}});
function transport({dataStatus=200,sessionReply=session}={}){
  const calls=[];return {calls,fetch:async(url,init)=>{calls.push({url,init});return url.endsWith('/get-session')?sessionReply():Response.json({schema:'synera.case-outcome.v1',events:[],outcome_confirmed:false},{status:dataStatus});}};
}
async function assertCrossSiteRejected(handler){
  const upstream=transport();const response=await handler(request(reviewed,{headers:{'Sec-Fetch-Site':'cross-site'}}),env,upstream.fetch);
  assert.equal(response.status,403,'cross-site outcome request must be rejected');assert.equal(upstream.calls.length,0);
}

test('established origin boundary rejects cross-site outcome requests before authentication',async()=>{
  await assertCrossSiteRejected(handleNeon);
  for(const headers of [{Origin:'https://evil.example'},{Origin:''},{'X-Synera-Client':''}]){
    const upstream=transport();assert.equal((await handleNeon(request(reviewed,{headers}),env,upstream.fetch)).status,403);assert.equal(upstream.calls.length,0);
  }
});
test('outcome rollout is closed by default and requires all three explicit gates',async()=>{
  for(const overrides of [{SYNERA_CASE_OUTCOMES_READY:undefined},{SYNERA_CASE_OUTCOMES_READY:'false'},{SYNERA_CASE_OUTCOMES_READY:'TRUE'},
    {SYNERA_REAL_JOURNEY_READY:'false'},{SYNERA_PILOT_READY:'false'}]){
    const upstream=transport();assert.equal((await handleNeon(request(),{...env,...overrides},upstream.fetch)).status,503);assert.equal(upstream.calls.length,0);
  }
  const worker=createNeonWorker([]);
  const read=async(settings)=>(await(await worker.fetch(new Request(origin+'/config.json'),settings)).json());
  assert.equal((await read({...env,SYNERA_CASE_OUTCOMES_READY:undefined})).caseOutcomesEnabled,false);
  assert.equal((await read(env)).caseOutcomesEnabled,true);
  assert.equal((await read({...env,SYNERA_REAL_JOURNEY_READY:'false'})).caseOutcomesEnabled,false);
});
test('API forwards only the reviewed case payload with a fresh server-derived JWT',async()=>{
  for(const body of [reviewed,{...reviewed,action:'submit',index:0,intentId:intent,evidenceUri:'https://example.com/доказ × Zürich 💛'},
    {...reviewed,action:'check',index:0,intentId:intent,scopeNotes:'Перевірено критерій'},
    {...reviewed,action:'accept',index:0,intentId:intent},{...reviewed,action:'decline',index:0,intentId:intent,reason:'below_acceptance_criteria'}]){
    const upstream=transport();const response=await handleNeon(request(body,{headers:{Authorization:'Bearer caller-token'}}),env,upstream.fetch);
    assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(upstream.calls.length,2);
    const call=upstream.calls[1];assert.equal(call.url,env.SYNERA_NEON_DATA_URL+'/rpc/synera_case_outcome');
    assert.equal(call.init.headers.Authorization,'Bearer '+jwt);assert.equal(call.init.headers.Cookie,undefined);
    assert.deepEqual(JSON.parse(call.init.body),{p_case_id:'pair-case-ab',p_payload:body});
    assert.equal(response.headers.get('set-auth-jwt'),null);assert.equal(response.headers.get('set-cookie'),null);
    assert.equal((await response.json()).outcome_confirmed,false);
  }
});
test('forged identity, clocks, invalid revisions and irrelevant action fields make no upstream call',async()=>{
  const bad=[{...reviewed,actor_id:actor},{...reviewed,created_at:'2026-01-01'}, {...reviewed,version:0},{...reviewed,version:1.5},
    {...reviewed,version:'3'},{...reviewed,termsHash:'x'.repeat(64)}, {...reviewed,action:'automatically_accept'},
    {...reviewed,index:0}, {...reviewed,action:'accept',index:0}, {...reviewed,action:'accept',index:-1,intentId:intent},
    {...reviewed,action:'accept',index:0,intentId:'bad'}, {...reviewed,action:'accept',index:0,intentId:intent,evidenceUri:'unexpected'},
    {...reviewed,action:'submit',index:0,intentId:intent,evidenceUri:' '},{...reviewed,action:'submit',index:0,intentId:intent,evidenceUri:'x'.repeat(1001)},
    {...reviewed,action:'check',index:0,intentId:intent,scopeNotes:[]}, {...reviewed,action:'decline',index:0,intentId:intent,reason:'lazy_person'},[]];
  for(const body of bad){const upstream=transport();assert.equal((await handleNeon(request(body),env,upstream.fetch)).status,400,JSON.stringify(body));assert.equal(upstream.calls.length,0);}
});
test('route, byte, media and private-table boundaries reject unsupported requests without an RPC',async()=>{
  const cases=[{path:'/outcomes/pair-case-ab?actor=other',status:404},{path:'/outcomes/pair-case-ab/extra',status:404},
    {path:'/outcomes/%2Fdata%2Fprofiles',status:404},{method:'GET',status:404},{headers:{'Content-Type':'text/plain'},status:415},
    {raw:'{"x":"'+'ї'.repeat(3000)+'"}',status:413},{raw:'{bad',status:400},
    {path:'/data/match_outcome_events',status:404},{path:'/data/rpc',status:404}];
  for(const item of cases){const upstream=transport();assert.equal((await handleNeon(request(reviewed,item),env,upstream.fetch)).status,item.status);assert.equal(upstream.calls.length,0);}
});
test('missing/revoked sessions never reach the data API and conflict responses do not expose upstream details',async()=>{
  const absent=transport();assert.equal((await handleNeon(request(reviewed,{headers:{Cookie:''}}),env,absent.fetch)).status,401);assert.equal(absent.calls.length,0);
  const revoked=transport({sessionReply:()=>Response.json({})});assert.equal((await handleNeon(request(),env,revoked.fetch)).status,401);assert.equal(revoked.calls.length,1);
  for(const status of [403,409,429,500]){
    let calls=0;const response=await handleNeon(request(),env,async()=>++calls===1?session():Response.json({message:'PRIVATE_SQL_ERROR secret=password'},{status}));
    assert.equal(response.status,status===500?503:status);assert.doesNotMatch(await response.text(),/PRIVATE_SQL_ERROR|password|signature/);
  }
});
test('public outcome config cannot enable a backend without the existing account/journey gates',()=>{
  const config={backend:'neon',pilotSafetyEnabled:true,realPilotEnabled:true,realJourneyEnabled:true,caseOutcomesEnabled:true};
  assert.equal(validateConfig(config).caseOutcomesEnabled,true);
  assert.equal(validateConfig({backend:'neon',caseOutcomesEnabled:false}).caseOutcomesEnabled,false);
  for(const bad of [{caseOutcomesEnabled:'true'},{...config,realJourneyEnabled:false},{...config,realPilotEnabled:false},{...config,backend:'supabase'}])assert.throws(()=>validateConfig(bad));
});
test('the same semantic origin guard detects removal of the cross-site check in an isolated module',async()=>{
  const file=new URL('./worker.mjs',import.meta.url),source=await fs.readFile(file,'utf8');
  const needle=" || request.headers.get('Sec-Fetch-Site') === 'cross-site'";
  assert.ok(source.includes(needle));
  const mutant=source.replace(needle,'').replace(/from '(\.[^']+)'/g,(_,relative)=>'from '+JSON.stringify(new URL(relative,file).href));
  const module=await import('data:text/javascript;base64,'+Buffer.from(mutant).toString('base64'));
  await assert.rejects(assertCrossSiteRejected(module.handleNeon),/cross-site outcome request must be rejected/);
});
