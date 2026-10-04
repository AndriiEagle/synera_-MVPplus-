// Accept only the private deterministic draft and its recovery/privacy boundary.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/social-recovery';
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
const sources=['web_launch/real-journey.mjs','tools/social-draft-recovery-browser.mjs','tools/social-draft-recovery-acceptance.mjs'];
const preserved=['web_launch/journey-ui.mjs','web_launch/real-journey-client.mjs','web_launch/neon-store.mjs','web_launch/app.mjs',
  'web_launch/meeting-location.mjs','web_launch/real-journey.html','web_launch/real-journey.css','web_launch/atelier.mjs','web_launch/atelier.css',
  'tools/case-social-draft-browser.mjs','tools/fixtures/case-outcome-fixture.mjs','tools/fixtures/real-journey-fixture.mjs',
  'web_launch/session-value.mjs','web_launch/case-social-draft.test.mjs','web_launch/assets.mjs',
  'web_launch/dist-neon-export-recovery-20261004/release.json','artifacts/overnight-20261004/export-recovery/ACCEPTANCE.json'];
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual Chromium private social draft recovery with seeded synthetic accounts/RPC. No live JWT, SQL execution, Android, provider activation or publication.'};
for(const[key,names]of[['source_sha256',sources],['preserved_sha256',preserved]])report[key]=Object.fromEntries(await Promise.all(names.map(async n=>[n,hash(await read(n))])));
const verifyMaps=async receipt=>{for(let layer=receipt;layer;layer=layer.browser)for(const[n,digest]of Object.entries(layer.source_sha256||{}))assert.equal(hash(await read(n)),digest,n);};
try{
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const red=JSON.parse(await read(proof+'/RED.json'));assert.equal(red.status,'RED_CONFIRMED_DRAFT_CHAT_REMOVAL');assert.match(red.browser.error,/Draft failure removed accepted private chat/);
  assert.equal(red.source_sha256['web_launch/real-journey.mjs'],hash(execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root})));
  report.red='Pre-patch optional draft failure removed accepted chat; actual semantic RED retained.';
  const browser=JSON.parse(await read(proof+'/BROWSER.json'));assert.equal(browser.status,'PASS_LOCAL_PRIVATE_SOCIAL_RECOVERY');await verifyMaps(browser);
  assert.equal(browser.browser.external_requests,0);assert.equal(browser.browser.no_private_storage,true);report.browser_check_groups=browser.browser.checks.length;
  const mutant=JSON.parse(await read(proof+'/MUTATION.json'));assert.equal(mutant.status,'MUTANT_REJECTED_LATE_DRAFT_FAILURE');assert.match(mutant.browser.error,/Late failed draft changed consent state/);await verifyMaps(mutant);
  report.mutation='REJECTED: only catch generation/checkbox guard removed in served copy. Delayed failure changes consent-revoked state; canonical controller unchanged.';
  const prior=execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root,encoding:'utf8'}),current=(await read('web_launch/real-journey.mjs')).toString('utf8');
  const outside=s=>{const start=s.indexOf('async function createOutcomeSocialDraft() {'),end=s.indexOf('function renderReview(',start);assert.ok(start>0&&end>start);return s.slice(0,start)+s.slice(end);};
  assert.equal(outside(current),outside(prior));report.unchanged_controller_outside_social_draft_sha256=hash(Buffer.from(outside(current)));
  const args=['--test','--test-reporter=tap','--test-name-pattern=withdrawn approval|logout and same-account restore','web_launch/case-social-draft.test.mjs'];
  const output=execFileSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:30000});assert.match(output,/# pass 2\b/);assert.match(output,/# fail 0\b/);
  report.selected_unit_tests={args,pass:2,fail:0,output};
  for(const name of['CASE_OUTCOME_SQL.json','MEETING_ADDRESS_SQL.json','MEETING_ADDRESS_GATEWAY.json']){const receipt=JSON.parse(await read('artifacts/overnight-20261004/'+name));assert.match(receipt.status,/^PASS_LOCAL_/);await verifyMaps(receipt);}
  report.reused_proof='Exact unchanged SQL/current gateway maps reused. Client/store/social template unchanged; only two selected revision/expiry/session tests rerun. Prior controller-bound browser proofs remain historical, not counted as current.';
  const outputName='dist-neon-social-recovery-20261004';report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const directory=path.join(root,'web_launch',outputName),demo=execFileSync('git',['show',report.base_commit+':web_launch/journey-ui.mjs'],{cwd:root});await fs.writeFile(path.join(directory,'journey-ui.mjs'),demo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));Object.assign(release.files.find(r=>r.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const names=await fs.readdir(directory);assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  for(const row of release.files){const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
  for(const name of['real-journey.mjs','real-journey-client.mjs','session-value.mjs','app.mjs','neon-store.mjs'])assert.deepEqual(await fs.readFile(path.join(directory,name)),await read('web_launch/'+name));
  assert.deepEqual(await fs.readFile(path.join(directory,'_worker.js')),await read('web_launch/dist-neon-export-recovery-20261004/_worker.js'));
  for(const[n,digest]of Object.entries({...report.source_sha256,...report.preserved_sha256}))assert.equal(hash(await read(n)),digest,n);
  report.screenshot_sha256={'case-social-draft-390x844.png':hash(await read(proof+'/case-social-draft-390x844.png'))};
  report.public_files=names.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_PRIVATE_SOCIAL_RECOVERY_CLOSURE';report.published=false;report.live_accounts=report.signed_http_jwt=report.physical_android=report.oauth='NOT_RUN';
}catch(error){report.error=error.message;throw error;}
finally{await fs.writeFile(path.join(root,proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,browser_groups:report.browser_check_groups,unit_tests:report.selected_unit_tests?.pass,files:report.public_files,release_sha256:report.release_sha256}));
