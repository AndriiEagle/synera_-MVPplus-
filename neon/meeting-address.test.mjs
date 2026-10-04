import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {handleNeon,createNeonWorker} from './worker.mjs';
import {validateConfig} from '../web_launch/config.mjs';
const origin='https://address-fixture.pages.dev',actor='11111111-1111-4111-8111-111111111111';
const meeting='44444444-4444-4444-8444-444444444444',caseId='case-address-ab';
const intent='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',proposal='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const jwt='fixture.identity.signature';
const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
  SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:'fixture@example.com',
  SYNERA_PILOT_READY:'true',SYNERA_REAL_JOURNEY_READY:'true',SYNERA_MEETING_ADDRESS_READY:'true'};
const reviewed={action:'state',version:1,termsHash:'a'.repeat(64)};
const request=(body=reviewed,{path='/meeting-address/'+meeting+'/'+caseId,headers={},method='POST',raw}={})=>new Request(origin+'/api/neon'+path,{method,
  headers:{Origin:origin,'Content-Type':'application/json','X-Synera-Client':'1',Cookie:'__Host-synera-session=opaque-fixture',...headers},
  ...(method==='GET'?{}:{body:raw??JSON.stringify(body)})});
const session=()=>Response.json({user:{id:actor,email:'fixture@example.com',emailVerified:true},session:{id:'s'}},{headers:{'set-auth-jwt':jwt}});
function transport({sessionReply=session,dataStatus=200}={}){
  const calls=[];return {calls,fetch:async(url,init)=>{calls.push({url,init});return url.endsWith('/get-session')?sessionReply():Response.json({schema:'synera.meeting-address.v1',agreed:false,events:[],private_fixture_note:'not a live identity'},{status:dataStatus});}};
}
export async function assertAddressClosed(handler){
  const upstream=transport();
  const response=await handler(request(),{...env,SYNERA_MEETING_ADDRESS_READY:undefined},upstream.fetch);
  assert.equal(response.status,503,'Closed address mode must reject before authentication');assert.equal(upstream.calls.length,0);
}
test('address inherits same-origin and cross-site guards before any session access',async()=>{
  for(const headers of [{'Sec-Fetch-Site':'cross-site'},{Origin:'https://evil.example'},{Origin:''},{'X-Synera-Client':''}]){
    const upstream=transport();assert.equal((await handleNeon(request(reviewed,{headers}),env,upstream.fetch)).status,403);assert.equal(upstream.calls.length,0);
  }
});
test('address route and public configuration stay closed without all three explicit gates',async()=>{
  await assertAddressClosed(handleNeon);
  for(const change of [{SYNERA_MEETING_ADDRESS_READY:'false'},{SYNERA_MEETING_ADDRESS_READY:'TRUE'},{SYNERA_REAL_JOURNEY_READY:'false'},{SYNERA_PILOT_READY:'false'}]){
    const upstream=transport();assert.equal((await handleNeon(request(),{...env,...change},upstream.fetch)).status,503);assert.equal(upstream.calls.length,0);
  }
  const worker=createNeonWorker([]);
  for(const [change,expected] of [[{SYNERA_MEETING_ADDRESS_READY:undefined},false],[{},true],[{SYNERA_REAL_JOURNEY_READY:'false'},false]]){
    const config=await(await worker.fetch(new Request(origin+'/config.json'),{...env,...change})).json();
    assert.equal(config.meetingAddressEnabled,expected);assert.equal(validateConfig(config).meetingAddressEnabled,expected);
  }
});
test('all four address actions forward an exact reviewed proposal through a fixed RPC with a fresh server JWT',async()=>{
  for(const body of [reviewed,{...reviewed,action:'propose',intentId:intent,proposalId:null,address:'Café Zürich 💛 — Дім',consent:true},
    {...reviewed,action:'propose',intentId:intent,proposalId:proposal,address:'New address',consent:true},
    {...reviewed,action:'accept',intentId:intent,proposalId:proposal,consent:true},{...reviewed,action:'decline',intentId:intent,proposalId:proposal}]){
    const upstream=transport();const response=await handleNeon(request(body,{headers:{Authorization:'Bearer forged-caller-token',Prefer:'return=representation'}}),env,upstream.fetch);
    assert.equal(response.status,200,'Reviewed address request must reach its fixed RPC');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(upstream.calls.length,2);
    const call=upstream.calls[1];assert.equal(call.url,env.SYNERA_NEON_DATA_URL+'/rpc/synera_meeting_address');
    assert.equal(call.init.headers.Authorization,'Bearer '+jwt);assert.equal(call.init.headers.Cookie,undefined);assert.equal(call.init.headers.Prefer,undefined);
    assert.deepEqual(JSON.parse(call.init.body),{p_meeting_id:meeting,p_case_id:caseId,p_payload:body});
    assert.equal(response.headers.get('set-auth-jwt'),null);assert.equal(response.headers.get('set-cookie'),null);
    assert.equal((await response.json()).agreed,false,'Gateway must not synthesize agreement');
  }
});
test('forged identity, clocks, stale shapes and implicit consent are rejected without upstream calls',async()=>{
  const propose={...reviewed,action:'propose',intentId:intent,proposalId:null,address:'Zürich',consent:true};
  const accept={...reviewed,action:'accept',intentId:intent,proposalId:proposal,consent:true};
  const bad=[null,[],{...reviewed,actor_id:actor},{...reviewed,created_at:'2026-01-01'},{...reviewed,version:0},{...reviewed,version:1.5},
    {...reviewed,version:'1'},{...reviewed,termsHash:'x'.repeat(64)},{...reviewed,action:'auto_accept'},{...reviewed,proposalId:proposal},
    {...propose,consent:false},{...propose,consent:'true'},{...propose,address:' '},{...propose,address:'💛'.repeat(201)},
    {...propose,proposalId:undefined},{...propose,intentId:'not-uuid'},{...accept,proposalId:null},{...accept,consent:undefined},
    {...accept,address:'Replacement in acceptance'},{...accept,action:'decline'},{...propose,termsHash:null}];
  for(const body of bad){const upstream=transport();assert.equal((await handleNeon(request(body),env,upstream.fetch)).status,400,JSON.stringify(body));assert.equal(upstream.calls.length,0);}
});
test('address route, body and private-table boundaries reject unsupported requests before any RPC',async()=>{
  const cases=[{path:'/meeting-address/'+meeting+'/'+caseId+'?actor=other',status:404},{path:'/meeting-address/'+meeting+'/'+caseId+'/extra',status:404},
    {path:'/meeting-address/%2Fdata%2Fprofiles/'+caseId,status:404},{path:'/meeting-address/'+meeting+'/bad.case',status:404},
    {method:'GET',status:404},{headers:{'Content-Type':'text/plain'},status:415},{raw:'{"x":"'+'ї'.repeat(3000)+'"}',status:413},
    {raw:'{bad',status:400},{path:'/data/meeting_address_events',status:404},{path:'/data/rpc',status:404}];
  for(const item of cases){const upstream=transport();assert.equal((await handleNeon(request(reviewed,item),env,upstream.fetch)).status,item.status);assert.equal(upstream.calls.length,0);}
});
test('missing or revoked sessions stop before data and SQL denial/conflicts stay neutral without retries',async()=>{
  const absent=transport();assert.equal((await handleNeon(request(reviewed,{headers:{Cookie:''}}),env,absent.fetch)).status,401);assert.equal(absent.calls.length,0);
  for(const reply of [()=>Response.json({}),()=>Response.json({user:{id:actor,email:'fixture@example.com',emailVerified:false},session:{id:'s'}})]){
    const revoked=transport({sessionReply:reply});assert.equal((await handleNeon(request(),env,revoked.fetch)).status,401);assert.equal(revoked.calls.length,1);
  }
  for(const status of [403,409,429,500]){
    let count=0;const response=await handleNeon(request(),env,async()=>++count===1?session():Response.json({message:'PRIVATE_ADDRESS_SQL_ERROR secret=password'},{status}));
    assert.equal(response.status,status===500?503:status);assert.equal(count,2);assert.doesNotMatch(await response.text(),/PRIVATE_ADDRESS_SQL_ERROR|password|signature/);
  }
});
test('public address config cannot enable an unreviewed backend or account journey',()=>{
  const config={backend:'neon',pilotSafetyEnabled:true,realPilotEnabled:true,realJourneyEnabled:true,meetingAddressEnabled:true};
  assert.equal(validateConfig(config).meetingAddressEnabled,true);
  assert.equal(validateConfig({backend:'neon',meetingAddressEnabled:false}).meetingAddressEnabled,false);
  for(const bad of [{meetingAddressEnabled:'true'},{...config,realJourneyEnabled:false},{...config,realPilotEnabled:false},{...config,backend:'supabase'}])assert.throws(()=>validateConfig(bad));
});
test('the same closed-mode guard catches removal of the address rollout check in an isolated module',async()=>{
  const file=new URL('./worker.mjs',import.meta.url),source=await fs.readFile(file,'utf8');
  const needle="if (!meetingAddressReady(env)) throw new GatewayError(503, 'meeting_address_unavailable');";
  assert.ok(source.includes(needle));
  const mutant=source.replace(needle,'').replace(/from '(\.[^']+)'/g,(_,relative)=>'from '+JSON.stringify(new URL(relative,file).href));
  const module=await import('data:text/javascript;base64,'+Buffer.from(mutant).toString('base64'));
  await assert.rejects(assertAddressClosed(module.handleNeon),/Closed address mode must reject before authentication/);
});
