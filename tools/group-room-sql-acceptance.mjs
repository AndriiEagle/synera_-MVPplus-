// Named existing disposable container only. No downloads, secrets or production connection.
import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
import {neonAuthShimSql} from '../neon/local_acceptance.mjs';
const container='synera-location-20261002';
const checked=spawnSync('docker',['inspect','--format','{{index .Config.Labels "synera.disposable"}} {{.State.Running}}',container],{encoding:'utf8'});
if(checked.status!==0||checked.stdout.trim()!=='20261002 true')throw Error('Running named disposable container not verified');
const database='synera_room_'+Date.now();const created=spawnSync('docker',['exec',container,'createdb','-U','postgres',database],{encoding:'utf8'});if(created.status!==0)throw Error(created.stderr);
const run=sql=>spawnSync('docker',['exec','-i',container,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1','-q'],{input:sql,encoding:'utf8',maxBuffer:4*1024*1024});
const receipt={scope:'disposable PostgreSQL; provider auth shim; not live Neon',pass:false,database,stages:[],provider_calls:0};
await fs.mkdir('artifacts/network-room-20261002',{recursive:true});
try{
 for(const [name,sql] of [['shim',neonAuthShimSql()],...await Promise.all(['schema.proposal.sql','group-room.migration.sql','group-room.acceptance.sql'].map(async file=>[file,await fs.readFile('neon/'+file,'utf8')]))]){
  const result=run(sql);receipt.stages.push({name,exit:result.status,output:result.stdout+result.stderr});if(result.status!==0)throw Error(name+': '+result.stderr);
 }
 const count=run('select count(*) as users_left from neon_auth."user";');receipt.fixture_users_left=/\n\s*0\s*\n/.test(count.stdout)?0:null;
 if(receipt.fixture_users_left!==0)throw Error('Fixture rollback failed');receipt.pass=true;
}finally{await fs.writeFile('artifacts/network-room-20261002/sql-acceptance.json',JSON.stringify(receipt,null,2));}
console.log(JSON.stringify({pass:receipt.pass,scope:receipt.scope,stages:receipt.stages.map(s=>s.name),fixture_users_left:receipt.fixture_users_left}));
