// Read back the accepted local cycle, unchanged dependencies, and release bytes.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/outcome-read';
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
const sources=['web_launch/real-journey.mjs','tools/outcome-read-browser.mjs','tools/outcome-read-acceptance.mjs'];
const preserved=['web_launch/journey-ui.mjs','web_launch/real-journey-client.mjs','web_launch/neon-store.mjs','web_launch/app.mjs',
  'web_launch/meeting-location.mjs','web_launch/real-journey.html','web_launch/real-journey.css','web_launch/atelier.mjs','web_launch/atelier.css',
  'tools/case-outcome-browser-acceptance.mjs','tools/fixtures/case-outcome-fixture.mjs','tools/fixtures/real-journey-fixture.mjs',
  'web_launch/archive-codec.mjs','web_launch/outcome-archive.mjs','web_launch/assets.mjs',
  'web_launch/dist-neon-address-read-20261004/release.json','artifacts/overnight-20261004/address-read/ACCEPTANCE.json'];
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Local outcome read recovery in actual Chromium with synthetic accounts/RPC. No live HTTP JWT, Android, provider activation or deployment.'};
for(const[key,names]of[['source_sha256',sources],['preserved_sha256',preserved]])report[key]=Object.fromEntries(await Promise.all(names.map(async n=>[n,hash(await read(n))])));
const verifyMaps=async receipt=>{for(let layer=receipt;layer;layer=layer.browser)for(const[n,digest]of Object.entries(layer.source_sha256||{}))assert.equal(hash(await read(n)),digest,n);};
try{
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const red=JSON.parse(await read(proof+'/RED.json'));assert.equal(red.status,'RED_CONFIRMED_CHAT_REMOVAL');assert.match(red.browser.error,/Outcome read failure removed accepted private chat/);
  assert.equal(red.source_sha256['web_launch/real-journey.mjs'],hash(execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root})));
  report.red='Current pre-patch controller removed accepted chat on failed optional outcome read; original semantic RED retained.';
  const browser=JSON.parse(await read(proof+'/BROWSER.json'));assert.equal(browser.status,'PASS_LOCAL_OUTCOME_READ_RECOVERY');await verifyMaps(browser);
  assert.equal(browser.browser.external_requests,0);report.browser_checks=Object.keys(browser.browser.checks).length;
  const mutant=JSON.parse(await read(proof+'/MUTATION.json'));assert.equal(mutant.status,'MUTANT_REJECTED_LATE_FAILURE');assert.match(mutant.browser.error,/Late failed read changed logout status/);await verifyMaps(mutant);
  report.mutation='REJECTED: only outcome catch epoch guard removed in served copy; late failure changes logged-out status, canonical controller unchanged.';
  const prior=execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root,encoding:'utf8'}),current=(await read('web_launch/real-journey.mjs')).toString('utf8');
  const outside=s=>{const start=s.indexOf('async function openOutcomes() {'),end=s.indexOf('async function recordOutcome(',start);assert.ok(start>0&&end>start);return s.slice(0,start)+s.slice(end);};
  assert.equal(outside(current),outside(prior));report.unchanged_controller_outside_outcome_read_sha256=hash(Buffer.from(outside(current)));
  for(const name of['CASE_OUTCOME_SQL.json','MEETING_ADDRESS_SQL.json','MEETING_ADDRESS_GATEWAY.json']){
    const receipt=JSON.parse(await read('artifacts/overnight-20261004/'+name));assert.match(receipt.status,/^PASS_LOCAL_/);await verifyMaps(receipt);
  }
  report.reused_proof='Exact unchanged outcome/address SQL and current gateway dependency maps, including existing outcome API tests. Client/store unchanged; prior controller-bound address/navigation/export/social browser proofs remain historical and are not counted as fresh checks.';
  const outputName='dist-neon-outcome-read-20261004';report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const directory=path.join(root,'web_launch',outputName),demo=execFileSync('git',['show',report.base_commit+':web_launch/journey-ui.mjs'],{cwd:root});await fs.writeFile(path.join(directory,'journey-ui.mjs'),demo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));Object.assign(release.files.find(r=>r.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const names=await fs.readdir(directory);assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  for(const row of release.files){const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
  for(const name of['real-journey.mjs','real-journey-client.mjs','app.mjs','meeting-location.mjs','neon-store.mjs'])assert.deepEqual(await fs.readFile(path.join(directory,name)),await read('web_launch/'+name));
  assert.deepEqual(await fs.readFile(path.join(directory,'_worker.js')),await read('web_launch/dist-neon-address-read-20261004/_worker.js'));
  for(const[n,digest]of Object.entries({...report.source_sha256,...report.preserved_sha256}))assert.equal(hash(await read(n)),digest,n);
  report.screenshot_sha256=Object.fromEntries(await Promise.all(['read-recovered-390x844.png','outcome-current-390x844.png','outcome-confirmed-panel.png','outcome-atelier-390x844.png'].map(async n=>[n,hash(await read(proof+'/'+n))])));
  report.public_files=names.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_OUTCOME_READ_RECOVERY_CLOSURE';report.published=false;report.live_accounts=report.signed_http_jwt=report.physical_android=report.google_maps='NOT_RUN';
}catch(error){report.error=error.message;throw error;}
finally{await fs.writeFile(path.join(root,proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,browser:report.browser_checks,files:report.public_files,release_sha256:report.release_sha256}));
