import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseMeetingPlace, googleMapScenario, complimentarySkills } from './explore-planner.mjs';
test('meeting proposal minimizes worst journey within every participant limit, then imbalance',()=>{
  const c=(name,minutes,acceptable=true)=>({name,minutes,acceptable});
  const result=chooseMeetingPlace([c('Near A',[2,40,30]),c('Balanced',[20,20,20]),c('Fast',[15,18,16]),c('Closed',[1,1,1],false)],[30,30,30]);
  assert.equal(result.candidate.name,'Fast'); assert.equal(result.candidate.max,18);
  assert.equal(result.binding,false); assert.equal(result.source,'manual_estimates');
  assert.equal(chooseMeetingPlace([c('No',[31,2,1])],[30,30,30]).status,'no_feasible_place');
  assert.equal(chooseMeetingPlace([c('Unknown',[NaN,2,1])],[30,30,30]).candidate,null);
  assert.equal(chooseMeetingPlace([c('Even',[20,20]),c('Uneven',[10,20])],[30,30]).candidate.name,'Even');
});
test('map cost uses monthly billable loads/elements, separate free caps and currency; zero members is not revenue proof',()=>{
  assert.equal(googleMapScenario({loads:10000,matrixElements:10000}).totalUSD,0);
  const cost=googleMapScenario({loads:20000,matrixElements:30000});
  assert.equal(cost.mapUSD,70);assert.equal(cost.matrixUSD,100);assert.equal(cost.totalUSD,170);
  assert.equal(cost.currency,'USD');assert.ok(cost.excludes.includes('ai'));
  assert.throws(()=>googleMapScenario({loads:100001,matrixElements:1}));
});
test('complementarity explains each direction and never suggests hidden people',()=>{
  const people=[{id:'a',name:'A',visible:true,offers:['design'],needs:['code']},
    {id:'b',name:'B',visible:true,offers:['code'],needs:['design']},
    {id:'c',name:'C',visible:false,offers:['code'],needs:['design']}];
  assert.deepEqual(complimentarySkills(people,'a'),[{id:'b',name:'B',gives:['code'],receives:['design']}]);
});
