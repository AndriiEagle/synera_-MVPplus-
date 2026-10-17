-- Local/disposable only. Runner supplies fixtures and an approved two-leg case.
-- Append to the same BEGIN transaction as the review migration. Always ROLLBACK.
-- Canonical material sorts by receiver: leg 0 is B -> A, leg 1 is A -> B.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"state"}');
  if r->'outcome_confirmed'<>'false'::jsonb or r#>>'{deliverables,0,phase}'<>'pending' or jsonb_array_length(r->'events')<>0 then raise exception 'Pending outcome promoted'; end if;
  begin
    perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000001","evidenceUri":"https://example.com/proof"}');
    raise exception 'Outcome accepted without both approvals';
  exception when insufficient_privilege then null; end;
  begin perform count(*) from public.match_outcome_events; raise exception 'Raw outcome history exposed'; exception when insufficient_privilege then null; end;
  begin delete from public.match_outcome_events; raise exception 'Client could delete outcome history'; exception when insufficient_privilege then null; end;
  begin update public.match_outcome_events set kind='accept'; raise exception 'Client could rewrite outcome history'; exception when insufficient_privilege then null; end;
end $$;
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,public.synera_user_id(),version,terms_hash from public.match_cases where case_id='case-outcome-ab';
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,public.synera_user_id(),version,terms_hash from public.match_cases where case_id='case-outcome-ab';
do $$ declare p jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000001","evidenceUri":"https://example.com/not-mine"}');
    raise exception 'Receiver supplied giver evidence'; exception when insufficient_privilege then null; end;
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000002"}');
    raise exception 'Receiver accepted without evidence and scope'; exception when sqlstate 'PT409' then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; request jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  request:=p||'{"action":"submit","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000001","evidenceUri":"https://example.com/proof"}';
  r:=public.synera_case_outcome('case-outcome-ab',request);
  if r#>>'{deliverables,0,phase}'<>'evidence_supplied' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'Evidence promoted to confirmed outcome'; end if;
  r:=public.synera_case_outcome('case-outcome-ab',request);
  if jsonb_array_length(r->'events')<>1 then raise exception 'Repeated intent duplicated an event'; end if;
  begin perform public.synera_case_outcome('case-outcome-ab',request||'{"evidenceUri":"https://example.com/changed"}');
    raise exception 'Reused intent accepted different evidence'; exception when sqlstate 'PT409' then null; end;
  begin perform public.synera_case_outcome('case-outcome-ab',request||'{"actor_id":"11111111-1111-4111-8111-111111111111"}');
    raise exception 'Client supplied actor identity'; exception when invalid_parameter_value then null; end;
  begin perform public.synera_case_outcome('case-outcome-ab',request||'{"created_at":"2020-01-01"}');
    raise exception 'Client supplied outcome clock'; exception when invalid_parameter_value then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','state','version',1,'termsHash',repeat('a',64)));
    raise exception 'Outsider read outcome'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"check","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000003","scopeNotes":"Перевірено узгоджений сценарій × Zürich 💛"}');
  if r#>>'{deliverables,0,phase}'<>'checked_with_scope' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'Scope check promoted to outcome'; end if;
  if r#>>'{deliverables,0,scope_notes}'<>'Перевірено узгоджений сценарій × Zürich 💛' then raise exception 'Unicode scope altered'; end if;
end $$;
-- This exact semantic assertion must fail after removing the receiver-only guard.
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000002"}');
    raise exception 'Giver accepted own result'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"decline","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000004","reason":"lazy_person"}');
    raise exception 'Blame label accepted'; exception when invalid_parameter_value then null; end;
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"decline","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000004","reason":"below_acceptance_criteria"}');
  if r#>>'{deliverables,0,phase}'<>'declined_dispute_open' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'Decline not recorded neutrally'; end if;
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":0,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000005"}');
  if r#>>'{deliverables,0,phase}'<>'accepted' or r#>>'{deliverables,1,phase}'<>'pending' or r->'outcome_confirmed'<>'false'::jsonb then raise exception 'One leg confirmed whole collaboration'; end if;
  if jsonb_array_length(r->'events')<>4 or not exists(select 1 from jsonb_array_elements(r->'events') e where e->>'kind'='decline') then raise exception 'Resolution erased decline history'; end if;
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":1,"intentId":"bbbbbbbb-bbbb-4bbb-8bbb-000000000006","evidenceUri":"https://example.com/second"}');
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare p jsonb; r jsonb; begin
  select jsonb_build_object('version',version,'termsHash',terms_hash) into p from public.match_cases where case_id='case-outcome-ab';
  perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"check","index":1,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000003","scopeNotes":"Другий результат перевірений"}');
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"accept","index":1,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000004"}');
  if r->'outcome_confirmed'<>'true'::jsonb or r->>'proof_scope'<>'participant_attestation' or jsonb_array_length(r->'events')<>7 then raise exception 'Bilateral participant attestation incomplete'; end if;
  update public.match_cases set material=jsonb_set(material,'{trial,deliverables,0,target}','"Revised result"'),terms_hash=repeat('b',64) where case_id='case-outcome-ab';
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"state"}');
    raise exception 'Old screen read new-version proof'; exception when sqlstate 'PT409' then null; end;
  p:=jsonb_build_object('version',2,'termsHash',repeat('b',64));
  r:=public.synera_case_outcome('case-outcome-ab',p||'{"action":"state"}');
  if r->'outcome_confirmed'<>'false'::jsonb or r#>>'{deliverables,0,phase}'<>'pending' or jsonb_array_length(r->'events')<>0 then raise exception 'Old outcome promoted revised terms'; end if;
  begin perform public.synera_case_outcome('case-outcome-ab',p||'{"action":"submit","index":0,"intentId":"aaaaaaaa-aaaa-4aaa-8aaa-000000000005","evidenceUri":"https://example.com/revised"}');
    raise exception 'Revision retained old approvals'; exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.match_outcome_events)<>7 then raise exception 'Revision erased historical events'; end if;
end $$;
-- Current approvals, withdrawn consent, blocked pair and expiry are separate gates.
insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash)
select case_id,participant_low,version,terms_hash from public.match_cases where case_id='case-outcome-ab'
union all select case_id,participant_high,version,terms_hash from public.match_cases where case_id='case-outcome-ab';
update public.match_case_approvals set withdrawn_at=now() where case_id='case-outcome-ab' and party_id='11111111-1111-4111-8111-111111111111' and approved_version=2;
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','submit','version',2,'termsHash',repeat('b',64),'index',0,'intentId','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','evidenceUri','https://example.com/revised'));
    raise exception 'Withdrawal retained outcome authority'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.profile_blocks(blocker_id,blocked_id) values('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111');
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)));
    raise exception 'Blocked pair retained outcome disclosure'; exception when insufficient_privilege then null; end;
end $$;
reset role;
delete from public.profile_blocks;
delete from public.pilot_consents where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','state','version',2,'termsHash',repeat('b',64)));
    raise exception 'Revoked consent retained outcome disclosure'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.pilot_consents(user_id,policy_version,terms_accepted,privacy_acknowledged) values('22222222-2222-4222-8222-222222222222','2026-09-05-pilot-3',true,true);
update public.match_cases set expires_at=now()-interval '1 second' where case_id='case-outcome-ab';
set local role authenticated;
do $$ begin
  begin perform public.synera_case_outcome('case-outcome-ab',jsonb_build_object('action','submit','version',2,'termsHash',repeat('b',64),'index',0,'intentId','aaaaaaaa-aaaa-4aaa-8aaa-000000000005','evidenceUri','https://example.com/revised'));
    raise exception 'Expired case accepted outcome'; exception when sqlstate 'PT409' then null; end;
end $$;
reset role;
select 'PASS: participant-only outcome, explicit giver evidence/receiver scope/decision, no silence promotion, idempotency, version/approval/consent/block/expiry gates, private immutable history';
rollback;
