// Verifies the packaged Worker, public asset closure and closed rollout.
// No network provider call, deployment or SQL execution occurs here.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {PUBLIC_ASSETS} from '../web_launch/assets.mjs';
const output='dist-neon-network-20261002', directory=path.resolve('web_launch',output);
const build=spawnSync(process.execPath,['neon/build.mjs',output],{encoding:'utf8'});
assert.equal(build.status,0,build.stderr+build.stdout);
const manifest=JSON.parse(await fs.readFile(path.join(directory,'release.json'),'utf8'));
assert.deepEqual((await fs.readdir(directory)).sort(),[...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json'].sort());
for(const item of manifest.files){
  const data=await fs.readFile(path.join(directory,item.name));
  assert.equal(data.length,item.bytes);
  assert.equal(createHash('sha256').update(data).digest('hex'),item.sha256);
}
const source=await fs.readFile(path.join(directory,'_worker.js'),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const origin='https://package-fixture.pages.dev'; let assetsFetched=0;
const env={SYNERA_PILOT_READY:'true',SYNERA_GROUP_ROOMS_READY:'false',ASSETS:{async fetch(request){
  assetsFetched++;const name=new URL(request.url).pathname.slice(1);return new Response(await fs.readFile(path.join(directory,name)),{headers:{'Content-Type':PUBLIC_ASSETS[name]}});
}}};
assert.equal((await (await worker.fetch(new Request(origin+'/config.json'),env)).json()).groupRoomsEnabled,false);
const locked=await worker.fetch(new Request(origin+'/api/neon/rooms/list',{method:'POST',headers:{Origin:origin,'X-Synera-Client':'1','Content-Type':'application/json'},body:'{}'}),env);
assert.equal(locked.status,503);assert.equal(locked.headers.get('Cache-Control'),'no-store');
const publicRoom=await worker.fetch(new Request(origin+'/rooms.html'),env);
assert.equal(publicRoom.status,200);assert.match(await publicRoom.text(),/room-triangle/);
assert.equal((await worker.fetch(new Request(origin+'/group-room.acceptance.sql'),env)).status,404);
assert.equal(assetsFetched,1);
const receipt={pass:true,scope:'built Worker/public assets only; no SQL or live account proof',directory,public_files:Object.keys(PUBLIC_ASSETS).length,files:manifest.files,closed_rollout:true,sql_runtime:'NOT_RUN',published:false,provider_calls:0};
await fs.mkdir('artifacts/network-room-20261002',{recursive:true});
await fs.writeFile('artifacts/network-room-20261002/package-acceptance.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify({pass:true,scope:receipt.scope,public_files:receipt.public_files,closed_rollout:true,published:false}));
