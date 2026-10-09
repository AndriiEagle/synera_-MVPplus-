// Add-only release packaging. No deployment, secrets or production mutation.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const proof='artifacts/mobile-webkit-20261009';
const original='web_launch/dist-neon-mobile-final-20261007';
const candidate='web_launch/dist-neon-webkit-20261009';
const originalBytes=await fs.readFile(original+'/release.json');
assert.equal(sha(originalBytes),'a80d283892665eaf3800060f5154e3f37eae545ff5f9186fcbb35efd18b7315c');
const release=JSON.parse(originalBytes);
for(const f of release.files){const b=await fs.readFile(original+'/'+f.name);assert.equal(sha(b),f.sha256,f.name);assert.equal(b.length,f.bytes,f.name);assert.equal(path.basename(f.name),f.name);}
const css=await fs.readFile('web_launch/real-journey.css');
const oldCss=await fs.readFile(original+'/real-journey.css');
assert.ok(css.subarray(0,oldCss.length).equals(oldCss),'Preserve the original CSS bytes');
const acceptedProfiles=[];
for(const phase of ['green','webkit-regression','chromium-regression']) {
  const r=await json(`${proof}/${phase}/RESULT.json`);
  assert.equal(r.failures.length,0,phase);assert.equal(r.summary.issues,0,phase);
  assert.equal(r.cssOverride.sha256,sha(css),'Rendered CSS must be current');
  for(const j of r.journeys){assert.equal(j.approvals,2);assert.equal(j.accepted,1);assert.equal(j.messages,1);if(r.engine.name==='webkit')acceptedProfiles.push(j.profile);}
}
assert.deepEqual(acceptedProfiles.sort(),['atelier','compact','landscape','large','large-text','small','standard','tablet'].sort());
const mutant=await json(proof+'/mutation-original/RESULT.json');
assert.equal(mutant.failures.length,0);assert.equal(mutant.journeys.length,1);assert.ok(mutant.rows.some(r=>r.issues.some(i=>i.kind==='document-overflow')),'The semantic guard must catch the old CSS');
const foreignBefore=sha(await fs.readFile('web_launch/journey-ui.mjs'));
assert.equal(foreignBefore,'68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b');
await fs.mkdir(candidate); // EEXIST is intentional: never overwrite a previous candidate.
for(const name of await fs.readdir(original)){assert.equal(path.basename(name),name);await fs.copyFile(original+'/'+name,candidate+'/'+name);}
await fs.writeFile(candidate+'/real-journey.css',css);
release.source_selection.webkit_patch={source:'web_launch/real-journey.css',sha256:sha(css),preserved_original_sha256:sha(oldCss),proof};
release.published=false;
for(const f of release.files){const b=await fs.readFile(candidate+'/'+f.name);f.sha256=sha(b);f.bytes=b.length;}
await fs.writeFile(candidate+'/release.json',JSON.stringify(release,null,2));
const changed=[];
for(const name of await fs.readdir(original)){const before=await fs.readFile(original+'/'+name),after=await fs.readFile(candidate+'/'+name);if(!before.equals(after))changed.push(name);}
assert.deepEqual(changed.sort(),['real-journey.css','release.json']);
for(const f of release.files){const b=await fs.readFile(candidate+'/'+f.name);assert.equal(sha(b),f.sha256);assert.equal(b.length,f.bytes);}
assert.equal(sha(await fs.readFile('web_launch/journey-ui.mjs')),foreignBefore);
const receipt={status:'PASS_LOCAL_WEBKIT_PATCH_CANDIDATE',candidate,release_sha256:sha(await fs.readFile(candidate+'/release.json')),files:(await fs.readdir(candidate)).length,manifest_files:release.files.length,changed,css_sha256:sha(css),preserved_original_css_sha256:sha(oldCss),foreign_sha256:foreignBefore,webkit_profiles:acceptedProfiles,chromium_profiles:3,semantic_mutation:'OLD_CSS_REINTRODUCES_OVERFLOW',published:false,physical_android:false,physical_iphone:false,live_accounts:false,provider_calls:0,usd:0};
await fs.writeFile(proof+'/RELEASE.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
