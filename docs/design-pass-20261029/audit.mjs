import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve('.');
assert.equal(root.toLowerCase(),'c:\\sw\\synera-design');
const evidence=path.join(root,'docs/design-pass-20261029');
const decode=buffer=>buffer[0]===255&&buffer[1]===254?buffer.toString('utf16le').replace(/^\uFEFF/,''):buffer.toString('utf8').replace(/^\uFEFF/,'');
const read=name=>decode(fs.readFileSync(path.join(evidence,name)));
const shots=JSON.parse(read('shots/report.json'));
const browser=JSON.parse(read('browser-report.json'));
assert.equal(shots.length,15);
assert.ok(shots.every(r=>r.status===200&&!r.failed&&!r.hscroll&&r.errors.length===0));
assert.equal(browser.status,'pass');assert.equal(browser.matrix.length,36);
assert.equal(browser.matrix.filter(r=>r.layer==='product-http').length,33);
assert.equal(browser.matrix.filter(r=>r.layer==='local-synthetic-preview').length,3);
assert.ok(browser.matrix.every(r=>!r.scroll&&r.errors.length===0));
assert.match(read('full-tests.log'),/tests 539/);assert.match(read('full-tests.log'),/pass 539/);assert.match(read('full-tests.log'),/fail 0/);
const build=JSON.parse(read('build.log'));assert.equal(build.published,false);assert.equal(build.files,121);
assert.match(read('first-visit-after.log'),/PASS/);assert.match(read('first-visit-before.log'),/AssertionError/);
assert.match(read('mutation.log'),/PASS_MUTANT_REJECTED/);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',windowsHide:true}).trim();
assert.equal(git('rev-parse','HEAD'),'a95acd525afd3c7a729bf7123254d9e81c224e93');
assert.equal(git('branch','--show-current'),'claude/synera-design-20261029c');
assert.equal(git('diff','--name-only','--','neon'),'');
for(const name of ['outcome-export-plain.json','outcome-export-gzip.json']){
 const file='artifacts/overnight-20261004/'+name;
 assert.ok(fs.readFileSync(file).equals(execFileSync('git',['show','HEAD:'+file],{windowsHide:true})));
}
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const changed=[...new Set([...git('diff','--name-only').split('\n'),...git('ls-files','--others','--exclude-standard','--','web_launch','tools').split('\n')])].filter(name=>name&&fs.statSync(name).isFile());
const pngs=fs.readdirSync(path.join(evidence,'shots')).filter(name=>name.endsWith('.png'));
assert.equal(pngs.length,51);
const manifest={base:git('rev-parse','HEAD'),branch:git('branch','--show-current'),tests:539,buildFiles:121,
  providerCalls:0,usd:0,requiredShots:15,productHttpCases:33,localLabPreviews:3,
  visualReview:{reviewer:'current Codex, self-review',pngs:51,sheets:14,independentArtAcceptance:false},
  files:changed.map(file=>({file,sha256:digest(file)})),
  screenshots:pngs.sort().map(file=>({file:'shots/'+file,sha256:digest(path.join(evidence,'shots',file))})),
  report:{file:'docs/DESIGN-PASS-20261029.uk.md',sha256:digest('docs/DESIGN-PASS-20261029.uk.md')}
};
fs.writeFileSync(path.join(evidence,'final-manifest.json'),JSON.stringify(manifest,null,2));
console.log('PASS: exact base and branch; 539 tests; 121-file unpublished build; 15 required screenshots; 33 HTTP + 3 LAB cases; 51 PNGs; fixture bytes match HEAD; neon unchanged.');
