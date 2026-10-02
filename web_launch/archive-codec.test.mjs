import {test} from 'node:test';import assert from 'node:assert/strict';
import {packArchive,unpackArchive} from './archive-codec.mjs';
test('gzip and plain envelope preserve exact multilingual quotes including spacing',async()=>{
  const original=JSON.stringify({quote:'Андрій: Zürich / 向前 /  🔥\n  точні слова ',notes:Array(50).fill('Original meaning remains here.')});
  for(const compress of [false,true]){const result=await packArchive(original,compress);assert.equal(await unpackArchive(result.json),original);assert.ok(result.envelopeBytes>0);if(compress)assert.ok(result.payloadBytes<result.originalBytes);}
});
test('tampered checksum, unknown envelope fields and unsupported version fail closed',async()=>{
  const p=JSON.parse((await packArchive('{"private":true}',true)).json);p.sha256='0'.repeat(64);await assert.rejects(unpackArchive(JSON.stringify(p)));
  const good=JSON.parse((await packArchive('{}')).json);await assert.rejects(unpackArchive(JSON.stringify({...good,version:2})));await assert.rejects(unpackArchive(JSON.stringify({...good,publish:true})));
});
test('oversized compressed expansion is rejected before returning archive',async()=>{
  await assert.rejects(packArchive('x'.repeat(1024*1024+1),true));
  const bytes=new Uint8Array(await new Response(new Blob(['x'.repeat(1024*1024+1)]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const p={format:'synera-portable-envelope',version:1,encoding:'gzip-base64',sha256:'0'.repeat(64),payload:btoa(String.fromCharCode(...bytes))};await assert.rejects(unpackArchive(JSON.stringify(p)),/1 MiB/);
});
