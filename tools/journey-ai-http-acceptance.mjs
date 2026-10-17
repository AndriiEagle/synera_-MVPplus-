// Real local inference without Chromium startup pressure; no mocked model reply.
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { appendAIReply, appendUserMessage, startJourney } from '../web_launch/journey-core.mjs';
const out='artifacts/journey-20261003/local-ai';await fs.mkdir(out,{recursive:true});
const child=spawn('node',['web_launch/server.mjs','--demo','--local-ai'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
try{
 const url=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),10000);child.stdout.on('data',c=>{const m=String(c).match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
 const mine={id:'you',fitConsent:true,publicVisibility:true,gives:['automation'],needs:['design'],languages:['uk'],modes:['joint_project'],timePreferences:['weekday_afternoon'],preferences:{communication:{enabled:true,values:['async']},work:{enabled:true,values:['collaborative']}}};
 const words='Я можу автоматизувати бронювання кавових зустрічей. Мені потрібен дизайн першого екрана. Який один результат нам варто обговорити за 30 хвилин?';
 const state=appendUserMessage(startJourney({personId:'mara',mine,at:Date.now(),sessionId:'journey-runtime-check'}),{text:words,at:Date.now()}),turnId=state.messages.at(-1).id;
 const config=await(await fetch(url+'/config.json')).json();const response=await fetch(url+'/api/journey-ai',{method:'POST',headers:{'Content-Type':'application/json',Origin:url,'X-Synera-Local':config.journeyAI.nonce},body:JSON.stringify({version:1,consent:true,personId:state.personId,mine:{gives:mine.gives,needs:mine.needs},messages:state.messages.map(({id,author,text})=>({id,author,text})),turnId})});
 const value=await response.json();assert.equal(response.status,200,JSON.stringify(value));assert.equal(value.turnId,turnId);assert.equal(createHash('sha256').update(value.text).digest('hex'),value.replySha256);
 const receipt={...value.receipt,turnId,replySha256:value.replySha256};const accepted=await appendAIReply(state,{text:value.text,at:Date.now(),receipt});assert.equal(accepted.proposal,null);assert.equal(accepted.messages.at(-1).text,value.text);
 const source={};for(const name of ['server/local-profile-ai.mjs','server/local-journey-ai.mjs','journey-core.mjs'])source[name]=createHash('sha256').update(await fs.readFile('web_launch/'+name)).digest('hex');
 const report={status:'PASS_RUNTIME_REQUIRES_CONTENT_REVIEW',syntheticInput:words,reply:value.text,receipt,source,providerCalls:0,actualUsd:0,physicalAndroid:false,publicAI:false};await fs.writeFile(out+'/HTTP_ACCEPTANCE.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,actualModel:receipt.actualModel,usage:receipt.usage,elapsedS:receipt.elapsedS,providerCalls:0,actualUsd:0}));
}catch(error){await fs.writeFile(out+'/HTTP_FAILURE.json',JSON.stringify({status:'FAIL',message:error.message,paidFallback:false},null,2));console.error(error.message);process.exitCode=1;}
finally{child.kill();}
