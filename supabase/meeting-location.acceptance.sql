-- DISPOSABLE database only. Fixture identities; always ROLLBACK.
begin;
-- FIXTURE-USERS-BEGIN
insert into auth.users(id) values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222'),('33333333-3333-4333-8333-333333333333');
-- FIXTURE-USERS-END
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Location fixture','Product design','B2B sales',true,
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from auth.users where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values
('location-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',
'{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"sales","target":"Review one offer"}],"trial":{"starts_on":"2026-09-20","due_on":"2026-09-30","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"sales","target":"One review","acceptance_criteria":"Receiver accepts this version"}]},"compensation":{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":1,"confidentiality":"required","intellectual_property":"receiver","cancellation":"mutual_written_notice"}}',repeat('a',64),now()+interval '14 days');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values
('location-ab','11111111-1111-4111-8111-111111111111',1,repeat('a',64)),('location-ab','22222222-2222-4222-8222-222222222222',1,repeat('a',64));
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
insert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Acceptance location','accepted',now()+interval '5 minutes',30,'Zürich'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Online meeting','accepted',now()+interval '5 minutes',30,'Онлайн'),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Pending meeting','pending',now()+interval '5 minutes',30,'Zürich');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
do $$ declare g jsonb; begin
  begin perform * from public.meeting_location_grants; raise exception 'Raw grant read allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.location_consent_intents; raise exception 'Raw consent intents read allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.meeting_location_grants(meeting_id,grantor_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',auth.uid()); raise exception 'Raw forged grant allowed'; exception when insufficient_privilege then null; end;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',15,false,gen_random_uuid()); raise exception 'Consent omitted'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','city',15,true,gen_random_uuid()); raise exception 'Precision forged'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',90,true,gen_random_uuid()); raise exception 'Window forged'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_location_grant('dddddddd-dddd-4ddd-8ddd-dddddddddddd','exact',15,true,gen_random_uuid()); raise exception 'Online sharing allowed'; exception when insufficient_privilege then null; end;
  begin perform public.synera_location_grant('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','exact',15,true,gen_random_uuid()); raise exception 'Pending sharing allowed'; exception when insufficient_privilege then null; end;
  g:=public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approximate',15,true,gen_random_uuid());
  if g->>'grantor_id'<>auth.uid()::text or g->>'recipient_id'<>'22222222-2222-4222-8222-222222222222' then raise exception 'Identity not derived'; end if;
  if (g->>'closes_at')::timestamptz-(g->>'opens_at')::timestamptz<>interval '45 minutes' then raise exception 'Server window wrong'; end if;
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'peer'<>'null'::jsonb then raise exception 'Reciprocity forced'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333"}',true);
do $$ declare a jsonb; begin
  a:=public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  if a->>'eligible'<>'false' or a->'own'<>'null'::jsonb or a->'peer'<>'null'::jsonb or a->'meeting'<>'null'::jsonb then raise exception 'Outsider saw authority'; end if;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',15,true,gen_random_uuid()); raise exception 'Outsider grant allowed'; exception when insufficient_privilege then null; end;
  if public.synera_location_revoke('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') is not null then raise exception 'Outsider revoked another grant'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222"}',true);
do $$ begin
  begin
    update public.meeting_requests set status='accepted',meeting_address='Injected during acceptance' where id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
    raise exception 'Acceptance injected address';
  exception when insufficient_privilege then null; end;
end $$;
do $$ declare a jsonb; old_id text; new_id text; begin
  a:=public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  if a->'peer'->>'grantor_id'<>'11111111-1111-4111-8111-111111111111' or a->'own'<>'null'::jsonb then raise exception 'Independent peer read failed'; end if;
  old_id:=public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',30,true,'cccccccc-cccc-4ccc-8ccc-cccccccccccc')->>'id';
  if public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',30,true,'cccccccc-cccc-4ccc-8ccc-cccccccccccc')->>'id'<>old_id then raise exception 'Retry rotated active permission'; end if;
  if public.synera_location_sample('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'grant'->>'sample_seq'<>'1' then raise exception 'First sample admission wrong'; end if;
  begin perform public.synera_location_sample('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Sample write rate bypassed'; exception when insufficient_privilege then null; end;
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'own'->>'sample_seq'<>'1' then raise exception 'Failed write advanced the sequence'; end if;
  perform public.synera_location_revoke('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  a:=public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  if a->'own'<>'null'::jsonb or a->'peer'='null'::jsonb then raise exception 'Revocation affected the wrong party'; end if;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',30,true,'cccccccc-cccc-4ccc-8ccc-cccccccccccc'); raise exception 'Replayed consent revived permission'; exception when insufficient_privilege then null; end;
  new_id:=public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',15,true,gen_random_uuid())->>'id';
  if old_id=new_id then raise exception 'Old sample key can be replayed'; end if;
end $$;

select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333"}',true);
do $$ declare changed integer; begin
  update public.meeting_requests set meeting_address='Forged place' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Outsider changed meeting address'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
do $$ begin
  begin
    update public.meeting_requests set status='cancelled',meeting_address='Injected during cancellation' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    raise exception 'Cancellation injected address';
  exception when insufficient_privilege then null; end;
end $$;
update public.meeting_requests set meeting_address='Bahnhofplatz 15, Zürich' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'own'<>'null'::jsonb then raise exception 'Changed address retained permission'; end if;
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'meeting'->>'meeting_address'<>'Bahnhofplatz 15, Zürich' then raise exception 'Updated address not returned to participant'; end if;
end $$;

reset role;
update public.meeting_requests set proposed_at=now()+interval '1 day' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'own'<>'null'::jsonb then raise exception 'Reschedule revived grant'; end if;
  perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approximate',15,true,gen_random_uuid());
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222"}',true);
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'peer'<>'null'::jsonb then raise exception 'Pre-window peer disclosure'; end if;
  begin perform public.synera_location_sample('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'); raise exception 'Pre-window sample admitted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.meeting_location_grants set opens_at=now()-interval '1 hour',closes_at=now()-interval '1 minute';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'own'<>'null'::jsonb then raise exception 'Expired grant visible'; end if;
end $$;
reset role;
update public.meeting_requests set proposed_at=now()+interval '5 minutes' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
select public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approximate',15,true,gen_random_uuid());
insert into public.profile_blocks(blocker_id,blocked_id) values (auth.uid(),'22222222-2222-4222-8222-222222222222');
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'eligible'<>'false' then raise exception 'Block ignored'; end if;
end $$;
delete from public.profile_blocks where blocker_id=auth.uid();
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->'own'<>'null'::jsonb then raise exception 'Unblock revived old grant'; end if;
end $$;
select public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approximate',15,true,gen_random_uuid());
reset role;
update public.meeting_requests set status='cancelled' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111"}',true);
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'eligible'<>'false' then raise exception 'Cancellation ignored'; end if;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',15,true,gen_random_uuid()); raise exception 'Cancelled meeting renewed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.meeting_requests set status='accepted' where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approximate',15,true,gen_random_uuid());
update public.match_case_approvals set withdrawn_at=now() where case_id='location-ab' and party_id=auth.uid();
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'eligible'<>'false' then raise exception 'Withdrawn approval ignored'; end if;
end $$;
reset role;
do $$ declare r text; f text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      if has_table_privilege(r,'public.meeting_location_grants','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous location grants'; end if;
      foreach f in array array['synera_location_grant(uuid,text,integer,boolean,uuid)','synera_location_access(uuid)','synera_location_revoke(uuid)','synera_location_sample(uuid)'] loop
        if has_function_privilege(r,'public.'||f,'EXECUTE') then raise exception 'Anonymous location RPC'; end if;
      end loop;
    end if;
  end loop;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='meeting_location_grants' and column_name in ('lat','lon','sample','accuracy')) then raise exception 'Coordinates in database'; end if;
end $$;
select 'PASS: location identity, independent consent, isolation, windows, rotation, withdrawal, reschedule, block, cancellation, anonymous denial';
rollback;
