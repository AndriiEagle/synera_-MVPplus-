-- Local DISPOSABLE PostgreSQL only. Identity shim, not a signed HTTP JWT. Always ROLLBACK.
-- Runs after neon/schema.proposal.sql + neon/case-state.migration.sql (+ optionally the later
-- migrations) + neon/meeting-status-guard.migration.sql. Runner: tools/meeting-status-guard-sql-acceptance.mjs.
-- Every oracle reads the stored row after the attempt: an UPDATE hidden by RLS changes zero rows
-- without an error, so "no exception" alone never proves a denial.
begin;
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Status fixture','Product design','B2B sales',true,
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where email like '%@synera-acceptance.example';
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where email like '%@synera-acceptance.example';

-- Helpers are transaction-local fixtures (pg_temp), never product objects.
create function pg_temp.act(p_actor text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_actor, 'role', 'authenticated')::text, true);
$$;
-- Attempts one status change as the current actor and returns the SQLSTATE ('' when no error was raised).
create function pg_temp.try_status(p_status text) returns text language plpgsql as $$
begin
  update public.meeting_requests set status = p_status where id = current_setting('synera.acceptance.meeting')::uuid;
  return '';
exception when others then return sqlstate;
end $$;
create function pg_temp.stored_status() returns text language sql as $$
  select status from public.meeting_requests where id = current_setting('synera.acceptance.meeting')::uuid;
$$;
create function pg_temp.invite() returns void language plpgsql as $$
begin
  insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
    values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','After both approvals',now()+interval '1 day',20,'Zürich');
  perform set_config('synera.acceptance.meeting', (select id::text from public.meeting_requests where status = 'pending'), true);
end $$;
-- GRANT does not accept the pg_temp alias; name this session's temporary schema explicitly.
do $$ begin execute format('grant usage on schema %I to authenticated', (select nspname from pg_catalog.pg_namespace where oid = pg_my_temp_schema())); end $$;

set local role authenticated;
select pg_temp.act('11111111-1111-4111-8111-111111111111');
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values
('status-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',
 '{"mode":"exchange","components":["exchange"],"outcomes":[],"trial":{},"compensation":{"status":"agreed_exchange"},"terms":{"revision_limit":1,"confidentiality":"not_required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}',
 repeat('a',64), now()+interval '7 days');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),1,repeat('a',64));
select pg_temp.act('22222222-2222-4222-8222-222222222222');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),1,repeat('a',64));

-- 1. Nobody but the recipient answers a pending invitation.
select pg_temp.act('11111111-1111-4111-8111-111111111111');
select pg_temp.invite();
do $$ declare code text; begin
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Sender accepted their own invitation'; end if;
  if code <> '42501' then raise exception 'Sender self-acceptance was not an authorization denial: %', code; end if;
  code := pg_temp.try_status('declined');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Sender declined for the recipient'; end if;
  perform pg_temp.act('33333333-3333-4333-8333-333333333333');
  code := pg_temp.try_status('accepted'); code := pg_temp.try_status('cancelled');
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Third party changed an invitation'; end if;
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('cancelled');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient cancelled the sender''s invitation'; end if;
end $$;

-- 2. A material revision after the invitation: acceptance waits for BOTH approvals of the current revision.
select pg_temp.act('11111111-1111-4111-8111-111111111111');
update public.match_cases set terms_hash = repeat('b',64), material = jsonb_set(material,'{terms,revision_limit}','2') where case_id = 'status-ab';
do $$ declare code text; begin
  if (select version from public.match_cases where case_id = 'status-ab') <> 2 then raise exception 'Fixture revision did not raise the version'; end if;
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the agreement changed'; end if;
  if code <> 'PT409' then raise exception 'Stale acceptance was not a recoverable conflict: %', code; end if;
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),2,repeat('b',64));
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted with one current approval'; end if;
  -- No message may exist before acceptance.
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) values (current_setting('synera.acceptance.meeting')::uuid,public.synera_user_id(),'Before acceptance');
    raise exception 'Message passed before acceptance';
  exception when insufficient_privilege then null; end;
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),2,repeat('b',64));
  -- The same invitation becomes acceptable again: the recovery path needs no new invitation.
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if code <> '' or pg_temp.stored_status() <> 'accepted' then raise exception 'Recipient could not accept after both re-approved: %', code; end if;
  insert into public.meeting_messages(meeting_id,sender_id,body) values (current_setting('synera.acceptance.meeting')::uuid,public.synera_user_id(),'After acceptance');
  -- An acceptance is not silently reversed by the recipient or re-decided by the sender.
  code := pg_temp.try_status('declined');
  if pg_temp.stored_status() <> 'accepted' then raise exception 'Recipient reversed an acceptance'; end if;
  code := pg_temp.try_status('pending');
  if pg_temp.stored_status() <> 'accepted' then raise exception 'Accepted invitation returned to pending'; end if;
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  code := pg_temp.try_status('declined');
  if pg_temp.stored_status() <> 'accepted' then raise exception 'Sender declined an accepted invitation'; end if;
  -- The sender may still cancel; a closed invitation is final.
  code := pg_temp.try_status('cancelled');
  if code <> '' or pg_temp.stored_status() <> 'cancelled' then raise exception 'Sender could not cancel an accepted invitation: %', code; end if;
  code := pg_temp.try_status('accepted');
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'cancelled' then raise exception 'Cancelled invitation was reopened'; end if;
end $$;

-- 3. A withdrawn approval: acceptance is refused, declining stays available and is final.
select pg_temp.act('11111111-1111-4111-8111-111111111111');
select pg_temp.invite();
update public.match_case_approvals set withdrawn_at = now() where party_id = public.synera_user_id() and approved_version = 2 and withdrawn_at is null;
do $$ declare code text; begin
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the sender withdrew approval'; end if;
  if code <> 'PT409' then raise exception 'Withdrawn-approval acceptance was not a recoverable conflict: %', code; end if;
  code := pg_temp.try_status('declined');
  if code <> '' or pg_temp.stored_status() <> 'declined' then raise exception 'Recipient could not decline: %', code; end if;
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'declined' then raise exception 'Declined invitation was reopened'; end if;
end $$;

-- 4. A closed agreement: the pending invitation cannot be accepted; the sender can still cancel it.
select pg_temp.act('11111111-1111-4111-8111-111111111111');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),2,repeat('b',64));
select pg_temp.invite();
select pg_temp.act('22222222-2222-4222-8222-222222222222');
update public.match_cases set status = 'revoked' where case_id = 'status-ab';
do $$ declare code text; begin
  if (select status from public.match_cases where case_id = 'status-ab') <> 'revoked' then raise exception 'Fixture case was not closed'; end if;
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the agreement was closed'; end if;
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  code := pg_temp.try_status('cancelled');
  if code <> '' or pg_temp.stored_status() <> 'cancelled' then raise exception 'Sender could not cancel a pending invitation: %', code; end if;
end $$;

-- 5. An expired agreement: same refusal. The owner moves the clock-bound column; callers cannot.
select pg_temp.act('11111111-1111-4111-8111-111111111111');
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
select 'status-ab-2',participant_low,participant_high,mode,material,repeat('c',64),now()+interval '1 hour' from public.match_cases where case_id = 'status-ab';
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab-2',public.synera_user_id(),1,repeat('c',64));
select pg_temp.act('22222222-2222-4222-8222-222222222222');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab-2',public.synera_user_id(),1,repeat('c',64));
select pg_temp.act('11111111-1111-4111-8111-111111111111');
select pg_temp.invite();
reset role;
update public.match_cases set expires_at = now() - interval '1 second' where case_id = 'status-ab-2';
set local role authenticated;
select pg_temp.act('22222222-2222-4222-8222-222222222222');
do $$ declare code text; begin
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the agreement expired'; end if;
  if code <> 'PT409' then raise exception 'Expired-agreement acceptance was not a recoverable conflict: %', code; end if;
end $$;

-- 6. The guard is exactly as wide as row-level security: owner maintenance, which bypasses every policy,
-- is not blocked (the reviewed location/hardening fixtures depend on it); an API caller stays bound.
reset role;
do $$ declare code text; begin
  code := pg_temp.try_status('cancelled');
  if code <> '' or pg_temp.stored_status() <> 'cancelled' then raise exception 'Owner maintenance was blocked by the caller guard: %', code; end if;
end $$;
select 'MEETING_STATUS_GUARD_ACCEPTANCE_PASS' as result;
rollback;
