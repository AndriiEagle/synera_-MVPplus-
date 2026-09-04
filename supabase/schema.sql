-- Applied to synera-demo (onwvsxgoxuuiopwnvvvy) on 2026-09-04 using apply_migration.
-- Migration name: synera_profiles_and_meeting_requests. This file is the SQL snapshot.
-- Do not reapply to that project or apply to any older project.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  city text not null default '' check (char_length(city) <= 80),
  offers text not null default '' check (char_length(offers) <= 300),
  seeks text not null default '' check (char_length(seeks) <= 300),
  is_discoverable boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select, delete on public.profiles to authenticated;
grant insert (id, display_name, city, offers, seeks, is_discoverable),
      update (id, display_name, city, offers, seeks, is_discoverable)
      on public.profiles to authenticated;

create policy profiles_read on public.profiles for select to authenticated
  using ((select auth.uid()) = id or is_discoverable);
create policy profiles_create on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

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
revoke all on public.meeting_requests from public, anon, authenticated;
grant select on public.meeting_requests to authenticated;
grant insert (sender_id, recipient_id, note) on public.meeting_requests to authenticated;
grant update (status) on public.meeting_requests to authenticated;

create policy meetings_read on public.meeting_requests for select to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));
create policy meetings_create on public.meeting_requests for insert to authenticated
  with check ((select auth.uid()) = sender_id and status = 'pending'
    and exists (select 1 from public.profiles p where p.id = recipient_id and p.is_discoverable));
create policy meetings_respond on public.meeting_requests for update to authenticated
  using ((select auth.uid()) = recipient_id and status = 'pending')
  with check ((select auth.uid()) = recipient_id and status in ('accepted', 'declined'));

commit;
