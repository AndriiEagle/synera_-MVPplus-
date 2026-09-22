// Local contract test against the actual store. No network or production writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileStore } from '../../../../synera-docs-review-20260904/source/web_launch/profile-store.mjs';
import { createCaseState, approveCase } from '../../../../synera-docs-review-20260904/source/web_launch/business-case.mjs';

async function fixture() {
  return createCaseState({caseId:'synthetic-boundary',participants:['a','b'],
    now:'2026-09-08T10:00:00.000Z',expiresAt:'2026-09-15T10:00:00.000Z',
    material:{mode:'paid_service',components:['paid_service'],
      outcomes:[{receiver_id:'a',capability_tag:'sales',target:'Review one synthetic offer'}],
      trial:{starts_on:'2026-09-08',due_on:'2026-09-12',deliverables:[{giver_id:'b',receiver_id:'a',capability_tag:'sales',target:'One review',acceptance_criteria:'Receiver explicitly accepts this version'}]},
      compensation:{status:'agreed_money',amount_minor:12000,currency:'CHF',invoice_required:true},
      terms:{revision_limit:1,confidentiality:'required',intellectual_property:'receiver',cancellation:'mutual_written_notice'}}});
}
function store() {
  const sent=[];
  const value=new ProfileStore();
  value.user={id:'a'};value.realPilotEnabled=true;
  value._send=async (path,request)=>{sent.push({path,request:structuredClone(request)});return [];};
  return {value,sent};
}
test('control: authenticated A can submit an unapproved draft to the store transport',async()=>{
  const {value,sent}=store();await value.saveCaseState(await fixture());
  assert.equal(sent.length,1);assert.equal(sent[0].request.authenticated,true);
});
test('contract: A must not submit a newly forged B approval through bulk state persistence',async()=>{
  const {value,sent}=store();
  let state=await fixture();
  state=approveCase(state,{partyId:'b',termsHash:state.termsHash,now:'2026-09-08T10:01:00.000Z'});
  try { await value.saveCaseState(state); } catch (error) {
    // A rejection is safe only if nothing carrying B's approval was submitted.
    assert.ok(error instanceof Error);
  }
  assert.equal(sent.some(row=>Boolean(row.request.body?.state?.approvals?.b)),false,
    'Authenticated A submitted newly supplied approval B. Client contract is not isolated per actor; live server exploit remains untested.');
});
