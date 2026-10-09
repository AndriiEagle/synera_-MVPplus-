-- Local DISPOSABLE PostgreSQL only. Identity shim, not a signed HTTP JWT. Always ROLLBACK.
-- Runs on the COMPLETE stack: schema.proposal, case-state, meeting-status-guard, meeting-location,
-- group-room, case-outcome, meeting-address-agreement, message-intent.
-- Runner: tools/meeting-status-guard-sql-acceptance.mjs.
--
-- Why this file exists: each migration's own acceptance proves its guarantees on the stack of its day.
-- A later migration can reopen an earlier guarantee (meeting-location reopened "the sender cannot accept
-- their own invitation"), and the base acceptance can no longer run once invitations need an agreement.
-- This script re-asserts the earlier ownership, consent and isolation oracles at the TOP of the stack.
-- Rule: every state is reached by the acting person as `authenticated`. The owner only creates provider
-- identities and the pilot allow-list, exactly what the product cannot do for itself.
begin;
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now()),
('44444444-4444-4444-8444-444444444444','Uninvited','uninvited@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');

-- Transaction-local fixtures (pg_temp), never product objects.
create function pg_temp.act(p_actor text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_actor, 'role', 'authenticated')::text, true);
$$;
-- Runs one statement as the current actor; returns its SQLSTATE, or '' when it raised nothing.
create function pg_temp.try(p_sql text) returns text language plpgsql as $$
begin execute p_sql; return ''; exception when others then return sqlstate; end $$;
create function pg_temp.a() returns uuid language sql immutable as $$ select '11111111-1111-4111-8111-111111111111'::uuid $$;
create function pg_temp.b() returns uuid language sql immutable as $$ select '22222222-2222-4222-8222-222222222222'::uuid $$;
create function pg_temp.c() returns uuid language sql immutable as $$ select '33333333-3333-4333-8333-333333333333'::uuid $$;
create function pg_temp.u() returns uuid language sql immutable as $$ select '44444444-4444-4444-8444-444444444444'::uuid $$;
create function pg_temp.meeting() returns uuid language sql as $$ select current_setting('synera.acceptance.meeting')::uuid $$;
create function pg_temp.brief() returns jsonb language sql as $$
  select jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
   'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
   'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false);
$$;
-- One exchange with a deliverable in each direction, so both people are giver and receiver once.
create function pg_temp.material() returns jsonb language sql as $$
  select jsonb_build_object('mode','exchange','components',jsonb_build_array('exchange'),
   'outcomes',jsonb_build_array(jsonb_build_object('receiver_id',pg_temp.b(),'capability_tag','design','target','One reviewed screen'),
                                jsonb_build_object('receiver_id',pg_temp.a(),'capability_tag','sales','target','One warm introduction')),
   'trial',jsonb_build_object('starts_on',(current_date+1)::text,'due_on',(current_date+7)::text,'deliverables',jsonb_build_array(
     jsonb_build_object('giver_id',pg_temp.a(),'receiver_id',pg_temp.b(),'capability_tag','design','target','One reviewed screen','acceptance_criteria','Opens on a phone'),
     jsonb_build_object('giver_id',pg_temp.b(),'receiver_id',pg_temp.a(),'capability_tag','sales','target','One warm introduction','acceptance_criteria','Introduction was sent'))),
   'compensation',jsonb_build_object('status','agreed_exchange'),
   'terms',jsonb_build_object('revision_limit',1,'confidentiality','not_required','intellectual_property','shared','cancellation','mutual_written_notice'));
$$;
create function pg_temp.outcome(p_action text, p_index int, p_extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('action',p_action,'version',1,'termsHash',repeat('a',64),'index',p_index,'intentId',gen_random_uuid()) || p_extra;
$$;
do $$ begin execute format('grant usage on schema %I to authenticated', (select nspname from pg_catalog.pg_namespace where oid = pg_my_temp_schema())); end $$;

set local role authenticated;

-- 1. A verified identity outside the allow-list reaches nothing: tables, rows or RPCs.
select pg_temp.act(pg_temp.u()::text);
do $$ begin
  if public.synera_user_id() is distinct from pg_temp.u() then raise exception 'Identity fixture unsupported; inspect the provider function instead of replacing it'; end if;
  if public.synera_pilot_member() then raise exception 'Uninvited identity passed admission'; end if;
  if pg_temp.try($q$insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true)$q$) <> '42501' then raise exception 'Uninvited identity entered the pilot'; end if;
  if pg_temp.try('select 1 from public.synera_pilot_members') <> '42501' then raise exception 'Invited emails leaked'; end if;
  if pg_temp.try($q$select public.synera_room_create('Room','Goal',array[pg_temp.a()])$q$) <> '42501' then raise exception 'Uninvited identity created a room'; end if;
  if public.synera_room_list() <> '[]'::jsonb then raise exception 'Uninvited identity listed rooms'; end if;
end $$;

-- 2. Consent gates the member's own reads; each person creates only their own profile.
select pg_temp.act(pg_temp.a()::text);
do $$ begin
  if pg_temp.try($q$insert into public.profiles(id,display_name,is_discoverable,brief) values (public.synera_user_id(),'Before consent',false,pg_temp.brief())$q$) <> '42501' then raise exception 'Profile created before consent'; end if;
end $$;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief) values (public.synera_user_id(),'Stack A','Product design','B2B sales',true,pg_temp.brief());
do $$ begin
  if pg_temp.try($q$insert into public.profiles(id,display_name,is_discoverable,brief) values (pg_temp.b(),'Forged B',true,pg_temp.brief())$q$) <> '42501' then raise exception 'Profile created for another person'; end if;
  if pg_temp.try($q$insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (pg_temp.b(),'2026-09-05-pilot-3',true,true)$q$) <> '42501' then raise exception 'Consent recorded for another person'; end if;
  if pg_temp.try($q$update public.profiles set updated_at=now()-interval '2 years' where id=public.synera_user_id()$q$) <> '42501' then raise exception 'Client changed the freshness timestamp'; end if;
  if pg_temp.try($q$update public.profiles set brief=brief || '{"admin":true}'::jsonb where id=public.synera_user_id()$q$) <> '23514' then raise exception 'Unknown brief key accepted'; end if;
  if pg_temp.try('update public.synera_write_limits set invitations=0') <> '42501' then raise exception 'Client changed an admission counter'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief) values (public.synera_user_id(),'Stack B','B2B sales','Product design',true,pg_temp.brief());
select pg_temp.act(pg_temp.c()::text);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief) values (public.synera_user_id(),'Stack C','Research','Design',false,pg_temp.brief());
do $$ begin
  if (select count(*) from public.profiles) <> 3 then raise exception 'Own and discoverable profiles are not exactly what a member reads'; end if;
  perform pg_temp.act(pg_temp.a()::text);
  if (select count(*) from public.profiles) <> 2 then raise exception 'A private profile was readable'; end if;
end $$;

-- 3. The agreement: nobody approves for another person, nobody outside the pair reads it,
--    and no invitation exists before BOTH approvals.
select pg_temp.act(pg_temp.a()::text);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
  values ('stack-ab',pg_temp.a(),pg_temp.b(),'exchange',pg_temp.material(),repeat('a',64),now()+interval '7 days');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64));
do $$ begin
  if pg_temp.try($q$insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',pg_temp.b(),1,repeat('a',64))$q$) <> '42501' then raise exception 'Approval recorded for the other participant'; end if;
  if pg_temp.try($q$insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place) values (pg_temp.a(),pg_temp.b(),'Too early',now()+interval '1 day',30,'Zürich')$q$) <> '42501' then raise exception 'Invitation sent with one approval'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',0,'{"evidenceUri":"https://example.invalid/early"}'))$q$) <> '42501' then raise exception 'Result recorded with one approval'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if exists(select 1 from public.match_cases) or exists(select 1 from public.match_case_approvals) then raise exception 'Third party read an agreement'; end if;
  if pg_temp.try($q$insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64))$q$) <> '42501' then raise exception 'Third party approved an agreement'; end if;
  update public.match_cases set status='revoked' where case_id='stack-ab';
  update public.match_case_approvals set withdrawn_at=now() where case_id='stack-ab';
  perform pg_temp.act(pg_temp.a()::text);
  if (select status from public.match_cases where case_id='stack-ab') <> 'open' or (select count(*) from public.match_case_approvals where withdrawn_at is null) <> 1 then raise exception 'Third party changed an agreement'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64));
do $$ begin
  update public.match_case_approvals set withdrawn_at=now() where party_id=pg_temp.a();
  if (select count(*) from public.match_case_approvals where withdrawn_at is null) <> 2 then raise exception 'A participant withdrew the other participant''s approval'; end if;
end $$;

-- 4. The invitation: server-owned names, recipient-only answer, no conversation before acceptance.
select pg_temp.act(pg_temp.a()::text);
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
  values (pg_temp.a(),pg_temp.b(),'After both approvals',now()+interval '1 day',30,'Zürich');
select set_config('synera.acceptance.meeting',(select id::text from public.meeting_requests where status='pending'),true);
do $$ declare code text; begin
  if (select sender_name||'/'||recipient_name from public.meeting_requests) <> 'Stack A/Stack B' then raise exception 'Server name snapshot failed'; end if;
  code := pg_temp.try($q$update public.meeting_requests set status='accepted' where id=pg_temp.meeting()$q$);
  if (select status from public.meeting_requests) <> 'pending' then raise exception 'Sender accepted their own invitation'; end if;
  if pg_temp.try($q$update public.meeting_requests set sender_name='Forged' where id=pg_temp.meeting()$q$) <> '42501' then raise exception 'Client forged an identity snapshot'; end if;
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Before acceptance')$q$) <> '42501' then raise exception 'Direct message passed before acceptance'; end if;
  if pg_temp.try($q$select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Before acceptance')$q$) <> 'PT403' then raise exception 'Message intent passed before acceptance'; end if;
  if pg_temp.try($q$select public.synera_location_grant(pg_temp.meeting(),'approximate',15,true,gen_random_uuid())$q$) <> '42501' then raise exception 'Location consent recorded before acceptance'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Third party read an invitation'; end if;
  code := pg_temp.try($q$update public.meeting_requests set status='accepted'$q$);
  perform pg_temp.act(pg_temp.b()::text);
  if (select status from public.meeting_requests) <> 'pending' then raise exception 'Third party answered an invitation'; end if;
end $$;
update public.meeting_requests set status='accepted' where id=pg_temp.meeting();
do $$ begin if (select status from public.meeting_requests) <> 'accepted' then raise exception 'Recipient acceptance failed'; end if; end $$;

-- 5. The private conversation belongs to its two participants on both write lanes.
select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Accepted conversation, intent lane');
select pg_temp.act(pg_temp.a()::text);
insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Accepted conversation, direct lane');
do $$ begin
  if (select count(*) from public.meeting_messages) <> 2 then raise exception 'Participants do not read the same conversation'; end if;
  -- Refused by the admission trigger before the policy is reached, so assert the refusal and the stored rows.
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),pg_temp.b(),'Forged sender')$q$) = ''
    or exists(select 1 from public.meeting_messages where body='Forged sender') then raise exception 'Message written under the other participant''s name'; end if;
  if pg_temp.try($q$update public.meeting_messages set body='Edited'$q$) <> '42501' or pg_temp.try('delete from public.meeting_messages') <> '42501' then raise exception 'Stored message was editable'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if exists(select 1 from public.meeting_messages) then raise exception 'Third party read a conversation'; end if;
  if pg_temp.try($q$select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Outsider')$q$) <> 'PT403' then raise exception 'Third party wrote into a conversation'; end if;
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Outsider')$q$) <> '42501' then raise exception 'Third party wrote into a conversation directly'; end if;
end $$;

-- 6. Address, location and results: every RPC takes caller-supplied identifiers, so a member outside
--    the pair must get nothing from any of them, and one person never decides for the other.
do $$ declare seen jsonb; begin
  perform pg_temp.act(pg_temp.c()::text);
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)))$q$) <> '42501' then raise exception 'Third party read an address agreement'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)))$q$) <> '42501' then raise exception 'Third party read results'; end if;
  if pg_temp.try($q$select public.synera_location_grant(pg_temp.meeting(),'approximate',15,true,gen_random_uuid())$q$) <> '42501' then raise exception 'Third party recorded location consent'; end if;
  seen := public.synera_location_access(pg_temp.meeting());
  if seen->'eligible' <> 'false'::jsonb or seen->'meeting' <> 'null'::jsonb or seen->'own' <> 'null'::jsonb or seen->'peer' <> 'null'::jsonb then raise exception 'Third party learned about a meeting through location access: %', seen; end if;
  -- An unknown identifier answers exactly like a foreign one: no existence oracle.
  if pg_temp.try($q$select public.synera_case_outcome('no-such-case',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)))$q$) <> '42501' then raise exception 'Unknown case is distinguishable from a foreign case'; end if;
  if public.synera_location_access(gen_random_uuid())->'meeting' <> 'null'::jsonb then raise exception 'Unknown meeting is distinguishable from a foreign meeting'; end if;
end $$;
select pg_temp.act(pg_temp.a()::text);
select set_config('synera.acceptance.proposal',gen_random_uuid()::text,true);
select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','propose','version',1,'termsHash',repeat('a',64),
  'intentId',current_setting('synera.acceptance.proposal'),'proposalId',null,'address','Bahnhofplatz 15, Zürich','consent',true)) is not null;
do $$ begin
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','accept','version',1,'termsHash',repeat('a',64),
    'intentId',gen_random_uuid(),'proposalId',current_setting('synera.acceptance.proposal'),'consent',true))$q$) <> '42501' then raise exception 'Proposer accepted their own address'; end if;
  if pg_temp.try($q$update public.meeting_requests set meeting_address='Forged place' where id=pg_temp.meeting()$q$) <> '42501' then raise exception 'One participant set the address directly'; end if;
  if (select meeting_address from public.meeting_requests) <> '' then raise exception 'Address changed before the other participant agreed'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','accept','version',1,'termsHash',repeat('a',64),
  'intentId',gen_random_uuid(),'proposalId',current_setting('synera.acceptance.proposal'),'consent',true))->'agreed' = 'true'::jsonb;
do $$ begin if (select meeting_address from public.meeting_requests) <> 'Bahnhofplatz 15, Zürich' then raise exception 'Agreed address was not stored'; end if; end $$;
select public.synera_location_grant(pg_temp.meeting(),'approximate',15,true,gen_random_uuid()) is not null;
do $$ begin
  if pg_temp.try('select 1 from public.meeting_location_grants') <> '42501' or pg_temp.try('select 1 from public.meeting_address_events') <> '42501'
    or pg_temp.try('select 1 from public.match_outcome_events') <> '42501' then raise exception 'A consent or attestation table is readable directly'; end if;
end $$;
-- Results: A gives item 0 to B, B gives item 1 to A.
select pg_temp.act(pg_temp.a()::text);
select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',0,'{"evidenceUri":"https://example.invalid/screen"}')) is not null;
do $$ begin
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('check',0,'{"scopeNotes":"Self check"}'))$q$) <> '42501' then raise exception 'Giver checked their own result'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))$q$) <> '42501' then raise exception 'Giver accepted their own result'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',1,'{"evidenceUri":"https://example.invalid/forged"}'))$q$) <> '42501' then raise exception 'Evidence submitted for the other participant''s deliverable'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))$q$) <> '42501' then raise exception 'Third party accepted a result'; end if;
  perform pg_temp.act(pg_temp.b()::text);
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))$q$) <> 'PT409' then raise exception 'Result accepted before its receiver checked it'; end if;
end $$;
select public.synera_case_outcome('stack-ab',pg_temp.outcome('check',0,'{"scopeNotes":"Opened on a phone"}')) is not null;
select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))->'outcome_confirmed' = 'false'::jsonb;

-- 7. Lapse: once the agreement is revised, nothing that needs the agreement can be written on the
--    old terms, by either person.
select pg_temp.act(pg_temp.a()::text);
update public.match_cases set terms_hash=repeat('b',64), material=jsonb_set(material,'{terms,revision_limit}','2') where case_id='stack-ab';
do $$ declare seen jsonb; begin
  if (select version from public.match_cases where case_id='stack-ab') <> 2 then raise exception 'Revision did not raise the version'; end if;
  perform pg_temp.act(pg_temp.b()::text);
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',1,'{"evidenceUri":"https://example.invalid/late"}'))$q$) <> 'PT409' then raise exception 'Result recorded on superseded terms'; end if;
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','propose','version',1,'termsHash',repeat('a',64),
    'intentId',gen_random_uuid(),'proposalId',current_setting('synera.acceptance.proposal'),'address','Elsewhere','consent',true))$q$) <> 'PT409' then raise exception 'Address proposed on superseded terms'; end if;
  seen := public.synera_location_access(pg_temp.meeting());
  if seen->'eligible' <> 'false'::jsonb or seen->'own' <> 'null'::jsonb then raise exception 'Location consent survived a revision: %', seen; end if;
  if pg_temp.try($q$insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64))$q$) <> '42501' then raise exception 'Superseded revision approved'; end if;
end $$;

-- 8. A block closes every lane between the two people, and only the blocker lifts it.
select pg_temp.act(pg_temp.b()::text);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),2,repeat('b',64));
select pg_temp.act(pg_temp.a()::text);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),2,repeat('b',64));
select pg_temp.act(pg_temp.b()::text);
insert into public.profile_blocks(blocker_id,blocked_id) values (public.synera_user_id(),pg_temp.a());
select pg_temp.act(pg_temp.a()::text);
do $$ begin
  if exists(select 1 from public.profiles where id=pg_temp.b()) then raise exception 'Block did not hide the blocker'; end if;
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Blocked')$q$) <> '42501' then raise exception 'Direct message passed a block'; end if;
  if pg_temp.try($q$select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Blocked')$q$) <> 'PT403' then raise exception 'Message intent passed a block'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)))$q$) <> '42501' then raise exception 'Results stayed open across a block'; end if;
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)))$q$) <> '42501' then raise exception 'Address stayed open across a block'; end if;
  if pg_temp.try($q$select public.synera_room_create('Room','Goal',array[pg_temp.b()])$q$) <> '42501' then raise exception 'Room invitation passed a block'; end if;
  if pg_temp.try($q$update public.match_cases set terms_hash=repeat('c',64), material=jsonb_set(material,'{terms,revision_limit}','3') where case_id='stack-ab'$q$) <> '42501' then raise exception 'New terms written across a block'; end if;
  delete from public.profile_blocks;
end $$;
select pg_temp.act(pg_temp.b()::text);
do $$ begin if (select count(*) from public.profile_blocks) <> 1 then raise exception 'The blocked person lifted the block'; end if; end $$;
delete from public.profile_blocks where blocker_id=public.synera_user_id();

-- 9. Leaving: a person deletes only their own profile; admission counters outlive it.
select pg_temp.act(pg_temp.a()::text);
do $$ begin
  delete from public.profiles where id=pg_temp.b();
  if not exists(select 1 from public.profiles where id=pg_temp.b()) then raise exception 'A person deleted another person''s profile'; end if;
end $$;
delete from public.profiles where id=public.synera_user_id();
reset role;
do $$ declare r text; t text; begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) or exists(select 1 from public.match_cases) then raise exception 'Profile deletion did not remove that person''s shared records'; end if;
  if (select invitations from public.synera_write_limits where user_id=pg_temp.a()) < 1 then raise exception 'Profile deletion reset admission'; end if;
  -- No anonymous role holds a privilege on any product table, including the tables added by later migrations.
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' loop
        if has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous table grant remains on %', t; end if;
      end loop;
    end if;
  end loop;
  -- Every product table has row-level security switched on.
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) then raise exception 'A product table has row-level security off'; end if;
end $$;
select 'STACK_INVARIANTS_ACCEPTANCE_PASS' as result;
rollback;
