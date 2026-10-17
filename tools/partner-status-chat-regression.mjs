// Re-run only the accepted chat oracle affected by the shared read scheduler.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const hash=b=>createHash('sha256').update(b).digest('hex');
const prior=JSON.parse(await fs.readFile('artifacts/dynamic-audit-20261005/ACCEPTANCE.json'));
const input=await fs.readFile('tools/journey-dynamic-audit.mjs');
if(hash(input)!==prior.source_sha256['tools/journey-dynamic-audit.mjs'])throw Error('Accepted chat oracle drift');
let source=input.toString('utf8');
source=source.replace("const directory = 'artifacts/dynamic-audit-20261005';","const directory = 'artifacts/partner-status-20261005/chat-regression';");
source=source.replace("const root = fileURLToPath(new URL('../', import.meta.url));",`const root = fileURLToPath(new URL('../', ${JSON.stringify(import.meta.url)}));`);
const proof='artifacts/partner-status-20261005/chat-regression';await fs.mkdir(proof,{recursive:true});
const wrapper=proof+'/wrapper.mjs';await fs.writeFile(wrapper,source);
const result=spawnSync(process.execPath,[wrapper],{encoding:'utf8',timeout:120000,maxBuffer:1024*1024});
await fs.writeFile(proof+'/REUSE.json',JSON.stringify({status:result.status===0?'PASS_LOCAL_CHAT_REGRESSION':'NOT_ACCEPTED',input_oracle_sha256:hash(input),wrapper_sha256:hash(Buffer.from(source)),exit_code:result.status,error:result.error?.message,output:result.stdout,stderr:result.stderr,provider_calls:0,provider_usd:0},null,2)+'\n');
if(result.status!==0)throw Error(result.stdout+result.stderr+(result.error?.message||''));
console.log(result.stdout.trim());
