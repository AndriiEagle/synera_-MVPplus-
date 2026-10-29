import {chromium,devices} from 'file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});
try {for(const name of ['index','summit','rooms','studio','triangle','catalogue','lab']){
const c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},serviceWorkers:'block'});
await c.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
const p=await c.newPage();await p.goto('http://127.0.0.1:49711/'+(name==='index'?'':name+'.html'),{waitUntil:'networkidle'});
console.log(name,await p.evaluate(()=>({scrollY,header:document.querySelector('.site-header')?.getBoundingClientRect().toJSON(),headerDisplay:getComputedStyle(document.querySelector('.site-header')).display,h1:document.querySelector('h1')?.textContent,h1color:document.querySelector('h1')&&getComputedStyle(document.querySelector('h1')).color,bodybg:getComputedStyle(document.body).backgroundColor})));
await c.close();}}finally{await b.close();}
