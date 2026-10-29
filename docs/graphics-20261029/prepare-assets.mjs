// Deterministic crop/resize/encoding only. All visual creation uses built-in image_gen.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = resolve(root, 'docs/graphics-20261029');
if (relative(root, destination).startsWith('..') || !existsSync(resolve(root,'web_launch/assets.mjs'))) throw Error('wrong workspace');
const generated = 'C:/Users/Andrii/.codex/generated_images/01a18907-0c97-74a0-be54-1323ad8d0c1a';
const pairs = [
  ['exec-3a783314-0e4d-4215-8df2-6e295511bc6c.png','mira','leo'],
  ['exec-cf04c0cd-bb4f-4dea-b4a9-f9bf9f31371a.png','nora','felix'],
  ['exec-c0976512-c561-4cca-b736-5d13f081af14.png','ines','sam'],
  ['exec-2bc7c8bb-9694-41ac-935d-89e1b75c62c0.png','tessa','noah'],
  ['exec-0e6c14c2-4b0b-4b86-b17b-657307b4821a.png','lina','omar'],
];
const evidence = [];
function run(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner','-loglevel','error','-threads','1',...args], { encoding: 'utf8' });
  if (r.status !== 0) throw Error(r.stderr);
}
function record(path, origin) {
  const bytes = readFileSync(path);
  evidence.push({ file: relative(root,path).replaceAll('\\','/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), origin });
}
mkdirSync(resolve(destination,'sources'),{ recursive: true });
for (const [file,...keys] of pairs) {
  const input = resolve(generated,file);
  for (const [side,key] of keys.entries()) {
    const master = resolve(destination,`sources/persona-${key}-640.png`);
    const served = resolve(root,`web_launch/persona-${key}.webp`);
    // Each generator diptych is 2:1: extract the complete square, retaining tool hints.
    // The checked-in 640px masters are sufficient to rebuild from a fresh checkout.
    if (!existsSync(master)) run(['-y','-i',input,'-vf',`crop=iw/2:ih:${side ? 'iw/2' : '0'}:0,scale=640:640:flags=lanczos`,'-frames:v','1',master]);
    run(['-y','-i',master,'-vf','scale=320:320:flags=lanczos','-frames:v','1','-c:v','libwebp','-quality','84',served]);
    if (readFileSync(served).length > 45000) throw Error(`${key} exceeds portrait budget`);
    record(master,file); record(served,relative(root,master));
  }
}
const scene = resolve(destination,'sources/synera-thread-master.png');
if (!existsSync(scene)) copyFileSync(resolve(generated,'exec-e3f2d66b-6167-458d-a1a3-6c86d79edec6.png'),scene);
record(scene,'built-in image_gen');
for (const [width,suffix] of [[768,''],[1536,'@2x']]) {
  const path=resolve(root,`web_launch/synera-thread${suffix}.webp`);
  run(['-y','-i',scene,'-vf',`scale=${width}:-1:flags=lanczos`,'-frames:v','1','-c:v','libwebp','-quality','84',path]);
  if (!suffix && readFileSync(path).length > 140000) throw Error('scene exceeds budget');
  record(path,relative(root,scene));
}
const icon=resolve(destination,'sources/icon-master.png');
if (existsSync(icon)) {
  record(icon,'built-in image_gen edit of existing Synera S-dot mark');
  for(const file of ['icon-192.png','icon-512.png','apple-touch-icon.png']) record(resolve(root,'web_launch',file),'sources/icon-master.png');
}
writeFileSync(resolve(destination,'asset-evidence.json'),JSON.stringify({ generator:'Codex built-in image_gen', fictional:true, processing:'FFmpeg crop/resize/WebP only', assets:evidence },null,2)+'\n');
console.log(evidence.map(e => `${e.file}: ${e.bytes} bytes`).join('\n'));
