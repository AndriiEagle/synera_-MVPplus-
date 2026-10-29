-- Remove only the new partner admission, not Auth, profiles or the owner's row.
BEGIN;
DO $member$ BEGIN if '<PARTNER_EMAIL>' like '<%' then raise exception 'Replace PARTNER_EMAIL locally'; end if; END $member$;
DELETE FROM public.synera_pilot_members WHERE email=lower(btrim('<PARTNER_EMAIL>'));
COMMIT;
