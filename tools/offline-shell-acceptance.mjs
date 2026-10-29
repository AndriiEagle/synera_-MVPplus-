// Actual Chromium + SW cache-only fresh-document regression. Own outputs only; synthetic config.
import {createRequire} from 'node:module';
const require=createRequire(process.cwd()+'/package.json');
const {chromium}=require(process.env.SYNERA_TEST_MODULE_ROOT?process.env.SYNERA_TEST_MODULE_ROOT+'/node_modules/playwright':'playwright');
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const out=path.resolve('artifacts/offline-shell-acceptance');
await fs.mkdir(out,{recursive:true});
const option=n=>process.argv.find(x=>x.startsWith('--'+n+'='))?.split('=').slice(1).join('=');
const variant=option('variant')||'reviewed';assert.match(variant,/^[a-z0-9-]+$/);
const overlay=option('overlay');if(overlay)assert.equal(path.dirname(path.resolve(overlay)),out);
const candidate=path.resolve(option('candidate')||'web_launch/dist-neon-ci');
const dest=path.join(out,'PASS3_'+variant.toUpperCase());await fs.mkdir(dest,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const releaseBytes=await fs.readFile(path.join(candidate,'release.json'));
assert.equal(JSON.parse(releaseBytes).published,false);
const manifest=JSON.parse(releaseBytes).files;const rows=new Map(manifest.map(x=>[x.name,x]));
const swBytes=overlay?await fs.readFile(path.resolve(overlay)):await fs.readFile(path.join(candidate,'sw.mjs'));
if(!overlay)assert.equal(sha(swBytes),rows.get('sw.mjs').sha256);
const result={variant,status:'RUNNING',baseReleaseHash:sha(releaseBytes),overlay:overlay?{file:path.basename(overlay),sha256:sha(swBytes)}:null,
 servedSWHash:sha(swBytes),
 scope:'Desktop Chromium, fresh document, real SW/CacheStorage, HTTP cache cleared/disabled, synthetic config, no production/auth/private data',
 checks:[],online:{errors:[],requestFailures:[]},offline:{errors:[],requestFailures:[]},serverRequests:[],provider_calls:0,usd:0};
const check=(name,pass,detail)=>result.checks.push({name,pass:Boolean(pass),...(detail===undefined?{}:{detail})});
const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 try{
  let p=new URL(req.url,'http://127.0.0.1').pathname;if(p==='/')p='/index.html';result.serverRequests.push(p);
  if(p==='/config.json'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'}).end(JSON.stringify({registrationEnabled:false}));return;}
  const name=p.slice(1);assert.equal(path.basename(name),name);assert.ok(rows.has(name));
  const bytes=name==='sw.mjs'?swBytes:await fs.readFile(path.join(candidate,name));
  if(name!=='sw.mjs')assert.equal(sha(bytes),rows.get(name).sha256,'served immutable '+name);
  res.writeHead(200,{'content-type':mime[path.extname(name)]||'application/octet-stream','cache-control':'no-store','service-worker-allowed':'/'}).end(bytes);
 }catch{res.writeHead(404,{'cache-control':'no-store'}).end();}
});
let browser,context,diagnosticPage;
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,timeout:20000,executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()});result.engine={name:'chromium',version:browser.version(),executable:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()};
 context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow',reducedMotion:'reduce',locale:'uk-UA'});
 context.setDefaultTimeout(6000);
 await context.addInitScript(()=>localStorage.setItem('synera.first-user-tour.v1','done'));
 await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
 const instrument=(p,bucket)=>{p.on('pageerror',e=>bucket.errors.push(e.message));p.on('requestfailed',r=>bucket.requestFailures.push({path:new URL(r.url()).pathname,resourceType:r.resourceType(),error:r.failure()?.errorText}));};
 const warm=await context.newPage();instrument(warm,result.online);
 const warmCDP=await context.newCDPSession(warm);await warmCDP.send('Network.enable');await warmCDP.send('Network.setCacheDisabled',{cacheDisabled:true});
 await warm.goto(base+'/',{waitUntil:'networkidle',timeout:20000});
 await warm.waitForFunction(()=>document.querySelector('#mode').textContent!=='Перевірка доступу',null,{timeout:10000});
 await warm.evaluate(()=>navigator.serviceWorker.ready);
 await warm.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:10000});
 result.online.cache=await warm.evaluate(async()=>({controlled:Boolean(navigator.serviceWorker.controller),keys:await caches.keys(),
   entries:await Promise.all((await caches.keys()).map(async k=>({name:k,paths:(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)})))}));
 await warm.locator('#prepare-profile').click();
 check('online profile action works',await warm.locator('#profile-form').isVisible());
 result.online.mode=await warm.locator('#mode').innerText();
 await warm.screenshot({path:path.join(dest,'online-profile.png'),fullPage:true});
 await warmCDP.send('Network.clearBrowserCache');
 const offline=await context.newPage();diagnosticPage=offline;instrument(offline,result.offline);
 const cdp=await context.newCDPSession(offline);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 const responses=[];offline.on('response',r=>responses.push({path:new URL(r.url()).pathname,status:r.status(),fromSW:r.fromServiceWorker()}));
 await new Promise(resolve=>server.close(resolve));result.offline.originServerClosed=true;
 await context.setOffline(true);const before=result.serverRequests.length;
 result.stage='offline-navigation';
 await offline.goto(base+'/',{waitUntil:'domcontentloaded',timeout:12000});
 result.stage='offline-readiness';
 try{await offline.waitForLoadState('networkidle',{timeout:4000});result.offline.networkIdle=true;}catch{result.offline.networkIdle=false;}
 result.offline.controlled=await offline.evaluate(()=>Boolean(navigator.serviceWorker.controller));
 check('offline document is served by installed SW',result.offline.controlled&&responses.some(x=>x.path==='/'&&x.fromSW));
 check('offline reload sends no server requests',result.serverRequests.length===before);
 await offline.locator('#prepare-profile').click();await offline.waitForTimeout(250);
 const functional=await offline.locator('#profile-form').isVisible();
 check('offline fresh document opens usable profile form',functional);
 result.offline.mode=await offline.locator('#mode').innerText();result.offline.workspaceHidden=await offline.locator('#workspace').evaluate(e=>e.hidden);
 result.offline.responses=responses;
 if(functional){
  const name=offline.locator('#profile-form [name="display_name"]');await name.fill('Own words offline');
  await offline.locator('.header-preferences > summary').click();
  await offline.locator('#site-language').selectOption('de');
  await offline.waitForFunction(()=>document.documentElement.lang==='de',null,{timeout:6000});
  await offline.waitForFunction(()=>document.querySelector('.intro h1')?.textContent.includes('Dein Können.'),null,{timeout:6000});
  const heading=await offline.locator('.intro h1').innerText();
  check('offline German actual translated heading',heading.includes('Dein Können.')&&!heading.includes('Твоя майстерність'));
  check('language keeps synthetic draft own words',await name.inputValue()==='Own words offline');
  await offline.locator('#style-preset').selectOption('atelier');
  check('offline Atelier selection and real controls work',await offline.locator('html').getAttribute('data-synera-style')==='atelier'&&await offline.locator('.atelier-settings').count()>0);
  await offline.locator('#style-preset').selectOption('original');
  check('offline previous Web design remains selectable',await offline.locator('html').getAttribute('data-synera-style')==='original');
  await offline.locator('#style-preset').selectOption('synera');
  check('Current style remains reversible',await offline.locator('html').getAttribute('data-synera-style')==='synera');
 }
 await offline.screenshot({path:path.join(dest,'offline-after-action.png'),fullPage:true});
 if(functional){
  const legal=await context.newPage();instrument(legal,result.offline);
  await legal.goto(base+'/legal.html',{waitUntil:'networkidle',timeout:20000});
  await legal.waitForFunction(()=>document.documentElement.lang==='de',null,{timeout:6000});
  check('offline rules load chosen language with unofficial translation notice',(await legal.locator('body').innerText()).includes('inoffizielle Übersetzung'));
  await legal.screenshot({path:path.join(dest,'offline-legal-de.png'),fullPage:true});
  result.offline.privacy=await offline.evaluate(async()=>{
    const keys=async()=>{const result=[];for(const name of await caches.keys())for(const req of await(await caches.open(name)).keys())result.push(new URL(req.url).pathname+new URL(req.url).search);return result.sort();};
    const before=await keys(),attempts=[];
    for(const [url,method] of [['/config.json','GET'],['/api/neon/data/profiles','GET'],['/api/neon/data/profiles','POST'],['/app.mjs?draft=synthetic-local','GET'],['/app.mjs','POST']]){
      try{const response=await fetch(url,{method,...(method==='POST'?{body:'{"probe":"synthetic-no-account"}'}:{})});attempts.push({url,method,status:response.status});}
      catch(error){attempts.push({url,method,error:error.name});}
    }
    return {before,after:await keys(),attempts};
  });
  const privacy=result.offline.privacy;
  check('config fails closed offline and API/query/non-GET cannot use public cache',privacy.attempts[0].status===503&&privacy.attempts.slice(1).every(x=>x.error==='TypeError'),privacy.attempts);
  check('private probes and offline account-write attempt never change CacheStorage',JSON.stringify(privacy.before)===JSON.stringify(privacy.after)&&privacy.after.every(x=>!x.startsWith('/api/')&&!x.includes('?')&&x!=='/config.json'));
 }
 check('all offline actions send no server requests',result.serverRequests.length===before);
 result.offline.moduleFailures=result.offline.requestFailures.filter(x=>['script','stylesheet'].includes(x.resourceType)&&/\.(mjs|css)$/.test(x.path));
 check('offline startup has no module/CSS request failures',result.offline.moduleFailures.length===0,result.offline.moduleFailures);
 check('offline page has no uncaught JavaScript error',result.offline.errors.length===0,result.offline.errors);
 result.status=result.checks.every(x=>x.pass)?'PASS_CACHE_ONLY_OFFLINE_STARTUP':'FAIL_CACHE_ONLY_OFFLINE_STARTUP';
}catch(e){result.status='RUNNER_OR_ASSERTION_ERROR';result.runnerError={name:e.name,message:e.message};
 if(diagnosticPage){result.diagnostic={url:diagnosticPage.url(),body:await diagnosticPage.locator('body').innerText({timeout:3000}).catch(()=>null)};await diagnosticPage.screenshot({path:path.join(dest,'diagnostic.png'),fullPage:true,timeout:5000}).catch(()=>{});}
}
finally{
 if(context)await context.close();if(browser)await browser.close();await new Promise(r=>server.close(r));
 await fs.writeFile(path.join(dest,'RESULT.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({variant,status:result.status,failed:result.checks.filter(x=>!x.pass).map(x=>x.name),runnerError:result.runnerError,out:dest}));
}
process.exitCode=result.status==='PASS_CACHE_ONLY_OFFLINE_STARTUP'?0:result.status==='RUNNER_OR_ASSERTION_ERROR'?2:1;
