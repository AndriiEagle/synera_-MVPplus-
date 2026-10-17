// Already-authorized portable local PG only. No installation, arbitrary DSN,
// production credentials, network services or deletion. Databases are preserved.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { neonAuthShimSql } from '../neon/local_acceptance.mjs';
import { exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { hashMaterialPayload } from '../web_launch/business-case.mjs';
import { A, B, fields } from './fixtures/real-journey-fixture.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const runtime='C:\\Users\\Andrii\\.codex\\tmp\\synera-pg16-20261003';
const bin=path.join(runtime,'runtime/pgsql/bin');
const address=['-h','127.0.0.1','-p','55331','-U','synera_acceptance_admin','-w'];
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PG/i.test(key))),PGCLIENTENCODING:'UTF8'};
const sql=(database,input)=>spawnSync(path.join(bin,'psql.exe'),[...address,'-X','-d',database,'-At','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',env,maxBuffer:2*1024*1024,timeout:30000});
const digest=value=>createHash('sha256').update(value).digest('hex');
const literal=value=>"'"+String(value).replaceAll("'","''")+"'";
const preflight=sql('postgres',"select json_build_object('version',current_setting('server_version'),'data',current_setting('data_directory'),'host',inet_server_addr(),'port',inet_server_port());");
assert.equal(preflight.status,0,preflight.stderr);
const server=JSON.parse(preflight.stdout.trim());
assert.equal(server.version,'16.15');assert.equal(server.host,'127.0.0.1');assert.equal(server.port,55331);
assert.equal(path.resolve(server.data).toLowerCase(),path.resolve(runtime,'data').toLowerCase());
const database='synera_outcome_acceptance_'+Date.now();
const created=spawnSync(path.join(bin,'createdb.exe'),[...address,'-T','template0','--encoding=UTF8','--locale-provider=icu','--icu-locale=und',database],{encoding:'utf8',env,timeout:30000});
assert.equal(created.status,0,created.stderr);
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),database,server,scope:'Actual isolated local SQL with provider identity shim; participant attestations, not signed JWT/live accounts/independent execution proof',stages:[],source_sha256:{},provider_calls:0,provider_usd:0};
const output=path.join(root,'artifacts/overnight-20261004/CASE_OUTCOME_SQL.json');
const run=(name,input,success=true)=>{
  const result=sql(database,input);report.stages.push({name,exit_code:result.status,stdout:result.stdout,stderr:result.stderr,error:result.error?.message??null});
  if(success)assert.equal(result.status,0,name+': '+(result.stderr||result.error?.message));return result;
};
try{
  run('local_identity_shim',neonAuthShimSql());
  for(const name of ['schema.proposal.sql','case-state.migration.sql','group-room.migration.sql']){
    const bytes=await fs.readFile(path.join(root,'neon',name));report.source_sha256['neon/'+name]=digest(bytes);run(name,bytes.toString('utf8'));
  }
  const migrationBytes=await fs.readFile(path.join(root,'neon/case-outcome.migration.sql'));
  const acceptanceBytes=await fs.readFile(path.join(root,'neon/case-outcome.acceptance.sql'));
  report.source_sha256['neon/case-outcome.migration.sql']=digest(migrationBytes);report.source_sha256['neon/case-outcome.acceptance.sql']=digest(acceptanceBytes);
  report.source_sha256['tools/case-outcome-sql-acceptance.mjs']=digest(await fs.readFile(fileURLToPath(import.meta.url)));
  const migration=migrationBytes.toString('utf8');const acceptance=acceptanceBytes.toString('utf8');
  assert.match(migration,/^begin;/m);assert.match(migration.trim(),/commit;$/);assert.match(acceptance.trim(),/rollback;$/);
  const fixtures=(await fs.readFile(path.join(root,'neon/case-state.acceptance.sql'),'utf8')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,'');
  report.source_sha256['neon/case-state.acceptance.sql']=digest(await fs.readFile(path.join(root,'neon/case-state.acceptance.sql')));
  const material=exchangeMaterial(A,B,fields());const termsHash=await hashMaterialPayload(material);
  const seed=`set local role authenticated;\nselect set_config('request.jwt.claims','{"sub":"${A}","role":"authenticated"}',true);\ninsert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('case-outcome-ab','${A}','${B}','exchange',${literal(JSON.stringify(material))}::jsonb,'${termsHash}',now()+interval '14 days');\nreset role;\n`;
  const body=migration.replace(/^begin;\r?\n/m,'').replace(/commit;\s*$/,'');
  const script='begin;\n'+body+'\n'+fixtures+'\n'+seed+acceptance;
  run('outcome_semantic_acceptance',script);
  const needle="action in ('check','accept','decline') and actor::text<>d->>'receiver_id'";
  assert.ok(body.includes(needle),'Receiver guard mutation target absent');
  const mutant=body.replace(needle,"action in ('check','decline') and actor::text<>d->>'receiver_id'");
  const red=run('giver_self_accept_mutation_expected_red','begin;\n'+mutant+'\n'+fixtures+'\n'+seed+acceptance,false);
  assert.notEqual(red.status,0);assert.match(red.stderr,/Giver accepted own result/);report.giver_self_accept_mutation_rejected=true;
  run('outcome_acceptance_after_mutation_rollback',script);
  const cleanup=run('rollback_readback',`select json_build_object('outcome_table_absent',to_regclass('public.match_outcome_events') is null,'fixture_users_left',(select count(*) from neon_auth."user"),'cases_left',(select count(*) from public.match_cases));`);
  report.rollback=JSON.parse(cleanup.stdout.trim());assert.equal(report.rollback.outcome_table_absent,true);assert.equal(report.rollback.fixture_users_left,0);assert.equal(report.rollback.cases_left,0);
  report.status='PASS_LOCAL_SQL_ROLLED_BACK';
}catch(error){report.error=error.message;throw error;}
finally{await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,database,stages:report.stages.map(stage=>({name:stage.name,exit_code:stage.exit_code})),mutation_rejected:report.giver_self_accept_mutation_rejected,rollback:report.rollback,receipt:output}));
