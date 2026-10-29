-- Read-only catalog inventory. false means absent; never reads member emails or private rows.
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
select 'schema.proposal.sql' as migration, 'function' as kind, 'public.synera_valid_brief(jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) as present
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
select 'schema.proposal.sql' as migration, 'constraint' as kind, 'public.profiles.published_brief_complete' as object, coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='published_brief_complete')),false) as present
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
select 'schema.proposal.sql' as migration, 'function' as kind, 'public.synera_pilot_member()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'schema.proposal.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_pilot_member()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present
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
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_valid_brief(jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_valid_brief' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='jsonb') is not null),false) as present
union all
select 'case-state.migration.sql' as migration, 'constraint' as kind, 'public.profiles.published_brief_complete' as object, coalesce((exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass('public.profiles') and conname='published_brief_complete')),false) as present
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
select 'case-state.migration.sql' as migration, 'function' as kind, 'public.synera_case_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
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
select 'case-expiry-repair.migration.sql' as migration, 'function' as kind, 'public.synera_case_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'meeting-status-guard.migration.sql' as migration, 'function' as kind, 'public.synera_meeting_status_guard()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_meeting_status_guard' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'meeting-status-guard.migration.sql' as migration, 'trigger' as kind, 'public.meeting_requests.meeting_status_guard' as object, coalesce((exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass('public.meeting_requests') and tgname='meeting_status_guard' and not tgisinternal)),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'column' as kind, 'public.meeting_requests.meeting_address' as object, coalesce((exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_requests' and column_name='meeting_address')),false) as present
union all
select 'meeting-location.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.meeting_requests.meeting_address' as object, coalesce((coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_address' and not attisdropped),'update'),false)),false) as present
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
select 'case-outcome.migration.sql' as migration, 'function' as kind, 'public.synera_case_outcome(text,jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null),false) as present
union all
select 'case-outcome.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_case_outcome(text,jsonb)' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb'),'EXECUTE'),false)),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'grant' as kind, 'public:UPDATE:public.meeting_requests.meeting_address' as object, coalesce((not exists(select 1 from information_schema.column_privileges where grantee='PUBLIC' and table_schema='public' and table_name='meeting_requests' and column_name='meeting_address' and privilege_type='UPDATE')),false) as present
union all
select 'meeting-address-agreement.migration.sql' as migration, 'grant' as kind, 'authenticated:UPDATE:public.meeting_requests.meeting_address' as object, coalesce((not coalesce(has_column_privilege('authenticated',to_regclass('public.meeting_requests'),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass('public.meeting_requests') and attname='meeting_address' and not attisdropped),'update'),false)),false) as present
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
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_pilot_member()' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='') is not null),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_pilot_member()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_pilot_member' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present
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
select 'profile-erasure.migration.sql' as migration, 'grant' as kind, 'authenticated:EXECUTE:public.synera_erase_profile_data()' as object, coalesce((coalesce(has_function_privilege('authenticated',(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_erase_profile_data' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=''),'EXECUTE'),false)),false) as present
union all
select 'profile-erasure.migration.sql' as migration, 'function' as kind, 'public.synera_case_outcome(text,jsonb)' as object, coalesce(((select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='synera_case_outcome' and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')='text, jsonb') is not null),false) as present
order by migration,kind,object;
