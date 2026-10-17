-- Metadata only. No user rows, mutations, credentials or fixture claims.
begin read only;
select jsonb_build_object(
 'database',current_database(),'role',current_user,'server_version',current_setting('server_version'),
 'provider_uid_present',to_regprocedure('auth.uid()') is not null,
 'identity_type',(select format_type(atttypid,atttypmod) from pg_attribute where attrelid=to_regclass('neon_auth."user"') and attname='id' and not attisdropped),
 'tables',(select jsonb_agg(jsonb_build_object('name',n,'present',c.oid is not null,'rls',c.relrowsecurity) order by n)
  from unnest(array['profiles','pilot_consents','meeting_requests','meeting_messages','match_cases','match_case_approvals','meeting_location_grants','group_rooms','group_room_members','group_room_messages','group_room_events','match_outcome_events','meeting_address_events']) n
  left join pg_class c on c.oid=to_regclass('public.'||n)),
 'functions',(select coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'args',pg_get_function_identity_arguments(p.oid),'definer',p.prosecdef,'body_md5',md5(p.prosrc)) order by p.proname),'[]'::jsonb)
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('synera_user_id','synera_pilot_member','synera_case_guard','synera_approval_guard','synera_room_current_member','synera_case_outcome','synera_meeting_address','synera_send_message')),
 'message_policies',(select coalesce(jsonb_agg(jsonb_build_object('name',policyname,'permissive',permissive,'command',cmd) order by policyname),'[]'::jsonb) from pg_policies where schemaname='public' and tablename='meeting_messages')
) as pilot_metadata;
rollback;
