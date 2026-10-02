-- Generated from supabase/meeting-location.proposal.sql. NOT APPLIED.
-- Source SHA256=5203fe73d74a578ca74e1c3213024fc431cafca955312f10c0043bcc56e7c123
-- REVIEW PROPOSAL. Additive; apply after case-state.proposal.sql.
-- Consent metadata only. Coordinates NEVER enter Postgres: the worker's KV
-- binding keeps one coarsened sample with absolute expiration at closes_at.
begin;
do $$ begin
  if to_regclass('public.match_case_approvals') is null then raise exception 'Apply case-state migration first'; end if;
  if to_regclass('public.meeting_location_grants') is not null then raise exception 'Inspect existing location schema'; end if;
end $$;

-- The original city choice stays intact; an accepted meeting can add its exact
-- agreed address. Changing that address invalidates existing GPS permissions.
alter table public.meeting_requests add column meeting_address text not null default '' check (char_length(meeting_address)<=200);
grant update (meeting_address) on public.meeting_requests to authenticated;
create policy meeting_address_participants on public.meeting_requests for update to authenticated
  using (status='accepted' and public.synera_user_id() in (sender_id,recipient_id))
  with check (status='accepted' and public.synera_user_id() in (sender_id,recipient_id));
-- UPDATE column privileges combine with older permissive response/cancel
-- policies. Guard the old/new row transition independently of that union.
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

-- Private helpers are not callable over the Data API. Fixed search paths and
-- fully qualified tables; caller identity always comes from the verified JWT.
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

-- Monotone sample admission contains no coordinates. An out-of-order KV write
-- can make the latest point temporarily unavailable, but cannot expose an older
-- point: the worker reads only the exact current sequence after authorization.
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
commit;