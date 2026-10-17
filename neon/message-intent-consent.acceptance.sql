-- Local isolated acceptance only. All changed fixture state rolls back.
begin;
update public.profile_blocks set blocked_id='33333333-3333-4333-8333-333333333333'
 where blocker_id='11111111-1111-4111-8111-111111111111' and blocked_id='22222222-2222-4222-8222-222222222222';
select set_config('synera.acceptance.message',row_to_json(m)::text,true) from public.meeting_messages m where sender_id='11111111-1111-4111-8111-111111111111' limit 1;
insert into neon_auth."user"(id,name,email,"emailVerified") values('77777777-7777-4777-8777-777777777777','Consent fixture','consent@synera-acceptance.example',true);
-- Reassign only a fixture consent inside this transaction; leave the actor without a row.
update public.pilot_consents set user_id='77777777-7777-4777-8777-777777777777' where user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$
declare row jsonb := current_setting('synera.acceptance.message')::jsonb;
begin
  if row is null then raise exception 'Consent oracle fixture missing'; end if;
  begin
    perform public.synera_send_message((row->>'meeting_id')::uuid,(row->>'id')::uuid,row->>'body');
    raise exception 'Missing current consent allowed message replay';
  exception when sqlstate 'PT403' then null; end;
  if (select count(*) from public.meeting_messages) <> 0 then raise exception 'Missing consent allowed private history read'; end if;
  begin
    insert into public.meeting_messages(meeting_id,sender_id,body) values((row->>'meeting_id')::uuid,public.synera_user_id(),'Bypass new RPC');
    raise exception 'Missing consent allowed legacy direct insert';
  exception when insufficient_privilege then null; end;
end $$;
rollback;
