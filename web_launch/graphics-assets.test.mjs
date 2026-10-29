import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { PUBLIC_ASSETS } from './assets.mjs';

const keys=['mira','leo','nora','felix','ines','sam','tessa','noah','lina','omar'];
const files=[...keys.map(key=>`persona-${key}.webp`),'synera-thread.webp','synera-thread@2x.webp'];
const read=file=>readFileSync(new URL(file,import.meta.url));
function webpSize(bytes) {
  assert.equal(bytes.toString('ascii',0,4),'RIFF'); assert.equal(bytes.toString('ascii',8,12),'WEBP');
  for(let offset=12;offset+8<bytes.length;) {
    const type=bytes.toString('ascii',offset,offset+4), length=bytes.readUInt32LE(offset+4), data=offset+8;
    if(type==='VP8 ') return [bytes.readUInt16LE(data+6)&0x3fff,bytes.readUInt16LE(data+8)&0x3fff];
    if(type==='VP8X') return [bytes.readUIntLE(data+4,3)+1,bytes.readUIntLE(data+7,3)+1];
    offset=data+length+(length&1);
  }
  throw Error('No supported WebP image chunk');
}
test('ten distinct served portraits meet the actual raster and byte budgets',()=>{
  const hashes=new Set();
  for(const key of keys) {
    const bytes=read(`persona-${key}.webp`);
    assert.deepEqual(webpSize(bytes),[320,320]); assert.ok(bytes.length<=45000);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
    const source=read(`../docs/graphics-20261029/sources/persona-${key}-640.png`);
    assert.deepEqual([source.readUInt32BE(16),source.readUInt32BE(20)],[640,640]);
  }
  assert.equal(hashes.size,10);
});
test('responsive scene has a true double-resolution variant and stays under its payload limit',()=>{
  assert.deepEqual(webpSize(read('synera-thread.webp')),[768,512]);
  assert.deepEqual(webpSize(read('synera-thread@2x.webp')),[1536,1024]);
  assert.ok(read('synera-thread.webp').length<=140000);
});
test('every new image is both publicly served and included in the offline install',async()=>{
  let install, cached;
  const context={ self:{addEventListener:(name,callback)=>{if(name==='install')install=callback;},skipWaiting(){}}, caches:{open:async()=>({addAll:async paths=>{cached=paths;}})} };
  runInNewContext(read('sw.mjs').toString(),context);
  let pending; install({waitUntil:promise=>{pending=promise;}}); await pending;
  for(const file of files) { assert.equal(PUBLIC_ASSETS[file],'image/webp'); assert.ok(cached.includes(`/${file}`),file); }
});
test('install canvases follow the dark default and all shipped icons decode at declared PNG sizes',()=>{
  const theme=read('index.html').toString().match(/name="theme-color" content="(#[0-9a-f]+)"/)[1];
  for(const file of ['manifest.webmanifest','studio.webmanifest','simulation.webmanifest']) {
    const m=JSON.parse(read(file)); assert.equal(m.theme_color,theme); assert.equal(m.background_color,theme);
  }
  const twa=JSON.parse(read('../android/twa-manifest.json'));
  for(const key of ['themeColor','themeColorDark','navigationColor','navigationColorDark','navigationDividerColor','navigationDividerColorDark','backgroundColor']) assert.equal(twa[key],theme,key);
  for(const [file,size] of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]]) {
    const bytes=read(file); assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[size,size]);
  }
});
