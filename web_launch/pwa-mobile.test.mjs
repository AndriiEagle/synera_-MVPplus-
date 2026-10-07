import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const source=process.env.SYNERA_PWA_MUTATION==='baseline'
 ?execFileSync('git',['show','a284a1e:web_launch/pwa.mjs'],{encoding:'utf8'})
 :await fs.readFile(new URL('./pwa.mjs',import.meta.url),'utf8');
async function harness(standalone=false){
  const events={}, clicks={}, swEvents={}, regEvents={}, workerEvents={};
  const button={hidden:false,addEventListener:(n,f)=>clicks[n]=f},status={textContent:''};
  let reloads=0;
  const draft={value:'Незбережена думка'};
  const worker={state:'installing',addEventListener:(n,f)=>workerEvents[n]=f};
  const registration={installing:worker,addEventListener:(n,f)=>regEvents[n]=f};
  const context={document:{querySelector:s=>s==='#install-app'?button:s==='#install-status'?status:null},navigator:{standalone,serviceWorker:{controller:{},register:async()=>registration,addEventListener:(n,f)=>swEvents[n]=f}},matchMedia:()=>({matches:standalone}),window:{isSecureContext:true,addEventListener:(n,f)=>events[n]=f,location:{reload:()=>{reloads++;draft.value='';}}},setTimeout:fn=>fn()};
  vm.runInNewContext(source,context);await new Promise(r=>setImmediate(r));
  return {events,clicks,swEvents,regEvents,workerEvents,worker,button,status,draft,reloads:()=>reloads};
}
test('iPhone without beforeinstallprompt has a reachable installation guide',async()=>{
  const h=await harness();assert.equal(h.button.hidden,false);await h.clicks.click();assert.match(h.status.textContent,/iPhone.*Safari/);assert.match(h.status.textContent,/Android/);
});
test('installed app hides installation action',async()=>{const h=await harness(true);assert.equal(h.button.hidden,true);});
test('Chrome prompt is explicit and consumed once; cancellation keeps manual help',async()=>{
 const h=await harness();let prompted=0,prevented=0;
 h.events.beforeinstallprompt({preventDefault:()=>prevented++,prompt:async()=>prompted++,userChoice:Promise.resolve({outcome:'dismissed'})});
 assert.equal(prompted,0);await h.clicks.click();await h.clicks.click();assert.equal(prompted,1);assert.equal(prevented,1);assert.equal(h.button.hidden,false);assert.match(h.status.textContent,/Safari/);
});
test('rejected native install prompt leaves usable manual instructions',async()=>{
 const h=await harness();h.events.beforeinstallprompt({preventDefault(){},prompt:async()=>{throw Error('browser declined');}});await assert.doesNotReject(h.clicks.click());assert.match(h.status.textContent,/Safari/);assert.equal(h.button.hidden,false);
});
test('service worker update never discards an in-progress draft',async()=>{
 const h=await harness();h.regEvents.updatefound();h.worker.state='installed';h.workerEvents.statechange();h.swEvents.controllerchange();assert.equal(h.reloads(),0);assert.equal(h.draft.value,'Незбережена думка');assert.match(h.status.textContent,/оновлен/i);
});
