-- REVIEW CANDIDATE ONLY. Not applied; not a generated migration.
-- Target: synera-demo ONLY, after API recovery, explicit migration approval,
-- local Postgres acceptance and generation through the Supabase CLI.
begin;
create table public.pilot_consents (
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_version text not null check (policy_version = '2026-09-05-pilot-1'),
  terms_accepted boolean not null check (terms_accepted),
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  accepted_at timestamptz not null default now(),
  primary key (user_id, policy_version)
);
alter table public.pilot_consents enable row level security;
revoke all on public.pilot_consents from public, anon, authenticated;
grant select on public.pilot_consents to authenticated;
grant insert (user_id, policy_version, terms_accepted, privacy_acknowledged) on public.pilot_consents to authenticated;
create policy pilot_consent_read on public.pilot_consents for select to authenticated
  using ((select auth.uid()) = user_id);
create policy pilot_consent_insert on public.pilot_consents for insert to authenticated
  with check ((select auth.uid()) = user_id and terms_accepted and privacy_acknowledged);

-- Restrictive policies combine with the existing ownership policies.
-- User-editable Auth metadata never acts as authorization evidence.
create policy pilot_profiles_read on public.profiles as restrictive for select to authenticated
  using (exists (select 1 from public.pilot_consents where user_id = (select auth.uid()) and policy_version = '2026-09-05-pilot-1'));
create policy pilot_profiles_insert on public.profiles as restrictive for insert to authenticated
  with check (exists (select 1 from public.pilot_consents where user_id = (select auth.uid()) and policy_version = '2026-09-05-pilot-1'));
create policy pilot_profiles_update on public.profiles as restrictive for update to authenticated
  using (exists (select 1 from public.pilot_consents where user_id = (select auth.uid()) and policy_version = '2026-09-05-pilot-1'))
  with check (exists (select 1 from public.pilot_consents where user_id = (select auth.uid()) and policy_version = '2026-09-05-pilot-1'));
create policy pilot_meetings on public.meeting_requests as restrictive for all to authenticated
  using (exists (select 1 from public.pilot_consents where user_id = (select auth.uid()) and policy_version = '2026-09-05-pilot-1'))
  with check (exists (select 1 from public.pilot_consents where user_id = (select auth.uid()) and policy_version = '2026-09-05-pilot-1'));
commit;
