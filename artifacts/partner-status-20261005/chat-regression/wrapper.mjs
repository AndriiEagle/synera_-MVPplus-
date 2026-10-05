// Reuse the accepted real Chromium oracle; retain its original evidence unchanged.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', "file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/tools/partner-status-chat-regression.mjs"));
const directory = 'artifacts/partner-status-20261005/chat-regression';
const red = process.argv.includes('--red'), mutation = process.argv.includes('--mutate');
const phase = red ? 'red' : mutation ? 'mutation' : 'green', proof = `${directory}/${phase}`;
const read = name => fs.readFile(path.join(root, name));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const originalProof = 'artifacts/product-status-20261004/draft-continuity';
const accepted = JSON.parse(await read(`${originalProof}/BROWSER.json`));
let source = (await read(`${originalProof}/runner.mjs`)).toString('utf8');
assert.equal(hash(Buffer.from(source)), accepted.runner_sha256, 'Accepted oracle changed');
const reusedOracle = hash(Buffer.from(source));
const replace = (needle, next) => { assert.equal(source.split(needle).length, 2, 'Audit seam drift: ' + needle); source = source.replace(needle, next); };
replace(`proof="${originalProof}"`, `proof=${JSON.stringify(proof)}`);
replace("const mutation=process.argv.includes('--mutate-late-error');", `const mutation=${mutation};`);
replace("marker='if (!draftChanged) ui.messageForm.reset();'", "marker='if (unchanged) return;'");
replace("source.replace(marker,'ui.messageForm.reset();')", "source.replace(marker,'/* oracle mutation: rebuild unchanged transcript */')");
replace('  const ready = page =>', String.raw`
  const capture = async (page, name, target) => {
    if (mutation) return;
    if (target) await page.locator(target).scrollIntoViewIfNeeded();
    await fs.writeFile(proof+'/'+name+'.txt', await page.locator('body').innerText());
    await page.screenshot({path:proof+'/'+name+'.png'});
  };
  await capture(a,'03-local-start','#real-content-panel');
  const ready = page =>`);
replace('  await refresh(a); const form = a.locator', "  await capture(a,'04-terms-reviewed','#real-terms-review');\n  await refresh(a); const form = a.locator");
replace('  report.checks.accepted_invitation_private_text = true;', String.raw`
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
`);
replace("report.checks.atelier_reversible_quiet_motion=true;", "report.checks.atelier_reversible_quiet_motion=true;await capture(a,'07-current-after-atelier','#real-conversation');");
replace("'tools/message-draft-continuity-browser.mjs'];", "'tools/message-draft-continuity-browser.mjs','tools/journey-dynamic-audit.mjs'];");
await fs.mkdir(path.join(root, proof), { recursive: true });
const runner = path.join(root, proof, 'runner.mjs'); await fs.writeFile(runner, source);
const before = await read('web_launch/real-journey.mjs');
const result = spawnSync(process.execPath, [runner], { cwd: root, encoding: 'utf8', timeout: 90000, maxBuffer: 1024 * 1024 });
assert.deepEqual(await read('web_launch/real-journey.mjs'), before, 'Oracle changed canonical source');
const detail = JSON.parse(await read(`${proof}/${mutation ? 'MUTATION_DETAIL' : 'BROWSER_DETAIL'}.json`));
const expectedFailure = /Unchanged refresh destroyed selected private text/;
const report = { status:'NOT_ACCEPTED',generated_at:new Date().toISOString(),phase,provider_calls:0,provider_usd:0,exit_code:result.status,reused_oracle_sha256:reusedOracle,runner_sha256:hash(Buffer.from(source)),browser:detail,source_sha256:hash(before) };
if (red || mutation) { assert.notEqual(result.status,0);assert.match(detail.error,expectedFailure);report.status=red?'RED_CONFIRMED_UNCHANGED_REFRESH_SELECTION_LOSS':'MUTANT_REJECTED_UNCHANGED_REFRESH_SELECTION_LOSS'; }
else { assert.equal(result.status,0,result.stdout+result.stderr);assert.equal(detail.status,'PASS_LOCAL_MESSAGE_RECOVERY_BROWSER');report.status='PASS_LOCAL_DYNAMIC_CHAT_AUDIT'; }
await fs.writeFile(path.join(root,directory,phase.toUpperCase()+'.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks:Object.keys(detail.checks).length,error:detail.error,external_requests:detail.external_requests}));
