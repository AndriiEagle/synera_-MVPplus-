// Independent browser readback: offline runtime, icon safe zone and review montages.
import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
const root=resolve('.'); if(!root.replaceAll('\\','/').endsWith('/synera-android'))throw Error('wrong root');
const out=resolve('docs/graphics-20261029');
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
const receipt={};
try {
  const base=await new Promise((yes,no)=>{let log=''; const timer=setTimeout(()=>no(Error(log)),30000);server.stdout.on('data',b=>{log+=b;const m=log.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);yes(m[0]);}});server.stderr.on('data',b=>{log+=b;});server.on('exit',code=>{clearTimeout(timer);no(Error(`server ${code}: ${log}`));});});
  browser=await chromium.launch({executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context=await browser.newContext({...devices['iPhone 13'],reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  receipt.cached=await page.evaluate(async()=>{const name=(await caches.keys()).find(name=>name.startsWith('synera-shell-'));return(await(await caches.open(name)).keys()).map(r=>new URL(r.url).pathname);});
  assert.ok(receipt.cached.includes('/persona-mira.webp')&&receipt.cached.includes('/synera-thread@2x.webp'));
  await context.setOffline(true);await page.goto(base);
  await page.locator('.signature-scene img').evaluate(img=>img.decode());
  assert.ok(await page.locator('#prepare-profile').isVisible());
  await page.goto(`${base}/summit.html`);await page.locator('.floating-card img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  receipt.offline='home and Summit navigate and decode new graphics with network disabled';
  await context.setOffline(false);
  await page.goto(base);
  receipt.icon=await page.evaluate(async()=>{
    const img=new Image();img.src='/icon-512.png';await img.decode();const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,512,512).data;let bright=0,outside=0;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;if(p[i]>140&&p[i+1]>90&&p[i+2]<190){bright++;if(Math.hypot(x-256,y-256)>512*.4)outside++;}}
    return{corner:Array.from(p.slice(0,4)),bright,outside,width:img.width,height:img.height};
  });
  assert.ok(receipt.icon.bright>1000);assert.equal(receipt.icon.outside,0);assert.ok(Math.max(...receipt.icon.corner.slice(0,3))-Math.min(...receipt.icon.corner.slice(0,3))<20);
  await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.screenshot({path:`${out}/shots/desktop-home.png`,fullPage:true});
  for(const [name,device]of [['iphone13',devices['iPhone 13']],['pixel7',devices['Pixel 7']]]){
    const phone=await browser.newContext({...device,reducedMotion:'reduce',serviceWorkers:'block'});const p=await phone.newPage();await p.goto(`${base}/get.html`);await p.screenshot({path:`${out}/shots/${name}-install.png`,fullPage:true});await phone.close();
  }
  receipt.pageErrors=errors;assert.deepEqual(errors,[]);
  await context.close();
  // Inspect every captured phone/card view at once, with readable source filenames.
  const review=await browser.newPage({viewport:{width:1500,height:1200},deviceScaleFactor:1});
  const files=(await readdir(`${out}/shots`)).filter(f=>f.endsWith('.png'));
  for(const [label,select,columns,width] of [
    ['portraits',f=>f.includes('-portrait-'),10,140],
    ['screens',f=>!f.includes('-portrait-')&&!f.startsWith('desktop'),4,340],
  ]){
    const picked=files.filter(select);const tiles=await Promise.all(picked.map(async file=>`<figure><figcaption>${file}</figcaption><img src="data:image/png;base64,${(await readFile(`${out}/shots/${file}`)).toString('base64')}"></figure>`));
    await review.setContent(`<style>body{margin:0;background:#15161d;color:#e7bd87;font:12px system-ui}.grid{display:grid;grid-template-columns:repeat(${columns},${width}px);gap:12px;padding:16px;align-items:start}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px 0}</style><div class="grid">${tiles.join('')}</div>`);
    await review.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await review.screenshot({path:`${out}/review-${label}.png`,fullPage:true});
  }
  // Actual baseline bytes as a counterexample to the icon colour oracle.
  const old=await readFile(`${out}/sources/before-icon-512.png`);
  receipt.oldIcon=await review.evaluate(async data=>{const i=new Image();i.src=data;await i.decode();const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');ctx.drawImage(i,0,0);return Array.from(ctx.getImageData(0,0,1,1).data);},`data:image/png;base64,${old.toString('base64')}`);
  assert.ok(Math.max(...receipt.oldIcon.slice(0,3))-Math.min(...receipt.oldIcon.slice(0,3))>=20);
  receipt.iconNegativeControl='original green icon fails the same dark-neutral corner check';
  await writeFile(`${out}/runtime-evidence.json`,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({...receipt,cached:`${receipt.cached.length} public shell assets`},null,2));
}finally{await browser?.close();server.kill();}
