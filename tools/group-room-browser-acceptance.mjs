// Real Chromium client/store/worker acceptance. Auth/Data/RPC below are local fixtures,
// so this proves browser integration only; it is not a live Neon, SQL/RLS, or deployment proof.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { handleNeon } from '../neon/worker.mjs';

const draftGuardCounterexample = process.argv.includes('--draft-guard-counterexample');
const dir = 'artifacts/network-room-20261002' + (draftGuardCounterexample ? '/draft-guard-counterexample' : '');
await fs.mkdir(dir, { recursive:true });
let counterexampleSource;
const observedChecks = {};
if (draftGuardCounterexample) {
 const source = await fs.readFile('web_launch/rooms.mjs', 'utf8');
 const guard = 'if (selected?.id !== id) clearPrivateDom();';
 assert.equal(source.split(guard).length, 2, 'The counterexample removes exactly the room-switch draft guard');
 counterexampleSource = source.replace(guard, '/* Counterexample: room-switch draft guard removed. */');
}
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333',O='44444444-4444-4444-8444-444444444444';
const ids=[A,B,C,O], origin='https://room-browser-fixture.pages.dev', email=id=>`${id.slice(0,4)}@room-fixture.example`;
const env={SYNERA_SITE_URL:origin,SYNERA_NEON_AUTH_URL:'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth',SYNERA_NEON_DATA_URL:'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1',SYNERA_PILOT_EMAILS:ids.map(email).join(','),SYNERA_PILOT_READY:'true',SYNERA_GROUP_ROOMS_READY:'true'};
const names={ [A]:'Ari', [B]:'Bea', [C]:'Cai', [O]:'Outsider' }, rooms=new Map(), revoked=new Set(); let force409=false, delayGet=null;
const state=(room,id,include=true)=>{const own=room.members.find(m=>m.user_id===id);if(!own||!['invited','accepted'].includes(own.membership_status))throw Object.assign(new Error('private'),{status:403});return {schema:'synera.group-room.v1',id:room.id,title:room.title,goal:room.goal,status:room.status,revision:room.revision,server_now:new Date().toISOString(),own_role:own.role,own_membership_status:own.membership_status,participants:room.members.map(m=>({...m,display_name:names[m.user_id]})),active_turn:room.status==='active'?{speaker_id:room.members.find(m=>m.position===room.turn)?.user_id,deadline:room.deadline}:null,transcript:include&&own.membership_status==='accepted'?room.transcript:[],last_turn_event:room.last_turn_event||null};};
const requireMember=(room,id,accepted=false)=>{const m=room.members.find(x=>x.user_id===id);if(!m||!['invited','accepted'].includes(m.membership_status)||(accepted&&m.membership_status!=='accepted'))throw Object.assign(new Error('private'),{status:403});return m;};
async function upstream(raw,init){const url=new URL(raw);if(url.pathname.endsWith('/get-session')){const id=init.headers.Cookie?.split('=')[1];if(!ids.includes(id)||revoked.has(id))return Response.json({});return Response.json({user:{id,email:email(id),emailVerified:true},session:{id:'fixture'}},{headers:{'set-auth-jwt':'a.'+id+'.c'}});}const id=init.headers.Authorization?.split('.')[1],body=init.body?JSON.parse(init.body):{};if(url.pathname.includes('/rpc/')){try{const action=url.pathname.split('/').at(-1).replace('synera_room_','');if(action==='list')return Response.json([...rooms.values()].filter(r=>r.members.some(m=>m.user_id===id&&['invited','accepted'].includes(m.membership_status))).map(r=>state(r,id,false)));const room=rooms.get(body.p_room_id);if(action==='create'){const r={id:randomUUID(),title:body.p_title,goal:body.p_goal,status:'inviting',revision:1,turn:0,deadline:null,last_turn_event:{kind:'created',created_at:new Date().toISOString()},transcript:[],members:[{user_id:id,role:'creator',membership_status:'accepted',position:0},...body.p_invitee_ids.map((user_id,position)=>({user_id,role:'member',membership_status:'invited',position:position+1}))]};rooms.set(r.id,r);return Response.json(state(r,id,false));}if(!room) return Response.json({},{status:403});if(action==='get'){if(delayGet===room.id){delayGet=null;await new Promise(resolve=>setTimeout(resolve,600));}return Response.json(state(room,id));}if(action==='accept'){const m=requireMember(room,id);if(m.membership_status!=='invited')return Response.json({},{status:403});m.membership_status='accepted';room.revision++;return Response.json(state(room,id,false));}if(action==='leave'){const m=requireMember(room,id);m.membership_status='left';room.status='paused';room.revision++;return Response.json({id:room.id,status:'left',server_now:new Date().toISOString()});}if(action==='start'){if(id!==A||body.p_expected_revision!==room.revision||!room.members.every(m=>m.membership_status==='accepted'))return Response.json({},{status:403});room.status='active';room.turn=0;room.deadline=new Date(Date.now()+60000).toISOString();room.revision++;return Response.json(state(room,id));}if(action==='message'){if(force409){force409=false;return Response.json({},{status:409});}const m=requireMember(room,id,true),speaker=room.members.find(x=>x.position===room.turn);if(room.status!=='active'||body.p_expected_revision!==room.revision||m.user_id!==speaker.user_id)return Response.json({},{status:403});room.revision++;room.transcript.push({message_id:body.p_message_id,sender_id:id,room_revision:room.revision,body:body.p_body,created_at:new Date().toISOString()});return Response.json(state(room,id));}if(action==='advance'){requireMember(room,id,true);const speaker=room.members.find(x=>x.position===room.turn);if(body.p_expected_revision!==room.revision||(id!==speaker.user_id&&Date.parse(room.deadline)>Date.now()))return Response.json({},{status:403});room.turn=(room.turn+1)%room.members.length;room.deadline=new Date(Date.now()+60000).toISOString();room.revision++;room.last_turn_event={kind:'advanced',created_at:new Date().toISOString()};return Response.json(state(room,id));}return Response.json({},{status:403});}catch(error){return Response.json({},{status:error.status||503});}}const table=url.pathname.split('/').at(-1);if(table==='pilot_consents')return Response.json([{policy_version:'2026-09-05-pilot-3'}]);if(table==='profiles'){const filter=url.searchParams.get('id')||'';const target=filter.startsWith('eq.')?filter.slice(3):null;return Response.json(target?[{id:target,display_name:names[target]||'',city:'Zürich',offers:'',seeks:'',is_discoverable:true}]:ids.filter(x=>x!==id).map(x=>({id:x,display_name:names[x],city:'Zürich',offers:'',seeks:'',is_discoverable:true})));}return Response.json([]);}
const server=spawn(process.execPath,['web_launch/server.mjs','--demo'],{cwd:process.cwd(),env:{...process.env,SYNERA_PORT:'0'},stdio:['ignore','pipe','pipe']});const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error(out)),10000);server.stdout.on('data',c=>{out+=c;const m=out.match(/http:\/\/127\.0\.0\.1:\d+/);if(m){clearTimeout(timer);resolve(m[0]);}});});
const browser=await chromium.launch({headless:true});const errors=[],requests=[];async function pageFor(id){const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));if(draftGuardCounterexample)await page.route('**/rooms.mjs',route=>route.fulfill({body:counterexampleSource,contentType:'application/javascript'}));await page.route('**/config.json',route=>route.fulfill({json:{backend:'neon',pilotSafetyEnabled:true,realPilotEnabled:true,groupRoomsEnabled:true}}));await page.route('**/api/neon/**',async route=>{const req=route.request(),url=new URL(req.url()),headers=new Headers(req.headers());headers.set('Origin',origin);headers.set('X-Synera-Client','1');headers.set('Cookie','__Host-synera-session='+id);const response=await handleNeon(new Request(origin+url.pathname+url.search,{method:req.method(),headers,...(req.method()==='GET'?{}:{body:req.postData()})}),env,upstream);requests.push({id,path:url.pathname,status:response.status});await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});});await page.goto(base+'/rooms.html');await page.waitForTimeout(250);if(await page.locator('#rooms-blocked:not([hidden])').count())throw Error('Rooms bootstrap blocked: '+await page.locator('#rooms-blocked').innerText());await page.locator('#rooms-index .rooms-empty').waitFor({timeout:10000});return page;}
async function refresh(page){const completion=page.waitForResponse(r=>r.url().includes('/api/neon/rooms/')&&r.url().endsWith('/get'));await page.getByRole('button',{name:'Оновити'}).click();await completion;await page.waitForTimeout(60);}
async function selected(page,title){await page.getByRole('button',{name:title,exact:false}).click();await page.locator('#room-title').filter({hasText:title}).waitFor();}
try {
 const a=await pageFor(A),b=await pageFor(B),c=await pageFor(C),o=await pageFor(O);
 assert.match(await o.locator('#rooms-index').innerText(),/Поки немає/);
 await a.locator('[name=title]').fill('One concrete room');await a.locator('[name=goal]').fill('Agree the next validated step');
 await a.locator('input[name=invitee]').evaluateAll((nodes,values)=>nodes.filter(n=>values.includes(n.value)).forEach(n=>n.click()),[B,C]);
 await a.getByRole('button',{name:'Надіслати запрошення'}).click();await a.locator('#room-title').filter({hasText:'One concrete room'}).waitFor();
 for(const page of [b,c]){
  const loaded=page.waitForResponse(r=>r.url().endsWith('/rooms/list'));await page.getByRole('button',{name:'Оновити'}).click();await loaded;
  await selected(page,'One concrete room');assert.match(await page.locator('#room-goal').innerText(),/Agree/);
  assert.match(await page.locator('#room-messages').innerText(),/лише після/);
  await page.getByRole('button',{name:'Прийняти запрошення'}).click();await page.waitForTimeout(80);
 }
 await refresh(a);await a.getByRole('button',{name:'Почати чергу'}).click();await a.waitForFunction(()=>!document.querySelector('#room-message').disabled);
 await a.locator('#room-message').fill('First explicit text');await a.getByRole('button',{name:'Надіслати',exact:true}).click();await a.locator('#room-messages').filter({hasText:'First explicit text'}).waitFor();
 await refresh(b);assert.equal(await b.locator('#room-send').isDisabled(),true);
 const active=[...rooms.values()][0];
 const denied=await b.evaluate(async room=>{const r=await fetch('/api/neon/rooms/'+room.id+'/message',{method:'POST',headers:{'Content-Type':'application/json','X-Synera-Client':'1'},body:JSON.stringify({expected_revision:room.revision,message_id:crypto.randomUUID(),body:'not my turn'})});return r.status;},active);
 assert.equal(denied,403);
 active.deadline=new Date(Date.now()-1000).toISOString();await refresh(c);await c.waitForFunction(()=>!document.querySelector('#room-pass').disabled);
 await c.getByRole('button',{name:'Передати слово'}).click();await c.waitForTimeout(80);assert.equal(active.turn,1);
 await refresh(b);await b.waitForFunction(()=>!document.querySelector('#room-message').disabled);
 force409=true;await b.locator('#room-message').fill('draft survives conflict');await b.getByRole('button',{name:'Надіслати',exact:true}).click();
 await b.locator('#rooms-status').filter({hasText:'Стан кімнати змінився'}).waitFor();assert.equal(await b.locator('#room-message').inputValue(),'draft survives conflict');
 await selected(b,'One concrete room');assert.equal(await b.locator('#room-message').inputValue(),'draft survives conflict','Reselecting the same room preserves its draft');
 observedChecks.same_room_409_and_reselection_preserve_draft = true;
 // Add a second permitted invitation. Delay the old get while selecting this NEW room.
 const second={...active,id:randomUUID(),title:'Second independent room',status:'inviting',revision:1,deadline:null,transcript:[],members:active.members.map(m=>({...m,membership_status:m.role==='creator'?'accepted':'invited'}))};rooms.set(second.id,second);
 delayGet=active.id;const oldStarted=b.waitForRequest(r=>r.url().endsWith('/'+active.id+'/get'));await b.getByRole('button',{name:'Оновити'}).click();await oldStarted;
 await selected(b,'Second independent room');await b.waitForTimeout(750);assert.equal(await b.locator('#room-title').innerText(),'Second independent room');assert.equal(await b.locator('#room-message').inputValue(),'','Selecting a different room clears the previous draft');
 observedChecks.room_switch_clears_draft_and_ignores_old_response = true;
 await selected(b,'One concrete room');assert.equal(await b.locator('#room-message').inputValue(),'','Returning to the previous room does not restore a discarded draft');await refresh(b);await b.getByRole('button',{name:'Вийти з кімнати'}).click();await b.locator('#rooms-detail').waitFor({state:'hidden'});assert.equal(active.status,'paused');assert.equal(await b.locator('#room-messages').innerText(),'');
 observedChecks.return_does_not_restore_draft_and_leave_clears_access = true;
 await refresh(a);const audit=await new AxeBuilder({page:a}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations,[]);
 observedChecks.axe_violations = audit.violations.length;
 const layout=await a.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,overflowing:[...document.querySelectorAll('body *')].map(el=>({selector:el.id?'#'+el.id:el.tagName.toLowerCase()+'.'+[...el.classList].join('.'),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(el=>el.left<0||el.right>innerWidth)}));
 observedChecks.layout = layout;
 await a.screenshot({path:dir+'/room-mobile.png',fullPage:true});
 const storage=await a.evaluate(async()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage),caches:await caches.keys(),databases:await indexedDB.databases()}));assert.deepEqual(storage,{local:[],session:[],caches:[],databases:[]});
 observedChecks.browser_storage = storage;
 revoked.add(A);await a.getByRole('button',{name:'Оновити'}).click();await a.locator('#rooms-auth:not([hidden])').waitFor();assert.equal(await a.locator('#room-messages').innerText(),'');assert.equal(await a.locator('#room-message').inputValue(),'');
 observedChecks.session_401_clears_private_dom = true;
 assert.deepEqual(errors,[]);
 observedChecks.page_errors = errors;
 await fs.writeFile(dir+'/OBSERVATIONS.json',JSON.stringify({scope:'Local Chromium fixtures only; individual checks do not establish full acceptance',checks:observedChecks},null,2));
 assert.ok(layout.documentWidth<=layout.viewport,`Mobile horizontal overflow: ${JSON.stringify(layout)}`);
 const receipt={status:'PASS',scope:'Real Chromium at 390x844 through handleNeon with local Auth/Data/RPC fixtures; not SQL/RLS, live Neon, deploy or physical Android proof',checks:['create','visible-goal explicit accept','invited transcript hidden','all accepted start','text','out-of-turn request denial','expired deadline accepted-member advance','409 draft preserved','same-room reselection preserves draft','different room clears previous draft','returning does not restore discarded draft','401 clears private transcript DOM','old room response cannot overwrite new selection','explicit leave pauses room and clears own access','mobile no overflow','axe WCAG2AA zero violations','no browser storage/cache/private database'],requests:requests.length,provider_calls:0};
 await fs.writeFile(dir+'/ACCEPTANCE.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
} catch(error){await fs.writeFile(dir+'/FAILURE.json',JSON.stringify({error:error.message,stack:error.stack,observed_checks:observedChecks,errors,requests},null,2));throw error;} finally {await browser.close();server.kill();}
