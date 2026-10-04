// Existing authorized portable PG only. Identity shim, no provider/JWT claim.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { neonAuthShimSql } from '../neon/local_acceptance.mjs';
import { exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { hashMaterialPayload } from '../web_launch/business-case.mjs';
import { A,B,fields } from './fixtures/real-journey-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const runtime='C:\\Users\\Andrii\\.codex\\tmp\\synera-pg16-20261003';
const bin=path.join(runtime,'runtime/pgsql/bin');
const address=['-h','127.0.0.1','-p','55331','-U','synera_acceptance_admin','-w'];
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PG/i.test(key))),PGCLIENTENCODING:'UTF8'};
const sql=(database,input)=>spawnSync(path.join(bin,'psql.exe'),[...address,'-X','-d',database,'-At','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',env,maxBuffer:2*1024*1024,timeout:30000});
const hash=value=>createHash('sha256').update(value).digest('hex');
const literal=value=>"'"+String(value).replaceAll("'","''")+"'";
const baseline=process.argv.includes('--baseline');
const preflight=sql('postgres',"select json_build_object('version',current_setting('server_version'),'data',current_setting('data_directory'),'host',inet_server_addr(),'port',inet_server_port());");
assert.equal(preflight.status,0,preflight.stderr);
const server=JSON.parse(preflight.stdout.trim());
assert.equal(server.version,'16.15');assert.equal(server.host,'127.0.0.1');assert.equal(server.port,55331);
assert.equal(path.resolve(server.data).toLowerCase(),path.resolve(runtime,'data').toLowerCase());
const database='synera_address_acceptance_'+Date.now();
const created=spawnSync(path.join(bin,'createdb.exe'),[...address,'-T','template0','--encoding=UTF8','--locale-provider=icu','--icu-locale=und',database],{encoding:'utf8',env,timeout:30000});
assert.equal(created.status,0,created.stderr);
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),database,server,scope:'Isolated PG16 with identity shim, not signed HTTP JWT/live accounts/production',stages:[],source_sha256:{},provider_calls:0,provider_usd:0};
const output=path.join(root,'artifacts/overnight-20261004/'+(baseline?'MEETING_ADDRESS_RED.json':'MEETING_ADDRESS_SQL.json'));
const read=async name=>{const bytes=await fs.readFile(path.join(root,name));report.source_sha256[name]=hash(bytes);return bytes.toString('utf8');};
const run=(name,input,success=true)=>{const result=sql(database,input);report.stages.push({name,exit_code:result.status,stdout:result.stdout,stderr:result.stderr,error:result.error?.message??null});if(success)assert.equal(result.status,0,name+': '+(result.stderr||result.error?.message));return result;};
try{
  run('local_identity_shim',neonAuthShimSql());
  for(const name of ['schema.proposal.sql','case-state.migration.sql','group-room.migration.sql','meeting-location.migration.sql'])run(name,await read('neon/'+name));
  report.source_sha256['tools/meeting-address-sql-acceptance.mjs']=hash(await fs.readFile(fileURLToPath(import.meta.url)));
  const fixtures=(await read('neon/case-state.acceptance.sql')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,'');
  const material=exchangeMaterial(A,B,fields());const termsHash=await hashMaterialPayload(material);
  const revised=structuredClone(material);revised.trial.deliverables[0].target+=' — revised';const revisedHash=await hashMaterialPayload(revised);
  const seed=`set local role authenticated;
select set_config('request.jwt.claims','{"sub":"${A}","role":"authenticated"}',true);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('case-address-ab','${A}','${B}','exchange',${literal(JSON.stringify(material))}::jsonb,'${termsHash}',now()+interval '14 days');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('case-address-ab','${A}',1,'${termsHash}');
select set_config('request.jwt.claims','{"sub":"${B}","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('case-address-ab','${B}',1,'${termsHash}');
select set_config('request.jwt.claims','{"sub":"${A}","role":"authenticated"}',true);
reset role;
-- Owner creates the stable fixture ID; callers have no INSERT privilege on id.
insert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place) values('44444444-4444-4444-8444-444444444444','${A}','${B}','Discuss agreed exchange','accepted',now()+interval '2 hours',30,'Zürich');
select set_config('synera.revised_material',${literal(JSON.stringify(revised))},true);
select set_config('synera.revised_hash','${revisedHash}',true);
`;
  const regression=await read('neon/meeting-address-direct-patch.regression.sql');
  if(baseline){
    const red=run('unilateral_patch_expected_red','begin;\n'+fixtures+seed+regression+'rollback;',false);
    assert.notEqual(red.status,0);assert.match(red.stderr,/One participant changed the address without peer approval/);
    report.status='RED_REPRODUCED_UNILATERAL_ADDRESS_CHANGE';
  }else{
    const migration=await read('neon/meeting-address-agreement.migration.sql');const acceptance=await read('neon/meeting-address-agreement.acceptance.sql');
    assert.match(migration,/^begin;/m);assert.match(migration.trim(),/commit;$/);assert.match(acceptance.trim(),/rollback;$/);
    const body=migration.replace(/^begin;\r?\n/m,'').replace(/commit;\s*$/,'');
    const script=patch=>'begin;\n'+patch+'\n'+fixtures+seed+regression+acceptance;
    run('bilateral_address_semantics',script(body));
    const needle="if actor=proposal.actor_id then raise exception 'Only the other participant decides'";
    assert.ok(body.includes(needle),'Peer guard mutation target absent');
    const mutant=body.replace(needle,"if false then raise exception 'Only the other participant decides'");
    const red=run('self_accept_mutation_expected_red',script(mutant),false);
    assert.notEqual(red.status,0);assert.match(red.stderr,/Proposer accepted own address/);report.self_accept_mutation_rejected=true;
    run('acceptance_after_mutation_rollback',script(body));
    report.status='PASS_LOCAL_MEETING_ADDRESS_SQL';
  }
  const cleanup=run('rollback_readback',`select json_build_object('address_events_absent',to_regclass('public.meeting_address_events') is null,'fixture_users_left',(select count(*) from neon_auth."user"),'cases_left',(select count(*) from public.match_cases),'meetings_left',(select count(*) from public.meeting_requests));`);
  report.rollback=JSON.parse(cleanup.stdout.trim());assert.equal(report.rollback.address_events_absent,true);assert.equal(report.rollback.fixture_users_left,0);assert.equal(report.rollback.cases_left,0);assert.equal(report.rollback.meetings_left,0);
}catch(error){report.error=error.message;throw error;}
finally{await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,database,stages:report.stages.map(s=>({name:s.name,exit_code:s.exit_code})),rollback:report.rollback,receipt:output}));
