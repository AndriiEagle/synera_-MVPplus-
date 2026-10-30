import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createJournal} from './journal.mjs';
test('journal binds exact consent document and withdrawal, preserves legacy rows and exports evidence', async () => {
  const data=new Map(); const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  const journal=createJournal(storage,()=> '2026-10-29T20:00:00Z');
  journal.add('consent','visitor','legacy',{demo:true});
  const record={document_text:'Demo · I choose this local test.',document_version:'demo-20261029',locale:'en',purpose:'local-demo',recipient:'device',expires_at:'2026-10-30T20:00:00Z'};
  const grant=await journal.addConsent({...record,action:'grant'});
  assert.equal(grant.data.document_sha256,createHash('sha256').update(record.document_text).digest('hex'));
  const withdraw=await journal.addConsent({...record,action:'withdraw'});
  assert.equal(withdraw.data.action,'withdraw'); assert.equal(withdraw.data.document_sha256,grant.data.document_sha256);
  const reopened=createJournal(storage,()=> '2026-10-29T20:01:00Z');
  assert.equal(reopened.entries().length,3); assert.equal(JSON.parse(reopened.export()).entries[1].data.document_text,record.document_text);
  for(const bad of [{locale:'xx'},{document_text:''},{action:'delete'},{expires_at:'invalid'},{expires_at:'2026-10-29T19:00:00Z'}]) await assert.rejects(journal.addConsent({...record,action:'grant',...bad}),/Invalid consent/);
  assert.equal(journal.entries().length,3);
});
test('pending consent cannot recreate the journal after erasure or cross-tab cancellation', async () => {
  const j=createJournal(null),record={action:'grant',document_text:'Demo notice',document_version:'v1',locale:'en',purpose:'demo',recipient:'device'};
  const first=j.addConsent(record); j.erase(); await assert.rejects(first,/canceled/); assert.equal(j.entries().length,0);
  const second=j.addConsent(record); j.cancelPending(); await assert.rejects(second,/canceled/); assert.equal(j.entries().length,0);
});
