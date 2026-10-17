-- Generated Neon room acceptance; DISPOSABLE ONLY; always ROLLBACK.
-- NOT RUN. Transactional acceptance for group-room.proposal.sql on a disposable
-- Supabase-shaped database only. Apply real-pilot.proposal.sql first, then this
-- proposal. Neon must additionally prove its restrictive synera_pilot_member gate.
-- Creates fixture Auth users and always ROLLBACKs; no production data is touched.
begin;
insert into neon_auth."user"(id,name,email,"emailVerified") values
('11111111-1111-4111-8111-111111111111','Room 1','a@synera-room.example',true),
('22222222-2222-4222-8222-222222222222','Room 2','b@synera-room.example',true),
('33333333-3333-4333-8333-333333333333','Room 3','c@synera-room.example',true),
('44444444-4444-4444-8444-444444444444','Room 4','d@synera-room.example',true);
insert into public.synera_pilot_members(email) values ('a@synera-room.example'),('b@synera-room.example'),('c@synera-room.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Room fixture','Design','Sales',id <> '44444444-4444-4444-8444-444444444444',
  jsonb_build_object('version',1,'goal','Review','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
  'languages',jsonb_build_array('en'),'modes',jsonb_build_array('joint_project'),'available_from',current_date::text,
  'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare state jsonb; room_id uuid; begin
  -- Creator must use their JWT identity; raw client writes and arbitrary UUID actors are unavailable.
  begin insert into public.group_rooms(creator_id,title,goal) values ('22222222-2222-4222-8222-222222222222','forged','forged'); raise exception 'Raw room insert allowed'; exception when insufficient_privilege then null; end;
  begin perform public.synera_room_create('Room','Goal',array['11111111-1111-4111-8111-111111111111'::uuid]); raise exception 'Creator invited self'; exception when invalid_parameter_value then null; end;
  state:=public.synera_room_create('Text room','One concrete review',array['22222222-2222-4222-8222-222222222222'::uuid,'33333333-3333-4333-8333-333333333333'::uuid]);
  room_id:=(state->>'id')::uuid;
  if state->>'own_role'<>'creator' or jsonb_array_length(state->'participants')<>3 or state->'transcript'<>'[]'::jsonb then raise exception 'Creation state leaked or omitted participants'; end if;
  perform set_config('group_room.acceptance_id',room_id::text,true);
end $$;

select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  if public.synera_room_list()<>'[]'::jsonb then raise exception 'Outsider saw a room'; end if;
  begin perform public.synera_room_get(current_setting('group_room.acceptance_id')::uuid); raise exception 'Outsider read invitation'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  state:=public.synera_room_get(current_setting('group_room.acceptance_id')::uuid);
  if state->>'own_membership_status'<>'invited' or state->'transcript'<>'[]'::jsonb then raise exception 'Invitation exposed transcript before acceptance'; end if;
  state:=public.synera_room_accept(current_setting('group_room.acceptance_id')::uuid);
  if state->>'revision'<>'2' or state->>'own_membership_status'<>'accepted' then raise exception 'First acceptance did not use server revision'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select public.synera_room_accept(current_setting('group_room.acceptance_id')::uuid);

select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  begin perform public.synera_room_start(current_setting('group_room.acceptance_id')::uuid,null); raise exception 'NULL revision accepted'; exception when invalid_parameter_value then null; end;
  state:=public.synera_room_start(current_setting('group_room.acceptance_id')::uuid,3);
  if state->>'status'<>'active' or state->'active_turn'->>'speaker_id'<>public.synera_user_id()::text then raise exception 'Creator did not start first turn'; end if;
  state:=public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,4,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','First factual message');
  if state->>'revision'<>'5' or jsonb_array_length(state->'transcript')<>1 then raise exception 'Server message revision failed'; end if;
  -- Same id/body is a safe retry, not a second message or a new action.
  state:=public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,4,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','First factual message');
  if state->>'revision'<>'5' or jsonb_array_length(state->'transcript')<>1 then raise exception 'Message retry was not idempotent'; end if;
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,5,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','different'); raise exception 'Idempotency conflict accepted'; exception when invalid_parameter_value then null; end;
  perform public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,5);
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,6,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','wrong speaker'); raise exception 'Wrong speaker wrote'; exception when insufficient_privilege then null; end;
  begin perform public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,6); raise exception 'Non-speaker advanced before deadline'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,6,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Second factual message');
reset role;
insert into public.group_room_messages(room_id,message_id,sender_id,room_revision,body)
select current_setting('group_room.acceptance_id')::uuid,gen_random_uuid(),'22222222-2222-4222-8222-222222222222',7,'fixture cap'
from generate_series(1,98);
do $$ begin
  if (select count(*) from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid)<>100 then raise exception 'Room fixture cap not exact'; end if;
  perform set_config('group_room.cap_revision',(select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.cap_events',(select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.cap_messages',(select count(*)::text from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.cap_counter',(select messages::text from public.synera_write_limits where user_id='22222222-2222-4222-8222-222222222222'),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  state:=public.synera_room_get(current_setting('group_room.acceptance_id')::uuid);
  if jsonb_array_length(state->'transcript')<>100 then raise exception 'Room transcript cap not exact'; end if;
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,7,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','over room cap'); raise exception 'Room cap accepted 101st message'; exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
do $$ begin
  if (select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.cap_revision') or (select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.cap_events') or (select count(*)::text from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.cap_messages') or (select messages::text from public.synera_write_limits where user_id='22222222-2222-4222-8222-222222222222')<>current_setting('group_room.cap_counter') then raise exception 'Room-cap denial changed state'; end if;
end $$;
delete from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid and body='fixture cap';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,7);
do $$ begin
  begin perform public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,7); raise exception 'Stale concurrent advance accepted'; exception when sqlstate 'PT409' then null; end;
end $$;

reset role;
insert into public.synera_write_limits(user_id) values ('33333333-3333-4333-8333-333333333333') on conflict (user_id) do nothing;
update public.synera_write_limits set messages=100 where user_id='33333333-3333-4333-8333-333333333333';
do $$ begin
  perform set_config('group_room.shared_revision',(select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.shared_events',(select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.shared_counter',(select messages::text from public.synera_write_limits where user_id='33333333-3333-4333-8333-333333333333'),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,8,'dddddddd-dddd-4ddd-8ddd-dddddddddddd','over shared quota'); raise exception 'Shared message quota accepted'; exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
do $$ begin
  if (select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.shared_revision') or (select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.shared_events') or (select messages::text from public.synera_write_limits where user_id='33333333-3333-4333-8333-333333333333')<>current_setting('group_room.shared_counter') then raise exception 'Message quota denial changed state'; end if;
end $$;

-- Only the server deadline allows a non-speaker to advance; it records no_response.
reset role;
update public.group_rooms set created_at=now()-interval '2 minutes',turn_deadline=now()-interval '1 second' where id=current_setting('group_room.acceptance_id')::uuid;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,8);
reset role;
do $$ begin
  if not exists(select 1 from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid and event_type='no_response') then raise exception 'Silent deadline was not labelled no_response'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  state:=public.synera_room_leave(current_setting('group_room.acceptance_id')::uuid);
  if state->>'status'<>'left' then raise exception 'Leave did not close own access'; end if;
end $$;
reset role;
do $$ begin
  if (select status from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid)<>'paused' then raise exception 'Leave did not pause active room'; end if;
end $$;

insert into public.synera_write_limits(user_id) values ('11111111-1111-4111-8111-111111111111') on conflict (user_id) do nothing;
update public.synera_write_limits set invitations=20 where user_id='11111111-1111-4111-8111-111111111111';
do $$ begin
  perform set_config('group_room.invite_rooms',(select count(*)::text from public.group_rooms),true);
  perform set_config('group_room.invite_events',(select count(*)::text from public.group_room_events),true);
  perform set_config('group_room.invite_counter',(select invitations::text from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111'),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_create('Denied room','Counter check',array['22222222-2222-4222-8222-222222222222'::uuid]); raise exception 'Shared invitation quota accepted'; exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*)::text from public.group_rooms)<>current_setting('group_room.invite_rooms') or (select count(*)::text from public.group_room_events)<>current_setting('group_room.invite_events') or (select invitations::text from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111')<>current_setting('group_room.invite_counter') then raise exception 'Invitation quota denial changed state'; end if;
end $$;

-- A block or loss of current-policy consent removes transcript/RPC access immediately.
insert into public.profile_blocks(blocker_id,blocked_id) values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_get(current_setting('group_room.acceptance_id')::uuid); raise exception 'Blocked member retained transcript'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.profile_blocks;
delete from public.pilot_consents where user_id='22222222-2222-4222-8222-222222222222' and policy_version='2026-09-05-pilot-3';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_get(current_setting('group_room.acceptance_id')::uuid); raise exception 'Expired-policy member retained transcript'; exception when insufficient_privilege then null; end;
end $$;

reset role;
do $$ declare r text; f text; begin
  -- Metadata oracle: authenticated reaches room data only through the public RPCs.
  foreach f in array array['group_rooms','group_room_members','group_room_messages','group_room_events'] loop
    if has_table_privilege('authenticated','public.'||f,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Authenticated table grant remains: %',f; end if;
  end loop;
  foreach f in array array['synera_room_current_member(uuid)','synera_room_pair_blocked(uuid,uuid)','synera_room_actor_allowed(uuid,boolean)','synera_room_all_accepted_current(uuid)','synera_room_admit_write(text)','synera_room_state(uuid,boolean)'] loop
    if has_function_privilege('authenticated','public.'||f,'EXECUTE') then raise exception 'Authenticated private helper grant remains: %',f; end if;
  end loop;
  foreach f in array array['synera_room_create(text,text,uuid[])','synera_room_list()','synera_room_get(uuid)','synera_room_accept(uuid)','synera_room_leave(uuid)','synera_room_start(uuid,integer)','synera_room_message(uuid,integer,uuid,text)','synera_room_advance(uuid,integer)','synera_room_close(uuid,integer)'] loop
    if not has_function_privilege('authenticated','public.'||f,'EXECUTE') then raise exception 'Authenticated public RPC grant missing: %',f; end if;
  end loop;
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach f in array array['synera_room_create(text,text,uuid[])','synera_room_list()','synera_room_get(uuid)','synera_room_accept(uuid)','synera_room_leave(uuid)','synera_room_start(uuid,integer)','synera_room_message(uuid,integer,uuid,text)','synera_room_advance(uuid,integer)','synera_room_close(uuid,integer)'] loop
        if has_function_privilege(r,'public.'||f,'EXECUTE') then raise exception 'Anonymous RPC grant remains'; end if;
      end loop;
    end if;
  end loop;
end $$;
select 'PASS: authenticated room invitations, explicit acceptance, private transcript, current consent/block revocation, idempotency, revision lock and no-response turn boundary' as result;

-- A verified Auth account with current consent/visible profile still needs operator admission.
reset role;
update public.profiles set is_discoverable=true where id='44444444-4444-4444-8444-444444444444';
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values ('44444444-4444-4444-8444-444444444444','2026-09-05-pilot-3',true,true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_create('Unadmitted','Goal',array['11111111-1111-4111-8111-111111111111'::uuid]); raise exception 'Unadmitted verified account entered room'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;