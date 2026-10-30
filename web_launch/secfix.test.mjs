import test from 'node:test';
import assert from 'node:assert/strict';
import { ProfileStore } from './profile-store.mjs';
import { NeonStore } from './neon-store.mjs';
import { handleMeetingLocation } from '../neon/meeting-location.mjs';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('R1 direct profile deletion never sends DELETE even if the transport would succeed', async () => {
  class Store extends ProfileStore {
    user = { id: '11111111-1111-4111-8111-111111111111' };
    realPilotEnabled = true;
    calls = [];
    async _send(...args) { this.calls.push(args); return [{ id: this.user.id }]; }
  }
  const store = new Store();
  await assert.rejects(store.deleteProfile());
  assert.deepEqual(store.calls, []);
  assert.ok(store.user);
});

test('W3 oversized location stream is cancelled before all bytes are read or RPC called', async () => {
  let pulled=0,cancelled=false,calls=0;
  const body=new ReadableStream({pull(controller){pulled++;controller.enqueue(new Uint8Array(1025));if(pulled===100)controller.close();},cancel(){cancelled=true;}},{highWaterMark:0});
  const request=new Request('https://example.test/api/neon/location/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/view',{method:'POST',body,duplex:'half'});
  const env={SYNERA_PILOT_READY:'true',SYNERA_LOCATION_READY:'true',SYNERA_LOCATION_EPHEMERAL:{get(){},put(){},delete(){}}};
  const result=await handleMeetingLocation(request,env,{user:{id:'a'}},async()=>{calls++;});
  assert.equal(result.status,400);assert.equal(calls,0);assert.equal(cancelled,true);assert.ok(pulled<100);
});

test('C1 query URLs never read or populate a canonical service worker cache', async () => {
  for(const [file,url] of [['studio-sw.mjs','/studio-journey.html?person=private'],['simulation-sw.mjs','/simulation.html?private=1']]){
    const handlers={};let handled=false;
    vm.runInNewContext(await fs.readFile(new URL(file,import.meta.url),'utf8'),{URL,self:{location:{origin:'https://example.test'},addEventListener:(event,fn)=>handlers[event]=fn},fetch:()=>Promise.resolve(new Response('private variant')),caches:{open:async()=>({put(){throw Error('query entered cache');}})}});
    handlers.fetch({request:{method:'GET',url:'https://example.test'+url},respondWith(promise){handled=true;promise.catch(()=>{});}});
    assert.equal(handled,false,file);
  }
});

test('D3 exports only participant cases and related approvals and labels inaccessible categories partial', async () => {
  let foreign=false;
  class Store extends ProfileStore {
    user={id:'actor',email:'actor@example.test'};realPilotEnabled=true;caseExportEnabled=true;
    async ownProfile(){return {id:'actor'};}
    async _send(path){
      if(path.includes('/match_cases?'))return [{case_id:'case-a',participant_low:foreign?'stranger':'actor',participant_high:'peer'}];
      if(path.includes('/match_case_approvals?'))return [{case_id:'case-a',party_id:'peer'}];
      return [];
    }
  }
  const store=new Store(),data=await store.exportAccount();
  assert.equal(data.cases[0].case_id,'case-a');assert.equal(data.approvals[0].party_id,'peer');
  assert.equal(data.coverage.status,'partial');assert.ok(data.coverage.omitted.includes('group_room_messages'));
  foreign=true;await assert.rejects(store.exportAccount());
});

test('W4 complete erasure requires its gate, separate phrase and verified self-only receipt', async () => {
  const calls=[];
  const fetcher=async(path,init)=>{calls.push({path,init});return Response.json(path.endsWith('/session')?{user:{id:'actor'}}:{status:'application_data_completely_erased',providerDeletion:'pending',staleSessionTombstone:'retained',repeated:false,sessionRevoked:false});};
  const closed=new NeonStore({backend:'neon',profileErasureEnabled:true},fetcher);await closed.restore();
  await assert.rejects(closed.eraseCompleteApplicationData('DELETE ALL'));assert.equal(calls.length,1);
  const store=new NeonStore({backend:'neon',profileErasureEnabled:true,completeErasureEnabled:true},fetcher);await store.restore();
  await assert.rejects(store.eraseCompleteApplicationData('DELETE'));assert.equal(calls.length,2);
  const result=await store.eraseCompleteApplicationData('DELETE ALL');
  assert.equal(result.sessionRevoked,false);assert.equal(store.user,null);
  assert.equal(calls[2].path,'/api/neon/privacy-erasure');
  assert.deepEqual(JSON.parse(calls[2].init.body),{confirm:'ERASE_ALL_APPLICATION_DATA',expectedSubject:'actor'});
});
