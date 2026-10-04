// Narrow input contract for the existing Neon gateway. Identity and outcome
// transitions belong to the authenticated SQL RPC, never to browser fields.
export function outcomeReady(env) {
  return env.SYNERA_PILOT_READY === 'true' && env.SYNERA_REAL_JOURNEY_READY === 'true' && env.SYNERA_CASE_OUTCOMES_READY === 'true';
}
const common=['action','version','termsHash'];
const actionFields={state:[],submit:['index','intentId','evidenceUri'],check:['index','intentId','scopeNotes'],accept:['index','intentId'],decline:['index','intentId','reason']};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const text=value=>typeof value==='string' && Array.from(value.trim()).length>=1 && Array.from(value.trim()).length<=1000;
export function outcomeRPCArgs(caseId,body) {
  if(typeof caseId!=='string'||!/^[A-Za-z0-9_:-]{1,64}$/.test(caseId)||!body||typeof body!=='object'||Array.isArray(body))throw new Error('Invalid outcome request');
  const extra=Object.hasOwn(actionFields,body.action)?actionFields[body.action]:null;
  if(!extra||Object.keys(body).some(key=>![...common,...extra].includes(key))||!Number.isSafeInteger(body.version)||body.version<1||body.version>999999999||
    typeof body.termsHash!=='string'||!/^[a-f0-9]{64}$/.test(body.termsHash))throw new Error('Invalid reviewed outcome');
  if(body.action!=='state'&&(!Number.isInteger(body.index)||body.index<0||body.index>9999||typeof body.intentId!=='string'||!uuid.test(body.intentId)))throw new Error('Invalid outcome intent');
  if(body.action==='submit'&&!text(body.evidenceUri))throw new Error('Evidence URI required');
  if(body.action==='check'&&!text(body.scopeNotes))throw new Error('Scope notes required');
  if(body.action==='decline'&&!['not_delivered','outside_agreed_scope','below_acceptance_criteria','other'].includes(body.reason))throw new Error('Neutral reason required');
  return {p_case_id:caseId,p_payload:structuredClone(body)};
}
