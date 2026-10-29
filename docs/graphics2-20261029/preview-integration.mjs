// Read-only owning-lane preview. It writes NO files in the other worktree.
// Changes to its renderer are exported as a reviewable patch, never applied here.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium, devices } from 'playwright';
import { scenes, insertScene, figure } from './integrate-scenes.mjs';
const source=resolve(process.argv[2]||'C:/sw/synera-adaptive');
if(source===resolve('.'))throw new Error('Preview must not masquerade as merged acceptance');
const out=import.meta.dirname,changes=new Map(),inputs=new Map();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function input(file){const bytes=await readFile(resolve(source,'web_launch',file));inputs.set(file,hash(bytes));return bytes;}
const assets=(await input('assets.mjs')).toString('utf8');
const allowed=new Set([...assets.matchAll(/['"]([^'"\n]+\.(?:html|mjs|css|webp|png|svg|woff2|webmanifest))['"]\s*:/g)].map(m=>m[1]));
const originals=new Map();
for(const file of ['privacy.html','pilot-consent.html','simulation.html','simulation-living-ui.mjs','legal-documents.mjs'])originals.set(file,(await input(file)).toString('utf8'));
for(const file of ['privacy.html','simulation.html'])changes.set(file,insertScene(originals.get(file),scenes.find(row=>row.page===file)));
changes.set('pilot-consent.html',originals.get('pilot-consent.html').replace('</head>','<link rel="stylesheet" href="/scenes.css">\n</head>'));
const sim=originals.get('simulation-living-ui.mjs'),marker='demoMarker(); privacyLinks();';
if(!sim.includes(marker))throw new Error('Simulation renderer seam changed; owner review required');
changes.set('simulation-living-ui.mjs',sim.replace(marker,`// Preserve the one static scene when the public renderer replaces its own root.\nconst scene = document.querySelector('figure.scene-simulation');\nif (scene) root.querySelector('#living-status').after(scene);\n${marker}`));
const legal=originals.get('legal-documents.mjs'),pilotHeading="target.append(el('h1',rows[0]));";
if(!legal.includes(pilotHeading))throw new Error('Pilot heading seam changed; owner review required');
changes.set('legal-documents.mjs',legal.replace(pilotHeading,pilotHeading+`target.insertAdjacentHTML('beforeend', '${figure('legal')}');`));
await mkdir('tmp/graphics2-patch',{recursive:true});
let patch='';
for(const [file,after]of changes){
  // The graphics branch already contributes the static Simulation figure and link.
  if(file==='simulation.html')continue;
  const before=originals.get(file);await writeFile(`tmp/graphics2-patch/before-${file}`,before);await writeFile(`tmp/graphics2-patch/after-${file}`,after);
  let diff='';try{diff=execFileSync('git',['diff','--no-index','--','tmp/graphics2-patch/before-'+file,'tmp/graphics2-patch/after-'+file],{encoding:'utf8'});}catch(error){if(error.status!==1)throw error;diff=error.stdout;}
  patch+=diff.replaceAll(`a/tmp/graphics2-patch/before-${file}`,`a/web_launch/${file}`).replaceAll(`b/tmp/graphics2-patch/after-${file}`,`b/web_launch/${file}`);
}
await writeFile(`${out}/pending-integration.patch`,patch);
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
const result={source,sourceKind:'READ_ONLY_PARALLEL_LANE_PREVIEW_NOT_MERGED',serverPid:server.pid,pages:[],inputHashes:{},renderedChanges:[...changes.keys()]};
try{
  const base=await new Promise((accept,reject)=>{let log='';const timer=setTimeout(()=>reject(new Error(log)),30000);server.stdout.on('data',part=>{log+=part;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);accept(m[0]);}});server.on('exit',code=>{clearTimeout(timer);reject(new Error(`server ${code}`));});});
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  for(const [name,device]of [['iphone13',devices['iPhone 13']],['pixel7',devices['Pixel 7']]]){
    const context=await browser.newContext({...device,viewport:name==='iphone13'?{width:390,height:844}:{width:412,height:915},serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();
    await page.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url()),file=decodeURIComponent(url.pathname.slice(1));
      if(url.origin!==base||(!allowed.has(file)&&!changes.has(file))||file==='scenes.css'||file.startsWith('scene-'))return route.continue();
      const bytes=changes.has(file)?Buffer.from(changes.get(file)):await input(file);
      const type=file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.mjs')?'text/javascript':undefined;
      await route.fulfill({status:200,body:bytes,contentType:type});
    });
    for(const [file,action]of [['privacy.html','#privacy-download'],['simulation.html','.living-tabs button'],['pilot-consent.html','.pilot-print']]){
      await page.goto(`${base}/${file}`,{waitUntil:'networkidle'});
      const scene=page.locator('figure.scene');await scene.waitFor({state:'visible'});
      if(await page.locator('figure.scene').count()!==1)throw new Error(`${file}: exactly one figure required`);
      await scene.locator('img').evaluate(image=>image.decode());
      const box=await page.locator(action).first().boundingBox();const viewport=page.viewportSize();
      const visible=box&&box.y>=0&&box.y+box.height<=viewport.height;
      await page.screenshot({path:`${out}/shots/${name}-${file}-staged-first.png`,scale:'css'});
      await page.screenshot({path:`${out}/shots/${name}-${file}-staged-full.png`,fullPage:true,scale:'css'});
      await scene.screenshot({path:`${out}/shots/${name}-${file}-staged-scene.png`,scale:'css'});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      result.pages.push({device:name,page:file,action:box,viewport,firstActionVisible:visible,overflow,scene:await scene.boundingBox()});
      if(!visible||overflow)throw new Error(`${name} ${file}: first action/overflow requires owner integration adjustment`);
      if(file==='pilot-consent.html'){
        for(const language of ['uk','en','de']){
          await page.locator(`.legal-languages button[lang="${language}"]`).click();
          if(await page.locator('figure.scene').count()!==1)throw new Error('Pilot scene lost on language change');
          await page.locator('figure.scene img').evaluate(image=>image.decode());
          const action=await page.locator('.pilot-print').boundingBox();
          if(action.y+action.height>viewport.height)throw new Error(`Pilot ${language}: Print below fold`);
        }
        await page.emulateMedia({media:'print'});
        if(await scene.evaluate(el=>getComputedStyle(el).display)!=='none')throw new Error('Decorative scene must not lengthen paper consent');
        await page.emulateMedia({media:'screen'});
        result.pages.at(-1).languages=['uk','en','de'];result.pages.at(-1).hiddenForPrint=true;
      }
    }
    await context.close();
  }
}finally{
  await browser?.close();if(server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;}result.serverStopped=true;result.inputHashes=Object.fromEntries(inputs);
  await writeFile(`${out}/pending-integration-evidence.json`,JSON.stringify(result,null,2)+'\n');
}
console.log('PASS read-only integration preview. Apply patch only after owning-lane merge and verify final source.');
