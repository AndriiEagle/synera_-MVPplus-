-- NOT RUN. Transactional acceptance for real-pilot.proposal.sql.
-- Dedicated Synera project only, with explicit operator approval and SQL-owner access.
-- Creates test-only accounts; always ROLLBACK. This does not test email/password Auth.
begin;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Acceptance fixture','Product design','B2B sales',id='22222222-2222-4222-8222-222222222222',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('joint_project'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.profiles) then raise exception 'Consent gate bypassed'; end if;
end $$;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
 values ('11111111-1111-4111-8111-111111111111','2026-09-05-pilot-2',true,true);
do $$ begin
  if (select count(*) from public.profiles) <> 2 then raise exception 'Owner/private/visible boundary failed'; end if;
  begin
    update public.profiles set updated_at=now()-interval '2 years' where id=auth.uid();
    raise exception 'Client changed freshness timestamp';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set brief=brief || '{"admin":true}'::jsonb where id=auth.uid();
    raise exception 'Unknown brief key accepted';
  exception when check_violation then null; end;
  begin
    update public.synera_write_limits set invitations=0;
    raise exception 'Client changed admission counter';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
 values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Acceptance only',now()+interval '1 day',20,'Онлайн');
do $$ begin
  if (select sender_name from public.meeting_requests limit 1) <> 'Acceptance fixture' then raise exception 'Server name snapshot failed'; end if;
  begin
    update public.meeting_requests set status='accepted';
    raise exception 'Sender accepted their own invitation';
  exception when insufficient_privilege then null; end;
  begin
    update public.meeting_requests set sender_name='Forged';
    raise exception 'Client forged identity snapshot';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,auth.uid(),'Before acceptance' from public.meeting_requests;
    raise exception 'Messaging allowed before acceptance';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (auth.uid(),'2026-09-05-pilot-2',true,true);
do $$ begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Third-party conversation leak'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (auth.uid(),'2026-09-05-pilot-2',true,true);
update public.meeting_requests set status='accepted';
do $$ begin if not exists(select 1 from public.meeting_requests where status='accepted') then raise exception 'Recipient acceptance failed'; end if; end $$;
insert into public.meeting_messages(meeting_id,sender_id,body) select id,auth.uid(),'Accepted conversation' from public.meeting_requests;
insert into public.profile_blocks(blocker_id,blocked_id) values (auth.uid(),'11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.profiles where id='22222222-2222-4222-8222-222222222222') then raise exception 'Block did not hide peer'; end if;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,auth.uid(),'Blocked message' from public.meeting_requests;
    raise exception 'Message passed block';
  exception when insufficient_privilege then null; end;
end $$;
-- History remains available, but a blocked participant cannot remove another person's block.
delete from public.profile_blocks;
reset role;
do $$ begin if (select count(*) from public.profile_blocks) <> 1 then raise exception 'Block owner boundary failed'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
delete from public.profile_blocks where blocker_id=auth.uid();
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
delete from public.profiles where id=auth.uid();
reset role;
do $$ begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Profile deletion did not cascade'; end if;
  if (select invitations from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111') <> 1 then raise exception 'Profile deletion reset admission'; end if;
end $$;
set local role anon;
do $$ begin
  begin perform 1 from public.profiles; raise exception 'Anonymous profile read'; exception when insufficient_privilege then null; end;
  begin perform 1 from public.meeting_messages; raise exception 'Anonymous message read'; exception when insufficient_privilege then null; end;
  begin perform public.synera_limit_writes(); raise exception 'Admission trigger callable by anon'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: consent, private profiles, shape/column grants, invitation ownership, names, messaging, blocks, third-party isolation, deletion and retained admission counters' as result;
rollback;
