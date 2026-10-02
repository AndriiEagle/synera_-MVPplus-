import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {generateRoomMigration,generateRoomAcceptance} from './generate-schema.mjs';
const read=file=>fs.readFile(new URL(file,import.meta.url),'utf8');

test('reviewed room migration and rollback oracle are exactly generated from their canonical sources',async()=>{
  assert.equal(await read('./group-room.migration.sql'),generateRoomMigration(await read('../supabase/group-room.proposal.sql')));
  const acceptance=await read('./group-room.acceptance.sql');
  assert.equal(acceptance,generateRoomAcceptance(await read('../supabase/group-room.acceptance.sql')));
  assert.match(acceptance,/rollback;\s*$/i);
});

test('an unknown eligibility contract fails generation rather than silently omitting Neon admission',async()=>{
  const canonical=await read('../supabase/group-room.proposal.sql');
  const changed=canonical.replace('and c.terms_accepted and c.privacy_acknowledged and p.is_discoverable);','and c.terms_accepted);');
  assert.notEqual(changed,canonical);
  assert.throws(()=>generateRoomMigration(changed),/contract changed/);
});
