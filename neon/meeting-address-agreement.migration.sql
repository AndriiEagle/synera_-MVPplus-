-- REVIEW ONLY. NOT APPLIED TO PRODUCTION. After case-state, group-room and
-- meeting-location. Preserves the old generated migrations and GPS triggers.
-- A proposal is not an agreed destination. Only its other participant may accept.
begin;
do $$ begin
  if to_regclass('public.meeting_location_grants') is null
    or to_regprocedure('public.synera_room_current_member(uuid)') is null then
    raise exception 'Apply meeting-location and group-room proposals first';
  end if;
  if to_regclass('public.meeting_address_events') is not null then raise exception 'Inspect existing address agreement schema'; end if;
end $$;

-- Close the old single-participant PATCH path; status response/cancel grants stay.
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
commit;
