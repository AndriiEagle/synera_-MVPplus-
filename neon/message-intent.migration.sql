-- REVIEW ONLY. New migration; never rewrite the applied base. Local acceptance first.
-- UUID message PK is the intent key. Replay returns the immutable original row.
begin;
do $$ begin
  if to_regclass('public.meeting_messages') is null or to_regprocedure('public.synera_pilot_member()') is null then raise exception 'Base pilot required'; end if;
  if to_regprocedure('public.synera_send_message(uuid,uuid,text)') is not null then raise exception 'Inspect existing message intent function'; end if;
end $$;
grant insert (id) on public.meeting_messages to authenticated;
create function public.synera_send_message(p_meeting_id uuid, p_intent_id uuid, p_body text)
returns jsonb language plpgsql security invoker set search_path = '' set lock_timeout = '5s' as $$
declare actor uuid := public.synera_user_id(); prior public.meeting_messages%rowtype;
begin
  if actor is null or not public.synera_pilot_member() then raise exception sqlstate 'PT403' using message = 'Message unavailable'; end if;
  if p_intent_id is null or p_meeting_id is null or p_body is null or char_length(btrim(p_body)) not between 1 and 1000 or p_body <> btrim(p_body) then raise exception sqlstate 'PT400' using message = 'Invalid message'; end if;
  if not exists (select 1 from public.meeting_requests m where m.id=p_meeting_id and m.status='accepted' and actor in (m.sender_id,m.recipient_id)
    and not exists(select 1 from public.profile_blocks b where (b.blocker_id=m.sender_id and b.blocked_id=m.recipient_id) or (b.blocked_id=m.sender_id and b.blocker_id=m.recipient_id))) then
    raise exception sqlstate 'PT403' using message = 'Message unavailable';
  end if;
  -- Database transaction lock, not a process-local deduplicator. Shared by overlapping retries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_intent_id::text,0));
  select * into prior from public.meeting_messages where id=p_intent_id;
  if found then
    if prior.sender_id <> actor or prior.meeting_id <> p_meeting_id or prior.body <> p_body then raise exception sqlstate 'PT409' using message = 'Message intent conflict'; end if;
    return pg_catalog.to_jsonb(prior);
  end if;
  insert into public.meeting_messages(id,meeting_id,sender_id,body) values(p_intent_id,p_meeting_id,actor,p_body) returning * into prior;
  return pg_catalog.to_jsonb(prior);
end $$;
revoke all on function public.synera_send_message(uuid,uuid,text) from public,authenticated;
grant execute on function public.synera_send_message(uuid,uuid,text) to authenticated;
commit;
