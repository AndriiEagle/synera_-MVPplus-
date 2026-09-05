-- REVIEW PROPOSAL, NOT APPLIED. Applies after schema.sql ONLY.
-- Replaces the older un-applied pilot-consent.proposal.sql; do not apply both.
-- Generate a named CLI migration from this reviewed proposal when a CLI is available.
-- The live Auth gateway remains restricted. DDL is a separately approved launch action.
begin;
do $$ begin
  if to_regclass('public.pilot_consents') is not null then
    raise exception 'Inspect existing consent schema before applying this proposal';
  end if;
end $$;

create table public.pilot_consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null check (policy_version = '2026-09-05-pilot-2'),
  terms_accepted boolean not null check (terms_accepted),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  accepted_at timestamptz not null default now(),
  primary key (user_id, policy_version)
);
alter table public.pilot_consents enable row level security;
revoke all on public.pilot_consents from public, anon, authenticated;
grant select on public.pilot_consents to authenticated;
grant insert (user_id, policy_version, terms_accepted, privacy_acknowledged) on public.pilot_consents to authenticated;
create policy consent_read on public.pilot_consents for select to authenticated using (user_id = (select auth.uid()));
create policy consent_create on public.pilot_consents for insert to authenticated with check (user_id = (select auth.uid()));

create function public.synera_valid_brief(b jsonb) returns boolean
language plpgsql immutable security invoker set search_path = '' as $$
declare k text; item text; keys text[] := array['version','goal','offer_tags','need_tags','languages','modes','available_from','available_until','remote','max_km','city_code','confidentiality','accepts_confidentiality'];
begin
  if jsonb_typeof(b) is distinct from 'object' or not b ?& keys or b - keys <> '{}'::jsonb or b->'version' is distinct from '1'::jsonb then return false; end if;
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
    if jsonb_array_length(b->k) > 7 then return false; end if;
    for item in select jsonb_array_elements_text(b->k) loop
      if k in ('offer_tags','need_tags') and item not in ('automation','design','research','sales','video','finance','events') then return false; end if;
      if k = 'languages' and item not in ('uk','en','de','fr') then return false; end if;
      if k = 'modes' and item not in ('exchange','joint_project') then return false; end if;
      if item is null then return false; end if;
    end loop;
    if (select count(distinct v) from jsonb_array_elements_text(b->k) v) <> jsonb_array_length(b->k) then return false; end if;
  end loop;
  foreach k in array array['available_from','available_until'] loop
    if b->>k <> '' and ((b->>k) !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char((b->>k)::date, 'YYYY-MM-DD') <> b->>k) then return false; end if;
  end loop;
  if b->>'available_from' <> '' and b->>'available_until' <> '' and b->>'available_from' > b->>'available_until' then return false; end if;
  return true;
exception when others then return false;
end $$;
revoke all on function public.synera_valid_brief(jsonb) from public, anon, authenticated;
grant execute on function public.synera_valid_brief(jsonb) to authenticated;

alter table public.profiles
  add column brief jsonb not null default '{"version":1,"goal":"","offer_tags":[],"need_tags":[],"languages":[],"modes":[],"available_from":"","available_until":"","remote":false,"max_km":25,"city_code":"","confidentiality":false,"accepts_confidentiality":false}',
  add column map_visible boolean not null default false,
  add column updated_at timestamptz not null default now(),
  add constraint profile_brief_shape check (public.synera_valid_brief(brief)),
  add constraint profile_map_consent check (not map_visible or is_discoverable),
  add constraint published_brief_complete check (not is_discoverable or (
    length(btrim(brief->>'goal')) > 0 and jsonb_array_length(brief->'offer_tags') > 0 and jsonb_array_length(brief->'need_tags') > 0
    and jsonb_array_length(brief->'languages') > 0 and jsonb_array_length(brief->'modes') > 0
    and brief->>'available_from' <> '' and brief->>'available_until' <> ''
    and (brief->>'city_code' <> '' or brief->'remote' = 'true'::jsonb)));
grant insert (brief, map_visible), update (brief, map_visible) on public.profiles to authenticated;
create function public.synera_touch_profile() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
revoke all on function public.synera_touch_profile() from public, anon, authenticated;
create trigger synera_profile_updated before update on public.profiles for each row execute function public.synera_touch_profile();

create policy profiles_consent on public.profiles as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select auth.uid()) and c.policy_version = '2026-09-05-pilot-2'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select auth.uid()) and c.policy_version = '2026-09-05-pilot-2'));
create policy meetings_consent on public.meeting_requests as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select auth.uid()) and c.policy_version = '2026-09-05-pilot-2'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select auth.uid()) and c.policy_version = '2026-09-05-pilot-2'));

create table public.profile_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id), check (blocker_id <> blocked_id)
);
create index profile_blocks_target on public.profile_blocks(blocked_id, blocker_id);
alter table public.profile_blocks enable row level security;
revoke all on public.profile_blocks from public, anon, authenticated;
grant select, delete on public.profile_blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.profile_blocks to authenticated;
-- Both participants can observe a block. This explicit boundary avoids an RLS-bypassing definer function.
create policy blocks_read on public.profile_blocks for select to authenticated using ((select auth.uid()) in (blocker_id, blocked_id));
create policy blocks_create on public.profile_blocks for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete on public.profile_blocks for delete to authenticated using (blocker_id = (select auth.uid()));
create policy profiles_unblocked on public.profiles as restrictive for select to authenticated using (
  not exists (select 1 from public.profile_blocks b where (b.blocker_id = (select auth.uid()) and b.blocked_id = profiles.id) or (b.blocked_id = (select auth.uid()) and b.blocker_id = profiles.id)));

alter table public.meeting_requests drop constraint meeting_requests_status_check;
alter table public.meeting_requests
  add constraint meeting_requests_status_check check (status in ('pending','accepted','declined','cancelled')),
  add column proposed_at timestamptz,
  add column duration_minutes integer check (duration_minutes in (20,30,60)),
  add column meeting_place text check (meeting_place in ('Онлайн','Zürich','Winterthur','Zug','Basel','Bern')),
  add column sender_name text not null default '' check (length(sender_name) <= 60),
  add column recipient_name text not null default '' check (length(recipient_name) <= 60);
grant insert (proposed_at, duration_minutes, meeting_place) on public.meeting_requests to authenticated;
create function public.synera_meeting_names() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  -- The caller can read their own profile and the opted-in recipient. Names are server-controlled.
  select display_name into new.sender_name from public.profiles where id = new.sender_id;
  select display_name into new.recipient_name from public.profiles where id = new.recipient_id;
  if new.sender_name is null or new.recipient_name is null then raise exception 'Participant unavailable'; end if;
  return new;
end $$;
revoke all on function public.synera_meeting_names() from public, anon, authenticated;
create trigger meeting_names before insert on public.meeting_requests for each row execute function public.synera_meeting_names();
create unique index meetings_pending_pair on public.meeting_requests(least(sender_id,recipient_id),greatest(sender_id,recipient_id)) where status = 'pending';
create policy meetings_plan on public.meeting_requests as restrictive for insert to authenticated
with check (proposed_at > now() and proposed_at <= now() + interval '90 days' and duration_minutes is not null and meeting_place is not null
  and not exists (select 1 from public.profile_blocks b where (b.blocker_id = sender_id and b.blocked_id = recipient_id) or (b.blocked_id = sender_id and b.blocker_id = recipient_id)));
create policy meetings_cancel on public.meeting_requests for update to authenticated using ((select auth.uid()) = sender_id and status in ('pending','accepted'))
with check ((select auth.uid()) = sender_id and status = 'cancelled');
create policy meetings_response_unblocked on public.meeting_requests as restrictive for update to authenticated
using (true) with check (status <> 'accepted' or (proposed_at > now()
  and not exists (select 1 from public.profile_blocks b where (b.blocker_id = sender_id and b.blocked_id = recipient_id) or (b.blocked_id = sender_id and b.blocker_id = recipient_id))));

create table public.meeting_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_meeting on public.meeting_messages(meeting_id, created_at desc);
create index messages_sender on public.meeting_messages(sender_id, created_at desc);
alter table public.meeting_messages enable row level security;
revoke all on public.meeting_messages from public, anon, authenticated;
grant select on public.meeting_messages to authenticated;
grant insert (meeting_id, sender_id, body) on public.meeting_messages to authenticated;
create policy messages_read on public.meeting_messages for select to authenticated using (
  exists (select 1 from public.meeting_requests m where m.id = meeting_id and (select auth.uid()) in (m.sender_id,m.recipient_id)));
create policy messages_create on public.meeting_messages for insert to authenticated with check (sender_id = (select auth.uid()) and
  exists (select 1 from public.meeting_requests m where m.id = meeting_id and m.status = 'accepted' and (select auth.uid()) in (m.sender_id,m.recipient_id)
    and not exists (select 1 from public.profile_blocks b where (b.blocker_id = m.sender_id and b.blocked_id = m.recipient_id) or (b.blocked_id = m.sender_id and b.blocker_id = m.recipient_id))));

create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam','impersonation','harassment','other')),
  detail text not null default '' check (length(detail) <= 500),
  created_at timestamptz not null default now(), check (reporter_id <> reported_id)
);
create index reports_reporter on public.profile_reports(reporter_id, created_at desc);
create index reports_target on public.profile_reports(reported_id, created_at desc);
alter table public.profile_reports enable row level security;
revoke all on public.profile_reports from public, anon, authenticated;
grant select on public.profile_reports to authenticated;
grant insert (reporter_id, reported_id, reason, detail) on public.profile_reports to authenticated;
create policy reports_read on public.profile_reports for select to authenticated using (reporter_id = (select auth.uid()));
create policy reports_create on public.profile_reports for insert to authenticated with check (reporter_id = (select auth.uid())
  and exists (select 1 from public.pilot_consents c where c.user_id = (select auth.uid()) and c.policy_version = '2026-09-05-pilot-2'));

-- Admission counters survive profile deletion; deleting/recreating a profile cannot reset the limit.
-- No client grants or policies: callers cannot edit their own counters. This is not an AI spend ledger.
create table public.synera_write_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  invitations integer not null default 0,
  messages integer not null default 0,
  reports integer not null default 0
);
alter table public.synera_write_limits enable row level security;
revoke all on public.synera_write_limits from public, anon, authenticated, service_role;
-- SECURITY DEFINER is confined to anti-abuse admission: fixed table/columns, no caller-supplied ID,
-- no dynamic SQL, fixed empty search_path, no execute grant, and callable only as these triggers.
-- INVOKER cannot update the protected counter; granting client UPDATE would defeat this boundary.
create function public.synera_limit_writes() returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); counter public.synera_write_limits%rowtype;
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if tg_table_name not in ('meeting_requests','meeting_messages','profile_reports') then raise exception 'Unsupported trigger'; end if;
  insert into public.synera_write_limits(user_id) values (actor) on conflict (user_id) do nothing;
  select * into counter from public.synera_write_limits where user_id = actor for update;
  if counter.window_started_at <= now() - interval '1 day' then
    update public.synera_write_limits set invitations=0,messages=0,reports=0,window_started_at=now() where user_id=actor returning * into counter;
  end if;
  if tg_table_name = 'meeting_requests' then
    if new.sender_id <> actor or counter.invitations >= 20 then raise exception 'Invitation limit or invalid sender'; end if;
    update public.synera_write_limits set invitations=invitations+1 where user_id=actor;
  elsif tg_table_name = 'meeting_messages' then
    if new.sender_id <> actor or counter.messages >= 100 then raise exception 'Message limit or invalid sender'; end if;
    update public.synera_write_limits set messages=messages+1 where user_id=actor;
  elsif tg_table_name = 'profile_reports' then
    if new.reporter_id <> actor or counter.reports >= 10 then raise exception 'Report limit or invalid sender'; end if;
    update public.synera_write_limits set reports=reports+1 where user_id=actor;
  end if;
  return new;
end $$;
revoke all on function public.synera_limit_writes() from public, anon, authenticated;
create trigger invitations_rate before insert on public.meeting_requests for each row execute function public.synera_limit_writes();
create trigger messages_rate before insert on public.meeting_messages for each row execute function public.synera_limit_writes();
create trigger reports_rate before insert on public.profile_reports for each row execute function public.synera_limit_writes();
commit;
