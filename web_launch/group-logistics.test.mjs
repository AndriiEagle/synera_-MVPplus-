import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLogistics, reviseLogistics, recordLogisticsPreference as vote, resolveLogistics} from './group-logistics.mjs';
const input = {place:'Zürich HB',when:'2026-12-20T18:00:00.000Z',deadline:10000};
test('silence never invents a logistics preference or attendance',()=>{
  const s=createLogistics(['a','b','c'],input,1000), result=resolveLogistics(s,11000);
  assert.equal(result.status,'expired_incomplete'); assert.ok(result.responses.every(r=>r.choice===null)); assert.equal(result.attendanceConfirmed,false);
});
test('only explicit fallback on current proposal is used at deadline and remains labelled',()=>{
  let s=createLogistics(['a','b'],input,1000); s=vote(s,'a','yes',2000); s=vote(s,'b','yes',2000,true);
  assert.equal(resolveLogistics(s,9000).status,'awaiting');
  const result=resolveLogistics(s,10000); assert.equal(result.status,'all_prefer_yes');assert.equal(result.responses[1].source,'preselected_fallback');assert.equal(result.binding,false);
});
test('revised place/date discards prior answers and fallback; stale copied state cannot authorize',()=>{
  let s=createLogistics(['a','b'],input,1000);s=vote(s,'a','yes',2000);s=vote(s,'b','yes',2000,true);
  const next=reviseLogistics(s,{...input,place:'Інше місце'},3000);
  assert.equal(resolveLogistics(next,11000).status,'expired_incomplete');
  next.votes=s.votes;next.fallbacks=s.fallbacks; assert.equal(resolveLogistics(next,11000).status,'expired_incomplete');
});
test('withdraw and explicit no override preselected yes without mutating prior state',()=>{
  const original=createLogistics(['a','b'],input,1000);let s=vote(original,'a','yes',2000,true);s=vote(s,'a','withdraw',2100,true);
  assert.equal(resolveLogistics(s,11000).responses[0].choice,null);assert.deepEqual(original.fallbacks,{});
  s=vote(s,'a','yes',2200,true);s=vote(s,'a','no',2300);assert.equal(resolveLogistics(s,11000).status,'declined');
});
test('unknown participants, malformed dates, expired writes and obligations rejected',()=>{
  const s=createLogistics(['a','b'],input,1000);
  assert.throws(()=>vote(s,'x','yes',2000));assert.throws(()=>vote(s,'a','yes',10000));assert.throws(()=>vote(s,'a','pay',2000));
  assert.throws(()=>createLogistics(['a','a'],input,1000));assert.throws(()=>createLogistics(['a','b'],{...input,when:'invalid'},1000));
  assert.throws(()=>createLogistics(['a','__proto__'],input,1000));
});
