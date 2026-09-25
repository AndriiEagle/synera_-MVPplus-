// Offline bakeoff harness. Hosted lanes supply their own canonical Token Monster
// receipt; this harness only normalizes it and locally accepts/rejects the output.
import { decide } from './decision-layer.mjs';

const finiteOrNull = value => Number.isFinite(value) && value >= 0 ? value : null;
const models = Object.freeze({ jev: 'typesafe/jev-1.13', 'glm-5.3-flash': 'z-ai/glm-5.3-flash' });

export async function runDecisionBakeoff({ lane, cases, run = async input => ({ output: await decide(input), requested_model: 'deterministic-local', actual_model: 'deterministic-local', input_tokens: 0, output_tokens: 0, receipt_usd: 0, retries: 0 }) } = {}) {
  if (!['deterministic', 'jev', 'glm-5.3-flash'].includes(lane) || !Array.isArray(cases) || !cases.length) throw new TypeError('Invalid bakeoff contract');
  const records = [];
  for (const item of cases) {
    if (!item?.id || !item.input?.decision_kind || !item.expected?.action) throw new TypeError('Invalid oracle case');
    const started = performance.now();
    let answer;
    try { answer = await run(item.input); } catch (error) { answer = { error: error instanceof Error ? error.message : 'unknown error' }; }
    const output = answer.output ?? null;
    const receiptValid = lane === 'deterministic'
      ? answer.requested_model === 'deterministic-local' && answer.actual_model === 'deterministic-local' && answer.receipt_usd === 0
      : answer.requested_model === models[lane] && answer.actual_model === models[lane]
        && answer.route_identity_verified === true && answer.cost_evidence_type === 'provider_usage_cost'
        && typeof answer.generation_id === 'string' && answer.generation_id.length > 0
        && finiteOrNull(answer.receipt_usd) !== null && Number.isInteger(answer.input_tokens) && answer.input_tokens >= 0
        && Number.isInteger(answer.output_tokens) && answer.output_tokens >= 0 && answer.truncated === false;
    const accepted = Boolean(receiptValid && output && output.schema_version === 'synera.decision.v1' && output.action === item.expected.action
      && (!item.expected.hard_veto || output.hard_vetoes?.includes(item.expected.hard_veto)));
    records.push({ case_id: item.id, lane, requested_model: answer.requested_model ?? null, actual_model: answer.actual_model ?? null,
      latency_ms: Math.round((performance.now() - started) * 1000) / 1000, input_tokens: finiteOrNull(answer.input_tokens), output_tokens: finiteOrNull(answer.output_tokens),
      receipt_usd: finiteOrNull(answer.receipt_usd), retries: Number.isInteger(answer.retries) && answer.retries >= 0 ? answer.retries : null,
      receipt_valid: receiptValid, generation_id: answer.generation_id ?? null,
      expected: item.expected, output, accepted, error: answer.error ?? null });
  }
  const total = records.length, accepted = records.filter(record => record.accepted).length;
  const falseAllow = records.filter(record => record.expected.hard_veto && record.output?.action === 'recommend').length;
  const falseDeny = records.filter(record => record.expected.action === 'recommend' && record.output?.action !== 'recommend').length;
  const abstentions = records.filter(record => ['request_data', 'manual_review'].includes(record.output?.action)).length;
  return { schema_version: 'synera.decision-bakeoff.v1', lane, records, summary: { total, accepted, class_accuracy: accepted / total, false_allow: falseAllow, false_deny: falseDeny, abstentions } };
}
