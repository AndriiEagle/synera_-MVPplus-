// Actual disposable PostgreSQL constraint, not a JSON size mock or live Neon proof.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {neonAuthShimSql} from '../neon/local_acceptance.mjs';
import {exchangeMaterial,materialFromEditor} from '../web_launch/real-journey-client.mjs';
import {hashMaterialPayload} from '../web_launch/business-case.mjs';
import {caseMaterialBytes} from '../web_launch/case-material-budget.mjs';
import {A,B,fields} from './fixtures/real-journey-fixture.mjs';
const psql=process.env.SYNERA_ACCEPTANCE_PSQL||'psql',port=process.env.SYNERA_ACCEPTANCE_PGPORT;
assert.match(port||'',/^\d{2,5}$/,'Explicit disposable loopback port required');
const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^PG/i.test(k))),PGCLIENTENCODING:'UTF8'};
const sql=(db,input)=>spawnSync(psql,['-h','127.0.0.1','-p',port,'-U','postgres','-w','-X','-d',db,'-At','-q','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',env,timeout:30000});
const must=(db,input)=>{const r=sql(db,input);assert.equal(r.status,0,r.stderr||r.error?.message);return r.stdout.trim();};
const lit=s=>"'"+s.replaceAll("'","''")+"'";
const database='synera_material_'+Date.now(),receipt=process.argv.find(a=>a.startsWith('--receipt='))?.slice(10);
assert.ok(receipt,'--receipt is required');
const report={status:'NOT_ACCEPTED',database,node:process.version,scope:'Actual local PostgreSQL with identity shim; no live JWT or deployment',checks:[],source_sha256:{}};
const read=async name=>{const b=await fs.readFile(name);report.source_sha256[name]=createHash('sha256').update(b).digest('hex');return b.toString('utf8');};
const base=()=>exchangeMaterial(A,B,fields());
function sized(symbol,limit){
  const m=base();
  if(symbol==='a')m.outcomes.push({...m.outcomes[0]},{...m.outcomes[1]},{...m.outcomes[0]});
  const slots=[...m.outcomes.map(o=>[o,'target']),...m.trial.deliverables.flatMap(d=>[[d,'target'],[d,'acceptance_criteria']])];
  for(const [o,k]of slots)o[k]='x';
  for(const [o,k]of slots)o[k]+=symbol.repeat(Math.max(0,Math.min(Math.floor((2000-1)/symbol.length),Math.floor((limit-caseMaterialBytes(m))/Buffer.byteLength(symbol)))));
  for(const [o,k]of slots)o[k]+='x'.repeat(Math.max(0,Math.min(2000-o[k].length,limit-caseMaterialBytes(m))));
  assert.equal(caseMaterialBytes(m),limit);return m;
}
try{
  for(const file of ['tools/audit-material-sql.mjs','web_launch/case-material-budget.mjs','web_launch/business-case.mjs','web_launch/real-journey-client.mjs','tools/fixtures/real-journey-fixture.mjs','neon/local_acceptance.mjs'])await read(file);
  report.server=must('postgres','show server_version;');
  must('postgres',`create database ${database} template template0 encoding 'UTF8';`);
  must(database,neonAuthShimSql());
  for(const file of ['neon/schema.proposal.sql','neon/case-state.migration.sql','neon/group-room.migration.sql','neon/case-outcome.migration.sql'])must(database,await read(file));
  must(database,(await read('neon/case-state.acceptance.sql')).split('set local role authenticated;')[0].replace(/^begin;\r?\n/m,''));
  const samples=[{name:'legal-500-uk',material:exchangeMaterial(A,B,fields(Object.fromEntries(['give_target','take_target','give_criteria','take_criteria'].map(k=>[k,'і'.repeat(500)]))))}];
  for(const symbol of ['a','і','😀'])for(const delta of [-1,0,1])samples.push({name:JSON.stringify(symbol)+'-boundary-'+delta,material:sized(symbol,16384+delta)});
  const escaped=base();escaped.trial.deliverables[0].target='Quote " slash \\ newline\n tab\t emoji 😀';samples.push({name:'escaped-strings',material:escaped});
  for(const sample of samples){
    const json=lit(JSON.stringify(sample.material)),expected=caseMaterialBytes(sample.material);
    const actual=Number(must(database,`select octet_length(${json}::jsonb::text);`));assert.equal(actual,expected,'UI/API budget must match PostgreSQL for '+sample.name);
    const insert=`begin;set local role authenticated;select set_config('request.jwt.claims','${JSON.stringify({sub:A,role:'authenticated'})}',true);insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('audit-bytes','${A}','${B}','exchange',${json}::jsonb,'${'a'.repeat(64)}',now()+interval '7 days');rollback;`;
    const result=sql(database,insert);
    if(expected<=16384)assert.equal(result.status,0,result.stderr);else{assert.notEqual(result.status,0);assert.match(result.stderr,/check constraint/);}
    report.checks.push({name:sample.name,ui_bytes:expected,postgres_bytes:actual,insert_accepted:result.status===0,pass:true});
  }
  // The accepted paid shape must also survive the real SQL approval/outcome state machine.
  const paid=materialFromEditor(A,B,fields({mode:'paid_service',paid_direction:'buyer',give_tag:'',give_target:'',give_criteria:'',compensation_status:'agreed_money',amount:'125.50',currency:'CHF',invoice:'yes'}));
  const hash=await hashMaterialPayload(paid),session=id=>`set role authenticated;do $$ begin perform set_config('request.jwt.claims','${JSON.stringify({sub:id,role:'authenticated'})}',false);end $$;`;
  must(database,session(A)+`insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values('paid-audit','${A}','${B}','paid_service',${lit(JSON.stringify(paid))}::jsonb,'${hash}',now()+interval '7 days');`);
  const payload=(action,extra={})=>({action,version:1,termsHash:hash,index:0,intentId:randomUUID(),...extra});
  const rpc=(actor,p)=>session(actor)+`select public.synera_case_outcome('paid-audit',${lit(JSON.stringify(p))}::jsonb);`;
  const denied=(name,actor,p,pattern)=>{const r=sql(database,rpc(actor,p));assert.notEqual(r.status,0);assert.match(r.stderr,pattern);report.checks.push({name,pass:true});};
  denied('paid_SQL_requires_both_independent_approvals',B,payload('submit',{evidenceUri:'Synthetic supplier result'}),/Both current approvals required/);
  for(const actor of [A,B])must(database,session(actor)+`insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values('paid-audit','${actor}',1,'${hash}');`);
  must(database,rpc(B,payload('submit',{evidenceUri:'Synthetic supplier result'})));
  denied('paid_SQL_supplier_cannot_self_accept',B,payload('accept'),/Only receiver decides/);
  denied('paid_SQL_buyer_must_check_before_accept',A,payload('accept'),/Outcome transition unavailable/);
  must(database,rpc(A,payload('check',{scopeNotes:'Receiver checked the agreed screen'})));
  const result=JSON.parse(must(database,rpc(A,payload('accept'))));
  assert.equal(result.outcome_confirmed,true);assert.equal(result.deliverables.length,1);
  assert.deepEqual(result.events.filter(e=>e.kind==='accept').map(e=>e.actor_id),[A]);
  assert.equal(result.proof_scope,'participant_attestation');
  report.checks.push({name:'paid_SQL_one_supplier_result_accepted_only_by_buyer',pass:true,compensation_minor:paid.compensation.amount_minor,payment_verified:false});
  report.status='PASS_LOCAL_MATERIAL_SQL';
}catch(e){report.error=e.message;process.exitCode=1;}
finally{await fs.mkdir(path.dirname(receipt),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.length,error:report.error,database}));}
