-- ONE email only. Keep the owner's existing row. Do not commit the filled file.
BEGIN;
DO $member$ DECLARE partner_email text := lower(btrim('<PARTNER_EMAIL>')); BEGIN
if partner_email='<partner_email>' or partner_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Replace PARTNER_EMAIL locally'; end if;
if to_regclass('public.synera_pilot_members') is null then raise exception 'Admission schema missing'; end if;
if exists(select 1 from neon_auth."user" u join public.profile_erasures e on e.user_id=u.id where lower(u.email)=partner_email) then raise exception 'Partner has an erasure tombstone; do not bypass'; end if;
insert into public.synera_pilot_members(email) values(partner_email) on conflict do nothing;
END $member$;
select exists(select 1 from public.synera_pilot_members where email=lower(btrim('<PARTNER_EMAIL>'))) as admitted;
COMMIT;
-- Removal is separate: 21-remove-member.sql.
