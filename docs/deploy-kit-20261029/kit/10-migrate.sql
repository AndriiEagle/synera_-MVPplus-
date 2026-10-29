-- Owner reviews project quiet-credit-94155104 / production in the console first.
-- Source bodies are frozen; wrappers only skip complete known migrations.
-- Copy the ENTIRE file into SQL Editor, never only the selected line.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
SELECT pg_advisory_xact_lock(97720261029);
DO $kit$ BEGIN
if not (coalesce((has_schema_privilege('authenticated','public','usage')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) and coalesce((to_regclass('public.profiles') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='display_name')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='city')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='offers')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='seeks')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_discoverable')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profiles')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profiles'),'select'),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profiles'),'delete'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='display_name' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='city' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='offers' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='seeks' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='is_discoverable' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='id' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='display_name' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='city' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='offers' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='seeks' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='is_discoverable' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_update')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_delete')),false) and coalesce((to_regclass('public.meeting_requests') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='sender_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='recipient_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='note')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_requests')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.meeting_requests'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='sender_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='recipient_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='note' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='status' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_respond')),false) and coalesce((to_regclass('public.pilot_consents') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='policy_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='terms_accepted')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='privacy_acknowledged')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='accepted_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.pilot_consents')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.pilot_consents'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='user_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='policy_version' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='terms_accepted' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='privacy_acknowledged' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='consent_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='consent_create')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='brief')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='map_visible')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at')),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='brief' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='map_visible' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='brief' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='map_visible' and not attisdropped),'update'),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_touch_profile' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_consent')),false) and coalesce((to_regclass('public.profile_blocks') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='blocker_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='blocked_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_blocks')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_blocks'),'select'),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_blocks'),'delete'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_blocks'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_blocks') and attname='blocker_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_blocks'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_blocks') and attname='blocked_id' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_delete')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_unblocked')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='proposed_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='duration_minutes')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_place')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='sender_name')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='recipient_name')),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='proposed_at' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='duration_minutes' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_place' and not attisdropped),'insert'),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_names' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_plan')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_cancel')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_response_unblocked')),false) and coalesce((to_regclass('public.meeting_messages') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='sender_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='body')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_messages')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.meeting_messages'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='meeting_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='sender_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='body' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='messages_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='messages_create')),false) and coalesce((to_regclass('public.profile_reports') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reporter_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reported_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reason')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='detail')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_reports')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_reports'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reporter_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reported_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reason' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='detail' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='reports_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='reports_create')),false) and coalesce((to_regclass('public.synera_write_limits') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='window_started_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='invitations')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='messages')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='reports')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.synera_write_limits')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_limit_writes' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((to_regclass('public.synera_pilot_members') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_pilot_members' and column_name='email')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_pilot_members' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.synera_pilot_members')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='synera_members_only')),false)) then raise exception 'Baseline r8 objects missing; do not apply schema.proposal.sql to production'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((prosqlbody is not null and pg_get_functiondef(oid) like '%RETURN auth.uid()%' and prosecdef=false and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY[]::text[]))) then raise exception 'Unknown function definition: public.synera_user_id()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare k text; item text; keys text[] := array[''version'',''goal'',''offer_tags'',''need_tags'',''languages'',''modes'',''available_from'',''available_until'',''remote'',''max_km'',''city_code'',''confidentiality'',''accepts_confidentiality''];
begin
  if jsonb_typeof(b) is distinct from ''object'' or not b ?& keys or b - keys <> ''{}''::jsonb or b->''version'' is distinct from ''1''::jsonb then return false; end if;
  foreach k in array array[''goal'',''available_from'',''available_until'',''city_code''] loop
    if jsonb_typeof(b->k) is distinct from ''string'' then return false; end if;
  end loop;
  if length(b->>''goal'') > 240 or b->>''city_code'' not in ('''',''zurich'',''winterthur'',''zug'',''basel'',''bern'') then return false; end if;
  foreach k in array array[''remote'',''confidentiality'',''accepts_confidentiality''] loop
    if jsonb_typeof(b->k) is distinct from ''boolean'' then return false; end if;
  end loop;
  if not (b->''max_km'' = any(array[''0'',''25'',''50'',''100'',''300'']::jsonb[])) then return false; end if;
  foreach k in array array[''offer_tags'',''need_tags'',''languages'',''modes''] loop
    if jsonb_typeof(b->k) is distinct from ''array'' then return false; end if;
    if jsonb_array_length(b->k) > 7 then return false; end if;
    for item in select jsonb_array_elements_text(b->k) loop
      if k in (''offer_tags'',''need_tags'') and item not in (''automation'',''design'',''research'',''sales'',''video'',''finance'',''events'') then return false; end if;
      if k = ''languages'' and item not in (''uk'',''en'',''de'',''fr'') then return false; end if;
      if k = ''modes'' and item not in (''exchange'',''joint_project'') then return false; end if;
      if item is null then return false; end if;
    end loop;
    if (select count(distinct v) from jsonb_array_elements_text(b->k) v) <> jsonb_array_length(b->k) then return false; end if;
  end loop;
  foreach k in array array[''available_from'',''available_until''] loop
    if b->>k <> '''' and ((b->>k) !~ ''^[0-9]{4}-[0-9]{2}-[0-9]{2}$'' or to_char((b->>k)::date, ''YYYY-MM-DD'') <> b->>k) then return false; end if;
  end loop;
  if b->>''available_from'' <> '''' and b->>''available_until'' <> '''' and b->>''available_from'' > b->>''available_until'' then return false; end if;
  return true;
exception when others then return false;
end' and prosecdef=false and provolatile='i' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]) or (btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare k text; item text; v2 boolean; pilot boolean;
  keys text[] := array[''version'',''goal'',''offer_tags'',''need_tags'',''languages'',''modes'',''available_from'',''available_until'',''remote'',''max_km'',''city_code'',''confidentiality'',''accepts_confidentiality''];
begin
  if jsonb_typeof(b) is distinct from ''object'' then return false; end if;
  v2 := b->''version'' = ''2''::jsonb;
  if not v2 and b->''version'' is distinct from ''1''::jsonb then return false; end if;
  if v2 then keys := keys || array[''mode_details'']; end if;
  if not b ?& keys or b - keys <> ''{}''::jsonb then return false; end if;
  foreach k in array array[''goal'',''available_from'',''available_until'',''city_code''] loop
    if jsonb_typeof(b->k) is distinct from ''string'' then return false; end if;
  end loop;
  if length(b->>''goal'') > 240 or b->>''city_code'' not in ('''',''zurich'',''winterthur'',''zug'',''basel'',''bern'') then return false; end if;
  foreach k in array array[''remote'',''confidentiality'',''accepts_confidentiality''] loop
    if jsonb_typeof(b->k) is distinct from ''boolean'' then return false; end if;
  end loop;
  if not (b->''max_km'' = any(array[''0'',''25'',''50'',''100'',''300'']::jsonb[])) then return false; end if;
  foreach k in array array[''offer_tags'',''need_tags'',''languages'',''modes''] loop
    if jsonb_typeof(b->k) is distinct from ''array'' then return false; end if;
    if jsonb_array_length(b->k) > (case k when ''languages'' then 4 when ''modes'' then 5 else 7 end) then return false; end if;
    for item in select jsonb_array_elements_text(b->k) loop
      if k in (''offer_tags'',''need_tags'') and item not in (''automation'',''design'',''research'',''sales'',''video'',''finance'',''events'') then return false; end if;
      if k = ''languages'' and item not in (''uk'',''en'',''de'',''fr'') then return false; end if;
      if k = ''modes'' and item not in (''exchange'',''joint_project'',''paid_service'',''referral'',''hybrid'') then return false; end if;
      if item is null then return false; end if;
    end loop;
    if (select count(distinct v) from jsonb_array_elements_text(b->k) v) <> jsonb_array_length(b->k) then return false; end if;
  end loop;
  -- normalizeBrief writes version 2 exactly when a pilot mode is present, and only then mode_details.
  pilot := exists (select 1 from jsonb_array_elements_text(b->''modes'') m where m in (''paid_service'',''referral'',''hybrid''));
  if pilot is distinct from v2 then return false; end if;
  if v2 and not public.synera_valid_mode_details(b->''mode_details'') then return false; end if;
  foreach k in array array[''available_from'',''available_until''] loop
    if b->>k <> '''' and ((b->>k) !~ ''^[0-9]{4}-[0-9]{2}-[0-9]{2}$'' or to_char((b->>k)::date, ''YYYY-MM-DD'') <> b->>k) then return false; end if;
  end loop;
  if b->>''available_from'' <> '''' and b->>''available_until'' <> '''' and b->>''available_from'' > b->>''available_until'' then return false; end if;
  return true;
exception when others then return false;
end' and prosecdef=false and provolatile='i' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_valid_brief(jsonb)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_touch_profile' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_touch_profile' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin new.updated_at := now(); return new; end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_touch_profile()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_names' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_names' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  -- The caller can read their own profile and the opted-in recipient. Names are server-controlled.
  select display_name into new.sender_name from public.profiles where id = new.sender_id;
  select display_name into new.recipient_name from public.profiles where id = new.recipient_id;
  if new.sender_name is null or new.recipient_name is null then raise exception ''Participant unavailable''; end if;
  return new;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_meeting_names()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_limit_writes' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_limit_writes' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid := public.synera_user_id(); counter public.synera_write_limits%rowtype;
begin
  if actor is null then raise exception ''Authentication required''; end if;
  if tg_table_name not in (''meeting_requests'',''meeting_messages'',''profile_reports'') then raise exception ''Unsupported trigger''; end if;
  insert into public.synera_write_limits(user_id) values (actor) on conflict (user_id) do nothing;
  select * into counter from public.synera_write_limits where user_id = actor for update;
  if counter.window_started_at <= now() - interval ''1 day'' then
    update public.synera_write_limits set invitations=0,messages=0,reports=0,window_started_at=now() where user_id=actor returning * into counter;
  end if;
  if tg_table_name = ''meeting_requests'' then
    if new.sender_id <> actor or counter.invitations >= 20 then raise exception ''Invitation limit or invalid sender''; end if;
    update public.synera_write_limits set invitations=invitations+1 where user_id=actor;
  elsif tg_table_name = ''meeting_messages'' then
    if new.sender_id <> actor or counter.messages >= 100 then raise exception ''Message limit or invalid sender''; end if;
    update public.synera_write_limits set messages=messages+1 where user_id=actor;
  elsif tg_table_name = ''profile_reports'' then
    if new.reporter_id <> actor or counter.reports >= 10 then raise exception ''Report limit or invalid sender''; end if;
    update public.synera_write_limits set reports=reports+1 where user_id=actor;
  end if;
  return new;
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_limit_writes()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select exists (
    select 1 from neon_auth."user" u join public.synera_pilot_members m on m.email=lower(u.email)
    where u.id=(select public.synera_user_id()) and u."emailVerified"=true
  );' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]) or (btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select exists (
    select 1 from neon_auth."user" u join public.synera_pilot_members m on m.email=lower(u.email)
    where u.id=(select public.synera_user_id()) and u."emailVerified"=true
      and not exists(select 1 from public.profile_erasures e where e.user_id=u.id)
  );' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_pilot_member()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare item text; referral_keys text[] := array[''role'',''benefitTags'',''sourceDeclared'',''recipientScopeDeclared'',''thirdPartyStatus''];
begin
  if jsonb_typeof(d) is distinct from ''object'' or not d ?& array[''paid_service'',''referral'',''hybrid''] or d - array[''paid_service'',''referral'',''hybrid''] <> ''{}''::jsonb then return false; end if;
  if jsonb_typeof(d->''paid_service'') is distinct from ''object'' or (d->''paid_service'') - ''role'' <> ''{}''::jsonb
    or jsonb_typeof(d->''paid_service''->''role'') is distinct from ''string'' or d->''paid_service''->>''role'' not in ('''',''buyer'',''supplier'') then return false; end if;
  if jsonb_typeof(d->''referral'') is distinct from ''object'' or not d->''referral'' ?& referral_keys or (d->''referral'') - referral_keys <> ''{}''::jsonb then return false; end if;
  if jsonb_typeof(d->''referral''->''role'') is distinct from ''string'' or d->''referral''->>''role'' not in ('''',''introducer'',''seeker'') then return false; end if;
  if jsonb_typeof(d->''referral''->''sourceDeclared'') is distinct from ''boolean'' or jsonb_typeof(d->''referral''->''recipientScopeDeclared'') is distinct from ''boolean'' then return false; end if;
  if jsonb_typeof(d->''referral''->''thirdPartyStatus'') is distinct from ''string'' or d->''referral''->>''thirdPartyStatus'' not in (''not_consulted'',''consented'') then return false; end if;
  if jsonb_typeof(d->''referral''->''benefitTags'') is distinct from ''array'' or jsonb_array_length(d->''referral''->''benefitTags'') > 7 then return false; end if;
  for item in select jsonb_array_elements_text(d->''referral''->''benefitTags'') loop
    if item is null or item not in (''automation'',''design'',''research'',''sales'',''video'',''finance'',''events'') then return false; end if;
  end loop;
  if (select count(distinct v) from jsonb_array_elements_text(d->''referral''->''benefitTags'') v) <> jsonb_array_length(d->''referral''->''benefitTags'') then return false; end if;
  if jsonb_typeof(d->''hybrid'') is distinct from ''object'' or (d->''hybrid'') - ''components'' <> ''{}''::jsonb or jsonb_typeof(d->''hybrid''->''components'') is distinct from ''array'' then return false; end if;
  for item in select jsonb_array_elements_text(d->''hybrid''->''components'') loop
    if item is null or item not in (''exchange'',''paid_service'',''referral'') then return false; end if;
  end loop;
  if (select count(distinct v) from jsonb_array_elements_text(d->''hybrid''->''components'') v) <> jsonb_array_length(d->''hybrid''->''components'') then return false; end if;
  return true;
exception when others then return false;
end' and prosecdef=false and provolatile='i' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_valid_mode_details(jsonb)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if tg_op = ''INSERT'' then
    new.version := 1; new.status := ''open''; new.closed_at := null; new.created_at := now(); new.updated_at := now();
    if new.expires_at <= now() then raise exception ''Case already expired''; end if;
    return new;
  end if;
  if old.status <> ''open'' then raise exception ''Closed case is immutable''; end if;
  if old.expires_at <= now() and new.status = ''open'' then raise exception ''Case expired''; end if;
  if new.case_id <> old.case_id or new.participant_low <> old.participant_low or new.participant_high <> old.participant_high
    or new.created_at <> old.created_at or new.expires_at > old.expires_at then raise exception ''Case identity is immutable''; end if;
  new.updated_at := now();
  if new.status <> ''open'' then
    new.closed_at := now(); new.mode := old.mode; new.material := old.material; new.terms_hash := old.terms_hash; new.version := old.version;
    return new;
  end if;
  if new.material is distinct from old.material or new.mode is distinct from old.mode or new.terms_hash is distinct from old.terms_hash then
    if new.terms_hash = old.terms_hash then raise exception ''Material changed without a new hash''; end if;
    -- Older approvals stop being live because they name the previous version and hash.
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]) or (btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if tg_op = ''INSERT'' then
    new.version := 1; new.status := ''open''; new.closed_at := null; new.created_at := now(); new.updated_at := now();
    if new.expires_at <= now() then raise exception ''Case already expired''; end if;
    return new;
  end if;
  if old.status <> ''open'' then raise exception ''Closed case is immutable''; end if;
  if old.expires_at <= now() and new.status = ''open'' then raise exception ''Case expired''; end if;
  if new.case_id <> old.case_id or new.participant_low <> old.participant_low or new.participant_high <> old.participant_high
    or new.created_at <> old.created_at or new.expires_at > old.expires_at then raise exception ''Case identity is immutable''; end if;
  new.updated_at := now();
  if new.status <> ''open'' then
    new.closed_at := now(); new.mode := old.mode; new.material := old.material; new.terms_hash := old.terms_hash; new.version := old.version;
    return new;
  end if;
  if new.material is distinct from old.material or new.mode is distinct from old.mode or new.terms_hash is distinct from old.terms_hash then
    if new.terms_hash = old.terms_hash then raise exception ''Material changed without a new hash''; end if;
    -- Older approvals stop being live because they name the previous version and hash.
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_case_guard()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_project_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_project_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare party uuid;
begin
  if new.mode <> ''joint_project'' or new.status <> ''open'' then return new; end if;
  if new.material->''components'' is distinct from ''["joint_project"]''::jsonb
    or jsonb_typeof(new.material->''outcomes'') is distinct from ''array''
    or jsonb_typeof(new.material#>''{trial,deliverables}'') is distinct from ''array'' then
    raise exception ''Invalid joint project material'';
  end if;
  if exists(select 1 from jsonb_array_elements(new.material->''outcomes'') o
      where coalesce(o->>''receiver_id'','''') not in (new.participant_low::text,new.participant_high::text))
    or exists(select 1 from jsonb_array_elements(new.material#>''{trial,deliverables}'') d
      where coalesce(d->>''giver_id'','''') not in (new.participant_low::text,new.participant_high::text)
        or coalesce(d->>''receiver_id'','''') not in (new.participant_low::text,new.participant_high::text)
        or d->>''giver_id''=d->>''receiver_id'') then
    raise exception ''Joint project material must belong to its participants'';
  end if;
  foreach party in array array[new.participant_low,new.participant_high] loop
    if not exists(select 1 from jsonb_array_elements(new.material->''outcomes'') o where o->>''receiver_id''=party::text)
      or not exists(select 1 from jsonb_array_elements(new.material#>''{trial,deliverables}'') d where d->>''giver_id''=party::text) then
      raise exception ''Joint project requires each contribution and result'';
    end if;
  end loop;
  return new;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_case_project_guard()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if m->''compensation''->>''status'' not in (''agreed_exchange'',''agreed_money'',''agreed_none'') then return false; end if;
  if m->''components'' ? ''paid_service'' and m->''compensation''->>''status'' <> ''agreed_money'' then return false; end if;
  if m->''compensation''->>''status'' = ''agreed_money'' and (jsonb_typeof(m->''compensation''->''amount_minor'') is distinct from ''number''
    or coalesce(m->''compensation''->>''currency'', '''') !~ ''^[A-Z]{3}$'' or jsonb_typeof(m->''compensation''->''invoice_required'') is distinct from ''boolean'') then return false; end if;
  if jsonb_typeof(m->''terms''->''revision_limit'') is distinct from ''number'' then return false; end if;
  if ''unresolved'' in (m->''terms''->>''confidentiality'', m->''terms''->>''intellectual_property'', m->''terms''->>''cancellation'') then return false; end if;
  return coalesce(m->''terms''->>''confidentiality'', '''') <> '''' and coalesce(m->''terms''->>''intellectual_property'', '''') <> '''' and coalesce(m->''terms''->>''cancellation'', '''') <> '''';
exception when others then return false;
end' and prosecdef=false and provolatile='i' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_case_material_complete(jsonb)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_approval_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_approval_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if tg_op = ''INSERT'' then new.approved_at := now(); new.withdrawn_at := null; return new; end if;
  if old.withdrawn_at is not null then raise exception ''Withdrawn approval is final''; end if;
  if new.case_id <> old.case_id or new.party_id <> old.party_id or new.approved_version <> old.approved_version
    or new.approved_terms_hash <> old.approved_terms_hash or new.approved_at <> old.approved_at then raise exception ''Approval is immutable''; end if;
  new.withdrawn_at := now();
  return new;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_approval_guard()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid := public.synera_user_id();
begin
  if new.status is not distinct from old.status then return new; end if;
  if not pg_catalog.row_security_active(''public.meeting_requests''::pg_catalog.regclass) then return new; end if;
  -- Only the recipient answers a pending invitation.
  if old.status = ''pending'' and new.status in (''accepted'', ''declined'') and actor is not null and actor = old.recipient_id then
    -- Accepting needs the SAME live agreement that sending needed (meetings_need_approved_case).
    if new.status = ''accepted'' and not exists (
      select 1 from public.match_cases c where c.status = ''open'' and c.expires_at > now()
        and c.participant_low = least(old.sender_id, old.recipient_id) and c.participant_high = greatest(old.sender_id, old.recipient_id)
        and (select count(distinct a.party_id) from public.match_case_approvals a where a.case_id = c.case_id and a.withdrawn_at is null
          and a.approved_version = c.version and a.approved_terms_hash = c.terms_hash and a.party_id in (c.participant_low, c.participant_high)) = 2) then
      -- Not an authorization failure: the person may re-approve the current revision and accept again.
      raise exception ''Both current approvals required before acceptance'' using errcode = ''PT409'';
    end if;
    return new;
  end if;
  -- Only the sender cancels, before or after acceptance.
  if old.status in (''pending'', ''accepted'') and new.status = ''cancelled'' and actor is not null and actor = old.sender_id then return new; end if;
  -- Everything else is denied, including the sender accepting for the recipient, reopening a closed
  -- invitation, and reversing an acceptance.
  raise exception ''Invitation status transition denied'' using errcode = ''42501'';
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_meeting_status_guard()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if new.meeting_address is distinct from old.meeting_address and (old.status<>''accepted'' or new.status<>''accepted'') then
    raise exception ''Address changes require an already accepted meeting'' using errcode=''42501'';
  end if;
  return new;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_meeting_address_guard()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_case_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, integer, text') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_case_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, integer, text') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select exists(select 1 from public.match_cases c where c.case_id=p_case_id and c.version=p_version
    and c.terms_hash=p_hash and c.status=''open'' and c.expires_at>now()
    and (select count(distinct a.party_id) from public.match_case_approvals a where a.case_id=c.case_id
      and a.withdrawn_at is null and a.approved_version=c.version and a.approved_terms_hash=c.terms_hash
      and a.party_id in (c.participant_low,c.participant_high))=2);' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_case_current(text,integer,text)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select exists(select 1 from public.meeting_requests m where m.id=p_meeting_id
    and public.synera_user_id() in (m.sender_id,m.recipient_id) and m.status=''accepted''
    and m.proposed_at is not null and m.duration_minutes is not null
    and btrim(m.meeting_place)<>'''' and lower(btrim(m.meeting_place)) not in (''online'',''онлайн'')
    and public.synera_pilot_member()
    and exists(select 1 from public.pilot_consents p where p.user_id=public.synera_user_id() and p.policy_version=''2026-09-05-pilot-3'')
    and not exists(select 1 from public.profile_blocks b where (b.blocker_id,b.blocked_id) in
      ((m.sender_id,m.recipient_id),(m.recipient_id,m.sender_id)))
    and exists(select 1 from public.match_cases c where c.participant_low=least(m.sender_id,m.recipient_id)
      and c.participant_high=greatest(m.sender_id,m.recipient_id)
      and public.synera_location_case_current(c.case_id,c.version,c.terms_hash)));' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_allowed(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_public' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='meeting_location_grants') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_public' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='meeting_location_grants') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select jsonb_build_object(''schema'',''synera.location-grant.v1'',''id'',g.id,''meeting_id'',g.meeting_id,
    ''grantor_id'',g.grantor_id,''recipient_id'',g.recipient_id,''precision'',g.precision,
    ''radius_m'',case when g.precision=''approximate'' then 500 else 50 end,''lead_minutes'',g.lead_minutes,
    ''opens_at'',g.opens_at,''closes_at'',g.closes_at,''granted_at'',g.granted_at,''status'',g.status,''sample_seq'',g.sample_seq);' and prosecdef=false and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_public(public.meeting_location_grants)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare m public.meeting_requests; c public.match_cases; g public.meeting_location_grants; actor uuid:=public.synera_user_id();
begin
  if p_intent_id is null or p_consent is distinct from true or p_precision is null or p_precision not in (''approximate'',''exact'')
    or p_lead_minutes is null or p_lead_minutes not in (15,30) then raise exception ''Invalid location consent'' using errcode=''22023''; end if;
  if not public.synera_location_allowed(p_meeting_id) then raise exception ''Location unavailable'' using errcode=''42501''; end if;
  if exists(select 1 from public.location_consent_intents where intent_id=p_intent_id) then
    select * into g from public.meeting_location_grants where meeting_id=p_meeting_id and grantor_id=actor and intent_id=p_intent_id;
    if g.id is null or g.status<>''active'' or g.closes_at<=now() then raise exception ''Consent intent already used'' using errcode=''42501''; end if;
    return public.synera_location_public(g);
  end if;
  if (select count(*) from public.location_consent_intents where grantor_id=actor and created_at>now()-interval ''1 day'')>=60 then
    raise exception ''Location consent rate exceeded'' using errcode=''42501'';
  end if;
  select * into m from public.meeting_requests where id=p_meeting_id for update;
  if not public.synera_location_allowed(p_meeting_id) then raise exception ''Location unavailable'' using errcode=''42501''; end if;
  if m.proposed_at+make_interval(mins=>m.duration_minutes)<=now() then raise exception ''Location unavailable'' using errcode=''42501''; end if;
  select * into c from public.match_cases where participant_low=least(m.sender_id,m.recipient_id)
    and participant_high=greatest(m.sender_id,m.recipient_id)
    and public.synera_location_case_current(case_id,version,terms_hash) order by updated_at desc limit 1;
  insert into public.meeting_location_grants(meeting_id,grantor_id,recipient_id,precision,lead_minutes,opens_at,closes_at,status,
    case_id,case_version,case_hash,meeting_time,meeting_duration,meeting_place,meeting_address,intent_id)
  values(m.id,actor,case when actor=m.sender_id then m.recipient_id else m.sender_id end,p_precision,p_lead_minutes,
    m.proposed_at-make_interval(mins=>p_lead_minutes),m.proposed_at+make_interval(mins=>m.duration_minutes),''active'',
    c.case_id,c.version,c.terms_hash,m.proposed_at,m.duration_minutes,m.meeting_place,m.meeting_address,p_intent_id)
  on conflict (meeting_id,grantor_id) do update set id=gen_random_uuid(),recipient_id=excluded.recipient_id,
    precision=excluded.precision,lead_minutes=excluded.lead_minutes,opens_at=excluded.opens_at,closes_at=excluded.closes_at,
    granted_at=now(),status=''active'',revoked_at=null,case_id=excluded.case_id,case_version=excluded.case_version,
    case_hash=excluded.case_hash,meeting_time=excluded.meeting_time,meeting_duration=excluded.meeting_duration,meeting_place=excluded.meeting_place,meeting_address=excluded.meeting_address,
    intent_id=p_intent_id,sample_seq=0
  returning * into g;
  insert into public.location_consent_intents(intent_id,meeting_id,grantor_id) values(p_intent_id,p_meeting_id,actor);
  return public.synera_location_public(g);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_grant(uuid,text,integer,boolean,uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare a jsonb; g public.meeting_location_grants;
begin
  a:=public.synera_location_access(p_meeting_id);
  if a->''own'' is null or a->''own''=''null''::jsonb then raise exception ''Location unavailable'' using errcode=''42501''; end if;
  update public.meeting_location_grants set sample_seq=sample_seq+1,sample_admitted_at=now() where meeting_id=p_meeting_id and grantor_id=public.synera_user_id()
    and id=(a->''own''->>''id'')::uuid and status=''active'' and opens_at<=now() and closes_at>now()+interval ''60 seconds''
    and (sample_admitted_at is null or sample_admitted_at<=now()-interval ''20 seconds'') returning * into g;
  if g.id is null then raise exception ''Location window closed'' using errcode=''42501''; end if;
  return jsonb_build_object(''grant'',public.synera_location_public(g),''server_now'',now());
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_sample(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); own_grant jsonb; peer_grant jsonb; meeting_row public.meeting_requests; meeting_snapshot jsonb;
begin
  select * into meeting_row from public.meeting_requests where id=p_meeting_id and actor in (sender_id,recipient_id)
    and public.synera_pilot_member() and exists(select 1 from public.pilot_consents p where p.user_id=actor and p.policy_version=''2026-09-05-pilot-3'');
  if meeting_row.id is not null then meeting_snapshot:=jsonb_build_object(''id'',meeting_row.id,''status'',meeting_row.status,''meeting_address'',meeting_row.meeting_address,
    ''meeting_place'',meeting_row.meeting_place,''proposed_at'',meeting_row.proposed_at,''duration_minutes'',meeting_row.duration_minutes); end if;
  if not public.synera_location_allowed(p_meeting_id) then
    return jsonb_build_object(''eligible'',false,''own'',null,''peer'',null,''meeting'',meeting_snapshot,''server_now'',now());
  end if;
  select public.synera_location_public(g) into own_grant from public.meeting_location_grants g
    join public.meeting_requests m on m.id=g.meeting_id where g.meeting_id=p_meeting_id and g.grantor_id=actor
    and g.status=''active'' and g.closes_at>now() and public.synera_location_case_current(g.case_id,g.case_version,g.case_hash)
    and (g.meeting_time,g.meeting_duration,g.meeting_place,g.meeting_address)=(m.proposed_at,m.duration_minutes,m.meeting_place,m.meeting_address);
  select public.synera_location_public(g) into peer_grant from public.meeting_location_grants g
    join public.meeting_requests m on m.id=g.meeting_id where g.meeting_id=p_meeting_id and g.recipient_id=actor
    and g.status=''active'' and g.opens_at<=now() and g.closes_at>now()
    and public.synera_location_case_current(g.case_id,g.case_version,g.case_hash)
    and (g.meeting_time,g.meeting_duration,g.meeting_place,g.meeting_address)=(m.proposed_at,m.duration_minutes,m.meeting_place,m.meeting_address);
  return jsonb_build_object(''eligible'',true,''own'',own_grant,''peer'',peer_grant,''meeting'',meeting_snapshot,''server_now'',now());
end' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_access(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare g public.meeting_location_grants;
begin
  if not public.synera_pilot_member() then raise exception ''Location unavailable'' using errcode=''42501''; end if;
  update public.meeting_location_grants set status=''revoked'',revoked_at=now()
    where meeting_id=p_meeting_id and grantor_id=public.synera_user_id() returning * into g;
  if g.id is null then return null; end if;
  return public.synera_location_public(g);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_revoke(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_invalidate' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_invalidate' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if TG_TABLE_NAME=''meeting_requests'' then
    if (new.status,new.proposed_at,new.duration_minutes,new.meeting_place,new.meeting_address) is distinct from (old.status,old.proposed_at,old.duration_minutes,old.meeting_place,old.meeting_address) then
      update public.meeting_location_grants set status=''revoked'',revoked_at=now() where meeting_id=new.id and status=''active'';
    end if;
  elsif TG_TABLE_NAME=''match_cases'' then
    if (new.status,new.version) is distinct from (old.status,old.version) then
      update public.meeting_location_grants set status=''revoked'',revoked_at=now() where case_id=new.case_id and status=''active'';
    end if;
  elsif TG_TABLE_NAME=''match_case_approvals'' then
    if new.withdrawn_at is not null then update public.meeting_location_grants set status=''revoked'',revoked_at=now() where case_id=new.case_id and status=''active''; end if;
  elsif TG_TABLE_NAME=''profile_blocks'' then
    update public.meeting_location_grants set status=''revoked'',revoked_at=now()
      where status=''active'' and (grantor_id,recipient_id) in ((new.blocker_id,new.blocked_id),(new.blocked_id,new.blocker_id));
  end if;
  return new;
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_location_invalidate()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_current_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_current_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select exists(select 1 from public.pilot_consents c join public.profiles p on p.id=c.user_id
    where c.user_id=p_user_id and c.policy_version=''2026-09-05-pilot-3''
      and c.terms_accepted and c.privacy_acknowledged and p.is_discoverable
      and exists(select 1 from neon_auth."user" u join public.synera_pilot_members a on a.email=lower(u.email)
        where u.id=p_user_id and u."emailVerified"=true));' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_current_member(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_pair_blocked' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_pair_blocked' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select exists(select 1 from public.profile_blocks b where (b.blocker_id,b.blocked_id) in ((p_left,p_right),(p_right,p_left)));' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_pair_blocked(uuid,uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_actor_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_actor_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select public.synera_user_id() is not null
    and public.synera_room_current_member(public.synera_user_id())
    and exists(select 1 from public.group_room_members own where own.room_id=p_room_id and own.user_id=public.synera_user_id()
      and own.membership_status = any(case when p_allow_invited then array[''invited'',''accepted'']::text[] else array[''accepted'']::text[] end))
    and not exists(select 1 from public.group_room_members a join public.group_room_members b on b.room_id=a.room_id and b.user_id>a.user_id
      where a.room_id=p_room_id and a.membership_status in (''invited'',''accepted'') and b.membership_status in (''invited'',''accepted'')
        and public.synera_room_pair_blocked(a.user_id,b.user_id));' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_actor_allowed(uuid,boolean)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_all_accepted_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_all_accepted_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select not exists(select 1 from public.group_room_members m where m.room_id=p_room_id and m.membership_status=''accepted''
    and not public.synera_room_current_member(m.user_id));' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_all_accepted_current(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_admit_write' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_admit_write' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); counter public.synera_write_limits%rowtype;
begin
  if actor is null or p_kind not in (''invitation'',''message'') then raise exception ''Write unavailable'' using errcode=''42501''; end if;
  insert into public.synera_write_limits(user_id) values(actor) on conflict (user_id) do nothing;
  select * into counter from public.synera_write_limits where user_id=actor for update;
  if counter.window_started_at<=now()-interval ''1 day'' then
    update public.synera_write_limits set invitations=0,messages=0,reports=0,window_started_at=now() where user_id=actor returning * into counter;
  end if;
  if (p_kind=''invitation'' and counter.invitations>=20) or (p_kind=''message'' and counter.messages>=100) then raise exception ''Write rate exceeded'' using errcode=''PT429''; end if;
  if p_kind=''invitation'' then update public.synera_write_limits set invitations=invitations+1 where user_id=actor;
  else update public.synera_write_limits set messages=messages+1 where user_id=actor; end if;
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_admit_write(text)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_state' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_state' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare r public.group_rooms; actor uuid:=public.synera_user_id(); own public.group_room_members; transcript jsonb:=''[]''::jsonb;
begin
  if not public.synera_room_actor_allowed(p_room_id,true) then raise exception ''Room unavailable'' using errcode=''42501''; end if;
  select * into r from public.group_rooms where id=p_room_id;
  select * into own from public.group_room_members where room_id=p_room_id and user_id=actor;
  if p_include_transcript and own.membership_status=''accepted'' then
    select coalesce(jsonb_agg(jsonb_build_object(''message_id'',m.message_id,''sender_id'',m.sender_id,''room_revision'',m.room_revision,''body'',m.body,''created_at'',m.created_at) order by m.created_at,m.message_id),''[]''::jsonb)
      into transcript from public.group_room_messages m where m.room_id=p_room_id;
  end if;
  return jsonb_build_object(''schema'',''synera.group-room.v1'',''id'',r.id,''title'',r.title,''goal'',r.goal,''status'',r.status,
    ''revision'',r.revision,''server_now'',now(),''own_role'',own.role,''own_membership_status'',own.membership_status,
    ''participants'',(select coalesce(jsonb_agg(jsonb_build_object(''user_id'',m.user_id,''display_name'',case when public.synera_room_current_member(m.user_id) then p.display_name else null end,''role'',m.role,''membership_status'',m.membership_status,''position'',m.position) order by m.position),''[]''::jsonb) from public.group_room_members m join public.profiles p on p.id=m.user_id where m.room_id=p_room_id),
    ''active_turn'',case when r.status=''active'' then jsonb_build_object(''speaker_id'',(select m.user_id from public.group_room_members m where m.room_id=p_room_id and m.position=r.turn_position),''deadline'',r.turn_deadline) else null end,
    ''last_turn_event'',case when own.membership_status=''accepted'' then (select jsonb_build_object(''kind'',e.event_type,''created_at'',e.created_at) from public.group_room_events e where e.room_id=p_room_id and e.event_type in (''advanced'',''no_response'') order by e.revision desc limit 1) else null end,
    ''transcript'',transcript);
end' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_state(uuid,boolean)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms; invitee uuid; position smallint:=1;
begin
  if actor is null or not public.synera_room_current_member(actor) then raise exception ''Current pilot consent required'' using errcode=''42501''; end if;
  if p_title is null or p_goal is null or char_length(btrim(p_title)) not between 1 and 120 or char_length(btrim(p_goal)) not between 1 and 500 then raise exception ''Invalid room title or goal'' using errcode=''22023''; end if;
  if p_invitee_ids is null or cardinality(p_invitee_ids) not between 1 and 2 or actor=any(p_invitee_ids) or (select count(distinct v) from unnest(p_invitee_ids) v) <> cardinality(p_invitee_ids) then raise exception ''Choose one or two distinct invitees'' using errcode=''22023''; end if;
  foreach invitee in array p_invitee_ids loop
    if not public.synera_room_current_member(invitee) or public.synera_room_pair_blocked(actor,invitee) then raise exception ''Invitee unavailable'' using errcode=''42501''; end if;
  end loop;
  if cardinality(p_invitee_ids)=2 and public.synera_room_pair_blocked(p_invitee_ids[1],p_invitee_ids[2]) then raise exception ''Invitees unavailable together'' using errcode=''42501''; end if;
  perform public.synera_room_admit_write(''invitation'');
  insert into public.group_rooms(creator_id,title,goal) values(actor,btrim(p_title),btrim(p_goal)) returning * into r;
  insert into public.group_room_members(room_id,user_id,position,role,membership_status,accepted_at) values(r.id,actor,0,''creator'',''accepted'',now());
  foreach invitee in array p_invitee_ids loop
    insert into public.group_room_members(room_id,user_id,position,role,membership_status) values(r.id,invitee,position,''member'',''invited''); position:=position+1;
  end loop;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(r.id,r.revision,''created'',actor);
  return public.synera_room_state(r.id,false);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_create(text,text,uuid[])'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id();
begin
  if actor is null or not public.synera_room_current_member(actor) then return ''[]''::jsonb; end if;
  return coalesce((select jsonb_agg(public.synera_room_state(visible.room_id,false) order by visible.created_at desc)
    from (select m.room_id,r.created_at from public.group_room_members m join public.group_rooms r on r.id=m.room_id
      where m.user_id=actor and public.synera_room_actor_allowed(m.room_id,true) order by r.created_at desc limit 50) visible),''[]''::jsonb);
end' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_list()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='select public.synera_room_state(p_room_id,true);' and prosecdef=true and provolatile='s' and prolang=(select oid from pg_catalog.pg_language where lanname='sql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_get(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if actor is null or not public.synera_room_current_member(actor) then raise exception ''Current pilot consent required'' using errcode=''42501''; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or r.status <> ''inviting'' then raise exception ''Invitation unavailable'' using errcode=''42501''; end if;
  if not public.synera_room_actor_allowed(p_room_id,true) then raise exception ''Invitation unavailable'' using errcode=''42501''; end if;
  update public.group_room_members set membership_status=''accepted'',accepted_at=now() where room_id=p_room_id and user_id=actor and membership_status=''invited'';
  if not found then raise exception ''Invitation unavailable'' using errcode=''42501''; end if;
  update public.group_rooms set revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,''accepted'',actor);
  return public.synera_room_state(p_room_id,false);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_accept(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if actor is null then raise exception ''Authentication required'' using errcode=''42501''; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or not public.synera_room_actor_allowed(p_room_id,true) then raise exception ''Room unavailable'' using errcode=''42501''; end if;
  update public.group_room_members set membership_status=''left'',left_at=now() where room_id=p_room_id and user_id=actor;
  update public.group_rooms set status=case when status=''active'' then ''paused'' else status end,turn_position=null,turn_deadline=null,turn_started_revision=null,paused_at=case when status=''active'' then now() else paused_at end,revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,''left'',actor);
  return jsonb_build_object(''schema'',''synera.group-room.v1'',''id'',p_room_id,''status'',''left'',''server_now'',now());
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_leave(uuid)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if p_expected_revision is null or p_expected_revision < 1 then raise exception ''Invalid room revision'' using errcode=''22023''; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or actor is null or r.creator_id<>actor or r.status<>''inviting'' or not public.synera_room_actor_allowed(p_room_id,false) or not public.synera_room_all_accepted_current(p_room_id) then raise exception ''Room start unavailable'' using errcode=''42501''; end if;
  if r.revision is distinct from p_expected_revision then raise exception ''Stale room revision'' using errcode=''PT409''; end if;
  if exists(select 1 from public.group_room_members m where m.room_id=p_room_id and m.membership_status<>''accepted'') then raise exception ''Every invited participant must explicitly accept'' using errcode=''42501''; end if;
  update public.group_rooms set status=''active'',turn_position=0,turn_deadline=now()+interval ''60 seconds'',turn_started_revision=revision+1,activated_at=now(),revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,''started'',actor);
  return public.synera_room_state(p_room_id,true);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_start(uuid,integer)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms; prior public.group_room_messages;
begin
  if actor is null or p_message_id is null or p_body is null or char_length(btrim(p_body)) not between 1 and 2000 then raise exception ''Invalid message'' using errcode=''22023''; end if;
  if p_expected_revision is null or p_expected_revision < 1 then raise exception ''Invalid room revision'' using errcode=''22023''; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or not public.synera_room_actor_allowed(p_room_id,false) or not public.synera_room_all_accepted_current(p_room_id) then raise exception ''Message unavailable'' using errcode=''42501''; end if;
  select * into prior from public.group_room_messages where room_id=p_room_id and message_id=p_message_id;
  if prior.message_id is not null then
    if prior.sender_id<>actor or prior.body<>p_body then raise exception ''Idempotency key conflict'' using errcode=''22023''; end if;
    return public.synera_room_state(p_room_id,true);
  end if;
  if r.status<>''active'' or r.turn_deadline<=now()
    or actor<>(select m.user_id from public.group_room_members m where m.room_id=p_room_id and m.position=r.turn_position and m.membership_status=''accepted'') then raise exception ''Message unavailable'' using errcode=''42501''; end if;
  if r.revision is distinct from p_expected_revision then raise exception ''Stale room revision'' using errcode=''PT409''; end if;
  if (select count(*) from public.group_room_messages m where m.room_id=p_room_id)>=100 then raise exception ''Room message limit reached'' using errcode=''PT429''; end if;
  perform public.synera_room_admit_write(''message'');
  update public.group_rooms set revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_messages(room_id,message_id,sender_id,room_revision,body) values(p_room_id,p_message_id,actor,r.revision,p_body);
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,''message'',actor);
  return public.synera_room_state(p_room_id,true);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_message(uuid,integer,uuid,text)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms; speaker uuid; next_position smallint; deadline_passed boolean; silent_timeout boolean;
begin
  if p_expected_revision is null or p_expected_revision < 1 then raise exception ''Invalid room revision'' using errcode=''22023''; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or r.status<>''active'' or not public.synera_room_actor_allowed(p_room_id,false) or not public.synera_room_all_accepted_current(p_room_id) then raise exception ''Advance unavailable'' using errcode=''42501''; end if;
  if r.revision is distinct from p_expected_revision then raise exception ''Stale room revision'' using errcode=''PT409''; end if;
  select user_id into speaker from public.group_room_members where room_id=p_room_id and position=r.turn_position and membership_status=''accepted'';
  deadline_passed:=r.turn_deadline<=now();
  silent_timeout:=deadline_passed and not exists(select 1 from public.group_room_messages m where m.room_id=p_room_id and m.room_revision>r.turn_started_revision);
  if actor<>speaker and not deadline_passed then raise exception ''Only the current speaker may advance before the deadline'' using errcode=''42501''; end if;
  select m.position into next_position from public.group_room_members m where m.room_id=p_room_id and m.membership_status=''accepted'' and m.position>r.turn_position order by m.position limit 1;
  if next_position is null then select m.position into next_position from public.group_room_members m where m.room_id=p_room_id and m.membership_status=''accepted'' order by m.position limit 1; end if;
  update public.group_rooms set turn_position=next_position,turn_deadline=now()+interval ''60 seconds'',turn_started_revision=revision+1,revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,case when silent_timeout then ''no_response'' else ''advanced'' end,actor);
  return public.synera_room_state(p_room_id,true);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_advance(uuid,integer)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if p_expected_revision is null or p_expected_revision < 1 then raise exception ''Invalid room revision'' using errcode=''22023''; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or actor is null or r.creator_id<>actor or r.status in (''closed'') or not public.synera_room_actor_allowed(p_room_id,false) then raise exception ''Room close unavailable'' using errcode=''42501''; end if;
  if r.revision is distinct from p_expected_revision then raise exception ''Stale room revision'' using errcode=''PT409''; end if;
  update public.group_rooms set status=''closed'',turn_position=null,turn_deadline=null,turn_started_revision=null,closed_at=now(),revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,''closed'',actor);
  return public.synera_room_state(p_room_id,true);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_room_close(uuid,integer)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare
  actor uuid:=public.synera_user_id(); c public.match_cases; prior public.match_outcome_events;
  action text; version integer; term_hash text; idx integer; intent uuid; d jsonb;
  submitted boolean; checked boolean; decision text; evidence text; notes text; reason text;
  entry record; rows jsonb:=''[]''::jsonb; history jsonb; all_confirmed boolean:=true;
begin
  if actor is null or public.synera_pilot_member() is not true
    or not exists(select 1 from public.pilot_consents where user_id=actor and policy_version=''2026-09-05-pilot-3'') then
    raise exception ''Outcome unavailable'' using errcode=''42501'';
  end if;
  if p_case_id is null or p_case_id !~ ''^[A-Za-z0-9_:-]{1,64}$''
    or jsonb_typeof(p_payload) is distinct from ''object''
    or octet_length(p_payload::text)>4096
    or p_payload-array[''action'',''version'',''termsHash'',''index'',''intentId'',''evidenceUri'',''scopeNotes'',''reason''] <> ''{}''::jsonb
    or jsonb_typeof(p_payload->''version'') is distinct from ''number''
    or coalesce(p_payload->>''version'','''') !~ ''^[1-9][0-9]{0,8}$''
    or coalesce(p_payload->>''termsHash'','''') !~ ''^[a-f0-9]{64}$'' then
    raise exception ''Invalid outcome request'' using errcode=''22023'';
  end if;
  action:=p_payload->>''action''; version:=(p_payload->>''version'')::integer; term_hash:=p_payload->>''termsHash'';
  if action is null or action not in (''state'',''submit'',''check'',''accept'',''decline'') then raise exception ''Invalid outcome action'' using errcode=''22023''; end if;
  select * into c from public.match_cases where case_id=p_case_id for update;
  if not found or actor not in (c.participant_low,c.participant_high)
    or exists(select 1 from public.profile_blocks where (blocker_id=c.participant_low and blocked_id=c.participant_high)
      or (blocker_id=c.participant_high and blocked_id=c.participant_low)) then
    raise exception ''Outcome unavailable'' using errcode=''42501'';
  end if;
  if c.version<>version or c.terms_hash<>term_hash then raise exception ''Review current material'' using errcode=''PT409''; end if;
  if action=''state'' then
    if p_payload-array[''action'',''version'',''termsHash''] <> ''{}''::jsonb then raise exception ''Invalid outcome read'' using errcode=''22023''; end if;
  else
    if c.status<>''open'' or c.expires_at<=now() then raise exception ''Case is closed or expired'' using errcode=''PT409''; end if;
    -- Lock live approval rows as well as the case: withdrawal/material revision
    -- cannot race an attestation through the current-version admission boundary.
    perform 1 from public.match_case_approvals where case_id=c.case_id and approved_version=c.version
      and approved_terms_hash=c.terms_hash and withdrawn_at is null for share;
    if (select count(distinct party_id) from public.match_case_approvals where case_id=c.case_id
      and party_id in (c.participant_low,c.participant_high) and approved_version=c.version and approved_terms_hash=c.terms_hash and withdrawn_at is null)<>2
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_low and policy_version=''2026-09-05-pilot-3'')
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_high and policy_version=''2026-09-05-pilot-3'') then
      raise exception ''Both current approvals required'' using errcode=''42501'';
    end if;
    if jsonb_typeof(p_payload->''index'') is distinct from ''number'' or coalesce(p_payload->>''index'','''') !~ ''^[0-9]{1,4}$''
      or coalesce(p_payload->>''intentId'','''') !~ ''^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'' then
      raise exception ''Invalid outcome index or intent'' using errcode=''22023'';
    end if;
    idx:=(p_payload->>''index'')::integer; intent:=(p_payload->>''intentId'')::uuid;
    d:=c.material#>array[''trial'',''deliverables'',idx::text];
    if d is null or coalesce(d->>''giver_id'','''') not in(c.participant_low::text,c.participant_high::text)
      or coalesce(d->>''receiver_id'','''') not in(c.participant_low::text,c.participant_high::text)
      or d->>''giver_id''=d->>''receiver_id'' then raise exception ''Invalid participant deliverable'' using errcode=''22023''; end if;
    if action=''submit'' and actor::text<>d->>''giver_id'' then raise exception ''Only giver submits'' using errcode=''42501''; end if;
    if action in (''check'',''accept'',''decline'') and actor::text<>d->>''receiver_id'' then raise exception ''Only receiver decides'' using errcode=''42501''; end if;
    if (action<>''submit'' and p_payload ? ''evidenceUri'') or (action<>''check'' and p_payload ? ''scopeNotes'') or (action<>''decline'' and p_payload ? ''reason'') then
      raise exception ''Unexpected outcome fields'' using errcode=''22023'';
    end if;
    if action=''submit'' and (jsonb_typeof(p_payload->''evidenceUri'') is distinct from ''string''
      or char_length(btrim(p_payload->>''evidenceUri'')) not between 1 and 1000) then raise exception ''Evidence URI required'' using errcode=''22023''; end if;
    if action=''check'' and (jsonb_typeof(p_payload->''scopeNotes'') is distinct from ''string''
      or char_length(btrim(p_payload->>''scopeNotes'')) not between 1 and 1000) then raise exception ''Scope notes required'' using errcode=''22023''; end if;
    if action=''decline'' and coalesce(p_payload->>''reason'','''') not in (''not_delivered'',''outside_agreed_scope'',''below_acceptance_criteria'',''other'') then
      raise exception ''Neutral reason required'' using errcode=''22023'';
    end if;
    select * into prior from public.match_outcome_events where actor_id=actor and intent_id=intent;
    if found then
      if prior.case_id<>c.case_id or prior.payload<>p_payload then raise exception ''Intent already used for different content'' using errcode=''PT409''; end if;
    else
      select exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind=''submit''),
        exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind=''check'') into submitted,checked;
      select kind into decision from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash
        and deliverable_index=idx and kind in (''accept'',''decline'') order by id desc limit 1;
      if decision=''accept'' or (action=''submit'' and submitted) or (action=''check'' and (not submitted or checked))
        or (action=''accept'' and not checked) or (action=''decline'' and decision=''decline'') then
        raise exception ''Outcome transition unavailable'' using errcode=''PT409'';
      end if;
      -- Reuse the established shared write bucket; no new rate ledger.
      perform public.synera_room_admit_write(''message'');
      insert into public.match_outcome_events(case_id,material_version,terms_hash,deliverable_index,actor_id,kind,intent_id,payload)
        values(c.case_id,version,term_hash,idx,actor,action,intent,p_payload);
    end if;
  end if;
  for entry in select value,ordinality-1 as n from jsonb_array_elements(c.material#>''{trial,deliverables}'') with ordinality loop
    evidence:=null; notes:=null; decision:=null; reason:=null;
    select payload->>''evidenceUri'' into evidence from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind=''submit'' order by id desc limit 1;
    select payload->>''scopeNotes'' into notes from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind=''check'' order by id desc limit 1;
    select kind,payload->>''reason'' into decision,reason from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind in(''accept'',''decline'') order by id desc limit 1;
    all_confirmed:=all_confirmed and coalesce(decision=''accept'',false);
    rows:=rows||jsonb_build_array(jsonb_build_object(''index'',entry.n,''giver_id'',entry.value->>''giver_id'',''receiver_id'',entry.value->>''receiver_id'',
      ''target'',entry.value->>''target'',''acceptance_criteria'',entry.value->>''acceptance_criteria'',
      ''phase'',case when decision=''accept'' then ''accepted'' when decision=''decline'' then ''declined_dispute_open'' when notes is not null then ''checked_with_scope'' when evidence is not null then ''evidence_supplied'' else ''pending'' end,
      ''evidence_uri'',evidence,''scope_notes'',notes,''reason'',reason));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object(''id'',id,''index'',deliverable_index,''kind'',kind,''actor_id'',actor_id,''created_at'',created_at,''payload'',payload) order by id),''[]''::jsonb)
    into history from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash;
  return jsonb_build_object(''schema'',''synera.case-outcome.v1'',''case_id'',c.case_id,''version'',version,''terms_hash'',term_hash,
    ''deliverables'',rows,''events'',history,''outcome_confirmed'',all_confirmed and jsonb_array_length(rows)>0,
    ''proof_scope'',''participant_attestation'',''server_now'',now());
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]) or (btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare
  actor uuid:=public.synera_user_id(); c public.match_cases; prior public.match_outcome_events;
  action text; version integer; term_hash text; idx integer; intent uuid; d jsonb;
  submitted boolean; checked boolean; decision text; evidence text; notes text; reason text;
  entry record; rows jsonb:=''[]''::jsonb; history jsonb; all_confirmed boolean:=true;
begin
  if actor is null or public.synera_pilot_member() is not true
    or not exists(select 1 from public.pilot_consents where user_id=actor and policy_version=''2026-09-05-pilot-3'') then
    raise exception ''Outcome unavailable'' using errcode=''42501'';
  end if;
  if p_case_id is null or p_case_id !~ ''^[A-Za-z0-9_:-]{1,64}$''
    or jsonb_typeof(p_payload) is distinct from ''object''
    or octet_length(p_payload::text)>4096
    or p_payload-array[''action'',''version'',''termsHash'',''index'',''intentId'',''evidenceUri'',''scopeNotes'',''reason''] <> ''{}''::jsonb
    or jsonb_typeof(p_payload->''version'') is distinct from ''number''
    or coalesce(p_payload->>''version'','''') !~ ''^[1-9][0-9]{0,8}$''
    or coalesce(p_payload->>''termsHash'','''') !~ ''^[a-f0-9]{64}$'' then
    raise exception ''Invalid outcome request'' using errcode=''22023'';
  end if;
  action:=p_payload->>''action''; version:=(p_payload->>''version'')::integer; term_hash:=p_payload->>''termsHash'';
  if action is null or action not in (''state'',''submit'',''check'',''accept'',''decline'') then raise exception ''Invalid outcome action'' using errcode=''22023''; end if;
  select * into c from public.match_cases where case_id=p_case_id for update;
  if not found or actor not in (c.participant_low,c.participant_high)
    or exists(select 1 from public.profile_blocks where (blocker_id=c.participant_low and blocked_id=c.participant_high)
      or (blocker_id=c.participant_high and blocked_id=c.participant_low)) then
    raise exception ''Outcome unavailable'' using errcode=''42501'';
  end if;
  -- Hold the actor profile through the whole RPC: erasure must serialize with this operation.
  -- Recheck AFTER waits. A membership check before a case lock cannot fence a delayed request.
  perform 1 from public.profiles where id=actor for share;
  if not found or public.synera_pilot_member() is not true then
    raise exception ''Outcome unavailable'' using errcode=''42501'';
  end if;
  if c.version<>version or c.terms_hash<>term_hash then raise exception ''Review current material'' using errcode=''PT409''; end if;
  if action=''state'' then
    if p_payload-array[''action'',''version'',''termsHash''] <> ''{}''::jsonb then raise exception ''Invalid outcome read'' using errcode=''22023''; end if;
  else
    if c.status<>''open'' or c.expires_at<=now() then raise exception ''Case is closed or expired'' using errcode=''PT409''; end if;
    -- Lock live approval rows as well as the case: withdrawal/material revision
    -- cannot race an attestation through the current-version admission boundary.
    perform 1 from public.match_case_approvals where case_id=c.case_id and approved_version=c.version
      and approved_terms_hash=c.terms_hash and withdrawn_at is null for share;
    if (select count(distinct party_id) from public.match_case_approvals where case_id=c.case_id
      and party_id in (c.participant_low,c.participant_high) and approved_version=c.version and approved_terms_hash=c.terms_hash and withdrawn_at is null)<>2
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_low and policy_version=''2026-09-05-pilot-3'')
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_high and policy_version=''2026-09-05-pilot-3'') then
      raise exception ''Both current approvals required'' using errcode=''42501'';
    end if;
    if jsonb_typeof(p_payload->''index'') is distinct from ''number'' or coalesce(p_payload->>''index'','''') !~ ''^[0-9]{1,4}$''
      or coalesce(p_payload->>''intentId'','''') !~ ''^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'' then
      raise exception ''Invalid outcome index or intent'' using errcode=''22023'';
    end if;
    idx:=(p_payload->>''index'')::integer; intent:=(p_payload->>''intentId'')::uuid;
    d:=c.material#>array[''trial'',''deliverables'',idx::text];
    if d is null or coalesce(d->>''giver_id'','''') not in(c.participant_low::text,c.participant_high::text)
      or coalesce(d->>''receiver_id'','''') not in(c.participant_low::text,c.participant_high::text)
      or d->>''giver_id''=d->>''receiver_id'' then raise exception ''Invalid participant deliverable'' using errcode=''22023''; end if;
    if action=''submit'' and actor::text<>d->>''giver_id'' then raise exception ''Only giver submits'' using errcode=''42501''; end if;
    if action in (''check'',''accept'',''decline'') and actor::text<>d->>''receiver_id'' then raise exception ''Only receiver decides'' using errcode=''42501''; end if;
    if (action<>''submit'' and p_payload ? ''evidenceUri'') or (action<>''check'' and p_payload ? ''scopeNotes'') or (action<>''decline'' and p_payload ? ''reason'') then
      raise exception ''Unexpected outcome fields'' using errcode=''22023'';
    end if;
    if action=''submit'' and (jsonb_typeof(p_payload->''evidenceUri'') is distinct from ''string''
      or char_length(btrim(p_payload->>''evidenceUri'')) not between 1 and 1000) then raise exception ''Evidence URI required'' using errcode=''22023''; end if;
    if action=''check'' and (jsonb_typeof(p_payload->''scopeNotes'') is distinct from ''string''
      or char_length(btrim(p_payload->>''scopeNotes'')) not between 1 and 1000) then raise exception ''Scope notes required'' using errcode=''22023''; end if;
    if action=''decline'' and coalesce(p_payload->>''reason'','''') not in (''not_delivered'',''outside_agreed_scope'',''below_acceptance_criteria'',''other'') then
      raise exception ''Neutral reason required'' using errcode=''22023'';
    end if;
    select * into prior from public.match_outcome_events where actor_id=actor and intent_id=intent;
    if found then
      if prior.case_id<>c.case_id or prior.payload<>p_payload then raise exception ''Intent already used for different content'' using errcode=''PT409''; end if;
    else
      select exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind=''submit''),
        exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind=''check'') into submitted,checked;
      select kind into decision from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash
        and deliverable_index=idx and kind in (''accept'',''decline'') order by id desc limit 1;
      if decision=''accept'' or (action=''submit'' and submitted) or (action=''check'' and (not submitted or checked))
        or (action=''accept'' and not checked) or (action=''decline'' and decision=''decline'') then
        raise exception ''Outcome transition unavailable'' using errcode=''PT409'';
      end if;
      -- Reuse the established shared write bucket; no new rate ledger.
      perform public.synera_room_admit_write(''message'');
      insert into public.match_outcome_events(case_id,material_version,terms_hash,deliverable_index,actor_id,kind,intent_id,payload)
        values(c.case_id,version,term_hash,idx,actor,action,intent,p_payload);
    end if;
  end if;
  for entry in select value,ordinality-1 as n from jsonb_array_elements(c.material#>''{trial,deliverables}'') with ordinality loop
    evidence:=null; notes:=null; decision:=null; reason:=null;
    select payload->>''evidenceUri'' into evidence from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind=''submit'' order by id desc limit 1;
    select payload->>''scopeNotes'' into notes from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind=''check'' order by id desc limit 1;
    select kind,payload->>''reason'' into decision,reason from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind in(''accept'',''decline'') order by id desc limit 1;
    all_confirmed:=all_confirmed and coalesce(decision=''accept'',false);
    rows:=rows||jsonb_build_array(jsonb_build_object(''index'',entry.n,''giver_id'',entry.value->>''giver_id'',''receiver_id'',entry.value->>''receiver_id'',
      ''target'',entry.value->>''target'',''acceptance_criteria'',entry.value->>''acceptance_criteria'',
      ''phase'',case when decision=''accept'' then ''accepted'' when decision=''decline'' then ''declined_dispute_open'' when notes is not null then ''checked_with_scope'' when evidence is not null then ''evidence_supplied'' else ''pending'' end,
      ''evidence_uri'',evidence,''scope_notes'',notes,''reason'',reason));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object(''id'',id,''index'',deliverable_index,''kind'',kind,''actor_id'',actor_id,''created_at'',created_at,''payload'',payload) order by id),''[]''::jsonb)
    into history from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash;
  return jsonb_build_object(''schema'',''synera.case-outcome.v1'',''case_id'',c.case_id,''version'',version,''terms_hash'',term_hash,
    ''deliverables'',rows,''events'',history,''outcome_confirmed'',all_confirmed and jsonb_array_length(rows)>0,
    ''proof_scope'',''participant_attestation'',''server_now'',now());
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_case_outcome(text,jsonb)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare
  actor uuid:=public.synera_user_id(); c public.match_cases; m public.meeting_requests;
  proposal public.meeting_address_events; prior public.meeting_address_events;
  action text; version integer; term_hash text; intent uuid; selected uuid;
  snapshot jsonb; decision text; history jsonb; current_proposal boolean; agreed boolean;
begin
  if actor is null or public.synera_pilot_member() is not true then raise exception ''Address unavailable'' using errcode=''42501''; end if;
  if p_meeting_id is null or p_case_id is null or p_case_id!~''^[A-Za-z0-9_:-]{1,64}$''
    or jsonb_typeof(p_payload) is distinct from ''object'' or octet_length(p_payload::text)>2048
    or p_payload-array[''action'',''version'',''termsHash'',''intentId'',''proposalId'',''address'',''consent'']<>''{}''::jsonb
    or jsonb_typeof(p_payload->''version'') is distinct from ''number''
    or coalesce(p_payload->>''version'','''')!~''^[1-9][0-9]{0,8}$''
    or coalesce(p_payload->>''termsHash'','''')!~''^[a-f0-9]{64}$'' then
    raise exception ''Invalid address request'' using errcode=''22023'';
  end if;
  action:=p_payload->>''action'';version:=(p_payload->>''version'')::integer;term_hash:=p_payload->>''termsHash'';
  if action is null or action not in(''state'',''propose'',''accept'',''decline'') then raise exception ''Invalid address action'' using errcode=''22023''; end if;
  -- Same case-before-meeting order for every address decision/revision.
  select * into c from public.match_cases where case_id=p_case_id for update;
  if not found or actor not in(c.participant_low,c.participant_high) then raise exception ''Address unavailable'' using errcode=''42501''; end if;
  select * into m from public.meeting_requests where id=p_meeting_id for update;
  if not found or least(m.sender_id,m.recipient_id)<>c.participant_low or greatest(m.sender_id,m.recipient_id)<>c.participant_high
    or public.synera_room_pair_blocked(c.participant_low,c.participant_high)
    or not public.synera_room_current_member(c.participant_low) or not public.synera_room_current_member(c.participant_high) then
    raise exception ''Address unavailable'' using errcode=''42501'';
  end if;
  if c.version<>version or c.terms_hash<>term_hash then raise exception ''Review current material'' using errcode=''PT409''; end if;
  snapshot:=jsonb_build_object(''proposed_at'',m.proposed_at,''duration_minutes'',m.duration_minutes,''meeting_place'',m.meeting_place,''meeting_address'',m.meeting_address);
  select * into proposal from public.meeting_address_events where meeting_id=m.id and kind=''propose'' order by id desc limit 1;
  select kind into decision from public.meeting_address_events where proposal_id=proposal.proposal_id and kind<>''propose'';
  current_proposal:=coalesce(proposal.case_id=c.case_id and proposal.case_version=c.version and proposal.terms_hash=c.terms_hash
    and proposal.meeting_snapshot-''meeting_address''=snapshot-''meeting_address''
    and (proposal.meeting_snapshot->>''meeting_address''=m.meeting_address or (decision=''accept'' and proposal.address=m.meeting_address)),false);
  if action=''state'' then
    if p_payload-array[''action'',''version'',''termsHash'']<>''{}''::jsonb then raise exception ''Invalid address read'' using errcode=''22023''; end if;
  else
    if c.status<>''open'' or c.expires_at<=now() or m.status<>''accepted'' or m.proposed_at is null or m.proposed_at<=now()
      or m.duration_minutes is null or m.meeting_place is null or lower(btrim(m.meeting_place)) in(''online'',''онлайн'') or btrim(m.meeting_place)='''' then
      raise exception ''Meeting no longer eligible'' using errcode=''PT409'';
    end if;
    -- Withdrawal and consent removal cannot pass while these rows are locked.
    perform 1 from public.match_case_approvals where case_id=c.case_id and approved_version=c.version
      and approved_terms_hash=c.terms_hash and withdrawn_at is null order by party_id for share;
    perform 1 from public.pilot_consents where user_id in(c.participant_low,c.participant_high) order by user_id for share;
    if not public.synera_location_case_current(c.case_id,c.version,c.terms_hash)
      or not public.synera_room_current_member(c.participant_low) or not public.synera_room_current_member(c.participant_high) then
      raise exception ''Both current approvals required'' using errcode=''42501'';
    end if;
    if coalesce(p_payload->>''intentId'','''')!~''^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$''
      or not p_payload ? ''proposalId''
      or (p_payload->''proposalId''<>''null''::jsonb and coalesce(p_payload->>''proposalId'','''')!~''^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'') then
      raise exception ''Invalid address intent or proposal'' using errcode=''22023'';
    end if;
    intent:=(p_payload->>''intentId'')::uuid;selected:=(p_payload->>''proposalId'')::uuid;
    if action=''propose'' then
      if jsonb_typeof(p_payload->''address'') is distinct from ''string'' or char_length(btrim(p_payload->>''address'')) not between 1 and 200
        or p_payload->''consent'' is distinct from ''true''::jsonb then raise exception ''Explicit address proposal required'' using errcode=''22023''; end if;
    elsif p_payload ? ''address'' or (action=''accept'' and p_payload->''consent'' is distinct from ''true''::jsonb)
      or (action=''decline'' and p_payload ? ''consent'') then raise exception ''Explicit address decision required'' using errcode=''22023'';
    end if;
    select * into prior from public.meeting_address_events where actor_id=actor and intent_id=intent;
    if found then
      if prior.meeting_id<>m.id or prior.case_id<>c.case_id or prior.payload<>p_payload
        or prior.proposal_id is distinct from proposal.proposal_id or not current_proposal then
        raise exception ''Intent or proposal superseded'' using errcode=''PT409'';
      end if;
    else
      if selected is distinct from proposal.proposal_id then raise exception ''Review latest address proposal'' using errcode=''PT409''; end if;
      if action<>''propose'' then
        if proposal.id is null or not current_proposal or decision is not null then raise exception ''Proposal unavailable'' using errcode=''PT409''; end if;
        if actor=proposal.actor_id then raise exception ''Only the other participant decides'' using errcode=''42501''; end if;
      end if;
      perform public.synera_room_admit_write(''message'');
      insert into public.meeting_address_events(meeting_id,case_id,case_version,terms_hash,actor_id,kind,proposal_id,intent_id,address,meeting_snapshot,payload)
      values(m.id,c.case_id,version,term_hash,actor,action,case when action=''propose'' then intent else selected end,intent,
        case when action=''propose'' then btrim(p_payload->>''address'') end,case when action=''propose'' then snapshot else proposal.meeting_snapshot end,p_payload);
      if action=''accept'' then
        -- The existing AFTER UPDATE trigger revokes both old GPS grants atomically.
        update public.meeting_requests set meeting_address=proposal.address where id=m.id;
        m.meeting_address:=proposal.address;
      end if;
    end if;
  end if;
  select * into proposal from public.meeting_address_events where meeting_id=m.id and kind=''propose'' order by id desc limit 1;
  select kind into decision from public.meeting_address_events where proposal_id=proposal.proposal_id and kind<>''propose'';
  snapshot:=jsonb_build_object(''proposed_at'',m.proposed_at,''duration_minutes'',m.duration_minutes,''meeting_place'',m.meeting_place,''meeting_address'',m.meeting_address);
  current_proposal:=coalesce(proposal.case_id=c.case_id and proposal.case_version=c.version and proposal.terms_hash=c.terms_hash
    and proposal.meeting_snapshot-''meeting_address''=snapshot-''meeting_address''
    and (proposal.meeting_snapshot->>''meeting_address''=m.meeting_address or (decision=''accept'' and proposal.address=m.meeting_address)),false);
  agreed:=current_proposal and decision=''accept'' and m.status=''accepted'' and c.status=''open'' and c.expires_at>now()
    and public.synera_location_case_current(c.case_id,c.version,c.terms_hash);
  select coalesce(jsonb_agg(jsonb_build_object(''id'',id,''case_id'',case_id,''version'',case_version,''terms_hash'',terms_hash,
    ''actor_id'',actor_id,''kind'',kind,''proposal_id'',proposal_id,''address'',address,''created_at'',created_at) order by id),''[]''::jsonb)
    into history from public.meeting_address_events where meeting_id=m.id;
  return jsonb_build_object(''schema'',''synera.meeting-address.v1'',''meeting_id'',m.id,''case_id'',c.case_id,''version'',version,''terms_hash'',term_hash,
    ''meeting'',snapshot||jsonb_build_object(''status'',m.status),''proposal'',case when proposal.id is not null then jsonb_build_object(
      ''proposal_id'',proposal.proposal_id,''proposer_id'',proposal.actor_id,''address'',proposal.address,''current'',current_proposal,
      ''decision'',decision) else null end,''agreed'',coalesce(agreed,false),''events'',history,''server_now'',now());
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_meeting_address(uuid,text,jsonb)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid := public.synera_user_id(); prior public.meeting_messages%rowtype;
begin
  if actor is null or not public.synera_pilot_member() then raise exception sqlstate ''PT403'' using message = ''Message unavailable''; end if;
  if p_intent_id is null or p_meeting_id is null or p_body is null or char_length(btrim(p_body)) not between 1 and 1000 or p_body <> btrim(p_body) then raise exception sqlstate ''PT400'' using message = ''Invalid message''; end if;
  if not exists (select 1 from public.meeting_requests m where m.id=p_meeting_id and m.status=''accepted'' and actor in (m.sender_id,m.recipient_id)
    and not exists(select 1 from public.profile_blocks b where (b.blocker_id=m.sender_id and b.blocked_id=m.recipient_id) or (b.blocked_id=m.sender_id and b.blocker_id=m.recipient_id))) then
    raise exception sqlstate ''PT403'' using message = ''Message unavailable'';
  end if;
  -- Database transaction lock, not a process-local deduplicator. Shared by overlapping retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_intent_id::text,0));
  select * into prior from public.meeting_messages where id=p_intent_id;
  if found then
    if prior.sender_id <> actor or prior.meeting_id <> p_meeting_id or prior.body <> p_body then raise exception sqlstate ''PT409'' using message = ''Message intent conflict''; end if;
    return pg_catalog.to_jsonb(prior);
  end if;
  insert into public.meeting_messages(id,meeting_id,sender_id,body) values(p_intent_id,p_meeting_id,actor,p_body) returning * into prior;
  return pg_catalog.to_jsonb(prior);
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""','lock_timeout=5s']::text[]))) then raise exception 'Unknown function definition: public.synera_send_message(uuid,uuid,text)'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_statement_lock' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_statement_lock' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id();
begin
  if actor is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,17017));
  end if;
  return null;
end' and prosecdef=false and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_profile_erasure_statement_lock()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='begin
  if exists(select 1 from public.profile_erasures where user_id=new.id) then
    raise exception ''Profile deactivated'' using errcode=''42501'';
  end if;
  return new;
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""']::text[]))) then raise exception 'Unknown function definition: public.synera_profile_erasure_guard()'; end if;
if (select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null and not exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and ((btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')='declare actor uuid:=public.synera_user_id(); repeated boolean;
begin
  if actor is null then raise exception ''Erasure unavailable'' using errcode=''42501''; end if;
  -- Match authenticated INSERT, UPSERT and UPDATE: caller admission lock BEFORE row lock.
  -- This also serializes insertion of a missing profile; an absent tuple cannot provide a row lock.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,17017));
  perform 1 from public.profiles where id=actor for update;
  repeated:=exists(select 1 from public.profile_erasures where user_id=actor);
  if not repeated then
    if public.synera_pilot_member() is not true then raise exception ''Erasure unavailable'' using errcode=''42501''; end if;
    -- Retain the UUID row required by group-room RESTRICT FKs. Remove every actual profile field.
    update public.profiles set display_name=''Deleted profile'',city='''',offers='''',seeks='''',
      is_discoverable=false,map_visible=false,brief=default where id=actor;
    -- Copied display names are presentation data, not immutable agreement material/hashes.
    update public.meeting_requests set sender_name=''Deleted profile'' where sender_id=actor;
    update public.meeting_requests set recipient_name=''Deleted profile'' where recipient_id=actor;
    -- Revoke BOTH directions of live location, while preserving consent/meeting evidence.
    update public.meeting_location_grants set status=''revoked'',revoked_at=coalesce(revoked_at,now())
      where (grantor_id=actor or recipient_id=actor) and status=''active'';
    -- Withdraw the existing email admission instead of retaining email in the tombstone.
    -- A future provider sub for the same verified email must require fresh operator admission.
    delete from public.synera_pilot_members m using neon_auth."user" u
      where u.id=actor and m.email=lower(u.email);
    -- Shared room transcripts/events, bilateral terms/approvals/outcomes, reports, messages,
    -- agreed addresses and provider Auth are retained. They can still contain identifying text.
    -- Other parties keep the existing evidence/access contract; erased actor loses eligibility.
    insert into public.profile_erasures(user_id) values(actor);
  end if;
  return jsonb_build_object(''status'',''application_data_erased'',''providerDeletion'',''pending'',
    ''retainedScope'',''bilateral_records_and_safety_evidence'',''repeated'',repeated);
end' and prosecdef=true and provolatile='v' and prolang=(select oid from pg_catalog.pg_language where lanname='plpgsql') and coalesce(proconfig,'{}'::text[])=ARRAY['search_path=""','lock_timeout=5s']::text[]))) then raise exception 'Unknown function definition: public.synera_erase_profile_data()'; end if;
END $kit$;

-- case-state.migration.sql sha256=40bb511e4d7c20d75588cdfe60cbc3920e4754286d2b6f6a39a1827d375cbbc4
DO $kit$ BEGIN
if (coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and coalesce((to_regclass('public.match_cases') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_low')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_high')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='mode')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='material')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='expires_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='closed_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='created_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='updated_at')),false) and coalesce((to_regclass('public.match_cases_open_pair') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_guard' and not tgisinternal)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_project_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_project_guard' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_update')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_unblocked')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and coalesce((to_regclass('public.match_case_approvals') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='party_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='withdrawn_at')),false) and coalesce((to_regclass('public.approvals_one_live') is not null),false) and coalesce((to_regclass('public.approvals_case') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_approval_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='match_case_approval_guard' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_withdraw')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_need_approved_case')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='synera_members_only')),false)) then
raise notice 'Already complete: case-state.migration.sql';
elsif (not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and not coalesce((to_regclass('public.match_cases') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='case_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_low')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_high')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='mode')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='material')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='terms_hash')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='version')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='status')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='expires_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='closed_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='created_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='updated_at')),false) and not coalesce((to_regclass('public.match_cases_open_pair') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_guard' and not tgisinternal)),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_project_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_project_guard' and not tgisinternal)),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_read')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_create')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_update')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_consent')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_unblocked')),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and not coalesce((to_regclass('public.match_case_approvals') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='case_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='party_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_version')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_terms_hash')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='withdrawn_at')),false) and not coalesce((to_regclass('public.approvals_one_live') is not null),false) and not coalesce((to_regclass('public.approvals_case') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_approval_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='match_case_approval_guard' and not tgisinternal)),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_read')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_create')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_withdraw')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_consent')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_need_approved_case')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='synera_members_only')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='synera_members_only')),false)) then
do $$ begin
  if to_regprocedure('public.synera_user_id()') is null or to_regprocedure('public.synera_pilot_member()') is null then raise exception 'Apply neon/schema.proposal.sql first'; end if;
end $$;
do $$ begin
  if to_regclass('public.profiles') is null or to_regclass('public.pilot_consents') is null or to_regclass('public.profile_blocks') is null then
    raise exception 'Apply the real-pilot schema first';
  end if;
  if to_regclass('public.match_cases') is not null or to_regclass('public.match_case_approvals') is not null then
    raise exception 'Inspect existing case schema before applying this proposal';
  end if;
end $$;
create function public.synera_valid_mode_details(d jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare item text; referral_keys text[] := array['role','benefitTags','sourceDeclared','recipientScopeDeclared','thirdPartyStatus'];
begin
  if jsonb_typeof(d) is distinct from 'object' or not d ?& array['paid_service','referral','hybrid'] or d - array['paid_service','referral','hybrid'] <> '{}'::jsonb then return false; end if;
  if jsonb_typeof(d->'paid_service') is distinct from 'object' or (d->'paid_service') - 'role' <> '{}'::jsonb
    or jsonb_typeof(d->'paid_service'->'role') is distinct from 'string' or d->'paid_service'->>'role' not in ('','buyer','supplier') then return false; end if;
  if jsonb_typeof(d->'referral') is distinct from 'object' or not d->'referral' ?& referral_keys or (d->'referral') - referral_keys <> '{}'::jsonb then return false; end if;
  if jsonb_typeof(d->'referral'->'role') is distinct from 'string' or d->'referral'->>'role' not in ('','introducer','seeker') then return false; end if;
  if jsonb_typeof(d->'referral'->'sourceDeclared') is distinct from 'boolean' or jsonb_typeof(d->'referral'->'recipientScopeDeclared') is distinct from 'boolean' then return false; end if;
  if jsonb_typeof(d->'referral'->'thirdPartyStatus') is distinct from 'string' or d->'referral'->>'thirdPartyStatus' not in ('not_consulted','consented') then return false; end if;
  if jsonb_typeof(d->'referral'->'benefitTags') is distinct from 'array' or jsonb_array_length(d->'referral'->'benefitTags') > 7 then return false; end if;
  for item in select jsonb_array_elements_text(d->'referral'->'benefitTags') loop
    if item is null or item not in ('automation','design','research','sales','video','finance','events') then return false; end if;
  end loop;
  if (select count(distinct v) from jsonb_array_elements_text(d->'referral'->'benefitTags') v) <> jsonb_array_length(d->'referral'->'benefitTags') then return false; end if;
  if jsonb_typeof(d->'hybrid') is distinct from 'object' or (d->'hybrid') - 'components' <> '{}'::jsonb or jsonb_typeof(d->'hybrid'->'components') is distinct from 'array' then return false; end if;
  for item in select jsonb_array_elements_text(d->'hybrid'->'components') loop
    if item is null or item not in ('exchange','paid_service','referral') then return false; end if;
  end loop;
  if (select count(distinct v) from jsonb_array_elements_text(d->'hybrid'->'components') v) <> jsonb_array_length(d->'hybrid'->'components') then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function public.synera_valid_mode_details(jsonb) from public, authenticated;
grant execute on function public.synera_valid_mode_details(jsonb) to authenticated;
create or replace function public.synera_valid_brief(b jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare k text; item text; v2 boolean; pilot boolean;
  keys text[] := array['version','goal','offer_tags','need_tags','languages','modes','available_from','available_until','remote','max_km','city_code','confidentiality','accepts_confidentiality'];
begin
  if jsonb_typeof(b) is distinct from 'object' then return false; end if;
  v2 := b->'version' = '2'::jsonb;
  if not v2 and b->'version' is distinct from '1'::jsonb then return false; end if;
  if v2 then keys := keys || array['mode_details']; end if;
  if not b ?& keys or b - keys <> '{}'::jsonb then return false; end if;
  foreach k in array array['goal','available_from','available_until','city_code'] loop
    if jsonb_typeof(b->k) is distinct from 'string' then return false; end if;
  end loop;
  if length(b->>'goal') > 240 or b->>'city_code' not in ('','zurich','winterthur','zug','basel','bern') then return false; end if;
  foreach k in array array['remote','confidentiality','accepts_confidentiality'] loop
    if jsonb_typeof(b->k) is distinct from 'boolean' then return false; end if;
  end loop;
  if not (b->'max_km' = any(array['0','25','50','100','300']::jsonb[])) then return false; end if;
  foreach k in array array['offer_tags','need_tags','languages','modes'] loop
    if jsonb_typeof(b->k) is distinct from 'array' then return false; end if;
    if jsonb_array_length(b->k) > (case k when 'languages' then 4 when 'modes' then 5 else 7 end) then return false; end if;
    for item in select jsonb_array_elements_text(b->k) loop
      if k in ('offer_tags','need_tags') and item not in ('automation','design','research','sales','video','finance','events') then return false; end if;
      if k = 'languages' and item not in ('uk','en','de','fr') then return false; end if;
      if k = 'modes' and item not in ('exchange','joint_project','paid_service','referral','hybrid') then return false; end if;
      if item is null then return false; end if;
    end loop;
    if (select count(distinct v) from jsonb_array_elements_text(b->k) v) <> jsonb_array_length(b->k) then return false; end if;
  end loop;
  -- normalizeBrief writes version 2 exactly when a pilot mode is present, and only then mode_details.
  pilot := exists (select 1 from jsonb_array_elements_text(b->'modes') m where m in ('paid_service','referral','hybrid'));
  if pilot is distinct from v2 then return false; end if;
  if v2 and not public.synera_valid_mode_details(b->'mode_details') then return false; end if;
  foreach k in array array['available_from','available_until'] loop
    if b->>k <> '' and ((b->>k) !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char((b->>k)::date, 'YYYY-MM-DD') <> b->>k) then return false; end if;
  end loop;
  if b->>'available_from' <> '' and b->>'available_until' <> '' and b->>'available_from' > b->>'available_until' then return false; end if;
  return true;
exception when others then return false;
end $$;
alter table public.profiles drop constraint published_brief_complete,
  add constraint published_brief_complete check (not is_discoverable or (
    length(btrim(brief->>'goal')) > 0 and jsonb_array_length(brief->'languages') > 0 and jsonb_array_length(brief->'modes') > 0
    and brief->>'available_from' <> '' and brief->>'available_until' <> ''
    and (brief->>'city_code' <> '' or brief->'remote' = 'true'::jsonb)
    and case when brief->'version' = '2'::jsonb
      then jsonb_array_length(brief->'offer_tags') > 0 or jsonb_array_length(brief->'need_tags') > 0
      else jsonb_array_length(brief->'offer_tags') > 0 and jsonb_array_length(brief->'need_tags') > 0 end));
create table public.match_cases (
  case_id text primary key check (case_id ~ '^[A-Za-z0-9_:-]{1,64}$'),
  participant_low uuid not null references public.profiles(id) on delete cascade,
  participant_high uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('exchange','paid_service','referral','hybrid','joint_project')),
  material jsonb not null check (jsonb_typeof(material) = 'object'
    and material ?& array['mode','components','outcomes','trial','compensation','terms']
    and material - array['mode','components','outcomes','trial','compensation','terms'] = '{}'::jsonb
    and material->>'mode' = mode and octet_length(material::text) <= 16384),
  terms_hash text not null check (terms_hash ~ '^[a-f0-9]{64}$'),
  version integer not null default 1 check (version >= 1),
  status text not null default 'open' check (status in ('open','revoked','abandoned')),
  expires_at timestamptz not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (participant_low < participant_high),
  check (expires_at <= created_at + interval '90 days'),
  check ((status = 'open') = (closed_at is null))
);
create unique index match_cases_open_pair on public.match_cases(participant_low, participant_high) where status = 'open';
create function public.synera_case_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1; new.status := 'open'; new.closed_at := null; new.created_at := now(); new.updated_at := now();
    if new.expires_at <= now() then raise exception 'Case already expired'; end if;
    return new;
  end if;
  if old.status <> 'open' then raise exception 'Closed case is immutable'; end if;
  if old.expires_at <= now() and new.status = 'open' then raise exception 'Case expired'; end if;
  if new.case_id <> old.case_id or new.participant_low <> old.participant_low or new.participant_high <> old.participant_high
    or new.created_at <> old.created_at or new.expires_at > old.expires_at then raise exception 'Case identity is immutable'; end if;
  new.updated_at := now();
  if new.status <> 'open' then
    new.closed_at := now(); new.mode := old.mode; new.material := old.material; new.terms_hash := old.terms_hash; new.version := old.version;
    return new;
  end if;
  if new.material is distinct from old.material or new.mode is distinct from old.mode or new.terms_hash is distinct from old.terms_hash then
    if new.terms_hash = old.terms_hash then raise exception 'Material changed without a new hash'; end if;
    -- Older approvals stop being live because they name the previous version and hash.
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end $$;
revoke all on function public.synera_case_guard() from public, authenticated;
create trigger match_case_guard before insert or update on public.match_cases for each row execute function public.synera_case_guard();
create function public.synera_case_project_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
declare party uuid;
begin
  if new.mode <> 'joint_project' or new.status <> 'open' then return new; end if;
  if new.material->'components' is distinct from '["joint_project"]'::jsonb
    or jsonb_typeof(new.material->'outcomes') is distinct from 'array'
    or jsonb_typeof(new.material#>'{trial,deliverables}') is distinct from 'array' then
    raise exception 'Invalid joint project material';
  end if;
  if exists(select 1 from jsonb_array_elements(new.material->'outcomes') o
      where coalesce(o->>'receiver_id','') not in (new.participant_low::text,new.participant_high::text))
    or exists(select 1 from jsonb_array_elements(new.material#>'{trial,deliverables}') d
      where coalesce(d->>'giver_id','') not in (new.participant_low::text,new.participant_high::text)
        or coalesce(d->>'receiver_id','') not in (new.participant_low::text,new.participant_high::text)
        or d->>'giver_id'=d->>'receiver_id') then
    raise exception 'Joint project material must belong to its participants';
  end if;
  foreach party in array array[new.participant_low,new.participant_high] loop
    if not exists(select 1 from jsonb_array_elements(new.material->'outcomes') o where o->>'receiver_id'=party::text)
      or not exists(select 1 from jsonb_array_elements(new.material#>'{trial,deliverables}') d where d->>'giver_id'=party::text) then
      raise exception 'Joint project requires each contribution and result';
    end if;
  end loop;
  return new;
end $$;
revoke all on function public.synera_case_project_guard() from public, authenticated;
create trigger match_case_project_guard before insert or update on public.match_cases for each row execute function public.synera_case_project_guard();
alter table public.match_cases enable row level security;
revoke all on public.match_cases from public, authenticated;
grant select on public.match_cases to authenticated;
grant insert (case_id, participant_low, participant_high, mode, material, terms_hash, expires_at) on public.match_cases to authenticated;
grant update (mode, material, terms_hash, status, expires_at) on public.match_cases to authenticated;
create policy cases_read on public.match_cases for select to authenticated using ((select public.synera_user_id()) in (participant_low, participant_high));
create policy cases_create on public.match_cases for insert to authenticated with check ((select public.synera_user_id()) in (participant_low, participant_high)
  and exists (select 1 from public.profiles p where p.id = case when participant_low = (select public.synera_user_id()) then participant_high else participant_low end and p.is_discoverable));
create policy cases_update on public.match_cases for update to authenticated
  using ((select public.synera_user_id()) in (participant_low, participant_high) and status = 'open')
  with check ((select public.synera_user_id()) in (participant_low, participant_high));
create policy cases_consent on public.match_cases as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
create policy cases_unblocked on public.match_cases as restrictive for all to authenticated using (true) with check (status <> 'open'
  or not exists (select 1 from public.profile_blocks b where (b.blocker_id = participant_low and b.blocked_id = participant_high) or (b.blocker_id = participant_high and b.blocked_id = participant_low)));
create function public.synera_case_material_complete(m jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
begin
  if m->'compensation'->>'status' not in ('agreed_exchange','agreed_money','agreed_none') then return false; end if;
  if m->'components' ? 'paid_service' and m->'compensation'->>'status' <> 'agreed_money' then return false; end if;
  if m->'compensation'->>'status' = 'agreed_money' and (jsonb_typeof(m->'compensation'->'amount_minor') is distinct from 'number'
    or coalesce(m->'compensation'->>'currency', '') !~ '^[A-Z]{3}$' or jsonb_typeof(m->'compensation'->'invoice_required') is distinct from 'boolean') then return false; end if;
  if jsonb_typeof(m->'terms'->'revision_limit') is distinct from 'number' then return false; end if;
  if 'unresolved' in (m->'terms'->>'confidentiality', m->'terms'->>'intellectual_property', m->'terms'->>'cancellation') then return false; end if;
  return coalesce(m->'terms'->>'confidentiality', '') <> '' and coalesce(m->'terms'->>'intellectual_property', '') <> '' and coalesce(m->'terms'->>'cancellation', '') <> '';
exception when others then return false;
end $$;
revoke all on function public.synera_case_material_complete(jsonb) from public, authenticated;
grant execute on function public.synera_case_material_complete(jsonb) to authenticated;
create table public.match_case_approvals (
  id uuid primary key default gen_random_uuid(),
  case_id text not null references public.match_cases(case_id) on delete cascade,
  party_id uuid not null references public.profiles(id) on delete cascade,
  approved_version integer not null check (approved_version >= 1),
  approved_terms_hash text not null check (approved_terms_hash ~ '^[a-f0-9]{64}$'),
  approved_at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create unique index approvals_one_live on public.match_case_approvals(case_id, party_id, approved_version) where withdrawn_at is null;
create index approvals_case on public.match_case_approvals(case_id, approved_version);
create function public.synera_approval_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then new.approved_at := now(); new.withdrawn_at := null; return new; end if;
  if old.withdrawn_at is not null then raise exception 'Withdrawn approval is final'; end if;
  if new.case_id <> old.case_id or new.party_id <> old.party_id or new.approved_version <> old.approved_version
    or new.approved_terms_hash <> old.approved_terms_hash or new.approved_at <> old.approved_at then raise exception 'Approval is immutable'; end if;
  new.withdrawn_at := now();
  return new;
end $$;
revoke all on function public.synera_approval_guard() from public, authenticated;
create trigger match_case_approval_guard before insert or update on public.match_case_approvals for each row execute function public.synera_approval_guard();
alter table public.match_case_approvals enable row level security;
revoke all on public.match_case_approvals from public, authenticated;
grant select on public.match_case_approvals to authenticated;
grant insert (case_id, party_id, approved_version, approved_terms_hash) on public.match_case_approvals to authenticated;
grant update (withdrawn_at) on public.match_case_approvals to authenticated;
create policy approvals_read on public.match_case_approvals for select to authenticated using (
  exists (select 1 from public.match_cases c where c.case_id = match_case_approvals.case_id and (select public.synera_user_id()) in (c.participant_low, c.participant_high)));
create policy approvals_create on public.match_case_approvals for insert to authenticated with check (party_id = (select public.synera_user_id())
  and exists (select 1 from public.match_cases c where c.case_id = match_case_approvals.case_id and (select public.synera_user_id()) in (c.participant_low, c.participant_high)
    and c.status = 'open' and c.expires_at > now() and c.version = approved_version and c.terms_hash = approved_terms_hash
    and public.synera_case_material_complete(c.material)));
create policy approvals_withdraw on public.match_case_approvals for update to authenticated
  using (party_id = (select public.synera_user_id())) with check (party_id = (select public.synera_user_id()));
create policy approvals_consent on public.match_case_approvals as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
create policy meetings_need_approved_case on public.meeting_requests as restrictive for insert to authenticated with check (
  exists (select 1 from public.match_cases c where c.status = 'open' and c.expires_at > now()
    and c.participant_low = least(sender_id, recipient_id) and c.participant_high = greatest(sender_id, recipient_id)
    and (select count(distinct a.party_id) from public.match_case_approvals a where a.case_id = c.case_id and a.withdrawn_at is null
      and a.approved_version = c.version and a.approved_terms_hash = c.terms_hash and a.party_id in (c.participant_low, c.participant_high)) = 2));
create policy synera_members_only on public.match_cases as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
create policy synera_members_only on public.match_case_approvals as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
do $$ declare r text; t text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach t in array array['match_cases','match_case_approvals'] loop
        execute format('revoke all on public.%I from %I',t,r);
      end loop;
    end if;
  end loop;
end $$;
else raise exception 'Partial or unexpected migration: case-state.migration.sql';
end if;
END $kit$;

-- case-expiry-repair.migration.sql sha256=d31d9f08d552024c294a893e8003a1b84b8fa0210b49355751f56ae631c7a20a
DO $kit$ BEGIN
if exists(select 1 from pg_catalog.pg_proc where oid=(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') and btrim(prosrc)=btrim('
begin
  if tg_op = ''INSERT'' then
    new.version := 1; new.status := ''open''; new.closed_at := null; new.created_at := now(); new.updated_at := now();
    if new.expires_at <= now() then raise exception ''Case already expired''; end if;
    return new;
  end if;
  if old.status <> ''open'' then raise exception ''Closed case is immutable''; end if;
  if old.expires_at <= now() and new.status = ''open'' then raise exception ''Case expired''; end if;
  if new.case_id <> old.case_id or new.participant_low <> old.participant_low or new.participant_high <> old.participant_high
    or new.created_at <> old.created_at or new.expires_at > old.expires_at then raise exception ''Case identity is immutable''; end if;
  new.updated_at := now();
  if new.status <> ''open'' then
    new.closed_at := now(); new.mode := old.mode; new.material := old.material; new.terms_hash := old.terms_hash; new.version := old.version;
    return new;
  end if;
  if new.material is distinct from old.material or new.mode is distinct from old.mode or new.terms_hash is distinct from old.terms_hash then
    if new.terms_hash = old.terms_hash then raise exception ''Material changed without a new hash''; end if;
    -- Older approvals stop being live because they name the previous version and hash.
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end ')) then raise notice 'Already complete: case-expiry-repair.migration.sql'; else
do $$ begin if to_regclass('public.match_cases') is null or to_regprocedure('public.synera_case_guard()') is null then raise exception 'Existing case-state migration required'; end if; end $$;
create or replace function public.synera_case_guard() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1; new.status := 'open'; new.closed_at := null; new.created_at := now(); new.updated_at := now();
    if new.expires_at <= now() then raise exception 'Case already expired'; end if;
    return new;
  end if;
  if old.status <> 'open' then raise exception 'Closed case is immutable'; end if;
  if old.expires_at <= now() and new.status = 'open' then raise exception 'Case expired'; end if;
  if new.case_id <> old.case_id or new.participant_low <> old.participant_low or new.participant_high <> old.participant_high
    or new.created_at <> old.created_at or new.expires_at > old.expires_at then raise exception 'Case identity is immutable'; end if;
  new.updated_at := now();
  if new.status <> 'open' then
    new.closed_at := now(); new.mode := old.mode; new.material := old.material; new.terms_hash := old.terms_hash; new.version := old.version;
    return new;
  end if;
  if new.material is distinct from old.material or new.mode is distinct from old.mode or new.terms_hash is distinct from old.terms_hash then
    if new.terms_hash = old.terms_hash then raise exception 'Material changed without a new hash'; end if;
    -- Older approvals stop being live because they name the previous version and hash.
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end $$;
end if;
END $kit$;

-- meeting-status-guard.migration.sql sha256=a90c6e38ed75fe45faf2afe613835005e6e77e17484df1191bd04b2ed7ad2f33
DO $kit$ BEGIN
if (coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_status_guard' and not tgisinternal)),false)) then
raise notice 'Already complete: meeting-status-guard.migration.sql';
elsif (not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_status_guard' and not tgisinternal)),false)) then
do $$ begin
  if to_regclass('public.meeting_requests') is null or to_regclass('public.match_cases') is null
    or to_regclass('public.match_case_approvals') is null or to_regprocedure('public.synera_user_id()') is null then
    raise exception 'Apply the base pilot and case-state migrations first';
  end if;
  if to_regprocedure('public.synera_meeting_status_guard()') is not null
    or exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'public.meeting_requests'::regclass and tgname = 'meeting_status_guard') then
    raise exception 'Inspect existing meeting status guard';
  end if;
end $$;
create function public.synera_meeting_status_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare actor uuid := public.synera_user_id();
begin
  if new.status is not distinct from old.status then return new; end if;
  if not pg_catalog.row_security_active('public.meeting_requests'::pg_catalog.regclass) then return new; end if;
  -- Only the recipient answers a pending invitation.
  if old.status = 'pending' and new.status in ('accepted', 'declined') and actor is not null and actor = old.recipient_id then
    -- Accepting needs the SAME live agreement that sending needed (meetings_need_approved_case).
    if new.status = 'accepted' and not exists (
      select 1 from public.match_cases c where c.status = 'open' and c.expires_at > now()
        and c.participant_low = least(old.sender_id, old.recipient_id) and c.participant_high = greatest(old.sender_id, old.recipient_id)
        and (select count(distinct a.party_id) from public.match_case_approvals a where a.case_id = c.case_id and a.withdrawn_at is null
          and a.approved_version = c.version and a.approved_terms_hash = c.terms_hash and a.party_id in (c.participant_low, c.participant_high)) = 2) then
      -- Not an authorization failure: the person may re-approve the current revision and accept again.
      raise exception 'Both current approvals required before acceptance' using errcode = 'PT409';
    end if;
    return new;
  end if;
  -- Only the sender cancels, before or after acceptance.
  if old.status in ('pending', 'accepted') and new.status = 'cancelled' and actor is not null and actor = old.sender_id then return new; end if;
  -- Everything else is denied, including the sender accepting for the recipient, reopening a closed
  -- invitation, and reversing an acceptance.
  raise exception 'Invitation status transition denied' using errcode = '42501';
end $$;
revoke all on function public.synera_meeting_status_guard() from public, authenticated;
create trigger meeting_status_guard before update on public.meeting_requests for each row execute function public.synera_meeting_status_guard();
else raise exception 'Partial or unexpected migration: meeting-status-guard.migration.sql';
end if;
END $kit$;

-- meeting-location.migration.sql sha256=38215329f654807991472f97df75e8ac233f4616aaaa7ce584968a290e31277b
DO $kit$ BEGIN
if (coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_address')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meeting_address_participants')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_address_guard' and not tgisinternal)),false) and coalesce((to_regclass('public.meeting_location_grants') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='grantor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='recipient_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='precision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='lead_minutes')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='opens_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='closes_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='granted_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='revoked_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_time')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_duration')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_place')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_address')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_seq')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_admitted_at')),false) and coalesce((to_regclass('public.location_consent_intents') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='grantor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='created_at')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_case_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, integer, text') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_public' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='meeting_location_grants') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_invalidate' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='location_meeting_changed' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='location_case_changed' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='location_approval_withdrawn' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profile_blocks') and tgname='location_participant_blocked' and not tgisinternal)),false)) then
raise notice 'Already complete: meeting-location.migration.sql';
elsif (not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_address')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meeting_address_participants')),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_address_guard' and not tgisinternal)),false) and not coalesce((to_regclass('public.meeting_location_grants') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='grantor_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='recipient_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='precision')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='lead_minutes')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='opens_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='closes_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='granted_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='status')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='revoked_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_version')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_hash')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_time')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_duration')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_place')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_address')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='intent_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_seq')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_admitted_at')),false) and not coalesce((to_regclass('public.location_consent_intents') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='intent_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='meeting_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='grantor_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='created_at')),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_case_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, integer, text') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_public' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='meeting_location_grants') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_invalidate' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='location_meeting_changed' and not tgisinternal)),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='location_case_changed' and not tgisinternal)),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='location_approval_withdrawn' and not tgisinternal)),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profile_blocks') and tgname='location_participant_blocked' and not tgisinternal)),false)) then
do $$ begin
  if to_regclass('public.match_case_approvals') is null then raise exception 'Apply case-state migration first'; end if;
  if to_regclass('public.meeting_location_grants') is not null then raise exception 'Inspect existing location schema'; end if;
end $$;
alter table public.meeting_requests add column meeting_address text not null default '' check (char_length(meeting_address)<=200);
grant update (meeting_address) on public.meeting_requests to authenticated;
create policy meeting_address_participants on public.meeting_requests for update to authenticated
  using (status='accepted' and public.synera_user_id() in (sender_id,recipient_id))
  with check (status='accepted' and public.synera_user_id() in (sender_id,recipient_id));
create function public.synera_meeting_address_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.meeting_address is distinct from old.meeting_address and (old.status<>'accepted' or new.status<>'accepted') then
    raise exception 'Address changes require an already accepted meeting' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function public.synera_meeting_address_guard() from public, authenticated;
create trigger meeting_address_guard before update on public.meeting_requests for each row execute function public.synera_meeting_address_guard();
create table public.meeting_location_grants (
  id uuid not null unique default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_requests(id) on delete cascade,
  grantor_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  precision text not null check (precision in ('approximate','exact')),
  lead_minutes integer not null check (lead_minutes in (15,30)),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  granted_at timestamptz not null default now(),
  status text not null check (status in ('active','revoked')),
  revoked_at timestamptz,
  case_id text not null references public.match_cases(case_id) on delete cascade,
  case_version integer not null,
  case_hash text not null,
  meeting_time timestamptz not null,
  meeting_duration integer not null,
  meeting_place text not null,
  meeting_address text not null,
  intent_id uuid not null,
  sample_seq bigint not null default 0,
  sample_admitted_at timestamptz,
  primary key (meeting_id,grantor_id),
  check (grantor_id <> recipient_id and opens_at < closes_at)
);
alter table public.meeting_location_grants enable row level security;
revoke all on public.meeting_location_grants from public, authenticated;
create table public.location_consent_intents (
  intent_id uuid primary key,
  meeting_id uuid not null references public.meeting_requests(id) on delete cascade,
  grantor_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.location_consent_intents enable row level security;
revoke all on public.location_consent_intents from public, authenticated;
create function public.synera_location_case_current(p_case_id text,p_version integer,p_hash text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.match_cases c where c.case_id=p_case_id and c.version=p_version
    and c.terms_hash=p_hash and c.status='open' and c.expires_at>now()
    and (select count(distinct a.party_id) from public.match_case_approvals a where a.case_id=c.case_id
      and a.withdrawn_at is null and a.approved_version=c.version and a.approved_terms_hash=c.terms_hash
      and a.party_id in (c.participant_low,c.participant_high))=2);
$$;
create function public.synera_location_allowed(p_meeting_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.meeting_requests m where m.id=p_meeting_id
    and public.synera_user_id() in (m.sender_id,m.recipient_id) and m.status='accepted'
    and m.proposed_at is not null and m.duration_minutes is not null
    and btrim(m.meeting_place)<>'' and lower(btrim(m.meeting_place)) not in ('online','онлайн')
    and public.synera_pilot_member()
    and exists(select 1 from public.pilot_consents p where p.user_id=public.synera_user_id() and p.policy_version='2026-09-05-pilot-3')
    and not exists(select 1 from public.profile_blocks b where (b.blocker_id,b.blocked_id) in
      ((m.sender_id,m.recipient_id),(m.recipient_id,m.sender_id)))
    and exists(select 1 from public.match_cases c where c.participant_low=least(m.sender_id,m.recipient_id)
      and c.participant_high=greatest(m.sender_id,m.recipient_id)
      and public.synera_location_case_current(c.case_id,c.version,c.terms_hash)));
$$;
create function public.synera_location_public(g public.meeting_location_grants) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('schema','synera.location-grant.v1','id',g.id,'meeting_id',g.meeting_id,
    'grantor_id',g.grantor_id,'recipient_id',g.recipient_id,'precision',g.precision,
    'radius_m',case when g.precision='approximate' then 500 else 50 end,'lead_minutes',g.lead_minutes,
    'opens_at',g.opens_at,'closes_at',g.closes_at,'granted_at',g.granted_at,'status',g.status,'sample_seq',g.sample_seq);
$$;
create function public.synera_location_grant(p_meeting_id uuid,p_precision text,p_lead_minutes integer,p_consent boolean,p_intent_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.meeting_requests; c public.match_cases; g public.meeting_location_grants; actor uuid:=public.synera_user_id();
begin
  if p_intent_id is null or p_consent is distinct from true or p_precision is null or p_precision not in ('approximate','exact')
    or p_lead_minutes is null or p_lead_minutes not in (15,30) then raise exception 'Invalid location consent' using errcode='22023'; end if;
  if not public.synera_location_allowed(p_meeting_id) then raise exception 'Location unavailable' using errcode='42501'; end if;
  if exists(select 1 from public.location_consent_intents where intent_id=p_intent_id) then
    select * into g from public.meeting_location_grants where meeting_id=p_meeting_id and grantor_id=actor and intent_id=p_intent_id;
    if g.id is null or g.status<>'active' or g.closes_at<=now() then raise exception 'Consent intent already used' using errcode='42501'; end if;
    return public.synera_location_public(g);
  end if;
  if (select count(*) from public.location_consent_intents where grantor_id=actor and created_at>now()-interval '1 day')>=60 then
    raise exception 'Location consent rate exceeded' using errcode='42501';
  end if;
  select * into m from public.meeting_requests where id=p_meeting_id for update;
  if not public.synera_location_allowed(p_meeting_id) then raise exception 'Location unavailable' using errcode='42501'; end if;
  if m.proposed_at+make_interval(mins=>m.duration_minutes)<=now() then raise exception 'Location unavailable' using errcode='42501'; end if;
  select * into c from public.match_cases where participant_low=least(m.sender_id,m.recipient_id)
    and participant_high=greatest(m.sender_id,m.recipient_id)
    and public.synera_location_case_current(case_id,version,terms_hash) order by updated_at desc limit 1;
  insert into public.meeting_location_grants(meeting_id,grantor_id,recipient_id,precision,lead_minutes,opens_at,closes_at,status,
    case_id,case_version,case_hash,meeting_time,meeting_duration,meeting_place,meeting_address,intent_id)
  values(m.id,actor,case when actor=m.sender_id then m.recipient_id else m.sender_id end,p_precision,p_lead_minutes,
    m.proposed_at-make_interval(mins=>p_lead_minutes),m.proposed_at+make_interval(mins=>m.duration_minutes),'active',
    c.case_id,c.version,c.terms_hash,m.proposed_at,m.duration_minutes,m.meeting_place,m.meeting_address,p_intent_id)
  on conflict (meeting_id,grantor_id) do update set id=gen_random_uuid(),recipient_id=excluded.recipient_id,
    precision=excluded.precision,lead_minutes=excluded.lead_minutes,opens_at=excluded.opens_at,closes_at=excluded.closes_at,
    granted_at=now(),status='active',revoked_at=null,case_id=excluded.case_id,case_version=excluded.case_version,
    case_hash=excluded.case_hash,meeting_time=excluded.meeting_time,meeting_duration=excluded.meeting_duration,meeting_place=excluded.meeting_place,meeting_address=excluded.meeting_address,
    intent_id=p_intent_id,sample_seq=0
  returning * into g;
  insert into public.location_consent_intents(intent_id,meeting_id,grantor_id) values(p_intent_id,p_meeting_id,actor);
  return public.synera_location_public(g);
end $$;
create function public.synera_location_sample(p_meeting_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a jsonb; g public.meeting_location_grants;
begin
  a:=public.synera_location_access(p_meeting_id);
  if a->'own' is null or a->'own'='null'::jsonb then raise exception 'Location unavailable' using errcode='42501'; end if;
  update public.meeting_location_grants set sample_seq=sample_seq+1,sample_admitted_at=now() where meeting_id=p_meeting_id and grantor_id=public.synera_user_id()
    and id=(a->'own'->>'id')::uuid and status='active' and opens_at<=now() and closes_at>now()+interval '60 seconds'
    and (sample_admitted_at is null or sample_admitted_at<=now()-interval '20 seconds') returning * into g;
  if g.id is null then raise exception 'Location window closed' using errcode='42501'; end if;
  return jsonb_build_object('grant',public.synera_location_public(g),'server_now',now());
end $$;
create function public.synera_location_access(p_meeting_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); own_grant jsonb; peer_grant jsonb; meeting_row public.meeting_requests; meeting_snapshot jsonb;
begin
  select * into meeting_row from public.meeting_requests where id=p_meeting_id and actor in (sender_id,recipient_id)
    and public.synera_pilot_member() and exists(select 1 from public.pilot_consents p where p.user_id=actor and p.policy_version='2026-09-05-pilot-3');
  if meeting_row.id is not null then meeting_snapshot:=jsonb_build_object('id',meeting_row.id,'status',meeting_row.status,'meeting_address',meeting_row.meeting_address,
    'meeting_place',meeting_row.meeting_place,'proposed_at',meeting_row.proposed_at,'duration_minutes',meeting_row.duration_minutes); end if;
  if not public.synera_location_allowed(p_meeting_id) then
    return jsonb_build_object('eligible',false,'own',null,'peer',null,'meeting',meeting_snapshot,'server_now',now());
  end if;
  select public.synera_location_public(g) into own_grant from public.meeting_location_grants g
    join public.meeting_requests m on m.id=g.meeting_id where g.meeting_id=p_meeting_id and g.grantor_id=actor
    and g.status='active' and g.closes_at>now() and public.synera_location_case_current(g.case_id,g.case_version,g.case_hash)
    and (g.meeting_time,g.meeting_duration,g.meeting_place,g.meeting_address)=(m.proposed_at,m.duration_minutes,m.meeting_place,m.meeting_address);
  select public.synera_location_public(g) into peer_grant from public.meeting_location_grants g
    join public.meeting_requests m on m.id=g.meeting_id where g.meeting_id=p_meeting_id and g.recipient_id=actor
    and g.status='active' and g.opens_at<=now() and g.closes_at>now()
    and public.synera_location_case_current(g.case_id,g.case_version,g.case_hash)
    and (g.meeting_time,g.meeting_duration,g.meeting_place,g.meeting_address)=(m.proposed_at,m.duration_minutes,m.meeting_place,m.meeting_address);
  return jsonb_build_object('eligible',true,'own',own_grant,'peer',peer_grant,'meeting',meeting_snapshot,'server_now',now());
end $$;
create function public.synera_location_revoke(p_meeting_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare g public.meeting_location_grants;
begin
  if not public.synera_pilot_member() then raise exception 'Location unavailable' using errcode='42501'; end if;
  update public.meeting_location_grants set status='revoked',revoked_at=now()
    where meeting_id=p_meeting_id and grantor_id=public.synera_user_id() returning * into g;
  if g.id is null then return null; end if;
  return public.synera_location_public(g);
end $$;
create function public.synera_location_invalidate() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_TABLE_NAME='meeting_requests' then
    if (new.status,new.proposed_at,new.duration_minutes,new.meeting_place,new.meeting_address) is distinct from (old.status,old.proposed_at,old.duration_minutes,old.meeting_place,old.meeting_address) then
      update public.meeting_location_grants set status='revoked',revoked_at=now() where meeting_id=new.id and status='active';
    end if;
  elsif TG_TABLE_NAME='match_cases' then
    if (new.status,new.version) is distinct from (old.status,old.version) then
      update public.meeting_location_grants set status='revoked',revoked_at=now() where case_id=new.case_id and status='active';
    end if;
  elsif TG_TABLE_NAME='match_case_approvals' then
    if new.withdrawn_at is not null then update public.meeting_location_grants set status='revoked',revoked_at=now() where case_id=new.case_id and status='active'; end if;
  elsif TG_TABLE_NAME='profile_blocks' then
    update public.meeting_location_grants set status='revoked',revoked_at=now()
      where status='active' and (grantor_id,recipient_id) in ((new.blocker_id,new.blocked_id),(new.blocked_id,new.blocker_id));
  end if;
  return new;
end $$;
create trigger location_meeting_changed after update on public.meeting_requests for each row execute function public.synera_location_invalidate();
create trigger location_case_changed after update on public.match_cases for each row execute function public.synera_location_invalidate();
create trigger location_approval_withdrawn after update on public.match_case_approvals for each row execute function public.synera_location_invalidate();
create trigger location_participant_blocked after insert on public.profile_blocks for each row execute function public.synera_location_invalidate();
revoke all on function public.synera_location_case_current(text,integer,text),public.synera_location_allowed(uuid),
  public.synera_location_public(public.meeting_location_grants),public.synera_location_invalidate(),
  public.synera_location_grant(uuid,text,integer,boolean,uuid),public.synera_location_access(uuid),public.synera_location_revoke(uuid),public.synera_location_sample(uuid) from public, authenticated;
grant execute on function public.synera_location_grant(uuid,text,integer,boolean,uuid),public.synera_location_access(uuid),public.synera_location_revoke(uuid),public.synera_location_sample(uuid) to authenticated;
do $$ declare r text; f text; begin
    foreach r in array array['anon','anonymous'] loop
      if exists(select 1 from pg_roles where rolname=r) then
        execute format('revoke all on public.meeting_location_grants,public.location_consent_intents from %I',r);
        foreach f in array array['synera_location_grant(uuid,text,integer,boolean,uuid)','synera_location_access(uuid)','synera_location_revoke(uuid)','synera_location_sample(uuid)'] loop
          execute format('revoke all on function public.%s from %I',f,r);
        end loop;
      end if;
    end loop;
  end $$;
else raise exception 'Partial or unexpected migration: meeting-location.migration.sql';
end if;
END $kit$;

-- group-room.migration.sql sha256=58e85f7534871a40936c081960861cea569f68ffc69c157d988e2473778115da
DO $kit$ BEGIN
if (coalesce((to_regclass('public.group_rooms') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='creator_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='title')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='goal')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_position')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_deadline')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_started_revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='created_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='activated_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='paused_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='closed_at')),false) and coalesce((to_regclass('public.group_room_members') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='room_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='position')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='role')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='membership_status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='invited_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='accepted_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='left_at')),false) and coalesce((to_regclass('public.group_room_messages') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='message_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='sender_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='body')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='created_at')),false) and coalesce((to_regclass('public.group_room_events') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='room_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='event_type')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='actor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='created_at')),false) and coalesce((to_regclass('public.group_room_members_user') is not null),false) and coalesce((to_regclass('public.group_room_messages_room') is not null),false) and coalesce((to_regclass('public.group_room_events_room') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_current_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_pair_blocked' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_actor_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_all_accepted_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_admit_write' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_rooms') and polname='group_rooms_participants')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_members') and polname='group_room_members_participants')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_messages') and polname='group_room_messages_accepted')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_events') and polname='group_room_events_accepted')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_state' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false)) then
raise notice 'Already complete: group-room.migration.sql';
elsif (not coalesce((to_regclass('public.group_rooms') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='creator_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='title')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='goal')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='status')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='revision')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_position')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_deadline')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_started_revision')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='created_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='activated_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='paused_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='closed_at')),false) and not coalesce((to_regclass('public.group_room_members') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='room_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='user_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='position')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='role')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='membership_status')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='invited_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='accepted_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='left_at')),false) and not coalesce((to_regclass('public.group_room_messages') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='message_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='sender_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_revision')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='body')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='created_at')),false) and not coalesce((to_regclass('public.group_room_events') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='room_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='revision')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='event_type')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='actor_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='created_at')),false) and not coalesce((to_regclass('public.group_room_members_user') is not null),false) and not coalesce((to_regclass('public.group_room_messages_room') is not null),false) and not coalesce((to_regclass('public.group_room_events_room') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_current_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_pair_blocked' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_actor_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_all_accepted_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_admit_write' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_rooms') and polname='group_rooms_participants')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_members') and polname='group_room_members_participants')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_messages') and polname='group_room_messages_accepted')),false) and not coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_events') and polname='group_room_events_accepted')),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_state' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false)) then
do $$ begin
  if to_regclass('public.profiles') is null or to_regclass('public.pilot_consents') is null or to_regclass('public.profile_blocks') is null then
    raise exception 'Apply real-pilot schema first';
  end if;
  if to_regclass('public.group_rooms') is not null then raise exception 'Inspect existing group room schema before applying'; end if;
end $$;
create table public.group_rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  goal text not null check (char_length(btrim(goal)) between 1 and 500),
  status text not null default 'inviting' check (status in ('inviting','active','paused','closed')),
  revision integer not null default 1 check (revision >= 1),
  turn_position integer,
  turn_deadline timestamptz,
  turn_started_revision integer,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  paused_at timestamptz,
  closed_at timestamptz,
  check ((status = 'active') = (turn_position is not null and turn_deadline is not null and turn_started_revision is not null)),
  check (turn_deadline is null or turn_deadline > created_at)
);
create table public.group_room_members (
  room_id uuid not null references public.group_rooms(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  position smallint not null check (position between 0 and 2),
  role text not null check (role in ('creator','member')),
  membership_status text not null check (membership_status in ('invited','accepted','left','revoked')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  left_at timestamptz,
  primary key (room_id,user_id),
  unique (room_id,position),
  check ((role = 'creator') = (position = 0)),
  
  check (membership_status <> 'accepted' or accepted_at is not null),
  check ((membership_status = 'left') = (left_at is not null))
);
create table public.group_room_messages (
  room_id uuid not null references public.group_rooms(id) on delete restrict,
  message_id uuid not null,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  room_revision integer not null check (room_revision >= 1),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  primary key (room_id,message_id)
);
create table public.group_room_events (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.group_rooms(id) on delete restrict,
  revision integer not null check (revision >= 1),
  event_type text not null check (event_type in ('created','accepted','started','message','advanced','no_response','left','closed')),
  actor_id uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (room_id,revision)
);
create index group_room_members_user on public.group_room_members(user_id,room_id);
create index group_room_messages_room on public.group_room_messages(room_id,created_at,message_id);
create index group_room_events_room on public.group_room_events(room_id,revision);
alter table public.group_rooms enable row level security;
alter table public.group_room_members enable row level security;
alter table public.group_room_messages enable row level security;
alter table public.group_room_events enable row level security;
revoke all on public.group_rooms,public.group_room_members,public.group_room_messages,public.group_room_events from public,authenticated;
create function public.synera_room_current_member(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.pilot_consents c join public.profiles p on p.id=c.user_id
    where c.user_id=p_user_id and c.policy_version='2026-09-05-pilot-3'
      and c.terms_accepted and c.privacy_acknowledged and p.is_discoverable
      and exists(select 1 from neon_auth."user" u join public.synera_pilot_members a on a.email=lower(u.email)
        where u.id=p_user_id and u."emailVerified"=true));
$$;
create function public.synera_room_pair_blocked(p_left uuid,p_right uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profile_blocks b where (b.blocker_id,b.blocked_id) in ((p_left,p_right),(p_right,p_left)));
$$;
create function public.synera_room_actor_allowed(p_room_id uuid,p_allow_invited boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.synera_user_id() is not null
    and public.synera_room_current_member(public.synera_user_id())
    and exists(select 1 from public.group_room_members own where own.room_id=p_room_id and own.user_id=public.synera_user_id()
      and own.membership_status = any(case when p_allow_invited then array['invited','accepted']::text[] else array['accepted']::text[] end))
    and not exists(select 1 from public.group_room_members a join public.group_room_members b on b.room_id=a.room_id and b.user_id>a.user_id
      where a.room_id=p_room_id and a.membership_status in ('invited','accepted') and b.membership_status in ('invited','accepted')
        and public.synera_room_pair_blocked(a.user_id,b.user_id));
$$;
create function public.synera_room_all_accepted_current(p_room_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists(select 1 from public.group_room_members m where m.room_id=p_room_id and m.membership_status='accepted'
    and not public.synera_room_current_member(m.user_id));
$$;
create function public.synera_room_admit_write(p_kind text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); counter public.synera_write_limits%rowtype;
begin
  if actor is null or p_kind not in ('invitation','message') then raise exception 'Write unavailable' using errcode='42501'; end if;
  insert into public.synera_write_limits(user_id) values(actor) on conflict (user_id) do nothing;
  select * into counter from public.synera_write_limits where user_id=actor for update;
  if counter.window_started_at<=now()-interval '1 day' then
    update public.synera_write_limits set invitations=0,messages=0,reports=0,window_started_at=now() where user_id=actor returning * into counter;
  end if;
  if (p_kind='invitation' and counter.invitations>=20) or (p_kind='message' and counter.messages>=100) then raise exception 'Write rate exceeded' using errcode='PT429'; end if;
  if p_kind='invitation' then update public.synera_write_limits set invitations=invitations+1 where user_id=actor;
  else update public.synera_write_limits set messages=messages+1 where user_id=actor; end if;
end $$;
create policy group_rooms_participants on public.group_rooms for select to authenticated using (
  public.synera_room_actor_allowed(id,true));
create policy group_room_members_participants on public.group_room_members for select to authenticated using (
  public.synera_room_actor_allowed(room_id,true));
create policy group_room_messages_accepted on public.group_room_messages for select to authenticated using (
  public.synera_room_actor_allowed(room_id,false));
create policy group_room_events_accepted on public.group_room_events for select to authenticated using (
  public.synera_room_actor_allowed(room_id,false));
create function public.synera_room_state(p_room_id uuid,p_include_transcript boolean default true) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r public.group_rooms; actor uuid:=public.synera_user_id(); own public.group_room_members; transcript jsonb:='[]'::jsonb;
begin
  if not public.synera_room_actor_allowed(p_room_id,true) then raise exception 'Room unavailable' using errcode='42501'; end if;
  select * into r from public.group_rooms where id=p_room_id;
  select * into own from public.group_room_members where room_id=p_room_id and user_id=actor;
  if p_include_transcript and own.membership_status='accepted' then
    select coalesce(jsonb_agg(jsonb_build_object('message_id',m.message_id,'sender_id',m.sender_id,'room_revision',m.room_revision,'body',m.body,'created_at',m.created_at) order by m.created_at,m.message_id),'[]'::jsonb)
      into transcript from public.group_room_messages m where m.room_id=p_room_id;
  end if;
  return jsonb_build_object('schema','synera.group-room.v1','id',r.id,'title',r.title,'goal',r.goal,'status',r.status,
    'revision',r.revision,'server_now',now(),'own_role',own.role,'own_membership_status',own.membership_status,
    'participants',(select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'display_name',case when public.synera_room_current_member(m.user_id) then p.display_name else null end,'role',m.role,'membership_status',m.membership_status,'position',m.position) order by m.position),'[]'::jsonb) from public.group_room_members m join public.profiles p on p.id=m.user_id where m.room_id=p_room_id),
    'active_turn',case when r.status='active' then jsonb_build_object('speaker_id',(select m.user_id from public.group_room_members m where m.room_id=p_room_id and m.position=r.turn_position),'deadline',r.turn_deadline) else null end,
    'last_turn_event',case when own.membership_status='accepted' then (select jsonb_build_object('kind',e.event_type,'created_at',e.created_at) from public.group_room_events e where e.room_id=p_room_id and e.event_type in ('advanced','no_response') order by e.revision desc limit 1) else null end,
    'transcript',transcript);
end $$;
create function public.synera_room_create(p_title text,p_goal text,p_invitee_ids uuid[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms; invitee uuid; position smallint:=1;
begin
  if actor is null or not public.synera_room_current_member(actor) then raise exception 'Current pilot consent required' using errcode='42501'; end if;
  if p_title is null or p_goal is null or char_length(btrim(p_title)) not between 1 and 120 or char_length(btrim(p_goal)) not between 1 and 500 then raise exception 'Invalid room title or goal' using errcode='22023'; end if;
  if p_invitee_ids is null or cardinality(p_invitee_ids) not between 1 and 2 or actor=any(p_invitee_ids) or (select count(distinct v) from unnest(p_invitee_ids) v) <> cardinality(p_invitee_ids) then raise exception 'Choose one or two distinct invitees' using errcode='22023'; end if;
  foreach invitee in array p_invitee_ids loop
    if not public.synera_room_current_member(invitee) or public.synera_room_pair_blocked(actor,invitee) then raise exception 'Invitee unavailable' using errcode='42501'; end if;
  end loop;
  if cardinality(p_invitee_ids)=2 and public.synera_room_pair_blocked(p_invitee_ids[1],p_invitee_ids[2]) then raise exception 'Invitees unavailable together' using errcode='42501'; end if;
  perform public.synera_room_admit_write('invitation');
  insert into public.group_rooms(creator_id,title,goal) values(actor,btrim(p_title),btrim(p_goal)) returning * into r;
  insert into public.group_room_members(room_id,user_id,position,role,membership_status,accepted_at) values(r.id,actor,0,'creator','accepted',now());
  foreach invitee in array p_invitee_ids loop
    insert into public.group_room_members(room_id,user_id,position,role,membership_status) values(r.id,invitee,position,'member','invited'); position:=position+1;
  end loop;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(r.id,r.revision,'created',actor);
  return public.synera_room_state(r.id,false);
end $$;
create function public.synera_room_list() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id();
begin
  if actor is null or not public.synera_room_current_member(actor) then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(public.synera_room_state(visible.room_id,false) order by visible.created_at desc)
    from (select m.room_id,r.created_at from public.group_room_members m join public.group_rooms r on r.id=m.room_id
      where m.user_id=actor and public.synera_room_actor_allowed(m.room_id,true) order by r.created_at desc limit 50) visible),'[]'::jsonb);
end $$;
create function public.synera_room_get(p_room_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$ select public.synera_room_state(p_room_id,true); $$;
create function public.synera_room_accept(p_room_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if actor is null or not public.synera_room_current_member(actor) then raise exception 'Current pilot consent required' using errcode='42501'; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or r.status <> 'inviting' then raise exception 'Invitation unavailable' using errcode='42501'; end if;
  if not public.synera_room_actor_allowed(p_room_id,true) then raise exception 'Invitation unavailable' using errcode='42501'; end if;
  update public.group_room_members set membership_status='accepted',accepted_at=now() where room_id=p_room_id and user_id=actor and membership_status='invited';
  if not found then raise exception 'Invitation unavailable' using errcode='42501'; end if;
  update public.group_rooms set revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,'accepted',actor);
  return public.synera_room_state(p_room_id,false);
end $$;
create function public.synera_room_leave(p_room_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or not public.synera_room_actor_allowed(p_room_id,true) then raise exception 'Room unavailable' using errcode='42501'; end if;
  update public.group_room_members set membership_status='left',left_at=now() where room_id=p_room_id and user_id=actor;
  update public.group_rooms set status=case when status='active' then 'paused' else status end,turn_position=null,turn_deadline=null,turn_started_revision=null,paused_at=case when status='active' then now() else paused_at end,revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,'left',actor);
  return jsonb_build_object('schema','synera.group-room.v1','id',p_room_id,'status','left','server_now',now());
end $$;
create function public.synera_room_start(p_room_id uuid,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if p_expected_revision is null or p_expected_revision < 1 then raise exception 'Invalid room revision' using errcode='22023'; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or actor is null or r.creator_id<>actor or r.status<>'inviting' or not public.synera_room_actor_allowed(p_room_id,false) or not public.synera_room_all_accepted_current(p_room_id) then raise exception 'Room start unavailable' using errcode='42501'; end if;
  if r.revision is distinct from p_expected_revision then raise exception 'Stale room revision' using errcode='PT409'; end if;
  if exists(select 1 from public.group_room_members m where m.room_id=p_room_id and m.membership_status<>'accepted') then raise exception 'Every invited participant must explicitly accept' using errcode='42501'; end if;
  update public.group_rooms set status='active',turn_position=0,turn_deadline=now()+interval '60 seconds',turn_started_revision=revision+1,activated_at=now(),revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,'started',actor);
  return public.synera_room_state(p_room_id,true);
end $$;
create function public.synera_room_message(p_room_id uuid,p_expected_revision integer,p_message_id uuid,p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms; prior public.group_room_messages;
begin
  if actor is null or p_message_id is null or p_body is null or char_length(btrim(p_body)) not between 1 and 2000 then raise exception 'Invalid message' using errcode='22023'; end if;
  if p_expected_revision is null or p_expected_revision < 1 then raise exception 'Invalid room revision' using errcode='22023'; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or not public.synera_room_actor_allowed(p_room_id,false) or not public.synera_room_all_accepted_current(p_room_id) then raise exception 'Message unavailable' using errcode='42501'; end if;
  select * into prior from public.group_room_messages where room_id=p_room_id and message_id=p_message_id;
  if prior.message_id is not null then
    if prior.sender_id<>actor or prior.body<>p_body then raise exception 'Idempotency key conflict' using errcode='22023'; end if;
    return public.synera_room_state(p_room_id,true);
  end if;
  if r.status<>'active' or r.turn_deadline<=now()
    or actor<>(select m.user_id from public.group_room_members m where m.room_id=p_room_id and m.position=r.turn_position and m.membership_status='accepted') then raise exception 'Message unavailable' using errcode='42501'; end if;
  if r.revision is distinct from p_expected_revision then raise exception 'Stale room revision' using errcode='PT409'; end if;
  if (select count(*) from public.group_room_messages m where m.room_id=p_room_id)>=100 then raise exception 'Room message limit reached' using errcode='PT429'; end if;
  perform public.synera_room_admit_write('message');
  update public.group_rooms set revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_messages(room_id,message_id,sender_id,room_revision,body) values(p_room_id,p_message_id,actor,r.revision,p_body);
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,'message',actor);
  return public.synera_room_state(p_room_id,true);
end $$;
create function public.synera_room_advance(p_room_id uuid,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms; speaker uuid; next_position smallint; deadline_passed boolean; silent_timeout boolean;
begin
  if p_expected_revision is null or p_expected_revision < 1 then raise exception 'Invalid room revision' using errcode='22023'; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or r.status<>'active' or not public.synera_room_actor_allowed(p_room_id,false) or not public.synera_room_all_accepted_current(p_room_id) then raise exception 'Advance unavailable' using errcode='42501'; end if;
  if r.revision is distinct from p_expected_revision then raise exception 'Stale room revision' using errcode='PT409'; end if;
  select user_id into speaker from public.group_room_members where room_id=p_room_id and position=r.turn_position and membership_status='accepted';
  deadline_passed:=r.turn_deadline<=now();
  silent_timeout:=deadline_passed and not exists(select 1 from public.group_room_messages m where m.room_id=p_room_id and m.room_revision>r.turn_started_revision);
  if actor<>speaker and not deadline_passed then raise exception 'Only the current speaker may advance before the deadline' using errcode='42501'; end if;
  select m.position into next_position from public.group_room_members m where m.room_id=p_room_id and m.membership_status='accepted' and m.position>r.turn_position order by m.position limit 1;
  if next_position is null then select m.position into next_position from public.group_room_members m where m.room_id=p_room_id and m.membership_status='accepted' order by m.position limit 1; end if;
  update public.group_rooms set turn_position=next_position,turn_deadline=now()+interval '60 seconds',turn_started_revision=revision+1,revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,case when silent_timeout then 'no_response' else 'advanced' end,actor);
  return public.synera_room_state(p_room_id,true);
end $$;
create function public.synera_room_close(p_room_id uuid,p_expected_revision integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid:=public.synera_user_id(); r public.group_rooms;
begin
  if p_expected_revision is null or p_expected_revision < 1 then raise exception 'Invalid room revision' using errcode='22023'; end if;
  select * into r from public.group_rooms where id=p_room_id for update;
  if r.id is null or actor is null or r.creator_id<>actor or r.status in ('closed') or not public.synera_room_actor_allowed(p_room_id,false) then raise exception 'Room close unavailable' using errcode='42501'; end if;
  if r.revision is distinct from p_expected_revision then raise exception 'Stale room revision' using errcode='PT409'; end if;
  update public.group_rooms set status='closed',turn_position=null,turn_deadline=null,turn_started_revision=null,closed_at=now(),revision=revision+1 where id=p_room_id returning * into r;
  insert into public.group_room_events(room_id,revision,event_type,actor_id) values(p_room_id,r.revision,'closed',actor);
  return public.synera_room_state(p_room_id,true);
end $$;
revoke all on function public.synera_room_current_member(uuid),public.synera_room_pair_blocked(uuid,uuid),public.synera_room_actor_allowed(uuid,boolean),public.synera_room_all_accepted_current(uuid),public.synera_room_admit_write(text),public.synera_room_state(uuid,boolean),
  public.synera_room_create(text,text,uuid[]),public.synera_room_list(),public.synera_room_get(uuid),public.synera_room_accept(uuid),public.synera_room_leave(uuid),
  public.synera_room_start(uuid,integer),public.synera_room_message(uuid,integer,uuid,text),public.synera_room_advance(uuid,integer),public.synera_room_close(uuid,integer) from public,authenticated;
grant execute on function public.synera_room_create(text,text,uuid[]),public.synera_room_list(),public.synera_room_get(uuid),public.synera_room_accept(uuid),public.synera_room_leave(uuid),
  public.synera_room_start(uuid,integer),public.synera_room_message(uuid,integer,uuid,text),public.synera_room_advance(uuid,integer),public.synera_room_close(uuid,integer) to authenticated;
do $$ declare r text; t text; f text; begin
    foreach r in array array['anon','anonymous'] loop
      if exists(select 1 from pg_roles where rolname=r) then
        foreach t in array array['group_rooms','group_room_members','group_room_messages','group_room_events'] loop execute format('revoke all on public.%I from %I',t,r); end loop;
        foreach f in array array['synera_room_create(text,text,uuid[])','synera_room_list()','synera_room_get(uuid)','synera_room_accept(uuid)','synera_room_leave(uuid)','synera_room_start(uuid,integer)','synera_room_message(uuid,integer,uuid,text)','synera_room_advance(uuid,integer)','synera_room_close(uuid,integer)'] loop execute format('revoke all on function public.%s from %I',f,r); end loop;
      end if;
    end loop;
  end $$;
else raise exception 'Partial or unexpected migration: group-room.migration.sql';
end if;
END $kit$;

-- case-outcome.migration.sql sha256=5cd6a796b2abe15c01661074e192cc8d0e3de860ca1883855e10a5f5a7073ef6
DO $kit$ BEGIN
if (coalesce((to_regclass('public.match_outcome_events') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='material_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='deliverable_index')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='actor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='kind')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='payload')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='created_at')),false) and coalesce((to_regclass('public.match_outcomes_revision') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null),false)) then
raise notice 'Already complete: case-outcome.migration.sql';
elsif (not coalesce((to_regclass('public.match_outcome_events') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='case_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='material_version')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='terms_hash')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='deliverable_index')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='actor_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='kind')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='intent_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='payload')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='created_at')),false) and not coalesce((to_regclass('public.match_outcomes_revision') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null),false)) then
do $$ begin
  if to_regclass('public.match_cases') is null or to_regprocedure('public.synera_room_admit_write(text)') is null then
    raise exception 'Apply case-state and group-room proposals first';
  end if;
  if to_regclass('public.match_outcome_events') is not null then raise exception 'Inspect existing outcome schema first'; end if;
end $$;
create table public.match_outcome_events (
  id bigint generated always as identity primary key,
  case_id text not null references public.match_cases(case_id) on delete cascade,
  material_version integer not null check (material_version >= 1),
  terms_hash text not null check (terms_hash ~ '^[a-f0-9]{64}$'),
  deliverable_index integer not null check (deliverable_index >= 0),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('submit','check','accept','decline')),
  intent_id uuid not null,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 4096),
  created_at timestamptz not null default now(),
  unique(actor_id,intent_id)
);
create index match_outcomes_revision on public.match_outcome_events(case_id,material_version,terms_hash,id);
alter table public.match_outcome_events enable row level security;
revoke all on public.match_outcome_events from public,authenticated;
revoke all on sequence public.match_outcome_events_id_seq from public,authenticated;
create function public.synera_case_outcome(p_case_id text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=public.synera_user_id(); c public.match_cases; prior public.match_outcome_events;
  action text; version integer; term_hash text; idx integer; intent uuid; d jsonb;
  submitted boolean; checked boolean; decision text; evidence text; notes text; reason text;
  entry record; rows jsonb:='[]'::jsonb; history jsonb; all_confirmed boolean:=true;
begin
  if actor is null or public.synera_pilot_member() is not true
    or not exists(select 1 from public.pilot_consents where user_id=actor and policy_version='2026-09-05-pilot-3') then
    raise exception 'Outcome unavailable' using errcode='42501';
  end if;
  if p_case_id is null or p_case_id !~ '^[A-Za-z0-9_:-]{1,64}$'
    or jsonb_typeof(p_payload) is distinct from 'object'
    or octet_length(p_payload::text)>4096
    or p_payload-array['action','version','termsHash','index','intentId','evidenceUri','scopeNotes','reason'] <> '{}'::jsonb
    or jsonb_typeof(p_payload->'version') is distinct from 'number'
    or coalesce(p_payload->>'version','') !~ '^[1-9][0-9]{0,8}$'
    or coalesce(p_payload->>'termsHash','') !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid outcome request' using errcode='22023';
  end if;
  action:=p_payload->>'action'; version:=(p_payload->>'version')::integer; term_hash:=p_payload->>'termsHash';
  if action is null or action not in ('state','submit','check','accept','decline') then raise exception 'Invalid outcome action' using errcode='22023'; end if;
  select * into c from public.match_cases where case_id=p_case_id for update;
  if not found or actor not in (c.participant_low,c.participant_high)
    or exists(select 1 from public.profile_blocks where (blocker_id=c.participant_low and blocked_id=c.participant_high)
      or (blocker_id=c.participant_high and blocked_id=c.participant_low)) then
    raise exception 'Outcome unavailable' using errcode='42501';
  end if;
  if c.version<>version or c.terms_hash<>term_hash then raise exception 'Review current material' using errcode='PT409'; end if;
  if action='state' then
    if p_payload-array['action','version','termsHash'] <> '{}'::jsonb then raise exception 'Invalid outcome read' using errcode='22023'; end if;
  else
    if c.status<>'open' or c.expires_at<=now() then raise exception 'Case is closed or expired' using errcode='PT409'; end if;
    -- Lock live approval rows as well as the case: withdrawal/material revision
    -- cannot race an attestation through the current-version admission boundary.
    perform 1 from public.match_case_approvals where case_id=c.case_id and approved_version=c.version
      and approved_terms_hash=c.terms_hash and withdrawn_at is null for share;
    if (select count(distinct party_id) from public.match_case_approvals where case_id=c.case_id
      and party_id in (c.participant_low,c.participant_high) and approved_version=c.version and approved_terms_hash=c.terms_hash and withdrawn_at is null)<>2
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_low and policy_version='2026-09-05-pilot-3')
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_high and policy_version='2026-09-05-pilot-3') then
      raise exception 'Both current approvals required' using errcode='42501';
    end if;
    if jsonb_typeof(p_payload->'index') is distinct from 'number' or coalesce(p_payload->>'index','') !~ '^[0-9]{1,4}$'
      or coalesce(p_payload->>'intentId','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then
      raise exception 'Invalid outcome index or intent' using errcode='22023';
    end if;
    idx:=(p_payload->>'index')::integer; intent:=(p_payload->>'intentId')::uuid;
    d:=c.material#>array['trial','deliverables',idx::text];
    if d is null or coalesce(d->>'giver_id','') not in(c.participant_low::text,c.participant_high::text)
      or coalesce(d->>'receiver_id','') not in(c.participant_low::text,c.participant_high::text)
      or d->>'giver_id'=d->>'receiver_id' then raise exception 'Invalid participant deliverable' using errcode='22023'; end if;
    if action='submit' and actor::text<>d->>'giver_id' then raise exception 'Only giver submits' using errcode='42501'; end if;
    if action in ('check','accept','decline') and actor::text<>d->>'receiver_id' then raise exception 'Only receiver decides' using errcode='42501'; end if;
    if (action<>'submit' and p_payload ? 'evidenceUri') or (action<>'check' and p_payload ? 'scopeNotes') or (action<>'decline' and p_payload ? 'reason') then
      raise exception 'Unexpected outcome fields' using errcode='22023';
    end if;
    if action='submit' and (jsonb_typeof(p_payload->'evidenceUri') is distinct from 'string'
      or char_length(btrim(p_payload->>'evidenceUri')) not between 1 and 1000) then raise exception 'Evidence URI required' using errcode='22023'; end if;
    if action='check' and (jsonb_typeof(p_payload->'scopeNotes') is distinct from 'string'
      or char_length(btrim(p_payload->>'scopeNotes')) not between 1 and 1000) then raise exception 'Scope notes required' using errcode='22023'; end if;
    if action='decline' and coalesce(p_payload->>'reason','') not in ('not_delivered','outside_agreed_scope','below_acceptance_criteria','other') then
      raise exception 'Neutral reason required' using errcode='22023';
    end if;
    select * into prior from public.match_outcome_events where actor_id=actor and intent_id=intent;
    if found then
      if prior.case_id<>c.case_id or prior.payload<>p_payload then raise exception 'Intent already used for different content' using errcode='PT409'; end if;
    else
      select exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind='submit'),
        exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind='check') into submitted,checked;
      select kind into decision from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash
        and deliverable_index=idx and kind in ('accept','decline') order by id desc limit 1;
      if decision='accept' or (action='submit' and submitted) or (action='check' and (not submitted or checked))
        or (action='accept' and not checked) or (action='decline' and decision='decline') then
        raise exception 'Outcome transition unavailable' using errcode='PT409';
      end if;
      -- Reuse the established shared write bucket; no new rate ledger.
      perform public.synera_room_admit_write('message');
      insert into public.match_outcome_events(case_id,material_version,terms_hash,deliverable_index,actor_id,kind,intent_id,payload)
        values(c.case_id,version,term_hash,idx,actor,action,intent,p_payload);
    end if;
  end if;
  for entry in select value,ordinality-1 as n from jsonb_array_elements(c.material#>'{trial,deliverables}') with ordinality loop
    evidence:=null; notes:=null; decision:=null; reason:=null;
    select payload->>'evidenceUri' into evidence from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind='submit' order by id desc limit 1;
    select payload->>'scopeNotes' into notes from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind='check' order by id desc limit 1;
    select kind,payload->>'reason' into decision,reason from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind in('accept','decline') order by id desc limit 1;
    all_confirmed:=all_confirmed and coalesce(decision='accept',false);
    rows:=rows||jsonb_build_array(jsonb_build_object('index',entry.n,'giver_id',entry.value->>'giver_id','receiver_id',entry.value->>'receiver_id',
      'target',entry.value->>'target','acceptance_criteria',entry.value->>'acceptance_criteria',
      'phase',case when decision='accept' then 'accepted' when decision='decline' then 'declined_dispute_open' when notes is not null then 'checked_with_scope' when evidence is not null then 'evidence_supplied' else 'pending' end,
      'evidence_uri',evidence,'scope_notes',notes,'reason',reason));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'index',deliverable_index,'kind',kind,'actor_id',actor_id,'created_at',created_at,'payload',payload) order by id),'[]'::jsonb)
    into history from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash;
  return jsonb_build_object('schema','synera.case-outcome.v1','case_id',c.case_id,'version',version,'terms_hash',term_hash,
    'deliverables',rows,'events',history,'outcome_confirmed',all_confirmed and jsonb_array_length(rows)>0,
    'proof_scope','participant_attestation','server_now',now());
end $$;
revoke all on function public.synera_case_outcome(text,jsonb) from public,authenticated;
grant execute on function public.synera_case_outcome(text,jsonb) to authenticated;
else raise exception 'Partial or unexpected migration: case-outcome.migration.sql';
end if;
END $kit$;

-- meeting-address-agreement.migration.sql sha256=d13733d295535d041f238fff0eb06b53952bdac530c5e3fbd4770eb7ca6f047a
DO $kit$ BEGIN
if (coalesce((to_regclass('public.meeting_address_events') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='actor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='kind')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='proposal_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='address')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_snapshot')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='payload')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='created_at')),false) and coalesce((to_regclass('public.meeting_address_proposals') is not null),false) and coalesce((to_regclass('public.meeting_address_decisions') is not null),false) and coalesce((to_regclass('public.meeting_address_history') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb') is not null),false)) then
raise notice 'Already complete: meeting-address-agreement.migration.sql';
elsif (not coalesce((to_regclass('public.meeting_address_events') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_version')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='terms_hash')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='actor_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='kind')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='proposal_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='intent_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='address')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_snapshot')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='payload')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='created_at')),false) and not coalesce((to_regclass('public.meeting_address_proposals') is not null),false) and not coalesce((to_regclass('public.meeting_address_decisions') is not null),false) and not coalesce((to_regclass('public.meeting_address_history') is not null),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb') is not null),false)) then
do $$ begin
  if to_regclass('public.meeting_location_grants') is null
    or to_regprocedure('public.synera_room_current_member(uuid)') is null then
    raise exception 'Apply meeting-location and group-room proposals first';
  end if;
  if to_regclass('public.meeting_address_events') is not null then raise exception 'Inspect existing address agreement schema'; end if;
end $$;
revoke update (meeting_address) on public.meeting_requests from public,authenticated;
do $$ begin
  if has_column_privilege('authenticated','public.meeting_requests','meeting_address','UPDATE') then
    raise exception 'Inspect inherited or table-wide address UPDATE grants';
  end if;
end $$;
create table public.meeting_address_events (
  id bigint generated always as identity primary key,
  meeting_id uuid not null references public.meeting_requests(id) on delete cascade,
  case_id text not null references public.match_cases(case_id) on delete cascade,
  case_version integer not null check(case_version>=1),
  terms_hash text not null check(terms_hash~'^[a-f0-9]{64}$'),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check(kind in('propose','accept','decline')),
  proposal_id uuid not null,
  intent_id uuid not null,
  address text check(char_length(btrim(address)) between 1 and 200),
  meeting_snapshot jsonb not null,
  payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=2048),
  created_at timestamptz not null default now(),
  unique(actor_id,intent_id),
  check((kind='propose' and address is not null and proposal_id=intent_id) or (kind<>'propose' and address is null))
);
create unique index meeting_address_proposals on public.meeting_address_events(proposal_id) where kind='propose';
create unique index meeting_address_decisions on public.meeting_address_events(proposal_id) where kind<>'propose';
create index meeting_address_history on public.meeting_address_events(meeting_id,id);
alter table public.meeting_address_events enable row level security;
revoke all on public.meeting_address_events from public,authenticated;
revoke all on sequence public.meeting_address_events_id_seq from public,authenticated;
create function public.synera_meeting_address(p_meeting_id uuid,p_case_id text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=public.synera_user_id(); c public.match_cases; m public.meeting_requests;
  proposal public.meeting_address_events; prior public.meeting_address_events;
  action text; version integer; term_hash text; intent uuid; selected uuid;
  snapshot jsonb; decision text; history jsonb; current_proposal boolean; agreed boolean;
begin
  if actor is null or public.synera_pilot_member() is not true then raise exception 'Address unavailable' using errcode='42501'; end if;
  if p_meeting_id is null or p_case_id is null or p_case_id!~'^[A-Za-z0-9_:-]{1,64}$'
    or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>2048
    or p_payload-array['action','version','termsHash','intentId','proposalId','address','consent']<>'{}'::jsonb
    or jsonb_typeof(p_payload->'version') is distinct from 'number'
    or coalesce(p_payload->>'version','')!~'^[1-9][0-9]{0,8}$'
    or coalesce(p_payload->>'termsHash','')!~'^[a-f0-9]{64}$' then
    raise exception 'Invalid address request' using errcode='22023';
  end if;
  action:=p_payload->>'action';version:=(p_payload->>'version')::integer;term_hash:=p_payload->>'termsHash';
  if action is null or action not in('state','propose','accept','decline') then raise exception 'Invalid address action' using errcode='22023'; end if;
  -- Same case-before-meeting order for every address decision/revision.
  select * into c from public.match_cases where case_id=p_case_id for update;
  if not found or actor not in(c.participant_low,c.participant_high) then raise exception 'Address unavailable' using errcode='42501'; end if;
  select * into m from public.meeting_requests where id=p_meeting_id for update;
  if not found or least(m.sender_id,m.recipient_id)<>c.participant_low or greatest(m.sender_id,m.recipient_id)<>c.participant_high
    or public.synera_room_pair_blocked(c.participant_low,c.participant_high)
    or not public.synera_room_current_member(c.participant_low) or not public.synera_room_current_member(c.participant_high) then
    raise exception 'Address unavailable' using errcode='42501';
  end if;
  if c.version<>version or c.terms_hash<>term_hash then raise exception 'Review current material' using errcode='PT409'; end if;
  snapshot:=jsonb_build_object('proposed_at',m.proposed_at,'duration_minutes',m.duration_minutes,'meeting_place',m.meeting_place,'meeting_address',m.meeting_address);
  select * into proposal from public.meeting_address_events where meeting_id=m.id and kind='propose' order by id desc limit 1;
  select kind into decision from public.meeting_address_events where proposal_id=proposal.proposal_id and kind<>'propose';
  current_proposal:=coalesce(proposal.case_id=c.case_id and proposal.case_version=c.version and proposal.terms_hash=c.terms_hash
    and proposal.meeting_snapshot-'meeting_address'=snapshot-'meeting_address'
    and (proposal.meeting_snapshot->>'meeting_address'=m.meeting_address or (decision='accept' and proposal.address=m.meeting_address)),false);
  if action='state' then
    if p_payload-array['action','version','termsHash']<>'{}'::jsonb then raise exception 'Invalid address read' using errcode='22023'; end if;
  else
    if c.status<>'open' or c.expires_at<=now() or m.status<>'accepted' or m.proposed_at is null or m.proposed_at<=now()
      or m.duration_minutes is null or m.meeting_place is null or lower(btrim(m.meeting_place)) in('online','онлайн') or btrim(m.meeting_place)='' then
      raise exception 'Meeting no longer eligible' using errcode='PT409';
    end if;
    -- Withdrawal and consent removal cannot pass while these rows are locked.
    perform 1 from public.match_case_approvals where case_id=c.case_id and approved_version=c.version
      and approved_terms_hash=c.terms_hash and withdrawn_at is null order by party_id for share;
    perform 1 from public.pilot_consents where user_id in(c.participant_low,c.participant_high) order by user_id for share;
    if not public.synera_location_case_current(c.case_id,c.version,c.terms_hash)
      or not public.synera_room_current_member(c.participant_low) or not public.synera_room_current_member(c.participant_high) then
      raise exception 'Both current approvals required' using errcode='42501';
    end if;
    if coalesce(p_payload->>'intentId','')!~'^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'
      or not p_payload ? 'proposalId'
      or (p_payload->'proposalId'<>'null'::jsonb and coalesce(p_payload->>'proposalId','')!~'^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$') then
      raise exception 'Invalid address intent or proposal' using errcode='22023';
    end if;
    intent:=(p_payload->>'intentId')::uuid;selected:=(p_payload->>'proposalId')::uuid;
    if action='propose' then
      if jsonb_typeof(p_payload->'address') is distinct from 'string' or char_length(btrim(p_payload->>'address')) not between 1 and 200
        or p_payload->'consent' is distinct from 'true'::jsonb then raise exception 'Explicit address proposal required' using errcode='22023'; end if;
    elsif p_payload ? 'address' or (action='accept' and p_payload->'consent' is distinct from 'true'::jsonb)
      or (action='decline' and p_payload ? 'consent') then raise exception 'Explicit address decision required' using errcode='22023';
    end if;
    select * into prior from public.meeting_address_events where actor_id=actor and intent_id=intent;
    if found then
      if prior.meeting_id<>m.id or prior.case_id<>c.case_id or prior.payload<>p_payload
        or prior.proposal_id is distinct from proposal.proposal_id or not current_proposal then
        raise exception 'Intent or proposal superseded' using errcode='PT409';
      end if;
    else
      if selected is distinct from proposal.proposal_id then raise exception 'Review latest address proposal' using errcode='PT409'; end if;
      if action<>'propose' then
        if proposal.id is null or not current_proposal or decision is not null then raise exception 'Proposal unavailable' using errcode='PT409'; end if;
        if actor=proposal.actor_id then raise exception 'Only the other participant decides' using errcode='42501'; end if;
      end if;
      perform public.synera_room_admit_write('message');
      insert into public.meeting_address_events(meeting_id,case_id,case_version,terms_hash,actor_id,kind,proposal_id,intent_id,address,meeting_snapshot,payload)
      values(m.id,c.case_id,version,term_hash,actor,action,case when action='propose' then intent else selected end,intent,
        case when action='propose' then btrim(p_payload->>'address') end,case when action='propose' then snapshot else proposal.meeting_snapshot end,p_payload);
      if action='accept' then
        -- The existing AFTER UPDATE trigger revokes both old GPS grants atomically.
        update public.meeting_requests set meeting_address=proposal.address where id=m.id;
        m.meeting_address:=proposal.address;
      end if;
    end if;
  end if;
  select * into proposal from public.meeting_address_events where meeting_id=m.id and kind='propose' order by id desc limit 1;
  select kind into decision from public.meeting_address_events where proposal_id=proposal.proposal_id and kind<>'propose';
  snapshot:=jsonb_build_object('proposed_at',m.proposed_at,'duration_minutes',m.duration_minutes,'meeting_place',m.meeting_place,'meeting_address',m.meeting_address);
  current_proposal:=coalesce(proposal.case_id=c.case_id and proposal.case_version=c.version and proposal.terms_hash=c.terms_hash
    and proposal.meeting_snapshot-'meeting_address'=snapshot-'meeting_address'
    and (proposal.meeting_snapshot->>'meeting_address'=m.meeting_address or (decision='accept' and proposal.address=m.meeting_address)),false);
  agreed:=current_proposal and decision='accept' and m.status='accepted' and c.status='open' and c.expires_at>now()
    and public.synera_location_case_current(c.case_id,c.version,c.terms_hash);
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'case_id',case_id,'version',case_version,'terms_hash',terms_hash,
    'actor_id',actor_id,'kind',kind,'proposal_id',proposal_id,'address',address,'created_at',created_at) order by id),'[]'::jsonb)
    into history from public.meeting_address_events where meeting_id=m.id;
  return jsonb_build_object('schema','synera.meeting-address.v1','meeting_id',m.id,'case_id',c.case_id,'version',version,'terms_hash',term_hash,
    'meeting',snapshot||jsonb_build_object('status',m.status),'proposal',case when proposal.id is not null then jsonb_build_object(
      'proposal_id',proposal.proposal_id,'proposer_id',proposal.actor_id,'address',proposal.address,'current',current_proposal,
      'decision',decision) else null end,'agreed',coalesce(agreed,false),'events',history,'server_now',now());
end $$;
revoke all on function public.synera_meeting_address(uuid,text,jsonb) from public,authenticated;
grant execute on function public.synera_meeting_address(uuid,text,jsonb) to authenticated;
else raise exception 'Partial or unexpected migration: meeting-address-agreement.migration.sql';
end if;
END $kit$;

-- message-intent.migration.sql sha256=8a83a008ceff1ef009c4081f32480bd20b2948e6c14c4e84d6d3eed1bb7a647e
DO $kit$ BEGIN
if (coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text') is not null),false)) then
raise notice 'Already complete: message-intent.migration.sql';
elsif (not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text') is not null),false)) then
do $$ begin
  if to_regclass('public.meeting_messages') is null or to_regprocedure('public.synera_pilot_member()') is null then raise exception 'Base pilot required'; end if;
  if to_regprocedure('public.synera_send_message(uuid,uuid,text)') is not null then raise exception 'Inspect existing message intent function'; end if;
end $$;
grant insert (id) on public.meeting_messages to authenticated;
create function public.synera_send_message(p_meeting_id uuid, p_intent_id uuid, p_body text)
returns jsonb language plpgsql security invoker set search_path = '' set lock_timeout = '5s' as $$
declare actor uuid := public.synera_user_id(); prior public.meeting_messages%rowtype;
begin
  if actor is null or not public.synera_pilot_member() then raise exception sqlstate 'PT403' using message = 'Message unavailable'; end if;
  if p_intent_id is null or p_meeting_id is null or p_body is null or char_length(btrim(p_body)) not between 1 and 1000 or p_body <> btrim(p_body) then raise exception sqlstate 'PT400' using message = 'Invalid message'; end if;
  if not exists (select 1 from public.meeting_requests m where m.id=p_meeting_id and m.status='accepted' and actor in (m.sender_id,m.recipient_id)
    and not exists(select 1 from public.profile_blocks b where (b.blocker_id=m.sender_id and b.blocked_id=m.recipient_id) or (b.blocked_id=m.sender_id and b.blocker_id=m.recipient_id))) then
    raise exception sqlstate 'PT403' using message = 'Message unavailable';
  end if;
  -- Database transaction lock, not a process-local deduplicator. Shared by overlapping retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_intent_id::text,0));
  select * into prior from public.meeting_messages where id=p_intent_id;
  if found then
    if prior.sender_id <> actor or prior.meeting_id <> p_meeting_id or prior.body <> p_body then raise exception sqlstate 'PT409' using message = 'Message intent conflict'; end if;
    return pg_catalog.to_jsonb(prior);
  end if;
  insert into public.meeting_messages(id,meeting_id,sender_id,body) values(p_intent_id,p_meeting_id,actor,p_body) returning * into prior;
  return pg_catalog.to_jsonb(prior);
end $$;
revoke all on function public.synera_send_message(uuid,uuid,text) from public,authenticated;
grant execute on function public.synera_send_message(uuid,uuid,text) to authenticated;
else raise exception 'Partial or unexpected migration: message-intent.migration.sql';
end if;
END $kit$;

-- profile-erasure.migration.sql sha256=2b7e6012ea3c2306f768c102d76ff47a751eeb2fc9393fa544a1ea52c81e61dd
DO $kit$ BEGIN
if (coalesce((to_regclass('public.profile_erasures') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='erased_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='provider_deletion')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_statement_lock' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_statement_lock' and not tgisinternal)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_guard' and not tgisinternal)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false)) then
raise notice 'Already complete: profile-erasure.migration.sql';
elsif (not coalesce((to_regclass('public.profile_erasures') is not null),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='user_id')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='erased_at')),false) and not coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='provider_deletion')),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_statement_lock' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_statement_lock' and not tgisinternal)),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and not coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_guard' and not tgisinternal)),false) and not coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false)) then
do $$ begin
  if to_regprocedure('public.synera_pilot_member()') is null
    or to_regclass('public.group_rooms') is null or to_regclass('public.meeting_address_events') is null
    or to_regclass('public.match_outcome_events') is null then
    raise exception 'Apply the complete reviewed Neon journey stack first';
  end if;
  if to_regclass('public.profile_erasures') is not null then raise exception 'Inspect existing erasure migration'; end if;
end $$;
create table public.profile_erasures (
  user_id uuid primary key,
  erased_at timestamptz not null default now(),
  provider_deletion text not null default 'pending' check(provider_deletion = 'pending')
);
alter table public.profile_erasures enable row level security;
revoke all on public.profile_erasures from public, authenticated;
create or replace function public.synera_pilot_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from neon_auth."user" u join public.synera_pilot_members m on m.email=lower(u.email)
    where u.id=(select public.synera_user_id()) and u."emailVerified"=true
      and not exists(select 1 from public.profile_erasures e where e.user_id=u.id)
  );
$$;
revoke all on function public.synera_pilot_member() from public;
grant execute on function public.synera_pilot_member() to authenticated;
create function public.synera_profile_erasure_statement_lock() returns trigger
language plpgsql security invoker set search_path='' as $$
declare actor uuid:=public.synera_user_id();
begin
  if actor is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,17017));
  end if;
  return null;
end $$;
revoke all on function public.synera_profile_erasure_statement_lock() from public,authenticated;
create trigger profile_erasure_statement_lock before insert or update on public.profiles
for each statement execute function public.synera_profile_erasure_statement_lock();
create function public.synera_profile_erasure_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from public.profile_erasures where user_id=new.id) then
    raise exception 'Profile deactivated' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function public.synera_profile_erasure_guard() from public,authenticated;
create trigger profile_erasure_guard before insert or update on public.profiles
for each row execute function public.synera_profile_erasure_guard();
create function public.synera_erase_profile_data() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare actor uuid:=public.synera_user_id(); repeated boolean;
begin
  if actor is null then raise exception 'Erasure unavailable' using errcode='42501'; end if;
  -- Match authenticated INSERT, UPSERT and UPDATE: caller admission lock BEFORE row lock.
  -- This also serializes insertion of a missing profile; an absent tuple cannot provide a row lock.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,17017));
  perform 1 from public.profiles where id=actor for update;
  repeated:=exists(select 1 from public.profile_erasures where user_id=actor);
  if not repeated then
    if public.synera_pilot_member() is not true then raise exception 'Erasure unavailable' using errcode='42501'; end if;
    -- Retain the UUID row required by group-room RESTRICT FKs. Remove every actual profile field.
    update public.profiles set display_name='Deleted profile',city='',offers='',seeks='',
      is_discoverable=false,map_visible=false,brief=default where id=actor;
    -- Copied display names are presentation data, not immutable agreement material/hashes.
    update public.meeting_requests set sender_name='Deleted profile' where sender_id=actor;
    update public.meeting_requests set recipient_name='Deleted profile' where recipient_id=actor;
    -- Revoke BOTH directions of live location, while preserving consent/meeting evidence.
    update public.meeting_location_grants set status='revoked',revoked_at=coalesce(revoked_at,now())
      where (grantor_id=actor or recipient_id=actor) and status='active';
    -- Withdraw the existing email admission instead of retaining email in the tombstone.
    -- A future provider sub for the same verified email must require fresh operator admission.
    delete from public.synera_pilot_members m using neon_auth."user" u
      where u.id=actor and m.email=lower(u.email);
    -- Shared room transcripts/events, bilateral terms/approvals/outcomes, reports, messages,
    -- agreed addresses and provider Auth are retained. They can still contain identifying text.
    -- Other parties keep the existing evidence/access contract; erased actor loses eligibility.
    insert into public.profile_erasures(user_id) values(actor);
  end if;
  return jsonb_build_object('status','application_data_erased','providerDeletion','pending',
    'retainedScope','bilateral_records_and_safety_evidence','repeated',repeated);
end $$;
revoke all on function public.synera_erase_profile_data() from public,authenticated;
grant execute on function public.synera_erase_profile_data() to authenticated;
do $$ declare r text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      execute format('revoke all on public.profile_erasures from %I',r);
      execute format('revoke all on function public.synera_profile_erasure_statement_lock(),public.synera_profile_erasure_guard(),public.synera_erase_profile_data() from %I',r);
    end if;
  end loop;
end $$;
create or replace function public.synera_case_outcome(p_case_id text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=public.synera_user_id(); c public.match_cases; prior public.match_outcome_events;
  action text; version integer; term_hash text; idx integer; intent uuid; d jsonb;
  submitted boolean; checked boolean; decision text; evidence text; notes text; reason text;
  entry record; rows jsonb:='[]'::jsonb; history jsonb; all_confirmed boolean:=true;
begin
  if actor is null or public.synera_pilot_member() is not true
    or not exists(select 1 from public.pilot_consents where user_id=actor and policy_version='2026-09-05-pilot-3') then
    raise exception 'Outcome unavailable' using errcode='42501';
  end if;
  if p_case_id is null or p_case_id !~ '^[A-Za-z0-9_:-]{1,64}$'
    or jsonb_typeof(p_payload) is distinct from 'object'
    or octet_length(p_payload::text)>4096
    or p_payload-array['action','version','termsHash','index','intentId','evidenceUri','scopeNotes','reason'] <> '{}'::jsonb
    or jsonb_typeof(p_payload->'version') is distinct from 'number'
    or coalesce(p_payload->>'version','') !~ '^[1-9][0-9]{0,8}$'
    or coalesce(p_payload->>'termsHash','') !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid outcome request' using errcode='22023';
  end if;
  action:=p_payload->>'action'; version:=(p_payload->>'version')::integer; term_hash:=p_payload->>'termsHash';
  if action is null or action not in ('state','submit','check','accept','decline') then raise exception 'Invalid outcome action' using errcode='22023'; end if;
  select * into c from public.match_cases where case_id=p_case_id for update;
  if not found or actor not in (c.participant_low,c.participant_high)
    or exists(select 1 from public.profile_blocks where (blocker_id=c.participant_low and blocked_id=c.participant_high)
      or (blocker_id=c.participant_high and blocked_id=c.participant_low)) then
    raise exception 'Outcome unavailable' using errcode='42501';
  end if;
  -- Hold the actor profile through the whole RPC: erasure must serialize with this operation.
  -- Recheck AFTER waits. A membership check before a case lock cannot fence a delayed request.
  perform 1 from public.profiles where id=actor for share;
  if not found or public.synera_pilot_member() is not true then
    raise exception 'Outcome unavailable' using errcode='42501';
  end if;
  if c.version<>version or c.terms_hash<>term_hash then raise exception 'Review current material' using errcode='PT409'; end if;
  if action='state' then
    if p_payload-array['action','version','termsHash'] <> '{}'::jsonb then raise exception 'Invalid outcome read' using errcode='22023'; end if;
  else
    if c.status<>'open' or c.expires_at<=now() then raise exception 'Case is closed or expired' using errcode='PT409'; end if;
    -- Lock live approval rows as well as the case: withdrawal/material revision
    -- cannot race an attestation through the current-version admission boundary.
    perform 1 from public.match_case_approvals where case_id=c.case_id and approved_version=c.version
      and approved_terms_hash=c.terms_hash and withdrawn_at is null for share;
    if (select count(distinct party_id) from public.match_case_approvals where case_id=c.case_id
      and party_id in (c.participant_low,c.participant_high) and approved_version=c.version and approved_terms_hash=c.terms_hash and withdrawn_at is null)<>2
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_low and policy_version='2026-09-05-pilot-3')
      or not exists(select 1 from public.pilot_consents where user_id=c.participant_high and policy_version='2026-09-05-pilot-3') then
      raise exception 'Both current approvals required' using errcode='42501';
    end if;
    if jsonb_typeof(p_payload->'index') is distinct from 'number' or coalesce(p_payload->>'index','') !~ '^[0-9]{1,4}$'
      or coalesce(p_payload->>'intentId','') !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$' then
      raise exception 'Invalid outcome index or intent' using errcode='22023';
    end if;
    idx:=(p_payload->>'index')::integer; intent:=(p_payload->>'intentId')::uuid;
    d:=c.material#>array['trial','deliverables',idx::text];
    if d is null or coalesce(d->>'giver_id','') not in(c.participant_low::text,c.participant_high::text)
      or coalesce(d->>'receiver_id','') not in(c.participant_low::text,c.participant_high::text)
      or d->>'giver_id'=d->>'receiver_id' then raise exception 'Invalid participant deliverable' using errcode='22023'; end if;
    if action='submit' and actor::text<>d->>'giver_id' then raise exception 'Only giver submits' using errcode='42501'; end if;
    if action in ('check','accept','decline') and actor::text<>d->>'receiver_id' then raise exception 'Only receiver decides' using errcode='42501'; end if;
    if (action<>'submit' and p_payload ? 'evidenceUri') or (action<>'check' and p_payload ? 'scopeNotes') or (action<>'decline' and p_payload ? 'reason') then
      raise exception 'Unexpected outcome fields' using errcode='22023';
    end if;
    if action='submit' and (jsonb_typeof(p_payload->'evidenceUri') is distinct from 'string'
      or char_length(btrim(p_payload->>'evidenceUri')) not between 1 and 1000) then raise exception 'Evidence URI required' using errcode='22023'; end if;
    if action='check' and (jsonb_typeof(p_payload->'scopeNotes') is distinct from 'string'
      or char_length(btrim(p_payload->>'scopeNotes')) not between 1 and 1000) then raise exception 'Scope notes required' using errcode='22023'; end if;
    if action='decline' and coalesce(p_payload->>'reason','') not in ('not_delivered','outside_agreed_scope','below_acceptance_criteria','other') then
      raise exception 'Neutral reason required' using errcode='22023';
    end if;
    select * into prior from public.match_outcome_events where actor_id=actor and intent_id=intent;
    if found then
      if prior.case_id<>c.case_id or prior.payload<>p_payload then raise exception 'Intent already used for different content' using errcode='PT409'; end if;
    else
      select exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind='submit'),
        exists(select 1 from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=idx and kind='check') into submitted,checked;
      select kind into decision from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash
        and deliverable_index=idx and kind in ('accept','decline') order by id desc limit 1;
      if decision='accept' or (action='submit' and submitted) or (action='check' and (not submitted or checked))
        or (action='accept' and not checked) or (action='decline' and decision='decline') then
        raise exception 'Outcome transition unavailable' using errcode='PT409';
      end if;
      -- Reuse the established shared write bucket; no new rate ledger.
      perform public.synera_room_admit_write('message');
      insert into public.match_outcome_events(case_id,material_version,terms_hash,deliverable_index,actor_id,kind,intent_id,payload)
        values(c.case_id,version,term_hash,idx,actor,action,intent,p_payload);
    end if;
  end if;
  for entry in select value,ordinality-1 as n from jsonb_array_elements(c.material#>'{trial,deliverables}') with ordinality loop
    evidence:=null; notes:=null; decision:=null; reason:=null;
    select payload->>'evidenceUri' into evidence from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind='submit' order by id desc limit 1;
    select payload->>'scopeNotes' into notes from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind='check' order by id desc limit 1;
    select kind,payload->>'reason' into decision,reason from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash and deliverable_index=entry.n and kind in('accept','decline') order by id desc limit 1;
    all_confirmed:=all_confirmed and coalesce(decision='accept',false);
    rows:=rows||jsonb_build_array(jsonb_build_object('index',entry.n,'giver_id',entry.value->>'giver_id','receiver_id',entry.value->>'receiver_id',
      'target',entry.value->>'target','acceptance_criteria',entry.value->>'acceptance_criteria',
      'phase',case when decision='accept' then 'accepted' when decision='decline' then 'declined_dispute_open' when notes is not null then 'checked_with_scope' when evidence is not null then 'evidence_supplied' else 'pending' end,
      'evidence_uri',evidence,'scope_notes',notes,'reason',reason));
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'index',deliverable_index,'kind',kind,'actor_id',actor_id,'created_at',created_at,'payload',payload) order by id),'[]'::jsonb)
    into history from public.match_outcome_events where case_id=c.case_id and material_version=version and terms_hash=term_hash;
  return jsonb_build_object('schema','synera.case-outcome.v1','case_id',c.case_id,'version',version,'terms_hash',term_hash,
    'deliverables',rows,'events',history,'outcome_confirmed',all_confirmed and jsonb_array_length(rows)>0,
    'proof_scope','participant_attestation','server_now',now());
end $$;
else raise exception 'Partial or unexpected migration: profile-erasure.migration.sql';
end if;
END $kit$;

-- Compare parsed RLS definitions using transaction-local probes; remove every probe before commit.
CREATE POLICY __kit_policy_d61adac5b7c0487a on public.profiles for select to authenticated
  using ((select public.synera_user_id()) = id or is_discoverable);
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='profiles_read' and b.polname='__kit_policy_d61adac5b7c0487a' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.profiles_read'; end if;
END $kit$;
DROP POLICY __kit_policy_d61adac5b7c0487a ON public.profiles;
CREATE POLICY __kit_policy_2e17b0360ae4a90f on public.profiles for insert to authenticated
  with check ((select public.synera_user_id()) = id);
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='profiles_create' and b.polname='__kit_policy_2e17b0360ae4a90f' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.profiles_create'; end if;
END $kit$;
DROP POLICY __kit_policy_2e17b0360ae4a90f ON public.profiles;
CREATE POLICY __kit_policy_1b7bbb4c49d0db50 on public.profiles for update to authenticated
  using ((select public.synera_user_id()) = id) with check ((select public.synera_user_id()) = id);
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='profiles_update' and b.polname='__kit_policy_1b7bbb4c49d0db50' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.profiles_update'; end if;
END $kit$;
DROP POLICY __kit_policy_1b7bbb4c49d0db50 ON public.profiles;
CREATE POLICY __kit_policy_44ceae53c95e7cea on public.profiles for delete to authenticated
  using ((select public.synera_user_id()) = id);
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='profiles_delete' and b.polname='__kit_policy_44ceae53c95e7cea' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.profiles_delete'; end if;
END $kit$;
DROP POLICY __kit_policy_44ceae53c95e7cea ON public.profiles;
CREATE POLICY __kit_policy_eb99cc103de1e0f0 on public.meeting_requests for select to authenticated
  using ((select public.synera_user_id()) in (sender_id, recipient_id));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_read' and b.polname='__kit_policy_eb99cc103de1e0f0' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_read'; end if;
END $kit$;
DROP POLICY __kit_policy_eb99cc103de1e0f0 ON public.meeting_requests;
CREATE POLICY __kit_policy_fbe92c725b35aae5 on public.meeting_requests for insert to authenticated
  with check ((select public.synera_user_id()) = sender_id and status = 'pending'
    and exists (select 1 from public.profiles p where p.id = recipient_id and p.is_discoverable));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_create' and b.polname='__kit_policy_fbe92c725b35aae5' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_create'; end if;
END $kit$;
DROP POLICY __kit_policy_fbe92c725b35aae5 ON public.meeting_requests;
CREATE POLICY __kit_policy_dfc6efce800d8991 on public.meeting_requests for update to authenticated
  using ((select public.synera_user_id()) = recipient_id and status = 'pending')
  with check ((select public.synera_user_id()) = recipient_id and status in ('accepted', 'declined'));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_respond' and b.polname='__kit_policy_dfc6efce800d8991' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_respond'; end if;
END $kit$;
DROP POLICY __kit_policy_dfc6efce800d8991 ON public.meeting_requests;
CREATE POLICY __kit_policy_62c1bb0891a73fa2 on public.pilot_consents for select to authenticated using (user_id = (select public.synera_user_id()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.pilot_consents') and a.polname='consent_read' and b.polname='__kit_policy_62c1bb0891a73fa2' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.pilot_consents.consent_read'; end if;
END $kit$;
DROP POLICY __kit_policy_62c1bb0891a73fa2 ON public.pilot_consents;
CREATE POLICY __kit_policy_a8071bc75a82af26 on public.pilot_consents for insert to authenticated with check (user_id = (select public.synera_user_id()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.pilot_consents') and a.polname='consent_create' and b.polname='__kit_policy_a8071bc75a82af26' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.pilot_consents.consent_create'; end if;
END $kit$;
DROP POLICY __kit_policy_a8071bc75a82af26 ON public.pilot_consents;
CREATE POLICY __kit_policy_c43d35757c19a351 on public.profiles as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='profiles_consent' and b.polname='__kit_policy_c43d35757c19a351' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.profiles_consent'; end if;
END $kit$;
DROP POLICY __kit_policy_c43d35757c19a351 ON public.profiles;
CREATE POLICY __kit_policy_9976be50d65eb91a on public.meeting_requests as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_consent' and b.polname='__kit_policy_9976be50d65eb91a' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_consent'; end if;
END $kit$;
DROP POLICY __kit_policy_9976be50d65eb91a ON public.meeting_requests;
CREATE POLICY __kit_policy_c1dfd7ea247b21cc on public.profile_blocks for select to authenticated using ((select public.synera_user_id()) in (blocker_id, blocked_id));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_blocks') and a.polname='blocks_read' and b.polname='__kit_policy_c1dfd7ea247b21cc' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_blocks.blocks_read'; end if;
END $kit$;
DROP POLICY __kit_policy_c1dfd7ea247b21cc ON public.profile_blocks;
CREATE POLICY __kit_policy_a9d6e84c2b98ec24 on public.profile_blocks for insert to authenticated with check (blocker_id = (select public.synera_user_id()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_blocks') and a.polname='blocks_create' and b.polname='__kit_policy_a9d6e84c2b98ec24' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_blocks.blocks_create'; end if;
END $kit$;
DROP POLICY __kit_policy_a9d6e84c2b98ec24 ON public.profile_blocks;
CREATE POLICY __kit_policy_975e85a1f8ab749e on public.profile_blocks for delete to authenticated using (blocker_id = (select public.synera_user_id()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_blocks') and a.polname='blocks_delete' and b.polname='__kit_policy_975e85a1f8ab749e' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_blocks.blocks_delete'; end if;
END $kit$;
DROP POLICY __kit_policy_975e85a1f8ab749e ON public.profile_blocks;
CREATE POLICY __kit_policy_b99219bf7316de26 on public.profiles as restrictive for select to authenticated using (
  not exists (select 1 from public.profile_blocks b where (b.blocker_id = (select public.synera_user_id()) and b.blocked_id = profiles.id) or (b.blocked_id = (select public.synera_user_id()) and b.blocker_id = profiles.id)));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='profiles_unblocked' and b.polname='__kit_policy_b99219bf7316de26' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.profiles_unblocked'; end if;
END $kit$;
DROP POLICY __kit_policy_b99219bf7316de26 ON public.profiles;
CREATE POLICY __kit_policy_f65cfdd80fdfaa6b on public.meeting_requests as restrictive for insert to authenticated
with check (proposed_at > now() and proposed_at <= now() + interval '90 days' and duration_minutes is not null and meeting_place is not null
  and not exists (select 1 from public.profile_blocks b where (b.blocker_id = sender_id and b.blocked_id = recipient_id) or (b.blocked_id = sender_id and b.blocker_id = recipient_id)));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_plan' and b.polname='__kit_policy_f65cfdd80fdfaa6b' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_plan'; end if;
END $kit$;
DROP POLICY __kit_policy_f65cfdd80fdfaa6b ON public.meeting_requests;
CREATE POLICY __kit_policy_922906c11c97eca3 on public.meeting_requests for update to authenticated using ((select public.synera_user_id()) = sender_id and status in ('pending','accepted'))
with check ((select public.synera_user_id()) = sender_id and status = 'cancelled');
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_cancel' and b.polname='__kit_policy_922906c11c97eca3' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_cancel'; end if;
END $kit$;
DROP POLICY __kit_policy_922906c11c97eca3 ON public.meeting_requests;
CREATE POLICY __kit_policy_273aa74b46ead1e0 on public.meeting_requests as restrictive for update to authenticated
using (true) with check (status <> 'accepted' or (proposed_at > now()
  and not exists (select 1 from public.profile_blocks b where (b.blocker_id = sender_id and b.blocked_id = recipient_id) or (b.blocked_id = sender_id and b.blocker_id = recipient_id))));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_response_unblocked' and b.polname='__kit_policy_273aa74b46ead1e0' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_response_unblocked'; end if;
END $kit$;
DROP POLICY __kit_policy_273aa74b46ead1e0 ON public.meeting_requests;
CREATE POLICY __kit_policy_d28e56a5e1753dbc on public.meeting_messages for select to authenticated using (
  exists (select 1 from public.meeting_requests m where m.id = meeting_id and (select public.synera_user_id()) in (m.sender_id,m.recipient_id)));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_messages') and a.polname='messages_read' and b.polname='__kit_policy_d28e56a5e1753dbc' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_messages.messages_read'; end if;
END $kit$;
DROP POLICY __kit_policy_d28e56a5e1753dbc ON public.meeting_messages;
CREATE POLICY __kit_policy_e5917e60a944e95e on public.meeting_messages for insert to authenticated with check (sender_id = (select public.synera_user_id()) and
  exists (select 1 from public.meeting_requests m where m.id = meeting_id and m.status = 'accepted' and (select public.synera_user_id()) in (m.sender_id,m.recipient_id)
    and not exists (select 1 from public.profile_blocks b where (b.blocker_id = m.sender_id and b.blocked_id = m.recipient_id) or (b.blocked_id = m.sender_id and b.blocker_id = m.recipient_id))));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_messages') and a.polname='messages_create' and b.polname='__kit_policy_e5917e60a944e95e' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_messages.messages_create'; end if;
END $kit$;
DROP POLICY __kit_policy_e5917e60a944e95e ON public.meeting_messages;
CREATE POLICY __kit_policy_8670fa32388fbbd9 on public.profile_reports for select to authenticated using (reporter_id = (select public.synera_user_id()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_reports') and a.polname='reports_read' and b.polname='__kit_policy_8670fa32388fbbd9' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_reports.reports_read'; end if;
END $kit$;
DROP POLICY __kit_policy_8670fa32388fbbd9 ON public.profile_reports;
CREATE POLICY __kit_policy_482d0403844e2d68 on public.profile_reports for insert to authenticated with check (reporter_id = (select public.synera_user_id())
  and exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_reports') and a.polname='reports_create' and b.polname='__kit_policy_482d0403844e2d68' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_reports.reports_create'; end if;
END $kit$;
DROP POLICY __kit_policy_482d0403844e2d68 ON public.profile_reports;
CREATE POLICY __kit_policy_9b7878411f9a479e on public.profiles as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profiles') and a.polname='synera_members_only' and b.polname='__kit_policy_9b7878411f9a479e' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profiles.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_9b7878411f9a479e ON public.profiles;
CREATE POLICY __kit_policy_d986985730a94381 on public.pilot_consents as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.pilot_consents') and a.polname='synera_members_only' and b.polname='__kit_policy_d986985730a94381' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.pilot_consents.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_d986985730a94381 ON public.pilot_consents;
CREATE POLICY __kit_policy_21eaff0701a94b04 on public.meeting_requests as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='synera_members_only' and b.polname='__kit_policy_21eaff0701a94b04' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_21eaff0701a94b04 ON public.meeting_requests;
CREATE POLICY __kit_policy_897504c721993452 on public.meeting_messages as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_messages') and a.polname='synera_members_only' and b.polname='__kit_policy_897504c721993452' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_messages.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_897504c721993452 ON public.meeting_messages;
CREATE POLICY __kit_policy_746751157f0ab9d4 on public.profile_blocks as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_blocks') and a.polname='synera_members_only' and b.polname='__kit_policy_746751157f0ab9d4' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_blocks.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_746751157f0ab9d4 ON public.profile_blocks;
CREATE POLICY __kit_policy_5275b3d0582dce8d on public.profile_reports as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.profile_reports') and a.polname='synera_members_only' and b.polname='__kit_policy_5275b3d0582dce8d' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.profile_reports.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_5275b3d0582dce8d ON public.profile_reports;
CREATE POLICY __kit_policy_2e7039ff045016f7 on public.match_cases for select to authenticated using ((select public.synera_user_id()) in (participant_low, participant_high));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_cases') and a.polname='cases_read' and b.polname='__kit_policy_2e7039ff045016f7' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_cases.cases_read'; end if;
END $kit$;
DROP POLICY __kit_policy_2e7039ff045016f7 ON public.match_cases;
CREATE POLICY __kit_policy_ec9cbc9624c71661 on public.match_cases for insert to authenticated with check ((select public.synera_user_id()) in (participant_low, participant_high)
  and exists (select 1 from public.profiles p where p.id = case when participant_low = (select public.synera_user_id()) then participant_high else participant_low end and p.is_discoverable));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_cases') and a.polname='cases_create' and b.polname='__kit_policy_ec9cbc9624c71661' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_cases.cases_create'; end if;
END $kit$;
DROP POLICY __kit_policy_ec9cbc9624c71661 ON public.match_cases;
CREATE POLICY __kit_policy_cad9288966c13457 on public.match_cases for update to authenticated
  using ((select public.synera_user_id()) in (participant_low, participant_high) and status = 'open')
  with check ((select public.synera_user_id()) in (participant_low, participant_high));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_cases') and a.polname='cases_update' and b.polname='__kit_policy_cad9288966c13457' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_cases.cases_update'; end if;
END $kit$;
DROP POLICY __kit_policy_cad9288966c13457 ON public.match_cases;
CREATE POLICY __kit_policy_75b28a342cbc844b on public.match_cases as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_cases') and a.polname='cases_consent' and b.polname='__kit_policy_75b28a342cbc844b' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_cases.cases_consent'; end if;
END $kit$;
DROP POLICY __kit_policy_75b28a342cbc844b ON public.match_cases;
CREATE POLICY __kit_policy_45ed971e0b801977 on public.match_cases as restrictive for all to authenticated using (true) with check (status <> 'open'
  or not exists (select 1 from public.profile_blocks b where (b.blocker_id = participant_low and b.blocked_id = participant_high) or (b.blocker_id = participant_high and b.blocked_id = participant_low)));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_cases') and a.polname='cases_unblocked' and b.polname='__kit_policy_45ed971e0b801977' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_cases.cases_unblocked'; end if;
END $kit$;
DROP POLICY __kit_policy_45ed971e0b801977 ON public.match_cases;
CREATE POLICY __kit_policy_93df0e5d7911b912 on public.match_case_approvals for select to authenticated using (
  exists (select 1 from public.match_cases c where c.case_id = match_case_approvals.case_id and (select public.synera_user_id()) in (c.participant_low, c.participant_high)));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_case_approvals') and a.polname='approvals_read' and b.polname='__kit_policy_93df0e5d7911b912' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_case_approvals.approvals_read'; end if;
END $kit$;
DROP POLICY __kit_policy_93df0e5d7911b912 ON public.match_case_approvals;
CREATE POLICY __kit_policy_bfdd14441ccc0970 on public.match_case_approvals for insert to authenticated with check (party_id = (select public.synera_user_id())
  and exists (select 1 from public.match_cases c where c.case_id = match_case_approvals.case_id and (select public.synera_user_id()) in (c.participant_low, c.participant_high)
    and c.status = 'open' and c.expires_at > now() and c.version = approved_version and c.terms_hash = approved_terms_hash
    and public.synera_case_material_complete(c.material)));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_case_approvals') and a.polname='approvals_create' and b.polname='__kit_policy_bfdd14441ccc0970' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_case_approvals.approvals_create'; end if;
END $kit$;
DROP POLICY __kit_policy_bfdd14441ccc0970 ON public.match_case_approvals;
CREATE POLICY __kit_policy_af34e28e0db87c91 on public.match_case_approvals for update to authenticated
  using (party_id = (select public.synera_user_id())) with check (party_id = (select public.synera_user_id()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_case_approvals') and a.polname='approvals_withdraw' and b.polname='__kit_policy_af34e28e0db87c91' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_case_approvals.approvals_withdraw'; end if;
END $kit$;
DROP POLICY __kit_policy_af34e28e0db87c91 ON public.match_case_approvals;
CREATE POLICY __kit_policy_8f901905e9599dba on public.match_case_approvals as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_case_approvals') and a.polname='approvals_consent' and b.polname='__kit_policy_8f901905e9599dba' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_case_approvals.approvals_consent'; end if;
END $kit$;
DROP POLICY __kit_policy_8f901905e9599dba ON public.match_case_approvals;
CREATE POLICY __kit_policy_8e371039b3e890a9 on public.meeting_requests as restrictive for insert to authenticated with check (
  exists (select 1 from public.match_cases c where c.status = 'open' and c.expires_at > now()
    and c.participant_low = least(sender_id, recipient_id) and c.participant_high = greatest(sender_id, recipient_id)
    and (select count(distinct a.party_id) from public.match_case_approvals a where a.case_id = c.case_id and a.withdrawn_at is null
      and a.approved_version = c.version and a.approved_terms_hash = c.terms_hash and a.party_id in (c.participant_low, c.participant_high)) = 2));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meetings_need_approved_case' and b.polname='__kit_policy_8e371039b3e890a9' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meetings_need_approved_case'; end if;
END $kit$;
DROP POLICY __kit_policy_8e371039b3e890a9 ON public.meeting_requests;
CREATE POLICY __kit_policy_33f98e46cfa77fba on public.match_cases as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_cases') and a.polname='synera_members_only' and b.polname='__kit_policy_33f98e46cfa77fba' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_cases.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_33f98e46cfa77fba ON public.match_cases;
CREATE POLICY __kit_policy_741f99b5492ac044 on public.match_case_approvals as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.match_case_approvals') and a.polname='synera_members_only' and b.polname='__kit_policy_741f99b5492ac044' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.match_case_approvals.synera_members_only'; end if;
END $kit$;
DROP POLICY __kit_policy_741f99b5492ac044 ON public.match_case_approvals;
CREATE POLICY __kit_policy_43bf5fc0d0721e7b on public.meeting_requests for update to authenticated
  using (status='accepted' and public.synera_user_id() in (sender_id,recipient_id))
  with check (status='accepted' and public.synera_user_id() in (sender_id,recipient_id));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.meeting_requests') and a.polname='meeting_address_participants' and b.polname='__kit_policy_43bf5fc0d0721e7b' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.meeting_requests.meeting_address_participants'; end if;
END $kit$;
DROP POLICY __kit_policy_43bf5fc0d0721e7b ON public.meeting_requests;
CREATE POLICY __kit_policy_5b93efccecb6f859 on public.group_rooms for select to authenticated using (
  public.synera_room_actor_allowed(id,true));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.group_rooms') and a.polname='group_rooms_participants' and b.polname='__kit_policy_5b93efccecb6f859' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.group_rooms.group_rooms_participants'; end if;
END $kit$;
DROP POLICY __kit_policy_5b93efccecb6f859 ON public.group_rooms;
CREATE POLICY __kit_policy_1ce19ba73d4615c3 on public.group_room_members for select to authenticated using (
  public.synera_room_actor_allowed(room_id,true));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.group_room_members') and a.polname='group_room_members_participants' and b.polname='__kit_policy_1ce19ba73d4615c3' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.group_room_members.group_room_members_participants'; end if;
END $kit$;
DROP POLICY __kit_policy_1ce19ba73d4615c3 ON public.group_room_members;
CREATE POLICY __kit_policy_fa7b183aebbcadc3 on public.group_room_messages for select to authenticated using (
  public.synera_room_actor_allowed(room_id,false));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.group_room_messages') and a.polname='group_room_messages_accepted' and b.polname='__kit_policy_fa7b183aebbcadc3' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.group_room_messages.group_room_messages_accepted'; end if;
END $kit$;
DROP POLICY __kit_policy_fa7b183aebbcadc3 ON public.group_room_messages;
CREATE POLICY __kit_policy_f291549381cbbfb4 on public.group_room_events for select to authenticated using (
  public.synera_room_actor_allowed(room_id,false));
DO $kit$ BEGIN
if not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass('public.group_room_events') and a.polname='group_room_events_accepted' and b.polname='__kit_policy_f291549381cbbfb4' and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: public.group_room_events.group_room_events_accepted'; end if;
END $kit$;
DROP POLICY __kit_policy_f291549381cbbfb4 ON public.group_room_events;
DO $kit$ BEGIN
if not (coalesce((has_schema_privilege('authenticated','public','usage')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) and coalesce((to_regclass('public.profiles') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='display_name')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='city')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='offers')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='seeks')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_discoverable')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profiles')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profiles'),'select'),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profiles'),'delete'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='display_name' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='city' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='offers' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='seeks' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='is_discoverable' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='id' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='display_name' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='city' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='offers' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='seeks' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='is_discoverable' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_update')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_delete')),false) and coalesce((to_regclass('public.meeting_requests') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='sender_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='recipient_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='note')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='created_at')),false) and coalesce((to_regclass('public.meeting_requests_recipient') is not null),false) and coalesce((to_regclass('public.meeting_requests_sender') is not null),false) and coalesce((to_regclass('public.meeting_requests_pending') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_requests')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.meeting_requests'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='sender_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='recipient_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='note' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='status' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_respond')),false) and coalesce((to_regclass('public.pilot_consents') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='policy_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='terms_accepted')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='privacy_acknowledged')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='accepted_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.pilot_consents')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.pilot_consents'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='user_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='policy_version' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='terms_accepted' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='privacy_acknowledged' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='consent_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='consent_create')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='brief')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='map_visible')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at')),false) and coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='profile_brief_shape')),false) and coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='profile_map_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='published_brief_complete')),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='brief' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='map_visible' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='brief' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='map_visible' and not attisdropped),'update'),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_touch_profile' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='synera_profile_updated' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_consent')),false) and coalesce((to_regclass('public.profile_blocks') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='blocker_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='blocked_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='created_at')),false) and coalesce((to_regclass('public.profile_blocks_target') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_blocks')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_blocks'),'select'),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_blocks'),'delete'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_blocks'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_blocks') and attname='blocker_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_blocks'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_blocks') and attname='blocked_id' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_delete')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_unblocked')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='proposed_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='duration_minutes')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_place')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='sender_name')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='recipient_name')),false) and coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.meeting_requests') and conname='meeting_requests_status_check')),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='proposed_at' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='duration_minutes' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_place' and not attisdropped),'insert'),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_names' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_names' and not tgisinternal)),false) and coalesce((to_regclass('public.meetings_pending_pair') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_plan')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_cancel')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_response_unblocked')),false) and coalesce((to_regclass('public.meeting_messages') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='sender_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='body')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='created_at')),false) and coalesce((to_regclass('public.messages_meeting') is not null),false) and coalesce((to_regclass('public.messages_sender') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_messages')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.meeting_messages'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='meeting_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='sender_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='body' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='messages_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='messages_create')),false) and coalesce((to_regclass('public.profile_reports') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reporter_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reported_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reason')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='detail')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='created_at')),false) and coalesce((to_regclass('public.reports_reporter') is not null),false) and coalesce((to_regclass('public.reports_target') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_reports')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_reports'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reporter_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reported_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reason' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='detail' and not attisdropped),'insert'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='reports_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='reports_create')),false) and coalesce((to_regclass('public.synera_write_limits') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='window_started_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='invitations')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='messages')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='reports')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.synera_write_limits')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_limit_writes' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='invitations_rate' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_messages') and tgname='messages_rate' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profile_reports') and tgname='reports_rate' and not tgisinternal)),false) and coalesce((to_regclass('public.synera_pilot_members') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_pilot_members' and column_name='email')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_pilot_members' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.synera_pilot_members')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='synera_members_only')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) and coalesce((to_regclass('public.match_cases') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_low')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_high')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='mode')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='material')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='expires_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='closed_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='created_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='updated_at')),false) and coalesce((to_regclass('public.match_cases_open_pair') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_guard' and not tgisinternal)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_project_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_project_guard' and not tgisinternal)),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.match_cases')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.match_cases'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='case_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='participant_low' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='participant_high' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='mode' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='material' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='terms_hash' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='expires_at' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='mode' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='material' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='terms_hash' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='status' and not attisdropped),'update'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='expires_at' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_update')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_unblocked')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) and coalesce((to_regclass('public.match_case_approvals') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='party_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='withdrawn_at')),false) and coalesce((to_regclass('public.approvals_one_live') is not null),false) and coalesce((to_regclass('public.approvals_case') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_approval_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='match_case_approval_guard' and not tgisinternal)),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.match_case_approvals')),false)),false) and coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.match_case_approvals'),'select'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='case_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='party_id' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='approved_version' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='approved_terms_hash' and not attisdropped),'insert'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='withdrawn_at' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_read')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_create')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_withdraw')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_consent')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_need_approved_case')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='synera_members_only')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='synera_members_only')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_status_guard' and not tgisinternal)),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_address')),false) and coalesce((not coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_address' and not attisdropped),'update'),false)),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meeting_address_participants')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_address_guard' and not tgisinternal)),false) and coalesce((to_regclass('public.meeting_location_grants') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='grantor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='recipient_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='precision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='lead_minutes')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='opens_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='closes_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='granted_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='revoked_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_time')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_duration')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_place')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_address')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_seq')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_admitted_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_location_grants')),false)),false) and coalesce((to_regclass('public.location_consent_intents') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='grantor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='created_at')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.location_consent_intents')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_case_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, integer, text') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_public' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='meeting_location_grants') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_invalidate' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='location_meeting_changed' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='location_case_changed' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='location_approval_withdrawn' and not tgisinternal)),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profile_blocks') and tgname='location_participant_blocked' and not tgisinternal)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) and coalesce((to_regclass('public.group_rooms') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='creator_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='title')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='goal')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_position')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_deadline')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_started_revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='created_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='activated_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='paused_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='closed_at')),false) and coalesce((to_regclass('public.group_room_members') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='room_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='position')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='role')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='membership_status')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='invited_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='accepted_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='left_at')),false) and coalesce((to_regclass('public.group_room_messages') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='message_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='sender_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='body')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='created_at')),false) and coalesce((to_regclass('public.group_room_events') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='room_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='revision')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='event_type')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='actor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='created_at')),false) and coalesce((to_regclass('public.group_room_members_user') is not null),false) and coalesce((to_regclass('public.group_room_messages_room') is not null),false) and coalesce((to_regclass('public.group_room_events_room') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_rooms')),false)),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_room_members')),false)),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_room_messages')),false)),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_room_events')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_current_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_pair_blocked' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_actor_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_all_accepted_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_admit_write' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_rooms') and polname='group_rooms_participants')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_members') and polname='group_room_members_participants')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_messages') and polname='group_room_messages_accepted')),false) and coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_events') and polname='group_room_events_accepted')),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_state' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer'),'EXECUTE'),false)),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer'),'EXECUTE'),false)),false) and coalesce((to_regclass('public.match_outcome_events') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='material_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='deliverable_index')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='actor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='kind')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='payload')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='created_at')),false) and coalesce((to_regclass('public.match_outcomes_revision') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.match_outcome_events')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb'),'EXECUTE'),false)),false) and coalesce((not exists(select 1 from information_schema.column_privileges where grantee='PUBLIC' and table_schema='public' and table_name='meeting_requests' and column_name='meeting_address' and privilege_type='UPDATE')),false) and coalesce((to_regclass('public.meeting_address_events') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_version')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='terms_hash')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='actor_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='kind')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='proposal_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='intent_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='address')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_snapshot')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='payload')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='created_at')),false) and coalesce((to_regclass('public.meeting_address_proposals') is not null),false) and coalesce((to_regclass('public.meeting_address_decisions') is not null),false) and coalesce((to_regclass('public.meeting_address_history') is not null),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_address_events')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb'),'EXECUTE'),false)),false) and coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='id' and not attisdropped),'insert'),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text'),'EXECUTE'),false)),false) and coalesce((to_regclass('public.profile_erasures') is not null),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='user_id')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='erased_at')),false) and coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='provider_deletion')),false) and coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_erasures')),false)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_statement_lock' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_statement_lock' and not tgisinternal)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_guard' and not tgisinternal)),false) and coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) and coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false)) then raise exception 'Final catalog acceptance failed; all migrations roll back'; end if;
END $kit$;
COMMIT;

-- Read-only post-commit catalog acceptance, explicitly rolled back.
-- Original fixture suites are in 11-acceptance-disposable.sql, NEVER on production.
BEGIN READ ONLY;
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:USAGE:schema public' as object, coalesce((has_schema_privilege('authenticated','public','usage')),false) as present
union all
select 'schema.proposal.sql' as migration, 'function' as kind, 'public.synera_user_id()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_user_id()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_user_id' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.profiles' as object, coalesce((to_regclass('public.profiles') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.display_name' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='display_name')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.city' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='city')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.offers' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='offers')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.seeks' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='seeks')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.is_discoverable' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='is_discoverable')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='created_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.profiles' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profiles')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.profiles' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profiles'),'select'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:DELETE:public.profiles' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profiles'),'delete'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.display_name' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='display_name' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.city' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='city' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.offers' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='offers' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.seeks' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='seeks' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.is_discoverable' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='is_discoverable' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='id' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.display_name' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='display_name' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.city' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='city' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.offers' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='offers' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.seeks' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='seeks' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.is_discoverable' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='is_discoverable' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.profiles_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_read')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.profiles_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_create')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.profiles_update' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_update')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.profiles_delete' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_delete')),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.meeting_requests' as object, coalesce((to_regclass('public.meeting_requests') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.sender_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='sender_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.recipient_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='recipient_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.note' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='note')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.status' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='status')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='created_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.meeting_requests_recipient' as object, coalesce((to_regclass('public.meeting_requests_recipient') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.meeting_requests_sender' as object, coalesce((to_regclass('public.meeting_requests_sender') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.meeting_requests_pending' as object, coalesce((to_regclass('public.meeting_requests_pending') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.meeting_requests' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_requests')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.meeting_requests' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.meeting_requests'),'select'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_requests.sender_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='sender_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_requests.recipient_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='recipient_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_requests.note' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='note' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.meeting_requests.status' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='status' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_read')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_create')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_respond' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_respond')),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.pilot_consents' as object, coalesce((to_regclass('public.pilot_consents') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.pilot_consents.user_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='user_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.pilot_consents.policy_version' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='policy_version')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.pilot_consents.terms_accepted' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='terms_accepted')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.pilot_consents.privacy_acknowledged' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='privacy_acknowledged')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.pilot_consents.accepted_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='pilot_consents' and column_name='accepted_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.pilot_consents' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.pilot_consents')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.pilot_consents' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.pilot_consents'),'select'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.pilot_consents.user_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='user_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.pilot_consents.policy_version' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='policy_version' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.pilot_consents.terms_accepted' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='terms_accepted' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.pilot_consents.privacy_acknowledged' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.pilot_consents'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.pilot_consents') and attname='privacy_acknowledged' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.pilot_consents.consent_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='consent_read')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.pilot_consents.consent_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='consent_create')),false) as present
union all
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_valid_brief(jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_valid_brief(jsonb)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.brief' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='brief')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.map_visible' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='map_visible')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profiles.updated_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='updated_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'constraint' as kind, 'public.profiles.profile_brief_shape' as object, coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='profile_brief_shape')),false) as present
union all
select 'schema.proposal.sql' as migration, 'constraint' as kind, 'public.profiles.profile_map_consent' as object, coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='profile_map_consent')),false) as present
union all
select 'case-state.migration.sql' as migration, 'constraint' as kind, 'public.profiles.published_brief_complete' as object, coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='published_brief_complete')),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.brief' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='brief' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profiles.map_visible' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='map_visible' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.brief' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='brief' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.profiles.map_visible' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profiles'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profiles') and attname='map_visible' and not attisdropped),'update'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'function' as kind, 'public.synera_touch_profile()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_touch_profile' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'trigger' as kind, 'public.profiles.synera_profile_updated' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='synera_profile_updated' and not tgisinternal)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.profiles_consent' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_consent')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_consent' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_consent')),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.profile_blocks' as object, coalesce((to_regclass('public.profile_blocks') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_blocks.blocker_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='blocker_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_blocks.blocked_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='blocked_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_blocks.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_blocks' and column_name='created_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.profile_blocks_target' as object, coalesce((to_regclass('public.profile_blocks_target') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.profile_blocks' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_blocks')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.profile_blocks' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_blocks'),'select'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:DELETE:public.profile_blocks' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_blocks'),'delete'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profile_blocks.blocker_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_blocks'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_blocks') and attname='blocker_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profile_blocks.blocked_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_blocks'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_blocks') and attname='blocked_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_blocks.blocks_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_read')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_blocks.blocks_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_create')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_blocks.blocks_delete' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='blocks_delete')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.profiles_unblocked' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='profiles_unblocked')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.proposed_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='proposed_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.duration_minutes' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='duration_minutes')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.meeting_place' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_place')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.sender_name' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='sender_name')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_requests.recipient_name' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='recipient_name')),false) as present
union all
select 'schema.proposal.sql' as migration, 'constraint' as kind, 'public.meeting_requests.meeting_requests_status_check' as object, coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.meeting_requests') and conname='meeting_requests_status_check')),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_requests.proposed_at' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='proposed_at' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_requests.duration_minutes' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='duration_minutes' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_requests.meeting_place' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_place' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'function' as kind, 'public.synera_meeting_names()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_names' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'trigger' as kind, 'public.meeting_requests.meeting_names' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_names' and not tgisinternal)),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.meetings_pending_pair' as object, coalesce((to_regclass('public.meetings_pending_pair') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_plan' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_plan')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_cancel' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_cancel')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_response_unblocked' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_response_unblocked')),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.meeting_messages' as object, coalesce((to_regclass('public.meeting_messages') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_messages.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_messages.meeting_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='meeting_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_messages.sender_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='sender_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_messages.body' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='body')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.meeting_messages.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_messages' and column_name='created_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.messages_meeting' as object, coalesce((to_regclass('public.messages_meeting') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.messages_sender' as object, coalesce((to_regclass('public.messages_sender') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.meeting_messages' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_messages')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.meeting_messages' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.meeting_messages'),'select'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_messages.meeting_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='meeting_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_messages.sender_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='sender_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_messages.body' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='body' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_messages.messages_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='messages_read')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_messages.messages_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='messages_create')),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.profile_reports' as object, coalesce((to_regclass('public.profile_reports') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_reports.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_reports.reporter_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reporter_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_reports.reported_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reported_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_reports.reason' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='reason')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_reports.detail' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='detail')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.profile_reports.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_reports' and column_name='created_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.reports_reporter' as object, coalesce((to_regclass('public.reports_reporter') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'index' as kind, 'public.reports_target' as object, coalesce((to_regclass('public.reports_target') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.profile_reports' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_reports')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.profile_reports' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.profile_reports'),'select'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profile_reports.reporter_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reporter_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profile_reports.reported_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reported_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profile_reports.reason' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='reason' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.profile_reports.detail' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.profile_reports'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.profile_reports') and attname='detail' and not attisdropped),'insert'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_reports.reports_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='reports_read')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_reports.reports_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='reports_create')),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.synera_write_limits' as object, coalesce((to_regclass('public.synera_write_limits') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_write_limits.user_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='user_id')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_write_limits.window_started_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='window_started_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_write_limits.invitations' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='invitations')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_write_limits.messages' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='messages')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_write_limits.reports' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_write_limits' and column_name='reports')),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.synera_write_limits' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.synera_write_limits')),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'function' as kind, 'public.synera_limit_writes()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_limit_writes' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'trigger' as kind, 'public.meeting_requests.invitations_rate' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='invitations_rate' and not tgisinternal)),false) as present
union all
select 'schema.proposal.sql' as migration, 'trigger' as kind, 'public.meeting_messages.messages_rate' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_messages') and tgname='messages_rate' and not tgisinternal)),false) as present
union all
select 'schema.proposal.sql' as migration, 'trigger' as kind, 'public.profile_reports.reports_rate' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profile_reports') and tgname='reports_rate' and not tgisinternal)),false) as present
union all
select 'schema.proposal.sql' as migration, 'table' as kind, 'public.synera_pilot_members' as object, coalesce((to_regclass('public.synera_pilot_members') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_pilot_members.email' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_pilot_members' and column_name='email')),false) as present
union all
select 'schema.proposal.sql' as migration, 'column' as kind, 'public.synera_pilot_members.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='synera_pilot_members' and column_name='created_at')),false) as present
union all
select 'schema.proposal.sql' as migration, 'rls' as kind, 'public.synera_pilot_members' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.synera_pilot_members')),false)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_pilot_member()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_pilot_member()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profiles.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profiles') and polname='synera_members_only')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.pilot_consents.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.pilot_consents') and polname='synera_members_only')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_requests.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='synera_members_only')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.meeting_messages.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_messages') and polname='synera_members_only')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_blocks.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_blocks') and polname='synera_members_only')),false) as present
union all
select 'schema.proposal.sql' as migration, 'policy' as kind, 'public.profile_reports.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.profile_reports') and polname='synera_members_only')),false) as present
union all
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_valid_mode_details(jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_valid_mode_details(jsonb)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_mode_details' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'table' as kind, 'public.match_cases' as object, coalesce((to_regclass('public.match_cases') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.case_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='case_id')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.participant_low' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_low')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.participant_high' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='participant_high')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.mode' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='mode')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.material' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='material')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.terms_hash' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='terms_hash')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.version' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='version')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.status' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='status')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.expires_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='expires_at')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.closed_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='closed_at')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='created_at')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_cases.updated_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_cases' and column_name='updated_at')),false) as present
union all
select 'case-state.migration.sql' as migration, 'index' as kind, 'public.match_cases_open_pair' as object, coalesce((to_regclass('public.match_cases_open_pair') is not null),false) as present
union all
select 'case-expiry-repair.migration.sql' as migration, 'function' as kind, 'public.synera_case_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'trigger' as kind, 'public.match_cases.match_case_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_guard' and not tgisinternal)),false) as present
union all
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_case_project_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_project_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'trigger' as kind, 'public.match_cases.match_case_project_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='match_case_project_guard' and not tgisinternal)),false) as present
union all
select 'case-state.migration.sql' as migration, 'rls' as kind, 'public.match_cases' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.match_cases')),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.match_cases' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.match_cases'),'select'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.case_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='case_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.participant_low' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='participant_low' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.participant_high' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='participant_high' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.mode' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='mode' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.material' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='material' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.terms_hash' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='terms_hash' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_cases.expires_at' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='expires_at' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.match_cases.mode' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='mode' and not attisdropped),'update'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.match_cases.material' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='material' and not attisdropped),'update'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.match_cases.terms_hash' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='terms_hash' and not attisdropped),'update'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.match_cases.status' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='status' and not attisdropped),'update'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.match_cases.expires_at' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_cases'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_cases') and attname='expires_at' and not attisdropped),'update'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_cases.cases_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_read')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_cases.cases_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_create')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_cases.cases_update' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_update')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_cases.cases_consent' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_consent')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_cases.cases_unblocked' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='cases_unblocked')),false) as present
union all
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_case_material_complete(jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_case_material_complete(jsonb)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_material_complete' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb'),'EXECUTE'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'table' as kind, 'public.match_case_approvals' as object, coalesce((to_regclass('public.match_case_approvals') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='id')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.case_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='case_id')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.party_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='party_id')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.approved_version' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_version')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.approved_terms_hash' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_terms_hash')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.approved_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='approved_at')),false) as present
union all
select 'case-state.migration.sql' as migration, 'column' as kind, 'public.match_case_approvals.withdrawn_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_case_approvals' and column_name='withdrawn_at')),false) as present
union all
select 'case-state.migration.sql' as migration, 'index' as kind, 'public.approvals_one_live' as object, coalesce((to_regclass('public.approvals_one_live') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'index' as kind, 'public.approvals_case' as object, coalesce((to_regclass('public.approvals_case') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_approval_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_approval_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'trigger' as kind, 'public.match_case_approvals.match_case_approval_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='match_case_approval_guard' and not tgisinternal)),false) as present
union all
select 'case-state.migration.sql' as migration, 'rls' as kind, 'public.match_case_approvals' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.match_case_approvals')),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:SELECT:public.match_case_approvals' as object, coalesce((coalesce(has_table_privilege('authenticated',to_regclass('public.match_case_approvals'),'select'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_case_approvals.case_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='case_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_case_approvals.party_id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='party_id' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_case_approvals.approved_version' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='approved_version' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.match_case_approvals.approved_terms_hash' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='approved_terms_hash' and not attisdropped),'insert'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.match_case_approvals.withdrawn_at' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.match_case_approvals'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.match_case_approvals') and attname='withdrawn_at' and not attisdropped),'update'),false)),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_case_approvals.approvals_read' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_read')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_case_approvals.approvals_create' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_create')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_case_approvals.approvals_withdraw' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_withdraw')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_case_approvals.approvals_consent' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='approvals_consent')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.meeting_requests.meetings_need_approved_case' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meetings_need_approved_case')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_cases.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_cases') and polname='synera_members_only')),false) as present
union all
select 'case-state.migration.sql' as migration, 'policy' as kind, 'public.match_case_approvals.synera_members_only' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.match_case_approvals') and polname='synera_members_only')),false) as present
union all
select 'meeting-status-guard.migration.sql' as migration, 'function' as kind, 'public.synera_meeting_status_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'meeting-status-guard.migration.sql' as migration, 'trigger' as kind, 'public.meeting_requests.meeting_status_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_status_guard' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_requests.meeting_address' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_address')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.meeting_requests.meeting_address' as object, coalesce((not coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_address' and not attisdropped),'update'),false)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'policy' as kind, 'public.meeting_requests.meeting_address_participants' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.meeting_requests') and polname='meeting_address_participants')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_meeting_address_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'trigger' as kind, 'public.meeting_requests.meeting_address_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_address_guard' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'table' as kind, 'public.meeting_location_grants' as object, coalesce((to_regclass('public.meeting_location_grants') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.meeting_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.grantor_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='grantor_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.recipient_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='recipient_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.precision' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='precision')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.lead_minutes' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='lead_minutes')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.opens_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='opens_at')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.closes_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='closes_at')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.granted_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='granted_at')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.status' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='status')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.revoked_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='revoked_at')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.case_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.case_version' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_version')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.case_hash' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='case_hash')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.meeting_time' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_time')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.meeting_duration' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_duration')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.meeting_place' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_place')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.meeting_address' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='meeting_address')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.intent_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='intent_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.sample_seq' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_seq')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_location_grants.sample_admitted_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name='sample_admitted_at')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'rls' as kind, 'public.meeting_location_grants' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_location_grants')),false)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'table' as kind, 'public.location_consent_intents' as object, coalesce((to_regclass('public.location_consent_intents') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.location_consent_intents.intent_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='intent_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.location_consent_intents.meeting_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='meeting_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.location_consent_intents.grantor_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='grantor_id')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.location_consent_intents.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_consent_intents' and column_name='created_at')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'rls' as kind, 'public.location_consent_intents' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.location_consent_intents')),false)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_case_current(text,integer,text)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_case_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, integer, text') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_allowed(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_public(public.meeting_location_grants)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_public' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='meeting_location_grants') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_grant(uuid,text,integer,boolean,uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_sample(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_access(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_revoke(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'function' as kind, 'public.synera_location_invalidate()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_invalidate' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'trigger' as kind, 'public.meeting_requests.location_meeting_changed' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='location_meeting_changed' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'trigger' as kind, 'public.match_cases.location_case_changed' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_cases') and tgname='location_case_changed' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'trigger' as kind, 'public.match_case_approvals.location_approval_withdrawn' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.match_case_approvals') and tgname='location_approval_withdrawn' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'trigger' as kind, 'public.profile_blocks.location_participant_blocked' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profile_blocks') and tgname='location_participant_blocked' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_location_grant(uuid,text,integer,boolean,uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_grant' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, integer, boolean, uuid'),'EXECUTE'),false)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_location_access(uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_access' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_location_revoke(uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_revoke' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_location_sample(uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_location_sample' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'table' as kind, 'public.group_rooms' as object, coalesce((to_regclass('public.group_rooms') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.creator_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='creator_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.title' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='title')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.goal' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='goal')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.status' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='status')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.revision' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='revision')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.turn_position' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_position')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.turn_deadline' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_deadline')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.turn_started_revision' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='turn_started_revision')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='created_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.activated_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='activated_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.paused_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='paused_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_rooms.closed_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_rooms' and column_name='closed_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'table' as kind, 'public.group_room_members' as object, coalesce((to_regclass('public.group_room_members') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.room_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='room_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.user_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='user_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.position' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='position')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.role' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='role')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.membership_status' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='membership_status')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.invited_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='invited_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.accepted_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='accepted_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_members.left_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_members' and column_name='left_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'table' as kind, 'public.group_room_messages' as object, coalesce((to_regclass('public.group_room_messages') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_messages.room_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_messages.message_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='message_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_messages.sender_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='sender_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_messages.room_revision' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='room_revision')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_messages.body' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='body')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_messages.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_messages' and column_name='created_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'table' as kind, 'public.group_room_events' as object, coalesce((to_regclass('public.group_room_events') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_events.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_events.room_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='room_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_events.revision' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='revision')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_events.event_type' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='event_type')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_events.actor_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='actor_id')),false) as present
union all
select 'group-room.migration.sql' as migration, 'column' as kind, 'public.group_room_events.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='group_room_events' and column_name='created_at')),false) as present
union all
select 'group-room.migration.sql' as migration, 'index' as kind, 'public.group_room_members_user' as object, coalesce((to_regclass('public.group_room_members_user') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'index' as kind, 'public.group_room_messages_room' as object, coalesce((to_regclass('public.group_room_messages_room') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'index' as kind, 'public.group_room_events_room' as object, coalesce((to_regclass('public.group_room_events_room') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'rls' as kind, 'public.group_rooms' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_rooms')),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'rls' as kind, 'public.group_room_members' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_room_members')),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'rls' as kind, 'public.group_room_messages' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_room_messages')),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'rls' as kind, 'public.group_room_events' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.group_room_events')),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_current_member(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_current_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_pair_blocked(uuid,uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_pair_blocked' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_actor_allowed(uuid,boolean)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_actor_allowed' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_all_accepted_current(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_all_accepted_current' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_admit_write(text)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_admit_write' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'policy' as kind, 'public.group_rooms.group_rooms_participants' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_rooms') and polname='group_rooms_participants')),false) as present
union all
select 'group-room.migration.sql' as migration, 'policy' as kind, 'public.group_room_members.group_room_members_participants' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_members') and polname='group_room_members_participants')),false) as present
union all
select 'group-room.migration.sql' as migration, 'policy' as kind, 'public.group_room_messages.group_room_messages_accepted' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_messages') and polname='group_room_messages_accepted')),false) as present
union all
select 'group-room.migration.sql' as migration, 'policy' as kind, 'public.group_room_events.group_room_events_accepted' as object, coalesce((exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass('public.group_room_events') and polname='group_room_events_accepted')),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_state(uuid,boolean)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_state' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, boolean') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_create(text,text,uuid[])' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_list()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_get(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_accept(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_leave(uuid)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_start(uuid,integer)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_message(uuid,integer,uuid,text)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_advance(uuid,integer)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'function' as kind, 'public.synera_room_close(uuid,integer)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer') is not null),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_create(text,text,uuid[])' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_create' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, text, uuid[]'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_list()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_list' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_get(uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_get' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_accept(uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_accept' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_leave(uuid)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_leave' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_start(uuid,integer)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_start' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_message(uuid,integer,uuid,text)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer, uuid, text'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_advance(uuid,integer)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_advance' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer'),'EXECUTE'),false)),false) as present
union all
select 'group-room.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_room_close(uuid,integer)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_room_close' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, integer'),'EXECUTE'),false)),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'table' as kind, 'public.match_outcome_events' as object, coalesce((to_regclass('public.match_outcome_events') is not null),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='id')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.case_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='case_id')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.material_version' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='material_version')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.terms_hash' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='terms_hash')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.deliverable_index' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='deliverable_index')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.actor_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='actor_id')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.kind' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='kind')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.intent_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='intent_id')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.payload' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='payload')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'column' as kind, 'public.match_outcome_events.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='match_outcome_events' and column_name='created_at')),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'index' as kind, 'public.match_outcomes_revision' as object, coalesce((to_regclass('public.match_outcomes_revision') is not null),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'rls' as kind, 'public.match_outcome_events' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.match_outcome_events')),false)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_case_outcome(text,jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_case_outcome(text,jsonb)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb'),'EXECUTE'),false)),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'grant' as kind, 'public:UPDATE:public.meeting_requests.meeting_address' as object, coalesce((not exists(select 1 from information_schema.column_privileges where grantee='PUBLIC' and table_schema='public' and table_name='meeting_requests' and column_name='meeting_address' and privilege_type='UPDATE')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'table' as kind, 'public.meeting_address_events' as object, coalesce((to_regclass('public.meeting_address_events') is not null),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='id')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.meeting_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_id')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.case_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_id')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.case_version' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='case_version')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.terms_hash' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='terms_hash')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.actor_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='actor_id')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.kind' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='kind')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.proposal_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='proposal_id')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.intent_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='intent_id')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.address' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='address')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.meeting_snapshot' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='meeting_snapshot')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.payload' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='payload')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'column' as kind, 'public.meeting_address_events.created_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_address_events' and column_name='created_at')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'index' as kind, 'public.meeting_address_proposals' as object, coalesce((to_regclass('public.meeting_address_proposals') is not null),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'index' as kind, 'public.meeting_address_decisions' as object, coalesce((to_regclass('public.meeting_address_decisions') is not null),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'index' as kind, 'public.meeting_address_history' as object, coalesce((to_regclass('public.meeting_address_history') is not null),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'rls' as kind, 'public.meeting_address_events' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.meeting_address_events')),false)),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'function' as kind, 'public.synera_meeting_address(uuid,text,jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb') is not null),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_meeting_address(uuid,text,jsonb)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_address' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, text, jsonb'),'EXECUTE'),false)),false) as present
union all
select 'message-intent.migration.sql' as migration, 'grant' as kind, 'authenticated:INSERT:public.meeting_messages.id' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_messages'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_messages') and attname='id' and not attisdropped),'insert'),false)),false) as present
union all
select 'message-intent.migration.sql' as migration, 'function' as kind, 'public.synera_send_message(uuid,uuid,text)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text') is not null),false) as present
union all
select 'message-intent.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_send_message(uuid,uuid,text)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_send_message' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='uuid, uuid, text'),'EXECUTE'),false)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'table' as kind, 'public.profile_erasures' as object, coalesce((to_regclass('public.profile_erasures') is not null),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'column' as kind, 'public.profile_erasures.user_id' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='user_id')),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'column' as kind, 'public.profile_erasures.erased_at' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='erased_at')),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'column' as kind, 'public.profile_erasures.provider_deletion' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='profile_erasures' and column_name='provider_deletion')),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'rls' as kind, 'public.profile_erasures' as object, coalesce((coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass('public.profile_erasures')),false)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_profile_erasure_statement_lock()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_statement_lock' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'trigger' as kind, 'public.profiles.profile_erasure_statement_lock' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_statement_lock' and not tgisinternal)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_profile_erasure_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_profile_erasure_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'trigger' as kind, 'public.profiles.profile_erasure_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.profiles') and tgname='profile_erasure_guard' and not tgisinternal)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_erase_profile_data()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_erase_profile_data()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present;
ROLLBACK;
