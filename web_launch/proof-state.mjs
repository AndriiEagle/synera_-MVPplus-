// web_launch/proof-state.mjs — Детерміністичний скінченний автомат станів доказів (C01.L6)
// self_declared -> evidence_supplied -> checked_with_scope -> outcome_confirmed

export const PROOF_STAGES = Object.freeze([
  'self_declared',
  'evidence_supplied',
  'checked_with_scope',
  'outcome_confirmed'
]);

const ALLOWED_FORWARD_TRANSITIONS = Object.freeze({
  self_declared: ['evidence_supplied'],
  evidence_supplied: ['checked_with_scope', 'self_declared'],
  checked_with_scope: ['outcome_confirmed', 'evidence_supplied', 'self_declared'],
  outcome_confirmed: ['checked_with_scope', 'self_declared']
});

export function createProofState(stage = 'self_declared', meta = {}) {
  if (!PROOF_STAGES.includes(stage)) {
    throw new Error(`Invalid proof stage: ${stage}`);
  }
  return Object.freeze({
    stage,
    evidence_uri: meta.evidence_uri || null,
    scope_notes: meta.scope_notes || null,
    confirmed_by_party_a: Boolean(meta.confirmed_by_party_a),
    confirmed_by_party_b: Boolean(meta.confirmed_by_party_b),
    updated_at: meta.updated_at || new Date().toISOString(),
    version: Number(meta.version || 1)
  });
}

export function advanceProofState(current, targetStage, payload = {}) {
  if (!current || !PROOF_STAGES.includes(current.stage)) {
    throw new Error('Invalid current proof state');
  }
  if (!PROOF_STAGES.includes(targetStage)) {
    throw new Error(`Unknown target proof stage: ${targetStage}`);
  }
  
  const allowed = ALLOWED_FORWARD_TRANSITIONS[current.stage] || [];
  if (!allowed.includes(targetStage)) {
    throw new Error(`Forbidden proof transition: ${current.stage} -> ${targetStage}`);
  }

  // Перевірка інваріантів переходу
  if (targetStage === 'evidence_supplied' && !payload.evidence_uri) {
    throw new Error('Transition to evidence_supplied requires evidence_uri');
  }

  if (targetStage === 'checked_with_scope' && !payload.scope_notes) {
    throw new Error('Transition to checked_with_scope requires scope_notes');
  }

  if (targetStage === 'outcome_confirmed') {
    if (!payload.confirmed_by_party_a || !payload.confirmed_by_party_b) {
      throw new Error('outcome_confirmed strictly requires bilateral confirmation from both parties');
    }
  }

  return Object.freeze({
    stage: targetStage,
    evidence_uri: payload.evidence_uri !== undefined ? payload.evidence_uri : current.evidence_uri,
    scope_notes: payload.scope_notes !== undefined ? payload.scope_notes : current.scope_notes,
    confirmed_by_party_a: payload.confirmed_by_party_a !== undefined ? Boolean(payload.confirmed_by_party_a) : current.confirmed_by_party_a,
    confirmed_by_party_b: payload.confirmed_by_party_b !== undefined ? Boolean(payload.confirmed_by_party_b) : current.confirmed_by_party_b,
    updated_at: new Date().toISOString(),
    version: current.version + 1
  });
}

export function downgradeOnMaterialChange(current, changeReason = 'terms_modified') {
  if (!current) {
    return createProofState('self_declared');
  }
  return Object.freeze({
    stage: 'self_declared',
    evidence_uri: current.evidence_uri,
    scope_notes: null,
    confirmed_by_party_a: false,
    confirmed_by_party_b: false,
    downgrade_reason: changeReason,
    updated_at: new Date().toISOString(),
    version: current.version + 1
  });
}
