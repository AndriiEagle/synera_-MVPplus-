import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { liveAiSmoke } from './live-ai-smoke.mjs';
test('one-shot smoke prints receipt-backed cost and refuses another generation',async()=>{
  const directory=await fs.mkdtemp(path.resolve('tmp/live-ai-smoke-test-'));
  let calls=0;
  const fetchImpl=async url=>{
    if(url.endsWith('/config.json')) return Response.json({liveAiReady:true,liveAiModel:'z-ai/glm-5.3-flash'});
    if(url.endsWith('/spend')) return Response.json({costUsd:0,reservedUsd:0,halted:false});
    calls++;return Response.json({text:'Demo · A small draft.',model:'z-ai/glm-5.3-flash',costStatus:'reported',costUsd:0.0001,promptTokens:20,completionTokens:7,requestId:'smoke-fixture'});
  };
  const args={origin:'https://pilot.example',receiptPath:path.join(directory,'receipt.json'),operatorToken:'fixture',fetchImpl};
  const result=await liveAiSmoke(args);assert.equal(result.status,'PASS_TRANSPORT_AND_COST');assert.equal(result.costUsd,0.0001);
  assert.equal(result.inputSha256.length,64);assert.equal(result.outputSha256.length,64);
  await assert.rejects(liveAiSmoke(args),{code:'EEXIST'});assert.equal(calls,1);
});
test('timeout leaves a durable attempt and unknown outcome, with no retry',async()=>{
  const directory=await fs.mkdtemp(path.resolve('tmp/live-ai-smoke-test-'));let calls=0;
  const fetchImpl=async url=>{
    if(url.endsWith('/config.json')) return Response.json({liveAiReady:true,liveAiModel:'z-ai/glm-5.3-flash'});
    if(url.endsWith('/spend')) return Response.json({costUsd:0,reservedUsd:0});
    calls++;throw Error('network');
  };
  const args={origin:'https://pilot.example',receiptPath:path.join(directory,'receipt.json'),operatorToken:'fixture',fetchImpl};
  assert.equal((await liveAiSmoke(args)).status,'OUTCOME_UNKNOWN');await assert.rejects(liveAiSmoke(args));assert.equal(calls,1);
});
