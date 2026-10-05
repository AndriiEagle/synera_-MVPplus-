// Package closure for this owned candidate, not a deployment or cloud acceptance.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
import { A, origin } from './fixtures/real-journey-fixture.mjs';
const proof='artifacts/message-intent-20261005', output='dist-neon-message-intent-20261005', dir=path.join('web_launch',output);
const hash=b=>createHash('sha256').update(b).digest('hex');
const run=(program,args)=>{const r=spawnSync(program,args,{encoding:'utf8',timeout:30000});assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout;};
const preserved='68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b';assert.equal(hash(await fs.readFile('web_launch/journey-ui.mjs')),preserved);
for(const [file,status] of [['SQL.json','PASS_LOCAL_SQL_CONCURRENT_MESSAGE_INTENTS'],['browser/RESULT.json','PASS_LOCAL_MESSAGE_INTENT_BROWSER'],['mutation/RESULT.json','MUTANT_REJECTED_DUPLICATE_MESSAGE']])assert.equal(JSON.parse(await fs.readFile(path.join(proof,file))).status,status);
run(process.execPath,['neon/build.mjs',output]);
const accepted=Buffer.from(run('git',['show','HEAD:web_launch/journey-ui.mjs']));
await fs.writeFile(path.join(dir,'journey-ui.mjs'),accepted);
const release=JSON.parse(await fs.readFile(path.join(dir,'release.json')));
release.source_selection={base:run('git',['rev-parse','HEAD']).trim(),journey_ui:'committed HEAD copy; foreign working bytes preserved',journey_ui_sha256:hash(accepted)};
for(const row of release.files){const b=await fs.readFile(path.join(dir,row.name));row.bytes=b.length;row.sha256=hash(b);}
await fs.writeFile(path.join(dir,'release.json'),JSON.stringify(release,null,2));
assert.deepEqual((await fs.readdir(dir)).sort(),[...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json'].sort());
for(const row of release.files){const b=await fs.readFile(path.join(dir,row.name));assert.equal(hash(b),row.sha256);assert.equal(b.length,row.bytes);}
for(const name of ['real-journey-client.mjs','neon-store.mjs','real-journey.mjs'])assert.equal(hash(await fs.readFile(path.join(dir,name))),hash(await fs.readFile(path.join('web_launch',name))));
const worker=await import('data:text/javascript;base64,'+(await fs.readFile(path.join(dir,'_worker.js'))).toString('base64'));
const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:'pilot@example.com',SYNERA_PILOT_READY:'true',SYNERA_REAL_JOURNEY_READY:'true'};
assert.equal((await (await worker.default.fetch(new Request(origin+'/config.json'),env)).json()).messageIntentsEnabled,false);
assert.equal((await (await worker.default.fetch(new Request(origin+'/config.json'),{...env,SYNERA_MESSAGE_INTENTS_READY:'true'})).json()).messageIntentsEnabled,true);
const previous=globalThis.fetch,seen=[];const meeting='44444444-4444-4444-8444-444444444444',intent='55555555-5555-4555-8555-555555555555';
try {
  globalThis.fetch=async(url,init)=>{seen.push({url,method:init.method});if(url.endsWith('/get-session'))return Response.json({user:{id:A,email:'pilot@example.com',emailVerified:true},session:{id:'synthetic'}},{headers:{'set-auth-jwt':'fixture.'+A+'.signature'}});assert.equal(url,env.SYNERA_NEON_DATA_URL+'/rpc/synera_send_message');assert.deepEqual(JSON.parse(init.body),{p_meeting_id:meeting,p_intent_id:intent,p_body:'Packaged message'});return Response.json({id:intent,meeting_id:meeting,sender_id:A,body:'Packaged message',created_at:new Date().toISOString()});};
  const response=await worker.default.fetch(new Request(origin+'/api/neon/messages/'+meeting,{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',Cookie:'__Host-synera-session=synthetic'},body:JSON.stringify({intentId:intent,text:'Packaged message'})}),{...env,SYNERA_MESSAGE_INTENTS_READY:'true'});
  assert.equal(response.status,200);assert.equal((await response.json()).id,intent);assert.equal(seen.length,2);
} finally {globalThis.fetch=previous;}
const source_sha256={};
for(const file of ['neon/worker.mjs','neon/message-intent.migration.sql','neon/message-intent-consent.acceptance.sql','web_launch/config.mjs','web_launch/neon-store.mjs','web_launch/real-journey-client.mjs','web_launch/real-journey.mjs','web_launch/message-intent.test.mjs','neon/message-intent.test.mjs','tools/fixtures/message-intent-fixture.mjs','tools/message-intent-browser.mjs','tools/message-intent-sql-acceptance.mjs','tools/message-intent-release-acceptance.mjs',proof+'/browser/chat-390x844.png'])source_sha256[file]=hash(await fs.readFile(file));
const report={status:'PASS_LOCAL_MESSAGE_INTENT_RELEASE_CLOSURE',generated_at:new Date().toISOString(),candidate:dir,files:(await fs.readdir(dir)).length,manifest_rows:release.files.length,release_sha256:hash(await fs.readFile(path.join(dir,'release.json'))),source_sha256,preserved_journey_ui_sha256:preserved,packaged_gateway_synthetic_requests:seen.length,published:false,live_jwt:false,capacity_verified:false,provider_calls:0,provider_usd:0};
await fs.writeFile(path.join(proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,candidate:dir,files:report.files,release_sha256:report.release_sha256,published:false}));
