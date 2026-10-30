import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { previewBundle } from './preview-bundle.mjs';

test('plain preview is byte-identical; live preview has static assets, working Node routes and no secrets',async()=>{
  await fs.mkdir('tmp',{recursive:true});
  const root=await fs.mkdtemp(path.resolve('tmp/preview-test-'));const source=path.join(root,'source');await fs.mkdir(source);
  const config={liveAiReady:false,registrationEnabled:false};await fs.writeFile(path.join(source,'config.json'),JSON.stringify(config));await fs.writeFile(path.join(source,'index.html'),'demo');
  const plain=path.join(root,'plain');await previewBundle({source,destination:plain});
  assert.deepEqual(await fs.readdir(plain),await fs.readdir(source));assert.equal(await fs.readFile(path.join(plain,'config.json'),'utf8'),JSON.stringify(config));
  const live=path.join(root,'live');await previewBundle({source,destination:live,liveAi:true});
  const c=JSON.parse(await fs.readFile(path.join(live,'public/config.json'),'utf8'));assert.equal(c.liveAiReady,true);assert.equal(c.liveAiRuntime,'vercel');assert.equal(c.liveAiProvider,'OpenRouter');
  const v=JSON.parse(await fs.readFile(path.join(live,'vercel.json'),'utf8'));assert.equal(v.outputDirectory,'public');assert.ok(v.headers.some(h=>h.source==='/api/:path*'&&h.headers.some(h=>h.key==='Cache-Control'&&h.value==='no-store')));
  assert.deepEqual(await fs.readdir(path.join(live,'api/ai')),['[action].js']);
  const api=await import(pathToFileURL(path.join(live,'api/ai/[action].js')));assert.equal(typeof api.default,'function');
  for(const action of ['health','spend']) {
    const response=await new Promise((resolve,reject)=>api.default({method:'GET',url:'/api/ai/'+action,headers:{host:'preview.example'}},{setHeader(){},end(body){resolve({status:this.statusCode,body:JSON.parse(body)});}}).catch(reject));
    assert.equal(response.status,200);if(action==='spend') assert.equal(response.body.durable,false);
  }
  assert.equal((await fs.readFile(path.join(live,'public/index.html'),'utf8')),'demo');
  assert.ok(!JSON.stringify(c).includes('OPENROUTER_API_KEY'));
  await assert.rejects(previewBundle({source,destination:live,liveAi:true}),/empty/);
  await assert.rejects(previewBundle({source,destination:path.resolve('../outside-preview'),liveAi:true}),/tmp/);
  await fs.writeFile(path.join(source,'.env'),'must never be copied');
  const rejected=path.join(root,'rejected');await assert.rejects(previewBundle({source,destination:rejected,liveAi:true}),/reviewed public/);
  assert.deepEqual(await fs.readdir(rejected),[]);
});
