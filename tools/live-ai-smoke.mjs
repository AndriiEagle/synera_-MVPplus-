import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// No automatic retries. An exclusive attempt file survives even an ambiguous timeout.
export async function liveAiSmoke({origin,receiptPath,operatorToken,fetchImpl=fetch}) {
  receiptPath=path.resolve(receiptPath);
  if(!receiptPath.startsWith(path.resolve('tmp')+path.sep)) throw Error('Smoke receipts must stay inside this worktree tmp/');
  const site=new URL(origin);
  if(site.protocol!=='https:'||site.username||site.password||site.pathname!=='/'||site.search||site.hash||!operatorToken) throw Error('HTTPS origin and operator token required');
  const config=await fetchImpl(site.origin+'/config.json',{cache:'no-store'}).then(r=>r.json());
  if(config.liveAiReady!==true||config.liveAiModel!=='z-ai/glm-5.3-flash') throw Error('Live AI is not ready; no model call made');
  const spend=await fetchImpl(site.origin+'/api/ai/spend',{headers:{Authorization:`Bearer ${operatorToken}`},cache:'no-store'});
  if(!spend.ok) throw Error('Operator spend authentication failed; no model call made');
  const before=await spend.json(); if(before.halted||before.costUsd+before.reservedUsd>=3) throw Error('Spend gate closed; no model call made');
  await fs.mkdir(path.dirname(receiptPath),{recursive:true});
  const attempt=receiptPath+'.attempt.json';
  await fs.writeFile(attempt,JSON.stringify({status:'ATTEMPT_RESERVED',origin:site.origin,at:new Date().toISOString()}),{flag:'wx'});
  const body={persona:'bot-mira',conversation:[],visitorText:'Demo: I can offer one fictional customer interview. What small design draft could we try?',locale:'en'};
  const hash=s=>createHash('sha256').update(s).digest('hex');
  let result;
  try {
    const response=await fetchImpl(site.origin+'/api/ai/persona-reply',{method:'POST',signal:AbortSignal.timeout(25000),
      headers:{Origin:site.origin,'Content-Type':'application/json','X-Synera-Client':'1','X-Synera-AI-Consent':'live-ai-v1'},body:JSON.stringify(body)});
    const data=await response.json();
    result={status:'NEEDS_REVIEW',httpStatus:response.status,origin:site.origin,model:data.model,requestId:data.requestId,
      promptTokens:data.promptTokens,completionTokens:data.completionTokens,costUsd:data.costUsd,costStatus:data.costStatus,
      inputSha256:hash(JSON.stringify(body)),outputSha256:hash(data.text||''),at:new Date().toISOString()};
    if(response.ok && data.model==='z-ai/glm-5.3-flash' && typeof data.text==='string' && data.text.includes('Demo') &&
      data.costStatus==='reported' && Number.isFinite(data.costUsd) && data.costUsd>=0 && data.promptTokens>0 && data.completionTokens>0 && data.requestId) result.status='PASS_TRANSPORT_AND_COST';
    else result.error=data.error||'Missing cost/identity/output evidence';
  } catch { result={status:'OUTCOME_UNKNOWN',origin:site.origin,at:new Date().toISOString(),error:'Reconcile Worker spend by time/request before any retry'}; }
  await fs.writeFile(receiptPath,JSON.stringify(result,null,2),{flag:'wx'});
  return result;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const arg=name=>process.argv.find(a=>a.startsWith(name+'='))?.slice(name.length+1);
  if(!process.argv.includes('--execute')) { console.error('Owner/Claude only: --execute --origin=https://PILOT --receipt=tmp/live-ai-smoke.json; SYNERA_OPERATOR_TOKEN in environment. One attempt, no retry.');process.exitCode=2; }
  else {
    try { const r=await liveAiSmoke({origin:arg('--origin'),receiptPath:path.resolve(arg('--receipt')||'tmp/live-ai-smoke.json'),operatorToken:process.env.SYNERA_OPERATOR_TOKEN});console.log(JSON.stringify(r));if(r.status!=='PASS_TRANSPORT_AND_COST') process.exitCode=1; }
    catch(error) { console.error(error.code==='EEXIST'?'Attempt already reserved. Collect/reconcile existing Worker receipts; do not rerun generation.':error.message);process.exitCode=1; }
  }
}
