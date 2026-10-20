import test from 'node:test';
import assert from 'node:assert/strict';
import { handleNeon, createNeonWorker } from './worker.mjs';
import { NeonStore } from '../web_launch/neon-store.mjs';
import { world, A, origin } from '../tools/fixtures/profile-delete-fixture.mjs';
const accepted = {status:'application_data_erased',providerDeletion:'pending',retainedScope:'bilateral_records_and_safety_evidence',repeated:false};
function fixture({enabled=true,result=accepted,signOutFails=false,rpcStatus=200}={}) {
  const w=world(), calls=[];
  const env={...w.env,SYNERA_PROFILE_ERASURE_READY:String(enabled)};
  const upstream=async (url,init)=>{
    calls.push({path:new URL(url).pathname,method:init.method||'GET',body:init.body,headers:new Headers(init.headers)});
    if(url.endsWith('/rpc/synera_erase_profile_data'))return Response.json(result,{status:rpcStatus});
    if(url.endsWith('/sign-out'))return Response.json({}, {status:signOutFails?503:200});
    return w.db.upstream(url,init);
  };
  const send=(body={confirm:'ERASE_APPLICATION_DATA',expectedSubject:A},opts={})=>handleNeon(new Request(origin+'/api/neon/profile-erasure'+(opts.search||''),{
    method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Synera-Client':'1',...(opts.noCookie?{}:{Cookie:'__Host-synera-session='+A})},body:JSON.stringify(body),
  }),env,upstream);
  return {w,env,calls,send};
}
test('erasure defaults disabled in server config and makes zero upstream requests',async()=>{
  const f=fixture({enabled:false});assert.equal((await f.send()).status,503);assert.equal(f.calls.length,0);
  assert.equal((await(await createNeonWorker([]).fetch(new Request(origin+'/config.json'),f.w.env)).json()).profileErasureEnabled,false);
});
test('no arbitrary target, wrong confirmation, query or missing session reaches erasure RPC',async()=>{
  for(const [body,options,status] of [[{confirm:'ERASE_APPLICATION_DATA',expectedSubject:A,id:A},{},400],[{confirm:'yes',expectedSubject:A},{},400],[{}, {},400],[{confirm:'ERASE_APPLICATION_DATA',expectedSubject:A},{search:'?id='+A},404],[{confirm:'ERASE_APPLICATION_DATA',expectedSubject:A},{noCookie:true},401]]){
    const f=fixture();assert.equal((await f.send(body,options)).status,status);assert.equal(f.calls.filter(c=>c.path.endsWith('/rpc/synera_erase_profile_data')).length,0);
  }
});
test('accepted own RPC sends only verified bearer and empty args, never clears a newer browser cookie',async()=>{
  const f=fixture();const r=await f.send();assert.equal(r.status,200);assert.deepEqual(await r.json(),{...accepted,sessionRevoked:true});
  const call=f.calls.find(c=>c.path.endsWith('/rpc/synera_erase_profile_data'));assert.equal(call.body,'{}');assert.match(call.headers.get('Authorization'),/^Bearer /);
  assert.equal(r.headers.has('Set-Cookie'),false);assert.equal(f.calls.filter(c=>c.path.endsWith('/sign-out')).length,1);
});
test('committed erasure is reported honestly if provider sign-out fails',async()=>{
  const f=fixture({signOutFails:true}),r=await f.send();assert.equal(r.status,200);assert.equal((await r.json()).sessionRevoked,false);assert.equal(r.headers.has('Set-Cookie'),false);
});
test('delayed accepted A erasure cannot clear local session after restoring B or a new A session',async()=>{
  for(const nextId of ['22222222-2222-4222-8222-222222222222',A]) {
    let current=A, release;
    const store=new NeonStore({backend:'neon',profileErasureEnabled:true},async(path)=>{
      if(path==='/api/neon/session')return Response.json({user:{id:current,email:current+'@fixture.example'}});
      return new Promise(resolve=>{release=()=>resolve(Response.json({...accepted,sessionRevoked:true}));});
    });
    await store.restore();const pending=store.eraseProfileData();const rejected=assert.rejects(pending,e=>e.code==='profile_erasure_session_changed');
    current=nextId;await store.restore();release();await rejected;assert.equal(store.user.id,nextId);
  }
});
test('delayed A unauthorized erasure cannot forget the newer B session',async()=>{
  let current=A, release;
  const store=new NeonStore({backend:'neon',profileErasureEnabled:true},async(path)=>{
    if(path==='/api/neon/session')return Response.json({user:{id:current}});
    return new Promise(resolve=>{release=()=>resolve(Response.json({error:'session_unavailable'},{status:401}));});
  });
  await store.restore();const pending=store.eraseProfileData();const rejected=assert.rejects(pending,e=>e.status===401);
  current='22222222-2222-4222-8222-222222222222';await store.restore();release();await rejected;assert.equal(store.user.id,current);
});
test('session restore started before erasure cannot resurrect the erased local identity',async()=>{
  let calls=0,release;
  const store=new NeonStore({backend:'neon',profileErasureEnabled:true},async path=>{
    if(path==='/api/neon/session'){
      if(++calls===1)return Response.json({user:{id:A}});
      return new Promise(resolve=>{release=()=>resolve(Response.json({user:{id:A}}));});
    }
    return Response.json({...accepted,sessionRevoked:true});
  });
  await store.restore();const pending=store.restore();await store.eraseProfileData();assert.equal(store.user,null);
  release();assert.equal(await pending,false);assert.equal(store.user,null);
});
test('overlapping restores keep the latest requested session in either response order',async()=>{
  const B='22222222-2222-4222-8222-222222222222';
  for(const newerFirst of [false,true]){
    const pending=[];
    const store=new NeonStore({backend:'neon'},()=>new Promise(resolve=>pending.push(resolve)));
    const older=store.restore(),newer=store.restore();
    if(newerFirst){pending[1](Response.json({user:{id:B}}));await newer;pending[0](Response.json({user:{id:A}}));await older;}
    else{pending[0](Response.json({user:{id:A}}));await older;pending[1](Response.json({user:{id:B}}));await newer;}
    assert.equal(store.user.id,B);
  }
});
test('unknown/malformed RPC response cannot report success or sign out',async()=>{
  for(const result of [{},null,{...accepted,providerDeletion:'completed'},{...accepted,repeated:'false'}]){
    const f=fixture({result}),r=await f.send();assert.equal(r.status,503);assert.equal(f.calls.some(c=>c.path.endsWith('/sign-out')),false);assert.equal(r.headers.has('Set-Cookie'),false);
  }
});
test('RPC failures preserve session and disclose no private upstream details',async()=>{
  for(const status of [401,403,409,429,503]){
    const f=fixture({rpcStatus:status,result:{private:'SECRET'}}),r=await f.send();assert.equal(r.status,status);assert.equal((await r.text()).includes('SECRET'),false);assert.equal(r.headers.has('Set-Cookie'),false);
  }
});
test('erasure CSRF rejection happens before auth and data calls',async()=>{
  const f=fixture();let calls=0;
  for(const headers of [{Origin:'https://evil.example','X-Synera-Client':'1'},{Origin:origin},{Origin:origin,'X-Synera-Client':'1','Sec-Fetch-Site':'cross-site'}]){
    const r=await handleNeon(new Request(origin+'/api/neon/profile-erasure',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({confirm:'ERASE_APPLICATION_DATA'})}),f.env,()=>{calls++;throw Error('Unexpected');});
    assert.equal(r.status,403);
  }
  assert.equal(calls,0);
});
test('NeonStore distinct erasure method is gated, validates receipt, and clears user only on confirmed erasure',async()=>{
  for(const enabled of [false,true]) {
    const w=world(),calls=[];let valid=false;
    const store=new NeonStore({...w.config,profileErasureEnabled:enabled},async(path,init)=>{
      if(path==='/api/neon/session')return w.fetchFor(path,init);
      calls.push({path,init});return Response.json(valid?{...accepted,sessionRevoked:false}:{});
    });
    await store.restore();await assert.rejects(store.eraseProfileData());assert.equal(store.user.id,A);
    if(!enabled){assert.equal(calls.length,0);continue;}
    valid=true;assert.equal((await store.eraseProfileData()).providerDeletion,'pending');assert.equal(store.user,null);
    assert.equal(calls[1].path,'/api/neon/profile-erasure');assert.deepEqual(JSON.parse(calls[1].init.body),{confirm:'ERASE_APPLICATION_DATA',expectedSubject:A});
  }
});
