// Task 66: local real UI recording only. No UI edits, provider, login or publish.
// Default is bounded preparation. Capture requires an independently accepted source manifest.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts/design-20261003/video');
const viewport={width:390,height:844};
const sourceNames=['studio.html','studio.mjs','studio.css','studio-install.mjs','session-value.mjs',
  'group-logistics.mjs','archive-codec.mjs','declared-fit.mjs','triangle.html','triangle.mjs','triangle.css',
  'triangle-room.mjs','explore-planner.mjs','summit.css','atelier.css','atelier.mjs','assets.mjs','config.mjs','server.mjs'];
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const index=value.indexOf('=');return index<0?[value,true]:[value.slice(0,index),value.slice(index+1)];}));
for(const key of Object.keys(args))if(!['--prepare','--capture','--mode','--accepted-source'].includes(key))throw Error('Unknown argument '+key);
const digest=data=>createHash('sha256').update(data).digest('hex');
const json=async file=>JSON.parse(await fs.readFile(file,'utf8'));
async function sourceHashes(){
  const values={};
  for(const name of sourceNames)values['web_launch/'+name]=digest(await fs.readFile(path.join(root,'web_launch',name)));
  return values;
}
function checked(command,parameters){
  const result=spawnSync(command,parameters,{cwd:root,encoding:'utf8',maxBuffer:6*1024*1024});
  assert.equal(result.status,0,(result.stderr||result.error?.message||'Command failed').slice(-3000));
  return result.stdout;
}
await fs.mkdir(out,{recursive:true});

if(!args['--capture']){
  const auditPath=path.join(root,'artifacts/design-20261003/audit/MANIFEST.json');
  const audit=await json(auditPath);
  const sources=['04-studio-fit.png','05-studio-fit-result.png','06-studio-session.png','07-studio-result.png','08-studio-memory.png','11-atlas-map.png'];
  const frames=[];
  for(const name of sources){
    const entry=audit.entries.find(item=>item.file===name);assert.ok(entry,'Missing audit source '+name);
    const file=path.join(path.dirname(auditPath),name);assert.equal(digest(await fs.readFile(file)),entry.sha256);
    frames.push({file,sha256:entry.sha256});
  }
  const ffmpeg=checked('ffmpeg',['-version']).split('\n')[0];
  const ffprobe=checked('ffprobe',['-version']).split('\n')[0];
  await fs.writeFile(path.join(out,'SOURCE_TO_ACCEPT.json'),JSON.stringify({schema:'synera.recording-source.v1',status:'DRAFT_VARIANT_PENDING',source:await sourceHashes(),scope:'Parent must verify UI/source and change status to LOCAL_UI_ACCEPTED after acceptance, never merely because this template exists.'},null,2));
  const receipt={status:'READY_TO_CAPTURE_WITH_VARIANT_PENDING',date:'2026-10-03',viewport,script:'tools/design-recording-20261003.mjs',
    script_sha256:digest(await fs.readFile(fileURLToPath(import.meta.url))),audit_manifest_sha256:digest(await fs.readFile(auditPath)),
    storyboard_frames:frames,tools:{ffmpeg,ffprobe},capture_started:false,provider_calls:0,usd:0,
    limits:['Atelier source/browser acceptance required before recording.','Only local synthetic data; no account or production meeting.','No voice, live Maps SDK, independent-person proof or social posting.','Human video review remains required after technical QA.']};
  await fs.writeFile(path.join(out,'PREPARATION.json'),JSON.stringify(receipt,null,2));
  console.log(JSON.stringify({status:receipt.status,source_frames:frames.length,capture_started:false,provider_calls:0}));
  process.exit(0);
}

// The parent acceptance authority writes this after actual UI/source checks.
// This is a source binding, not a signature, provider receipt or human artistic acceptance.
assert.ok(args['--accepted-source'],'Capture requires --accepted-source=<accepted JSON manifest>');
const acceptancePath=path.resolve(root,args['--accepted-source']);
assert.ok(acceptancePath.startsWith(path.join(root,'artifacts')+path.sep),'Readiness manifest must be inside product artifacts');
const accepted=await json(acceptancePath),before=await sourceHashes();
assert.equal(accepted.schema,'synera.recording-source.v1');
assert.equal(accepted.status,'LOCAL_UI_ACCEPTED');
assert.deepEqual(accepted.source,before,'UI changed since the parent accepted this source');
const mode=args['--mode']||'both';assert.ok(['current','atelier','both'].includes(mode));
const modes=mode==='both'?['current','atelier']:[mode];
const runPath=path.join(out,new Date().toISOString().replace(/[:.]/g,'-'));
await fs.mkdir(runPath,{recursive:false});
const server=spawn(process.execPath,[path.join(root,'web_launch/server.mjs'),'--demo'],{cwd:root,env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});
let browser;
const results=[];
try{
  const base=await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error('Local server timeout: '+output)),12000);
    server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0]);}});
    server.stderr.on('data',chunk=>{output+=chunk;});server.on('exit',code=>{clearTimeout(timer);reject(Error('Local server exit '+code));});
  });
  browser=await chromium.launch({headless:true});
  for(const variant of modes){
    const directory=path.join(runPath,variant);await fs.mkdir(directory,{recursive:false});
    const context=await browser.newContext({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:1,serviceWorkers:'block',recordVideo:{dir:directory,size:viewport}});
    const page=await context.newPage(),video=page.video(),actions=[],errors=[],external=[],framing=[];
    const started=Date.now();
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(!request.url().startsWith(base+'/'))external.push(request.url());});
    const pause=ms=>page.waitForTimeout(ms);
    const mark=(chapter,detail)=>actions.push({at_s:Number(((Date.now()-started)/1000).toFixed(3)),chapter,detail});
    const show=async(selector)=>{
      const target=page.locator(selector);await target.waitFor({state:'visible'});
      await target.evaluate(element=>element.scrollIntoView({behavior:'smooth',block:'center'}));await pause(750);
      return target;
    };
    const tap=async(selector)=>{const target=await show(selector);await target.tap();await pause(800);};
    const type=async(selector,text)=>{const target=await show(selector);await target.tap();await target.fill('');await target.pressSequentially(text,{delay:30});await pause(450);};
    const frame=async(name)=>{await page.screenshot({path:path.join(directory,name+'.png'),fullPage:false});};
    const measureFraming=selector=>page.locator(selector).evaluate(element=>{
      const box=element.getBoundingClientRect(),hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
      return {selector:element.id||element.tagName,top:box.top,bottom:box.bottom,width:box.width,
        fits:box.top>=0&&box.bottom<=innerHeight&&box.left>=0&&box.right<=innerWidth&&element.contains(hit)};
    });
    const framed=async(selector,oversizedParent)=>{
      await show(selector);const target=await measureFraming(selector);
      assert.equal(target.fits,true,'Recording subject must fit visibly in the viewport: '+selector);
      const negative=await measureFraming(oversizedParent);
      assert.equal(negative.fits,false,'Framing guard must reject the oversized parent');
      framing.push({target,negative_control:negative,pass:true});
    };
    try{
      await page.goto(base+'/studio.html',{waitUntil:'networkidle'});await page.locator('#fit-form').waitFor();await pause(2000);
      if(variant==='atelier'){
        const controls=page.locator('[data-atelier-controls]');await controls.waitFor();
        if(await controls.evaluate(element=>element.tagName==='DETAILS')){await controls.locator('summary').tap();await pause(700);}
        await controls.getByRole('button',{name:'Atelier 2026',exact:true}).tap();await pause(1000);
        assert.equal(await page.locator('html').getAttribute('data-synera-atelier'),'on');
        if(await controls.evaluate(element=>element.tagName==='DETAILS'))await controls.locator('summary').tap();
      }else assert.equal(await page.locator('html').getAttribute('data-synera-atelier'),null);
      mark('Opening',variant==='atelier'?'Visible Atelier switch, no AI control':'Current visual mode in the accepted local build');
      await page.evaluate(()=>scrollTo({top:0,behavior:'smooth'}));await pause(2000);await frame('01-opening');

      await tap('#fit-consent');await tap('#fit-public');await tap('#fit-form button[type=submit]');
      await page.locator('#fit-results article').filter({hasText:'Mara'}).waitFor();
      await framed('#fit-results article:first-child','#fit-results');await pause(2500);mark('Give / Take','Fictional Mara; local consent and separate visibility selection');await frame('02-give-take');

      await tap('[data-step=session]');await type('#session-goal','Демо: перевірити шлях взаємної користі');
      await (await show('#participant-count')).selectOption('2');await pause(700);
      await type('#participant-a','Демо · автор');await type('#participant-b','Демо · партнер');
      await tap('#session-local');await tap('#session-setup button[type=submit]');
      await page.locator('#session-work:not([hidden])').waitFor();
      await type('#note-text','Демонстрація: перевірили локальний Give / Take.');await tap('#note-form button[type=submit]');
      await show('#session-notes');await pause(2000);mark('Local session','Two typed labels on this device; not independent people');await frame('03-local-session');

      await type('#logistics-place','Zürich HB · демонстраційна пропозиція');
      await tap('#logistics-form button[type=submit]');await page.locator('#logistics-votes .member-action').first().waitFor();
      await show('#logistics-votes');await pause(1400);
      const votes=page.locator('#logistics-votes .member-action');
      await votes.nth(0).getByRole('button',{name:'Так',exact:true}).tap();await pause(1000);
      await votes.nth(1).getByRole('button',{name:'Так',exact:true}).tap();await pause(1200);
      mark('Proposal / replies','Two local yes clicks; no real booking, invitation or payment');await frame('04-local-proposal');

      await tap('[data-step=value]');await show('#make-social');assert.equal(await page.locator('#make-social').isDisabled(),true);await pause(1600);
      await type('#outcome-facts','У цій демонстрації перевірили локальний пошук взаємної користі та дві відповіді на пропозицію.');
      await tap('#outcome-form button[type=submit]');await tap('[data-confirm=a]');
      assert.equal(await page.locator('#make-social').isDisabled(),true);await tap('[data-confirm=b]');
      assert.equal(await page.locator('#make-social').isEnabled(),true);await tap('#make-social');
      await show('#social-preview');assert.match(await page.locator('#social-preview').innerText(),/демонстрації/);await pause(2800);
      mark('Local confirmations / draft','Current result confirmed twice locally; private text only, no LinkedIn API');await frame('05-private-social-draft');

      await tap('[data-step=memory]');const downloadPromise=page.waitForEvent('download');await tap('#export-session');
      const download=await downloadPromise;await download.saveAs(path.join(directory,'local-demo-session.json'));
      const envelope=await json(path.join(directory,'local-demo-session.json'));assert.equal(envelope.encoding,'gzip-base64');
      await show('#archive-stats');await pause(2200);mark('Archive','Real local file download; GZIP is not encryption');await frame('06-archive');
      await type('#quote-query','Демонстрація');await tap('#quote-form button[type=submit]');
      await show('#quote-results');assert.match(await page.locator('#quote-results').innerText(),/session\.notes/);await pause(2000);

      // An actual existing link, followed by the actual Atlas mode button.
      await tap('header a[href="/triangle.html"]');await page.locator('#room-setup').waitFor();
      await page.getByRole('button',{name:/Жива карта/}).tap();await pause(1000);
      await framed('#opportunity-map','#pane-atlas');await pause(2400);mark('Atlas','Schematic fictional opportunity map; not Google SDK or live people');await frame('07-atlas');
      assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
      await fs.writeFile(path.join(directory,'actions.json'),JSON.stringify(actions,null,2));
      await context.close();
      const raw=await video.path();
      const rawProbe=JSON.parse(checked('ffprobe',['-v','error','-show_streams','-show_format','-of','json',raw]));
      const stream=rawProbe.streams.find(item=>item.codec_type==='video');assert.equal(stream.width,viewport.width);assert.equal(stream.height,viewport.height);
      const mp4=path.join(directory,'synera-'+variant+'.mp4');
      checked('ffmpeg',['-nostdin','-n','-v','error','-i',raw,'-an','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-r','25','-fps_mode','cfr','-movflags','+faststart',mp4]);
      checked('ffmpeg',['-nostdin','-v','error','-i',mp4,'-f','null','-']);
      const probe=JSON.parse(checked('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',mp4]));
      const exported=probe.streams.find(item=>item.codec_type==='video');assert.equal(exported.width,390);assert.equal(exported.height,844);
      assert.ok(Number(probe.format.duration)>30,'Unexpectedly short recording');assert.equal(probe.streams.filter(item=>item.codec_type==='audio').length,0);
      const frameDirectory=path.join(directory,'decoded-frames');await fs.mkdir(frameDirectory,{recursive:false});
      const sampled=[];
      for(let index=0;index<actions.length;index++){
        const action=actions[index],time=Math.min(action.at_s,Number(probe.format.duration)-0.5);
        const file=path.join(frameDirectory,String(index+1).padStart(2,'0')+'.png');
        checked('ffmpeg',['-nostdin','-n','-v','error','-ss',String(time),'-i',mp4,'-frames:v','1',file]);sampled.push({file,time_s:time,chapter:action.chapter});
      }
      const result={variant,mp4,raw,mp4_sha256:digest(await fs.readFile(mp4)),duration_s:Number(probe.format.duration),width:390,height:844,
        frames:Number(exported.nb_read_frames),full_decode:'PASS',page_errors:errors,external_requests:external,actions,sampled,framing_checks:framing,
        visual_frame_review:'PENDING',human_review:'PENDING',scope:'Local real Chromium clicks, computer emulation, synthetic data; no production feature proof'};
      results.push(result);await fs.writeFile(path.join(directory,'TECHNICAL_QA.json'),JSON.stringify(result,null,2));
      console.log(JSON.stringify({variant,mp4,duration_s:result.duration_s,decode:'PASS',visual_review:'PENDING'}));
    }catch(error){
      await fs.writeFile(path.join(directory,'FAILURE.json'),JSON.stringify({error:error.message,stack:error.stack,actions,errors,external},null,2));
      await context.close().catch(()=>{});throw error;
    }
  }
  assert.deepEqual(await sourceHashes(),before,'Source drift during recording; do not accept the videos');
  await fs.writeFile(path.join(runPath,'RECORDINGS.json'),JSON.stringify({status:'TECHNICALLY_VERIFIED_VISUAL_REVIEW_PENDING',accepted_source_sha256:digest(await fs.readFile(acceptancePath)),source:before,viewport,results,provider_calls:0,usd:0,published:false},null,2));
}finally{await browser?.close();server.kill();}
