-- REVIEW PROPOSAL ONLY. After consent-evidence and the existing privacy migrations.
-- Preserve narrowly scoped SECURITY DEFINER RPCs under FORCE with an owner-only policy.
begin;
do $owner$ declare t record; begin
  if not exists(select 1 from pg_roles where rolname='authenticated' and not rolbypassrls and not rolsuper) then
    raise exception 'Missing or unsafe authenticated role';
  end if;
  for t in select c.relname,c.relowner,r.rolname from pg_class c
    join pg_namespace n on n.oid=c.relnamespace join pg_roles r on r.oid=c.relowner
    where n.nspname='public' and c.relkind in ('r','p') loop
    if pg_has_role('authenticated',t.relowner,'MEMBER') then raise exception 'Application can assume protected owner'; end if;
    execute format('create policy synera_owner_maintenance on public.%I for all to %I using (true) with check (true)',t.relname,t.rolname);
  end loop;
end $owner$;
alter table public.profiles force row level security;
alter table public.meeting_requests force row level security;
alter table public.pilot_consents force row level security;
alter table public.profile_blocks force row level security;
alter table public.meeting_messages force row level security;
alter table public.profile_reports force row level security;
alter table public.synera_write_limits force row level security;
alter table public.synera_pilot_members force row level security;
alter table public.match_cases force row level security;
alter table public.match_case_approvals force row level security;
alter table public.meeting_location_grants force row level security;
alter table public.location_consent_intents force row level security;
alter table public.group_rooms force row level security;
alter table public.group_room_members force row level security;
alter table public.group_room_messages force row level security;
alter table public.group_room_events force row level security;
alter table public.match_outcome_events force row level security;
alter table public.meeting_address_events force row level security;
alter table public.profile_erasures force row level security;
alter table public.synera_privacy_ops_logs force row level security;
alter table public.consent_events force row level security;
commit;
