import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {profileErasureOutcomeGuard} from './profile-erasure-generate.mjs';
test('new erasure migration retains exact provenance and dependency closure of the original outcome owner',async()=>{
  const original=await fs.readFile(new URL('./case-outcome.migration.sql',import.meta.url),'utf8');
  const sql=await fs.readFile(new URL('./profile-erasure.migration.sql',import.meta.url),'utf8');
  const generated=sql.split('-- PROFILE-ERASURE-OUTCOME-GUARD-BEGIN\n')[1]?.split('\n-- PROFILE-ERASURE-OUTCOME-GUARD-END')[0];
  assert.equal(generated,profileErasureOutcomeGuard(original));
  assert.throws(()=>profileErasureOutcomeGuard(original.replace('for update;',';')),/source changed/i);
});
