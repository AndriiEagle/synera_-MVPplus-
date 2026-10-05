// Existing authorized PG16 runtime only. Preserve the isolated DB; no cloud/DSN/install/delete.
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { neonAuthShimSql } from '../neon/local_acceptance.mjs';
import { exchangeMaterial } from '../web_launch/real-journey-client.mjs';
import { hashMaterialPayload } from '../web_launch/business-case.mjs';
import { A, B, C, fields } from './fixtures/real-journey-fixture.mjs';
const proof='artifacts/message-intent-20261005', runtime='C:/Users/Andrii/.codex/tmp/synera-pg16-20261003';
const bin=path.join(runtime,'runtime/pgsql/bin'), args=['-h','127.0.0.1','-p','55331','-U','synera_acceptance_admin','-w','-X','-At','-v','ON_ERROR_STOP=1'];
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PG/i.test(key))),PGCLIENTENCODING:'UTF8'};
const run=(db,input)=>spawnSync(path.join(bin,'psql.exe'),[...args,'-d',db],{input,encoding:'utf8',env,timeout:20000,maxBuffer:1024*1024});
const must=(db,input)=>{const r=run(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const lit=s=>"'"+String(s).replaceAll("'","''")+"'", claims=id=>`select set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false);`;
const hash=b=>createHash('sha256').update(b).digest('hex');
const server=JSON.parse(must('postgres',"select json_build_object('version',current_setting('server_version'),'data',current_setting('data_directory'),'host',inet_server_addr(),'port',inet_server_port());"));
assert.equal(server.version,'16.15');assert.equal(server.host,'127.0.0.1');assert.equal(server.port,55331);assert.equal(path.resolve(server.data).toLowerCase(),path.resolve(runtime,'data').toLowerCase());
const database='synera_message_intent_'+Date.now();
const created=spawnSync(path.join(bin,'createdb.exe'),args.slice(0,7).concat(['-T','template0','--encoding=UTF8','--locale-provider=icu','--icu-locale=und',database]),{encoding:'utf8',env,timeout:20000});assert.equal(created.status,0,created.stderr);
const report={status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),database,server,proof_scope:'Local PostgreSQL with identity shim; no signed HTTP JWT, live Neon, human accounts, phone or capacity guarantee',checks:[],source_sha256:{},provider_calls:0,provider_usd:0};
const load=async file=>{const b=await fs.readFile(file);report.source_sha256[file]=hash(b);return b.toString('utf8');};
const session=actor=>`set role authenticated;${claims(actor)}`;
let meeting;
const rpc=(id,body='Concurrent intent',m=meeting)=>`select public.synera_send_message('${m}','${id}',${lit(body)});`;
const done=p=>new Promise(resolve=>{let stdout='',stderr='';p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);p.on('error',error=>resolve({code:null,stdout,stderr,error:error.message}));p.on('exit',code=>resolve({code,stdout,stderr}));});
async function concurrency(label,success) {
  const intent=randomUUID(), tag='synera_intent_'+label+'_'+Date.now();
  const leader=spawn(path.join(bin,'psql.exe'),[...args,'-d',database],{env:{...env,PGAPPNAME:tag+'_leader'},stdio:['pipe','pipe','pipe']});const leadResult=done(leader);
  await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Leader barrier unavailable')),5000);leader.stdout.on('data',b=>{out+=b;if(out.includes('BARRIER_READY')){clearTimeout(timer);resolve();}});leader.on('exit',()=>{clearTimeout(timer);reject(Error('Leader exited before barrier'));});leader.stdin.write(`begin;${session(A)}${rpc(intent)}select 'BARRIER_READY';\n`);});
  const children=Array.from({length:16},()=>{const child=spawn(path.join(bin,'psql.exe'),[...args,'-d',database],{env:{...env,PGAPPNAME:tag+'_retry'},stdio:['pipe','pipe','pipe']});const result=done(child);child.stdin.end(session(A)+rpc(intent));return {child,result};});
  try {
    const deadline=Date.now()+3500;let waiting=0;
    while(Date.now()<deadline){waiting=Number(must(database,`select count(*) from pg_stat_activity where application_name='${tag}_retry' and wait_event_type='Lock';`));if(waiting===16)break;await new Promise(r=>setTimeout(r,40));}
    assert.equal(waiting,16,'All overlapping retries must reach the uncommitted leader before release');
  } finally {leader.stdin.end('commit;\n');}
  const results=await Promise.all(children.map(row=>row.result)), first=await leadResult;assert.equal(first.code,0,first.stderr);
  if(success){for(const r of results){assert.equal(r.code,0,r.stderr);const row=JSON.parse(r.stdout.trim().split('\n').at(-1));assert.equal(row.id,intent);assert.equal(row.sender_id,A);}assert.equal(Number(must(database,`select count(*) from public.meeting_messages where id='${intent}';`)),1);}
  else {assert.ok(results.every(r=>r.code!==0),'Removing transaction lock must reject overlapping retries');assert.ok(results.every(r=>r.stderr.includes('duplicate key')),JSON.stringify(results));}
  report.checks.push({name:label,overlapping_retries:16,leader_transaction_barrier:true,all_waited:true,exit_codes:results.map(r=>r.code),expected_success:success});
}
try {
  must(database,neonAuthShimSql());
  for(const file of ['neon/schema.proposal.sql','neon/case-state.migration.sql'])must(database,await load(file));
  const fixtures=(await load('neon/case-state.acceptance.sql')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,'');must(database,fixtures);
  const material=exchangeMaterial(A,B,fields()), terms=await hashMaterialPayload(material);
  must(database,session(A)+`insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('message-ab','${A}','${B}','exchange',${lit(JSON.stringify(material))}::jsonb,'${terms}',now()+interval '14 days');insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('message-ab','${A}',1,'${terms}');`);
  must(database,session(B)+`insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('message-ab','${B}',1,'${terms}');`);
  must(database,session(A)+`insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place) values('${A}','${B}','Message fixture',now()+interval '1 day',20,'Онлайн');`);
  meeting=must(database,`select id from public.meeting_requests;`);
  must(database,session(B)+`update public.meeting_requests set status='accepted' where id='${meeting}';`);
  const migration=await load('neon/message-intent.migration.sql');must(database,migration);
  const intent=randomUUID(),text='Точний Unicode 💛 <script>literal</script>';
  const original=JSON.parse(must(database,session(A)+rpc(intent,text)).split('\n').at(-1));
  assert.deepEqual(JSON.parse(must(database,session(A)+rpc(intent,text)).split('\n').at(-1)),original);
  assert.equal(Number(must(database,`select messages from public.synera_write_limits where user_id='${A}';`)),1);report.checks.push({name:'exact_replay_immutable_row_and_single_rate_charge',pass:true});
  for(const [actor,sql,expected] of [[A,rpc(intent,'Changed'),'Message intent conflict'],[B,rpc(intent,text),'Message intent conflict'],[C,rpc(randomUUID(),text),'Message unavailable'],[A,rpc(randomUUID(),''),'Invalid message']]) {const r=run(database,session(actor)+sql);assert.notEqual(r.status,0);assert.ok(r.stderr.includes(expected),r.stderr);}
  report.checks.push({name:'changed_text_other_actor_outsider_empty_rejected',pass:true});
  must(database,`update public.synera_write_limits set messages=100 where user_id='${A}';`);must(database,session(A)+rpc(intent,text));const limited=run(database,session(A)+rpc(randomUUID()));assert.notEqual(limited.status,0);assert.match(limited.stderr,/Message limit/);
  must(database,`update public.synera_write_limits set messages=1 where user_id='${A}';`);report.checks.push({name:'replay_at_exhausted_daily_quota_and_new_write_denied',pass:true});
  await concurrency('green',true);
  const functionSql=migration.slice(migration.indexOf('create function'),migration.indexOf('revoke all on function'));
  const lock='perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_intent_id::text,0));';assert.equal(functionSql.split(lock).length,2);
  must(database,functionSql.replace('create function','create or replace function').replace(lock,'-- mutation removed transaction lock'));
  await concurrency('mutation_expected_red',false);
  must(database,functionSql.replace('create function','create or replace function'));await concurrency('green_after_restoration',true);
  must(database,`insert into public.profile_blocks(blocker_id,blocked_id) values('${A}','${B}');`);const blocked=run(database,session(A)+rpc(intent,text));assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/Message unavailable/);
  // Denial fixtures roll back; no deletion of base users/data or test DB.
  const anonymous=run(database,'set role anonymous;'+rpc(intent,text));assert.notEqual(anonymous.status,0);assert.match(anonymous.stderr,/permission denied/);
  const privileges=JSON.parse(must(database,"select json_build_object('invoker',not prosecdef,'settings',proconfig,'body_update',has_column_privilege('authenticated','public.meeting_messages','body','UPDATE'),'created_insert',has_column_privilege('authenticated','public.meeting_messages','created_at','INSERT')) from pg_proc where oid='public.synera_send_message(uuid,uuid,text)'::regprocedure;"));assert.equal(privileges.invoker,true);assert.equal(privileges.body_update,false);assert.equal(privileges.created_insert,false);report.privileges=privileges;report.checks.push({name:'block_revokes_replay_anonymous_denied_no_elevation_or_time_forgery',pass:true});
  report.status='PASS_LOCAL_SQL_CONCURRENT_MESSAGE_INTENTS';
} catch(error){report.error=error.message;throw error;} finally {await fs.mkdir(proof,{recursive:true});await fs.writeFile(proof+'/SQL.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({status:report.status,database,checks:report.checks,provider_calls:0}));
