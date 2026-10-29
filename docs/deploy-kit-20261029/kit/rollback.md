# Rollback

Fast route: Pages → synera-pilot → Deployments → … on the saved previous PRODUCTION deployment → Rollback to this deployment. Restore saved environment values for future uploads. Do not assume SQL rolled back. No tested 2-minute database restore is claimed.

Admission down: run 21-remove-member.sql with ONLY the partner email and remove that address from the next deployment's SYNERA_PILOT_EMAILS. Does not revoke provider sessions directly.

Schema down: source migrations have no reviewed lossless down scripts. New tables can hold shared agreements and results. Production must retain additive tables or use the owner's verified recovery point; never execute destructive DROP automatically.

For an EMPTY disposable replay only, the entire 11-acceptance-disposable.sql ends ROLLBACK: this is its complete SQL down statement. On a failed migration transaction use ROLLBACK; no DDL in 10-migrate.sql commits before its final catalog gate.

```sql
-- Current failed/uncommitted migration/replay only:
ROLLBACK;
-- Partner admission only (filled locally):
BEGIN;
DELETE FROM public.synera_pilot_members WHERE email=lower(btrim('<PARTNER_EMAIL>'));
COMMIT;
```

Do not replace functions with old bodies after new data was written. A successful Pages rollback proves routing to that deployment, not restored database state or emptied phone caches.
