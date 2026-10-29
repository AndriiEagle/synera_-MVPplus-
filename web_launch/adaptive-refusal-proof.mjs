// Semantic RED/GREEN evidence without editing the working module or running browser.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source=await readFile(new URL('./adaptive.mjs',import.meta.url),'utf8');
const mutant=process.argv.includes('--mutant');
const tested=(mutant?source.replace('!a.declined.includes(id)','true'):source)
  .replace("'./adaptive-config.mjs'",JSON.stringify(new URL('./adaptive-config.mjs',import.meta.url).href));
const {createPersonalization}=await import('data:text/javascript;base64,'+Buffer.from(tested).toString('base64'));
let time=new Date(2026,9,26,10).getTime();const data=new Map();
const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
let c=createPersonalization({storage,now:()=>time});c.setAdaptation(true);c.signal('enlarge');
time+=86400000;c=createPersonalization({storage,now:()=>time});c.signal('enlarge');
time+=31*60000;c.activity();c.signal('enlarge');
assert.equal(c.proposal(),'large');c.present('large');c.resolve('large','decline');
time+=8*86400000;c=createPersonalization({storage,now:()=>time});
console.log(JSON.stringify({mutant,source_sha256:createHash('sha256').update(source).digest('hex'),tested_sha256:createHash('sha256').update(tested).digest('hex')}));
assert.equal(c.state.density,'comfortable');
assert.equal(c.proposal(),null,'a declined proposal must never reappear after reload and cooldown');
console.log('PASS: refusal persists without changing density.');
