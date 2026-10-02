-- Generated from supabase/group-room.proposal.sql; NOT APPLIED.
-- Source SHA256=335c9ec9784a4a1bafaaf7afa247c74738a33ab4204018d2384c6ce1f891f86d
-- REVIEW PROPOSAL, NOT APPLIED. Additive migration after real-pilot.proposal.sql.
-- The companion Neon generator injects its verified-member admission into the
-- same private eligibility helper. This Supabase source uses public.synera_user_id() and the
-- current pilot consent.
-- No table grants are given to clients: all mutations are authenticated RPCs.
begin;
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
  -- accepted_at is retained as historical evidence after an explicit leave.
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

-- Private helpers have no execute grants. Eligibility is re-evaluated at every RPC:
-- a changed visibility, block, withdrawn consent, or expired policy removes access.
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
-- Reuses the established shared admission bucket. It intentionally does not
-- replace synera_limit_writes(): room RPCs have no client table writes that a
-- trigger can observe, so they call this private derived-identity helper.
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

-- These policies express the participant-only boundary even though clients receive
-- no table SELECT grants. SECURITY DEFINER RPCs use their own explicit checks.
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
commit;