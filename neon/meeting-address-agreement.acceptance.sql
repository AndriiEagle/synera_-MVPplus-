-- Local disposable fixture only, real SQL/RLS under identity shim. Always rollback.
select set_config('synera.test_hash',(select terms_hash from public.match_cases where case_id='case-address-ab'),true);
create function pg_temp.address_call(a text,i uuid,p uuid,d text default null,consent boolean default null) returns jsonb
language plpgsql security invoker as $$ declare request jsonb; begin
  request:=jsonb_build_object('action',a,'version',1,'termsHash',current_setting('synera.test_hash'));
  if a<>'state' then request:=request||jsonb_build_object('intentId',i,'proposalId',p); end if;
  if d is not null then request:=request||jsonb_build_object('address',d); end if;
  if consent is not null then request:=request||jsonb_build_object('consent',consent); end if;
  return public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',request);
end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.synera_location_grant('44444444-4444-4444-8444-444444444444','approximate',15,true,'bbbbbbbb-bbbb-4bbb-8bbb-000000000001');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select public.synera_location_grant('44444444-4444-4444-8444-444444444444','approximate',15,true,'bbbbbbbb-bbbb-4bbb-8bbb-000000000002');
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);
  if r->'agreed'<>'false'::jsonb or r->'proposal'<>'null'::jsonb or r->'events'<>'[]'::jsonb then raise exception 'Empty state claims agreement'; end if;
  r:=pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,'Café Zürich — first choice',true);
  if r->'agreed'<>'false'::jsonb or r#>>'{meeting,meeting_address}'<>'' or r#>>'{proposal,address}'<>'Café Zürich — first choice' then raise exception 'Proposal installed without peer'; end if;
  r:=pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,'Café Zürich — first choice',true);
  if jsonb_array_length(r->'events')<>1 then raise exception 'Retry duplicated proposal'; end if;
  begin
    perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000002','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,true);
    raise exception 'Proposer accepted own address';
  exception when insufficient_privilege then null; end;
  begin
    perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','Different address',true);
    raise exception 'Intent reused with different address';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000020','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','No consent',false);
    raise exception 'False consent created proposal';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',jsonb_build_object('action','state','version',1,'termsHash',current_setting('synera.test_hash'),'actor_id','22222222-2222-4222-8222-222222222222'));
    raise exception 'Caller forged actor';
  exception when invalid_parameter_value then null; end;
  begin perform count(*) from public.meeting_address_events; raise exception 'Caller read private events directly'; exception when insufficient_privilege then null; end;
  begin update public.meeting_address_events set address='Rewrite'; raise exception 'Caller rewrote events'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin if (select count(*) from public.meeting_location_grants where status='active')<>2 then raise exception 'Pending proposal changed GPS grants'; end if; end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  begin perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000001');
    raise exception 'Missing explicit consent accepted address'; exception when invalid_parameter_value then null; end;
  r:=pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,true);
  if r->'agreed'<>'true'::jsonb or r#>>'{meeting,meeting_address}'<>'Café Zürich — first choice' or jsonb_array_length(r->'events')<>2 then raise exception 'Peer acceptance failed to install exact address'; end if;
  if r#>>'{events,0,actor_id}'<>'11111111-1111-4111-8111-111111111111' or r#>>'{events,1,actor_id}'<>'22222222-2222-4222-8222-222222222222' then raise exception 'Actor identity not derived'; end if;
  r:=pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000003','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,true);
  if jsonb_array_length(r->'events')<>2 then raise exception 'Retry duplicated acceptance'; end if;
end $$;
reset role;
do $$ begin if (select count(*) from public.meeting_location_grants where status='revoked')<>2 then raise exception 'Accepted address did not revoke both old GPS grants'; end if; end $$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000004','aaaaaaaa-aaaa-4aaa-8aaa-000000000001','Second choice',true);
select pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','aaaaaaaa-aaaa-4aaa-8aaa-000000000004','Third choice',true);
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  begin perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000006','aaaaaaaa-aaaa-4aaa-8aaa-000000000004',null,true);
    raise exception 'Late acceptance installed superseded proposal'; exception when sqlstate 'PT409' then null; end;
  r:=pg_temp.address_call('decline','aaaaaaaa-aaaa-4aaa-8aaa-000000000007','aaaaaaaa-aaaa-4aaa-8aaa-000000000005');
  if r#>>'{meeting,meeting_address}'<>'Café Zürich — first choice' or r->'agreed'<>'false'::jsonb or r#>>'{proposal,decision}'<>'decline' then raise exception 'Decline changed installed address'; end if;
  begin perform pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000008','aaaaaaaa-aaaa-4aaa-8aaa-000000000005',null,true);
    raise exception 'Declined proposal later accepted'; exception when sqlstate 'PT409' then null; end;
  r:=pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','Partner choice',true);
  if r#>>'{proposal,proposer_id}'<>'22222222-2222-4222-8222-222222222222' then raise exception 'Other participant cannot propose'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare r jsonb; begin
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000001',null,'Café Zürich — first choice',true);
    raise exception 'Old retry revived superseded choice'; exception when sqlstate 'PT409' then null; end;
  r:=pg_temp.address_call('accept','aaaaaaaa-aaaa-4aaa-8aaa-000000000010','aaaaaaaa-aaaa-4aaa-8aaa-000000000009',null,true);
  if r->'agreed'<>'true'::jsonb or r#>>'{meeting,meeting_address}'<>'Partner choice' or jsonb_array_length(r->'events')<>7
    or r#>>'{events,0,address}'<>'Café Zürich — first choice' then raise exception 'Reciprocal acceptance lost history'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Outsider read address history'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims','{}',true);
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Anonymous read address history'; exception when insufficient_privilege then null; end; end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

savepoint changed_schedule;
reset role;
update public.meeting_requests set proposed_at=proposed_at+interval '1 hour' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);
  if r->'agreed'<>'false'::jsonb or r#>'{proposal,current}'<>'false'::jsonb then raise exception 'Changed schedule retained address approval'; end if;
end $$;
rollback to savepoint changed_schedule;

savepoint revised_case;
reset role;
update public.match_cases set material=current_setting('synera.revised_material')::jsonb,terms_hash=current_setting('synera.revised_hash') where case_id='case-address-ab';
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,party,version,terms_hash from public.match_cases cross join lateral unnest(array[participant_low,participant_high]) party where case_id='case-address-ab';
set local role authenticated;
do $$ declare request jsonb;r jsonb;begin
  begin perform pg_temp.address_call('state',null,null);raise exception 'Old case version read as current';exception when sqlstate 'PT409' then null;end;
  request:=jsonb_build_object('action','state','version',2,'termsHash',current_setting('synera.revised_hash'));
  r:=public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',request);
  if r->'agreed'<>'false'::jsonb or r#>'{proposal,current}'<>'false'::jsonb then raise exception 'New case revision inherited old address agreement';end if;
  begin
    perform public.synera_meeting_address('44444444-4444-4444-8444-444444444444','case-address-ab',request||jsonb_build_object('action','accept','intentId','aaaaaaaa-aaaa-4aaa-8aaa-000000000023','proposalId','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','consent',true));
    raise exception 'Old address proposal accepted under new case approval';
  exception when sqlstate 'PT409' then null;end;
end $$;
rollback to savepoint revised_case;

savepoint expired_case;
reset role;
update public.match_cases set expires_at=now()-interval '1 second' where case_id='case-address-ab';
set local role authenticated;
do $$ declare r jsonb;begin
  r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb then raise exception 'Expired case retained agreement';end if;
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000024','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Expired case',true);raise exception 'Expired case permitted proposal';exception when sqlstate 'PT409' then null;end;
end $$;
rollback to savepoint expired_case;

savepoint expired_meeting;
reset role;
update public.meeting_requests set proposed_at=now()-interval '1 minute' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000011','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Past meeting',true); raise exception 'Past meeting accepted proposal'; exception when sqlstate 'PT409' then null; end; end $$;
rollback to savepoint expired_meeting;

savepoint online_meeting;
reset role;
update public.meeting_requests set meeting_place='Онлайн' where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000012','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Physical place',true); raise exception 'Online meeting accepted physical address'; exception when sqlstate 'PT409' then null; end; end $$;
rollback to savepoint online_meeting;

savepoint missing_place;
reset role;
update public.meeting_requests set meeting_place=null where id='44444444-4444-4444-8444-444444444444';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000021','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','No city selected',true); raise exception 'Missing place accepted address proposal'; exception when sqlstate 'PT409' then null; end; end $$;
rollback to savepoint missing_place;

savepoint approval_withdrawn;
reset role;
update public.match_case_approvals set withdrawn_at=now() where case_id='case-address-ab' and party_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb then raise exception 'Withdrawal retained agreement'; end if;
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000013','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Withdrawn approval',true); raise exception 'Withdrawn approval permitted proposal'; exception when insufficient_privilege then null; end;
end $$;
rollback to savepoint approval_withdrawn;

savepoint peer_consent;
reset role;
-- Produce a missing peer consent without deleting data or relaxing constraints.
insert into neon_auth."user"(id,name,email) values('55555555-5555-4555-8555-555555555555','Unrelated consent fixture','d@synera-acceptance.example');
update public.pilot_consents set user_id='55555555-5555-4555-8555-555555555555' where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Revoked peer consent exposed history'; exception when insufficient_privilege then null; end; end $$;
rollback to savepoint peer_consent;

savepoint blocked_pair;
reset role;
insert into public.profile_blocks(blocker_id,blocked_id) values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111');
set local role authenticated;
do $$ begin begin perform pg_temp.address_call('state',null,null); raise exception 'Blocked pair exposed history'; exception when insufficient_privilege then null; end; end $$;
rollback to savepoint blocked_pair;

savepoint closed_case;
reset role;
update public.match_cases set status='revoked' where case_id='case-address-ab';
set local role authenticated;
do $$ declare r jsonb; begin
  r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb then raise exception 'Closed case retained agreement'; end if;
  begin perform pg_temp.address_call('propose','aaaaaaaa-aaaa-4aaa-8aaa-000000000014','aaaaaaaa-aaaa-4aaa-8aaa-000000000009','Closed case',true); raise exception 'Closed case permitted proposal'; exception when sqlstate 'PT409' then null; end;
end $$;
rollback to savepoint closed_case;

-- The independent status cancellation path remains available to the sender.
set local role authenticated;
update public.meeting_requests set status='cancelled' where id='44444444-4444-4444-8444-444444444444';
do $$ declare r jsonb; begin r:=pg_temp.address_call('state',null,null);if r->'agreed'<>'false'::jsonb or r#>>'{meeting,status}'<>'cancelled' then raise exception 'Cancellation lost or retained agreement'; end if; end $$;
reset role;
rollback;
