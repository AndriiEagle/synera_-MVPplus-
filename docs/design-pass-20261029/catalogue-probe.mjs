import {chromium,devices} from 'file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/node_modules/playwright/index.mjs';
const b=await chromium.launch({channel:'chrome',headless:true});
try{for(const style of ['atelier','synera','night']){
const c=await b.newContext({...devices['iPhone 13'],serviceWorkers:'block'});await c.addInitScript(style=>localStorage.setItem('synera.style',style),style);
const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
await p.goto('http://127.0.0.1:49711/catalogue.html',{waitUntil:'networkidle'});
console.log(style,await p.evaluate(()=>({style:document.documentElement.dataset.syneraStyle,saved:localStorage.getItem('synera.style'),scripts:[...document.scripts].map(s=>s.src),select:document.querySelector('#style-preset')?.value})),errors);await c.close();
}}finally{await b.close();}
