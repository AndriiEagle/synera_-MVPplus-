// Acceptance for one optional read surface, not live-product certification.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),proof='artifacts/overnight-20261004/address-read';
const read=n=>fs.readFile(path.join(root,n)),hash=b=>createHash('sha256').update(b).digest('hex');
const sources=['web_launch/real-journey.mjs','tools/meeting-address-read-browser.mjs','tools/meeting-address-read-acceptance.mjs'];
const preserved=['web_launch/journey-ui.mjs','web_launch/app.mjs','web_launch/neon-store.mjs','web_launch/real-journey-client.mjs',
  'web_launch/meeting-location.mjs','web_launch/real-journey.html','web_launch/real-journey.css','web_launch/assets.mjs','web_launch/live-location.mjs',
  'web_launch/atelier.mjs','web_launch/atelier.css','tools/meeting-address-browser.mjs','tools/fixtures/real-journey-fixture.mjs',
  'tools/meeting-address-navigation-browser.mjs','tools/meeting-journey-link-browser.mjs','tools/meeting-location-agreement-browser.mjs',
  'web_launch/dist-neon-journey-link-20261004/release.json','artifacts/overnight-20261004/journey-link/ACCEPTANCE.json'];
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Local Chromium read-error/recovery and navigation; synthetic accounts/RPC. No live HTTP JWT, Android, providers or deployment.'};
for(const[key,names]of[['source_sha256',sources],['preserved_sha256',preserved]])report[key]=Object.fromEntries(await Promise.all(names.map(async n=>[n,hash(await read(n))])));
const verifyMaps=async receipt=>{for(let layer=receipt;layer;layer=layer.browser)for(const[n,digest]of Object.entries(layer.source_sha256||{}))assert.equal(hash(await read(n)),digest,n);};
try{
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const originalRed=JSON.parse(await read(proof+'/BASE_RED.json'));assert.match(originalRed.browser.browser.error,/Address read failure removed accepted private chat/);
  assert.equal(originalRed.source_sha256['web_launch/real-journey.mjs'],hash(execFileSync('git',['show',report.base_commit+':web_launch/real-journey.mjs'],{cwd:root})));
  const recoveryRed=JSON.parse(await read(proof+'/RED.json'));assert.match(recoveryRed.browser.browser.error,/Successful manual read left failed state visible/);
  report.red=['Accepted chat lost after address RPC failure before patch','Successful read kept stale error text before bounded review fix'];
  const mutation=JSON.parse(await read(proof+'/MUTATION.json'));assert.match(mutation.browser.browser.error,/Late failed read changed logout status/);await verifyMaps(mutation);
  report.mutation='REJECTED: only catch continuation guard removed; delayed failure overwrites logged-out state, canonical files unchanged';
  const browser=JSON.parse(await read(proof+'/BROWSER.json'));assert.equal(browser.status,'PASS_LOCAL_ADDRESS_READ_RECOVERY');await verifyMaps(browser);
  assert.equal(browser.browser.browser.external_requests,0);report.browser_checks=Object.keys(browser.browser.browser.checks).length;
  // The navigation surface shares the controller; rerun its existing semantic
  // oracle without modifying its runner or old evidence.
  const original=(await read('tools/meeting-address-navigation-browser.mjs')).toString('utf8'),newProof=proof+'/navigation-regression';
  const adapted=original.replace("fileURLToPath(new URL('../', import.meta.url))",JSON.stringify(root)).replace("'artifacts/overnight-20261004/address-navigation'",JSON.stringify(newProof));
  assert.notEqual(adapted,original);const runner=path.join(root,proof,'navigation-regression-wrapper.mjs');await fs.writeFile(runner,adapted);
  const result=spawnSync(process.execPath,[runner],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024});assert.equal(result.status,0,result.stdout+result.stderr);
  const navigation=JSON.parse(await read(newProof+'/NAVIGATION_BROWSER.json'));assert.equal(navigation.status,'PASS_LOCAL_MEETING_ADDRESS_NAVIGATION');await verifyMaps(navigation);
  report.navigation_checks=Object.keys(navigation.browser.checks).length;assert.equal(navigation.browser.external_requests,0);assert.equal(navigation.browser.google_requests_transmitted,0);
  report.navigation_wrapper_sha256=hash(Buffer.from(adapted));
  const gps=JSON.parse(await read('artifacts/overnight-20261004/journey-link/gps-regression/BROWSER.json'));assert.equal(gps.status,'PASS_LOCAL_LEGACY_LOCATION_AGREEMENT');await verifyMaps(gps);
  report.gps_checks_reused=gps.browser.checks.length+gps.browser.extra_checks.length;
  for(const name of['MEETING_ADDRESS_SQL.json','MEETING_ADDRESS_GATEWAY.json']){const receipt=JSON.parse(await read('artifacts/overnight-20261004/'+name));assert.match(receipt.status,/^PASS_LOCAL_/);await verifyMaps(receipt);}
  report.reused_proof='Exact SQL/API and legacy GPS maps unchanged. Client/store and historical 41 units not changed or rerun. Address/chat/bridge 24 and navigation 21 rerun; prior controller-bound UI proofs remain historical.';
  const outputName='dist-neon-address-read-20261004';report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const directory=path.join(root,'web_launch',outputName),demo=execFileSync('git',['show',report.base_commit+':web_launch/journey-ui.mjs'],{cwd:root});await fs.writeFile(path.join(directory,'journey-ui.mjs'),demo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));Object.assign(release.files.find(r=>r.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const names=await fs.readdir(directory);assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  for(const row of release.files){const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
  for(const name of['app.mjs','meeting-location.mjs','neon-store.mjs','real-journey.mjs'])assert.deepEqual(await fs.readFile(path.join(directory,name)),await read('web_launch/'+name));
  assert.deepEqual(await fs.readFile(path.join(directory,'_worker.js')),await read('web_launch/dist-neon-journey-link-20261004/_worker.js'));
  for(const[n,digest]of Object.entries({...report.source_sha256,...report.preserved_sha256}))assert.equal(hash(await read(n)),digest,n);
  report.screenshot_sha256=Object.fromEntries(await Promise.all(['read-recovered-390x844.png','selected-conversation-390x844.png','meeting-address-current-390x844.png','meeting-address-atelier-390x844.png'].map(async n=>[n,hash(await read(proof+'/'+n))])));
  report.public_files=names.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_ADDRESS_READ_RECOVERY_CLOSURE';report.published=false;report.live_accounts=report.signed_http_jwt=report.physical_android=report.google_maps='NOT_RUN';
}catch(error){report.error=error.message;throw error;}
finally{await fs.writeFile(path.join(root,proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,browser:report.browser_checks,navigation:report.navigation_checks,gps_reused:report.gps_checks_reused,files:report.public_files,release_sha256:report.release_sha256}));
