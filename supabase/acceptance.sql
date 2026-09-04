-- Run only on the dedicated synera-demo project after schema application.
-- Synthetic transactional fixtures; ROLLBACK preserves no test accounts/data.
begin;
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222'),
 ('33333333-3333-4333-8333-333333333333');
insert into public.profiles(id,display_name,is_discoverable) values
 ('11111111-1111-4111-8111-111111111111','Fixture A',false),
 ('22222222-2222-4222-8222-222222222222','Fixture B',true),
 ('33333333-3333-4333-8333-333333333333','Fixture C',false);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.profiles) <> 2 then raise exception 'Profile visibility failed'; end if;
  begin
    insert into public.profiles(id,display_name) values ('44444444-4444-4444-8444-444444444444','Not my profile');
    raise exception 'Cross-user profile creation allowed';
  exception when insufficient_privilege then null; end;
  update public.profiles set display_name='Forbidden' where id='22222222-2222-4222-8222-222222222222';
  if found then raise exception 'Cross-user profile edit allowed'; end if;
  begin
    update public.profiles set id='44444444-4444-4444-8444-444444444444' where id='11111111-1111-4111-8111-111111111111';
    raise exception 'Owner reassignment allowed';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.meeting_requests(sender_id,recipient_id,note) values
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Synthetic request');
do $$ begin
  update public.meeting_requests set status='accepted';
  if found then raise exception 'Sender accepted own request'; end if;
  begin
    insert into public.meeting_requests(sender_id,recipient_id,note) values
      ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Duplicate');
    raise exception 'Duplicate pending request allowed';
  exception when unique_violation then null; end;
  begin
    insert into public.meeting_requests(sender_id,recipient_id,note) values
      ('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','Hidden recipient');
    raise exception 'Hidden recipient invitation allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.meeting_requests(sender_id,recipient_id,note,status) values
      ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Preset status','accepted');
    raise exception 'Preset status allowed';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.meeting_requests) then raise exception 'Third party can read request'; end if;
  update public.meeting_requests set status='declined';
  if found then raise exception 'Third party can respond'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  update public.meeting_requests set status='accepted';
  if not found then raise exception 'Recipient cannot accept'; end if;
  update public.meeting_requests set status='declined';
  if found then raise exception 'Final response was mutable'; end if;
  begin
    update public.meeting_requests set sender_id='33333333-3333-4333-8333-333333333333';
    raise exception 'Participants are mutable';
  exception when insufficient_privilege then null; end;
end $$;

set local role anon;
do $$ begin
  begin
    perform 1 from public.profiles;
    raise exception 'Anonymous table access allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: owner isolation, opt-in discovery, participant isolation, recipient response, duplicate and column grants' as result;
rollback;
