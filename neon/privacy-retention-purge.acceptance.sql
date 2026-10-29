-- Disposable PostgreSQL only. The service-role-only purge is verified by its runner.
begin;
set local role service_role;
select public.synera_purge_expired_privacy_data();
reset role;
select 'PRIVACY_RETENTION_PURGE_ACCEPTANCE_PASS';
rollback;
