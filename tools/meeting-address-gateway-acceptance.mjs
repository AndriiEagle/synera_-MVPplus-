// Local release acceptance, no provider requests or changes to prior candidates.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {PUBLIC_ASSETS} from '../web_launch/assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const outputName='dist-neon-address-api-20261004',directory=path.join(root,'web_launch',outputName);
const artifact=path.join(root,'artifacts/overnight-20261004/MEETING_ADDRESS_GATEWAY.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=relative=>fs.readFile(path.join(root,relative));
const preserved=['web_launch/journey-ui.mjs','web_launch/real-journey-client.mjs','web_launch/real-journey.mjs','neon/case-outcome.mjs',
  'neon/meeting-location.mjs','neon/group-room.mjs','web_launch/assets.mjs',
  'web_launch/dist-neon-outcomes-api-20261004/release.json','web_launch/dist-neon-outcomes-ui-20261004/release.json',
  'web_launch/dist-neon-outcomes-export-20261004/release.json','web_launch/dist-neon-outcomes-viewer-20261004/release.json','web_launch/dist-neon-outcomes-social-20261004/release.json'];
const before=Object.fromEntries(await Promise.all(preserved.map(async p=>[p,hash(await read(p))])));
const sourceNames=['neon/worker.mjs','neon/meeting-address.mjs','neon/meeting-address.test.mjs','neon/build.mjs','web_launch/config.mjs',
  'web_launch/pilot-policy.mjs','neon/google-oauth.mjs','neon/meeting-location.mjs','neon/group-room.mjs','neon/case-outcome.mjs',
  'web_launch/live-location.mjs','web_launch/assets.mjs','tools/meeting-address-gateway-acceptance.mjs'];
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),scope:'Local bundled Worker and synthetic Auth/Data API transport, not signed HTTP JWT/live accounts/production/physical Android',provider_calls:0,provider_usd:0,
  source_sha256:Object.fromEntries(await Promise.all(sourceNames.map(async p=>[p,hash(await read(p))]))),preserved_sha256:before};
try{
  const command=['--test','--test-reporter=tap','neon/meeting-address.test.mjs','neon/case-outcome.test.mjs','neon/meeting-location.test.mjs','neon/worker.test.mjs','neon/group-room.test.mjs'];
  const tests=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',timeout:30000});
  report.tests={command,exit_code:tests.status,stdout:tests.stdout,stderr:tests.stderr,error:tests.error?.message??null};
  assert.equal(tests.status,0,tests.stdout+'\n'+tests.stderr);assert.match(tests.stdout,/# fail 0/);assert.match(tests.stdout,/# skipped 0/);
  report.tests.count=Number(tests.stdout.match(/# tests (\d+)/)?.[1]);assert.ok(report.tests.count>=42);
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const acceptedDemo=execFileSync('git',['show','HEAD:web_launch/journey-ui.mjs'],{cwd:root});
  await fs.writeFile(path.join(directory,'journey-ui.mjs'),acceptedDemo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));
  Object.assign(release.files.find(row=>row.name==='journey-ui.mjs'),{bytes:acceptedDemo.length,sha256:hash(acceptedDemo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};
  await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const files=await fs.readdir(directory);
  assert.deepEqual(new Set(files),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  assert.ok(!files.some(p=>/fixture|\.test\.|\.sql$|config\.public|\.env/i.test(p)));
  for(const row of release.files){const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(hash(bytes),row.sha256,row.name);assert.equal(bytes.length,row.bytes,row.name);}
  const worker=(await import(pathToFileURL(path.join(directory,'_worker.js')).href)).default;
  const origin='https://address-fixture.pages.dev',meeting='44444444-4444-4444-8444-444444444444',caseId='case-address-ab';
  const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
    SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:'fixture@example.com',SYNERA_PILOT_READY:'true',SYNERA_REAL_JOURNEY_READY:'true'};
  const reviewed={action:'state',version:1,termsHash:'a'.repeat(64)};
  const request=(body=reviewed,route='/meeting-address/'+meeting+'/'+caseId)=>new Request(origin+'/api/neon'+route,{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',Cookie:'__Host-synera-session=opaque',Authorization:'Bearer forged-caller'},body:JSON.stringify(body)});
  const savedFetch=globalThis.fetch,calls=[];
  try{
    globalThis.fetch=async(url,init)=>{calls.push({url,init});return url.endsWith('/get-session')?Response.json({user:{id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.com',emailVerified:true},session:{id:'s'}},{headers:{'set-auth-jwt':'fixture.identity.signature'}})
      :Response.json({schema:'synera.meeting-address.v1',agreed:false,events:[]});};
    const config=await(await worker.fetch(new Request(origin+'/config.json'),env)).json();
    assert.equal(config.meetingAddressEnabled,false);assert.equal(config.caseOutcomesEnabled,false);assert.equal(config.liveLocationEnabled,false);
    assert.equal((await worker.fetch(request(),env)).status,503);assert.equal(calls.length,0);report.closed_worker_upstream_calls=0;
    for(const p of ['/meeting-address.mjs','/meeting-address.test.mjs','/meeting-address-agreement.migration.sql','/meeting-address-agreement.acceptance.sql','/release.json','/api/neon/data/meeting_address_events']){
      assert.equal((await worker.fetch(new Request(origin+p,{headers:{Origin:origin,'X-Synera-Client':'1'}}),env)).status,404,p);
    }
    assert.equal(calls.length,0);
    const enabled={...env,SYNERA_MEETING_ADDRESS_READY:'true'};
    const enabledConfig=await(await worker.fetch(new Request(origin+'/config.json'),enabled)).json();assert.equal(enabledConfig.meetingAddressEnabled,true);
    const response=await worker.fetch(request(),enabled);assert.equal(response.status,200);assert.equal((await response.json()).agreed,false);
    assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Permissions-Policy'),'camera=(), microphone=(), geolocation=()');
    assert.equal(calls.length,2);assert.equal(calls[1].url,env.SYNERA_NEON_DATA_URL+'/rpc/synera_meeting_address');
    assert.equal(calls[1].init.headers.Authorization,'Bearer fixture.identity.signature');assert.deepEqual(JSON.parse(calls[1].init.body),{p_meeting_id:meeting,p_case_id:caseId,p_payload:reviewed});
    const malformed=await worker.fetch(request({...reviewed,actor_id:'other'}),enabled);assert.equal(malformed.status,400);assert.equal(calls.length,2);
    for(const route of ['/outcomes/'+caseId,'/rooms/list'])assert.equal((await worker.fetch(request({},route),enabled)).status,503);
    assert.equal(calls.length,2);report.enabled_worker_synthetic_calls=calls.length;
  }finally{globalThis.fetch=savedFetch;}
  const sql=JSON.parse((await read('artifacts/overnight-20261004/MEETING_ADDRESS_SQL.json')).toString('utf8'));
  assert.equal(sql.status,'PASS_LOCAL_MEETING_ADDRESS_SQL');assert.equal(sql.self_accept_mutation_rejected,true);
  for(const [p,h] of Object.entries(sql.source_sha256))assert.equal(hash(await read(p)),h,'Reused SQL proof drift: '+p);
  report.reused_sql='MEETING_ADDRESS_SQL.json, exact recorded source hashes match; PG not restarted';
  for(const [p,h] of Object.entries(before))assert.equal(hash(await read(p)),h,'Preserved source changed: '+p);
  report.public_files=files.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_MEETING_ADDRESS_GATEWAY';report.published=false;report.signed_http_jwt='NOT_RUN';report.live_accounts='NOT_RUN';report.physical_android='NOT_RUN';
}catch(error){report.error=error.message;throw error;}
finally{await fs.mkdir(path.dirname(artifact),{recursive:true});await fs.writeFile(artifact,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,tests:report.tests.count,files:report.public_files,closed_worker_calls:report.closed_worker_upstream_calls,enabled_worker_synthetic_calls:report.enabled_worker_synthetic_calls,receipt:artifact}));
