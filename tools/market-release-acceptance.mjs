// Offline packaging only. Refuse an existing output rather than overwrite it.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const proof='artifacts/market-readiness-20261007', output='dist-neon-market-refresh-20261007', dir='web_launch/'+output;
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args);
const foreign=await fs.readFile('web_launch/journey-ui.mjs');
assert.equal(hash(foreign),'68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b');
for(const [file,status] of [['green/RESULT.json','PASS_LOCAL_REFRESH_RECOVERY'],['mutation/RESULT.json','EXPECTED_DEFECT_CAUGHT'],['message/browser/RESULT.json','PASS_LOCAL_MESSAGE_INTENT_BROWSER'],['message/mutation/RESULT.json','MUTANT_REJECTED_DUPLICATE_MESSAGE'],['partner/GREEN.json','PASS_LOCAL_PARTNER_STATUS_BROWSER']]) {
  assert.equal(JSON.parse(await fs.readFile(proof+'/'+file)).status,status);
}
await assert.rejects(fs.access(dir),{code:'ENOENT'});
execFileSync(process.execPath,['neon/build.mjs',output],{timeout:30000});
const committed=git('show','HEAD:web_launch/journey-ui.mjs');
await fs.writeFile(dir+'/journey-ui.mjs',committed);
const release=JSON.parse(await fs.readFile(dir+'/release.json'));
release.source_selection={base:git('rev-parse','HEAD').toString().trim(),journey_ui:'committed HEAD bytes; foreign work excluded',journey_ui_sha256:hash(committed),real_journey_sha256:hash(await fs.readFile('web_launch/real-journey.mjs'))};
for(const row of release.files){const b=await fs.readFile(dir+'/'+row.name);row.bytes=b.length;row.sha256=hash(b);}
await fs.writeFile(dir+'/release.json',JSON.stringify(release,null,2));
assert.deepEqual((await fs.readdir(dir)).sort(),[...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json'].sort());
for(const row of release.files){const b=await fs.readFile(dir+'/'+row.name);assert.equal(hash(b),row.sha256);assert.equal(b.length,row.bytes);}
assert.equal(hash(await fs.readFile(dir+'/real-journey.mjs')),release.source_selection.real_journey_sha256);
assert.equal(hash(await fs.readFile('web_launch/journey-ui.mjs')),hash(foreign));
const previous='web_launch/dist-neon-message-intent-20261005';
assert.equal(hash(await fs.readFile(previous+'/release.json')),'efd4bc624a5aadb87d2676b036bff0a2e1d80f34182c32fce221460df82fdceb');
// Every unchanged asset, including the compiled server, remains byte-identical.
for(const name of await fs.readdir(dir))if(!['release.json','real-journey.mjs'].includes(name))assert.equal(hash(await fs.readFile(dir+'/'+name)),hash(await fs.readFile(previous+'/'+name)),name);
const report={status:'PASS_LOCAL_MARKET_CANDIDATE',candidate:dir,files:(await fs.readdir(dir)).length,manifest_rows:release.files.length,release_sha256:hash(await fs.readFile(dir+'/release.json')),source_selection:release.source_selection,only_changed_asset:'real-journey.mjs',foreign_sha256:hash(foreign),published:false,live_cycle:false,capacity_verified:false,provider_calls:0,provider_usd:0};
await fs.writeFile(proof+'/RELEASE.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
