import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon } from './worker.mjs';
import { NeonStore } from '../web_launch/neon-store.mjs';
import { world, A, B, origin } from '../tools/fixtures/profile-delete-fixture.mjs';

const receipt = {status:'application_data_erased',providerDeletion:'pending',retainedScope:'bilateral_records_and_safety_evidence',repeated:false};
function setup() {
  const w=world(); let actor=A, calls=[];
  const env={...w.env,SYNERA_PROFILE_ERASURE_READY:'true'};
  const upstream=async(url,init)=>{
    if(url.endsWith('/rpc/synera_erase_profile_data')) { calls.push(init); return Response.json(receipt); }
    if(url.endsWith('/sign-out')) return Response.json({});
    return w.db.upstream(url,init);
  };
  const send=(path,init={})=>handleNeon(new Request(origin+path,{...init,headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',...init.headers,Cookie:'__Host-synera-session='+actor}}),env,upstream);
  const store=new NeonStore({backend:'neon',profileErasureEnabled:true},send);
  return {store,send,calls,env,setActor:id=>{actor=id;}};
}
test('TA01: displayed A with verified B refuses before destructive RPC and clears stale local identity',async()=>{
  const f=setup(); await f.store.restore(); assert.equal(f.store.user.id,A);
  f.setActor(B);
  await assert.rejects(f.store.eraseProfileData(),e=>e.status===409&&e.code==='profile_erasure_subject_mismatch');
  assert.equal(f.calls.length,0); assert.equal(f.store.user,null);
  assert.equal((await (await f.send('/api/neon/session')).json()).user.id,B);
});
test('TA01: own erasure is still self-only, and malformed/missing/mismatched subject never calls RPC',async()=>{
  for(const expectedSubject of [undefined,'',{},B]){
    const f=setup(); const r=await f.send('/api/neon/profile-erasure',{method:'POST',body:JSON.stringify({confirm:'ERASE_APPLICATION_DATA',expectedSubject})});
    assert.equal(r.status,expectedSubject===B?409:400); assert.equal(f.calls.length,0);
  }
  const f=setup(); await f.store.restore(); const result=await f.store.eraseProfileData();
  assert.equal(result.status,receipt.status); assert.equal(f.calls.length,1); assert.equal(f.calls[0].body,'{}'); assert.equal(f.store.user,null);
});
test('TA03: null and rejected read sessions never emit cookie deletion; explicit logout still does',async()=>{
  const f=setup();
  for(const [path,upstreamStatus] of [['/session',200],['/session',401],['/data/profiles',401]]){
    const r=await handleNeon(new Request(origin+'/api/neon'+path,{headers:{'X-Synera-Client':'1',Cookie:'__Host-synera-session=old'}}),f.env,async()=>Response.json({session:null},{status:upstreamStatus}));
    assert.equal(r.status,upstreamStatus); assert.equal(r.headers.has('Set-Cookie'),false);
    if(path==='/session'&&upstreamStatus===200) assert.equal((await r.json()).user,null);
  }
  const logout=await f.send('/api/neon/logout',{method:'POST',body:'{}'});
  assert.match(logout.headers.get('Set-Cookie'),/Max-Age=0/);
});
test('TA01: a delayed subject mismatch cannot erase a newer local B or same-A login',async()=>{
  for (const next of [A,B]) {
    let id=A, release;
    const store=new NeonStore({backend:'neon',profileErasureEnabled:true},async path=>path.endsWith('/session')?Response.json({user:{id}}):new Promise(resolve=>{release=()=>resolve(Response.json({error:'profile_erasure_subject_mismatch'},{status:409}));}));
    await store.restore(); const pending=store.eraseProfileData(); const rejected=assert.rejects(pending,e=>e.code==='profile_erasure_subject_mismatch');
    id=next; await store.restore(); const fresh=store.user; release(); await rejected;
    assert.equal(store.user,fresh); assert.equal(store.user.id,next);
  }
});
