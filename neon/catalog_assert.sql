-- Read-only catalog assertions. Execute with ON_ERROR_STOP=1 after the full stack.
do $catalog$ declare bad text; required text; begin
  foreach required in array array['profiles','meeting_requests','pilot_consents','profile_blocks',
    'meeting_messages','profile_reports','synera_write_limits','synera_pilot_members',
    'match_cases','match_case_approvals','meeting_location_grants','location_consent_intents',
    'group_rooms','group_room_members','group_room_messages','group_room_events',
    'match_outcome_events','meeting_address_events','profile_erasures','synera_privacy_ops_logs','consent_events'] loop
    if to_regclass('public.'||required) is null then raise exception 'Protected table missing: %',required; end if;
  end loop;
  select string_agg(c.relname,', ' order by c.relname) into bad from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and (not c.relrowsecurity or not c.relforcerowsecurity);
  if bad is not null then raise exception 'RLS not ENABLED + FORCED: %',bad; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p') and not exists(
      select 1 from pg_policy p where p.polrelid=c.oid and p.polname='synera_owner_maintenance'
        and p.polroles=ARRAY[c.relowner]::oid[] and p.polcmd='*' and p.polpermissive
        and pg_get_expr(p.polqual,c.oid)='true' and pg_get_expr(p.polwithcheck,c.oid)='true')) then
    raise exception 'Owner maintenance policy missing or changed';
  end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then raise exception 'App role missing'; end if;
  if exists(select 1 from pg_roles r where (r.rolsuper or r.rolbypassrls)
    and pg_has_role('authenticated',r.oid,'MEMBER')) then raise exception 'App role can bypass RLS'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','p')
      and pg_has_role('authenticated',c.relowner,'MEMBER')) then raise exception 'App role can assume table owner'; end if;
end $catalog$;
select 'SYNERA_RLS_CATALOG_PASS' as verdict;
