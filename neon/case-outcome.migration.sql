-- REVIEW ONLY, NOT APPLIED TO PRODUCTION. Additive after case-state and group-room.
-- This records participant attestations, not independently verified execution.
begin;
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
-- Clients have no table/sequence grants. Only the guarded RPC can read/append;
-- neither a caller nor a direct Data API request can rewrite the event history.

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
commit;
