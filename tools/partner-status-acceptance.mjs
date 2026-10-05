import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PUBLIC_ASSETS} from '../web_launch/assets.mjs';
const proof='artifacts/partner-status-20261005',hash=b=>createHash('sha256').update(b).digest('hex');
const read=n=>fs.readFile(n),json=async n=>JSON.parse(await read(n));
const base=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const before=execFileSync('git',['show',base+':web_launch/real-journey.mjs']),current=await read('web_launch/real-journey.mjs');
const red=await json(proof+'/RED.json'),statusRed=await json(proof+'/STATUS-RED.json'),green=await json(proof+'/GREEN.json'),mutation=await json(proof+'/MUTATION.json'),chat=await json(proof+'/chat-regression/GREEN.json');
assert.equal(red.status,'RED_PARTNER_STATUS_REQUIRES_REFRESH');assert.equal(red.source_sha256['web_launch/real-journey.mjs'],hash(before));
assert.equal(statusRed.status,'RED_HINT_CONTRADICTS_ACCEPTED_INVITATION');
assert.equal(green.status,'PASS_LOCAL_PARTNER_STATUS_BROWSER');assert.equal(mutation.status,'MUTANT_REJECTED_PARTNER_STATUS_REQUIRES_REFRESH');assert.equal(chat.status,'PASS_LOCAL_DYNAMIC_CHAT_AUDIT');
for(const receipt of [green,mutation,chat.browser])for(const[n,digest]of Object.entries(receipt.source_sha256))assert.equal(hash(await read(n)),digest,n);
assert.equal(Object.keys(green.checks).length,11);assert.deepEqual(green.external_requests,[]);assert.deepEqual(chat.browser.external_requests,[]);
const prior=await json('artifacts/dynamic-audit-20261005/ACCEPTANCE.json');
for(const[n,digest]of Object.entries(prior.preserved_sha256))assert.equal(hash(await read(n)),digest,n);
const preserved={...prior.preserved_sha256,'neon/worker.mjs':hash(await read('neon/worker.mjs'))};
assert.deepEqual(execFileSync('git',['show',base+':neon/worker.mjs']),await read('neon/worker.mjs'));
// The read scheduler and form-base guard are the only changed controller seams.
function outside(bytes){return bytes.toString('utf8').replaceAll('\r\n','\n').split('\n').filter(line=>!line.startsWith('const state = ')&&!line.includes('state.reviewKey = null;')&&!line.includes('partnerRequest++;')&&!line.startsWith('  state.caseState = current; fillCurrentTerms(')&&!line.startsWith('async function saveTerms(')&&!line.startsWith("ui.termsForm.addEventListener('input',")).join('\n').split('let conversationRequest = ')[0];}
assert.equal(outside(before),outside(current),'Unexpected controller changes outside bounded seams');
const candidate='dist-neon-partner-status-20261005';
const build=JSON.parse(execFileSync(process.execPath,['neon/build.mjs',candidate],{encoding:'utf8'}));
const target='web_launch/'+candidate,demo=execFileSync('git',['show',base+':web_launch/journey-ui.mjs']);
await fs.writeFile(target+'/journey-ui.mjs',demo);
const release=await json(target+'/release.json');Object.assign(release.files.find(row=>row.name==='journey-ui.mjs'),{bytes:demo.length,sha256:hash(demo)});
release.source_selection={unowned_demo_source:'HEAD:web_launch/journey-ui.mjs',base_commit:base,working_copy_preserved:true};
await fs.writeFile(target+'/release.json',JSON.stringify(release,null,2)+'\n');
const names=await fs.readdir(target);assert.deepEqual(new Set(names),new Set([...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']));
for(const row of release.files){const bytes=await read(path.join(target,row.name));assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256,row.name);}
assert.deepEqual(await read(target+'/real-journey.mjs'),current);
assert.deepEqual(await read(target+'/_worker.js'),await read('web_launch/dist-neon-dynamic-audit-20261005/_worker.js'));
const sources=['web_launch/real-journey.mjs','tools/partner-status-browser.mjs','tools/partner-status-chat-regression.mjs','tools/partner-status-acceptance.mjs'];
const screenshots=['01-partner-approved.png','02-revision-keeps-draft.png','03-accepted-invitation.png'];
const report={status:'PASS_LOCAL_PARTNER_STATUS_CLOSURE',generated_at:new Date().toISOString(),base_commit:base,source_sha256:Object.fromEntries(await Promise.all(sources.map(async n=>[n,hash(await read(n))]))),preserved_sha256:preserved,screenshot_sha256:Object.fromEntries(await Promise.all(screenshots.map(async n=>[n,hash(await read(proof+'/green/'+n))]))),partner_browser_groups:11,chat_browser_groups:Object.keys(chat.browser.checks).length,counts_overlap:true,build,public_files:names.length,manifest_rows:release.files.length,candidate:target,release_sha256:hash(await read(target+'/release.json')),published:false,provider_calls:0,provider_usd:0,limits:['Selected peer before chat only; visible page at existing five-second interval; no new provider calls','Synthetic transport; live JWT/two accounts/physical Android NOT_RUN','SQL/gateway unchanged; previous SQL proofs not rerun','Manual resend may duplicate; changed review/history can rebuild; no emotion measurements']};
await fs.writeFile(proof+'/ACCEPTANCE.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,partner_groups:11,chat_groups:report.chat_browser_groups,public_files:names.length,release_sha256:report.release_sha256}));
