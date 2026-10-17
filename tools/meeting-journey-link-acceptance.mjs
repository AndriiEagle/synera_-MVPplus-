// One selected-meeting bridge; reuse exact unchanged SQL/API and unit evidence.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004/journey-link';
const read = n => fs.readFile(path.join(root, n)), hash = b => createHash('sha256').update(b).digest('hex');
const sources = ['web_launch/meeting-location.mjs','web_launch/real-journey.mjs','tools/meeting-journey-link-browser.mjs','tools/meeting-journey-link-acceptance.mjs'];
const preserved = ['web_launch/journey-ui.mjs','web_launch/app.mjs','web_launch/neon-store.mjs','web_launch/real-journey-client.mjs',
  'web_launch/real-journey.html','web_launch/real-journey.css','web_launch/assets.mjs','web_launch/live-location.mjs',
  'web_launch/atelier.mjs','web_launch/atelier.css','tools/meeting-address-browser.mjs','tools/fixtures/real-journey-fixture.mjs',
  'tools/meeting-address-navigation-browser.mjs','tools/meeting-location-agreement-browser.mjs','tools/location-browser-acceptance.mjs',
  'web_launch/dist-neon-location-agreement-20261004/release.json','artifacts/overnight-20261004/location-agreement/ACCEPTANCE.json'];
const report = { status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),provider_calls:0,provider_usd:0,
  scope:'Actual local Chromium bridge, synthetic two-account transport; not HTTP JWT, real users, Maps service, deployment or physical Android' };
for (const [key,names] of [['source_sha256',sources],['preserved_sha256',preserved]]) report[key] = Object.fromEntries(await Promise.all(names.map(async n=>[n,hash(await read(n))])));
const verifyMaps = async receipt => { for (const map of [receipt.source_sha256,receipt.browser?.source_sha256].filter(Boolean)) for (const [n,digest] of Object.entries(map)) assert.equal(hash(await read(n)),digest,n); };
try {
  report.base_commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const red=JSON.parse(await read(proof+'/RED.json')); assert.match(red.browser.error,/Selected GPS link did not open the conversation/);
  for (const n of ['web_launch/meeting-location.mjs','web_launch/real-journey.mjs']) assert.equal(red.source_sha256[n],hash(execFileSync('git',['show',report.base_commit+':'+n],{cwd:root})),n);
  const mutation=JSON.parse(await read(proof+'/MUTATION.json')); assert.match(mutation.browser.error,/Rejected hint started an extra conversation lookup/);
  await verifyMaps(mutation); report.mutation='REJECTED: removing only hint acceptance/ownership guard starts a second lookup for cancelled meeting; downstream client still rejects';
  const bridge=JSON.parse(await read(proof+'/BROWSER.json')); assert.equal(bridge.status,'PASS_LOCAL_MEETING_JOURNEY_LINK'); await verifyMaps(bridge);
  assert.equal(bridge.browser.external_requests,0); report.bridge_checks=Object.keys(bridge.browser.checks).length;
  // Both affected UI consumers rerun in new folders; old proofs and tools stay intact.
  for (const [label,tool,oldProof,file,status] of [
    ['navigation','tools/meeting-address-navigation-browser.mjs','artifacts/overnight-20261004/address-navigation','NAVIGATION_BROWSER.json','PASS_LOCAL_MEETING_ADDRESS_NAVIGATION'],
    ['gps','tools/meeting-location-agreement-browser.mjs','artifacts/overnight-20261004/location-agreement','BROWSER.json','PASS_LOCAL_LEGACY_LOCATION_AGREEMENT'],
  ]) {
    const newProof=proof+'/'+label+'-regression';
    const original=(await read(tool)).toString('utf8'), adapted=original.replace("fileURLToPath(new URL('../', import.meta.url))",JSON.stringify(root)).replace("'"+oldProof+"'",JSON.stringify(newProof));
    assert.notEqual(adapted,original); const runner=path.join(root,proof,label+'-regression-runner.mjs'); await fs.writeFile(runner,adapted);
    const result=spawnSync(process.execPath,[runner],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:1024*1024}); assert.equal(result.status,0,result.stdout+result.stderr);
    const receipt=JSON.parse(await read(newProof+'/'+file)); assert.equal(receipt.status,status); await verifyMaps(receipt); assert.equal(receipt.browser.external_requests,0);
    if (label==='navigation') assert.equal(receipt.browser.google_requests_transmitted,0);
    report[label+'_checks']=label==='navigation'?Object.keys(receipt.browser.checks).length:receipt.browser.checks.length+receipt.browser.extra_checks.length;
    report[label+'_runner_sha256']=hash(Buffer.from(adapted));
  }
  for (const name of ['MEETING_ADDRESS_SQL.json','MEETING_ADDRESS_GATEWAY.json']) { const receipt=JSON.parse(await read('artifacts/overnight-20261004/'+name)); assert.match(receipt.status,/^PASS_LOCAL_/); await verifyMaps(receipt); }
  report.reused_proof='Exact SQL/API source maps. Store/client code and unit dependency suite unchanged; prior 41 tests historical, not rerun. Address/chat, navigation and GPS UI rerun after controller/component changes.';
  const outputName='dist-neon-journey-link-20261004';
  report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const directory=path.join(root,'web_launch',outputName), demo=execFileSync('git',['show',report.base_commit+':web_launch/journey-ui.mjs'],{cwd:root});
  await fs.writeFile(path.join(directory,'journey-ui.mjs'),demo); const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));
  Object.assign(release.files.find(row=>row.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};
  await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const names=await fs.readdir(directory); assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  for (const row of release.files) {const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
  for (const name of ['app.mjs','meeting-location.mjs','neon-store.mjs','real-journey.mjs']) assert.deepEqual(await fs.readFile(path.join(directory,name)),await read('web_launch/'+name));
  assert.deepEqual(await fs.readFile(path.join(directory,'_worker.js')),await read('web_launch/dist-neon-location-agreement-20261004/_worker.js'));
  for (const [n,digest] of Object.entries({...report.source_sha256,...report.preserved_sha256})) assert.equal(hash(await read(n)),digest,n);
  report.screenshot_sha256=Object.fromEntries(await Promise.all(['selected-conversation-390x844.png','meeting-address-current-390x844.png','meeting-address-atelier-390x844.png'].map(async n=>[n,hash(await read(proof+'/'+n))])));
  report.public_files=names.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_MEETING_JOURNEY_LINK_CLOSURE';report.published=false;report.live_accounts=report.signed_http_jwt=report.physical_android=report.google_maps='NOT_RUN';
} catch(error) {report.error=error.message;throw error;}
finally {await fs.writeFile(path.join(root,proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,bridge:report.bridge_checks,navigation:report.navigation_checks,gps:report.gps_checks,files:report.public_files,release_sha256:report.release_sha256}));
