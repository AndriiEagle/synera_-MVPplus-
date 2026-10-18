-- Hand-authored Neon additive migration, NOT APPLIED. No generated SQL is edited.
-- Apply AFTER schema, case-state, group-room, meeting-location and address/outcome migrations.
-- Application-data erasure/deactivation only: provider Auth and retained shared evidence remain.
begin;
do $$ begin
  if to_regprocedure('public.synera_pilot_member()') is null
    or to_regclass('public.group_rooms') is null or to_regclass('public.meeting_address_events') is null
    or to_regclass('public.match_outcome_events') is null then
    raise exception 'Apply the complete reviewed Neon journey stack first';
  end if;
  if to_regclass('public.profile_erasures') is not null then raise exception 'Inspect existing erasure migration'; end if;
end $$;

-- Minimal identity tombstone is retained to reject still-valid provider JWTs and re-creation.
-- No Auth FK: later provider deletion must not remove the denial record or erase shared evidence.
create table public.profile_erasures (
  user_id uuid primary key,
  erased_at timestamptz not null default now(),
  provider_deletion text not null default 'pending' check(provider_deletion = 'pending')
);
alter table public.profile_erasures enable row level security;
revoke all on public.profile_erasures from public, authenticated;

-- Same existing admission boundary, now denying tombstoned identities even if re-admitted.
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

-- Acquire caller admission lock BEFORE either UPDATE tuple locks or INSERT conflict handling.
-- A row trigger alone runs too late for UPDATE and too early for UPSERT: opposite lock orders.
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

-- Defense against a write admitted before erasure. The preceding statement lock serializes
-- caller writes; this volatile definer reads only the new row's private tombstone after waits.
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
-- PROFILE-ERASURE-OUTCOME-GUARD-BEGIN
-- Derived from neon/case-outcome.migration.sql; original applied source is preserved.
-- Source SHA256=5cd6a796b2abe15c01661074e192cc8d0e3de860ca1883855e10a5f5a7073ef6
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
-- PROFILE-ERASURE-OUTCOME-GUARD-END
commit;
