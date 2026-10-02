import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
const origin='https://example.test';
async function offlineNavigation(path){const listeners={},cacheReads=[];const source=await fs.readFile(new URL('./studio-sw.mjs',import.meta.url),'utf8');
 vm.runInNewContext(source,{URL,self:{location:{origin},addEventListener:(name,handler)=>listeners[name]=handler},fetch:()=>Promise.reject(new Error('offline')),caches:{match:async key=>{const pathname=new URL(typeof key==='string'?key:key.url,origin).pathname;cacheReads.push(pathname);return pathname==='/studio.html'?new Response('exact Studio shell'):undefined;}}});
 let response=null;listeners.fetch({request:{url:origin+path,method:'GET'},respondWith:promise=>{response=promise;}});return {response:response?await response:null,cacheReads};
}
test('published clean Studio URLs retrieve the original cached shell offline',async()=>{for(const path of ['/studio','/studio/','/studio.html']){const result=await offlineNavigation(path);assert.ok(result.response,`no offline interception for ${path}`);assert.equal(await result.response.text(),'exact Studio shell');assert.deepEqual(result.cacheReads,['/studio.html']);}});
test('query URLs and non-shell paths never read a private response from cache',async()=>{for(const path of ['/studio?private=1','/api/session','/config.json','/user-profile.json']){const result=await offlineNavigation(path);assert.equal(result.response,null);assert.deepEqual(result.cacheReads,[]);}});
