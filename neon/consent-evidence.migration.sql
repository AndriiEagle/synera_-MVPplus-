-- REVIEW PROPOSAL ONLY. Additive documentary events; no existing grant is backfilled.
-- Legacy pilot_consents and all existing admission policies remain unchanged.
begin;
create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  policy_version text not null default '2026-09-05-pilot-3',
  action text not null check(action in ('grant','withdraw')),
  purpose text not null check(length(btrim(purpose)) between 1 and 120),
  recipient text not null check(length(btrim(recipient)) between 1 and 120),
  document_version text not null check(length(btrim(document_version)) between 1 and 120),
  document_text text not null check(octet_length(document_text) between 1 and 65536),
  document_sha256 text not null check(document_sha256 ~ '^[0-9a-f]{64}$'
    and document_sha256=encode(sha256(convert_to(document_text,'UTF8')),'hex')),
  locale text not null check(locale in ('uk','de','en')),
  occurred_at timestamptz not null default now(),
  expires_at timestamptz,
  check(expires_at is null or action='withdraw' or expires_at > occurred_at),
  -- Complete erasure deletes pilot_consents; remove these documentary rows too,
  -- while preserving the existing minimal profile/stale-session tombstone.
  foreign key(user_id,policy_version) references public.pilot_consents(user_id,policy_version) on delete cascade
);
alter table public.consent_events enable row level security;
revoke all on public.consent_events from public, authenticated;
grant select on public.consent_events to authenticated;
-- No UPDATE/DELETE grant: withdrawal appends a new event.
grant insert (user_id,action,purpose,recipient,document_version,document_text,document_sha256,locale,expires_at) on public.consent_events to authenticated;
create policy consent_events_read on public.consent_events for select to authenticated
  using(user_id=(select public.synera_user_id()) and (select public.synera_pilot_member()));
create policy consent_events_create on public.consent_events for insert to authenticated
  with check(user_id=(select public.synera_user_id()) and (select public.synera_pilot_member()));
commit;
