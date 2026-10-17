import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalMaterialPayload, createCaseState, approveCase, caseParticipantProblems, hashMaterialPayload } from './business-case.mjs';
import { exchangeMaterial } from './real-journey-client.mjs';
import { A, B, fields } from '../tools/fixtures/real-journey-fixture.mjs';

const project = () => ({ ...exchangeMaterial(A, B, fields()), mode: 'joint_project', components: ['joint_project'] });

test('a joint project keeps each contribution and result and requires two independent current-version approvals', async () => {
  const material = canonicalMaterialPayload(project());
  const now = new Date().toISOString(), expiresAt = new Date(Date.now() + 86400000).toISOString();
  let state = await createCaseState({ caseId: 'project-test', participants: [A, B], material, now, expiresAt });
  assert.equal(state.material.mode, 'joint_project');
  assert.deepEqual(new Set(state.material.trial.deliverables.map(row => row.giver_id)), new Set([A, B]));
  assert.deepEqual(new Set(state.material.outcomes.map(row => row.receiver_id)), new Set([A, B]));
  state = approveCase(state, { partyId: A, termsHash: state.termsHash, now });
  assert.equal(state.status, 'awaiting_approval');
  assert.equal(state.approvals[B], undefined);
  state = approveCase(state, { partyId: B, termsHash: state.termsHash, now });
  assert.equal(state.status, 'approved_for_next_step');
  assert.notEqual(await hashMaterialPayload(material), await hashMaterialPayload(exchangeMaterial(A, B, fields())));
});

test('joint projects cannot omit one participant contribution or result', () => {
  const material = project();
  material.trial = { ...material.trial, deliverables: material.trial.deliverables.filter(row => row.giver_id === A) };
  assert.ok(caseParticipantProblems(material, [A, B]).some(message => message.includes('contribution')));
  const noResult = project(); noResult.outcomes = noResult.outcomes.filter(row => row.receiver_id === A);
  assert.ok(caseParticipantProblems(noResult, [A, B]).some(message => message.includes('outcome')));
});
