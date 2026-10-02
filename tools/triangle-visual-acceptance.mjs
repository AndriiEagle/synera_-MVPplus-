import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(new Error('Server timeout')),10000);server.stdout.on('data',chunk=>{output+=chunk;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});server.on('exit',()=>{clearTimeout(timer);reject(new Error('Server stopped'));});});
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  await page.goto(base+'/triangle.html');
  await page.locator('#room-goal').fill('Вивести корисний продукт у Zürich');
  for(const[id,name]of[['a','Mara'],['b','Leo'],['c','Noor']])await page.locator(`#name-${id}`).fill(name);
  await page.locator('#local-understood').check();await page.locator('#room-setup button').click();
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/triangle-20261002/triangle-mobile-top.png'});
  await page.locator('[data-pane="atlas"]').click();await page.locator('.atlas-marker').filter({hasText:'Noor'}).click();
  await page.evaluate(()=>scrollTo(0,330));await page.screenshot({path:'artifacts/triangle-20261002/atlas-mobile-view.png'});
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-pane="room"]').click();await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'artifacts/triangle-20261002/triangle-desktop.png'});
  const result={status:'PASS',surface:'local Chromium',physicalAndroid:false,physicalIPhone:false,
    screenshots:['triangle-mobile-top.png','atlas-mobile-view.png','triangle-desktop.png'],reducedMotion:true};
  await fs.writeFile('artifacts/triangle-20261002/VISUAL_RECEIPT.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}finally{await browser.close();server.kill();}
