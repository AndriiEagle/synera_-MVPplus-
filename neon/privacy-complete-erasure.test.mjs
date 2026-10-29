import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read=name=>fs.readFile(new URL(name,import.meta.url),'utf8');
test('P3 complete erasure is separate, self-only, and retains the stale-session tombstone',async()=>{
  const sql=await read('./privacy-complete-erasure.migration.sql');
  for(const token of ['synera_complete_erase_application_data()','synera_erase_profile_data()','pg_advisory_xact_lock','delete from public.meeting_requests','delete from public.match_cases','delete from public.pilot_consents','delete from public.profile_reports where reporter_id=actor or reported_id=actor','delete from public.group_room_members','staleSessionTombstone'])assert.match(sql,new RegExp(token.replaceAll('(','\\(').replaceAll(')','\\)')));
  assert.match(sql,/revoke all on function public\.synera_complete_erase_application_data\(\) from public,authenticated;/);
  assert.match(sql,/grant execute on function public\.synera_complete_erase_application_data\(\) to authenticated;/);
  assert.match(sql,/update public\.group_rooms r set status='closed'/);
});
test('P4 purge has explicit retention windows and is not callable by a normal member',async()=>{
  const sql=await read('./privacy-retention-purge.migration.sql');
  assert.match(sql,/coalesce\(proposed_at,created_at\) < now\(\)/);
  assert.match(sql,/interval '30 days'/);assert.match(sql,/interval '90 days'/);
  assert.match(sql,/synera_privacy_ops_counters_valid/);assert.match(sql,/jsonb_each\(p\)/);assert.match(sql,/event_code in \('privacy\.purge','privacy\.erasure','privacy\.error'\)/);
  assert.match(sql,/revoke all on function public\.synera_purge_expired_privacy_data\(\) from public,authenticated;/);
  assert.match(sql,/grant execute on function public\.synera_purge_expired_privacy_data\(\) to service_role;/);
});
