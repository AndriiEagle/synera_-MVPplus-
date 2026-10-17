-- NOT RUN. Neon-only transactional acceptance. Requires exact approval. Always ROLLBACK.
-- This tests RLS with fixtures, not real login, email delivery, or an actual phone.
begin;
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now()),
('44444444-4444-4444-8444-444444444444','Uninvited','uninvited@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  if public.synera_user_id() is distinct from '44444444-4444-4444-8444-444444444444' then raise exception 'JWT fixture context unsupported; inspect auth.uid without replacing it'; end if;
  if public.synera_pilot_member() then raise exception 'Uninvited member passed'; end if;
  begin
    insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
      values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
    raise exception 'Uninvited user entered pilot';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.synera_pilot_members; raise exception 'Invited emails leaked'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Acceptance fixture','Product design','B2B sales',id='22222222-2222-4222-8222-222222222222',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('joint_project'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.profiles) then raise exception 'Consent gate bypassed'; end if;
end $$;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
 values ('11111111-1111-4111-8111-111111111111','2026-09-05-pilot-3',true,true);
do $$ begin
  if (select count(*) from public.profiles) <> 2 then raise exception 'Owner/private/visible boundary failed'; end if;
  begin
    update public.profiles set updated_at=now()-interval '2 years' where id=public.synera_user_id();
    raise exception 'Client changed freshness timestamp';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set brief=brief || '{"admin":true}'::jsonb where id=public.synera_user_id();
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
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Before acceptance' from public.meeting_requests;
    raise exception 'Messaging allowed before acceptance';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
do $$ begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Third-party conversation leak'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
update public.meeting_requests set status='accepted';
do $$ begin if not exists(select 1 from public.meeting_requests where status='accepted') then raise exception 'Recipient acceptance failed'; end if; end $$;
insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Accepted conversation' from public.meeting_requests;
insert into public.profile_blocks(blocker_id,blocked_id) values (public.synera_user_id(),'11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.profiles where id='22222222-2222-4222-8222-222222222222') then raise exception 'Block did not hide peer'; end if;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Blocked message' from public.meeting_requests;
    raise exception 'Message passed block';
  exception when insufficient_privilege then null; end;
end $$;
delete from public.profile_blocks;
reset role;
do $$ begin if (select count(*) from public.profile_blocks) <> 1 then raise exception 'Block owner boundary failed'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
delete from public.profile_blocks where blocker_id=public.synera_user_id();
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
delete from public.profiles where id=public.synera_user_id();
reset role;
do $$ begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Profile deletion did not cascade'; end if;
  if (select invitations from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111') <> 1 then raise exception 'Profile deletion reset admission'; end if;
end $$;
do $$ declare r text; t text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach t in array array['profiles','pilot_consents','meeting_requests','meeting_messages','profile_blocks','profile_reports','synera_pilot_members','synera_write_limits'] loop
        if has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous table grants remain'; end if;
      end loop;
    end if;
  end loop;
end $$;
select 'PASS: consent, private profiles, shape/column grants, invitation ownership, names, messaging, blocks, third-party isolation, deletion and retained admission counters' as result;
rollback;
