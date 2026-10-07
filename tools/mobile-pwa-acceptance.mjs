import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const dir='artifacts/mobile-20261007/install';
for(const mutant of [false,true]){
 const r=spawnSync(process.execPath,['--test','web_launch/pwa-mobile.test.mjs','web_launch/pwa.test.mjs'],{encoding:'utf8',timeout:30000,env:{...process.env,SYNERA_PWA_MUTATION:mutant?'baseline':''}});
 assert.equal(r.error,undefined);
 await fs.writeFile(dir+'/'+(mutant?'MUTATION.txt':'GREEN.txt'),r.stdout+r.stderr);
 assert.equal(r.status,mutant?1:0,r.stdout+r.stderr);
 if(mutant)assert.match(r.stdout,/fail 3/);
}
console.log('PASS: six PWA tests; baseline mutant rejected by three semantic guards');
