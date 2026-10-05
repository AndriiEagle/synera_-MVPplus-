// Local bounded gateway/client acceptance; provider transport and persistence are fixtures.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { handleNeon as originalHandle } from '../neon/worker.mjs';
import { createFixture, A, B, O, origin, config } from './fixtures/real-journey-fixture.mjs';
import { createMessageFixture } from './fixtures/message-intent-fixture.mjs';
import { RealJourneyStore } from '../web_launch/real-journey-client.mjs';
const proof='artifacts/pilot-hardening-20261005', mutate=process.argv.includes('--mutate');
const report={status:'NOT_ACCEPTED',scope:'Local gateway/client with injected transport; not SQL, signed JWT, live sessions or capacity',checks:[],source_sha256:{},provider_calls:0,provider_usd:0};
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const file of ['neon/worker.mjs','web_launch/real-journey-client.mjs','tools/fixtures/message-intent-fixture.mjs','tools/fixtures/real-journey-fixture.mjs', 'tools/pilot-hardening-transport.mjs'])report.source_sha256[file]=hash(await fs.readFile(file));
let handle=originalHandle;
if(mutate){
  let source=await fs.readFile('neon/worker.mjs','utf8');const needle='!allowed.has(user.email.toLowerCase())';assert.equal(source.split(needle).length,2);
  source=source.replace(needle,'false').replace(/from '([^']+)'/g,(_,name)=>`from '${pathToFileURL(path.resolve('neon',name)).href}'`);
  handle=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).handleNeon;
}
const meeting='44444444-4444-4444-8444-444444444444';
const check=async(name,fn)=>{await fn();report.checks.push({name,pass:true});};
function request(actor=A,body={intentId:randomUUID(),text:'Synthetic message'},extra={},route='/messages/'+meeting){return new Request(origin+'/api/neon'+route,{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',Cookie:actor?'__Host-synera-session='+actor:'',...extra},body:typeof body==='string'?body:JSON.stringify(body)});}
const fixture=createFixture(),env={...fixture.env,SYNERA_MESSAGE_INTENTS_READY:'true'};
try {
  await check('allowlist_rejects_valid_provider_session_before_data_access',async()=>{
    let dataCalls=0;const res=await handle(request(),{...env,SYNERA_PILOT_EMAILS:B+'@example.com'},async(url,init)=>{if(url.endsWith('/get-session'))return fixture.upstream(url,init);dataCalls++;return Response.json({});});
    assert.equal(res.status,401,'Non-allowlisted session reached data');assert.equal(dataCalls,0);assert.match(res.headers.get('set-cookie'),/Max-Age=0/);
  });
  await check('unauthenticated_duplicate_cookie_cross_origin_oversize_and_bad_json_have_zero_upstream',async()=>{
    const cases=[[request(null),401],[request(A,undefined,{Cookie:'__Host-synera-session='+A+'; __Host-synera-session='+B}),401],[request(A,undefined,{Origin:'https://outsider.example'}),403],[request(A,'x'.repeat(4097)),413],[request(A,'{'),400],[request(A,'{}',{'Content-Length':'4097'}),413],[request(A,'{}',{'Content-Type':'text/plain'}),415],[request(A,{intentId:randomUUID(),text:'x'.repeat(1001)}),400],[request(A,{intentId:randomUUID(),text:'valid',sender_id:B}),400]];
    for(const [req,status] of cases){let calls=0;const res=await handle(req,env,async()=>{calls++;throw Error('must not reach upstream');});assert.equal(res.status,status);assert.equal(calls,0);assert.equal(res.headers.get('cache-control'),'no-store');}
  });
  await check('allowlist_eleven_entries_fails_closed',async()=>{let calls=0;const res=await handle(request(),{...env,SYNERA_PILOT_EMAILS:Array.from({length:11},(_,i)=>`actor${i}@example.com`).join(',')},async()=>{calls++;throw Error();});assert.equal(res.status,503);assert.equal(calls,0);});
  await check('provider_errors_are_sanitized_no_retry_no_private_cache',async()=>{
    for(const status of [401,403,409,429,500,'network']){
      let auth=0,writes=0;const res=await handle(request(),env,async(url,init)=>{
        assert.equal(init.cache,'no-store');assert.equal(init.redirect,'manual');assert.ok(init.signal instanceof AbortSignal);
        if(url.endsWith('/get-session')){auth++;return fixture.upstream(url,init);}writes++;
        if(status==='network')throw Error('PRIVATE_DIAGNOSTIC');return Response.json({error:'PRIVATE_DIAGNOSTIC'},{status});
      });assert.equal(res.status,status===500||status==='network'?503:status);assert.equal(auth,1);assert.equal(writes,1);assert.equal(res.headers.get('cache-control'),'no-store');assert.ok(!(await res.text()).includes('PRIVATE_DIAGNOSTIC'));
    }
  });
  await check('logout_provider_failure_still_expires_browser_cookie',async()=>{const res=await handle(request(A,{}, {},'/logout'),env,async()=>{throw Error('PRIVATE_DIAGNOSTIC');});assert.equal(res.status,503);assert.match(res.headers.get('set-cookie'),/Max-Age=0/);});
  await check('distinct_actors_and_intents_overlap_without_cross_actor_delivery',async()=>{
    const db=createMessageFixture();db.meetings.push({id:meeting,sender_id:A,recipient_id:B,status:'accepted'});
    const clients=await Promise.all([A,B].map(async actor=>{const client=new RealJourneyStore({...config,messageIntentsEnabled:true},db.fetchFor(actor));await client.restore();return client;}));
    await Promise.all(clients.flatMap((client,i)=>Array.from({length:6},(_,j)=>client.sendConversation(meeting,`Actor ${i} intent ${j}`))));
    assert.equal(db.messages.length,12);assert.equal(new Set(db.messages.map(row=>row.id)).size,12);
    for(const [i,actor] of [A,B].entries())assert.equal(db.messages.filter(row=>row.sender_id===actor&&row.body.startsWith(`Actor ${i}`)).length,6);
    db.noConsent.add(A);await assert.rejects(clients[0].sendConversation(meeting,'Consent revoked'));db.noConsent.delete(A);db.revoked.add(B);await assert.rejects(clients[1].sendConversation(meeting,'Session revoked'));assert.equal(db.messages.length,12);
    const outsider=new RealJourneyStore({...config,messageIntentsEnabled:true},db.fetchFor(O));await outsider.restore();await assert.rejects(outsider.sendConversation(meeting,'Outsider'));assert.equal(db.messages.length,12);
  });
  await check('unknown_delivery_is_manual_replay_and_account_change_clears_pending_identity',async()=>{
    const db=createMessageFixture();db.meetings.push({id:meeting,sender_id:A,recipient_id:B,status:'accepted'});let actor=A,lose=true,posts=0;
    const client=new RealJourneyStore({...config,messageIntentsEnabled:true},async(url,init)=>{const res=await db.fetchFor(actor)(url,init);if(url.includes('/messages/')){posts++;if(lose){lose=false;return Response.json({},{status:503});}}return res;});await client.restore();
    await assert.rejects(client.sendConversation(meeting,'Uncertain A'));assert.equal(posts,1);assert.equal(db.messages.length,1);await client.dashboard();assert.equal(posts,1);
    await client.sendConversation(meeting,'Uncertain A');assert.equal(posts,2);assert.equal(db.messages.length,1);
    lose=true;await assert.rejects(client.sendConversation(meeting,'Same words'));const old=db.messages.at(-1).id;actor=B;await client.restore();await client.sendConversation(meeting,'Same words');assert.notEqual(db.messages.at(-1).id,old);assert.equal(db.messages.at(-1).sender_id,B);
  });
  report.status='PASS_LOCAL_TRANSPORT_AND_CLIENT';
  if(mutate)throw Error('Mutation survived');
}catch(error){report.error=error.message;report.status=mutate&&error.message.includes('Non-allowlisted session')?'MUTANT_REJECTED_ALLOWLIST':'FAIL';if(report.status==='FAIL')process.exitCode=1;}
finally {for(const [file,digest] of Object.entries(report.source_sha256))assert.equal(hash(await fs.readFile(file)),digest);await fs.mkdir(proof,{recursive:true});await fs.writeFile(`${proof}/${mutate?'MUTATION':'TRANSPORT'}.json`,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
