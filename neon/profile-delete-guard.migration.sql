-- REVIEW ONLY. NOT APPLIED. Additive protection for an existing reviewed DB.
-- No profile or shared row is deleted. Erasure uses the existing self-only RPCs.
begin;
drop policy if exists profiles_delete on public.profiles;
revoke delete on public.profiles from authenticated;
commit;
