import test from 'node:test';import assert from 'node:assert/strict';
import {world,A,origin} from '../tools/fixtures/profile-delete-fixture.mjs';
import {handleNeon,createNeonWorker} from './worker.mjs';
import {NeonStore} from '../web_launch/neon-store.mjs';

test('actual gateway sanitizes FK HTTP409; actual NeonStore makes one own DELETE and preserves session/data',async()=>{
  const w=world(),store=new NeonStore(w.config,w.fetchFor),before=structuredClone(w.db.profiles);
  await store.restore();
  await assert.rejects(store.deleteProfile(),e=>{assert.equal(e.status,409);assert.equal(e.code,'profile_delete_conflict');assert.ok(!e.message.includes('PRIVATE_'));return true;});
  assert.equal(store.user.id,A);assert.deepEqual(w.db.profiles,before);
  assert.deepEqual(w.calls.filter(r=>r.method==='DELETE'),[{path:'/api/neon/data/profiles?id=eq.'+A,method:'DELETE',status:409}]);
  assert.equal(w.upstreamCalls.filter(r=>r.method==='DELETE').length,1);
});
for(const status of [401,403,429,500,503])test('gateway/client preserve existing semantics for HTTP'+status,async()=>{
  const w=world({status}),store=new NeonStore(w.config,w.fetchFor);await store.restore();const before=structuredClone(w.db.profiles);
  await assert.rejects(store.deleteProfile(),e=>{assert.equal(e.status,status===500?503:status);assert.notEqual(e.code,'profile_delete_conflict');assert.ok(!e.message.includes('PRIVATE_'));return true;});
  assert.equal(w.calls.filter(r=>r.method==='DELETE').length,1);assert.equal(w.upstreamCalls.filter(r=>r.method==='DELETE').length,1);
  assert.deepEqual(w.db.profiles,before);assert.equal(store.user?.id,status===401?undefined:A);
});
test('successful own DELETE returns only the deleted own row; another profile and current session remain',async()=>{
  const w=world({success:true}),store=new NeonStore(w.config,w.fetchFor);await store.restore();await store.deleteProfile();
  assert.equal(w.db.profiles.some(p=>p.id===A),false);assert.equal(w.db.profiles.length,3);assert.equal(store.user.id,A);
  assert.equal(w.calls.filter(r=>r.method==='DELETE').length,1);
});
test('unrelated meeting HTTP409 retains the original meeting conflict interpretation',async()=>{
  const w=world(),store=new NeonStore(w.config,w.fetchFor);await store.restore();
  await assert.rejects(store._send('/rest/v1/meeting_requests',{method:'POST',body:{note:'Synthetic'}}),e=>e.status===409&&e.code==='data_unavailable'&&e.message.includes('Зустрічі'));
});
test('rooms-off is a server gate on all room actions with zero upstream calls',async()=>{
  const w=world();let calls=0;
  for(const suffix of ['create','list',A+'/get',A+'/accept',A+'/leave',A+'/start',A+'/message',A+'/advance',A+'/close']){
    const req=new Request(origin+'/api/neon/rooms/'+suffix,{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json',Cookie:'__Host-synera-session='+A},body:'{}'});
    assert.equal((await handleNeon(req,w.env,async()=>{calls++;throw Error('Upstream should not be called');})).status,503);
  }
  assert.equal(calls,0);
  const c=await(await createNeonWorker([]).fetch(new Request(origin+'/config.json'),w.env)).json();assert.equal(c.groupRoomsEnabled,false);
});
