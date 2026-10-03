-- Generated from supabase/case-state.proposal.sql; NOT APPLIED TO LIVE.
-- Source SHA256=a8e245546a741b35a1c82647a904e9910744a07f0e23c79418987e56e457b6c0
begin;
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
commit;
