// Bounded local acceptance for the INTEGRATE lane. No install, provider, git write or deploy.
import fs from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const out='docs/integrate-20261029', hook='C:/sw/task1601-header-chrome.cjs';
const dependency='file:///C:/Users/Andrii/.codex/outputs/synera-gilbert-readiness-20261021/dependency-resolution.mjs';
await fs.mkdir(out,{recursive:true});
const files=async directory=>(await fs.readdir(directory)).filter(name=>name.endsWith('.test.mjs')).map(name=>directory+'/'+name);
const phases=[
 ['main',['--test',...await files('web_launch'),...await files('web_launch/iceberg'),...await files('neon'),'plan/v6/workflow/approval-boundary.test.mjs']],
 ['pwa-i18n',['--test',...await files('tests/pwa'),...await files('tests/i18n_ch')]],
 ['simulation',['--import',dependency,'--test','tools/simulation-server.test.mjs','tools/simulation-runner.test.mjs']],
 ['playwright',['node_modules/@playwright/test/cli.js','test','--config',out+'/playwright.config.mjs']],
 ['header',['--require',hook,'tools/header-layout-acceptance-20261013.mjs']],
 ['build',['neon/build.mjs','dist-neon-ci']],
 ['offline',['--require',hook,'tools/offline-shell-acceptance.mjs','--candidate=web_launch/dist-neon-ci','--variant=gilbert-accepted']],
 ['a11y',['--require',hook,'web_launch/a11y_audit.mjs']],
];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const snapshot=async()=>Object.fromEntries(await Promise.all(Object.keys(PUBLIC_ASSETS).map(async file=>[file,sha(await fs.readFile('web_launch/'+file))])));
const before=await snapshot(), receipt={schema:'synera.integrate.acceptance.v1',base:'a0e17ee3fdc1eb933441f0aa8a493b9f1626d8bc',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),node:process.version,startedAt:new Date().toISOString(),provider_calls:0,provider_usd:0,checks:[]};
for(const [name,args]of phases){
 const startedAt=new Date().toISOString(), child=spawn(process.execPath,args,{env:{...process.env,SYNERA_CHROMIUM_EXECUTABLE:'C:/Program Files/Google/Chrome/Application/chrome.exe'},stdio:['ignore','pipe','pipe']});
 const chunks=[];child.stdout.on('data',b=>chunks.push(b));child.stderr.on('data',b=>chunks.push(b));
 const result=await new Promise(resolve=>{child.on('error',error=>resolve({code:null,error:error.message}));child.on('exit',(code,signal)=>resolve({code,signal}));});
 const bytes=Buffer.concat(chunks), log=`accepted-${name}.log`;await fs.writeFile(out+'/'+log,bytes);
 receipt.checks.push({name,command:[process.execPath,...args],pid:child.pid,startedAt,endedAt:new Date().toISOString(),...result,log,sha256:sha(bytes)});
 await fs.writeFile(out+'/acceptance.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(`${name}: exit=${result.code}${result.signal?' signal='+result.signal:''}`);
}
const after=await snapshot();receipt.served_source_unchanged=JSON.stringify(before)===JSON.stringify(after);receipt.endedAt=new Date().toISOString();
receipt.status=receipt.checks.every(check=>check.code===0)&&receipt.served_source_unchanged?'PASS_LOCAL_WITH_STATED_LIMITS':'NEEDS_REVIEW';
await fs.writeFile(out+'/served-source-sha256.json',JSON.stringify(after,null,2)+'\n');
await fs.writeFile(out+'/acceptance.json',JSON.stringify(receipt,null,2)+'\n');
console.log(receipt.status);process.exitCode=receipt.status==='PASS_LOCAL_WITH_STATED_LIMITS'?0:1;
