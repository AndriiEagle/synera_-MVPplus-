import test from 'node:test';import assert from 'node:assert/strict';
import {world,A,origin} from '../tools/fixtures/profile-delete-fixture.mjs';
import {handleNeon,createNeonWorker} from './worker.mjs';
import {NeonStore} from '../web_launch/neon-store.mjs';

test('actual NeonStore refuses direct profile DELETE and preserves session and shared data',async()=>{
  const w=world(),store=new NeonStore(w.config,w.fetchFor),before=structuredClone(w.db.profiles);
  await store.restore();
  await assert.rejects(store.deleteProfile(),e=>{assert.equal(e.status,405);assert.equal(e.code,'profile_delete_disabled');assert.ok(!e.message.includes('PRIVATE_'));return true;});
  assert.equal(store.user.id,A);assert.deepEqual(w.db.profiles,before);
  assert.deepEqual(w.calls.filter(r=>r.method==='DELETE'),[]);
  assert.equal(w.upstreamCalls.filter(r=>r.method==='DELETE').length,0);
});
for(const status of [401,403,429,500,503])test('direct DELETE cannot reach a provider even if it would return HTTP'+status,async()=>{
  const w=world({status}),store=new NeonStore(w.config,w.fetchFor);await store.restore();const before=structuredClone(w.db.profiles);
  await assert.rejects(store.deleteProfile(),e=>{assert.equal(e.status,405);assert.equal(e.code,'profile_delete_disabled');assert.ok(!e.message.includes('PRIVATE_'));return true;});
  const response=await w.fetchFor('/api/neon/data/profiles?id=eq.'+A,{method:'DELETE',headers:{'X-Synera-Client':'1'}});
  assert.equal(response.status,405);assert.equal(w.upstreamCalls.filter(r=>r.method==='DELETE').length,0);
  assert.deepEqual(w.db.profiles,before);assert.equal(store.user.id,A);
});
test('a provider willing to cascade-delete is fenced by both client and gateway',async()=>{
  const w=world({success:true}),store=new NeonStore(w.config,w.fetchFor);await store.restore();const before=structuredClone(w.db.profiles);
  await assert.rejects(store.deleteProfile(),e=>e.status===405);
  assert.equal((await w.fetchFor('/api/neon/data/profiles?id=eq.'+A,{method:'DELETE',headers:{'X-Synera-Client':'1'}})).status,405);
  assert.deepEqual(w.db.profiles,before);assert.equal(store.user.id,A);
  assert.equal(w.upstreamCalls.filter(r=>r.method==='DELETE').length,0);
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
