// Reuse accepted browser oracles, with new output directories and navigation readiness.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const selection=process.argv[2];
const entries={message:['message-intent-browser.mjs','message-intent-20261005'],partner:['partner-status-browser.mjs','partner-status-20261005']};
if(!entries[selection])throw Error('Choose message or partner');
const [name,folder]=entries[selection],file=new URL(name,import.meta.url);
const original=await fs.readFile(file,'utf8');
await fs.mkdir('artifacts/market-readiness-20261007',{recursive:true});
await fs.writeFile(`artifacts/market-readiness-20261007/${selection}-oracle.json`,JSON.stringify({source:file.pathname,sha256:createHash('sha256').update(original).digest('hex'),changes:'New artifact destination, DOMContentLoaded navigation; message loss targets a read started after the tested write; assertions unchanged'},null,2));
let source=original.replaceAll('artifacts/'+folder,'artifacts/market-readiness-20261007/'+selection)
 .replace("p.goto(base+'/real-journey.html')","p.goto(base+'/real-journey.html',{waitUntil:'domcontentloaded',timeout:20000})")
 .replace(/from '([^']+)'/g,(_,spec)=>`from '${spec.startsWith('.')?new URL(spec,file).href:import.meta.resolve(spec)}'`);
if(selection==='message') {
 source=source.replace('let fail=null,held=null;', 'let fail=null,held=null,readBefore=Infinity; const injectionTrace=[]; report.injectionTrace=injectionTrace;');
 source=source.replace('fail=phase;await send(text);', 'fail=phase;readBefore=before;await send(text);');
 source=source.replace('const response=await db.fetchFor(actor)', "const targetRead=fail==='read'&&db.messages.length>readBefore; const response=await db.fetchFor(actor)");
 source=source.replace("fail==='read'&&method==='GET'", "fail==='read'&&targetRead&&method==='GET'");
 source=source.replace("fail=null;await route.fulfill({status:503", "injectionTrace.push({phase:fail,method,path:url.pathname,messages:db.messages.length,busy:await p.evaluate(()=>document.body.dataset.realBusy||null)});fail=null;await route.fulfill({status:503");
}
try { await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')); }
catch(error) { console.error(JSON.stringify({status:'REGRESSION_FAILED',error:error.message})); process.exitCode=1; }
