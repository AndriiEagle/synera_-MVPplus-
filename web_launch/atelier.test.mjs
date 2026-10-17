import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAtelier,applyAtelier} from './atelier.mjs';

test('invalid preferences cannot activate a new visual layer or carry unknown data',()=>{
  for(const input of [null,'enabled',[],{version:2,enabled:true}]) assert.equal(normalizeAtelier(input).enabled,false);
  assert.deepEqual(normalizeAtelier({version:1,enabled:true,accent:'unknown',density:'unknown',user_id:'private',largeText:1}),
    {version:1,enabled:true,accent:'gold',density:'comfortable',largeText:false,strongContrast:false});
});

test('returning to current removes the overlay without changing the established theme or consent state',()=>{
  const root={dataset:{syneraStyle:'night',consent:'private',route:'fit'}};
  const old={...root.dataset};
  applyAtelier(root,{version:1,enabled:true,accent:'plum',density:'compact',largeText:true,strongContrast:true});
  assert.equal(root.dataset.syneraStyle,'night'); assert.equal(root.dataset.consent,'private');
  assert.equal(root.dataset.atelierAccent,'plum'); assert.equal(root.dataset.atelierDensity,'compact');
  applyAtelier(root,{version:1,enabled:false}); assert.deepEqual(root.dataset,old);
});
