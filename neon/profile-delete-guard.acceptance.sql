-- REVIEW ONLY. Disposable PostgreSQL with the existing A/B privacy fixture.
-- Authenticated A must not cascade-delete B's shared records through profiles.
begin;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare affected bigint; begin
  begin
    delete from public.profiles where id='11111111-1111-4111-8111-111111111111';
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'Direct profile deletion cascaded'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$ begin
  if not exists(select 1 from public.profiles where id='11111111-1111-4111-8111-111111111111') then raise exception 'Actor profile lost'; end if;
  if not exists(select 1 from public.meeting_requests where sender_id='22222222-2222-4222-8222-222222222222' and recipient_id='11111111-1111-4111-8111-111111111111') then raise exception 'Peer meeting lost'; end if;
end $$;
select 'PROFILE_DELETE_GUARD_ACCEPTANCE_PASS';
rollback;
