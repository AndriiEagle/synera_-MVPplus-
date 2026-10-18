// Actual profile UPSERT and erasure RPC under controlled transaction barriers, disposable loopback only.
// --legacy-profile-first reproduces the old erasure row->advisory interleaving. Default tests actor-first.
import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';import {createHash,randomUUID} from 'node:crypto';
const psql=process.env.SYNERA_ACCEPTANCE_PSQL||'psql',host=process.env.SYNERA_ACCEPTANCE_PGHOST||'127.0.0.1';
const port=process.env.SYNERA_ACCEPTANCE_PGPORT||'',user=process.env.SYNERA_ACCEPTANCE_PGUSER||'postgres',base=process.env.SYNERA_ERASURE_REVIEW_BASE_DB||'';
assert.ok(['127.0.0.1','::1','localhost'].includes(host));assert.match(port,/^[0-9]{2,5}$/);assert.match(base,/^synera_erasure_[0-9]+$/);
const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^PG/i.test(k))),PGCLIENTENCODING:'UTF8'};
const args=db=>['-h',host,'-p',port,'-U',user,'-w','-X','-d',db,'-At','-q','-v','ON_ERROR_STOP=1'];
const sql=(db,input)=>spawnSync(psql,args(db),{input,encoding:'utf8',env,timeout:60000,maxBuffer:1024*1024});
const must=(db,input)=>{const r=sql(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const database='synera_erasure_locks_'+Date.now(),legacy=process.argv.includes('--legacy-profile-first');
const report={status:'NOT_ACCEPTED',database,base,legacy_profile_first:legacy,scope:'Disposable SQL identity-shim; actual UPSERT/RPC with transaction barriers',checks:[],source_sha256:{}};
for(const name of ['neon/profile-erasure.migration.sql','tools/profile-erasure-lock-review.mjs'])report.source_sha256[name]=createHash('sha256').update(await fs.readFile(name)).digest('hex');
const receipt=process.argv.find(a=>a.startsWith('--receipt='))?.slice(10);assert.ok(receipt);
const completion=p=>new Promise((resolve,reject)=>{let stdout='',stderr='';p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);p.on('error',reject);p.on('close',code=>resolve({code,stdout,stderr}));});
const actor=id=>`set role authenticated;do $$ begin perform set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false);end $$;`;
async function scenario(existing,order){
  const id=randomUUID(),email=id+'@erasure-lock.example',tag='erasure_lock_'+id;
  must(database,`insert into neon_auth."user"(id,name,email,"emailVerified") values('${id}','Lock fixture','${email}',true);insert into public.synera_pilot_members(email) values('${email}');insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values('${id}','2026-09-05-pilot-3',true,true);`+(existing?`insert into public.profiles(id,display_name) values('${id}','Original');`:''));
  const upsert=`insert into public.profiles(id,display_name) values('${id}','Updated') on conflict(id) do update set display_name=excluded.display_name;`;
  const rpc='select public.synera_erase_profile_data();';
  const prelock=legacy?`select id from public.profiles where id='${id}' for update;`:`select pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('${id}',17017));`;
  const leader=spawn(psql,args(database),{env,stdio:['pipe','pipe','pipe']}),leaderDone=completion(leader);
  const barrier=new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Leader barrier timeout')),4000);leader.stdout.on('data',b=>{out+=b;if(out.includes('LOCK_READY')){clearTimeout(timer);resolve();}});});
  leader.stdin.write('begin;'+actor(id)+(order==='erase-first'?prelock:upsert)+"select 'LOCK_READY';\n");await barrier;
  const follower=spawn(psql,args(database),{env:{...env,PGAPPNAME:tag},stdio:['pipe','pipe','pipe']}),followerDone=completion(follower);
  follower.stdin.end(actor(id)+(order==='erase-first'?upsert:rpc));
  try{
    let blocked=false;const deadline=Date.now()+3000;
    while(Date.now()<deadline){blocked=must(database,`select count(*) from pg_stat_activity where application_name='${tag}' and wait_event_type='Lock';`)==='1';if(blocked)break;await new Promise(r=>setTimeout(r,25));}
    assert.equal(blocked,true,'Follower must overlap and wait');
  }finally{leader.stdin.end((order==='erase-first'?rpc:'')+'commit;\n');}
  const [a,b]=await Promise.all([leaderDone,followerDone]);
  const trace={name:(existing?'existing':'missing')+'_'+order,leader_code:a.code,follower_code:b.code,leader_error:a.stderr,follower_error:b.stderr};report.checks.push(trace);
  assert.equal(a.code,0,'Erasure/UPSERT leader deadlocked or timed out: '+a.stderr);
  if(order==='erase-first'){assert.notEqual(b.code,0,'Stale UPSERT after committed erasure succeeded');assert.match(b.stderr,/Profile deactivated|row-level security/);}
  else assert.equal(b.code,0,b.stderr);
  assert.equal(must(database,`select count(*) from public.profile_erasures where user_id='${id}';`),'1');
  assert.equal(must(database,`select count(*) from public.profiles where id='${id}' and display_name<>'Deleted profile';`),'0');
  trace.pass=true;
}
try{
  must('postgres',`create database ${database} template ${base};`);
  for(const existing of legacy?[true]:[true,false])for(const order of legacy?['erase-first']:['erase-first','upsert-first'])await scenario(existing,order);
  for(const [name,hash]of Object.entries(report.source_sha256))assert.equal(createHash('sha256').update(await fs.readFile(name)).digest('hex'),hash,'Source drift during locks review');
  report.status='PASS_ERASURE_PROFILE_UPSERT_LOCKS';
}catch(error){report.error=error.message;throw error;}finally{await fs.mkdir(path.dirname(receipt),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
