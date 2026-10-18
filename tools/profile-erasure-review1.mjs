// Targeted review on a fresh copy of an explicitly named disposable acceptance database.
// Never modifies the accepted base DB. No provider, install, production or database deletion.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const psql=process.env.SYNERA_ACCEPTANCE_PSQL||'psql',port=process.env.SYNERA_ACCEPTANCE_PGPORT||'';
const host=process.env.SYNERA_ACCEPTANCE_PGHOST||'127.0.0.1',user=process.env.SYNERA_ACCEPTANCE_PGUSER||'postgres';
const base=process.env.SYNERA_ERASURE_REVIEW_BASE_DB||'';
assert.match(base,/^synera_erasure_[0-9]+$/);assert.match(port,/^[0-9]{2,5}$/);assert.ok(['127.0.0.1','::1','localhost'].includes(host));
const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^PG/i.test(k))),PGCLIENTENCODING:'UTF8'};
const args=db=>['-h',host,'-p',port,'-U',user,'-w','-X','-d',db,'-At','-q','-v','ON_ERROR_STOP=1'];
const sql=(db,input)=>spawnSync(psql,args(db),{input,encoding:'utf8',env,timeout:60000,maxBuffer:1024*1024});
const must=(db,input)=>{const r=sql(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const B='22222222-2222-4222-8222-222222222222',database='synera_erasure_review1_'+Date.now();
const actor=`set role authenticated;do $$ begin perform set_config('request.jwt.claims','{"sub":"${B}","role":"authenticated"}',false);end $$;`;
const applyGuard=process.argv.includes('--apply-current-guard');
const report={status:'NOT_ACCEPTED',database,base,guard_applied:applyGuard,scope:'Fresh disposable copy; identity shim only',checks:[],source_sha256:{}};
for(const name of ['neon/profile-erasure.migration.sql','neon/case-outcome.migration.sql','tools/profile-erasure-review1.mjs'])report.source_sha256[name]=createHash('sha256').update(await fs.readFile(name)).digest('hex');
const receipt=process.argv.find(a=>a.startsWith('--receipt='))?.slice(10);assert.ok(receipt);
const completion=child=>new Promise((resolve,reject)=>{let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('error',reject);child.on('close',code=>resolve({code,stdout,stderr}));});
try{
  must('postgres',`create database ${database} template ${base};`);
  if(applyGuard){
    const migration=await fs.readFile('neon/profile-erasure.migration.sql','utf8');
    const guard=migration.split('-- PROFILE-ERASURE-OUTCOME-GUARD-BEGIN\n')[1]?.split('\n-- PROFILE-ERASURE-OUTCOME-GUARD-END')[0];
    assert.ok(guard&&guard.includes('create or replace function public.synera_case_outcome'));
    must(database,guard);
  }
  const absent=sql(database,actor+`select public.synera_case_outcome('missing-case','{"action":"state","version":1,"termsHash":"${'a'.repeat(64)}"}'::jsonb);`);
  assert.notEqual(absent.status,0,'Missing case admitted by derived guard');assert.match(absent.stderr,/Outcome unavailable/);
  report.checks.push({name:'missing_case_preserves_original_authorization',pass:true});
  const hash=must(database,"select terms_hash from public.match_cases where case_id='erase-ab';");
  const lock=spawn(psql,args(database),{env,stdio:['pipe','pipe','pipe']}),lockedDone=completion(lock);
  const ready=new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Case lock barrier timeout')),4000);lock.stdout.on('data',b=>{out+=b;if(out.includes('CASE_LOCK_READY')){clearTimeout(timer);resolve();}});});
  lock.stdin.write("begin;select case_id from public.match_cases where case_id='erase-ab' for update;select 'CASE_LOCK_READY';\n");await ready;
  const tag='synera_erasure_review1_waiter_'+Date.now();
  const wait=spawn(psql,args(database),{env:{...env,PGAPPNAME:tag},stdio:['pipe','pipe','pipe']}),waitDone=completion(wait);
  wait.stdin.end(actor+`select public.synera_case_outcome('erase-ab','{"action":"state","version":1,"termsHash":"${hash}"}'::jsonb);`);
  try{
    let blocked=false;const deadline=Date.now()+3000;
    while(Date.now()<deadline){blocked=must(database,`select count(*) from pg_stat_activity where application_name='${tag}' and wait_event_type='Lock';`)==='1';if(blocked)break;await new Promise(r=>setTimeout(r,25));}
    assert.equal(blocked,true,'Outcome request must pass initial member check then block on case lock');
    const result=JSON.parse(must(database,actor+'select public.synera_erase_profile_data();'));assert.equal(result.status,'application_data_erased');
    assert.equal(must(database,actor+'select public.synera_pilot_member();'),'f');
  }finally{lock.stdin.end('commit;\n');}
  const [,result]=await Promise.all([lockedDone,waitDone]);
  report.checks.push({name:'outcome_waiter_denied_after_erasure_commit',pass:result.code!==0,code:result.code,stderr:result.stderr,returned_sensitive_state:result.code===0&&result.stdout.includes('deliverables')});
  assert.notEqual(result.code,0,'Outcome RPC admitted before case lock disclosed retained state after erasure committed');
  assert.match(result.stderr,/Outcome unavailable|Profile deactivated/);
  // Reverse ordering: a valid outcome already admitted holds the actor profile until transaction end.
  const reverse=database+'_reverse';must('postgres',`create database ${reverse} template ${base};`);
  if(applyGuard){const migration=await fs.readFile('neon/profile-erasure.migration.sql','utf8');must(reverse,migration.split('-- PROFILE-ERASURE-OUTCOME-GUARD-BEGIN\n')[1].split('\n-- PROFILE-ERASURE-OUTCOME-GUARD-END')[0]);}
  const admitted=spawn(psql,args(reverse),{env,stdio:['pipe','pipe','pipe']}),admittedDone=completion(admitted);
  const admittedReady=new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Admitted outcome barrier timeout')),4000);admitted.stdout.on('data',b=>{out+=b;if(out.includes('OUTCOME_ADMITTED')){clearTimeout(timer);resolve();}});});
  admitted.stdin.write('begin;'+actor+`select public.synera_case_outcome('erase-ab','{"action":"state","version":1,"termsHash":"${hash}"}'::jsonb);select 'OUTCOME_ADMITTED';\n`);await admittedReady;
  const reverseTag=tag+'_reverse';
  const eraser=spawn(psql,args(reverse),{env:{...env,PGAPPNAME:reverseTag},stdio:['pipe','pipe','pipe']}),eraserDone=completion(eraser);
  eraser.stdin.end(actor+'select public.synera_erase_profile_data();');
  try{
    let blocked=false;const deadline=Date.now()+3000;
    while(Date.now()<deadline){blocked=must(reverse,`select count(*) from pg_stat_activity where application_name='${reverseTag}' and wait_event_type='Lock';`)==='1';if(blocked)break;await new Promise(r=>setTimeout(r,25));}
    assert.equal(blocked,true,'Erasure must wait for the admitted outcome transaction');
    assert.equal(must(reverse,`select count(*) from public.profile_erasures where user_id='${B}';`),'0');
  }finally{admitted.stdin.end('commit;\n');}
  const [admittedResult,erased]=await Promise.all([admittedDone,eraserDone]);assert.equal(admittedResult.code,0,admittedResult.stderr);assert.equal(erased.code,0,erased.stderr);
  assert.equal(JSON.parse(erased.stdout.trim()).status,'application_data_erased');
  report.checks.push({name:'erasure_waits_for_already_admitted_outcome_transaction',pass:true,database:reverse});
  for(const [name,hash] of Object.entries(report.source_sha256))assert.equal(createHash('sha256').update(await fs.readFile(name)).digest('hex'),hash,'Source drift during review: '+name);
  report.status='PASS_ERASURE_REVIEW1_CONCURRENT_OUTCOME';
}catch(error){report.error=error.message;throw error;}finally{
  await fs.mkdir(path.dirname(receipt),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify(report));
