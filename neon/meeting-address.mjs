// Input-only adapter. SQL owns identity, revisions and bilateral decisions.
export function meetingAddressReady(env) {
  return env.SYNERA_PILOT_READY === 'true' && env.SYNERA_REAL_JOURNEY_READY === 'true' && env.SYNERA_MEETING_ADDRESS_READY === 'true';
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const common=['action','version','termsHash'];
const fields={state:[],propose:['intentId','proposalId','address','consent'],accept:['intentId','proposalId','consent'],decline:['intentId','proposalId']};
export function meetingAddressRPCArgs(meetingId,caseId,body) {
  if(typeof meetingId!=='string'||!uuid.test(meetingId)||typeof caseId!=='string'||!/^[A-Za-z0-9_:-]{1,64}$/.test(caseId)
    ||!body||typeof body!=='object'||Array.isArray(body))throw new Error('Invalid address request');
  const extra=Object.hasOwn(fields,body.action)?fields[body.action]:null;
  if(!extra||Object.keys(body).some(key=>![...common,...extra].includes(key))||!Number.isSafeInteger(body.version)||body.version<1||body.version>999999999
    ||typeof body.termsHash!=='string'||!/^[a-f0-9]{64}$/.test(body.termsHash)
    ||new TextEncoder().encode(JSON.stringify(body)).length>2048)throw new Error('Invalid reviewed address');
  if(body.action!=='state'){
    if(typeof body.intentId!=='string'||!uuid.test(body.intentId)||!Object.hasOwn(body,'proposalId')
      ||(body.proposalId!==null&&(typeof body.proposalId!=='string'||!uuid.test(body.proposalId))))throw new Error('Invalid address intent');
    if(body.action!=='propose'&&body.proposalId===null)throw new Error('Reviewed proposal required');
  }
  if(body.action==='propose'&&(typeof body.address!=='string'||Array.from(body.address.trim()).length<1||Array.from(body.address.trim()).length>200))throw new Error('Address required');
  if(['propose','accept'].includes(body.action)&&body.consent!==true)throw new Error('Explicit address choice required');
  return {p_meeting_id:meetingId,p_case_id:caseId,p_payload:structuredClone(body)};
}
