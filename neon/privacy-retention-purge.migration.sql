-- REVIEW ONLY. NOT APPLIED. Additive after privacy-complete-erasure.migration.sql.
-- Invoke public.synera_purge_expired_privacy_data() once daily from an operator
-- scheduler using service_role. The database does not create or hide a scheduler.
begin;
do $$ begin
  if to_regclass('public.meeting_requests') is null or to_regclass('public.location_consent_intents') is null then
    raise exception 'Apply reviewed journey migrations first';
  end if;
  if to_regprocedure('public.synera_purge_expired_privacy_data()') is not null then
    raise exception 'Inspect existing privacy purge migration';
  end if;
end $$;

-- Operational entries must contain only controlled event codes and numeric
-- counters; no authenticated client receives table access.
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
commit;
