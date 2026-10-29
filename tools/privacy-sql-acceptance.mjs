// Fresh loopback PostgreSQL only; creates and drops one disposable database.
// No cloud, provider, Auth/KV, deployment, or scheduler call is made here.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
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
const run=(db,input)=>spawnSync(psql,args(db),{input,encoding:'utf8',env,timeout:30000,maxBuffer:4*1024*1024});
const must=(db,input)=>{const r=run(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const reject=(db,input,rx)=>{const r=run(db,input);assert.notEqual(r.status,0,'unexpected SQL success');assert.match(r.stderr,rx);};
const lit=s=>"'"+s.replaceAll("'","''")+"'";
const session=id=>`set role authenticated;select set_config('request.jwt.claims','{"sub":"${id}","role":"authenticated"}',false);`;
const database='synera_privacy_'+Date.now(),receiptArg=process.argv.find(a=>a.startsWith('--receipt='));
const receipt=receiptArg?path.resolve(receiptArg.slice(10)):null;
const report={status:'NOT_ACCEPTED',database,scope:'Disposable loopback PostgreSQL identity shim; no signed JWT, Neon Auth/KV, backup or deployment',provider_calls:0,provider_usd:0,checks:[],source_sha256:{}};
const source=async file=>{const b=await fs.readFile(path.join(root,file));report.source_sha256[file]=createHash('sha256').update(b).digest('hex');return b.toString('utf8');};
const check=(name,fn)=>{fn();report.checks.push({name,pass:true});};
try {
  report.server=JSON.parse(must('postgres',"select json_build_object('host',host(inet_server_addr()),'port',inet_server_port());"));
  assert.ok(['127.0.0.1','::1'].includes(report.server.host));
  must('postgres',`create database ${database} template template0 encoding 'UTF8';`);must(database,neonAuthShimSql());
  for(const file of ['neon/schema.proposal.sql','neon/case-state.migration.sql','neon/meeting-status-guard.migration.sql','neon/meeting-location.migration.sql','neon/group-room.migration.sql','neon/case-outcome.migration.sql','neon/meeting-address-agreement.migration.sql','neon/message-intent.migration.sql','neon/profile-erasure.migration.sql','neon/privacy-complete-erasure.migration.sql','neon/privacy-retention-purge.migration.sql'])must(database,await source(file));
  // The shared disposal fixture creates verified A/B/C and their profiles/consents.
  const fixture=(await source('neon/case-state.acceptance.sql')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,'');must(database,fixture);
  const materialAB=exchangeMaterial(A,B,fields()),materialBC=exchangeMaterial(B,C,fields());
  const hashAB=await hashMaterialPayload(materialAB),hashBC=await hashMaterialPayload(materialBC);
  // Seed a complete data graph without exercising application writes; this is a
  // postgres-only fixture and the behavioural checks execute through RLS/RPCs.
  must(database,`set session_replication_role=replica;
    insert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place,sender_name,recipient_name,meeting_address) values
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','${A}','${B}','A private meeting','accepted',now()+interval '1 day',20,'Онлайн','A','B','Private address'),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','${B}','${A}','B private meeting','accepted',now()+interval '1 day',20,'Онлайн','B','A','Peer address'),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','${B}','33333333-3333-4333-8333-333333333333','expired','pending',now()-interval '1 day',20,'Онлайн','B','C',''),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','${B}','33333333-3333-4333-8333-333333333333','future','pending',now()+interval '1 day',20,'Онлайн','B','C',''),
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5','${B}','33333333-3333-4333-8333-333333333333','legacy expired','pending',null,20,'Онлайн','B','C','');
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values
      ('privacy-ab','${A}','${B}','exchange',${lit(JSON.stringify(materialAB))}::jsonb,'${hashAB}',now()+interval '1 day'),
      ('privacy-bc','${B}','${C}','exchange',${lit(JSON.stringify(materialBC))}::jsonb,'${hashBC}',now()+interval '1 day');
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('privacy-ab','${A}',1,'${hashAB}');
    insert into public.meeting_location_grants(meeting_id,grantor_id,recipient_id,precision,lead_minutes,opens_at,closes_at,status,case_id,case_version,case_hash,meeting_time,meeting_duration,meeting_place,meeting_address,intent_id) values
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','${A}','${B}','approximate',15,now(),now()+interval '1 hour','active','privacy-ab',1,'${hashAB}',now(),20,'Онлайн','Private address','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1');
    insert into public.location_consent_intents(intent_id,meeting_id,grantor_id,created_at) values
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','${A}',now()),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','${B}',now()-interval '31 days'),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','${B}',now()-interval '29 days'),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','${B}',now()-interval '31 days');
    insert into public.meeting_location_grants(meeting_id,grantor_id,recipient_id,precision,lead_minutes,opens_at,closes_at,status,case_id,case_version,case_hash,meeting_time,meeting_duration,meeting_place,meeting_address,intent_id) values
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4','${B}','${C}','approximate',15,now(),now()+interval '1 hour','active','privacy-bc',1,'${hashBC}',now(),20,'Онлайн','','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4');
    insert into public.meeting_address_events(meeting_id,case_id,case_version,terms_hash,actor_id,kind,proposal_id,intent_id,address,meeting_snapshot,payload) values
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','privacy-ab',1,'${hashAB}','${A}','propose','cccccccc-cccc-4ccc-8ccc-ccccccccccc1','cccccccc-cccc-4ccc-8ccc-ccccccccccc1','Private address','{}','{}');
    insert into public.match_outcome_events(case_id,material_version,terms_hash,deliverable_index,actor_id,kind,intent_id,payload) values
      ('privacy-ab',1,'${hashAB}',0,'${A}','submit','dddddddd-dddd-4ddd-8ddd-ddddddddddd1','{}');
    insert into public.group_rooms(id,creator_id,title,goal,status,revision,closed_at) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','${A}','Private room','Private goal','closed',1,now());
    insert into public.group_rooms(id,creator_id,title,goal,status,revision,turn_position,turn_deadline,turn_started_revision,activated_at) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2','${B}','Peer room','Peer goal','active',2,1,now()+interval '1 hour',2,now());
    insert into public.group_room_members(room_id,user_id,position,role,membership_status,accepted_at) values
      ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','${A}',0,'creator','accepted',now()),('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','${B}',1,'member','accepted',now());
    insert into public.group_room_members(room_id,user_id,position,role,membership_status,accepted_at) values
      ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2','${B}',0,'creator','accepted',now()),('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2','${A}',1,'member','accepted',now());
    insert into public.group_room_messages(room_id,message_id,sender_id,room_revision,body) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1','ffffffff-ffff-4fff-8fff-fffffffffff1','${A}',1,'Private room message');
    insert into public.group_room_messages(room_id,message_id,sender_id,room_revision,body) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2','ffffffff-ffff-4fff-8fff-fffffffffff2','${B}',2,'Peer room message');
    insert into public.group_room_events(room_id,revision,event_type,actor_id) values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',1,'created','${A}'),('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',1,'created','${B}'),('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',2,'accepted','${B}');
    insert into public.profile_blocks(blocker_id,blocked_id) values('${A}','${B}');
    insert into public.profile_reports(reporter_id,reported_id,reason,detail) values('${A}','${B}','other','Private report'),('${B}','${A}','other','Safety evidence');
    insert into public.synera_privacy_ops_logs(event_code,counters,created_at) values('privacy.purge', '{}',now()-interval '91 days'),('privacy.erasure','{}',now()-interval '89 days');
    set session_replication_role=origin;`);
  const completeAcceptance=must(database,await source('neon/privacy-complete-erasure.acceptance.sql'));
  assert.match(completeAcceptance,/PRIVACY_COMPLETE_ERASURE_ACCEPTANCE_PASS/);
  const purgeAcceptance=must(database,await source('neon/privacy-retention-purge.acceptance.sql'));
  assert.match(purgeAcceptance,/PRIVACY_RETENTION_PURGE_ACCEPTANCE_PASS/);
  report.checks.push({name:'transactional_SQL_acceptance_scripts_pass_and_rollback',pass:true});
  check('ordinary_member_cannot_run_global_purge',()=>reject(database,session(A)+'select public.synera_purge_expired_privacy_data();',/permission denied/));
  check('caller_cannot_target_another_account',()=>{reject(database,session(B)+`select public.synera_complete_erase_application_data('${A}'::uuid);`,/does not exist/);assert.equal(must(database,`select count(*) from public.profiles where id='${A}';`),'1');});
  check('P3_complete_erasure_runs_with_normal_triggers_removes_application_data_and_preserves_peer_and_tombstone',()=>{
    assert.equal(must(database,'show session_replication_role;'),'origin');
    const out=JSON.parse(must(database,session(A)+'select public.synera_complete_erase_application_data();').split('\n').at(-1));assert.deepEqual(out,{status:'application_data_completely_erased',providerDeletion:'pending',staleSessionTombstone:'retained',repeated:false});
    for(const q of [`select count(*) from public.pilot_consents where user_id='${A}'`,`select count(*) from public.meeting_requests where sender_id='${A}' or recipient_id='${A}'`,`select count(*) from public.meeting_location_grants where grantor_id='${A}'`,`select count(*) from public.meeting_address_events`,`select count(*) from public.match_cases where participant_low='${A}' or participant_high='${A}'`,`select count(*) from public.match_outcome_events`,`select count(*) from public.group_room_messages where sender_id='${A}'`,`select count(*) from public.group_room_events where actor_id='${A}'`,`select count(*) from public.group_room_members where user_id='${A}'`,`select count(*) from public.group_rooms where creator_id='${A}'`,`select count(*) from public.profile_blocks where blocker_id='${A}' or blocked_id='${A}'`,`select count(*) from public.profile_reports where reporter_id='${A}' or reported_id='${A}'`])assert.equal(must(database,q),'0',q);
    assert.equal(must(database,"select status from public.group_rooms where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';"),'closed');assert.equal(must(database,"select count(*) from public.group_room_members where room_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2' and user_id='${B}';"),'1');assert.equal(must(database,"select count(*) from public.group_room_messages where room_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2' and sender_id='${B}';"),'1');assert.equal(must(database,"select count(*) from public.group_room_events where room_id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2' and actor_id='${B}';"),'2');
    assert.equal(must(database,`select count(*) from public.profiles where id='${B}';`),'1');
    assert.equal(must(database,`select count(*) from public.profile_erasures where user_id='${A}';`),'1');assert.equal(must(database,session(A)+'select public.synera_pilot_member();'),'f');
    const again=JSON.parse(must(database,session(A)+'select public.synera_complete_erase_application_data();').split('\n').at(-1));assert.deepEqual(again,{...out,repeated:true});
  });
  check('P4_purges_expired_only_and_rejects_free_text_counters',()=>{reject(database,"insert into public.synera_privacy_ops_logs(event_code,counters) values('privacy.error','{\"email\":\"person@example.test\"}');",/violates check constraint/);reject(database,"insert into public.synera_privacy_ops_logs(event_code,counters) values('arbitrary.name','{}');",/violates check constraint/);const out=JSON.parse(must(database,'set role service_role;select public.synera_purge_expired_privacy_data();').split('\n').at(-1));assert.deepEqual(out,{schedule:'daily',expiredInvitations:2,expiredLocationIntents:1,expiredOpsLogs:1});assert.equal(must(database,"select count(*) from public.meeting_requests where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4';"),'1');assert.equal(must(database,"select count(*) from public.location_consent_intents where intent_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';"),'1');assert.equal(must(database,"select count(*) from public.location_consent_intents where intent_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4';"),'1');assert.equal(must(database,"select count(*) from public.synera_privacy_ops_logs where event_code='privacy.erasure';"),'1');});
  report.status='PASS_LOCAL_PRIVACY_SQL';
} catch(error) { report.error=error.message; throw error; }
finally { try { if(database) must('postgres',`drop database if exists ${database} with (force);`); } catch {} if(receipt){await fs.mkdir(path.dirname(receipt),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');} }
console.log(JSON.stringify(report,null,2));
