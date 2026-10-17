// Real Chromium + the real client/store/worker, two isolated sessions and
// browser-emulated GPS. Auth/Data API/KV are local fixtures; RLS is checked by
// location-sql-acceptance.mjs separately. This is not live Neon or Android proof.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { handleNeon } from '../neon/worker.mjs';
import { createLocationGrant } from '../web_launch/live-location.mjs';
import AxeBuilder from '@axe-core/playwright';

const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const meeting = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sender_id: A, recipient_id: B, sender_name: 'Acceptance A', recipient_name: 'Acceptance B', note: 'Review one offer', status: 'accepted', proposed_at: new Date(Date.now()+300000).toISOString(), duration_minutes: 30, meeting_place: 'Zürich', meeting_address: '' };
const grants = new Map(), intents = new Map(), values = new Map(); let samples = 0;
const kv = { async get(key) { return values.get(key) ?? null; }, async put(key, data) { values.set(key, JSON.parse(data)); samples++; }, async delete(key) { values.delete(key); } };
const origin = 'https://synera-fixture.pages.dev';
const env = { SYNERA_SITE_URL: origin, SYNERA_NEON_AUTH_URL: 'https://ep-fixture.neonauth.us-east-2.aws.neon.tech/neondb/auth', SYNERA_NEON_DATA_URL: 'https://ep-fixture.apirest.us-east-2.aws.neon.tech/neondb/rest/v1', SYNERA_PILOT_READY: 'true', SYNERA_REGISTRATION_ENABLED: 'true', SYNERA_LOCATION_READY: 'true', SYNERA_LOCATION_EPHEMERAL: kv, SYNERA_PILOT_EMAILS: 'a@synera-acceptance.example,b@synera-acceptance.example' };
const profile = id => ({ id, display_name: id === A ? 'Acceptance A' : 'Acceptance B', city: 'Zürich', offers: 'Design', seeks: 'Sales', is_discoverable: true, map_visible: false, brief: { version: 1, goal: 'Review one offer', offer_tags: ['design'], need_tags: ['sales'], languages: ['en'], modes: ['exchange'], available_from: '2026-10-02', available_until: '2026-10-16', city_code: 'zurich', max_km: 25, remote: true, confidentiality: false, accepts_confidentiality: false } });
const active = g => g?.status === 'active' && Date.parse(g.closes_at)>Date.now() ? g : null;
async function upstream(rawUrl, init) {
  const url = new URL(rawUrl);
  if (url.pathname.endsWith('/get-session')) {
    const id = init.headers.Cookie?.split('=')[1];
    return Response.json({ user: { id, email: (id===A?'a':'b')+'@synera-acceptance.example', emailVerified: true }, session: { id: 'fixture' } }, { headers: { 'Set-Auth-Jwt': 'a.'+id+'.c' } });
  }
  const id = init.headers.Authorization.split('.')[1], body = init.body ? JSON.parse(init.body) : {};
  if (url.pathname.includes('/rpc/')) {
    const action = url.pathname.split('/').at(-1);
    if (action === 'synera_location_access') return Response.json({ eligible: meeting.status==='accepted', own: active(grants.get(id)), peer: active(grants.get(id===A?B:A)), meeting:{id:meeting.id,status:meeting.status,meeting_address:meeting.meeting_address,meeting_place:meeting.meeting_place,proposed_at:meeting.proposed_at,duration_minutes:meeting.duration_minutes}, server_now: new Date().toISOString() });
    if (action === 'synera_location_grant') {
      const existing = intents.get(body.p_intent_id);
      if (existing) return existing.status === 'active' ? Response.json(existing) : Response.json({}, { status: 403 });
      const grant = { ...createLocationGrant({ meeting, grantorId: id, precision: body.p_precision, leadMinutes: body.p_lead_minutes, consent: body.p_consent, now: new Date().toISOString() }), id: randomUUID(), sample_seq: 0 };
      grants.set(id, grant); intents.set(body.p_intent_id, grant); return Response.json(grant);
    }
    if (action === 'synera_location_sample') { const grant=active(grants.get(id)); if (!grant) return Response.json({}, { status: 403 }); grant.sample_seq++; return Response.json({ grant, server_now: new Date().toISOString() }); }
    if (action === 'synera_location_revoke') { const grant=grants.get(id); if (grant) grant.status='revoked'; return Response.json(grant ?? null); }
    throw new Error('Unexpected RPC '+action);
  }
  const table = url.pathname.split('/').at(-1);
  if (table === 'pilot_consents') return Response.json([{ user_id: id, policy_version: '2026-09-05-pilot-3' }]);
  if (table === 'profiles') return Response.json([profile(url.searchParams.get('id')?.startsWith('eq.') ? id : id===A?B:A)]);
  if (table === 'meeting_requests') {
    if (init.method==='PATCH') { Object.assign(meeting,body); for (const grant of grants.values()) grant.status='revoked'; }
    return Response.json([{ ...meeting }]);
  }
  return Response.json([]);
}
const server = spawn(process.execPath, ['web_launch/server.mjs','--demo'], { cwd: process.cwd(), env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
const base = await new Promise((resolve,reject) => { let log=''; const timer=setTimeout(()=>reject(new Error(log)),15000); server.stdout.on('data', chunk=>{log+=chunk; const m=log.match(/http:\/\/127\.0\.0\.1:\d+/); if(m){clearTimeout(timer);resolve(m[0]);}}); server.stderr.on('data', chunk=>{log+=chunk;}); });
const browser = await chromium.launch(); const errors = [], requests = [], pages = [];
async function pageFor(id) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', permissions: ['geolocation'], geolocation: { latitude: 47.37691, longitude: 8.54172, accuracy: 12 } });
  await context.addInitScript(() => { localStorage.setItem('synera.first-user-tour.v1','done'); window.__gpsStarts=0; window.__gpsStops=0;
    const watch=navigator.geolocation.watchPosition.bind(navigator.geolocation), clear=navigator.geolocation.clearWatch.bind(navigator.geolocation);
    navigator.geolocation.watchPosition=(...args)=>{window.__gpsStarts++;return watch(...args);}; navigator.geolocation.clearWatch=(...args)=>{window.__gpsStops++;return clear(...args);}; });
  const page = await context.newPage(); page.on('pageerror', error=>errors.push(error.message));
  pages.push(page);
  await page.route('**/config.json', route=>route.fulfill({ json: { backend:'neon',pilotSafetyEnabled:true,realPilotEnabled:true,registrationEnabled:true,liveLocationEnabled:true,publicSiteUrl:origin } }));
  await page.route(base+'/', async route=>{ const response=await route.fetch(); await route.fulfill({ response, headers: { ...response.headers(), 'permissions-policy':'camera=(), microphone=(), geolocation=(self)' } }); });
  await page.route('**/api/neon/**', async route=>{
    const req=route.request(), url=new URL(req.url());
    const headers=new Headers(req.headers()); headers.set('Origin',origin); headers.set('X-Synera-Client','1'); headers.set('Cookie','__Host-synera-session='+id);
    const response=await handleNeon(new Request(origin+url.pathname+url.search, { method:req.method(), headers, ...(req.method()==='GET'?{}:{body:req.postData()}) }),env,upstream);
    requests.push({ path:url.pathname, status:response.status });
    await route.fulfill({ status:response.status,headers:Object.fromEntries(response.headers),body:await response.text() });
  });
  await page.goto(base+'/');
  try { await page.locator('#workspace:not([hidden])').waitFor({timeout:10000}); } catch(error) {
    await fs.writeFile('artifacts/location-browser-failure.json',JSON.stringify({errors,requests,text:await page.locator('body').innerText()},null,2));
    throw error;
  }
  await page.locator('[data-tab="meetings"]').click(); await page.locator('.meeting-location summary').click();
  return page;
}
const wait = async predicate=>{const deadline=Date.now()+10000;while(!predicate()){if(Date.now()>deadline)throw new Error('Fixture condition timed out');await new Promise(r=>setTimeout(r,50));}};
try {
  const a=await pageFor(A), b=await pageFor(B);
  assert.equal(await a.evaluate(()=>window.__gpsStarts),0); assert.equal(await b.evaluate(()=>window.__gpsStarts),0);
  const address='Bahnhofplatz 15, Zürich'; await a.locator('[name="meeting-address"]').fill(address); await a.getByRole('button',{name:'Зберегти адресу',exact:true}).click();
  await wait(()=>meeting.meeting_address===address);
  await a.locator('.meeting-location a[href*="/maps/dir/"]').first().waitFor();
  await a.waitForFunction(expected=>new URL(document.querySelector('.meeting-location a[href*="/maps/dir/"]').href).searchParams.get('destination')===expected,address);
  const destination=new URL(await a.locator('.meeting-location a[href*="/maps/dir/"]').first().getAttribute('href')).searchParams.get('destination'); assert.equal(destination,address);
  const grantButton=a.getByRole('button',{name:'Дозволити на час зустрічі',exact:true}); assert.equal(await grantButton.isEnabled(),false);
  await a.locator('[name="location-consent"]').check(); await grantButton.click(); await wait(()=>samples>=1);
  await b.getByRole('button',{name:'Оновити локацію',exact:true}).click();
  const peerLink=b.getByRole('link',{name:'Пішки до співрозмовника в Google Maps ↗',exact:true}); await peerLink.waitFor();
  assert.equal(new URL(await b.locator('.meeting-location a[href*="/maps/dir/"]').first().getAttribute('href')).searchParams.get('destination'),address,'peer must receive the saved meeting address with the refreshed state');
  const point=new URL(await peerLink.getAttribute('href')).searchParams.get('destination').split(',').map(Number);
  assert.ok(Math.abs(point[0]-47.375)<1e-8); assert.ok(Math.abs(point[1]-8.54)<1e-8); assert.equal(await b.evaluate(()=>window.__gpsStarts),0);
  assert.ok(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const accessibility=await new AxeBuilder({page:b}).include('.meeting-location').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(accessibility.violations.filter(v=>['critical','serious'].includes(v.impact)),[]);
  await b.screenshot({ path:'artifacts/location-mobile-20261002.png',fullPage:true });
  await a.getByRole('button',{name:'Відкликати дозвіл',exact:true}).click(); await wait(()=>grants.get(A).status==='revoked');
  await b.getByRole('button',{name:'Оновити локацію',exact:true}).click(); await peerLink.waitFor({state:'detached'});
  assert.ok(await a.evaluate(()=>window.__gpsStops)>=1);
  await a.locator('[name="location-consent"]').check(); await a.getByRole('button',{name:'Дозволити на час зустрічі',exact:true}).click(); await wait(()=>samples>=2);
  await a.getByRole('button',{name:'Скасувати зустріч',exact:true}).click(); await wait(()=>meeting.status==='cancelled');
  await a.locator('.meeting-location').waitFor({state:'detached'}); assert.ok(await a.evaluate(()=>window.__gpsStops)>=2);
  await b.getByRole('button',{name:'Оновити локацію',exact:true}).click(); await b.locator('.meeting-location').waitFor({state:'detached'});
  assert.equal(await b.locator('#meetings h3').innerText(),'Скасовано');
  assert.deepEqual(errors,[]);
  const receipt={pass:true,scope:'Real Chromium at 390px; real client/store/worker; simulated two-account Auth/Data API/KV and browser GPS; not physical Android or live providers',checks:['no capture before consent','saved address reaches Google Maps','remote address sync','coarsening before peer display','independent sharing','revocation hides peer link','cancellation stops GPS','remote cancellation sync','no mobile overflow','no page errors','no critical or serious WCAG violations in location UI'],provider_calls:0};
  await fs.writeFile('artifacts/location-browser-20261002.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
} catch(error) {
  await fs.writeFile('artifacts/location-browser-failure.json',JSON.stringify({error:error.message,errors,requests,samples,grants:[...grants.values()],pages:await Promise.all(pages.map(async p=>({text:await p.locator('body').innerText(),gps:await p.evaluate(()=>({starts:window.__gpsStarts,stops:window.__gpsStops,hidden:document.hidden}))})))},null,2));
  throw error;
} finally { await browser.close(); server.kill(); }
