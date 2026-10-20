import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon } from './worker.mjs';
import { canonicalMaterialPayload } from '../web_launch/business-case.mjs';
import { materialFromEditor, RealJourneyStore } from '../web_launch/real-journey-client.mjs';
import { createFixture, fields, A, B, origin, config } from '../tools/fixtures/real-journey-fixture.mjs';
const LIMIT=16384, WIRE=LIMIT+2048;
// Independent serialization oracle for the JSON types in canonical material.
const pgText=v=>Array.isArray(v)?'['+v.map(pgText).join(', ')+']':v&&typeof v==='object'?'{'+Object.entries(v).map(([k,x])=>JSON.stringify(k)+': '+pgText(x)).join(', ')+'}':JSON.stringify(v);
const bytes=v=>Buffer.byteLength(pgText(v),'utf8');
function boundary(symbol,target){
  const m=materialFromEditor(A,B,fields({mode:'exchange'}));
  const slots=[...m.outcomes.map(o=>[o,'target']),...m.trial.deliverables.flatMap(d=>[[d,'target'],[d,'acceptance_criteria']])];
  for(const [o,k] of slots)o[k]='x';
  for(const [o,k] of slots){
    const count=Math.min(Math.floor((2000-1)/symbol.length),Math.floor((target-bytes(m))/Buffer.byteLength(symbol)));
    o[k]+=symbol.repeat(Math.max(0,count));
  }
  for(const [o,k] of slots){const n=Math.min(2000-o[k].length,target-bytes(m));if(n>0)o[k]+='x'.repeat(n);}
  assert.equal(bytes(m),target); return m;
}
function gateway(){
  const f=createFixture();let writes=0;
  const upstream=async(url,init)=>{if(url.includes('/match_cases')){writes++;return Response.json([JSON.parse(init.body)]);}return f.upstream(url,init);};
  const send=(body,path='/data/match_cases')=>handleNeon(new Request(origin+'/api/neon'+path,{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',Cookie:'__Host-synera-session='+A},body:typeof body==='string'?body:JSON.stringify(body)}),f.env,upstream);
  return {send,writes:()=>writes};
}
test('TA02: four legal Ukrainian fields of 500 characters cross the real gateway unchanged',async()=>{
  const f=createFixture(),transport=(path,init={})=>{const headers=new Headers(init.headers);headers.set('Origin',origin);headers.set('Cookie','__Host-synera-session='+A);return handleNeon(new Request(new URL(path,origin),{...init,headers}),f.env,f.upstream);};
  const store=new RealJourneyStore(config,transport,{storage:null});await store.restore();
  const material=materialFromEditor(A,B,fields({mode:'exchange',...Object.fromEntries(['give_target','take_target','give_criteria','take_criteria'].map(k=>[k,'і'.repeat(500)]))}));
  await store.saveTerms(B,material); assert.equal(f.cases.length,1); assert.deepEqual(f.cases[0].material,material);
});
for(const symbol of ['a','і','😀']) test('TA02: '+symbol+' material below/at/above PostgreSQL bytes and bounded wire transport',async()=>{
  // ASCII cannot fill 16KiB within six existing 2000-character fields; a shape-valid
  // extra outcome exercises the byte boundary without weakening per-field bounds.
  for(const delta of [-1,0,1]){
    let m;
    if(symbol==='a'){
      m=materialFromEditor(A,B,fields({mode:'exchange'}));m.outcomes.push({...m.outcomes[0]},{...m.outcomes[1]},{...m.outcomes[0]});
      const slots=[...m.outcomes.map(o=>[o,'target']),...m.trial.deliverables.flatMap(d=>[[d,'target'],[d,'acceptance_criteria']])];
      for(const [o,k]of slots)o[k]='x';for(const[o,k]of slots)o[k]+='a'.repeat(Math.max(0,Math.min(1999,LIMIT+delta-bytes(m))));
      assert.equal(bytes(m),LIMIT+delta);
    }else m=boundary(symbol,LIMIT+delta);
    if(delta>0)assert.throws(()=>canonicalMaterialPayload(m),/Забагато тексту/);else assert.deepEqual(canonicalMaterialPayload(m).trial,m.trial);
    const f=gateway(),r=await f.send({material:m});assert.equal(r.status,delta>0?413:200);assert.equal(f.writes(),delta>0?0:1);
  }
});
test('TA02: request byte boundary includes JSON overhead and keeps unrelated routes at 4096',async()=>{
  for(const delta of [-1,0,1]){
    const f=gateway(),body=JSON.stringify({material:{},padding:'x'.repeat(WIRE+delta-Buffer.byteLength(JSON.stringify({material:{},padding:''})))});
    assert.equal(Buffer.byteLength(body),WIRE+delta);assert.equal((await f.send(body)).status,delta>0?413:200);
  }
  const f=gateway();assert.equal((await f.send({padding:'x'.repeat(4100)},'/data/profiles')).status,413);
});
