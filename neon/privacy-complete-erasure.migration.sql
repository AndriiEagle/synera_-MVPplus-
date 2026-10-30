-- REVIEW ONLY. NOT APPLIED. Additive after the complete reviewed journey stack
-- and profile-erasure.migration.sql. This is deliberately a different endpoint
-- from synera_erase_profile_data(): that legacy RPC retains bilateral evidence.
begin;
do $$ begin
  if to_regprocedure('public.synera_erase_profile_data()') is null
    or to_regclass('public.location_consent_intents') is null
    or to_regclass('public.meeting_address_events') is null
    or to_regclass('public.match_outcome_events') is null
    or to_regclass('public.group_rooms') is null then
    raise exception 'Apply reviewed profile-erasure and journey migrations first';
  end if;
  if to_regprocedure('public.synera_complete_erase_application_data()') is not null then
    raise exception 'Inspect existing complete erasure migration';
  end if;
end $$;

-- Safety complaints belong to their reporter. A provider account deletion must
-- not cascade them away. Replace only the target FK with an insertion guard;
-- no synthetic provider identity is created. One reserved, stable tombstone
-- deliberately does not link complaints back to an erased provider subject.
alter table public.profile_reports drop constraint profile_reports_reported_id_fkey;
alter table public.profile_reports add column safety_hold_until timestamptz;
-- Trigger-only definer: ordinary members need no SELECT on provider Auth tables.
create function public.synera_report_target_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.safety_hold_until is not null or new.reported_id='00000000-0000-4000-8000-000000000000'::uuid
    or not exists(select 1 from neon_auth."user" u where u.id=new.reported_id) then
    raise exception 'Report target unavailable' using errcode='23503';
  end if;
  return new;
end $$;
revoke all on function public.synera_report_target_guard() from public,authenticated;
create trigger report_target_guard before insert on public.profile_reports for each row execute function public.synera_report_target_guard();

-- This endpoint intentionally has no argument: the verified JWT subject is the
-- only subject it can erase. The legacy erasure runs first to retain its
-- stale-session tombstone and admission lock semantics.
create function public.synera_complete_erase_application_data() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare actor uuid:=public.synera_user_id(); repeated boolean; erased jsonb;
begin
  if actor is null then raise exception 'Erasure unavailable' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,17017));
  repeated:=exists(select 1 from public.profile_erasures where user_id=actor);
  if not repeated then
    erased:=public.synera_erase_profile_data();
    if erased->>'status'<>'application_data_erased' then raise exception 'Erasure unavailable' using errcode='42501'; end if;
  end if;

  -- Deleting a participant's meetings cascades their direct messages, address
  -- agreement events, location grants and location-consent intent ids.
  delete from public.meeting_requests where sender_id=actor or recipient_id=actor;
  -- Cases carry both parties' negotiated material. Complete erasure deletes
  -- cases involving the requester and their dependent approvals/outcomes.
  delete from public.match_cases where participant_low=actor or participant_high=actor;
  delete from public.profile_blocks where blocker_id=actor or blocked_id=actor;
  delete from public.pilot_consents where user_id=actor;
  -- Delete the actor's authored free text, retain another reporter's evidence.
  -- Proposed safety hold: 90 days from this erasure, never extended by retries;
  -- service-role purge removes expired holds. Owner/legal review and a verified
  -- daily scheduler are prerequisites for enabling COMPLETE_ERASURE_READY.
  delete from public.profile_reports where reporter_id=actor;
  update public.profile_reports set reported_id='00000000-0000-4000-8000-000000000000',
    safety_hold_until=coalesce(safety_hold_until,now()+interval '90 days') where reported_id=actor;

  -- A room belongs to several people. Remove the erased person's authored text
  -- and events; revoke membership. A room created by the erased person is
  -- anonymised and closed so peers retain no title/goal supplied by that person.
  -- A peer-owned active room may currently point its turn at the erased
  -- member's position. Close that affected room before removing membership;
  -- peer title, goal and peer-authored rows are retained.
  update public.group_rooms r set status='closed',turn_position=null,turn_deadline=null,
    turn_started_revision=null,closed_at=coalesce(r.closed_at,now()),revision=r.revision+1
    where r.creator_id<>actor and exists(select 1 from public.group_room_members m where m.room_id=r.id and m.user_id=actor);
  delete from public.group_room_messages m using public.group_rooms r
    where m.room_id=r.id and (m.sender_id=actor or r.creator_id=actor);
  delete from public.group_room_events e using public.group_rooms r
    where e.room_id=r.id and (e.actor_id=actor or r.creator_id=actor);
  delete from public.group_room_members m using public.group_rooms r
    where m.room_id=r.id and (m.user_id=actor or r.creator_id=actor);
  delete from public.group_rooms where creator_id=actor;

  -- Retain only the minimal profile/tombstone identity needed to reject an old
  -- provider session. synera_write_limits also remains: it is a protected
  -- anti-abuse counter, not application content, and is inaccessible to clients.
  return jsonb_build_object('status','application_data_completely_erased',
    'providerDeletion','pending','staleSessionTombstone','retained','repeated',repeated);
end $$;
revoke all on function public.synera_complete_erase_application_data() from public,authenticated;
grant execute on function public.synera_complete_erase_application_data() to authenticated;
do $$ declare r text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      execute format('revoke all on function public.synera_complete_erase_application_data() from %I',r);
    end if;
  end loop;
end $$;
commit;
