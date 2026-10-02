import {test} from 'node:test';import assert from 'node:assert/strict';
import {handleGroupRoom} from './group-room.mjs';import {handleNeon,createNeonWorker} from './worker.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',R='55555555-5555-4555-8555-555555555555';
const origin='https://room-fixture.pages.dev',jwt='fixture.identity.signature';
const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:'fixture@example.com',SYNERA_PILOT_READY:'true',SYNERA_GROUP_ROOMS_READY:'true'};
const req=(path,body={},headers={},method='POST')=>new Request(origin+'/api/neon/rooms/'+path,{method,headers:{'Content-Type':'application/json','X-Synera-Client':'1',Origin:origin,...headers},...(method==='GET'?{}:{body:JSON.stringify(body)})});
const session={user:{id:A}};
test('room contract sends only declared fields and database owns the actor',async()=>{
 const calls=[];const response=await handleGroupRoom(req('create',{title:' Test ',goal:' Useful project ',invitee_ids:[B]}),env,session,async(name,args)=>{calls.push({name,args});return {id:R};});
 assert.equal(response.status,200);assert.deepEqual(calls,[{name:'synera_room_create',args:{p_title:'Test',p_goal:'Useful project',p_invitee_ids:[B]}}]);
 const text='ї'.repeat(2000);await handleGroupRoom(req(R+'/message',{expected_revision:7,message_id:R,body:text}),env,session,async(name,args)=>{assert.equal(name,'synera_room_message');assert.equal(args.p_body,text);assert.equal(args.p_expected_revision,7);assert.equal(args.p_user_id,undefined);return {};});
});
test('forged identity, duplicate/self invitations, wrong revisions and bodies make no RPC',async()=>{
 let calls=0;const rpc=async()=>{calls++;return {};};for(const [path,body] of [['create',{title:'x',goal:'y',invitee_ids:[B,B]}],['create',{title:'x',goal:'y',invitee_ids:[A]}],[R+'/message',{expected_revision:1,message_id:R,body:'text',user_id:B}],[R+'/advance',{expected_revision:-1}],[R+'/advance',{expected_revision:0}],[R+'/message',{expected_revision:1,message_id:R,body:'x'.repeat(2001)}],['list',{actor_id:B}],[R+'/accept',{consent:true}]])assert.equal((await handleGroupRoom(req(path,body),env,session,rpc)).status,400);
 for(const request of [req('../data/profiles'),req(R+'/get?secret=1'),req('list',{}, {},'GET')])assert.equal((await handleGroupRoom(request,env,session,rpc)).status,404);
 assert.equal((await handleGroupRoom(req('list'),env,null,rpc)).status,401);assert.equal(calls,0);
});
test('live room rollout stays shut and original origin checks forbid cross-site mutations',async()=>{
 let calls=0;const never=async()=>{calls++;throw Error('unexpected upstream');};
 for(const settings of [{...env,SYNERA_PILOT_READY:'false'},{...env,SYNERA_GROUP_ROOMS_READY:'false'}])assert.equal((await handleNeon(req('list'),settings,never)).status,503);
 for(const headers of [{Origin:'https://other.test'},{'Sec-Fetch-Site':'cross-site'},{'X-Synera-Client':''}])assert.equal((await handleNeon(req('list',{},headers),env,never)).status,403);
 assert.equal(calls,0);
 const worker=createNeonWorker([]);assert.equal((await(await worker.fetch(new Request(origin+'/config.json'),env)).json()).groupRoomsEnabled,true);
 assert.equal((await(await worker.fetch(new Request(origin+'/config.json'),{...env,SYNERA_GROUP_ROOMS_READY:'false'})).json()).groupRoomsEnabled,false);
});
test('room gateway forwards fresh verified-session JWT and never caller identity or cookies',async()=>{
 const calls=[];const response=await handleNeon(req(R+'/message',{expected_revision:3,message_id:R,body:'Business question'},{Cookie:'__Host-synera-session=opaque-fixture',Authorization:'Bearer attacker'}),env,async(url,init)=>{calls.push({url,init});return calls.length===1?Response.json({user:{id:A,email:'fixture@example.com',emailVerified:true},session:{id:'s'}},{headers:{'set-auth-jwt':jwt}}):Response.json({id:R,revision:4});});
 assert.equal(response.status,200);assert.equal(calls.length,2);assert.equal(calls[1].url,env.SYNERA_NEON_DATA_URL+'/rpc/synera_room_message');assert.equal(calls[1].init.headers.Authorization,'Bearer '+jwt);assert.equal(calls[1].init.headers.Cookie,undefined);assert.equal(JSON.parse(calls[1].init.body).p_user_id,undefined);assert.equal(response.headers.get('set-auth-jwt'),null);
});
