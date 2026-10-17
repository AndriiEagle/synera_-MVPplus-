// Local closure for the legacy GPS consumer under bilateral address readiness.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), proof = 'artifacts/overnight-20261004/location-agreement';
const read = n => fs.readFile(path.join(root, n)), hash = b => createHash('sha256').update(b).digest('hex');
const tests = ['web_launch/meeting-location-agreement.test.mjs', 'web_launch/meeting-address-client.test.mjs', 'web_launch/case-outcome-client.test.mjs',
  'web_launch/real-journey-client.test.mjs', 'web_launch/neon-store.test.mjs', 'web_launch/location-session.test.mjs'];
const sources = ['web_launch/app.mjs','web_launch/meeting-location.mjs','web_launch/neon-store.mjs', ...tests,
  'tools/meeting-location-agreement-browser.mjs','tools/meeting-location-agreement-acceptance.mjs'];
const preserved = ['web_launch/journey-ui.mjs','web_launch/real-journey.mjs','web_launch/real-journey.html','web_launch/real-journey-client.mjs',
  'web_launch/profile-store.mjs','web_launch/location-session.mjs','web_launch/live-location.mjs','web_launch/assets.mjs','web_launch/atelier.mjs','web_launch/atelier.css',
  'tools/location-browser-acceptance.mjs','tools/meeting-address-navigation-browser.mjs','web_launch/dist-neon-address-navigation-20261004/release.json',
  'artifacts/overnight-20261004/address-navigation/NAVIGATION_ACCEPTANCE.json'];
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), provider_calls: 0, provider_usd: 0,
  scope: 'Local consumer gating, actual Chromium with synthetic sessions/RPC/GPS; no providers, live accounts, HTTP JWT, production or Android hardware' };
const run = args => spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 2 * 1024 * 1024 });
for (const [key,names] of [['source_sha256',sources],['preserved_sha256',preserved]]) report[key] = Object.fromEntries(await Promise.all(names.map(async n => [n,hash(await read(n))])));
try {
  report.base_commit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const red = JSON.parse(await read(proof + '/RED.json')); assert.match(red.browser.error,/Bilateral mode still exposes unilateral address editor/);
  const mutation = JSON.parse(await read(proof + '/MUTATION.json')); assert.match(mutation.browser.error,/Bilateral mode still exposes unilateral address editor/);
  for (const n of ['web_launch/app.mjs','web_launch/meeting-location.mjs','web_launch/neon-store.mjs']) assert.equal(mutation.source_sha256[n], report.source_sha256[n]);
  report.consumer_mutation_rejected = true;
  const unit = run(['--test','--test-reporter=tap',...tests]);
  report.unit = {command:['node','--test','--test-reporter=tap',...tests],exit_code:unit.status,output:unit.stdout+unit.stderr};
  assert.equal(unit.status,0,report.unit.output); assert.match(unit.stdout,/^# fail 0$/m); assert.match(unit.stdout,/^# skipped 0$/m);
  report.unit_tests = Number(unit.stdout.match(/^# tests (\d+)$/m)[1]);
  // Final semantic oracle against the reintroduced direct-write defect.
  const name='web_launch/neon-store.mjs', guard='    if (this.meetingAddressEnabled) throw new ServiceError(409);';
  const original=(await read(name)).toString('utf8'); assert.equal(original.split(guard).length,2);
  const mutant=original.replace(guard,'').replace(/from (['"])(\.[^'"]+)\1/g,(m,q,n)=>'from '+JSON.stringify(pathToFileURL(path.resolve(root,'web_launch',n)).href));
  const modulePath=path.join(root,proof,'neon-store-mutant.mjs'); await fs.writeFile(modulePath,mutant);
  const testSource=(await read(tests[0])).toString('utf8').replace("'./neon-store.mjs'",JSON.stringify(pathToFileURL(modulePath).href));
  const testPath=path.join(root,proof,'setter-mutant.test.mjs'); await fs.writeFile(testPath,testSource);
  const mutated=run(['--test','--test-reporter=tap',testPath]); assert.equal(mutated.status,1,mutated.stdout+mutated.stderr); assert.match(mutated.stdout,/Missing expected rejection/);
  report.setter_mutation={status:'REJECTED',scope:'Only pre-transport bilateral guard removed; canonical file unchanged',output:mutated.stdout+mutated.stderr,
    canonical_sha256:hash(Buffer.from(original)),mutant_sha256:hash(Buffer.from(mutant)),test_sha256:hash(Buffer.from(testSource))};
  const browser=JSON.parse(await read(proof+'/BROWSER.json')); assert.equal(browser.status,'PASS_LOCAL_LEGACY_LOCATION_AGREEMENT');
  for (const [n,digest] of Object.entries(browser.source_sha256)) assert.equal(hash(await read(n)),digest,n);
  assert.equal(browser.browser.external_requests,0); report.legacy_checks=browser.browser.checks; report.bilateral_gps_checks=browser.browser.extra_checks;
  // The common store changed; rerun the exact existing navigation oracle into a
  // different proof directory. Neither the old runner nor its receipts change.
  const oldRunner='tools/meeting-address-navigation-browser.mjs', newProof=proof+'/navigation-regression';
  const runnerSource=(await read(oldRunner)).toString('utf8').replace("fileURLToPath(new URL('../', import.meta.url))",JSON.stringify(root))
    .replace("'artifacts/overnight-20261004/address-navigation'",JSON.stringify(newProof));
  assert.notEqual(runnerSource,(await read(oldRunner)).toString('utf8'));
  const runnerPath=path.join(root,proof,'navigation-regression-runner.mjs'); await fs.writeFile(runnerPath,runnerSource);
  const navigation=run([runnerPath]); assert.equal(navigation.status,0,navigation.stdout+navigation.stderr);
  const receipt=JSON.parse(await read(newProof+'/NAVIGATION_BROWSER.json')); assert.equal(receipt.status,'PASS_LOCAL_MEETING_ADDRESS_NAVIGATION');
  for (const map of [receipt.source_sha256,receipt.browser.source_sha256]) for (const [n,digest] of Object.entries(map)) assert.equal(hash(await read(n)),digest,n);
  report.navigation_checks=Object.keys(receipt.browser.checks).length; report.navigation_regression_runner_sha256=hash(Buffer.from(runnerSource));
  assert.equal(receipt.browser.external_requests,0); assert.equal(receipt.browser.google_requests_transmitted,0);
  for (const name of ['MEETING_ADDRESS_SQL.json','MEETING_ADDRESS_GATEWAY.json']) {
    const receipt=JSON.parse(await read('artifacts/overnight-20261004/'+name)); assert.match(receipt.status,/^PASS_LOCAL_/);
    for (const [n,digest] of Object.entries(receipt.source_sha256)) assert.equal(hash(await read(n)),digest,n);
  }
  report.reused_proof='Exact SQL/API source maps. Common-store client tests and navigation rerun; prior client/UI full-source proof is historical. PG and unaffected broad suites not rerun.';
  const outputName='dist-neon-location-agreement-20261004';
  report.build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',outputName],{cwd:root,encoding:'utf8'}));
  const directory=path.join(root,'web_launch',outputName), demo=execFileSync('git',['show','HEAD:web_launch/journey-ui.mjs'],{cwd:root});
  await fs.writeFile(path.join(directory,'journey-ui.mjs'),demo);
  const release=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));
  Object.assign(release.files.find(row=>row.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
  release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:report.base_commit,working_copy_preserved:true};
  await fs.writeFile(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
  const names=await fs.readdir(directory); assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
  for (const row of release.files) {const bytes=await fs.readFile(path.join(directory,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
  for (const name of ['app.mjs','meeting-location.mjs','neon-store.mjs','real-journey.mjs']) assert.deepEqual(await fs.readFile(path.join(directory,name)),await read('web_launch/'+name));
  assert.deepEqual(await fs.readFile(path.join(directory,'_worker.js')),await read('web_launch/dist-neon-address-navigation-20261004/_worker.js'));
  for (const [n,digest] of Object.entries({...report.source_sha256,...report.preserved_sha256})) assert.equal(hash(await read(n)),digest,n);
  report.screenshot_sha256=Object.fromEntries(await Promise.all(['bilateral-current-390x844.png','bilateral-atelier-390x844.png','legacy-location-390x844.png'].map(async n=>[n,hash(await read(proof+'/'+n))])));
  report.public_files=names.length;report.directory=directory;report.release_sha256=hash(await fs.readFile(path.join(directory,'release.json')));
  report.status='PASS_LOCAL_LEGACY_LOCATION_AGREEMENT_CLOSURE';report.published=false;
  report.live_accounts=report.signed_http_jwt=report.physical_android=report.google_maps='NOT_RUN';
} catch (error) {report.error=error.message;throw error;}
finally {await fs.writeFile(path.join(root,proof,'ACCEPTANCE.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,tests:report.unit_tests,legacy_checks:report.legacy_checks?.length,bilateral_checks:report.bilateral_gps_checks?.length,navigation_checks:report.navigation_checks,files:report.public_files,release_sha256:report.release_sha256}));
