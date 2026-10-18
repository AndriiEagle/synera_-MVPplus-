-- Disposable-only lifecycle simulation; no provider account is deleted or recreated here.
-- Old A is already erased by the full runner. A synthetic fresh provider sub uses A's verified email.
begin;
insert into neon_auth."user"(id,name,email,"emailVerified")
select '55555555-5555-4555-8555-555555555555','Lifecycle fixture',email,true from neon_auth."user"
where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
do $$ begin
  if public.synera_pilot_member() then raise exception 'Fresh provider sub inherited erased email admission'; end if;
  begin
    insert into public.profiles(id,display_name) values(public.synera_user_id(),'Recreated');
    raise exception 'Fresh provider sub recreated erased app access';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if exists(select 1 from public.synera_pilot_members m join neon_auth."user" u on m.email=lower(u.email) where u.id='11111111-1111-4111-8111-111111111111') then raise exception 'Erased admission email retained'; end if;
  if not exists(select 1 from public.synera_pilot_members m join neon_auth."user" u on m.email=lower(u.email) where u.id='22222222-2222-4222-8222-222222222222') then raise exception 'Peer admission changed'; end if;
end $$;
select 'PROFILE_ERASURE_LIFECYCLE_PASS';
rollback;
