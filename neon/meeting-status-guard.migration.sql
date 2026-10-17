-- REVIEW ONLY. NOT APPLIED TO PRODUCTION. New additive migration; never rewrite applied or generated SQL.
-- Order: after neon/case-state.migration.sql. Preferably BEFORE neon/meeting-location.migration.sql, so the
-- stack never exists without it; it is also safe after meeting-location and repairs that stack.
--
-- Why this exists (reproduced on PostgreSQL 16.15, artifacts/opus-review-20261009/REPORT.uk.md):
-- 1. PostgreSQL ORs the USING of every permissive UPDATE policy separately from the OR of their WITH CHECK.
--    meeting-location adds meeting_address_participants (WITH CHECK: status='accepted' for either participant).
--    Its WITH CHECK combines with meetings_cancel USING (sender, pending/accepted): the SENDER could set their
--    own pending invitation to 'accepted' and open the private conversation without the recipient.
-- 2. meetings_need_approved_case guards INSERT only. A pending invitation outlived the two approvals that
--    authorised it: after a material revision, a withdrawal, a closure or expiry the recipient could still accept.
--
-- The guard states the reviewed transitions on the OLD/NEW row, independent of any present or future policy
-- union (same technique as synera_meeting_address_guard). SECURITY INVOKER: no privilege elevation; the
-- recipient reads the pair's case and both approvals through the existing RLS policies.
-- It binds exactly the callers that row-level security binds (row_security_active): the table owner and
-- SECURITY DEFINER maintenance already bypass every policy and keep their own responsibility. The reviewed
-- acceptance fixtures rely on that owner path, so the guard must not be stricter than the policies there.
--
-- Before a live apply, count (metadata only, no private rows) invitations still 'pending' from the older
-- flow: after this migration they can be accepted only once their pair holds an approved agreement,
-- exactly as a new invitation can be sent only then. Declining and cancelling them stay available.
begin;
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
commit;
