-- Semantic guard, run against old and proposed schemas in the same fixture.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
  begin
    update public.meeting_requests set meeting_address='Unapproved replacement' where id='44444444-4444-4444-8444-444444444444';
    raise exception 'One participant changed the address without peer approval';
  exception when insufficient_privilege then null; end;
  if (select meeting_address from public.meeting_requests where id='44444444-4444-4444-8444-444444444444')<>'' then
    raise exception 'Rejected direct patch changed the address';
  end if;
end $$;
reset role;
