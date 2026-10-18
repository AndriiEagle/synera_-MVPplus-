-- Transactional review of every deployed data-bearing authenticated surface AFTER self-erasure.
-- Run only on an explicitly selected disposable erasure acceptance DB. Always ROLLBACK.
begin;
select set_config('synera.review.room',(select id::text from public.group_rooms order by created_at limit 1),true);
select set_config('synera.review.meeting',(select id::text from public.meeting_requests order by created_at limit 1),true);
create function pg_temp.must_deny(q text) returns void language plpgsql security invoker as $$
begin
  begin execute q;
  exception when sqlstate '42501' or sqlstate 'PT403' then return; end;
  raise exception 'Erased actor surface was permitted: %',q;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare t text; n bigint; f text; room uuid:=current_setting('synera.review.room')::uuid; meeting uuid:=current_setting('synera.review.meeting')::uuid;
begin
  if public.synera_user_id()<>'11111111-1111-4111-8111-111111111111' or public.synera_pilot_member() then raise exception 'Identity/admission mismatch'; end if;
  foreach t in array array['profiles','pilot_consents','meeting_requests','meeting_messages','profile_blocks','profile_reports','match_cases','match_case_approvals'] loop
    execute format('select count(*) from public.%I',t) into n;
    if n<>0 then raise exception 'Erased actor read table: %',t; end if;
  end loop;
  foreach t in array array['profile_erasures','synera_pilot_members','synera_write_limits','group_rooms','group_room_members','group_room_messages','group_room_events','meeting_location_grants','location_consent_intents','match_outcome_events','meeting_address_events'] loop
    if has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Private table grant: %',t; end if;
  end loop;
  foreach f in array array['synera_profile_erasure_statement_lock()','synera_profile_erasure_guard()','synera_room_current_member(uuid)','synera_room_pair_blocked(uuid,uuid)','synera_room_actor_allowed(uuid,boolean)','synera_room_all_accepted_current(uuid)','synera_room_admit_write(text)','synera_room_state(uuid,boolean)','synera_location_allowed(uuid)','synera_location_case_current(text,integer,text)','synera_location_public(public.meeting_location_grants)','synera_meeting_names()','synera_limit_writes()','synera_case_guard()','synera_case_project_guard()','synera_approval_guard()','synera_meeting_status_guard()','synera_meeting_address_guard()','synera_location_invalidate()','synera_touch_profile()'] loop
    if has_function_privilege('authenticated','public.'||f,'EXECUTE') then raise exception 'Private helper executable: %',f; end if;
  end loop;
  perform pg_temp.must_deny(format('select public.synera_location_grant(%L::uuid,''approximate'',15,true,''99999999-9999-4999-8999-999999999999'')',meeting));
  perform pg_temp.must_deny(format('select public.synera_location_sample(%L::uuid)',meeting));
  perform pg_temp.must_deny(format('select public.synera_location_revoke(%L::uuid)',meeting));
  if (public.synera_location_access(meeting)->>'eligible')::boolean then raise exception 'Erased location access'; end if;
  perform pg_temp.must_deny('select public.synera_case_outcome(''erase-ab'',''{"action":"state"}''::jsonb)');
  perform pg_temp.must_deny(format('select public.synera_meeting_address(%L::uuid,''erase-ab'',''{}''::jsonb)',meeting));
  perform pg_temp.must_deny(format('select public.synera_send_message(%L::uuid,''99999999-9999-4999-8999-999999999999'',''Stale text'')',meeting));
  perform pg_temp.must_deny('select public.synera_room_create(''Title'',''Goal'',array[''22222222-2222-4222-8222-222222222222''::uuid])');
  if public.synera_room_list()<>'[]'::jsonb then raise exception 'Erased room listing'; end if;
  perform pg_temp.must_deny(format('select public.synera_room_get(%L::uuid)',room));
  perform pg_temp.must_deny(format('select public.synera_room_accept(%L::uuid)',room));
  perform pg_temp.must_deny(format('select public.synera_room_leave(%L::uuid)',room));
  perform pg_temp.must_deny(format('select public.synera_room_start(%L::uuid,1)',room));
  perform pg_temp.must_deny(format('select public.synera_room_message(%L::uuid,1,''99999999-9999-4999-8999-999999999999'',''Stale text'')',room));
  perform pg_temp.must_deny(format('select public.synera_room_advance(%L::uuid,1)',room));
  perform pg_temp.must_deny(format('select public.synera_room_close(%L::uuid,1)',room));
  -- Idempotent self-erasure receipt is the only stateful capability retained by the erased actor.
  if public.synera_erase_profile_data()->'repeated'<>'true'::jsonb then raise exception 'Erasure replay mismatch'; end if;
end $$;
reset role;
select 'PROFILE_ERASURE_ALL_SURFACES_PASS';
rollback;
