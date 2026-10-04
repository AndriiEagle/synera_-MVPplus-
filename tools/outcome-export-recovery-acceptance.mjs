// Accept actual private downloads, precise failure recovery, and release bytes.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/export-recovery';
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
const sources=['web_launch/real-journey.mjs','tools/outcome-export-recovery-browser.mjs','tools/outcome-export-recovery-acceptance.mjs'];
const preserved=['web_launch/journey-ui.mjs','web_launch/real-journey-client.mjs','web_launch/neon-store.mjs','web_launch/app.mjs',
  'web_launch/meeting-location.mjs','web_launch/real-journey.html','web_launch/real-journey.css','web_launch/atelier.mjs','web_launch/atelier.css',
  'tools/case-outcome-export-browser.mjs','tools/fixtures/case-outcome-fixture.mjs','tools/fixtures/real-journey-fixture.mjs',
  'web_launch/archive-codec.mjs','web_launch/case-outcome-export.test.mjs','web_launch/outcome-archive.mjs','web_launch/assets.mjs',
  'web_launch/dist-neon-outcome-read-20261004/release.json','artifacts/overnight-20261004/outcome-read/ACCEPTANCE.json'];
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual local Chromium downloads against seeded synthetic participants/RPC. No live JWT, SQL execution, Android, provider activation or deployment.'};
for(const[key,names]of[['source_sha256',sources],['preserved_sha256',preserved]])report[key]=Object.fromEntries(await Promise.all(names.map(async n=>[n,hash(await read(n))])));
const verifyMaps=async receipt=>{for(let layer=receipt;layer;layer=layer.browser)for(const[n,digest]of Object.entries(layer.source_sha256||{}))assert.equal(hash(await read(n)),digest,n);};
try{
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const red=JSON.parse(await read(proof+'/RED.json'));assert.equal(red.status,'RED_CONFIRMED_EXPORT_CHAT_REMOVAL');assert.match(red.browser.error,/Export failure removed accepted private chat/);
  assert.equal(red.source_sha256['web_launch/real-journey.mjs'],hash(execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root})));
  report.red='Pre-patch optional export failure removed accepted chat; actual semantic RED retained.';
  const browser=JSON.parse(await read(proof+'/BROWSER.json'));assert.equal(browser.status,'PASS_LOCAL_PRIVATE_EXPORT_RECOVERY');await verifyMaps(browser);
  assert.equal(browser.browser.external_requests,0);assert.equal(browser.browser.logout_cancels_pending_download,true);assert.equal(browser.browser.explicit_plain_and_gzip_downloads,true);
  report.recovery_check_groups=Object.keys(browser.browser.checks).length;
  report.downloads=browser.browser.downloads;assert.equal(report.downloads.length,7);
  for(const file of report.downloads){const bytes=await read(file.file);assert.equal(hash(bytes),file.sha256,file.file);assert.equal(bytes.length,file.file_bytes);}
  const mutant=JSON.parse(await read(proof+'/MUTATION.json'));assert.equal(mutant.status,'MUTANT_REJECTED_LATE_EXPORT_FAILURE');assert.match(mutant.browser.error,/Late failed export changed logout status/);await verifyMaps(mutant);
  for(const file of mutant.browser.downloads)assert.equal(hash(await read(file.file)),file.sha256,file.file);
  report.mutation='REJECTED: only export catch continuation guard removed in served copy. Mutant downloads isolated from accepted files; canonical controller unchanged.';
  const prior=execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root,encoding:'utf8'}),current=(await read('web_launch/real-journey.mjs')).toString('utf8');
  const outside=s=>{const start=s.indexOf('async function exportOutcome() {'),end=s.indexOf('async function createOutcomeSocialDraft()',start);assert.ok(start>0&&end>start);return s.slice(0,start)+s.slice(end);};
  assert.equal(outside(current),outside(prior));report.unchanged_controller_outside_export_sha256=hash(Buffer.from(outside(current)));
  const args=['--test','--test-reporter=tap','--test-name-pattern=during compression','web_launch/case-outcome-export.test.mjs'];
  const output=execFileSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/# pass 2\b/);assert.match(output,/# fail 0\b/);
  report.compression_tests={args,pass:2,fail:0,output};
  for(const name of['CASE_OUTCOME_SQL.json','MEETING_ADDRESS_SQL.json','MEETING_ADDRESS_GATEWAY.json']){const receipt=JSON.parse(await read('artifacts/overnight-20261004/'+name));assert.match(receipt.status,/^PASS_LOCAL_/);await verifyMaps(receipt);}
  report.reused_proof='Exact unchanged SQL/current gateway dependency maps reused. Client/store/codec unchanged; only two selected compression privacy tests rerun. Prior controller-bound browser proofs remain historical, not counted as current.';
  const outputName='dist-neon-export-recovery-20261004';report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const directory=path.join(root,'web_launch',outputName),demo=execFileSync('git',['show',report.base_commit+':web_launch/journey-ui.mjs'],{cwd:root});await fs.writeFile(path.join(directory,'journey-ui.mjs'),demo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));Object.assign(release.files.find(r=>r.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const names=await fs.readdir(directory);assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  for(const row of release.files){const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
  for(const name of['real-journey.mjs','real-journey-client.mjs','archive-codec.mjs','app.mjs','neon-store.mjs'])assert.deepEqual(await fs.readFile(path.join(directory,name)),await read('web_launch/'+name));
  assert.deepEqual(await fs.readFile(path.join(directory,'_worker.js')),await read('web_launch/dist-neon-outcome-read-20261004/_worker.js'));
  for(const[n,digest]of Object.entries({...report.source_sha256,...report.preserved_sha256}))assert.equal(hash(await read(n)),digest,n);
  report.screenshot_sha256={'outcome-export-390x844.png':hash(await read(proof+'/outcome-export-390x844.png'))};
  report.public_files=names.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_PRIVATE_EXPORT_RECOVERY_CLOSURE';report.published=false;report.live_accounts=report.signed_http_jwt=report.physical_android='NOT_RUN';
}catch(error){report.error=error.message;throw error;}
finally{await fs.writeFile(path.join(root,proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,recovery_groups:report.recovery_check_groups,downloads:report.downloads?.length,compression_tests:report.compression_tests?.pass,files:report.public_files,release_sha256:report.release_sha256}));
