// Actual local Chromium interactions against synthetic same-origin transport.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { A, B, config, fields } from "file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/tools/fixtures/real-journey-fixture.mjs";
import { createOutcomeFixture } from "file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/tools/fixtures/case-outcome-fixture.mjs";

const baseline=true,proof="artifacts/partner-status-20261005/chat-regression/green";
const mutation=false;
const report = { status: 'NOT_ACCEPTED', generated_at: new Date().toISOString(), scope: 'Actual local Chromium 390x844 with synthetic handleNeon accounts/RPC; not signed JWT, live accounts, physical Android or production', provider_calls: 0, provider_usd: 0, checks: {} };
const server = spawn(process.execPath, ['web_launch/server.mjs', '--demo'], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
let browser;
try {
  const base = await new Promise((resolve, reject) => {
    let output = ''; const timeout = setTimeout(() => reject(Error(output || 'Local server unavailable')), 20000);
    server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]; if (url) { clearTimeout(timeout); resolve(url); } });
    server.once('exit', code => { clearTimeout(timeout); reject(Error('Local server exit ' + code)); });
  });
  browser = await chromium.launch({ headless: true, executablePath: process.env.SYNERA_CHROMIUM_EXECUTABLE || chromium.executablePath() });
  const db = createOutcomeFixture(), errors = [], external=[], messageRequests=[];let failNext=null,heldMessage=null;
  async function pageFor(id, enabled = true) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', error => errors.push(error.message));
    if (mutation) await page.route('**/real-journey.mjs', async route => {
      const source=await fs.readFile('web_launch/real-journey.mjs','utf8'),marker='if (unchanged) return;';
      assert.equal(source.split(marker).length, 2);
      await route.fulfill({ contentType: 'text/javascript', body: source.replace(marker,'/* oracle mutation: rebuild unchanged transcript */') });
    });
    await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base){external.push(url.origin);await route.abort();return;}await route.fallback();});
    await page.route('**/config.json', route => route.fulfill({ json: { ...config, caseOutcomesEnabled: enabled } }));
    await page.route('**/api/neon/**', async route => {
      const request = route.request(), url = new URL(request.url());
      if(url.pathname.endsWith('/meeting_messages')) {
        if(heldMessage?.actor===id&&heldMessage.method===request.method()&&(!heldMessage.afterBody||db.messages.some(row=>row.sender_id===id&&row.body===heldMessage.afterBody))){const held=heldMessage;heldMessage=null;held.reached();await held.wait;}
        messageRequests.push({actor:id,method:request.method()});
        if(failNext?.actor===id && failNext.method===request.method()) {
          const failure=failNext;failNext=null;if(failure.reached){failure.reached();await failure.wait;}
          if(failure.commit)await db.fetchFor(id)(url.pathname+url.search,{method:request.method(),headers:request.headers(),body:request.postData()});
          if(failure.status==='network'){await route.abort();return;}
          await route.fulfill({status:failure.status,json:{error:'fixture delivery unavailable'}});return;
        }
      }
      const response = await db.fetchFor(id)(url.pathname + url.search, { method: request.method(), headers: request.headers(), ...(request.method() === 'GET' ? {} : { body: request.postData() }) });
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
    });
    await page.goto(base + '/real-journey.html'); await page.locator('#real-content-panel').waitFor({ state: 'visible' });
    return page;
  }
  report.browser_engine={version:browser.version(),executable:process.env.SYNERA_CHROMIUM_EXECUTABLE||chromium.executablePath()};const a = await pageFor(A), b = await pageFor(B);

  const capture = async (page, name, target) => {
    if (mutation) return;
    if (target) await page.locator(target).scrollIntoViewIfNeeded();
    await fs.writeFile(proof+'/'+name+'.txt', await page.locator('body').innerText());
    await page.screenshot({path:proof+'/'+name+'.png'});
  };
  await capture(a,'03-local-start','#real-content-panel');
  const ready = page => page.waitForFunction(() => !document.body.dataset.realBusy);
  const open = async (page, id) => { const panel = page.locator('#' + id); if (!await panel.evaluate(node => node.open)) await panel.locator('summary').click(); };
  const refresh = async page => { await ready(page); await page.locator('#real-refresh').click(); await ready(page); };
  const peer = async (page, name) => { await open(page, 'real-people-panel'); await page.locator('#real-people article').filter({ hasText: name }).getByRole('button', { name: 'Відкрити умови' }).click(); await ready(page); };
  await peer(a, 'Тест Марія'); await open(a, 'real-editor');
  for (const [name, value] of Object.entries(fields())) {
    const input = a.locator(`#real-terms-form [name="${name}"]`);
    if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(String(value)); else await input.fill(String(value));
  }
  await a.locator('#real-terms-form button[type=submit]').click(); await ready(a);
  for (const page of [a, b]) {
    if (page === b) { await refresh(b); await peer(b, 'Тест Андрій'); }
    await page.locator('#real-approve-check').check(); await page.locator('#real-approve').click(); await ready(page);
  }
  assert.equal(db.approvals.length, 2); report.checks.independent_approvals = true;
  await capture(a,'04-terms-reviewed','#real-terms-review');
  await refresh(a); const form = a.locator('#real-invite-form');
  await form.locator('[name=note]').fill('Локальна перевірка результату'); await form.locator('[name=proposed_at]').fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  await form.getByRole('button').click(); await ready(a);
  await refresh(b); await open(b, 'real-meetings-panel'); await b.locator('#real-meetings').getByRole('button', { name: 'Прийняти', exact: true }).click(); await ready(b);
  for (const page of [a, b]) {
    await refresh(page); await open(page, 'real-meetings-panel'); await page.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(page);
  }
  const message = 'Конкретний результат × Zürich 💛 <script>literal</script>';
  await a.locator('#real-message').fill(message); await a.locator('#real-message-form button').click(); await ready(a); await refresh(b);
  assert.ok((await b.locator('#real-transcript').innerText()).includes(message)); assert.equal(await b.locator('#real-transcript script').count(), 0);

  report.checks.accepted_invitation_private_text = true;
  await capture(a,'05-private-chat','#real-conversation');
  const selectBody = async () => a.evaluate(() => {
    const paragraph = document.querySelector('#real-transcript .real-message p');
    const range = document.createRange(); range.selectNodeContents(paragraph);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
    return selection.toString();
  });
  const expectedSelection = await selectBody(); assert.equal(expectedSelection,message);
  const beforeReads = JSON.stringify({messages:db.messages,cases:db.cases,approvals:db.approvals,meetings:db.meetings,events:db.events});
  await refresh(a);
  assert.equal(await a.evaluate(()=>getSelection().toString()),expectedSelection,'Unchanged refresh destroyed selected private text');
  report.checks.manual_read_preserves_selected_text=true;
  await a.locator('#real-message').fill('Чернетка під час читання × Zürich 💛');
  await selectBody();
  const pollResponse=a.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/meeting_messages')&&response.request().method()==='GET');
  // Exercise the existing scheduled background read without changing its interval.
  await pollResponse;
  await a.waitForFunction(()=>!document.body.dataset.realBusy);
  assert.equal(await a.evaluate(()=>getSelection().toString()),expectedSelection,'Background refresh destroyed selected private text');
  assert.equal(await a.locator('#real-message').inputValue(),'Чернетка під час читання × Zürich 💛');
  assert.equal(JSON.stringify({messages:db.messages,cases:db.cases,approvals:db.approvals,meetings:db.meetings,events:db.events}),beforeReads,'Read changed server state');
  report.checks.scheduled_read_keeps_selection_and_draft_without_writes=true;
  await capture(a,'06-reading-preserved','#real-conversation');
  await a.evaluate(()=>getSelection().removeAllRanges()); await a.locator('#real-message').fill('');
  const stored=db.messages.find(row=>row.body===message),changed=message+' — оновлений текст';stored.body=changed;
  await refresh(a);assert.ok((await a.locator('#real-transcript').innerText()).includes(changed),'Changed server text was hidden');
  stored.body=message;await refresh(a);
  const originalName=db.profiles.find(row=>row.id===A).display_name;
  db.profiles.find(row=>row.id===A).display_name='Тест Андрій — оновлене ім’я';await refresh(a);
  assert.ok((await a.locator('#real-transcript').innerText()).includes('Тест Андрій — оновлене ім’я'),'Changed visible author was hidden');
  db.profiles.find(row=>row.id===A).display_name=originalName;await refresh(a);
  report.checks.changed_body_and_author_still_render=true;

  const kept=async draft=>{assert.equal(await a.locator('#real-conversation').isVisible(),true,'Send failure removed accepted private chat');assert.ok((await a.locator('#real-transcript').innerText()).includes(message));assert.equal(await a.locator('#real-message').inputValue(),draft);assert.equal(await a.locator('#real-blocked').isHidden(),true);};
  const purged=async()=>{await a.locator('#real-auth').waitFor({state:'visible'});assert.equal(await a.locator('#real-transcript').innerText(),'');assert.equal(await a.locator('#real-message').inputValue(),'');assert.equal(await a.locator('#real-conversation').isHidden(),true);};
  const reopen=async()=>{await a.reload();await a.locator('#real-content-panel').waitFor({state:'visible'});await open(a,'real-meetings-panel');await a.locator('#real-meetings').getByRole('button',{name:'Відкрити розмову',exact:true}).click();await ready(a);};
  const success=await a.locator('#real-status').innerText(),unchanged=JSON.stringify({cases:db.cases,approvals:db.approvals,meetings:db.meetings,events:db.events});
  const noOtherWrites=()=>assert.equal(JSON.stringify({cases:db.cases,approvals:db.approvals,meetings:db.meetings,events:db.events}),unchanged);
  for(const status of [503,409,429,500,'network']) {
    const draft='Не втратити × '+status+' 💛 <script>literal</script>',before=db.messages.length,requests=messageRequests.length;
    await a.locator('#real-message').fill(draft);failNext={actor:A,method:'POST',status};await a.locator('#real-message-form button').click();await ready(a);
    await kept(draft);assert.equal(db.messages.length,before);assert.notEqual(await a.locator('#real-status').innerText(),success);assert.equal(messageRequests.slice(requests).filter(row=>row.actor===A&&row.method==='POST').length,1,'Failed message retried automatically');noOtherWrites();
    await a.locator('#real-message-form button').click();await ready(a);assert.equal(db.messages.length,before+1);assert.equal(db.messages.at(-1).body,draft);assert.equal(await a.locator('#real-message').inputValue(),'');assert.ok((await a.locator('#real-transcript').innerText()).includes(draft));assert.equal(await a.locator('#real-transcript script').count(),0);await refresh(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(draft));noOtherWrites();
  }

  report.checks.rejected_send_keeps_chat_and_draft_manual_retry_once=true;
  for(const method of ['POST','GET']) {
    let release,reached;const wait=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{reached=resolve});
    const priorText='Перше повідомлення × '+method+' 💛',nextDraft='Наступна думка × '+method+' 💛 <script>literal</script>  ',before=db.messages.length,requests=messageRequests.length;
    await a.locator('#real-message').fill(priorText);heldMessage={actor:A,method,wait,reached,afterBody:method==='GET'?priorText:null};await a.locator('#real-message-form button').click();await started;
    await a.locator('#real-message').fill(nextDraft);release();await ready(a);
    assert.equal(await a.locator('#real-message').inputValue(),nextDraft,'Previous send erased the next draft');assert.equal(db.messages.length,before+1);assert.equal(db.messages.at(-1).body,priorText);assert.ok((await a.locator('#real-transcript').innerText()).includes(priorText));assert.equal(messageRequests.slice(requests).filter(row=>row.actor===A&&row.method==='POST').length,1);
    await refresh(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(priorText));assert.equal((await b.locator('#real-transcript').innerText()).includes(nextDraft.trim()),false,'New draft was sent without a click');noOtherWrites();
    if(method==='GET'&&!mutation){await a.locator('#real-conversation').scrollIntoViewIfNeeded();await a.screenshot({path:proof+'/next-draft-current-390x844.png'});}
    await a.locator('#real-message-form button').click();await ready(a);assert.equal(await a.locator('#real-message').inputValue(),'');assert.equal(db.messages.length,before+2);assert.equal(db.messages.at(-1).body,nextDraft.trim());await refresh(b);assert.ok((await b.locator('#real-transcript').innerText()).includes(nextDraft.trim()));noOtherWrites();
  }
  report.checks.next_draft_survives_previous_post_and_readback=true;
  report.checks.next_draft_only_sent_by_second_explicit_click=true;

  for(const phase of ['committed_post_response_lost','post_succeeded_read_failed']) {
    const draft='Доставка невідома × '+phase+' 💛',before=db.messages.length,requests=messageRequests.length;
    await a.locator('#real-message').fill(draft);failNext={actor:A,method:phase==='committed_post_response_lost'?'POST':'GET',status:503,commit:phase==='committed_post_response_lost'};
    await a.locator('#real-message-form button').click();await ready(a);await kept(draft);assert.equal(db.messages.length,before+1);assert.equal(db.messages.at(-1).body,draft);assert.notEqual(await a.locator('#real-status').innerText(),success);assert.equal(messageRequests.slice(requests).filter(row=>row.method==='POST').length,1);noOtherWrites();
    await refresh(a);await refresh(b);assert.ok((await a.locator('#real-transcript').innerText()).includes(draft));assert.ok((await b.locator('#real-transcript').innerText()).includes(draft));assert.equal(await a.locator('#real-message').inputValue(),draft);assert.equal(db.messages.length,before+1,'Readback resent delivered message');assert.equal(messageRequests.slice(requests).filter(row=>row.method==='POST').length,1);await a.locator('#real-message').fill('');
  }
  report.checks.ambiguous_delivery_keeps_draft_readback_without_resend=true;
  for(const status of [401,403]){await a.locator('#real-message').fill('Чутливий текст');const before=db.messages.length;failNext={actor:A,method:'POST',status};await a.locator('#real-message-form button').click();await ready(a);await purged();assert.equal(db.messages.length,before);await reopen();}
  report.checks.auth_failure_purges_private_state=true;
  for(const status of [500,401]) {
    let release,reached;const wait=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{reached=resolve});
    const before=db.messages.length;await a.locator('#real-message').fill('Пізня відповідь '+status);failNext={actor:A,method:'POST',status,wait,reached};await a.locator('#real-message-form button').click();await started;
    await a.locator('#real-logout').click();await a.waitForFunction(()=>document.getElementById('real-status').textContent==='Ти вийшов/вийшла з Synera.');const afterLogout=await a.locator('#real-status').innerText();release();await ready(a);await purged();assert.equal(await a.locator('#real-status').innerText(),afterLogout,'Late failed send changed completed logout state');assert.equal(db.messages.length,before);await reopen();
  }
  report.checks.late_error_does_not_replace_logout_or_restore_chat=true;
  assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier||null),null);report.checks.current_default=true;
  const audit=await new AxeBuilder({page:a}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(audit.violations,[]);report.checks.axe_violations=0;
  const transcript=a.getByRole('region',{name:'Приватні повідомлення',exact:true});await transcript.focus();assert.equal(await transcript.evaluate(node=>document.activeElement===node),true);await transcript.evaluate(node=>{node.scrollTop=0;});await a.keyboard.press('End');await a.waitForFunction(()=>document.getElementById('real-transcript').scrollTop>0);report.checks.keyboard_scrolls_private_history=true;
  const preferences=a.locator('[data-atelier-controls]');await preferences.locator('summary').click();await preferences.getByRole('button',{name:'Atelier 2026',exact:true}).click();assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier),'on');const atelierAudit=await new AxeBuilder({page:a}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(atelierAudit.violations,[]);await preferences.getByRole('button',{name:'Чинний',exact:true}).click();assert.equal(await a.evaluate(()=>document.documentElement.dataset.syneraAtelier||null),null);await preferences.locator('summary').click();assert.equal(await a.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);report.checks.atelier_reversible_quiet_motion=true;await capture(a,'07-current-after-atelier','#real-conversation');
  const layout=await a.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert.ok(layout.width<=layout.viewport);report.checks.no_overflow=layout;
  const storage=await a.evaluate(async()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage),caches:await caches.keys(),databases:await indexedDB.databases()}));assert.deepEqual(storage,{local:['synera.atelier.preferences.v1'],session:[],caches:[],databases:[]});report.checks.no_private_storage=true;
  await a.locator('#real-message').fill('Чернетка збережена × Zürich 💛');failNext={actor:A,method:'POST',status:503};await a.locator('#real-message-form button').click();await ready(a);await kept('Чернетка збережена × Zürich 💛');await a.locator('#real-conversation').scrollIntoViewIfNeeded();if(!mutation)await a.screenshot({path:proof+'/message-current-390x844.png'});
  assert.deepEqual(external,[]);report.external_requests=external;report.messages=db.messages.length;report.message_requests=messageRequests;noOtherWrites();
  if (!baseline) {
    await a.locator('#real-outcome-refresh').click(); await ready(a);
    assert.equal(await a.locator('#real-outcome-cards [data-outcome-index]').count(), 2);
    assert.equal(db.events.length, 0); report.checks.pending_does_not_auto_accept = true;
    const rows = db.cases[0].material.trial.deliverables;
    const given = id => rows.findIndex(row => row.giver_id === id);
    const card = (page, index) => page.locator(`#real-outcome-cards [data-outcome-index="${index}"]`);
    const reload = async page => { await page.locator('#real-outcome-refresh').click(); await ready(page); };
    const submit = async (page, index, value) => { const box = card(page, index); await box.locator('[name=evidenceUri]').fill(value); await box.getByRole('button', { name: 'Подати доказ' }).click(); await ready(page); };
    const check = async (page, index) => { const box = card(page, index); await box.locator('[name=scopeNotes]').fill('Перевірено саме погоджений критерій × Zürich 💛'); await box.getByRole('button', { name: 'Зберегти перевірку' }).click(); await ready(page); };
    const accept = async (page, index) => { const box = card(page, index), button = box.getByRole('button', { name: 'Прийняти результат' }); assert.equal(await button.isEnabled(), false); await box.getByRole('checkbox').check(); assert.equal(await button.isEnabled(), true); await button.click(); await ready(page); };
    const evidence = 'https://example.com/доказ × Zürich 💛 <script>literal</script>';
    db.controls.nextOutcomeStatus = 500;
    await submit(a, given(A), evidence);
    assert.equal(await card(a, given(A)).locator('[name=evidenceUri]').inputValue(), evidence); assert.equal(db.events.length, 0);
    await card(a, given(A)).getByRole('button', { name: 'Подати доказ' }).click(); await ready(a);
    const retries = db.attempts.filter(row => row.body.action === 'submit');
    assert.equal(retries.length, 2); assert.equal(retries[0].body.intentId, retries[1].body.intentId);
    assert.equal(db.events.length, 1); report.checks.retry_keeps_text_and_intent = true;
    assert.equal(await card(a, given(A)).getByRole('button', { name: 'Прийняти результат' }).count(), 0); report.checks.giver_cannot_self_accept = true;
    await reload(b); await check(b, given(A));
    await card(b, given(A)).locator('[name=reason]').selectOption('outside_agreed_scope');
    await card(b, given(A)).getByRole('button', { name: 'Відкрити спір' }).click(); await ready(b);
    assert.ok((await card(b, given(A)).innerText()).includes('Є відкритий спір'));
    await accept(b, given(A));
    assert.equal(db.events.filter(row => row.kind === 'decline').length, 1);
    assert.ok((await b.locator('#real-outcome-status').innerText()).includes('Прийнято 1 з 2'));
    report.checks.dispute_resolves_without_erasing_history = true;
    await submit(b, given(B), 'Другий фактичний тестовий результат'); await reload(a); await check(a, given(B));
    await peer(b, 'Тест Андрій'); await b.locator('#real-withdraw').click(); await ready(b); await refresh(a);
    assert.equal(await card(a, given(B)).getByRole('checkbox').isEnabled(), false); report.checks.withdrawal_disables_outcome_actions = true;
    await b.locator('#real-approve-check').check(); await b.locator('#real-approve').click(); await ready(b); await refresh(a); await accept(a, given(B));
    await open(b, 'real-meetings-panel'); await b.locator('#real-meetings').getByRole('button', { name: 'Відкрити розмову' }).click(); await ready(b);
    await reload(b);
    for (const page of [a, b]) { assert.ok((await page.locator('#real-outcome-status').innerText()).includes('Усі результати прийняті')); assert.equal(await page.locator('#real-outcome-cards script').count(), 0); }
    assert.equal(db.events.length, 7); report.checks.both_receiver_acceptances_confirm_all_results = true;
    await a.locator('#real-outcome-title').scrollIntoViewIfNeeded();
    if (!mutation) { await a.screenshot({ path: `${proof}/outcome-current-390x844.png` }); await a.locator('#real-outcomes').screenshot({ path: `${proof}/outcome-confirmed-panel.png` }); }
    assert.equal(await a.evaluate(() => document.documentElement.dataset.syneraAtelier || null), null); report.checks.current_default = true;
    const audit = await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(audit.violations, []); report.checks.axe_violations = 0;
    const layout = await a.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth })); assert.ok(layout.width <= layout.viewport); report.checks.no_overflow = layout;
    const storage = await a.evaluate(async () => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), caches: await caches.keys(), databases: await indexedDB.databases() }));
    assert.deepEqual(storage, { local: [], session: [], caches: [], databases: [] }); report.checks.no_private_storage = true;
    const preferences = a.locator('[data-atelier-controls]'); await preferences.locator('summary').click();
    await preferences.getByRole('button', { name: 'Atelier 2026', exact: true }).click();
    assert.equal(await a.evaluate(() => document.documentElement.dataset.syneraAtelier), 'on');
    await a.locator('#real-outcome-title').scrollIntoViewIfNeeded(); if (!mutation) await a.screenshot({ path: `${proof}/outcome-atelier-390x844.png` });
    const atelierAudit = await new AxeBuilder({ page: a }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); assert.deepEqual(atelierAudit.violations, []);
    await preferences.getByRole('button', { name: 'Чинний', exact: true }).click();
    assert.equal(await a.evaluate(() => document.documentElement.dataset.syneraAtelier || null), null);
    assert.equal(await a.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await preferences.locator('summary').click();
    report.checks.atelier_opt_in_reversible_and_reduced_motion = true;
    const closed = await pageFor(A, false); await peer(closed, 'Тест Марія');
    assert.equal(await closed.locator('#real-outcomes').isHidden(), true); report.checks.flag_closed_ui = true;
    // Keep the loaded private DOM in place while another read is in flight.
    let release, reached; const wait = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
    db.controls.beforeOutcome = async body => { if (body.action === 'state') { reached(); await wait; } };
    const pending = a.locator('#real-outcome-refresh').click(); await pending; await started;
    // The read starts by clearing the pane; reload a known private result first
    // is separately verified by the final logout below on the other account.
    await a.locator('#real-logout').click(); release(); db.controls.beforeOutcome = null; await ready(a);
    assert.equal(await a.locator('#real-outcome-cards').innerText(), ''); assert.equal(await a.locator('#real-outcome-events').innerText(), '');
    report.checks.late_read_does_not_restore_private_dom = true;
    // b still displays both accepted results; purge must remove hidden DOM too.
    await b.locator('#real-logout').click(); await b.locator('#real-auth').waitFor({ state: 'visible' });
    assert.equal(await b.locator('#real-outcome-cards').innerText(), '', 'Private outcome DOM survived logout');
    assert.equal(await b.locator('#real-outcome-events').innerText(), '', 'Private outcome history survived logout');
    report.checks.logout_purges_result_and_history = true;
    report.events = db.events.map(event => ({ index: event.index, kind: event.kind, actor_id: event.actor_id }));
  }
  if (baseline) await a.locator('#real-logout').click(); await a.locator('#real-auth').waitFor({ state: 'visible' });
  assert.equal(await a.locator('#real-transcript').innerText(), ''); assert.equal(await a.locator('#real-message').inputValue(), '');
  report.checks.logout_clears_old_private_chat = true;
  assert.deepEqual(errors, []); report.status = 'PASS_LOCAL_MESSAGE_RECOVERY_BROWSER';
  const names = ['web_launch/real-journey.html', 'web_launch/real-journey.mjs', 'web_launch/real-journey.css', 'web_launch/real-journey-client.mjs', 'web_launch/neon-store.mjs', 'tools/fixtures/case-outcome-fixture.mjs', 'tools/case-outcome-browser-acceptance.mjs','tools/message-recovery-browser.mjs','tools/message-draft-continuity-browser.mjs','tools/journey-dynamic-audit.mjs'];
  report.source_sha256 = Object.fromEntries(await Promise.all(names.map(async name => [name, createHash('sha256').update(await fs.readFile(name)).digest('hex')])));
} catch (error) { report.error = error.message; throw error; }
finally {
  if (browser) await browser.close(); server.kill();
  await fs.writeFile(`${proof}/${mutation?'MUTATION_DETAIL':'BROWSER_DETAIL'}.json`, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report));
