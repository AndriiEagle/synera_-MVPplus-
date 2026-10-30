// Disposable loopback database only. Uses the existing PostgreSQL fixture shim.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {neonAuthShimSql} from '../neon/local_acceptance.mjs';
import {ORDER,migrationInventory,migrationSQL} from './pilot-deploy-kit.mjs';
const host=process.env.SYNERA_ACCEPTANCE_PGHOST||'127.0.0.1',port=process.env.SYNERA_ACCEPTANCE_PGPORT;
assert.ok(['127.0.0.1','::1','localhost'].includes(host)&&/^\d{2,5}$/.test(port||''),'Disposable loopback PGPORT required');
const psql=process.env.SYNERA_ACCEPTANCE_PSQL||'psql',user=process.env.SYNERA_ACCEPTANCE_PGUSER||'postgres';
const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^PG/i.test(k))),PGCLIENTENCODING:'UTF8'};
const run=(db,input)=>spawnSync(psql,['-h',host,'-p',port,'-U',user,'-w','-X','-d',db,'-At','-q','-v','ON_ERROR_STOP=1'],{input,env,encoding:'utf8',timeout:30000,windowsHide:true,maxBuffer:4*1024*1024});
const must=(db,sql)=>{const r=run(db,sql);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const reject=(db,sql,rx)=>{const r=run(db,sql);assert.notEqual(r.status,0,'Unexpected SQL success');assert.match(r.stderr,rx);};
const stamp=Date.now(),db='synera_secure_'+stamp,owner='secure_owner_'+stamp;
const receipt=process.argv.find(x=>x.startsWith('--receipt='))?.slice(10);
const report={status:'NOT_ACCEPTED',scope:'Disposable PostgreSQL with JWT identity shim and NON-SUPERUSER owner; no live Auth, provider deletion or backup proof',source_sha256:{},checks:[]};
const source=async file=>{const bytes=await fs.readFile(file);report.source_sha256[file]=createHash('sha256').update(bytes).digest('hex');return bytes.toString('utf8');};
const check=(name,fn)=>{fn();report.checks.push({name,pass:true});};
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const session=id=>`set role authenticated;select set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false);`;
let created=false,ownerCreated=false;
try {
  const server=JSON.parse(must('postgres',"select json_build_object('host',host(inet_server_addr()),'port',inet_server_port());"));
  assert.ok(['127.0.0.1','::1'].includes(server.host));
  must('postgres',`create database ${db} template template0 encoding 'UTF8';`);created=true;
  must(db,neonAuthShimSql());
  const catalog=await source('neon/catalog_assert.sql');
  check('empty_schema_rejected',()=>reject(db,catalog,/Protected table missing/));
  must(db,`create role ${owner} nologin nosuperuser nobypassrls;`);ownerCreated=true;
  must(db,`grant all on schema public to ${owner};grant usage on schema neon_auth,auth to ${owner};grant references,select on neon_auth."user" to ${owner};grant execute on function auth.uid() to ${owner};`);
  const baseline=await source('neon/schema.proposal.sql'),base=migrationInventory('schema.proposal.sql',baseline),migrations=[];
  must(db,`set role ${owner};\n`+baseline);
  for(const name of ORDER) {const sql=await source('neon/'+name+'.migration.sql');migrations.push({name:name+'.migration.sql',sql,rows:migrationInventory(name+'.migration.sql',sql)});}
  const allRows=[...base,...migrations.flatMap(m=>m.rows)],generated=migrationSQL(base,migrations,allRows);
  // Exercise the actual deploy-kit SQL from baseline, rather than a rewritten copy.
  await fs.mkdir('tmp',{recursive:true});await fs.writeFile('tmp/secure-generated-migrate.sql',generated);
  check('baseline_without_journey_tables_rejected',()=>reject(db,catalog,/Protected table missing: match_cases/));
  must(db,`set role ${owner};\n`+generated);
  check('deploy_kit_generated_migrations_second_apply_is_idempotent',()=>must(db,`set role ${owner};\n`+generated));
  check('all_protected_tables_enabled_forced_and_app_non_bypass',()=>assert.match(must(db,catalog),/SYNERA_RLS_CATALOG_PASS/));
  for(const [name,mutation,rx] of [
    ['no_force','alter table public.profiles no force row level security;',/RLS not ENABLED/],
    ['disabled_rls','alter table public.profiles disable row level security;',/RLS not ENABLED/],
    ['new_unprotected_table','create table public.accidental_private_table(id int);',/RLS not ENABLED/],
    ['missing_table','alter table public.profiles rename to profiles_missing;',/Protected table missing/],
    ['bypassrls','alter role authenticated bypassrls;',/App role can bypass/],
    ['owner_membership',`grant ${owner} to authenticated;`,/App role can assume/],
    ['owner_policy_tampering','alter policy synera_owner_maintenance on public.profiles to authenticated;',/Owner maintenance policy/],
  ])check('catalog_rejects_'+name,()=>reject(db,'begin;'+mutation+catalog,rx));
  must(db,`insert into neon_auth."user"(id,email,"emailVerified") values('${A}','a@demo.invalid',true),('${B}','b@demo.invalid',true);
    insert into public.synera_pilot_members(email) values('a@demo.invalid'),('b@demo.invalid');
    insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values('${A}','2026-09-05-pilot-3',true,true),('${B}','2026-09-05-pilot-3',true,true);`);
  check('non_superuser_definer_membership_still_works',()=>assert.equal(must(db,session(A)+'select public.synera_pilot_member();').split('\n').at(-1),'t'));
  check('existing_profile_write_and_cross_account_isolation_under_force',()=>{
    must(db,session(A)+`insert into public.profiles(id,display_name) values('${A}','Demo A');`);
    must(db,session(B)+`insert into public.profiles(id,display_name) values('${B}','Demo B');`);
    assert.equal(must(db,session(A)+'select count(*) from public.profiles;').split('\n').at(-1),'1');
  });
  const doc='Demo consent',hash=createHash('sha256').update(doc).digest('hex');
  const event=(id,action,digest=hash)=>`insert into public.consent_events(user_id,action,purpose,recipient,document_version,document_text,document_sha256,locale) values('${id}','${action}','local-demo','device','demo-v1','${doc}','${digest}','en');`;
  check('consent_hash_exact_document_append_withdraw_and_no_forgery',()=>{
    must(db,session(A)+event(A,'grant'));
    reject(db,session(A)+event(A,'grant','0'.repeat(64)),/violates check constraint/);
    reject(db,session(A)+event(B,'grant'),/row-level security/);
    reject(db,session(A)+"update public.consent_events set action='withdraw';",/permission denied/);
    must(db,session(A)+event(A,'withdraw'));
    assert.equal(must(db,session(A)+'select count(*) from public.consent_events;').split('\n').at(-1),'2');
    assert.equal(must(db,session(B)+'select count(*) from public.consent_events;').split('\n').at(-1),'0');
  });
  check('complete_application_erasure_still_works_and_removes_new_evidence',()=>{
    assert.match(must(db,session(A)+'select public.synera_complete_erase_application_data();'),/application_data_completely_erased/);
    assert.equal(must(db,'select count(*) from public.consent_events;'),'0');
    assert.equal(must(db,`select count(*) from public.profiles where id='${B}';`),'1');
    assert.equal(must(db,session(A)+'select public.synera_pilot_member();').split('\n').at(-1),'f');
  });
  report.status='PASS_LOCAL_POSTGRESQL';
} catch(error) {report.error=error.message;process.exitCode=1;}
finally {
  if(created)must('postgres',`drop database ${db};`);
  if(ownerCreated)must('postgres',`drop role ${owner};`);
  if(receipt){await fs.mkdir(path.dirname(receipt),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');}
  console.log(JSON.stringify(report));
}
