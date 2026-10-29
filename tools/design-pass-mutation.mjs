import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as actual from '../web_launch/style-switcher.mjs';
const source=fs.readFileSync(new URL('../web_launch/style-switcher.mjs',import.meta.url),'utf8');
const mutant=source.replace('value : ATELIER_STYLE','value : SYNERA_STYLE');
assert.notEqual(mutant,source,'mutation must change the fallback');
const broken=await import('data:text/javascript;base64,'+Buffer.from(mutant).toString('base64'));
const check=module=>{
  for(const preference of [null,...module.ALL_STYLES]) {
    const root={dataset:{consent:'private'}},writes=[];
    const current=module.installStyleSwitcher({root,button:null,select:null,storage:{getItem:()=>preference,setItem:(...args)=>writes.push(args)}});
    assert.equal(current,preference??'atelier');assert.equal(root.dataset.consent,'private');assert.deepEqual(writes,[]);
  }
};
check(actual);assert.throws(()=>check(broken),assert.AssertionError,'the oracle must reject the old default');
console.log(JSON.stringify({status:'PASS_MUTANT_REJECTED',mutation:'restore Current fallback',source_sha256:createHash('sha256').update(source).digest('hex'),mutant_sha256:createHash('sha256').update(mutant).digest('hex')}));
