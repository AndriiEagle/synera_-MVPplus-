// Fresh loopback PostgreSQL only. Preserve the created disposable DB for inspection; no cloud or install.
// SYNERA_ACCEPTANCE_PSQL=/path/to/psql SYNERA_ACCEPTANCE_PGPORT=55432 node tools/profile-erasure-sql-acceptance.mjs --receipt=path.json
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {neonAuthShimSql} from '../neon/local_acceptance.mjs';
import {exchangeMaterial} from '../web_launch/real-journey-client.mjs';
import {hashMaterialPayload} from '../web_launch/business-case.mjs';
import {A,B,C,fields} from './fixtures/real-journey-fixture.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const psql=process.env.SYNERA_ACCEPTANCE_PSQL||'psql',host=process.env.SYNERA_ACCEPTANCE_PGHOST||'127.0.0.1';
const port=process.env.SYNERA_ACCEPTANCE_PGPORT||'',user=process.env.SYNERA_ACCEPTANCE_PGUSER||'postgres';
assert.ok(['127.0.0.1','::1','localhost'].includes(host)&&/^\d{2,5}$/.test(port),'Disposable loopback PGPORT required');
const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^PG/i.test(k))),PGCLIENTENCODING:'UTF8'};
const args=db=>['-h',host,'-p',port,'-U',user,'-w','-X','-d',db,'-At','-q','-v','ON_ERROR_STOP=1'];
const sql=(db,input)=>spawnSync(psql,args(db),{input,encoding:'utf8',env,timeout:30000,maxBuffer:4*1024*1024});
const must=(db,input)=>{const r=sql(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const lit=s=>"'"+s.replaceAll("'","''")+"'",session=id=>`set role authenticated;do $$ begin perform set_config('request.jwt.claims','${JSON.stringify({sub:id,role:'authenticated'})}',false);end $$;`;
const database='synera_erasure_'+Date.now(),receiptArg=process.argv.find(a=>a.startsWith('--receipt='));
const receipt=receiptArg?path.resolve(receiptArg.slice(10)):null;
const report={status:'NOT_ACCEPTED',database,scope:'Disposable loopback PostgreSQL identity shim only; no signed JWT, live Neon, provider deletion or deployment',checks:[],source_sha256:{},provider_calls:0,provider_usd:0};
const read=async name=>{const b=await fs.readFile(path.join(root,name));report.source_sha256[name]=createHash('sha256').update(b).digest('hex');return b.toString('utf8');};
const check=(name,f)=>{f();report.checks.push({name,pass:true});};
const reject=(actor,statement,pattern)=>{const r=sql(database,session(actor)+statement);assert.notEqual(r.status,0,'Unexpected acceptance: '+statement);assert.match(r.stderr,pattern);};
const rpc='select public.synera_erase_profile_data();';
const completion=child=>new Promise((resolve,reject)=>{
  let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
  child.on('error',reject);child.on('close',code=>code===0?resolve(out):reject(Error(err)));
});
async function overlappingErasure() {
  const tag='synera_erasure_overlap_'+Date.now();
  const leader=spawn(psql,args(database),{env:{...env,PGAPPNAME:tag+'_leader'},stdio:['pipe','pipe','pipe']});
  const leaderDone=completion(leader);
  const barrier=new Promise((resolve,reject)=>{
    let out='';const timer=setTimeout(()=>reject(Error('Erasure leader barrier timeout')),6000);
    leader.stdout.on('data',b=>{out+=b;if(out.includes('ERASURE_BARRIER')){clearTimeout(timer);resolve();}});
  });
  leader.stdin.write('begin;'+session(A)+rpc+"select 'ERASURE_BARRIER';\n");
  await barrier;
  const follower=spawn(psql,args(database),{env:{...env,PGAPPNAME:tag+'_follower'},stdio:['pipe','pipe','pipe']});
  const followerDone=completion(follower);follower.stdin.end(session(A)+rpc);
  try {
    let waiting=false;const deadline=Date.now()+3500;
    while(Date.now()<deadline){
      waiting=must(database,`select count(*) from pg_stat_activity where application_name='${tag}_follower' and wait_event_type='Lock';`)==='1';
      if(waiting)break;await new Promise(r=>setTimeout(r,30));
    }
    assert.equal(waiting,true,'Retry must overlap uncommitted erasure and wait on its lock');
  }finally{leader.stdin.end('commit;\n');}
  const [first,second]=await Promise.all([leaderDone,followerDone]);
  const initial=JSON.parse(first.split('\n').find(line=>line.startsWith('{'))),retry=JSON.parse(second.trim());
  assert.deepEqual(retry,{...initial,repeated:true});report.checks.push({name:'overlapping_erasure_waits_and_replays_once',pass:true});
  return initial;
}
try {
  await read('tools/profile-erasure-sql-acceptance.mjs');
  report.server=JSON.parse(must('postgres',"select json_build_object('version',current_setting('server_version'),'host',host(inet_server_addr()),'port',inet_server_port());"));
  assert.ok(['127.0.0.1','::1'].includes(report.server.host));
  must('postgres',`create database ${database} template template0 encoding 'UTF8';`);
  must(database,neonAuthShimSql());
  for(const file of ['neon/schema.proposal.sql','neon/case-state.migration.sql','neon/meeting-status-guard.migration.sql','neon/meeting-location.migration.sql','neon/group-room.migration.sql','neon/case-outcome.migration.sql','neon/meeting-address-agreement.migration.sql','neon/message-intent.migration.sql'])must(database,await read(file));
  const fixture=(await read('neon/case-state.acceptance.sql')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,'');must(database,fixture);
  const material=exchangeMaterial(A,B,fields()),hash=await hashMaterialPayload(material);
  must(database,session(A)+`update public.profiles set display_name='PERSONAL A',city='Zürich',map_visible=true where id='${A}';insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('erase-ab','${A}','${B}','exchange',${lit(JSON.stringify(material))}::jsonb,'${hash}',now()+interval '14 days');insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('erase-ab','${A}',1,'${hash}');`);
  must(database,session(B)+`insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('erase-ab','${B}',1,'${hash}');`);
  must(database,session(A)+`insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place) values('${A}','${B}','Retained bilateral personal text',now()+interval '1 day',20,'Zürich');`);
  const meeting=must(database,'select id from public.meeting_requests;');
  must(database,session(B)+`update public.meeting_requests set status='accepted' where id='${meeting}';`);
  const room=JSON.parse(must(database,session(A)+`select public.synera_room_create('Shared title','Shared goal',array['${B}'::uuid]);`).split('\n').at(-1)).id;
  assert.ok(room,'Real room RPC must return a room ID');
  must(database,session(A)+`select public.synera_send_message('${meeting}','${randomUUID()}','Shared retained message');`);
  for(const actor of [A,B])must(database,session(actor)+`select public.synera_location_grant('${meeting}','approximate',15,true,'${randomUUID()}');`);
  assert.equal(must(database,"select count(*) from public.meeting_location_grants where status='active';"),'2');
  const before=must(database,`select json_build_object('profiles',(select json_agg(p order by id) from public.profiles p),'meetings',(select json_agg(m order by id) from public.meeting_requests m))::text;`);
  const migration=await read('neon/profile-erasure.migration.sql');must(database,migration);
  check('legacy_delete_still_rejected_by_room_restrict',()=>reject(A,`delete from public.profiles where id='${A}';`,/foreign key/));
  check('anonymous_null_and_arbitrary_target_denied',()=>{
    const anon=sql(database,'set role anonymous;'+rpc);assert.notEqual(anon.status,0);assert.match(anon.stderr,/permission denied/);
    reject('',rpc,/Erasure unavailable/);reject('44444444-4444-4444-8444-444444444444',rpc,/Erasure unavailable/);
    reject(A,`select public.synera_erase_profile_data('${B}'::uuid);`,/does not exist/);
  });
  // Force failure after the profile/name update: whole RPC statement must roll back.
  must(database,`create function public.erasure_test_failure() returns trigger language plpgsql as $$ begin raise exception 'INJECTED_ERASURE_FAILURE'; end $$;create trigger erasure_test_failure before insert on public.profile_erasures for each row execute function public.erasure_test_failure();`);
  check('late_failure_rolls_back_profile_names_and_tombstone',()=>{
    reject(A,rpc,/INJECTED_ERASURE_FAILURE/);
    assert.equal(must(database,`select count(*) from public.profile_erasures;`),'0');
    assert.equal(must(database,"select count(*) from public.meeting_location_grants where status='active';"),'2');
    assert.equal(must(database,`select json_build_object('profiles',(select json_agg(p order by id) from public.profiles p),'meetings',(select json_agg(m order by id) from public.meeting_requests m))::text;`),before);
  });
  must(database,'drop trigger erasure_test_failure on public.profile_erasures;');
  const erased=await overlappingErasure();
  check('self_only_atomic_profile_and_name_erasure_retains_shared_graph',()=>{
    assert.deepEqual(erased,{status:'application_data_erased',providerDeletion:'pending',retainedScope:'bilateral_records_and_safety_evidence',repeated:false});
    const profile=JSON.parse(must(database,`select row_to_json(p) from public.profiles p where id='${A}';`));
    assert.equal(profile.display_name,'Deleted profile');for(const key of ['city','offers','seeks'])assert.equal(profile[key],'');
    assert.equal(profile.brief.goal,'');assert.deepEqual(profile.brief.offer_tags,[]);assert.equal(profile.is_discoverable,false);assert.equal(profile.map_visible,false);
    assert.equal(must(database,`select count(*) from public.group_room_members where user_id='${A}';`),'1');
    assert.equal(must(database,`select count(*) from public.meeting_messages where sender_id='${A}';`),'1');
    assert.equal(must(database,`select sender_name from public.meeting_requests where id='${meeting}';`),'Deleted profile');
    assert.equal(must(database,`select count(*) from neon_auth."user" where id='${A}';`),'1');
    assert.equal(must(database,`select count(*) from public.match_case_approvals where case_id='erase-ab';`),'2');
    const previous=JSON.parse(before).profiles.filter(p=>p.id!==A);
    const current=JSON.parse(must(database,`select json_agg(p order by id) from public.profiles p where id<>'${A}';`));
    assert.deepEqual(current,previous,'Other profiles must be unchanged');
    assert.equal(must(database,"select count(*) from public.meeting_location_grants where status='active';"),'0');
    assert.equal(must(database,"select count(*) from public.meeting_location_grants where status='revoked' and revoked_at is not null;"),'2');
  });
  check('repeat_is_deterministic_even_without_membership',()=>{
    const again=JSON.parse(must(database,session(A)+rpc).split('\n').at(-1));assert.deepEqual(again,{...erased,repeated:true});
    assert.equal(must(database,'select count(*) from public.profile_erasures;'),'1');
  });
  check('stale_jwt_cannot_read_republish_recreate_or_use_room_and_messages',()=>{
    assert.equal(must(database,session(A)+'select public.synera_pilot_member();').split('\n').at(-1),'f');
    assert.equal(must(database,session(A)+'select count(*) from public.profiles;').split('\n').at(-1),'0');
    assert.equal(must(database,session(A)+`update public.profiles set display_name='RECREATED',is_discoverable=true where id='${A}' returning id;`),'');
    reject(A,`insert into public.profiles(id,display_name) values('${A}','RECREATED');`,/Profile deactivated|row-level security/);
    assert.equal(must(database,session(A)+'select public.synera_room_list();'),'[]');
    reject(A,`select public.synera_room_get('${room}');`,/Room unavailable/);
    reject(A,`select public.synera_case_outcome('erase-ab','{"action":"view"}'::jsonb);`,/Outcome unavailable/);
    const location=JSON.parse(must(database,session(A)+`select public.synera_location_access('${meeting}');`));
    assert.equal(location.eligible,false);assert.equal(location.own,null);assert.equal(location.peer,null);assert.equal(location.meeting,null);
    reject(A,`select public.synera_send_message('${meeting}','${randomUUID()}','Stale send');`,/unavailable|permission|row-level security/i);
    assert.equal(must(database,`select display_name from public.profiles where id='${A}';`),'Deleted profile');
  });
  check('peer_cannot_discover_erased_profile_and_keeps_bilateral_evidence',()=>{
    assert.equal(must(database,session(B)+`select count(*) from public.profiles where id='${A}';`).split('\n').at(-1),'0');
    assert.equal(must(database,session(B)+`select count(*) from public.meeting_messages where meeting_id='${meeting}';`).split('\n').at(-1),'1');
  });
  check('tombstone_is_not_readable_writable_by_authenticated',()=>{
    reject(B,'select * from public.profile_erasures;',/permission denied/);
    reject(B,`delete from public.profile_erasures where user_id='${A}';`,/permission denied/);
  });
  // A semantic mutation proves the stale-JWT oracle detects weakened admission.
  const member= migration.match(/create or replace function public\.synera_pilot_member\(\)[\s\S]*?\$\$;/)[0];
  // Isolate the UUID tombstone guard even after email admission was deliberately withdrawn.
  // An operator re-admitting the old email must still be unable to revive the erased old sub.
  must(database,`insert into public.synera_pilot_members(email) select lower(email) from neon_auth."user" where id='${A}';`);
  assert.equal(must(database,session(A)+'select public.synera_pilot_member();'),'f');
  must(database,member.replace('and not exists(select 1 from public.profile_erasures e where e.user_id=u.id)',''));
  try {
    check('mutation_expected_red_stale_jwt_admission',()=>assert.throws(
      ()=>assert.equal(must(database,session(A)+'select public.synera_pilot_member();'),'f','Stale JWT admitted after erasure'),
      /Stale JWT admitted after erasure/));
  } finally {
    must(database,member);
    must(database,`delete from public.synera_pilot_members m using neon_auth."user" u where u.id='${A}' and m.email=lower(u.email);`);
  }
  assert.equal(must(database,session(A)+'select public.synera_pilot_member();').split('\n').at(-1),'f');
  const surfaces=must(database,await read('neon/profile-erasure-surfaces.acceptance.sql'));
  assert.match(surfaces,/PROFILE_ERASURE_ALL_SURFACES_PASS/);
  report.checks.push({name:'all_authenticated_data_surfaces_after_deactivation',pass:true,rolled_back:true});
  const lifecycle=must(database,await read('neon/profile-erasure-lifecycle.acceptance.sql'));
  assert.match(lifecycle,/PROFILE_ERASURE_LIFECYCLE_PASS/);
  report.checks.push({name:'fresh_provider_sub_cannot_inherit_erased_email_admission',pass:true,rolled_back:true});
  report.status='PASS_LOCAL_PROFILE_ERASURE_SQL';
}catch(error){report.error=error.message;throw error;}finally{
  if(receipt){await fs.mkdir(path.dirname(receipt),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');}
}
console.log(JSON.stringify(report,null,2));
