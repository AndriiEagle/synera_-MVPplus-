import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function previewBundle({source=path.join(repo,'web_launch/dist-real'),destination=path.join(repo,'tmp/preview-bundle'),liveAi=false}={}) {
  destination=path.resolve(destination);
  if(!destination.startsWith(path.join(repo,'tmp')+path.sep)) throw Error('Preview destination must stay inside worktree tmp/');
  await fs.mkdir(destination,{recursive:true});
  if((await fs.readdir(destination)).length) throw Error('Preview destination must be empty; choose a new --out=tmp/...');
  const allowed=new Set([...Object.keys(PUBLIC_ASSETS),'config.json','_headers','404.html','release.json']);
  const entries=await fs.readdir(source,{withFileTypes:true});
  if(entries.some(e=>!e.isFile()||!allowed.has(e.name))) throw Error('Static source must contain reviewed public files only');
  const publicDir=liveAi?path.join(destination,'public'):destination;await fs.mkdir(publicDir,{recursive:true});
  for(const entry of entries) {
    await fs.copyFile(path.join(source,entry.name),path.join(publicDir,entry.name));
  }
  if(liveAi) {
    const configPath=path.join(publicDir,'config.json');const config=JSON.parse(await fs.readFile(configPath,'utf8'));
    Object.assign(config,{liveAiReady:true,liveAiRuntime:'vercel',liveAiProvider:'OpenRouter',liveAiModel:'z-ai/glm-5.3-flash'});
    await fs.writeFile(configPath,JSON.stringify(config));
    if(entries.some(e=>e.name==='release.json')) {
      const releasePath=path.join(publicDir,'release.json'),release=JSON.parse(await fs.readFile(releasePath,'utf8'));
      await fs.writeFile(releasePath,JSON.stringify({...release,embedded_ai_enabled:true,live_ai_judge:'typesafe/jev-1.14',published:false},null,2));
    }
    for(const file of ['vercel/live-ai.mjs','vercel/package.json','vercel/api/ai/persona-reply.js','neon/live-ai.mjs','web_launch/simulation-personas.mjs','web_launch/ops-log.mjs','web_launch/simulation-copy.mjs','vercel.json']) {
      const target=path.join(destination,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(repo,file),target);
    }
    if(entries.some(e=>e.name==='_headers')) {
      const settingsPath=path.join(destination,'vercel.json'),settings=JSON.parse(await fs.readFile(settingsPath,'utf8'));
      const headers=(await fs.readFile(path.join(source,'_headers'),'utf8')).split('\n').map(line=>/^\s+([^:]+):\s*(.+)$/.exec(line)).filter(Boolean).map(([,key,value])=>({key,value:value.trim()}));
      settings.headers.unshift({source:'/:path*',headers});await fs.writeFile(settingsPath,JSON.stringify(settings,null,2));
    }
    await fs.copyFile(path.join(repo,'vercel/package.json'),path.join(destination,'package.json'));
    await fs.mkdir(path.join(destination,'api/ai'),{recursive:true});
    // One function keeps reply/spend/health on the same per-instance counter.
    await fs.writeFile(path.join(destination,'api/ai/[action].js'),"export { default } from '../../vercel/api/ai/persona-reply.js';\n");
  }
  return {directory:destination,liveAi,published:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const build=spawnSync(process.execPath,['web_launch/build.mjs'],{cwd:repo,stdio:'inherit'});
  if(build.status!==0) process.exitCode=1;
  else {
    try {console.log(JSON.stringify(await previewBundle({liveAi:process.argv.includes('--live-ai'),destination:process.argv.find(a=>a.startsWith('--out='))?.slice(6)})));}
    catch(error) {console.error(error.message);process.exitCode=1;}
  }
}
