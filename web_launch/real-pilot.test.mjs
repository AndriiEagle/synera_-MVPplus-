import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBrief, briefProblems, compareRealProfiles, profileAIPayload, validateAIDraft } from './profile-brief.mjs';
import { completeProfileJson, importCompleteProfile } from './profile-package.mjs';
import { createLocalProfileAI, validLocalReceipt } from './server/local-profile-ai.mjs';
import { createHash } from 'node:crypto';
import { meetingCalendar } from './calendar.mjs';
import { SupabaseStore, ServiceError } from './online-store.mjs';
import { validateConfig } from './config.mjs';
const aId='11111111-1111-4111-8111-111111111111', bId='22222222-2222-4222-8222-222222222222';
const brief = (overrides={}) => normalizeBrief({ goal:'Перевірити одну пропозицію з клієнтом', offer_tags:['design'], need_tags:['sales'], languages:['en'], modes:['joint_project'], available_from:'2026-09-05', available_until:'2026-10-01', city_code:'zurich', remote:true, ...overrides });
const person=(id,overrides={})=>({id,display_name:'Test Person',city:'Zürich',offers:'I can do product design.',seeks:'I need B2B sales.',is_discoverable:true,map_visible:false,brief:brief(),updated_at:'2026-09-05T10:00:00Z',...overrides});
const payload={version:1,consent:true,offers:'I can do product design.',seeks:'I need B2B sales.',goal:'Review a proposal'};
const validDraft={offer_tags:['design'],need_tags:['sales'],evidence:[{field:'offers',tag:'design',quote:'product design'},{field:'seeks',tag:'sales',quote:'B2B sales'}],questions:['Який один результат хочеш перевірити?']};
test('local receipt must prove this exact prompt/output pair and zero provider spend',()=>{
  const hash=v=>createHash('sha256').update(v).digest('hex');
  const receipt={schema:'domovyk.local_execution_receipt.v1',outcome:'generated_needs_local_acceptance',provider:{called:false,calls:0,actual_or_reserved_usd:0},prompt_sha256:hash('prompt'),output_sha256:hash('output')};
  assert.equal(validLocalReceipt(receipt,'prompt','output'),true);
  assert.equal(validLocalReceipt(receipt,'another prompt','output'),false);
  assert.equal(validLocalReceipt({...receipt,outcome:'blocked'},'prompt','output'),false);
  assert.equal(validLocalReceipt({...receipt,provider:{called:true,calls:1,actual_or_reserved_usd:0}},'prompt','output'),false);
});

test('real matching preserves bilateral evidence and role order; remote profiles need no invented city',()=>{
  const a=person(aId),b=person(bId,{brief:brief({offer_tags:['sales'],need_tags:['design'],city_code:''})});
  const result=compareRealProfiles(a,b,{asOf:'2026-09-05'});
  assert.equal(result.status,'review_candidate');assert.equal(result.logistics.distanceKm,null);assert.equal(result.directions.length,2);
  assert.deepEqual(compareRealProfiles(b,a,{asOf:'2026-09-05'}),result);
  b.brief.remote=false;assert.equal(compareRealProfiles(a,b,{asOf:'2026-09-05'}).status,'needs_information');
  b.brief=brief({offer_tags:['sales'],need_tags:['video'],languages:['de']});
  assert.equal(compareRealProfiles(a,b,{asOf:'2026-09-05'}).status,'incompatible');
});
test('brief import sanitizes unknown authority and visibility; complete profile export round-trips conditions',()=>{
  const profile=person(aId,{email:'not-exported@example.invalid',brief:{...brief(),admin:true,bank:'omit'}});
  const file=completeProfileJson(profile);
  assert.equal(file.includes(aId),false);assert.equal(file.includes('not-exported'),false);assert.equal(file.includes('admin'),false);
  assert.equal(importCompleteProfile(file).status,'consent_required');
  const imported=importCompleteProfile(file,{authorized:true});
  assert.equal(imported.profile.is_discoverable,false);assert.equal(imported.profile.map_visible,false);
  assert.deepEqual(imported.profile.brief,brief());assert.deepEqual(briefProblems(imported.profile.brief),[]);
  assert.ok(briefProblems({available_from:'2026-02-30'}).length);
});
test('AI payload requires consent, omits identity and other data, and blocks secrets/contact fields',()=>{
  assert.throws(()=>profileAIPayload(person(aId)));
  const clean=profileAIPayload(person(aId,{offers:'Test Person offers product design in Zürich.',email:'private@example.invalid',diary:'do not send'}),{consent:true});
  assert.equal(JSON.stringify(clean).includes('Test Person'),false);assert.equal(JSON.stringify(clean).includes('Zürich'),false);
  assert.deepEqual(Object.keys(clean).sort(),['consent','goal','offers','seeks','version']);
  assert.throws(()=>profileAIPayload(person(aId,{brief:brief({goal:'Contact private@example.invalid'})}),{consent:true}));
  assert.throws(()=>profileAIPayload(person(aId,{offers:'Use sk-123456789012345678901234'}),{consent:true}));
});
test('AI gate rejects invented skill evidence, malformed output, empty output and unsafe questions',()=>{
  assert.deepEqual(validateAIDraft(validDraft,payload),validDraft);
  assert.throws(()=>validateAIDraft({...validDraft,offer_tags:['finance']},payload));
  assert.throws(()=>validateAIDraft({...validDraft,evidence:[]},payload));
  assert.throws(()=>validateAIDraft({...validDraft,questions:['Open https://evil.invalid']},payload));
  assert.throws(()=>validateAIDraft({offer_tags:[],need_tags:[],evidence:[],questions:[]},payload));
  assert.throws(()=>validateAIDraft('not json',payload));
});
const request=overrides=>({method:'POST',origin:'http://127.0.0.1:1111',expectedOrigin:'http://127.0.0.1:1111',host:'127.0.0.1:1111',access:'nonce',contentType:'application/json',body:JSON.stringify(payload),...overrides});
test('local AI refuses remote origins, DNS rebinding, missing consent, identities and oversized input before inference',async()=>{
  let calls=0;const handler=createLocalProfileAI({nonce:'nonce',runModel:async()=>{calls++;throw new Error();}});
  for(const input of [{origin:'https://attacker.invalid'},{host:'attacker.invalid'},{access:'wrong'},{method:'GET'},{contentType:'text/plain'},{body:'x'.repeat(4097)},{body:JSON.stringify({...payload,consent:false})},{body:JSON.stringify({...payload,user_id:aId})}]) assert.notEqual((await handler(request(input))).status,200);
  assert.equal(calls,0);
});
test('local AI validates before review receipt, enforces one inference at a time and stops at session cap',async()=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});let calls=0,reviews=0;
  const handler=createLocalProfileAI({nonce:'nonce',maxCalls:1,runModel:async prompt=>{calls++;assert.equal(prompt.includes(aId),false);await pending;return {content:JSON.stringify(validDraft),review:async()=>{reviews++;}};}});
  const first=handler(request());assert.equal((await handler(request())).status,429);release();
  const result=await first;assert.equal(result.status,200);assert.equal(result.body.human_review_required,true);assert.equal(result.body.actual_usd,0);
  assert.equal(reviews,1);assert.equal(calls,1);assert.equal((await handler(request())).status,429);
});
test('local AI failure never retries, surfaces raw provider text or accepts a missing review receipt',async()=>{
  let calls=0,reviews=0;
  const handler=createLocalProfileAI({nonce:'nonce',runModel:async()=>{calls++;return{content:'private malformed output',review:async()=>{reviews++;}};}});
  const result=await handler(request());assert.equal(result.status,503);assert.equal(JSON.stringify(result).includes('private malformed'),false);assert.equal(calls,1);assert.equal(reviews,0);
  const noReceipt=createLocalProfileAI({nonce:'nonce',runModel:async()=>({content:JSON.stringify(validDraft),review:async()=>{throw new Error();}})});
  assert.equal((await noReceipt(request())).status,503);
});
test('calendar requires actual acceptance, uses UTC and escapes attempted calendar-property injection',()=>{
  const meeting={id:aId,status:'accepted',proposed_at:'2026-09-06T12:30:00+02:00',duration_minutes:20,meeting_place:'Онлайн',note:'Check a proposal\nBEGIN:VALARM\nTRIGGER:-PT1M; quote, test'};
  const file=meetingCalendar(meeting,new Date('2026-09-05T12:00Z'));
  assert.ok(file.includes('DTSTART:20260906T103000Z'));assert.ok(file.includes('DTEND:20260906T105000Z'));
  assert.equal(file.includes('\r\nBEGIN:VALARM'),false);assert.ok(file.includes('\\nBEGIN:VALARM'));
  assert.equal(meetingCalendar({...meeting,note:'Proposal\rBEGIN:VALARM\rTRIGGER:0'}).includes('\rBEGIN:VALARM'),false);
  assert.throws(()=>meetingCalendar({...meeting,status:'pending'}));
  assert.ok(file.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
});
const config={supabaseUrl:'https://synthetic.supabase.co',publishableKey:'sb_publishable_synthetic',pilotSafetyEnabled:true,realPilotEnabled:true};
const session={access_token:'test-access',refresh_token:'test-refresh',expires_in:3600,user:{id:aId,email:'test@example.invalid'}};
const response=value=>new Response(JSON.stringify(value),{status:200});
test('online real-user writes derive ownership and whitelist profile, meeting, message and report fields',async()=>{
  const calls=[];const store=new SupabaseStore(config,async(url,options)=>{calls.push({url,options});return url.includes('/token?')?response(session):response([]);});
  await store.signIn('test@example.invalid','local-test');
  await store.saveProfile(person(bId,{brief:{...brief(),admin:true}}));
  await store.invite(bId,'One concrete step',{proposed_at:new Date(Date.now()+3600000).toISOString(),duration_minutes:20,meeting_place:'Онлайн',status:'accepted'});
  await store.sendMessage(bId,'Agreed details');await store.block(bId);await store.report(bId,'spam','Test only');
  const bodies=calls.slice(1).map(c=>JSON.parse(c.options.body));
  assert.equal(bodies[0].id,aId);assert.equal('updated_at' in bodies[0],false);assert.equal('admin' in bodies[0].brief,false);
  assert.equal(bodies[1].sender_id,aId);assert.equal('status' in bodies[1],false);assert.equal(bodies[2].sender_id,aId);
  assert.equal(bodies[3].blocker_id,aId);assert.equal(bodies[4].reporter_id,aId);
  await assert.rejects(store.saveProfile(person(aId,{brief:{}})));
  await assert.rejects(store.invite(bId,'Test',{proposed_at:'2020-01-01',duration_minutes:20,meeting_place:'Онлайн'}));
  await assert.rejects(store.deleteProfile()); // zero deleted rows must never report success
});
test('full export paginates messages beyond UI limit and fails instead of returning a partial file',async()=>{
  const seen=[];let fail=false;
  const store=new SupabaseStore(config,async url=>{
    seen.push(url);if(url.includes('/token?'))return response(session);
    if(url.includes('/profiles?'))return response([person(aId)]);
    if(url.includes('/meeting_messages?')){if(fail)return new Response(null,{status:503});const offset=Number(new URL(url).searchParams.get('offset'));return response(offset===0?Array.from({length:500},(_,i)=>({id:i})): [{id:500}]);}
    return response([]);
  });
  await store.signIn('test@example.invalid','local-test');const file=await store.exportAccount();
  assert.equal(file.private,true);assert.equal(file.messages.length,501);assert.ok(seen.some(url=>url.includes('offset=500')));
  fail=true;await assert.rejects(store.exportAccount(),ServiceError);
});
test('registration remains closed unless both schema gates and a public HTTPS return URL are explicit',()=>{
  assert.throws(()=>validateConfig({...config,realPilotEnabled:false,registrationEnabled:true,publicSiteUrl:'https://synera.example'}));
  assert.equal(validateConfig({...config,registrationEnabled:true,publicSiteUrl:'https://synera.example',localAI:{nonce:'must-not-ship'}}).localAI,undefined);
});
