// Source mutation in an isolated VM only. Never edit or weaken the product/test files.
import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const source=await fs.readFile('web_launch/privacy-retention.mjs','utf8');
function probe(code){
 class Storage{data=new Map();get length(){return this.data.size;}key(i){return [...this.data.keys()][i];}getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,String(v));}removeItem(k){this.data.delete(k);}}
 const s=new Storage();s.setItem('synera.journal.v1',JSON.stringify([{at:'2000-01-01T00:00:00Z',kind:'profile',actor:'visitor',text:'expired',data:{}}]));s.setItem('another-app','keep');
 vm.runInNewContext(code,{Storage,localStorage:s,Date});
 return {expiredRemoved:s.getItem('synera.journal.v1')===null,foreignPreserved:s.getItem('another-app')==='keep'};
}
const accepted=probe(source),mutant=source.replace('    purgeJournal(storage);','    /* mutation: startup purge disabled */');
assert.notEqual(mutant,source);const rejected=probe(mutant);
assert.deepEqual(accepted,{expiredRemoved:true,foreignPreserved:true});
assert.deepEqual(rejected,{expiredRemoved:false,foreignPreserved:true});
const receipt={status:'PASS_MUTATION_REJECTED',kind:'local source mutation, no provider',source_sha256:createHash('sha256').update(source).digest('hex'),accepted,mutant:rejected,provider_calls:0};
await fs.writeFile('docs/integrate-20261029/negative-controls.json',JSON.stringify(receipt,null,2)+'\n');
console.log(receipt.status);
