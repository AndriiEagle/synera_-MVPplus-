-- DISPOSABLE EMPTY database/branch ONLY. Never run on production.
-- Refuses any existing product table. A local identity shim is supplied by tests, never by production SQL.
BEGIN;
DO $replay$ BEGIN if to_regclass('public.profiles') is not null then raise exception 'Disposable EMPTY database required'; end if; END $replay$;
do $$ begin
  if to_regclass('neon_auth."user"') is null or to_regprocedure('auth.uid()') is null then raise exception 'Enable Neon Auth and Data API first'; end if;
  if to_regclass('public.profiles') is not null then raise exception 'Target is not empty; inspect before migration'; end if;
  if (select data_type from information_schema.columns where table_schema='neon_auth' and table_name='user' and column_name='id') is distinct from 'uuid' then raise exception 'Inspect Neon identity type before migration'; end if;
end $$;
revoke create on schema public from public, authenticated;
grant usage on schema public to authenticated;
create function public.synera_user_id() returns uuid
language sql stable security invoker return auth.uid();
revoke all on function public.synera_user_id() from public;
grant execute on function public.synera_user_id() to authenticated;
create table public.profiles (
  id uuid primary key references neon_auth."user"(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  city text not null default '' check (char_length(city) <= 80),
  offers text not null default '' check (char_length(offers) <= 300),
  seeks text not null default '' check (char_length(seeks) <= 300),
  is_discoverable boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, authenticated;
grant select, delete on public.profiles to authenticated;
grant insert (id, display_name, city, offers, seeks, is_discoverable),
      update (id, display_name, city, offers, seeks, is_discoverable)
      on public.profiles to authenticated;
create policy profiles_read on public.profiles for select to authenticated
  using ((select public.synera_user_id()) = id or is_discoverable);
create policy profiles_create on public.profiles for insert to authenticated
  with check ((select public.synera_user_id()) = id);
create policy profiles_update on public.profiles for update to authenticated
  using ((select public.synera_user_id()) = id) with check ((select public.synera_user_id()) = id);
create policy profiles_delete on public.profiles for delete to authenticated
  using ((select public.synera_user_id()) = id);
create table public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  note text not null check (char_length(btrim(note)) between 1 and 500),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index meeting_requests_recipient on public.meeting_requests(recipient_id, created_at desc);
create index meeting_requests_sender on public.meeting_requests(sender_id, created_at desc);
create unique index meeting_requests_pending on public.meeting_requests(sender_id, recipient_id) where status = 'pending';
alter table public.meeting_requests enable row level security;
revoke all on public.meeting_requests from public, authenticated;
grant select on public.meeting_requests to authenticated;
grant insert (sender_id, recipient_id, note) on public.meeting_requests to authenticated;
grant update (status) on public.meeting_requests to authenticated;
create policy meetings_read on public.meeting_requests for select to authenticated
  using ((select public.synera_user_id()) in (sender_id, recipient_id));
create policy meetings_create on public.meeting_requests for insert to authenticated
  with check ((select public.synera_user_id()) = sender_id and status = 'pending'
    and exists (select 1 from public.profiles p where p.id = recipient_id and p.is_discoverable));
create policy meetings_respond on public.meeting_requests for update to authenticated
  using ((select public.synera_user_id()) = recipient_id and status = 'pending')
  with check ((select public.synera_user_id()) = recipient_id and status in ('accepted', 'declined'));
do $$ begin
  if to_regclass('public.pilot_consents') is not null then
    raise exception 'Inspect existing consent schema before applying this proposal';
  end if;
end $$;
create table public.pilot_consents (
  user_id uuid not null references neon_auth."user"(id) on delete cascade,
  policy_version text not null check (policy_version = '2026-09-05-pilot-3'),
  terms_accepted boolean not null check (terms_accepted),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  accepted_at timestamptz not null default now(),
  primary key (user_id, policy_version)
);
alter table public.pilot_consents enable row level security;
revoke all on public.pilot_consents from public, authenticated;
grant select on public.pilot_consents to authenticated;
grant insert (user_id, policy_version, terms_accepted, privacy_acknowledged) on public.pilot_consents to authenticated;
create policy consent_read on public.pilot_consents for select to authenticated using (user_id = (select public.synera_user_id()));
create policy consent_create on public.pilot_consents for insert to authenticated with check (user_id = (select public.synera_user_id()));
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
revoke all on function public.synera_valid_brief(jsonb) from public, authenticated;
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
revoke all on function public.synera_touch_profile() from public, authenticated;
create trigger synera_profile_updated before update on public.profiles for each row execute function public.synera_touch_profile();
create policy profiles_consent on public.profiles as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
create policy meetings_consent on public.meeting_requests as restrictive for all to authenticated
using (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'))
with check (exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
create table public.profile_blocks (
  blocker_id uuid not null references neon_auth."user"(id) on delete cascade,
  blocked_id uuid not null references neon_auth."user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id), check (blocker_id <> blocked_id)
);
create index profile_blocks_target on public.profile_blocks(blocked_id, blocker_id);
alter table public.profile_blocks enable row level security;
revoke all on public.profile_blocks from public, authenticated;
grant select, delete on public.profile_blocks to authenticated;
grant insert (blocker_id, blocked_id) on public.profile_blocks to authenticated;
create policy blocks_read on public.profile_blocks for select to authenticated using ((select public.synera_user_id()) in (blocker_id, blocked_id));
create policy blocks_create on public.profile_blocks for insert to authenticated with check (blocker_id = (select public.synera_user_id()));
create policy blocks_delete on public.profile_blocks for delete to authenticated using (blocker_id = (select public.synera_user_id()));
create policy profiles_unblocked on public.profiles as restrictive for select to authenticated using (
  not exists (select 1 from public.profile_blocks b where (b.blocker_id = (select public.synera_user_id()) and b.blocked_id = profiles.id) or (b.blocked_id = (select public.synera_user_id()) and b.blocker_id = profiles.id)));
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
revoke all on function public.synera_meeting_names() from public, authenticated;
create trigger meeting_names before insert on public.meeting_requests for each row execute function public.synera_meeting_names();
create unique index meetings_pending_pair on public.meeting_requests(least(sender_id,recipient_id),greatest(sender_id,recipient_id)) where status = 'pending';
create policy meetings_plan on public.meeting_requests as restrictive for insert to authenticated
with check (proposed_at > now() and proposed_at <= now() + interval '90 days' and duration_minutes is not null and meeting_place is not null
  and not exists (select 1 from public.profile_blocks b where (b.blocker_id = sender_id and b.blocked_id = recipient_id) or (b.blocked_id = sender_id and b.blocker_id = recipient_id)));
create policy meetings_cancel on public.meeting_requests for update to authenticated using ((select public.synera_user_id()) = sender_id and status in ('pending','accepted'))
with check ((select public.synera_user_id()) = sender_id and status = 'cancelled');
create policy meetings_response_unblocked on public.meeting_requests as restrictive for update to authenticated
using (true) with check (status <> 'accepted' or (proposed_at > now()
  and not exists (select 1 from public.profile_blocks b where (b.blocker_id = sender_id and b.blocked_id = recipient_id) or (b.blocked_id = sender_id and b.blocker_id = recipient_id))));
create table public.meeting_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_requests(id) on delete cascade,
  sender_id uuid not null references neon_auth."user"(id) on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_meeting on public.meeting_messages(meeting_id, created_at desc);
create index messages_sender on public.meeting_messages(sender_id, created_at desc);
alter table public.meeting_messages enable row level security;
revoke all on public.meeting_messages from public, authenticated;
grant select on public.meeting_messages to authenticated;
grant insert (meeting_id, sender_id, body) on public.meeting_messages to authenticated;
create policy messages_read on public.meeting_messages for select to authenticated using (
  exists (select 1 from public.meeting_requests m where m.id = meeting_id and (select public.synera_user_id()) in (m.sender_id,m.recipient_id)));
create policy messages_create on public.meeting_messages for insert to authenticated with check (sender_id = (select public.synera_user_id()) and
  exists (select 1 from public.meeting_requests m where m.id = meeting_id and m.status = 'accepted' and (select public.synera_user_id()) in (m.sender_id,m.recipient_id)
    and not exists (select 1 from public.profile_blocks b where (b.blocker_id = m.sender_id and b.blocked_id = m.recipient_id) or (b.blocked_id = m.sender_id and b.blocker_id = m.recipient_id))));
create table public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references neon_auth."user"(id) on delete cascade,
  reported_id uuid not null references neon_auth."user"(id) on delete cascade,
  reason text not null check (reason in ('spam','impersonation','harassment','other')),
  detail text not null default '' check (length(detail) <= 500),
  created_at timestamptz not null default now(), check (reporter_id <> reported_id)
);
create index reports_reporter on public.profile_reports(reporter_id, created_at desc);
create index reports_target on public.profile_reports(reported_id, created_at desc);
alter table public.profile_reports enable row level security;
revoke all on public.profile_reports from public, authenticated;
grant select on public.profile_reports to authenticated;
grant insert (reporter_id, reported_id, reason, detail) on public.profile_reports to authenticated;
create policy reports_read on public.profile_reports for select to authenticated using (reporter_id = (select public.synera_user_id()));
create policy reports_create on public.profile_reports for insert to authenticated with check (reporter_id = (select public.synera_user_id())
  and exists (select 1 from public.pilot_consents c where c.user_id = (select public.synera_user_id()) and c.policy_version = '2026-09-05-pilot-3'));
create table public.synera_write_limits (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  invitations integer not null default 0,
  messages integer not null default 0,
  reports integer not null default 0
);
alter table public.synera_write_limits enable row level security;
revoke all on public.synera_write_limits from public, authenticated;
create function public.synera_limit_writes() returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := public.synera_user_id(); counter public.synera_write_limits%rowtype;
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
revoke all on function public.synera_limit_writes() from public, authenticated;
create trigger invitations_rate before insert on public.meeting_requests for each row execute function public.synera_limit_writes();
create trigger messages_rate before insert on public.meeting_messages for each row execute function public.synera_limit_writes();
create trigger reports_rate before insert on public.profile_reports for each row execute function public.synera_limit_writes();
create table public.synera_pilot_members (
  email text primary key check (email=lower(btrim(email)) and length(email) between 3 and 254),
  created_at timestamptz not null default now()
);
alter table public.synera_pilot_members enable row level security;
revoke all on public.synera_pilot_members from public, authenticated;
create function public.synera_pilot_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from neon_auth."user" u join public.synera_pilot_members m on m.email=lower(u.email)
    where u.id=(select public.synera_user_id()) and u."emailVerified"=true
  );
$$;
revoke all on function public.synera_pilot_member() from public, authenticated;
grant execute on function public.synera_pilot_member() to authenticated;
create policy synera_members_only on public.profiles as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
create policy synera_members_only on public.pilot_consents as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
create policy synera_members_only on public.meeting_requests as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
create policy synera_members_only on public.meeting_messages as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
create policy synera_members_only on public.profile_blocks as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
create policy synera_members_only on public.profile_reports as restrictive for all to authenticated
  using ((select public.synera_pilot_member())) with check ((select public.synera_pilot_member()));
do $$ declare r text; t text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach t in array array['profiles','pilot_consents','meeting_requests','meeting_messages','profile_blocks','profile_reports','synera_write_limits','synera_pilot_members'] loop
        execute format('revoke all on public.%I from %I',t,r);
      end loop;
      execute format('revoke all on function public.synera_pilot_member() from %I',r);
      execute format('revoke all on function public.synera_limit_writes() from %I',r);
    end if;
  end loop;
end $$;
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);

insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now()),
('44444444-4444-4444-8444-444444444444','Uninvited','uninvited@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  if public.synera_user_id() is distinct from '44444444-4444-4444-8444-444444444444' then raise exception 'JWT fixture context unsupported; inspect auth.uid without replacing it'; end if;
  if public.synera_pilot_member() then raise exception 'Uninvited member passed'; end if;
  begin
    insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
      values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
    raise exception 'Uninvited user entered pilot';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.synera_pilot_members; raise exception 'Invited emails leaked'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Acceptance fixture','Product design','B2B sales',id='22222222-2222-4222-8222-222222222222',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('joint_project'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.profiles) then raise exception 'Consent gate bypassed'; end if;
end $$;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
 values ('11111111-1111-4111-8111-111111111111','2026-09-05-pilot-3',true,true);
do $$ begin
  if (select count(*) from public.profiles) <> 2 then raise exception 'Owner/private/visible boundary failed'; end if;
  begin
    update public.profiles set updated_at=now()-interval '2 years' where id=public.synera_user_id();
    raise exception 'Client changed freshness timestamp';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set brief=brief || '{"admin":true}'::jsonb where id=public.synera_user_id();
    raise exception 'Unknown brief key accepted';
  exception when check_violation then null; end;
  begin
    update public.synera_write_limits set invitations=0;
    raise exception 'Client changed admission counter';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
 values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Acceptance only',now()+interval '1 day',20,'Онлайн');
do $$ begin
  if (select sender_name from public.meeting_requests limit 1) <> 'Acceptance fixture' then raise exception 'Server name snapshot failed'; end if;
  begin
    update public.meeting_requests set status='accepted';
    raise exception 'Sender accepted their own invitation';
  exception when insufficient_privilege then null; end;
  begin
    update public.meeting_requests set sender_name='Forged';
    raise exception 'Client forged identity snapshot';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Before acceptance' from public.meeting_requests;
    raise exception 'Messaging allowed before acceptance';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
do $$ begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Third-party conversation leak'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
update public.meeting_requests set status='accepted';
do $$ begin if not exists(select 1 from public.meeting_requests where status='accepted') then raise exception 'Recipient acceptance failed'; end if; end $$;
insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Accepted conversation' from public.meeting_requests;
insert into public.profile_blocks(blocker_id,blocked_id) values (public.synera_user_id(),'11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.profiles where id='22222222-2222-4222-8222-222222222222') then raise exception 'Block did not hide peer'; end if;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Blocked message' from public.meeting_requests;
    raise exception 'Message passed block';
  exception when insufficient_privilege then null; end;
end $$;
delete from public.profile_blocks;
reset role;
do $$ begin if (select count(*) from public.profile_blocks) <> 1 then raise exception 'Block owner boundary failed'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
delete from public.profile_blocks where blocker_id=public.synera_user_id();
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
delete from public.profiles where id=public.synera_user_id();
reset role;
do $$ begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Profile deletion did not cascade'; end if;
  if (select invitations from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111') <> 1 then raise exception 'Profile deletion reset admission'; end if;
end $$;
do $$ declare r text; t text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach t in array array['profiles','pilot_consents','meeting_requests','meeting_messages','profile_blocks','profile_reports','synera_pilot_members','synera_write_limits'] loop
        if has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous table grants remain'; end if;
      end loop;
    end if;
  end loop;
end $$;
select 'PASS: consent, private profiles, shape/column grants, invitation ownership, names, messaging, blocks, third-party isolation, deletion and retained admission counters' as result;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- case-state.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);

insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Case fixture','Product design','B2B sales',id <> '33333333-3333-4333-8333-333333333333',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$
declare open_terms jsonb := '{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"sales","target":"Review one offer"}],"trial":{"starts_on":"2026-09-20","due_on":"2026-09-30","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"sales","target":"One review","acceptance_criteria":"Receiver accepts this version"}]},"compensation":{"status":"unresolved","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":null,"confidentiality":"unresolved","intellectual_property":"unresolved","cancellation":"unresolved"}}';
begin
    update public.profiles set brief = brief || '{"version":2,"modes":["exchange","paid_service"],"mode_details":{"paid_service":{"role":"buyer"},"referral":{"role":"","benefitTags":[],"sourceDeclared":false,"recipientScopeDeclared":false,"thirdPartyStatus":"not_consulted"},"hybrid":{"components":[]}}}'::jsonb where id = public.synera_user_id();
  begin
    update public.profiles set brief = brief || '{"version":2,"modes":["exchange"]}'::jsonb where id = public.synera_user_id();
    raise exception 'Version 2 accepted without a pilot mode';
  exception when check_violation then null; end;
  begin
    update public.profiles set brief = brief || '{"mode_details":{"paid_service":{"role":"owner"},"referral":{"role":"","benefitTags":[],"sourceDeclared":false,"recipientScopeDeclared":false,"thirdPartyStatus":"not_consulted"},"hybrid":{"components":[]}}}'::jsonb where id = public.synera_user_id();
    raise exception 'Unknown paid-service role accepted';
  exception when check_violation then null; end;
  begin
    update public.profiles set brief = brief || '{"mode_details":{"paid_service":{"role":"buyer"},"referral":{"role":"","benefitTags":[],"sourceDeclared":false,"recipientScopeDeclared":false,"thirdPartyStatus":"trusted"},"hybrid":{"components":[]}}}'::jsonb where id = public.synera_user_id();
    raise exception 'Unknown third-party status accepted';
  exception when check_violation then null; end;

    begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at,version)
      values ('case-forged-version','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',open_terms,repeat('a',64),now()+interval '14 days',7);
    raise exception 'Client set the case version';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at,created_at)
      values ('case-forged-time','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',open_terms,repeat('a',64),now()+interval '14 days',now()-interval '1 year');
    raise exception 'Client forged the case timestamp';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
      values ('case-hidden-peer','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333','exchange',open_terms,repeat('a',64),now()+interval '14 days');
    raise exception 'Case opened with a hidden profile';
  exception when insufficient_privilege then null; end;
  insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
    values ('case-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',open_terms,repeat('a',64),now()+interval '14 days');
  if (select version from public.match_cases where case_id='case-ab') <> 1 then raise exception 'Case did not start at version 1'; end if;

    begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',public.synera_user_id(),1,repeat('a',64));
    raise exception 'Incomplete material approved';
  exception when insufficient_privilege then null; end;
  update public.match_cases set terms_hash = repeat('b',64), material = jsonb_set(jsonb_set(open_terms,'{compensation}','{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null}'),
    '{terms}','{"revision_limit":1,"confidentiality":"required","intellectual_property":"receiver","cancellation":"mutual_written_notice"}') where case_id='case-ab';
  if (select version from public.match_cases where case_id='case-ab') <> 2 then raise exception 'Material change did not raise the version'; end if;
  begin
    update public.match_cases set material = material || '{"mode":"exchange"}'::jsonb, terms_hash = repeat('b',64), mode = 'exchange' where case_id='case-ab';
    if (select version from public.match_cases where case_id='case-ab') <> 2 then raise exception 'Unchanged material raised the version'; end if;
  end;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',public.synera_user_id(),1,repeat('a',64));
    raise exception 'Stale version approved';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab','22222222-2222-4222-8222-222222222222',2,repeat('b',64));
    raise exception 'Approved on behalf of the other party';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash,approved_at) values ('case-ab',public.synera_user_id(),2,repeat('b',64),now()-interval '1 year');
    raise exception 'Client forged the approval timestamp';
  exception when insufficient_privilege then null; end;
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',public.synera_user_id(),2,repeat('b',64));

    begin
    insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
      values (public.synera_user_id(),'22222222-2222-4222-8222-222222222222','Before both approvals',now()+interval '1 day',20,'Онлайн');
    raise exception 'Invitation passed with one approval';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.match_cases) or exists(select 1 from public.match_case_approvals) then raise exception 'Third party read a case'; end if;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',public.synera_user_id(),2,repeat('b',64));
    raise exception 'Third party approved a case';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',public.synera_user_id(),2,repeat('b',64));
do $$ begin
  update public.match_case_approvals set withdrawn_at = now() where party_id = '11111111-1111-4111-8111-111111111111';
  if (select count(*) from public.match_case_approvals where withdrawn_at is null) <> 2 then raise exception 'Party withdrew the other party''s approval'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
  values (public.synera_user_id(),'22222222-2222-4222-8222-222222222222','After both approvals',now()+interval '1 day',20,'Онлайн');
do $$ begin
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) select id,public.synera_user_id(),'Before acceptance' from public.meeting_requests;
    raise exception 'Direct message passed before acceptance';
  exception when insufficient_privilege then null; end;
  update public.match_case_approvals set withdrawn_at = now() where party_id = public.synera_user_id();
  begin
    update public.match_case_approvals set withdrawn_at = null where party_id = public.synera_user_id();
    raise exception 'Withdrawn approval was restored';
  exception when raise_exception then null; end;
  update public.match_cases set terms_hash = repeat('c',64), material = jsonb_set(material,'{terms,revision_limit}','2') where case_id='case-ab';
  if (select version from public.match_cases where case_id='case-ab') <> 3 then raise exception 'Second material change did not raise the version'; end if;
  if exists(select 1 from public.match_case_approvals a join public.match_cases c using (case_id) where a.withdrawn_at is null and a.approved_version = c.version) then raise exception 'Approval stayed live after a material change'; end if;
  update public.match_cases set status = 'revoked' where case_id='case-ab';
  update public.match_cases set terms_hash = repeat('d',64), material = jsonb_set(material,'{terms,revision_limit}','3') where case_id='case-ab';
  if (select version from public.match_cases where case_id='case-ab') <> 3 or (select closed_at from public.match_cases where case_id='case-ab') is null then raise exception 'Revoked case changed or has no closing time'; end if;
  begin
    insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('case-ab',public.synera_user_id(),3,repeat('c',64));
    raise exception 'Revoked case approved';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
select 'case-expiring',participant_low,participant_high,mode,material,repeat('e',64),now()+interval '1 hour'
from public.match_cases where case_id='case-ab';
reset role;
update public.match_cases set expires_at=now()-interval '1 second' where case_id='case-expiring';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare denied boolean:=false; begin
  begin
    update public.match_cases set expires_at=now()+interval '7 days' where case_id='case-expiring';
  exception when raise_exception then
    if sqlerrm not in ('Case expired','Case identity is immutable') then raise; end if;
    denied:=true;
  end;
  if not denied then raise exception 'Expired case renewed'; end if;
  update public.match_cases set status='abandoned' where case_id='case-expiring';
  if not exists(select 1 from public.match_cases where case_id='case-expiring' and status='abandoned'
    and closed_at is not null and terms_hash=repeat('e',64)) then raise exception 'Expired case did not close with preserved material'; end if;
  insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
  select 'case-ab-reopened',participant_low,participant_high,mode,material,repeat('f',64),now()+interval '14 days'
  from public.match_cases where case_id='case-expiring';
  if not exists(select 1 from public.match_cases where case_id='case-ab-reopened' and status='open' and version=1)
    or exists(select 1 from public.match_case_approvals where case_id='case-ab-reopened') then raise exception 'New pair cycle inherited prior consent'; end if;
end $$;
do $$ declare m jsonb; denied boolean:=false; begin
  update public.meeting_requests set status='cancelled' where sender_id=public.synera_user_id() and status='pending';
  update public.match_cases set status='abandoned' where case_id='case-ab-reopened';
  select jsonb_set(jsonb_set(material,'{mode}','"joint_project"'),'{components}','["joint_project"]') into m
    from public.match_cases where case_id='case-ab';
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
      values ('project-missing-contribution','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','joint_project',m,repeat('1',64),now()+interval '14 days');
  exception when raise_exception then
    if sqlerrm <> 'Joint project requires each contribution and result' then raise; end if;
    denied:=true;
  end;
  if not denied then raise exception 'One-sided project accepted'; end if;
  m:=jsonb_set(m,'{outcomes}',m->'outcomes' || '[{"receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"design","target":"Agreed prototype"}]'::jsonb);
  m:=jsonb_set(m,'{trial,deliverables}',m#>'{trial,deliverables}' || '[{"giver_id":"11111111-1111-4111-8111-111111111111","receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"design","target":"Agreed prototype","acceptance_criteria":"Both participants review the prototype"}]'::jsonb);
  insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
    values ('case-project','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','joint_project',m,repeat('2',64),now()+interval '14 days');
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
    values ('case-project',public.synera_user_id(),1,repeat('2',64));
  begin
    insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
      values (public.synera_user_id(),'22222222-2222-4222-8222-222222222222','One-sided project',now()+interval '1 day',20,'Онлайн');
    raise exception 'One project approval opened invitation';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
  values ('case-project',public.synera_user_id(),1,repeat('2',64));
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
  values (public.synera_user_id(),'11111111-1111-4111-8111-111111111111','Bilateral project',now()+interval '1 day',20,'Онлайн');
update public.match_cases set terms_hash=repeat('3',64),material=jsonb_set(material,'{terms,revision_limit}','4') where case_id='case-project';
do $$ begin
  if exists(select 1 from public.match_case_approvals a join public.match_cases c using(case_id)
    where c.case_id='case-project' and a.withdrawn_at is null and a.approved_version=c.version) then raise exception 'Project revision inherited consent'; end if;
end $$;
update public.match_cases set status='abandoned' where case_id='case-project';
insert into public.profile_blocks(blocker_id,blocked_id) values (public.synera_user_id(),'11111111-1111-4111-8111-111111111111');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  begin
    insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
      select 'case-after-block',participant_low,participant_high,mode,material,repeat('e',64),now()+interval '14 days' from public.match_cases where case_id='case-ab';
    raise exception 'Case opened with a blocked peer';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare r text; t text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach t in array array['match_cases','match_case_approvals'] loop
        if has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous case grants remain'; end if;
      end loop;
    end if;
  end loop;
end $$;
select 'PASS: brief v2 shape, server-owned case version and time, incomplete/stale/forged approvals refused, third-party isolation, one-approval invitation refused, withdrawal final, material change ends live approvals, revoked case frozen, blocked peer, anonymous' as result;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- case-expiry-repair.migration.sql
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

-- meeting-status-guard.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);

insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Status fixture','Product design','B2B sales',true,
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where email like '%@synera-acceptance.example';
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where email like '%@synera-acceptance.example';
create function pg_temp.act(p_actor text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_actor, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.try_status(p_status text) returns text language plpgsql as $$
begin
  update public.meeting_requests set status = p_status where id = current_setting('synera.acceptance.meeting')::uuid;
  return '';
exception when others then return sqlstate;
end $$;
create function pg_temp.stored_status() returns text language sql as $$
  select status from public.meeting_requests where id = current_setting('synera.acceptance.meeting')::uuid;
$$;
create function pg_temp.invite() returns void language plpgsql as $$
begin
  insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
    values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','After both approvals',now()+interval '1 day',20,'Zürich');
  perform set_config('synera.acceptance.meeting', (select id::text from public.meeting_requests where status = 'pending'), true);
end $$;
do $$ begin execute format('grant usage on schema %I to authenticated', (select nspname from pg_catalog.pg_namespace where oid = pg_my_temp_schema())); end $$;
set local role authenticated;
select pg_temp.act('11111111-1111-4111-8111-111111111111');
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values
('status-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange',
 '{"mode":"exchange","components":["exchange"],"outcomes":[],"trial":{},"compensation":{"status":"agreed_exchange"},"terms":{"revision_limit":1,"confidentiality":"not_required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}',
 repeat('a',64), now()+interval '7 days');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),1,repeat('a',64));
select pg_temp.act('22222222-2222-4222-8222-222222222222');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),1,repeat('a',64));
select pg_temp.act('11111111-1111-4111-8111-111111111111');
select pg_temp.invite();
do $$ declare code text; begin
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Sender accepted their own invitation'; end if;
  if code <> '42501' then raise exception 'Sender self-acceptance was not an authorization denial: %', code; end if;
  code := pg_temp.try_status('declined');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Sender declined for the recipient'; end if;
  perform pg_temp.act('33333333-3333-4333-8333-333333333333');
  code := pg_temp.try_status('accepted'); code := pg_temp.try_status('cancelled');
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Third party changed an invitation'; end if;
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('cancelled');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient cancelled the sender''s invitation'; end if;
end $$;
select pg_temp.act('11111111-1111-4111-8111-111111111111');
update public.match_cases set terms_hash = repeat('b',64), material = jsonb_set(material,'{terms,revision_limit}','2') where case_id = 'status-ab';
do $$ declare code text; begin
  if (select version from public.match_cases where case_id = 'status-ab') <> 2 then raise exception 'Fixture revision did not raise the version'; end if;
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the agreement changed'; end if;
  if code <> 'PT409' then raise exception 'Stale acceptance was not a recoverable conflict: %', code; end if;
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),2,repeat('b',64));
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted with one current approval'; end if;
  -- No message may exist before acceptance.
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) values (current_setting('synera.acceptance.meeting')::uuid,public.synera_user_id(),'Before acceptance');
    raise exception 'Message passed before acceptance';
  exception when insufficient_privilege then null; end;
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),2,repeat('b',64));
  -- The same invitation becomes acceptable again: the recovery path needs no new invitation.
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if code <> '' or pg_temp.stored_status() <> 'accepted' then raise exception 'Recipient could not accept after both re-approved: %', code; end if;
  insert into public.meeting_messages(meeting_id,sender_id,body) values (current_setting('synera.acceptance.meeting')::uuid,public.synera_user_id(),'After acceptance');
  -- An acceptance is not silently reversed by the recipient or re-decided by the sender.
  code := pg_temp.try_status('declined');
  if pg_temp.stored_status() <> 'accepted' then raise exception 'Recipient reversed an acceptance'; end if;
  code := pg_temp.try_status('pending');
  if pg_temp.stored_status() <> 'accepted' then raise exception 'Accepted invitation returned to pending'; end if;
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  code := pg_temp.try_status('declined');
  if pg_temp.stored_status() <> 'accepted' then raise exception 'Sender declined an accepted invitation'; end if;
  -- The sender may still cancel; a closed invitation is final.
  code := pg_temp.try_status('cancelled');
  if code <> '' or pg_temp.stored_status() <> 'cancelled' then raise exception 'Sender could not cancel an accepted invitation: %', code; end if;
  code := pg_temp.try_status('accepted');
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'cancelled' then raise exception 'Cancelled invitation was reopened'; end if;
end $$;
select pg_temp.act('11111111-1111-4111-8111-111111111111');
select pg_temp.invite();
update public.match_case_approvals set withdrawn_at = now() where party_id = public.synera_user_id() and approved_version = 2 and withdrawn_at is null;
do $$ declare code text; begin
  perform pg_temp.act('22222222-2222-4222-8222-222222222222');
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the sender withdrew approval'; end if;
  if code <> 'PT409' then raise exception 'Withdrawn-approval acceptance was not a recoverable conflict: %', code; end if;
  code := pg_temp.try_status('declined');
  if code <> '' or pg_temp.stored_status() <> 'declined' then raise exception 'Recipient could not decline: %', code; end if;
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'declined' then raise exception 'Declined invitation was reopened'; end if;
end $$;
select pg_temp.act('11111111-1111-4111-8111-111111111111');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab',public.synera_user_id(),2,repeat('b',64));
select pg_temp.invite();
select pg_temp.act('22222222-2222-4222-8222-222222222222');
update public.match_cases set status = 'revoked' where case_id = 'status-ab';
do $$ declare code text; begin
  if (select status from public.match_cases where case_id = 'status-ab') <> 'revoked' then raise exception 'Fixture case was not closed'; end if;
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the agreement was closed'; end if;
  perform pg_temp.act('11111111-1111-4111-8111-111111111111');
  code := pg_temp.try_status('cancelled');
  if code <> '' or pg_temp.stored_status() <> 'cancelled' then raise exception 'Sender could not cancel a pending invitation: %', code; end if;
end $$;
select pg_temp.act('11111111-1111-4111-8111-111111111111');
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
select 'status-ab-2',participant_low,participant_high,mode,material,repeat('c',64),now()+interval '1 hour' from public.match_cases where case_id = 'status-ab';
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab-2',public.synera_user_id(),1,repeat('c',64));
select pg_temp.act('22222222-2222-4222-8222-222222222222');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('status-ab-2',public.synera_user_id(),1,repeat('c',64));
select pg_temp.act('11111111-1111-4111-8111-111111111111');
select pg_temp.invite();
reset role;
update public.match_cases set expires_at = now() - interval '1 second' where case_id = 'status-ab-2';
set local role authenticated;
select pg_temp.act('22222222-2222-4222-8222-222222222222');
do $$ declare code text; begin
  code := pg_temp.try_status('accepted');
  if pg_temp.stored_status() <> 'pending' then raise exception 'Recipient accepted after the agreement expired'; end if;
  if code <> 'PT409' then raise exception 'Expired-agreement acceptance was not a recoverable conflict: %', code; end if;
end $$;
reset role;
do $$ declare code text; begin
  code := pg_temp.try_status('cancelled');
  if code <> '' or pg_temp.stored_status() <> 'cancelled' then raise exception 'Owner maintenance was blocked by the caller guard: %', code; end if;
end $$;
select 'MEETING_STATUS_GUARD_ACCEPTANCE_PASS' as result;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- meeting-location.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);

insert into neon_auth."user"(id,name,email,"emailVerified") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true);
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Location fixture','Product design','B2B sales',true,
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
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
  begin insert into public.meeting_location_grants(meeting_id,grantor_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',public.synera_user_id()); raise exception 'Raw forged grant allowed'; exception when insufficient_privilege then null; end;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',15,false,gen_random_uuid()); raise exception 'Consent omitted'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','city',15,true,gen_random_uuid()); raise exception 'Precision forged'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','exact',90,true,gen_random_uuid()); raise exception 'Window forged'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_location_grant('dddddddd-dddd-4ddd-8ddd-dddddddddddd','exact',15,true,gen_random_uuid()); raise exception 'Online sharing allowed'; exception when insufficient_privilege then null; end;
  begin perform public.synera_location_grant('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','exact',15,true,gen_random_uuid()); raise exception 'Pending sharing allowed'; exception when insufficient_privilege then null; end;
  g:=public.synera_location_grant('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','approximate',15,true,gen_random_uuid());
  if g->>'grantor_id'<>public.synera_user_id()::text or g->>'recipient_id'<>'22222222-2222-4222-8222-222222222222' then raise exception 'Identity not derived'; end if;
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
insert into public.profile_blocks(blocker_id,blocked_id) values (public.synera_user_id(),'22222222-2222-4222-8222-222222222222');
do $$ begin
  if public.synera_location_access('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'eligible'<>'false' then raise exception 'Block ignored'; end if;
end $$;
delete from public.profile_blocks where blocker_id=public.synera_user_id();
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
update public.match_case_approvals set withdrawn_at=now() where case_id='location-ab' and party_id=public.synera_user_id();
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
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- group-room.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);

insert into neon_auth."user"(id,name,email,"emailVerified") values
('11111111-1111-4111-8111-111111111111','Room 1','a@synera-room.example',true),
('22222222-2222-4222-8222-222222222222','Room 2','b@synera-room.example',true),
('33333333-3333-4333-8333-333333333333','Room 3','c@synera-room.example',true),
('44444444-4444-4444-8444-444444444444','Room 4','d@synera-room.example',true);
insert into public.synera_pilot_members(email) values ('a@synera-room.example'),('b@synera-room.example'),('c@synera-room.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Room fixture','Design','Sales',id <> '44444444-4444-4444-8444-444444444444',
  jsonb_build_object('version',1,'goal','Review','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
  'languages',jsonb_build_array('en'),'modes',jsonb_build_array('joint_project'),'available_from',current_date::text,
  'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare state jsonb; room_id uuid; begin
  -- Creator must use their JWT identity; raw client writes and arbitrary UUID actors are unavailable.
  begin insert into public.group_rooms(creator_id,title,goal) values ('22222222-2222-4222-8222-222222222222','forged','forged'); raise exception 'Raw room insert allowed'; exception when insufficient_privilege then null; end;
  begin perform public.synera_room_create('Room','Goal',array['11111111-1111-4111-8111-111111111111'::uuid]); raise exception 'Creator invited self'; exception when invalid_parameter_value then null; end;
  state:=public.synera_room_create('Text room','One concrete review',array['22222222-2222-4222-8222-222222222222'::uuid,'33333333-3333-4333-8333-333333333333'::uuid]);
  room_id:=(state->>'id')::uuid;
  if state->>'own_role'<>'creator' or jsonb_array_length(state->'participants')<>3 or state->'transcript'<>'[]'::jsonb then raise exception 'Creation state leaked or omitted participants'; end if;
  perform set_config('group_room.acceptance_id',room_id::text,true);
end $$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  if public.synera_room_list()<>'[]'::jsonb then raise exception 'Outsider saw a room'; end if;
  begin perform public.synera_room_get(current_setting('group_room.acceptance_id')::uuid); raise exception 'Outsider read invitation'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  state:=public.synera_room_get(current_setting('group_room.acceptance_id')::uuid);
  if state->>'own_membership_status'<>'invited' or state->'transcript'<>'[]'::jsonb then raise exception 'Invitation exposed transcript before acceptance'; end if;
  state:=public.synera_room_accept(current_setting('group_room.acceptance_id')::uuid);
  if state->>'revision'<>'2' or state->>'own_membership_status'<>'accepted' then raise exception 'First acceptance did not use server revision'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select public.synera_room_accept(current_setting('group_room.acceptance_id')::uuid);
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  begin perform public.synera_room_start(current_setting('group_room.acceptance_id')::uuid,null); raise exception 'NULL revision accepted'; exception when invalid_parameter_value then null; end;
  state:=public.synera_room_start(current_setting('group_room.acceptance_id')::uuid,3);
  if state->>'status'<>'active' or state->'active_turn'->>'speaker_id'<>public.synera_user_id()::text then raise exception 'Creator did not start first turn'; end if;
  state:=public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,4,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','First factual message');
  if state->>'revision'<>'5' or jsonb_array_length(state->'transcript')<>1 then raise exception 'Server message revision failed'; end if;
  -- Same id/body is a safe retry, not a second message or a new action.
  state:=public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,4,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','First factual message');
  if state->>'revision'<>'5' or jsonb_array_length(state->'transcript')<>1 then raise exception 'Message retry was not idempotent'; end if;
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,5,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','different'); raise exception 'Idempotency conflict accepted'; exception when invalid_parameter_value then null; end;
  perform public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,5);
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,6,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','wrong speaker'); raise exception 'Wrong speaker wrote'; exception when insufficient_privilege then null; end;
  begin perform public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,6); raise exception 'Non-speaker advanced before deadline'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,6,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Second factual message');
reset role;
insert into public.group_room_messages(room_id,message_id,sender_id,room_revision,body)
select current_setting('group_room.acceptance_id')::uuid,gen_random_uuid(),'22222222-2222-4222-8222-222222222222',7,'fixture cap'
from generate_series(1,98);
do $$ begin
  if (select count(*) from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid)<>100 then raise exception 'Room fixture cap not exact'; end if;
  perform set_config('group_room.cap_revision',(select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.cap_events',(select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.cap_messages',(select count(*)::text from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.cap_counter',(select messages::text from public.synera_write_limits where user_id='22222222-2222-4222-8222-222222222222'),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  state:=public.synera_room_get(current_setting('group_room.acceptance_id')::uuid);
  if jsonb_array_length(state->'transcript')<>100 then raise exception 'Room transcript cap not exact'; end if;
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,7,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','over room cap'); raise exception 'Room cap accepted 101st message'; exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
do $$ begin
  if (select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.cap_revision') or (select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.cap_events') or (select count(*)::text from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.cap_messages') or (select messages::text from public.synera_write_limits where user_id='22222222-2222-4222-8222-222222222222')<>current_setting('group_room.cap_counter') then raise exception 'Room-cap denial changed state'; end if;
end $$;
delete from public.group_room_messages where room_id=current_setting('group_room.acceptance_id')::uuid and body='fixture cap';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,7);
do $$ begin
  begin perform public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,7); raise exception 'Stale concurrent advance accepted'; exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
insert into public.synera_write_limits(user_id) values ('33333333-3333-4333-8333-333333333333') on conflict (user_id) do nothing;
update public.synera_write_limits set messages=100 where user_id='33333333-3333-4333-8333-333333333333';
do $$ begin
  perform set_config('group_room.shared_revision',(select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.shared_events',(select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid),true);
  perform set_config('group_room.shared_counter',(select messages::text from public.synera_write_limits where user_id='33333333-3333-4333-8333-333333333333'),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_message(current_setting('group_room.acceptance_id')::uuid,8,'dddddddd-dddd-4ddd-8ddd-dddddddddddd','over shared quota'); raise exception 'Shared message quota accepted'; exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
do $$ begin
  if (select revision::text from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.shared_revision') or (select count(*)::text from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid)<>current_setting('group_room.shared_events') or (select messages::text from public.synera_write_limits where user_id='33333333-3333-4333-8333-333333333333')<>current_setting('group_room.shared_counter') then raise exception 'Message quota denial changed state'; end if;
end $$;
reset role;
update public.group_rooms set created_at=now()-interval '2 minutes',turn_deadline=now()-interval '1 second' where id=current_setting('group_room.acceptance_id')::uuid;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_room_advance(current_setting('group_room.acceptance_id')::uuid,8);
reset role;
do $$ begin
  if not exists(select 1 from public.group_room_events where room_id=current_setting('group_room.acceptance_id')::uuid and event_type='no_response') then raise exception 'Silent deadline was not labelled no_response'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ declare state jsonb; begin
  state:=public.synera_room_leave(current_setting('group_room.acceptance_id')::uuid);
  if state->>'status'<>'left' then raise exception 'Leave did not close own access'; end if;
end $$;
reset role;
do $$ begin
  if (select status from public.group_rooms where id=current_setting('group_room.acceptance_id')::uuid)<>'paused' then raise exception 'Leave did not pause active room'; end if;
end $$;
insert into public.synera_write_limits(user_id) values ('11111111-1111-4111-8111-111111111111') on conflict (user_id) do nothing;
update public.synera_write_limits set invitations=20 where user_id='11111111-1111-4111-8111-111111111111';
do $$ begin
  perform set_config('group_room.invite_rooms',(select count(*)::text from public.group_rooms),true);
  perform set_config('group_room.invite_events',(select count(*)::text from public.group_room_events),true);
  perform set_config('group_room.invite_counter',(select invitations::text from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111'),true);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_create('Denied room','Counter check',array['22222222-2222-4222-8222-222222222222'::uuid]); raise exception 'Shared invitation quota accepted'; exception when sqlstate 'PT429' then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*)::text from public.group_rooms)<>current_setting('group_room.invite_rooms') or (select count(*)::text from public.group_room_events)<>current_setting('group_room.invite_events') or (select invitations::text from public.synera_write_limits where user_id='11111111-1111-4111-8111-111111111111')<>current_setting('group_room.invite_counter') then raise exception 'Invitation quota denial changed state'; end if;
end $$;
insert into public.profile_blocks(blocker_id,blocked_id) values ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_get(current_setting('group_room.acceptance_id')::uuid); raise exception 'Blocked member retained transcript'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.profile_blocks;
delete from public.pilot_consents where user_id='22222222-2222-4222-8222-222222222222' and policy_version='2026-09-05-pilot-3';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_get(current_setting('group_room.acceptance_id')::uuid); raise exception 'Expired-policy member retained transcript'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare r text; f text; begin
  -- Metadata oracle: authenticated reaches room data only through the public RPCs.
  foreach f in array array['group_rooms','group_room_members','group_room_messages','group_room_events'] loop
    if has_table_privilege('authenticated','public.'||f,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Authenticated table grant remains: %',f; end if;
  end loop;
  foreach f in array array['synera_room_current_member(uuid)','synera_room_pair_blocked(uuid,uuid)','synera_room_actor_allowed(uuid,boolean)','synera_room_all_accepted_current(uuid)','synera_room_admit_write(text)','synera_room_state(uuid,boolean)'] loop
    if has_function_privilege('authenticated','public.'||f,'EXECUTE') then raise exception 'Authenticated private helper grant remains: %',f; end if;
  end loop;
  foreach f in array array['synera_room_create(text,text,uuid[])','synera_room_list()','synera_room_get(uuid)','synera_room_accept(uuid)','synera_room_leave(uuid)','synera_room_start(uuid,integer)','synera_room_message(uuid,integer,uuid,text)','synera_room_advance(uuid,integer)','synera_room_close(uuid,integer)'] loop
    if not has_function_privilege('authenticated','public.'||f,'EXECUTE') then raise exception 'Authenticated public RPC grant missing: %',f; end if;
  end loop;
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      foreach f in array array['synera_room_create(text,text,uuid[])','synera_room_list()','synera_room_get(uuid)','synera_room_accept(uuid)','synera_room_leave(uuid)','synera_room_start(uuid,integer)','synera_room_message(uuid,integer,uuid,text)','synera_room_advance(uuid,integer)','synera_room_close(uuid,integer)'] loop
        if has_function_privilege(r,'public.'||f,'EXECUTE') then raise exception 'Anonymous RPC grant remains'; end if;
      end loop;
    end if;
  end loop;
end $$;
select 'PASS: authenticated room invitations, explicit acceptance, private transcript, current consent/block revocation, idempotency, revision lock and no-response turn boundary' as result;
reset role;
update public.profiles set is_discoverable=true where id='44444444-4444-4444-8444-444444444444';
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values ('44444444-4444-4444-8444-444444444444','2026-09-05-pilot-3',true,true);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_room_create('Unadmitted','Goal',array['11111111-1111-4111-8111-111111111111'::uuid]); raise exception 'Unadmitted verified account entered room'; exception when insufficient_privilege then null; end;
end $$;
reset role;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- case-outcome.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Case fixture','Product design','B2B sales',id <> '33333333-3333-4333-8333-333333333333',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('case-outcome-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange','{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen"},{"receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype"}],"trial":{"starts_on":"2026-10-30","due_on":"2026-11-05","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen","acceptance_criteria":"Both reviewed on their own phone"},{"giver_id":"11111111-1111-4111-8111-111111111111","receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype","acceptance_criteria":"Opens the agreed screen"}]},"compensation":{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":1,"confidentiality":"required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}'::jsonb,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58',now()+interval '14 days');
RESET ROLE;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"state"}');
  if r->'outcome_confirmed'<>'false'::jsonb or r#>>'{deliverables,0,phase}'<>'pending' or jsonb_array_length(r->'events')<>0 then raise exception 'Pending outcome promoted'; end if;
  begin
    perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000001","evidenceUri":"https://example.com/proof"}');
    raise exception 'Outcome accepted without both approvals';
  exception when insufficient_privilege then null; end;
  begin perform count(*) from public.match_outcome_events; raise exception 'Raw outcome history exposed'; exception when insufficient_privilege then null; end;
  begin delete from public.match_outcome_events; raise exception 'Client could delete outcome history'; exception when insufficient_privilege then null; end;
  begin update public.match_outcome_events set kind='accept'; raise exception 'Client could rewrite outcome history'; exception when insufficient_privilege then null; end;
end $$;
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,public.synera_user_id(),version,terms_hash from public.match_cases where case_id='case-outcome-ab';
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,public.synera_user_id(),version,terms_hash from public.match_cases where case_id='case-outcome-ab';
do $$ declare p jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000001","evidenceUri":"https://example.com/not-mine"}');
    raise exception 'Receiver supplied giver evidence'; exception when insufficient_privilege then null; end;
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000002"}');
    raise exception 'Receiver accepted without evidence and scope'; exception when sqlstate 'PT409' then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; request jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  request:=p||'{"action":"submit","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000001","evidenceUri":"https://example.com/proof"}';
  r:=public.synera_case_outcome('case-outcome-ab',request);
  if r#>>'{deliverables,0,phase}'<>'evidence_supplied' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'Evidence promoted to confirmed outcome'; end if;
  r:=public.synera_case_outcome('case-outcome-ab',request);
  if jsonb_array_length(r->'events')<>1 then raise exception 'Repeated intent duplicated an event'; end if;
  begin perform public.synera_case_outcome('case-outcome-ab',request||'{"evidenceUri":"https://example.com/changed"}');
    raise exception 'Reused intent accepted different evidence'; exception when sqlstate 'PT409' then null; end;
  begin perform public.synera_case_outcome('case-outcome-ab',request||'{"actor_id":"11111111-1111-4111-8111-111111111111"}');
    raise exception 'Client supplied actor identity'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_case_outcome('case-outcome-ab',request||'{"created_at":"2020-01-01"}');
    raise exception 'Client supplied outcome clock'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)));
    raise exception 'Outsider read outcome'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"check","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000003","scopeNotes":"Перевірено узгоджений сценарій × Zürich 💛"}');
  if r#>>'{deliverables,0,phase}'<>'checked_with_scope' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'Scope check promoted to outcome'; end if;
  if r#>>'{deliverables,0,scope_notes}'<>'Перевірено узгоджений сценарій × Zürich 💛' then raise exception 'Unicode scope altered'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000002"}');
    raise exception 'Giver accepted own result'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"decline","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000004","reason":"lazy_person"}');
    raise exception 'Blame label accepted'; exception when invalid_parameter_value then null; end;
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"decline","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000004","reason":"below_acceptance_criteria"}');
  if r#>>'{deliverables,0,phase}'<>'declined_dispute_open' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'Decline not recorded neutrally'; end if;
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000005"}');
  if r#>>'{deliverables,0,phase}'<>'accepted' or r#>>'{deliverables,1,phase}'<>'pending' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'One leg confirmed whole collaboration'; end if;
  if jsonb_array_length(r->'events')<>4 or not exists(select 1 from jsonb_array_elements(r->'events') e where e->>'kind'='decline') then raise exception 'Resolution erased decline history'; end if;
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":1,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000006","evidenceUri":"https://example.com/second"}');
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"check","index":1,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000003","scopeNotes":"Другий результат перевірений"}');
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":1,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000004"}');
  if r->'outcome_confirmed'<>'true'::jsonb or r->>'proof_scope'<>'participant_attestation' or jsonb_array_length(r->'events')<>7 then raise exception 'Bilateral participant attestation incomplete'; end if;
  update public.match_cases set material=jsonb_set(material,'{trial,deliverables,0,target}','"Revised result"'),terms_hash=repeat('b',64) where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"state"}');
    raise exception 'Old screen read new-version proof'; exception when sqlstate 'PT409' then null; end;
  p:=jsonb_build_object('version',2,'termsHash',repeat('b',64));
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"state"}');
  if r->'outcome_confirmed'<>'false'::jsonb or r#>>'{deliverables,0,phase}'<>'pending' or jsonb_array_length(r->'events')<>0 then raise exception 'Old outcome promoted revised terms'; end if;
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000005","evidenceUri":"https://example.com/revised"}');
    raise exception 'Revision retained old approvals'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.match_outcome_events)<>7 then raise exception 'Revision erased historical events'; end if;
end $$;
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,participant_low,version,terms_hash from public.match_cases where case_id='case-outcome-ab'
union all select case_id,participant_high,version,terms_hash from public.match_cases where case_id='case-outcome-ab';
update public.match_case_approvals set withdrawn_at=now() where case_id='case-outcome-ab' and party_id='11111111-1111-4111-8111-111111111111' and approved_version=2;
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','submit','version',2,'termsHash',repeat('b',64),'index',0,'intentId','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','evidenceUri','https://example.com/revised'));
    raise exception 'Withdrawal retained outcome authority'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.profile_blocks(blocker_id,blocked_id) values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111');
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)));
    raise exception 'Blocked pair retained outcome disclosure'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.profile_blocks;
delete from public.pilot_consents where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)));
    raise exception 'Revoked consent retained outcome disclosure'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values('22222222-2222-4222-8222-222222222222','2026-09-05-pilot-3',true,true);
update public.match_cases set expires_at=now()-interval '1 second' where case_id='case-outcome-ab';
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','submit','version',2,'termsHash',repeat('b',64),'index',0,'intentId','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','evidenceUri','https://example.com/revised'));
    raise exception 'Expired case accepted outcome'; exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
select 'PASS: participant-only outcome, explicit giver evidence/receiver scope/decision, no silence promotion, idempotency, version/approval/consent/block/expiry gates, private immutable history';
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- meeting-address-agreement.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Case fixture','Product design','B2B sales',id <> '33333333-3333-4333-8333-333333333333',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('case-address-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange','{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen"},{"receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype"}],"trial":{"starts_on":"2026-10-30","due_on":"2026-11-05","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen","acceptance_criteria":"Both reviewed on their own phone"},{"giver_id":"11111111-1111-4111-8111-111111111111","receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype","acceptance_criteria":"Opens the agreed screen"}]},"compensation":{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":1,"confidentiality":"required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}'::jsonb,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58',now()+interval '14 days');
RESET ROLE;
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('case-address-ab','11111111-1111-4111-8111-111111111111',1,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58');
RESET ROLE;
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('case-address-ab','22222222-2222-4222-8222-222222222222',1,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58');
RESET ROLE;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place) values('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Disposable agreed exchange','accepted',now()+interval '1 day',30,'Zürich');
select set_config('synera.revised_material','{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen"},{"receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype"}],"trial":{"starts_on":"2026-10-30","due_on":"2026-11-05","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen revised","acceptance_criteria":"Both reviewed on their own phone"},{"giver_id":"11111111-1111-4111-8111-111111111111","receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype","acceptance_criteria":"Opens the agreed screen"}]},"compensation":{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":1,"confidentiality":"required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}',true); select set_config('synera.revised_hash','2d40fa12ae19f37348774ac2a8646711d7db52f6e4794f20a8785c5eacc3a5e2',true);

select set_config('synera.test_hash',(select terms_hash from public.match_cases where case_id='case-address-ab'),true);
create function pg_temp.address_call(a text,i uuid,p uuid,d text default null,consent boolean default null) returns jsonb
language plpgsql security invoker as $$ declare request jsonb; begin
  request:=jsonb_build_object('action',a,'version',1,'termsHash',current_setting('synera.test_hash'));
  if a<>'state' then request:=request||jsonb_build_object('intentId',i,'proposalId',p); end if;
  if d is not null then request:=request||jsonb_build_object('address',d); end if;
  if consent is not null then request:=request||jsonb_build_object('consent',consent); end if;
  return public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',request);
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_location_grant('44444444-4444-4444-8444-444444444444','approximate',15,true,'bbbbbbbb-bbbb-4bbb-8bbb-000000000001');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select public.synera_location_grant('44444444-4444-4444-8444-444444444444','approximate',15,true,'bbbbbbbb-bbbb-4bbb-8bbb-000000000002');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);
  if r->'agreed'<>'false'::jsonb or r->'proposal'<>'null'::jsonb or r->'events'<>'[]'::jsonb then raise exception 'Empty state claims agreement'; end if;
  r:=pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,'Café Zürich — first choice',true);
  if r->'agreed'<>'false'::jsonb or r#>>'{meeting,meeting_address}'<>'' or r#>>'{proposal,address}'<>'Café Zürich — first choice' then raise exception 'Proposal installed without peer'; end if;
  r:=pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,'Café Zürich — first choice',true);
  if jsonb_array_length(r->'events')<>1 then raise exception 'Retry duplicated proposal'; end if;
  begin
    perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,true);
    raise exception 'Proposer accepted own address';
  exception when insufficient_privilege then null; end;
  begin
    perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','Different address',true);
    raise exception 'Intent reused with different address';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000020','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','No consent',false);
    raise exception 'False consent created proposal';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',jsonb_build_object('action','state','version',1,'termsHash',current_setting('synera.test_hash'),'actor_id','22222222-2222-4222-8222-222222222222'));
    raise exception 'Caller forged actor';
  exception when invalid_parameter_value then null; end;
  begin perform count(*) from public.meeting_address_events; raise exception 'Caller read private events directly'; exception when insufficient_privilege then null; end;
  begin update public.meeting_address_events set address='Rewrite'; raise exception 'Caller rewrote events'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin if (select count(*) from public.meeting_location_grants where status='active')<>2 then raise exception 'Pending proposal changed GPS grants'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  begin perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000001');
    raise exception 'Missing explicit consent accepted address'; exception when invalid_parameter_value then null; end;
  r:=pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,true);
  if r->'agreed'<>'true'::jsonb or r#>>'{meeting,meeting_address}'<>'Café Zürich — first choice' or jsonb_array_length(r->'events')<>2 then raise exception 'Peer acceptance failed to install exact address'; end if;
  if r#>>'{events,0,actor_id}'<>'11111111-1111-4111-8111-111111111111' or r#>>'{events,1,actor_id}'<>'22222222-2222-4222-8222-222222222222' then raise exception 'Actor identity not derived'; end if;
  r:=pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,true);
  if jsonb_array_length(r->'events')<>2 then raise exception 'Retry duplicated acceptance'; end if;
end $$;
reset role;
do $$ begin if (select count(*) from public.meeting_location_grants where status='revoked')<>2 then raise exception 'Accepted address did not revoke both old GPS grants'; end if; end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','Second choice',true);
select pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-000000000004','Third choice',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  begin perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-000000000004',null,true);
    raise exception 'Late acceptance installed superseded proposal'; exception when sqlstate 'PT409' then null; end;
  r:=pg_temp.address_call('decline','aaaaaaaa-aaaa-4aaa-8aaa-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-000000000005');
  if r#>>'{meeting,meeting_address}'<>'Café Zürich — first choice' or r->'agreed'<>'false'::jsonb or r#>>'{proposal,decision}'<>'decline' then raise exception 'Decline changed installed address'; end if;
  begin perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-000000000005',null,true);
    raise exception 'Declined proposal later accepted'; exception when sqlstate 'PT409' then null; end;
  r:=pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','Partner choice',true);
  if r#>>'{proposal,proposer_id}'<>'22222222-2222-4222-8222-222222222222' then raise exception 'Other participant cannot propose'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,'Café Zürich — first choice',true);
    raise exception 'Old retry revived superseded choice'; exception when sqlstate 'PT409' then null; end;
  r:=pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-000000000009',null,true);
  if r->'agreed'<>'true'::jsonb or r#>>'{meeting,meeting_address}'<>'Partner choice' or jsonb_array_length(r->'events')<>7
    or r#>>'{events,0,address}'<>'Café Zürich — first choice' then raise exception 'Reciprocal acceptance lost history'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Outsider read address history'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims','{}',true);
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Anonymous read address history'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
savepoint changed_schedule;
reset role;
update public.meeting_requests set proposed_at=proposed_at+interval '1 hour' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);
  if r->'agreed'<>'false'::jsonb or r#>'{proposal,current}'<>'false'::jsonb then raise exception 'Changed schedule retained address approval'; end if;
end $$;
rollback to savepoint changed_schedule;
savepoint revised_case;
reset role;
update public.match_cases set material=current_setting('synera.revised_material')::jsonb,terms_hash=current_setting('synera.revised_hash') where case_id='case-address-ab';
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,party,version,terms_hash from public.match_cases cross join lateral unnest(array[participant_low,participant_high]) party where case_id='case-address-ab';
set local role authenticated;
do $$ declare request jsonb;r jsonb;begin
  begin perform pg_temp.address_call('state',null,null);raise exception 'Old case version read as current';exception when sqlstate 'PT409' then null;end;
  request:=jsonb_build_object('action','state','version',2,'termsHash',current_setting('synera.revised_hash'));
  r:=public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',request);
  if r->'agreed'<>'false'::jsonb or r#>'{proposal,current}'<>'false'::jsonb then raise exception 'New case revision inherited old address agreement';end if;
  begin
    perform public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',request||jsonb_build_object('action','accept','intentId','aaaaaaaa-aaaa-4aaa-8aaa-000000000023','proposalId','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','consent',true));
    raise exception 'Old address proposal accepted under new case approval';
  exception when sqlstate 'PT409' then null;end;
end $$;
rollback to savepoint revised_case;
savepoint expired_case;
reset role;
update public.match_cases set expires_at=now()-interval '1 second' where case_id='case-address-ab';
set local role authenticated;
do $$ declare r jsonb;begin
  r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb then raise exception 'Expired case retained agreement';end if;
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000024','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Expired case',true);raise exception 'Expired case permitted proposal';exception when sqlstate 'PT409' then null;end;
end $$;
rollback to savepoint expired_case;
savepoint expired_meeting;
reset role;
update public.meeting_requests set proposed_at=now()-interval '1 minute' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Past meeting',true); raise exception 'Past meeting accepted proposal'; exception when sqlstate 'PT409' then null; end; end $$;
rollback to savepoint expired_meeting;
savepoint online_meeting;
reset role;
update public.meeting_requests set meeting_place='Онлайн' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000012','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Physical place',true); raise exception 'Online meeting accepted physical address'; exception when sqlstate 'PT409' then null; end; end $$;
rollback to savepoint online_meeting;
savepoint missing_place;
reset role;
update public.meeting_requests set meeting_place=null where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000021','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','No city selected',true); raise exception 'Missing place accepted address proposal'; exception when sqlstate 'PT409' then null; end; end $$;
rollback to savepoint missing_place;
savepoint approval_withdrawn;
reset role;
update public.match_case_approvals set withdrawn_at=now() where case_id='case-address-ab' and party_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb then raise exception 'Withdrawal retained agreement'; end if;
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000013','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Withdrawn approval',true); raise exception 'Withdrawn approval permitted proposal'; exception when insufficient_privilege then null; end;
end $$;
rollback to savepoint approval_withdrawn;
savepoint peer_consent;
reset role;
insert into neon_auth."user"(id,name,email) values('55555555-5555-4555-8555-555555555555','Unrelated consent fixture','d@synera-acceptance.example');
update public.pilot_consents set user_id='55555555-5555-4555-8555-555555555555' where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Revoked peer consent exposed history'; exception when insufficient_privilege then null; end; end $$;
rollback to savepoint peer_consent;
savepoint blocked_pair;
reset role;
insert into public.profile_blocks(blocker_id,blocked_id) values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111');
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Blocked pair exposed history'; exception when insufficient_privilege then null; end; end $$;
rollback to savepoint blocked_pair;
savepoint closed_case;
reset role;
update public.match_cases set status='revoked' where case_id='case-address-ab';
set local role authenticated;
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb then raise exception 'Closed case retained agreement'; end if;
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000014','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Closed case',true); raise exception 'Closed case permitted proposal'; exception when sqlstate 'PT409' then null; end;
end $$;
rollback to savepoint closed_case;
set local role authenticated;
update public.meeting_requests set status='cancelled' where id='44444444-4444-4444-8444-444444444444';
do $$ declare r jsonb; begin r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb or r#>>'{meeting,status}'<>'cancelled' then raise exception 'Cancellation lost or retained agreement'; end if; end $$;
reset role;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- message-intent.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Case fixture','Product design','B2B sales',id <> '33333333-3333-4333-8333-333333333333',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('message-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange','{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen"},{"receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype"}],"trial":{"starts_on":"2026-10-30","due_on":"2026-11-05","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen","acceptance_criteria":"Both reviewed on their own phone"},{"giver_id":"11111111-1111-4111-8111-111111111111","receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype","acceptance_criteria":"Opens the agreed screen"}]},"compensation":{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":1,"confidentiality":"required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}'::jsonb,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58',now()+interval '14 days');
RESET ROLE;
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('message-ab','11111111-1111-4111-8111-111111111111',1,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58');
RESET ROLE;
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('message-ab','22222222-2222-4222-8222-222222222222',1,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58');
RESET ROLE;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place) values('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Disposable agreed exchange','accepted',now()+interval '1 day',30,'Zürich');
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_send_message('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-123456789012','Retained fixture message');
RESET ROLE;

update public.profile_blocks set blocked_id='33333333-3333-4333-8333-333333333333'
 where blocker_id='11111111-1111-4111-8111-111111111111' and blocked_id='22222222-2222-4222-8222-222222222222';
select set_config('synera.acceptance.message',row_to_json(m)::text,true) from public.meeting_messages m where sender_id='11111111-1111-4111-8111-111111111111' limit 1;
insert into neon_auth."user"(id,name,email,"emailVerified") values('77777777-7777-4777-8777-777777777777','Consent fixture','consent@synera-acceptance.example',true);
update public.pilot_consents set user_id='77777777-7777-4777-8777-777777777777' where user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$
declare row jsonb := current_setting('synera.acceptance.message')::jsonb;
begin
  if row is null then raise exception 'Consent oracle fixture missing'; end if;
  begin
    perform public.synera_send_message((row->>'meeting_id')::uuid,(row->>'id')::uuid,row->>'body');
    raise exception 'Missing current consent allowed message replay';
  exception when sqlstate 'PT403' then null; end;
  if (select count(*) from public.meeting_messages) <> 0 then raise exception 'Missing consent allowed private history read'; end if;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) values((row->>'meeting_id')::uuid,public.synera_user_id(),'Bypass new RPC');
    raise exception 'Missing consent allowed legacy direct insert';
  exception when insufficient_privilege then null; end;
end $$;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- profile-erasure.migration.sql
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
SAVEPOINT fixtures;
SELECT set_config('request.jwt.claims','{}',true);
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief)
select id,'Case fixture','Product design','B2B sales',id <> '33333333-3333-4333-8333-333333333333',
 jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
 'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
 'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false)
from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged)
select id,'2026-09-05-pilot-3',true,true from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333');SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('erase-ab','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','exchange','{"mode":"exchange","components":["exchange"],"outcomes":[{"receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen"},{"receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype"}],"trial":{"starts_on":"2026-10-30","due_on":"2026-11-05","deliverables":[{"giver_id":"22222222-2222-4222-8222-222222222222","receiver_id":"11111111-1111-4111-8111-111111111111","capability_tag":"design","target":"One reviewed screen","acceptance_criteria":"Both reviewed on their own phone"},{"giver_id":"11111111-1111-4111-8111-111111111111","receiver_id":"22222222-2222-4222-8222-222222222222","capability_tag":"automation","target":"One working prototype","acceptance_criteria":"Opens the agreed screen"}]},"compensation":{"status":"agreed_exchange","amount_minor":null,"currency":"","invoice_required":null},"terms":{"revision_limit":1,"confidentiality":"required","intellectual_property":"shared","cancellation":"mutual_written_notice"}}'::jsonb,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58',now()+interval '14 days');
RESET ROLE;
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('erase-ab','11111111-1111-4111-8111-111111111111',1,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58');
RESET ROLE;
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('erase-ab','22222222-2222-4222-8222-222222222222',1,'2f11710ca10e79f424042eec8dad1723752e22b2292f85cb55bbb77b71ff6e58');
RESET ROLE;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place) values('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','Disposable agreed exchange','accepted',now()+interval '1 day',30,'Zürich');
SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_room_create('Disposable room','A shared review',array['22222222-2222-4222-8222-222222222222'::uuid]); select public.synera_send_message('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-123456789012','Retained fixture message'); select public.synera_erase_profile_data();
RESET ROLE;

select set_config('synera.review.room',(select id::text from public.group_rooms order by created_at limit 1),true);
select set_config('synera.review.meeting',(select id::text from public.meeting_requests order by created_at limit 1),true);
create function pg_temp.must_deny(q text) returns void language plpgsql security invoker as $$
begin
  begin execute q;
  exception when sqlstate '42501' or sqlstate 'PT403' then return; end;
  raise exception 'Erased actor surface was permitted: %',q;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare t text; n bigint; f text; room uuid:=current_setting('synera.review.room')::uuid; meeting uuid:=current_setting('synera.review.meeting')::uuid;
begin
  if public.synera_user_id()<>'11111111-1111-4111-8111-111111111111' or public.synera_pilot_member() then raise exception 'Identity/admission mismatch'; end if;
  foreach t in array array['profiles','pilot_consents','meeting_requests','meeting_messages','profile_blocks','profile_reports','match_cases','match_case_approvals'] loop
    execute format('select count(*) from public.%I',t) into n;
    if n<>0 then raise exception 'Erased actor read table: %',t; end if;
  end loop;
  foreach t in array array['profile_erasures','synera_pilot_members','synera_write_limits','group_rooms','group_room_members','group_room_messages','group_room_events','meeting_location_grants','location_consent_intents','match_outcome_events','meeting_address_events'] loop
    if has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Private table grant: %',t; end if;
  end loop;
  foreach f in array array['synera_profile_erasure_statement_lock()','synera_profile_erasure_guard()','synera_room_current_member(uuid)','synera_room_pair_blocked(uuid,uuid)','synera_room_actor_allowed(uuid,boolean)','synera_room_all_accepted_current(uuid)','synera_room_admit_write(text)','synera_room_state(uuid,boolean)','synera_location_allowed(uuid)','synera_location_case_current(text,integer,text)','synera_location_public(public.meeting_location_grants)','synera_meeting_names()','synera_limit_writes()','synera_case_guard()','synera_case_project_guard()','synera_approval_guard()','synera_meeting_status_guard()','synera_meeting_address_guard()','synera_location_invalidate()','synera_touch_profile()'] loop
    if has_function_privilege('authenticated','public.'||f,'EXECUTE') then raise exception 'Private helper executable: %',f; end if;
  end loop;
  perform pg_temp.must_deny(format('select public.synera_location_grant(%L::uuid,''approximate'',15,true,''99999999-9999-4999-8999-999999999999'')',meeting));
  perform pg_temp.must_deny(format('select public.synera_location_sample(%L::uuid)',meeting));
  perform pg_temp.must_deny(format('select public.synera_location_revoke(%L::uuid)',meeting));
  if (public.synera_location_access(meeting)->>'eligible')::boolean then raise exception 'Erased location access'; end if;
  perform pg_temp.must_deny('select public.synera_case_outcome(''erase-ab'',''{"action":"state"}''::jsonb)');
  perform pg_temp.must_deny(format('select public.synera_meeting_address(%L::uuid,''erase-ab'',''{}''::jsonb)',meeting));
  perform pg_temp.must_deny(format('select public.synera_send_message(%L::uuid,''99999999-9999-4999-8999-999999999999'',''Stale text'')',meeting));
  perform pg_temp.must_deny('select public.synera_room_create(''Title'',''Goal'',array[''22222222-2222-4222-8222-222222222222''::uuid])');
  if public.synera_room_list()<>'[]'::jsonb then raise exception 'Erased room listing'; end if;
  perform pg_temp.must_deny(format('select public.synera_room_get(%L::uuid)',room));
  perform pg_temp.must_deny(format('select public.synera_room_accept(%L::uuid)',room));
  perform pg_temp.must_deny(format('select public.synera_room_leave(%L::uuid)',room));
  perform pg_temp.must_deny(format('select public.synera_room_start(%L::uuid,1)',room));
  perform pg_temp.must_deny(format('select public.synera_room_message(%L::uuid,1,''99999999-9999-4999-8999-999999999999'',''Stale text'')',room));
  perform pg_temp.must_deny(format('select public.synera_room_advance(%L::uuid,1)',room));
  perform pg_temp.must_deny(format('select public.synera_room_close(%L::uuid,1)',room));
  -- Idempotent self-erasure receipt is the only stateful capability retained by the erased actor.
  if public.synera_erase_profile_data()->'repeated'<>'true'::jsonb then raise exception 'Erasure replay mismatch'; end if;
end $$;
reset role;
select 'PROFILE_ERASURE_ALL_SURFACES_PASS';
insert into neon_auth."user"(id,name,email,"emailVerified")
select '55555555-5555-4555-8555-555555555555','Lifecycle fixture',email,true from neon_auth."user"
where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
do $$ begin
  if public.synera_pilot_member() then raise exception 'Fresh provider sub inherited erased email admission'; end if;
  begin
    insert into public.profiles(id,display_name) values(public.synera_user_id(),'Recreated');
    raise exception 'Fresh provider sub recreated erased app access';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if exists(select 1 from public.synera_pilot_members m join neon_auth."user" u on m.email=lower(u.email) where u.id='11111111-1111-4111-8111-111111111111') then raise exception 'Erased admission email retained'; end if;
  if not exists(select 1 from public.synera_pilot_members m join neon_auth."user" u on m.email=lower(u.email) where u.id='22222222-2222-4222-8222-222222222222') then raise exception 'Peer admission changed'; end if;
end $$;
select 'PROFILE_ERASURE_LIFECYCLE_PASS';
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
RELEASE SAVEPOINT fixtures;

-- privacy-complete-erasure.migration.sql
do $$ begin
  if to_regprocedure('public.synera_erase_profile_data()') is null
    or to_regclass('public.location_consent_intents') is null
    or to_regclass('public.meeting_address_events') is null
    or to_regclass('public.match_outcome_events') is null
    or to_regclass('public.group_rooms') is null then
    raise exception 'Apply reviewed profile-erasure and journey migrations first';
  end if;
  if to_regprocedure('public.synera_complete_erase_application_data()') is not null then
    raise exception 'Inspect existing complete erasure migration';
  end if;
end $$;
create function public.synera_complete_erase_application_data() returns jsonb
language plpgsql security definer set search_path='' set lock_timeout='5s' as $$
declare actor uuid:=public.synera_user_id(); repeated boolean; erased jsonb;
begin
  if actor is null then raise exception 'Erasure unavailable' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text,17017));
  repeated:=exists(select 1 from public.profile_erasures where user_id=actor);
  if not repeated then
    erased:=public.synera_erase_profile_data();
    if erased->>'status'<>'application_data_erased' then raise exception 'Erasure unavailable' using errcode='42501'; end if;
  end if;

  -- Deleting a participant's meetings cascades their direct messages, address
  -- agreement events, location grants and location-consent intent ids.
  delete from public.meeting_requests where sender_id=actor or recipient_id=actor;
  -- Cases carry both parties' negotiated material. Complete erasure deletes
  -- cases involving the requester and their dependent approvals/outcomes.
  delete from public.match_cases where participant_low=actor or participant_high=actor;
  delete from public.profile_blocks where blocker_id=actor or blocked_id=actor;
  delete from public.pilot_consents where user_id=actor;
  -- Reports can contain free text about either party. Complete erasure removes
  -- both directions; retaining a report about the requester would not be a
  -- truthful complete application-data erasure claim.
  delete from public.profile_reports where reporter_id=actor or reported_id=actor;

  -- A room belongs to several people. Remove the erased person's authored text
  -- and events; revoke membership. A room created by the erased person is
  -- anonymised and closed so peers retain no title/goal supplied by that person.
  -- A peer-owned active room may currently point its turn at the erased
  -- member's position. Close that affected room before removing membership;
  -- peer title, goal and peer-authored rows are retained.
  update public.group_rooms r set status='closed',turn_position=null,turn_deadline=null,
    turn_started_revision=null,closed_at=coalesce(r.closed_at,now()),revision=r.revision+1
    where r.creator_id<>actor and exists(select 1 from public.group_room_members m where m.room_id=r.id and m.user_id=actor);
  delete from public.group_room_messages m using public.group_rooms r
    where m.room_id=r.id and (m.sender_id=actor or r.creator_id=actor);
  delete from public.group_room_events e using public.group_rooms r
    where e.room_id=r.id and (e.actor_id=actor or r.creator_id=actor);
  delete from public.group_room_members m using public.group_rooms r
    where m.room_id=r.id and (m.user_id=actor or r.creator_id=actor);
  delete from public.group_rooms where creator_id=actor;

  -- Retain only the minimal profile/tombstone identity needed to reject an old
  -- provider session. synera_write_limits also remains: it is a protected
  -- anti-abuse counter, not application content, and is inaccessible to clients.
  return jsonb_build_object('status','application_data_completely_erased',
    'providerDeletion','pending','staleSessionTombstone','retained','repeated',repeated);
end $$;
revoke all on function public.synera_complete_erase_application_data() from public,authenticated;
grant execute on function public.synera_complete_erase_application_data() to authenticated;
do $$ declare r text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      execute format('revoke all on function public.synera_complete_erase_application_data() from %I',r);
    end if;
  end loop;
end $$;

-- privacy-retention-purge.migration.sql
do $$ begin
  if to_regclass('public.meeting_requests') is null or to_regclass('public.location_consent_intents') is null then
    raise exception 'Apply reviewed journey migrations first';
  end if;
  if to_regprocedure('public.synera_purge_expired_privacy_data()') is not null then
    raise exception 'Inspect existing privacy purge migration';
  end if;
end $$;
create function public.synera_privacy_ops_counters_valid(p jsonb) returns boolean
language sql immutable security invoker set search_path='' as $$
  select case when jsonb_typeof(p)='object' then
    p - array['deleted_rows','failed_rows','runs'] = '{}'::jsonb
      and not exists(select 1 from jsonb_each(p) e where jsonb_typeof(e.value)<>'number' or e.value::text !~ '^[0-9]{1,9}$')
    else false end
$$;
revoke all on function public.synera_privacy_ops_counters_valid(jsonb) from public,authenticated;
create table public.synera_privacy_ops_logs (
  id bigint generated always as identity primary key,
  event_code text not null check(event_code in ('privacy.purge','privacy.erasure','privacy.error')),
  counters jsonb not null default '{}'::jsonb check(public.synera_privacy_ops_counters_valid(counters)),
  created_at timestamptz not null default now()
);
create index synera_privacy_ops_logs_retention on public.synera_privacy_ops_logs(created_at);
alter table public.synera_privacy_ops_logs enable row level security;
revoke all on public.synera_privacy_ops_logs from public,authenticated;
create function public.synera_purge_expired_privacy_data() returns jsonb
language plpgsql security definer set search_path='' as $$
declare invitations bigint; intents bigint; logs bigint;
begin
  -- Daily: pending invitations expire at proposed_at, or at creation time for
  -- legacy rows that predate scheduling. A live grant retains its replay intent.
  delete from public.meeting_requests where status='pending' and coalesce(proposed_at,created_at) < now();
  get diagnostics invitations = row_count;
  delete from public.location_consent_intents i where i.created_at < now()-interval '30 days'
    and not exists(select 1 from public.meeting_location_grants g where g.intent_id=i.intent_id and g.status='active' and g.closes_at>=now());
  get diagnostics intents = row_count;
  delete from public.synera_privacy_ops_logs where created_at < now()-interval '90 days';
  get diagnostics logs = row_count;
  return jsonb_build_object('schedule','daily','expiredInvitations',invitations,
    'expiredLocationIntents',intents,'expiredOpsLogs',logs);
end $$;
revoke all on function public.synera_purge_expired_privacy_data() from public,authenticated;
grant execute on function public.synera_purge_expired_privacy_data() to service_role;
SAVEPOINT fixtures;
insert into neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") values
('11111111-1111-4111-8111-111111111111','Acceptance A','a@synera-acceptance.example',true,now(),now()),
('22222222-2222-4222-8222-222222222222','Acceptance B','b@synera-acceptance.example',true,now(),now()),
('33333333-3333-4333-8333-333333333333','Acceptance C','c@synera-acceptance.example',true,now(),now()),
('44444444-4444-4444-8444-444444444444','Uninvited','uninvited@synera-acceptance.example',true,now(),now());
insert into public.synera_pilot_members(email) values ('a@synera-acceptance.example'),('b@synera-acceptance.example'),('c@synera-acceptance.example');
create function pg_temp.act(p_actor text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_actor, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.try(p_sql text) returns text language plpgsql as $$
begin execute p_sql; return ''; exception when others then return sqlstate; end $$;
create function pg_temp.a() returns uuid language sql immutable as $$ select '11111111-1111-4111-8111-111111111111'::uuid $$;
create function pg_temp.b() returns uuid language sql immutable as $$ select '22222222-2222-4222-8222-222222222222'::uuid $$;
create function pg_temp.c() returns uuid language sql immutable as $$ select '33333333-3333-4333-8333-333333333333'::uuid $$;
create function pg_temp.u() returns uuid language sql immutable as $$ select '44444444-4444-4444-8444-444444444444'::uuid $$;
create function pg_temp.meeting() returns uuid language sql as $$ select current_setting('synera.acceptance.meeting')::uuid $$;
create function pg_temp.brief() returns jsonb language sql as $$
  select jsonb_build_object('version',1,'goal','Review one idea','offer_tags',jsonb_build_array('design'),'need_tags',jsonb_build_array('sales'),
   'languages',jsonb_build_array('en'),'modes',jsonb_build_array('exchange'),'available_from',current_date::text,
   'available_until',(current_date+14)::text,'city_code','zurich','max_km',25,'remote',true,'confidentiality',false,'accepts_confidentiality',false);
$$;
create function pg_temp.material() returns jsonb language sql as $$
  select jsonb_build_object('mode','exchange','components',jsonb_build_array('exchange'),
   'outcomes',jsonb_build_array(jsonb_build_object('receiver_id',pg_temp.b(),'capability_tag','design','target','One reviewed screen'),
                                jsonb_build_object('receiver_id',pg_temp.a(),'capability_tag','sales','target','One warm introduction')),
   'trial',jsonb_build_object('starts_on',(current_date+1)::text,'due_on',(current_date+7)::text,'deliverables',jsonb_build_array(
     jsonb_build_object('giver_id',pg_temp.a(),'receiver_id',pg_temp.b(),'capability_tag','design','target','One reviewed screen','acceptance_criteria','Opens on a phone'),
     jsonb_build_object('giver_id',pg_temp.b(),'receiver_id',pg_temp.a(),'capability_tag','sales','target','One warm introduction','acceptance_criteria','Introduction was sent'))),
   'compensation',jsonb_build_object('status','agreed_exchange'),
   'terms',jsonb_build_object('revision_limit',1,'confidentiality','not_required','intellectual_property','shared','cancellation','mutual_written_notice'));
$$;
create function pg_temp.outcome(p_action text, p_index int, p_extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object('action',p_action,'version',1,'termsHash',repeat('a',64),'index',p_index,'intentId',gen_random_uuid()) || p_extra;
$$;
do $$ begin execute format('grant usage on schema %I to authenticated', (select nspname from pg_catalog.pg_namespace where oid = pg_my_temp_schema())); end $$;
set local role authenticated;
select pg_temp.act(pg_temp.u()::text);
do $$ begin
  if public.synera_user_id() is distinct from pg_temp.u() then raise exception 'Identity fixture unsupported; inspect the provider function instead of replacing it'; end if;
  if public.synera_pilot_member() then raise exception 'Uninvited identity passed admission'; end if;
  if pg_temp.try($q$insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true)$q$) <> '42501' then raise exception 'Uninvited identity entered the pilot'; end if;
  if pg_temp.try('select 1 from public.synera_pilot_members') <> '42501' then raise exception 'Invited emails leaked'; end if;
  if pg_temp.try($q$select public.synera_room_create('Room','Goal',array[pg_temp.a()])$q$) <> '42501' then raise exception 'Uninvited identity created a room'; end if;
  if public.synera_room_list() <> '[]'::jsonb then raise exception 'Uninvited identity listed rooms'; end if;
end $$;
select pg_temp.act(pg_temp.a()::text);
do $$ begin
  if pg_temp.try($q$insert into public.profiles(id,display_name,is_discoverable,brief) values (public.synera_user_id(),'Before consent',false,pg_temp.brief())$q$) <> '42501' then raise exception 'Profile created before consent'; end if;
end $$;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief) values (public.synera_user_id(),'Stack A','Product design','B2B sales',true,pg_temp.brief());
do $$ begin
  if pg_temp.try($q$insert into public.profiles(id,display_name,is_discoverable,brief) values (pg_temp.b(),'Forged B',true,pg_temp.brief())$q$) <> '42501' then raise exception 'Profile created for another person'; end if;
  if pg_temp.try($q$insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (pg_temp.b(),'2026-09-05-pilot-3',true,true)$q$) <> '42501' then raise exception 'Consent recorded for another person'; end if;
  if pg_temp.try($q$update public.profiles set updated_at=now()-interval '2 years' where id=public.synera_user_id()$q$) <> '42501' then raise exception 'Client changed the freshness timestamp'; end if;
  if pg_temp.try($q$update public.profiles set brief=brief || '{"admin":true}'::jsonb where id=public.synera_user_id()$q$) <> '23514' then raise exception 'Unknown brief key accepted'; end if;
  if pg_temp.try('update public.synera_write_limits set invitations=0') <> '42501' then raise exception 'Client changed an admission counter'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief) values (public.synera_user_id(),'Stack B','B2B sales','Product design',true,pg_temp.brief());
select pg_temp.act(pg_temp.c()::text);
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values (public.synera_user_id(),'2026-09-05-pilot-3',true,true);
insert into public.profiles(id,display_name,offers,seeks,is_discoverable,brief) values (public.synera_user_id(),'Stack C','Research','Design',false,pg_temp.brief());
do $$ begin
  if (select count(*) from public.profiles) <> 3 then raise exception 'Own and discoverable profiles are not exactly what a member reads'; end if;
  perform pg_temp.act(pg_temp.a()::text);
  if (select count(*) from public.profiles) <> 2 then raise exception 'A private profile was readable'; end if;
end $$;
select pg_temp.act(pg_temp.a()::text);
insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at)
  values ('stack-ab',pg_temp.a(),pg_temp.b(),'exchange',pg_temp.material(),repeat('a',64),now()+interval '7 days');
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64));
do $$ begin
  if pg_temp.try($q$insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',pg_temp.b(),1,repeat('a',64))$q$) <> '42501' then raise exception 'Approval recorded for the other participant'; end if;
  if pg_temp.try($q$insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place) values (pg_temp.a(),pg_temp.b(),'Too early',now()+interval '1 day',30,'Zürich')$q$) <> '42501' then raise exception 'Invitation sent with one approval'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',0,'{"evidenceUri":"https://example.invalid/early"}'))$q$) <> '42501' then raise exception 'Result recorded with one approval'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if exists(select 1 from public.match_cases) or exists(select 1 from public.match_case_approvals) then raise exception 'Third party read an agreement'; end if;
  if pg_temp.try($q$insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64))$q$) <> '42501' then raise exception 'Third party approved an agreement'; end if;
  update public.match_cases set status='revoked' where case_id='stack-ab';
  update public.match_case_approvals set withdrawn_at=now() where case_id='stack-ab';
  perform pg_temp.act(pg_temp.a()::text);
  if (select status from public.match_cases where case_id='stack-ab') <> 'open' or (select count(*) from public.match_case_approvals where withdrawn_at is null) <> 1 then raise exception 'Third party changed an agreement'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64));
do $$ begin
  update public.match_case_approvals set withdrawn_at=now() where party_id=pg_temp.a();
  if (select count(*) from public.match_case_approvals where withdrawn_at is null) <> 2 then raise exception 'A participant withdrew the other participant''s approval'; end if;
end $$;
select pg_temp.act(pg_temp.a()::text);
insert into public.meeting_requests(sender_id,recipient_id,note,proposed_at,duration_minutes,meeting_place)
  values (pg_temp.a(),pg_temp.b(),'After both approvals',now()+interval '1 day',30,'Zürich');
select set_config('synera.acceptance.meeting',(select id::text from public.meeting_requests where status='pending'),true);
do $$ declare code text; begin
  if (select sender_name||'/'||recipient_name from public.meeting_requests) <> 'Stack A/Stack B' then raise exception 'Server name snapshot failed'; end if;
  code := pg_temp.try($q$update public.meeting_requests set status='accepted' where id=pg_temp.meeting()$q$);
  if (select status from public.meeting_requests) <> 'pending' then raise exception 'Sender accepted their own invitation'; end if;
  if pg_temp.try($q$update public.meeting_requests set sender_name='Forged' where id=pg_temp.meeting()$q$) <> '42501' then raise exception 'Client forged an identity snapshot'; end if;
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Before acceptance')$q$) <> '42501' then raise exception 'Direct message passed before acceptance'; end if;
  if pg_temp.try($q$select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Before acceptance')$q$) <> 'PT403' then raise exception 'Message intent passed before acceptance'; end if;
  if pg_temp.try($q$select public.synera_location_grant(pg_temp.meeting(),'approximate',15,true,gen_random_uuid())$q$) <> '42501' then raise exception 'Location consent recorded before acceptance'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) then raise exception 'Third party read an invitation'; end if;
  code := pg_temp.try($q$update public.meeting_requests set status='accepted'$q$);
  perform pg_temp.act(pg_temp.b()::text);
  if (select status from public.meeting_requests) <> 'pending' then raise exception 'Third party answered an invitation'; end if;
end $$;
update public.meeting_requests set status='accepted' where id=pg_temp.meeting();
do $$ begin if (select status from public.meeting_requests) <> 'accepted' then raise exception 'Recipient acceptance failed'; end if; end $$;
select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Accepted conversation, intent lane');
select pg_temp.act(pg_temp.a()::text);
insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Accepted conversation, direct lane');
do $$ begin
  if (select count(*) from public.meeting_messages) <> 2 then raise exception 'Participants do not read the same conversation'; end if;
  -- Refused by the admission trigger before the policy is reached, so assert the refusal and the stored rows.
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),pg_temp.b(),'Forged sender')$q$) = ''
    or exists(select 1 from public.meeting_messages where body='Forged sender') then raise exception 'Message written under the other participant''s name'; end if;
  if pg_temp.try($q$update public.meeting_messages set body='Edited'$q$) <> '42501' or pg_temp.try('delete from public.meeting_messages') <> '42501' then raise exception 'Stored message was editable'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if exists(select 1 from public.meeting_messages) then raise exception 'Third party read a conversation'; end if;
  if pg_temp.try($q$select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Outsider')$q$) <> 'PT403' then raise exception 'Third party wrote into a conversation'; end if;
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Outsider')$q$) <> '42501' then raise exception 'Third party wrote into a conversation directly'; end if;
end $$;
do $$ declare seen jsonb; begin
  perform pg_temp.act(pg_temp.c()::text);
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)))$q$) <> '42501' then raise exception 'Third party read an address agreement'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)))$q$) <> '42501' then raise exception 'Third party read results'; end if;
  if pg_temp.try($q$select public.synera_location_grant(pg_temp.meeting(),'approximate',15,true,gen_random_uuid())$q$) <> '42501' then raise exception 'Third party recorded location consent'; end if;
  seen := public.synera_location_access(pg_temp.meeting());
  if seen->'eligible' <> 'false'::jsonb or seen->'meeting' <> 'null'::jsonb or seen->'own' <> 'null'::jsonb or seen->'peer' <> 'null'::jsonb then raise exception 'Third party learned about a meeting through location access: %', seen; end if;
  -- An unknown identifier answers exactly like a foreign one: no existence oracle.
  if pg_temp.try($q$select public.synera_case_outcome('no-such-case',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)))$q$) <> '42501' then raise exception 'Unknown case is distinguishable from a foreign case'; end if;
  if public.synera_location_access(gen_random_uuid())->'meeting' <> 'null'::jsonb then raise exception 'Unknown meeting is distinguishable from a foreign meeting'; end if;
end $$;
select pg_temp.act(pg_temp.a()::text);
select set_config('synera.acceptance.proposal',gen_random_uuid()::text,true);
select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','propose','version',1,'termsHash',repeat('a',64),
  'intentId',current_setting('synera.acceptance.proposal'),'proposalId',null,'address','Bahnhofplatz 15, Zürich','consent',true)) is not null;
do $$ begin
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','accept','version',1,'termsHash',repeat('a',64),
    'intentId',gen_random_uuid(),'proposalId',current_setting('synera.acceptance.proposal'),'consent',true))$q$) <> '42501' then raise exception 'Proposer accepted their own address'; end if;
  if pg_temp.try($q$update public.meeting_requests set meeting_address='Forged place' where id=pg_temp.meeting()$q$) <> '42501' then raise exception 'One participant set the address directly'; end if;
  if (select meeting_address from public.meeting_requests) <> '' then raise exception 'Address changed before the other participant agreed'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','accept','version',1,'termsHash',repeat('a',64),
  'intentId',gen_random_uuid(),'proposalId',current_setting('synera.acceptance.proposal'),'consent',true))->'agreed' = 'true'::jsonb;
do $$ begin if (select meeting_address from public.meeting_requests) <> 'Bahnhofplatz 15, Zürich' then raise exception 'Agreed address was not stored'; end if; end $$;
select public.synera_location_grant(pg_temp.meeting(),'approximate',15,true,gen_random_uuid()) is not null;
do $$ begin
  if pg_temp.try('select 1 from public.meeting_location_grants') <> '42501' or pg_temp.try('select 1 from public.meeting_address_events') <> '42501'
    or pg_temp.try('select 1 from public.match_outcome_events') <> '42501' then raise exception 'A consent or attestation table is readable directly'; end if;
end $$;
select pg_temp.act(pg_temp.a()::text);
select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',0,'{"evidenceUri":"https://example.invalid/screen"}')) is not null;
do $$ begin
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('check',0,'{"scopeNotes":"Self check"}'))$q$) <> '42501' then raise exception 'Giver checked their own result'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))$q$) <> '42501' then raise exception 'Giver accepted their own result'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',1,'{"evidenceUri":"https://example.invalid/forged"}'))$q$) <> '42501' then raise exception 'Evidence submitted for the other participant''s deliverable'; end if;
  perform pg_temp.act(pg_temp.c()::text);
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))$q$) <> '42501' then raise exception 'Third party accepted a result'; end if;
  perform pg_temp.act(pg_temp.b()::text);
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))$q$) <> 'PT409' then raise exception 'Result accepted before its receiver checked it'; end if;
end $$;
select public.synera_case_outcome('stack-ab',pg_temp.outcome('check',0,'{"scopeNotes":"Opened on a phone"}')) is not null;
select public.synera_case_outcome('stack-ab',pg_temp.outcome('accept',0))->'outcome_confirmed' = 'false'::jsonb;
select pg_temp.act(pg_temp.a()::text);
update public.match_cases set terms_hash=repeat('b',64), material=jsonb_set(material,'{terms,revision_limit}','2') where case_id='stack-ab';
do $$ declare seen jsonb; begin
  if (select version from public.match_cases where case_id='stack-ab') <> 2 then raise exception 'Revision did not raise the version'; end if;
  perform pg_temp.act(pg_temp.b()::text);
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',pg_temp.outcome('submit',1,'{"evidenceUri":"https://example.invalid/late"}'))$q$) <> 'PT409' then raise exception 'Result recorded on superseded terms'; end if;
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','propose','version',1,'termsHash',repeat('a',64),
    'intentId',gen_random_uuid(),'proposalId',current_setting('synera.acceptance.proposal'),'address','Elsewhere','consent',true))$q$) <> 'PT409' then raise exception 'Address proposed on superseded terms'; end if;
  seen := public.synera_location_access(pg_temp.meeting());
  if seen->'eligible' <> 'false'::jsonb or seen->'own' <> 'null'::jsonb then raise exception 'Location consent survived a revision: %', seen; end if;
  if pg_temp.try($q$insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),1,repeat('a',64))$q$) <> '42501' then raise exception 'Superseded revision approved'; end if;
end $$;
select pg_temp.act(pg_temp.b()::text);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),2,repeat('b',64));
select pg_temp.act(pg_temp.a()::text);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values ('stack-ab',public.synera_user_id(),2,repeat('b',64));
select pg_temp.act(pg_temp.b()::text);
insert into public.profile_blocks(blocker_id,blocked_id) values (public.synera_user_id(),pg_temp.a());
select pg_temp.act(pg_temp.a()::text);
do $$ begin
  if exists(select 1 from public.profiles where id=pg_temp.b()) then raise exception 'Block did not hide the blocker'; end if;
  if pg_temp.try($q$insert into public.meeting_messages(meeting_id,sender_id,body) values (pg_temp.meeting(),public.synera_user_id(),'Blocked')$q$) <> '42501' then raise exception 'Direct message passed a block'; end if;
  if pg_temp.try($q$select public.synera_send_message(pg_temp.meeting(),gen_random_uuid(),'Blocked')$q$) <> 'PT403' then raise exception 'Message intent passed a block'; end if;
  if pg_temp.try($q$select public.synera_case_outcome('stack-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)))$q$) <> '42501' then raise exception 'Results stayed open across a block'; end if;
  if pg_temp.try($q$select public.synera_meeting_address(pg_temp.meeting(),'stack-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)))$q$) <> '42501' then raise exception 'Address stayed open across a block'; end if;
  if pg_temp.try($q$select public.synera_room_create('Room','Goal',array[pg_temp.b()])$q$) <> '42501' then raise exception 'Room invitation passed a block'; end if;
  if pg_temp.try($q$update public.match_cases set terms_hash=repeat('c',64), material=jsonb_set(material,'{terms,revision_limit}','3') where case_id='stack-ab'$q$) <> '42501' then raise exception 'New terms written across a block'; end if;
  delete from public.profile_blocks;
end $$;
select pg_temp.act(pg_temp.b()::text);
do $$ begin if (select count(*) from public.profile_blocks) <> 1 then raise exception 'The blocked person lifted the block'; end if; end $$;
delete from public.profile_blocks where blocker_id=public.synera_user_id();
select pg_temp.act(pg_temp.a()::text);
do $$ begin
  delete from public.profiles where id=pg_temp.b();
  if not exists(select 1 from public.profiles where id=pg_temp.b()) then raise exception 'A person deleted another person''s profile'; end if;
end $$;
delete from public.profiles where id=public.synera_user_id();
reset role;
do $$ declare r text; t text; begin
  if exists(select 1 from public.meeting_requests) or exists(select 1 from public.meeting_messages) or exists(select 1 from public.match_cases) then raise exception 'Profile deletion did not remove that person''s shared records'; end if;
  if (select invitations from public.synera_write_limits where user_id=pg_temp.a()) < 1 then raise exception 'Profile deletion reset admission'; end if;
  -- No anonymous role holds a privilege on any product table, including the tables added by later migrations.
  foreach r in array array['anon','anonymous'] loop
    if exists(select 1 from pg_roles where rolname=r) then
      for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' loop
        if has_table_privilege(r,'public.'||t,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Anonymous table grant remains on %', t; end if;
      end loop;
    end if;
  end loop;
  -- Every product table has row-level security switched on.
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) then raise exception 'A product table has row-level security off'; end if;
end $$;
select 'STACK_INVARIANTS_ACCEPTANCE_PASS' as result;
RESET ROLE;
ROLLBACK TO SAVEPOINT fixtures;
ROLLBACK;
