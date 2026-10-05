// Reuses the existing PG16 psql/shim/fixtures route. Loopback-only; never cloud or DSN.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {neonAuthShimSql} from '../neon/local_acceptance.mjs';
import {exchangeMaterial} from '../web_launch/real-journey-client.mjs';
import {hashMaterialPayload} from '../web_launch/business-case.mjs';
import {A,B,C,fields} from './fixtures/real-journey-fixture.mjs';
const proof='artifacts/pilot-hardening-20261005',runtime='C:/Users/Andrii/.codex/tmp/synera-pg16-20261003',bin=path.join(runtime,'runtime/pgsql/bin');
const args=['-h','127.0.0.1','-p','55331','-U','synera_acceptance_admin','-w','-X','-At','-v','ON_ERROR_STOP=1'];
const env={...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PG/i.test(key))),PGCLIENTENCODING:'UTF8',PGCONNECT_TIMEOUT:'3'};
const run=(db,input)=>spawnSync(path.join(bin,'psql.exe'),[...args,'-d',db],{input,encoding:'utf8',env,timeout:20000,maxBuffer:1024*1024});
const must=(db,input)=>{const r=run(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const lit=s=>"'"+String(s).replaceAll("'","''")+"'",session=id=>`set role authenticated;select set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false);`;
const report={status:'NOT_ACCEPTED',scope:'Real isolated PostgreSQL16 transactions with local provider identity shim; no signed JWT/live Neon/capacity proof',checks:[],source_sha256:{},provider_calls:0,provider_usd:0};
const load=async file=>{const b=await fs.readFile(file);report.source_sha256[file]=createHash('sha256').update(b).digest('hex');return b.toString();};
let database,meeting;const children=new Set();
const start=(sql,tag)=>{const child=spawn(path.join(bin,'psql.exe'),[...args,'-d',database],{env:{...env,PGAPPNAME:tag},stdio:['pipe','pipe','pipe']});children.add(child);let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);const done=new Promise(resolve=>{const timer=setTimeout(()=>child.kill(),15000);child.on('error',error=>{clearTimeout(timer);resolve({code:null,error:error.message});});child.on('exit',code=>{clearTimeout(timer);children.delete(child);resolve({code,stdout,stderr});});});if(sql)child.stdin.end(sql);return {child,done};};
const rpc=(id,body='Synthetic SQL message')=>`select public.synera_send_message('${meeting}','${id}',${lit(body)});`;
const check=async(name,fn)=>{const details=await fn();report.checks.push({name,pass:true,...details});};
try {
  report.server=JSON.parse(must('postgres',"select json_build_object('version',current_setting('server_version'),'data',current_setting('data_directory'),'host',inet_server_addr(),'port',inet_server_port());"));
  assert.equal(report.server.version,'16.15');assert.equal(report.server.host,'127.0.0.1');assert.equal(report.server.port,55331);assert.equal(path.resolve(report.server.data).toLowerCase(),path.resolve(runtime,'data').toLowerCase());
  database='synera_pilot_hardening_'+Date.now();report.database=database;
  const created=spawnSync(path.join(bin,'createdb.exe'),args.slice(0,7).concat(['-T','template0','--encoding=UTF8','--locale-provider=icu','--icu-locale=und',database]),{encoding:'utf8',env,timeout:20000});assert.equal(created.status,0,created.stderr);
  for(const file of ['tools/pilot-hardening-sql.mjs','neon/local_acceptance.mjs','web_launch/real-journey-client.mjs','web_launch/business-case.mjs','tools/fixtures/real-journey-fixture.mjs'])await load(file);
  must(database,neonAuthShimSql());
  for(const file of ['neon/schema.proposal.sql','neon/case-state.migration.sql'])must(database,await load(file));
  const fixtures=(await load('neon/case-state.acceptance.sql')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,'');must(database,fixtures);
  const material=exchangeMaterial(A,B,fields()),terms=await hashMaterialPayload(material);
  must(database,session(A)+`insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('hardening-ab','${A}','${B}','exchange',${lit(JSON.stringify(material))}::jsonb,'${terms}',now()+interval '14 days');insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('hardening-ab','${A}',1,'${terms}');`);
  must(database,session(B)+`insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('hardening-ab','${B}',1,'${terms}');`);
  must(database,session(A)+`insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place) values('${A}','${B}','Synthetic hardening fixture',now()+interval '1 day',20,'Онлайн');`);
  meeting=must(database,'select id from public.meeting_requests;');must(database,session(B)+`update public.meeting_requests set status='accepted' where id='${meeting}';`);
  must(database,await load('neon/message-intent.migration.sql'));
  await check('distinct_intent_burst_respects_atomic_per_actor_limit',async()=>{
    // Seed near-boundary counters, not hundreds of fabricated message sends.
    must(database,`insert into public.synera_write_limits(user_id,messages) values('${B}',94) on conflict(user_id) do update set messages=94;update public.synera_write_limits set messages=98 where user_id='${A}';`);
    const tag='pilot_hardening_'+Date.now(),leader=start(null,tag+'_leader');
    const ready=new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Counter barrier missing')),3000);leader.child.stdout.on('data',b=>{out+=b;if(out.includes('BARRIER_READY')){clearTimeout(timer);resolve();}});});
    leader.child.stdin.write(`begin;select messages from public.synera_write_limits where user_id='${A}' for update;\n\\echo BARRIER_READY\n`);await ready;
    const jobsA=Array.from({length:6},()=>({id:randomUUID()}));for(const job of jobsA)job.job=start(session(A)+rpc(job.id),tag+'_a');
    let waiting=0;const deadline=Date.now()+3000;while(Date.now()<deadline){waiting=Number(must(database,`select count(*) from pg_stat_activity where datname='${database}' and application_name='${tag}_a' and wait_event_type='Lock';`));if(waiting===6)break;await new Promise(r=>setTimeout(r,20));}
    assert.equal(waiting,6,'All six distinct A intents must demonstrably overlap on row lock');
    const jobsB=Array.from({length:6},()=>({id:randomUUID()}));for(const job of jobsB)job.job=start(session(B)+rpc(job.id),tag+'_b');
    const resultsB=await Promise.all(jobsB.map(job=>job.job.done));assert.ok(resultsB.every(r=>r.code===0),JSON.stringify(resultsB));
    leader.child.stdin.end('rollback;\n');assert.equal((await leader.done).code,0);
    const resultsA=await Promise.all(jobsA.map(job=>job.job.done));assert.equal(resultsA.filter(r=>r.code===0).length,2,JSON.stringify(resultsA));
    for(const r of resultsA.filter(r=>r.code!==0))assert.match(r.stderr,/Message limit/);
    assert.equal(must(database,`select string_agg(messages::text,',' order by user_id) from public.synera_write_limits where user_id in ('${A}','${B}');`),'100,100');
    assert.equal(must(database,'select count(*) from public.meeting_messages;'),'8');
    const replay=jobsA[resultsA.findIndex(r=>r.code===0)].id;report.replay_intent=replay;must(database,session(A)+rpc(replay));assert.equal(must(database,'select count(*) from public.meeting_messages;'),'8');
    return {actors:2,distinct_intents:12,a_observed_lock_waiters:6,a_success:2,a_limit_rejections:4,b_success_while_a_locked:6,seeded_counters:{A:98,B:94},final_counters:{A:100,B:100},replay_no_extra_row:true};
  });
  await check('SQL_admission_consent_and_identity_denials_preserve_rows',async()=>{
    const replay=report.replay_intent;
    const cases=[['outsider',session(C)+rpc(randomUUID())],['anonymous','set role anonymous;'+rpc(randomUUID())],['unverified',`begin;update neon_auth."user" set "emailVerified"=false where id='${A}';`+session(A)+rpc(replay)],['removed_admission',`begin;update public.synera_pilot_members set email='not-admitted@example.com' where email='a@synera-acceptance.example';`+session(A)+rpc(replay)],['missing_consent',`begin;insert into neon_auth."user"(id,email) values('44444444-4444-4444-8444-444444444444','consent-holder@example.com');update public.pilot_consents set user_id='44444444-4444-4444-8444-444444444444' where user_id='${A}';`+session(A)+rpc(replay)],['blocked_peer',`begin;insert into public.profile_blocks(blocker_id,blocked_id) values('${A}','${B}');`+session(A)+rpc(replay)],['cancelled_meeting',`begin;update public.meeting_requests set status='cancelled' where id='${meeting}';`+session(A)+rpc(replay)]];
    const observed=[];for(const [name,sql] of cases){const r=run(database,sql+'rollback;');assert.notEqual(r.status,0,name+' unexpectedly accepted');assert.match(r.stderr,/Message unavailable|permission denied for function synera_send_message/,name+': '+r.stderr);observed.push({name,rejected:true,error:r.stderr.trim()});}
    assert.equal(must(database,'select count(*) from public.meeting_messages;'),'8');return {cases:observed};
  });
  await check('daily_quota_guard_mutation_is_rejected_and_rolled_back',async()=>{
    const original=must(database,"select pg_get_functiondef('public.synera_limit_writes()'::regprocedure);");
    const needle='counter.messages >= 100';assert.equal(original.split(needle).length,2);
    const id=randomUUID();const baseline=run(database,session(A)+rpc(id));assert.notEqual(baseline.status,0);assert.match(baseline.stderr,/Message limit/);
    // Same semantic oracle, deliberate defective limit, only in one rollback transaction.
    const mutant=run(database,'begin;'+original.replace(needle,'counter.messages >= 101')+';'+session(A)+rpc(id)+'rollback;');
    assert.equal(mutant.status,0,mutant.stderr);let caught=false;try{assert.notEqual(mutant.status,0,'New intent accepted at exhausted daily quota');}catch{caught=true;}assert.ok(caught);
    assert.equal(must(database,"select pg_get_functiondef('public.synera_limit_writes()'::regprocedure);"),original);
    assert.equal(must(database,'select count(*) from public.meeting_messages;'),'8');
    return {verdict:'MUTANT_REJECTED',baseline_exit:baseline.status,mutant_exit:mutant.status,semantic_failure:'New intent accepted at exhausted daily quota',restored_by_rollback:true};
  });
  report.status='PASS_LOCAL_SQL_DISTINCT_INTENTS';
}catch(error){report.status='FAIL';report.error=error.message;process.exitCode=1;}
finally {for(const child of children)child.kill();for(const [file,digest] of Object.entries(report.source_sha256))assert.equal(createHash('sha256').update(await fs.readFile(file)).digest('hex'),digest);await fs.mkdir(proof,{recursive:true});await fs.writeFile(proof+'/SQL.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));


