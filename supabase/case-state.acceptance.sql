-- NOT RUN. Transactional acceptance for case-state.proposal.sql on a DISPOSABLE database only.
-- Requires the real-pilot schema plus case-state.proposal.sql, SQL-owner access and exact operator approval.
-- Creates test-only accounts; always ROLLBACK. Until this passes, case RLS is PRESENT_BUT_UNTESTED.
begin;
-- FIXTURE-USERS-BEGIN
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
-- FIXTURE-USERS-END
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Case fixture','Product design','B2B sales',id <> '33333333-3333-4333-8333-333333333333',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$
declare open_terms jsonb := '{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"sales","target":"Review one offer"}],"trial":{"starts_on":"2026-09-20","due_on":"2026-09-30","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"sales","target":"One review","acceptance_criteria":"Receiver accepts this version"}]},"compensation":{"status":"unresolved","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":null,"confidentiality":"unresolved","intellectual_property":"unresolved","cancellation":"unresolved"}}';
begin
  -- C0: brief version 2 is accepted exactly as normalizeBrief writes it; malformed variants are not.
  update public.profiles set brief = brief || '{"version":2,"modes":["exchange","paid_service"],"mode_details":{"paid_service":{"role":"buyer"},"referral":{"role":"","benefitTags":[],"sourceDeclared":false,"recipientScopeDeclared":false,"thirdPartyStatus":"not_consulted"},"hybrid":{"components":[]}}}'::jsonb where id = auth.uid();
  begin
    update public.profiles set brief = brief || '{"version":2,"modes":["exchange"]}'::jsonb where id = auth.uid();
    raise exception 'Version 2 accepted without a pilot mode';
  exception when check_violation then null; end;
  begin
    update public.profiles set brief = brief || '{"mode_details":{"paid_service":{"role":"owner"},"referral":{"role":"","benefitTags":[],"sourceDeclared":false,"recipientScopeDeclared":false,"thirdPartyStatus":"not_consulted"},"hybrid":{"components":[]}}}'::jsonb where id = auth.uid();
    raise exception 'Unknown paid-service role accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set brief = brief || '{"mode_details":{"paid_service":{"role":"buyer"},"referral":{"role":"","benefitTags":[],"sourceDeclared":false,"recipientScopeDeclared":false,"thirdPartyStatus":"trusted"},"hybrid":{"components":[]}}}'::jsonb where id = auth.uid();
    raise exception 'Unknown third-party status accepted';
  exception when check_violation then null; end;

  -- C1: server owns version and timestamps; a client cannot forge them.
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at,version)
      values ('case-forged-version','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',open_terms,repeat('a',64),now()+interval '14 days',7);
    raise exception 'Client set the case version';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at,created_at)
      values ('case-forged-time','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',open_terms,repeat('a',64),now()+interval '14 days',now()-interval '1 year');
    raise exception 'Client forged the case timestamp';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
      values ('case-hidden-peer','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','exchange',open_terms,repeat('a',64),now()+interval '14 days');
    raise exception 'Case opened with a hidden profile';
  exception when insufficient_privilege then null; end;
  insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
    values ('case-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',open_terms,repeat('a',64),now()+interval '14 days');
  if (select version from public.match_cases where case_id='case-ab') <> 1 then raise exception 'Case did not start at version 1'; end if;

  -- C2: incomplete material cannot be approved; an empty term stays a question.
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',auth.uid(),1,repeat('a',64));
    raise exception 'Incomplete material approved';
  exception when insufficient_privilege then null; end;
  update public.match_cases set terms_hash = repeat('b',64), material = jsonb_set(jsonb_set(open_terms,'{compensation}','{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null}'),
    '{terms}','{"revision_limit":1,"confidentiality":"required","intellectual_property":"receiver","cancellation":"mutual_written_notice"}') where case_id='case-ab';
  if (select version from public.match_cases where case_id='case-ab') <> 2 then raise exception 'Material change did not raise the version'; end if;
  begin
    update public.match_cases set material = material || '{"mode":"exchange"}'::jsonb, terms_hash = repeat('b',64), mode = 'exchange' where case_id='case-ab';
    if (select version from public.match_cases where case_id='case-ab') <> 2 then raise exception 'Unchanged material raised the version'; end if;
  end;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',auth.uid(),1,repeat('a',64));
    raise exception 'Stale version approved';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab','22222222-2222-4222-8222-222222222222',2,repeat('b',64));
    raise exception 'Approved on behalf of the other party';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash,approved_at) values ('case-ab',auth.uid(),2,repeat('b',64),now()-interval '1 year');
    raise exception 'Client forged the approval timestamp';
  exception when insufficient_privilege then null; end;
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',auth.uid(),2,repeat('b',64));

  -- Introduction gate: one approval is not enough for a direct REST invitation.
  begin
    insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
      values (auth.uid(),'22222222-2222-4222-8222-222222222222','Before both approvals',now()+interval '1 day',20,'Онлайн');
    raise exception 'Invitation passed with one approval';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.match_cases) or exists(select 1 from public.match_case_approvals) then raise exception 'Third party read a case'; end if;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',auth.uid(),2,repeat('b',64));
    raise exception 'Third party approved a case';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',auth.uid(),2,repeat('b',64));
do $$ begin
  update public.match_case_approvals set withdrawn_at = now() where party_id = '11111111-1111-4111-8111-111111111111';
  if (select count(*) from public.match_case_approvals where withdrawn_at is null) <> 2 then raise exception 'Party withdrew the other party''s approval'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
  values (auth.uid(),'22222222-2222-4222-8222-222222222222','After both approvals',now()+interval '1 day',20,'Онлайн');
do $$ begin
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,auth.uid(),'Before acceptance' from public.meeting_requests;
    raise exception 'Direct message passed before acceptance';
  exception when insufficient_privilege then null; end;
  update public.match_case_approvals set withdrawn_at = now() where party_id = auth.uid();
  begin
    update public.match_case_approvals set withdrawn_at = null where party_id = auth.uid();
    raise exception 'Withdrawn approval was restored';
  exception when raise_exception then null; end;
  update public.match_cases set terms_hash = repeat('c',64), material = jsonb_set(material,'{terms,revision_limit}','2') where case_id='case-ab';
  if (select version from public.match_cases where case_id='case-ab') <> 3 then raise exception 'Second material change did not raise the version'; end if;
  if exists(select 1 from public.match_case_approvals a join public.match_cases c using (case_id) where a.withdrawn_at is null and a.approved_version = c.version) then raise exception 'Approval stayed live after a material change'; end if;
  update public.match_cases set status = 'revoked' where case_id='case-ab';
  update public.match_cases set terms_hash = repeat('d',64), material = jsonb_set(material,'{terms,revision_limit}','3') where case_id='case-ab';
  if (select version from public.match_cases where case_id='case-ab') <> 3 or (select closed_at from public.match_cases where case_id='case-ab') is null then raise exception 'Revoked case changed or has no closing time'; end if;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',auth.uid(),3,repeat('c',64));
    raise exception 'Revoked case approved';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.profile_blocks(blocker_id,blocked_id) values (auth.uid(),'11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
      select 'case-after-block',participant_low,participant_high,mode,material,repeat('e',64),now()+interval '14 days' from public.match_cases where case_id='case-ab';
    raise exception 'Case opened with a blocked peer';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
  begin perform 1 from public.match_cases; raise exception 'Anonymous case read'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.match_case_approvals; raise exception 'Anonymous approval read'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: brief v2 shape, server-owned case version and time, incomplete/stale/forged approvals refused, third-party isolation, one-approval invitation refused, withdrawal final, material change ends live approvals, revoked case frozen, blocked peer, anonymous' as result;
rollback;
