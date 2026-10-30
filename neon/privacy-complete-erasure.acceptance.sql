-- Disposable PostgreSQL only. Called after the privacy acceptance fixture exists.
-- The runner verifies output and then drops the disposable database.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_complete_erase_application_data();
reset role;
do $$ begin
  if exists(select 1 from public.pilot_consents where user_id='11111111-1111-4111-8111-111111111111') then raise exception 'Consent remained'; end if;
  if exists(select 1 from public.meeting_requests where sender_id='11111111-1111-4111-8111-111111111111' or recipient_id='11111111-1111-4111-8111-111111111111') then raise exception 'Meeting remained'; end if;
  if not exists(select 1 from public.profile_erasures where user_id='11111111-1111-4111-8111-111111111111') then raise exception 'Stale-session tombstone missing'; end if;
  if exists(select 1 from public.profile_reports where reporter_id='11111111-1111-4111-8111-111111111111') then raise exception 'Actor-authored report remained'; end if;
  if not exists(select 1 from public.profile_reports r where reporter_id='22222222-2222-4222-8222-222222222222' and detail='Safety evidence'
    and reported_id <> '11111111-1111-4111-8111-111111111111' and (to_jsonb(r)->>'safety_hold_until')::timestamptz > now()
    and (to_jsonb(r)->>'safety_hold_until')::timestamptz <= now()+interval '90 days') then raise exception 'Peer complaint or bounded tombstone hold lost'; end if;
end $$;
reset role;
select 'PRIVACY_COMPLETE_ERASURE_ACCEPTANCE_PASS';
rollback;
