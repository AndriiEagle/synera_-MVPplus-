// Local release closure. Synthetic transport only; no external provider calls.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {PUBLIC_ASSETS} from '../web_launch/assets.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const outputName='dist-neon-outcomes-api-20261004',directory=path.join(root,'web_launch',outputName);
const artifact=path.join(root,'artifacts/overnight-20261004/CASE_OUTCOME_GATEWAY.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=relative=>fs.readFile(path.join(root,relative));
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),scope:'Local bundled Worker and synthetic Auth/Data API transport; not signed HTTP JWT, deployed feature or physical Android',provider_calls:0,provider_usd:0};
const preserved=['web_launch/journey-ui.mjs','web_launch/dist-neon-real-journey-20261003/release.json'];
const before=Object.fromEntries(await Promise.all(preserved.map(async name=>[name,hash(await read(name))])));
const sourceNames=['neon/worker.mjs','neon/case-outcome.mjs','neon/case-outcome.test.mjs','neon/build.mjs','web_launch/config.mjs',
  'web_launch/pilot-policy.mjs','neon/google-oauth.mjs','neon/meeting-location.mjs','neon/group-room.mjs','web_launch/live-location.mjs','web_launch/assets.mjs','tools/case-outcome-gateway-acceptance.mjs'];
report.source_sha256=Object.fromEntries(await Promise.all(sourceNames.map(async name=>[name,hash(await read(name))])));
try{
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}).trim());
  const acceptedDemo=execFileSync('git',['show','HEAD:web_launch/journey-ui.mjs'],{cwd:root});
  await fs.writeFile(path.join(directory,'journey-ui.mjs'),acceptedDemo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));
  Object.assign(release.files.find(row=>row.name==='journey-ui.mjs'),{bytes:acceptedDemo.length,sha256:hash(acceptedDemo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};
  await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const files=await fs.readdir(directory);
  assert.deepEqual(new Set(files),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  assert.ok(!files.some(name=>/fixture|\.test\.|\.sql$|config\.public|\.env/i.test(name)));
  for(const row of release.files){const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(hash(bytes),row.sha256,row.name);assert.equal(bytes.length,row.bytes,row.name);}
  const worker=(await import(pathToFileURL(path.join(directory,'_worker.js')).href)).default;
  const origin='https://outcome-fixture.pages.dev';
  const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',
    SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:'fixture@example.com',
    SYNERA_PILOT_READY:'true',SYNERA_REAL_JOURNEY_READY:'true'};
  const payload={action:'state',version:3,termsHash:'a'.repeat(64)};
  const request=()=>new Request(origin+'/api/neon/outcomes/pair-case-ab',{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',Cookie:'__Host-synera-session=opaque'},body:JSON.stringify(payload)});
  const savedFetch=globalThis.fetch;const calls=[];
  try{
    globalThis.fetch=async(url,init)=>{
      calls.push({url,init});
      return url.endsWith('/get-session')?Response.json({user:{id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.com',emailVerified:true},session:{id:'s'}},{headers:{'set-auth-jwt':'fixture.identity.signature'}})
        :Response.json({schema:'synera.case-outcome.v1',proof_scope:'participant_attestation',outcome_confirmed:false});
    };
    const publicConfig=await(await worker.fetch(new Request(origin+'/config.json'),env)).json();
    assert.equal(publicConfig.caseOutcomesEnabled,false);
    assert.equal((await worker.fetch(request(),env)).status,503);assert.equal(calls.length,0);report.closed_worker_upstream_calls=0;
    for(const name of ['/case-outcome.migration.sql','/case-outcome.acceptance.sql','/case-outcome.test.mjs','/api/neon/data/match_outcome_events']){
      const response=await worker.fetch(new Request(origin+name,{headers:{Origin:origin,'X-Synera-Client':'1'}}),env);
      assert.equal(response.status,404,name);
    }
    assert.equal(calls.length,0);
    const response=await worker.fetch(request(),{...env,SYNERA_CASE_OUTCOMES_READY:'true'});
    assert.equal(response.status,200);assert.equal((await response.json()).proof_scope,'participant_attestation');assert.equal(calls.length,2);
    assert.equal(calls[1].url,env.SYNERA_NEON_DATA_URL+'/rpc/synera_case_outcome');
    assert.equal(calls[1].init.headers.Authorization,'Bearer fixture.identity.signature');
    assert.deepEqual(JSON.parse(calls[1].init.body),{p_case_id:'pair-case-ab',p_payload:payload});
    report.enabled_worker_synthetic_calls=calls.length;
  }finally{globalThis.fetch=savedFetch;}
  const sql=JSON.parse((await read('artifacts/overnight-20261004/CASE_OUTCOME_SQL.json')).toString('utf8'));
  assert.equal(sql.status,'PASS_LOCAL_SQL_ROLLED_BACK');assert.equal(sql.giver_self_accept_mutation_rejected,true);
  for(const [name,digest] of Object.entries(sql.source_sha256))assert.equal(hash(await read(name)),digest,'Reused SQL proof drift: '+name);
  report.reused_sql='CASE_OUTCOME_SQL.json, exact recorded source hashes still match; no SQL rerun';
  for(const [name,digest] of Object.entries(before))assert.equal(hash(await read(name)),digest,'Preserved source changed: '+name);
  report.preserved_sha256=before;report.directory=directory;report.public_files=files.length;
  report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_BUNDLED_GATEWAY';report.published=false;report.live_accounts='NOT_RUN';report.signed_http_jwt='NOT_RUN';report.physical_android='NOT_RUN';
}catch(error){report.error=error.message;throw error;}
finally{await fs.mkdir(path.dirname(artifact),{recursive:true});await fs.writeFile(artifact,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,files:report.public_files,closed_worker_upstream_calls:report.closed_worker_upstream_calls,enabled_worker_synthetic_calls:report.enabled_worker_synthetic_calls,receipt:artifact}));
