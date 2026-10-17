// Local immutable candidate only; never publishes or changes production.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PUBLIC_ASSETS} from '../web_launch/assets.mjs';
const proof='artifacts/mobile-20261007', output='dist-neon-mobile-final-20261007', dir='web_launch/'+output;
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=p=>fs.readFile(p), json=async p=>JSON.parse(await read(p));
const git=(...args)=>execFileSync('git',args);
const changed=['get.html','product-access.mjs','pwa.mjs','real-journey.css','style.css','summit.css','triangle.css'];
assert.equal(hash(await read('web_launch/journey-ui.mjs')),'68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b');
const pricing=await json(proof+'/pricing/FINAL_RECEIPT.json');
assert.equal(pricing.green_command_exit,0);
assert.equal(pricing.semantic_tests,12);
assert.equal(pricing.visual_discrepancy.tests_passed,5);
for(const [p,h] of Object.entries(pricing.hashes)){
 const bytes=await read(p);
 // Exact original CRLF prefix was restored after the pricing receipt.
 // Only newline encoding may differ here; final CSS has its own browser proof.
 assert.equal(hash(p==='web_launch/summit.css'?Buffer.from(bytes.toString().replaceAll('\r\n','\n')):bytes),h,p);
}
assert.equal((await json(proof+'/install/BROWSER.json')).status,'PASS_LOCAL_INSTALL_GUIDE');
assert.match((await read(proof+'/install/GREEN.txt')).toString(),/pass 6/);
assert.match((await read(proof+'/install/MUTATION.txt')).toString(),/fail 3/);
const targeted=await json(proof+'/responsive/green-targeted/matrix.json');
const extra=await json(proof+'/responsive/green-extra-final/matrix.json');
const full=await json(proof+'/responsive/full-reviewed/matrix.json');
const mutant=await json(proof+'/responsive/mutation-reviewed/matrix.json');
for(const r of [targeted,extra])assert.deepEqual([r.summary.issues,r.failures.length],[0,0]);
assert.equal(full.summary.rows,180);assert.equal(full.failures.length,0);
assert.ok(mutant.summary.issues>0);assert.equal(mutant.failures.length,0);
for(const f of ['real-journey.css','triangle.css'])assert.equal(hash(await read('web_launch/'+f)),targeted.sources[f],f);
for(const f of ['style.css','summit.css'])assert.equal(hash(await read('web_launch/'+f)),extra.sources[f],f);
const unresolved=full.rows.filter(r=>r.page!=='catalogue'&&r.issues.length);
assert.ok(unresolved.every(r=>extra.rows.some(x=>x.page===r.page&&x.size===r.size&&x.issues.length===0)));
await assert.rejects(fs.access(dir),{code:'ENOENT'});
execFileSync(process.execPath,['neon/build.mjs',output],{timeout:30000});
const foreignCommitted=git('show','HEAD:web_launch/journey-ui.mjs');
await fs.writeFile(dir+'/journey-ui.mjs',foreignCommitted);
const release=await json(dir+'/release.json');
release.source_selection={base:git('rev-parse','HEAD').toString().trim(),journey_ui:'committed HEAD bytes; foreign dirty work excluded',changed_sources:Object.fromEntries(await Promise.all(changed.map(async f=>[f,hash(await read('web_launch/'+f))])))};
for(const row of release.files){const bytes=await read(dir+'/'+row.name);row.bytes=bytes.length;row.sha256=hash(bytes);}
await fs.writeFile(dir+'/release.json',JSON.stringify(release,null,2));
assert.deepEqual((await fs.readdir(dir)).sort(),[...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json'].sort());
for(const row of release.files){const bytes=await read(dir+'/'+row.name);assert.equal(hash(bytes),row.sha256);assert.equal(bytes.length,row.bytes);}
for(const name of await fs.readdir(dir))if(!['release.json',...changed].includes(name))assert.equal(hash(await read(dir+'/'+name)),hash(await read('web_launch/dist-neon-market-refresh-20261007/'+name)),name);
assert.equal(hash(await read('web_launch/journey-ui.mjs')),'68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b');
const receipt={status:'PASS_LOCAL_MOBILE_CANDIDATE',candidate:dir,files:(await fs.readdir(dir)).length,manifest_rows:release.files.length,release_sha256:hash(await read(dir+'/release.json')),source_selection:release.source_selection,published:false,physical_android:false,physical_iphone:false,native_emulator:false,pricing_runner_limits:pricing.visual_discrepancy,scope:'Final hashes; unchanged assets byte-identical to previous candidate. Catalogue excluded from user-flow acceptance; see responsive report.'};
const earlier=await json(proof+'/RELEASE.json').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(earlier){assert.notEqual(earlier.candidate,dir);await fs.writeFile(proof+'/SUPERSEDED_CANDIDATE.json',JSON.stringify({...earlier,superseded_by:dir,reason:'Exact original Summit CRLF prefix restored; normalized CSS unchanged'},null,2)+'\n');}
await fs.writeFile(proof+'/RELEASE.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
