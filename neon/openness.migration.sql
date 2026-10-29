-- REVIEW ONLY. NOT APPLIED. No API or scheduler is enabled by this proposal.
-- Depends on the accepted profiles schema, authenticated role and synera_user_id().
-- Review auth identity, blocks/moderation, rate limits and two-real-user isolation
-- before exposing this table. The local Demo never connects to it.
begin;
create table public.openness (
  "user" uuid primary key references public.profiles(id) on delete cascade,
  until timestamptz not null,
  precision text not null check (precision in ('city','district')),
  district text,
  give text not null check (char_length(trim(give)) between 1 and 180),
  need text not null check (char_length(trim(need)) between 1 and 180),
  check ((precision='city' and district is null) or
    (precision='district' and district is not null and district in ('altstadt','kreis4','kreis5','seefeld','wiedikon')))
);
create index openness_until on public.openness(until);
alter table public.openness enable row level security;
revoke all on public.openness from public, authenticated;
grant select, insert, update, delete on public.openness to authenticated;

-- Avoid recursive RLS: the trusted migration/table owner performs this one lookup.
-- Never transfer function/table ownership to an application/login role.
-- No caller-selected user id, fixed schema, no SQL text or arbitrary query.
create function public.synera_is_open() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.openness o
    where o."user"=public.synera_user_id() and o.until>statement_timestamp());
$$;
revoke all on function public.synera_is_open() from public;
grant execute on function public.synera_is_open() to authenticated;

-- Even your own row is unreadable once closed. Revoke your active row via DELETE;
-- the maintenance owner removes expired rows. Verify both paths in SQL acceptance.
create policy openness_read on public.openness for select to authenticated
  using (until>statement_timestamp() and public.synera_is_open());
create policy openness_insert on public.openness for insert to authenticated
  with check ("user"=public.synera_user_id() and until>statement_timestamp()
    and until<=statement_timestamp()+interval '27 hours');
create policy openness_update on public.openness for update to authenticated
  using ("user"=public.synera_user_id())
  with check ("user"=public.synera_user_id() and until>statement_timestamp()
    and until<=statement_timestamp()+interval '27 hours');
create policy openness_revoke on public.openness for delete to authenticated
  using ("user"=public.synera_user_id());

-- Scheduled purge PROPOSAL: trusted server maintenance owner only, no user RPC.
create function public.synera_purge_openness() returns bigint
language plpgsql security definer set search_path = '' as $$
declare removed bigint;
begin
  delete from public.openness where until<=statement_timestamp();
  get diagnostics removed = row_count;
  return removed;
end $$;
revoke all on function public.synera_purge_openness() from public, authenticated;
-- Neon deployments can have anon, anonymous, both, or neither. Match the
-- existing migrations: revoke optional roles only when they actually exist.
do $$ declare r text; begin
  foreach r in array array['anon','anonymous'] loop
    if exists (select 1 from pg_roles where rolname=r) then
      execute format('revoke all on public.openness from %I',r);
      execute format('revoke all on function public.synera_is_open() from %I',r);
      execute format('revoke all on function public.synera_purge_openness() from %I',r);
    end if;
  end loop;
end $$;
-- Before launch: schedule the trusted maintenance owner every minute to call
-- SELECT public.synera_purge_openness(); and monitor success. No extension or
-- cron is installed here. Logical expiry is immediate in RLS; physical purge
-- needs that separately approved job. Disable all response/proxy caching.
commit;
