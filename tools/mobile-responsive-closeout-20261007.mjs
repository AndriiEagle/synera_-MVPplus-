import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='artifacts/mobile-20261007/responsive';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await fs.readFile(`${root}/${p}/matrix.json`,'utf8'));
const full=await read('full-reviewed'),red=await read('red-reviewed'),green=await read('green-targeted'),mutation=await read('mutation-reviewed');
const extra=await read('green-extra-final');
assert.equal(extra.rows.length,12);assert.equal(extra.summary.issues,0);assert.equal(extra.failures.length,0);
assert.equal(red.failures.length,0);assert.ok(red.summary.issues>0);
assert.equal(green.failures.length,0);assert.equal(green.summary.issues,0);
assert.equal(mutation.failures.length,0);assert.ok(mutation.rows.some(r=>r.size==='landscape'&&r.page==='studio'&&r.issues.some(i=>i.id==='fit-give'&&!i.hit)));
assert.ok(mutation.rows.some(r=>r.size==='large-text'&&r.page==='real-journey'&&r.issues.length));
assert.ok(mutation.rows.some(r=>r.size==='large-text'&&r.page==='index'&&r.issues.some(i=>i.kind==='document-overflow')));
assert.ok(mutation.rows.some(r=>r.size==='large-text'&&r.page==='summit'&&r.issues.some(i=>i.kind==='unreachable-action')));
assert.equal(full.rows.length,180);assert.equal(full.failures.length,0);
assert.equal(full.rows.filter(r=>r.journey).length,12);
assert.ok(full.rows.filter(r=>r.journey).every(r=>r.journey.bothApprovals===2&&r.journey.meetingAccepted==='accepted'&&r.journey.messageStored===1));
const protectedHash=sha(await fs.readFile('web_launch/journey-ui.mjs'));
assert.equal(protectedHash,'68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b');
const sourceDrift=[];for(const [name,hash] of Object.entries(full.sources)){const now=sha(await fs.readFile('web_launch/'+name));if(now!==hash)sourceDrift.push({file:name,start:hash,end:now});}
assert.ok(!sourceDrift.some(r=>['triangle.css','real-journey.css'].includes(r.file)),'Owned CSS bytes changed after matrix');
for(const name of ['style.css','summit.css'])assert.equal(sha(await fs.readFile('web_launch/'+name)),extra.sources[name],'Final CSS must match affected-subset proof');
assert.ok((await fs.readFile('web_launch/summit.css','utf8')).startsWith(await fs.readFile(root+'/red-extra/summit.css','utf8')),'Pricing bytes must remain an exact prefix');
assert.ok(full.rows.filter(r=>['triangle','studio','studio-journey','real-journey','outcome-archive','journey-editor','journey-review','journey-invite','journey-chat'].includes(r.page)).every(r=>r.issues.length===0),'Owned surfaces must remain clear across matrix');
const files={};for(const phase of ['red-reviewed','green-targeted','full-reviewed','red-extra','green-extra','green-extra-final','mutation-reviewed'])for(const name of await fs.readdir(`${root}/${phase}`)){if(!/\.(png|json|css)$/.test(name))continue;files[`${phase}/${name}`]=sha(await fs.readFile(`${root}/${phase}/${name}`));}
for(const path of ['web_launch/triangle.css','web_launch/real-journey.css','web_launch/style.css','web_launch/summit.css','tools/mobile-responsive-matrix-20261007.mjs','tools/mobile-responsive-results-20261007.mjs','tools/mobile-responsive-closeout-20261007.mjs'])files[path]=sha(await fs.readFile(path));
const receipt={status:'LOCAL_CSS_FIXES_ACCEPTED_CATALOGUE_FINDINGS',full:full.summary,engines:full.engines,verifiedProfile:extra.engines,failures:full.failures,journeys:12,findings:full.rows.filter(r=>r.issues.length).map(r=>({size:r.size,page:r.page,issues:r.issues})),pageErrors:full.rows.filter(r=>r.pageErrors?.length).map(r=>({size:r.size,page:r.page,errors:r.pageErrors})),red:red.summary,green:green.summary,greenExtra:extra.summary,mutation:mutation.summary,protectedHash,sourceDrift,files,provider_calls:0,usd:0,boundary:'Desktop Chromium, synthetic Auth/Data; not WebKit/live JWT/physical Android/iPhone or PWA installation acceptance'};
receipt.remainingFindings=receipt.findings.filter(r=>!extra.rows.some(e=>e.page===r.page&&e.size===r.size&&e.issues.length===0));
assert.ok(receipt.remainingFindings.every(r=>r.page==='catalogue'));
await fs.writeFile(root+'/ACCEPTANCE.json',JSON.stringify(receipt,null,2));
const owned=['web_launch/triangle.css','web_launch/real-journey.css','web_launch/style.css','web_launch/summit.css'];
const report=`# 93. Мобільний аудит Synera — 07.10.2026

**LOCAL_CSS_FIXES_ACCEPTED_CATALOGUE_FINDINGS.** Виправлення прийняті локально; каталог компонентів має окремі залишкові знахідки. Фізичний Android/iPhone і live backend не прийняті.

Source chat: 01a115a3-30cc-7bb3-9d9e-e64684e62b5c. Parent: 01a0a673-47c0-74d1-a768-7867f3dca2bc. Branch codex/synera-product-20261002, starting a284a1eda34a85b658cf03ec2dd3a1fbfcb2cad8. No commit/push/deploy/install/provider calls. Parent owns integration.

## Прийняті зміни

- triangle.css: static heading in stacked Studio layout stops covering form controls at 844x390; text wrapping and growing mast preserve navigation at 200% text.
- real-journey.css: mast grows/wraps instead of clipping profile/demo/archive links with enlarged text.
- style.css: introduction heading wraps oversized words instead of expanding the viewport to 458px at 390px width.
- summit.css: **append-only presentation-specific rules**, selected by body:has(>main>.hero). Mast grows and text wraps. Access/pricing page excluded. Exact preceding bytes, including pricing changes, preserved; PREFIX_PROOF.json proves restoration after CRLF normalization and semantic equality. No HTML/JS/manifest/price changes by this chat.

Protected journey-ui.mjs unchanged: ${protectedHash}. No preferences/defaults changed; fresh Current contexts and explicit Atelier opt-in were tested.

## Докази

| Artifact | Result |
|---|---|
| red-reviewed/matrix.json | 16 rows, 27 reproduced geometric failures, no harness failures |
| green-targeted/matrix.json | 16 rows, 0 findings, 0 harness failures |
| full-reviewed/matrix.json | ${full.rows.length} rows, ${full.failures.length} harness failures, ${full.summary.issues} raw findings |
| red-extra/matrix.json | Index/Summit large-text failures before final narrow repair |
| green-extra-final/matrix.json | 12 affected-subset rows on **final source bytes**, 0 findings, 0 harness failures |
| mutation-reviewed/matrix.json | ${mutation.rows.length} rows, ${mutation.summary.issues} failures reintroduced by serving prior CSS; canonical files untouched |
| ACCEPTANCE.json | Assertions, source drift/supersession, ${Object.keys(files).length} SHA256 entries, final protected hash |

Full matrix: 320,360,375,390,412,430,768 x 844; landscape 844x390; 390x844 with computed font sizes doubled; dedicated reduced motion; Atelier at 320x844 and 844x390. 11 allowlisted public HTML pages and four synthetic real-journey states per configuration. One C: Chrome browser at a time, sequential contexts, external requests blocked, service workers blocked.

All 12 synthetic journeys completed with **2 separate approvals, accepted invitation, 1 stored message** and exact transcript readback. Actual client and handleNeon ran against existing in-memory Auth/Data fixtures. This does not execute PostgreSQL/RLS/live JWT and does not establish real-user acceptance.

Action checks scroll each visible enabled action, inspect clipping and hit testing, and account for wrapped inline link fragments; screenshots accompany all rows. Real clicks exercise terms, approvals, invitation acceptance and messaging. Large text is a local computed-font stress test, not OS/browser zoom; dynamically replaced markup can inherit scaling differently. No claim of comprehensive WCAG/keyboard/soft-keyboard acceptance.

Full matrix used final triangle.css/real-journey.css bytes. The later style.css/Summit fix supersedes only affected evidence with green-extra-final (index, Summit and access page at 320, landscape, large text, Atelier 320). Unchanged full matrix was not rerun. Recorded source drift: ${sourceDrift.map(r=>r.file).join(', ')||'none'}. Final CSS hashes are independently asserted against their applicable matrix; no stale source is called accepted.

## Visual review and remaining boundary

Reviewed actual before/after PNGs, including landscape Studio obstruction, large-text real-journey header, narrow private conversation, Atelier entry, and large-text index/Summit. Before: title visibly painted over form; navigation clipped at page top. After: form is unobstructed, header grows, long text remains readable vertically. This is representative visual inspection, not human review of every screenshot.

Remaining ${receipt.remainingFindings.length} rows are **catalogue.html only**. Its public component catalogue includes demonstration/inactive states and inline styles incompatible with the local server's style-src self CSP. Raw counts are not independent confirmed product defects. Parent should repair/reclassify this HTML/catalogue surface separately; no CSP weakening performed. Index/Summit findings in the earlier full matrix are superseded by green-extra-final.

WebKit not run: default Playwright cache redirects to unavailable D:, earlier probe found no executable, and no C: WebKit was selected. No installs. Physical Android/iPhone, standalone installation, OS text settings, keyboard occlusion and live two-user/backend gates remain open. Parent's installation tests are separate evidence and are not counted here.

## Runtime recovery and finite reviews

Initial interrupted work is preserved in HOST_BLOCKED_HISTORY.uk.md and baseline/diagnostic directories; not accepted as final evidence. Parent diagnosed D: cache redirection. All final runs use explicit C:/Program Files/Google/Chrome/Application/chrome.exe and process-local TMP/TEMP/TMPDIR C:/Users/Andrii/.codex/tmp/synera-mobile-responsive; target lstat checks reject symlinks. Browser.getBrowserCommandLine with --enable-automation confirmed the isolated C: test profile in the final subset and mutation receipts. User profile and persistent system environment untouched.

One initial CDP profile probe failed before page work (red-extra/LAUNCH_FAILURE.json); it was repaired by explicit --enable-automation. Earlier completed runners retained app-import timers; finite runner now exits after browser close and server kill request. Old D:-blocked read sessions 4106/55823 were sent interrupts but termination was not confirmed; no unknown PID was killed.

Finite review 1: inspected actual 14-line primary CSS diff and removed false-positive test interpretations (onboarding background / inline-link rectangle). Finite review 2: served original CSS without touching canonical source; semantic guard again failed on covered Studio controls, clipped real navigation, oversized index and Summit navigation. Later exact-prefix check detected CRLF normalization, restored original bytes and reran only affected subset. No optional polishing after acceptance.

## Reproduction (cmd.exe, login:false, checkout root)

1. node tools/mobile-responsive-matrix-20261007.mjs --phase=full-rerun
2. node tools/mobile-responsive-matrix-20261007.mjs --phase=affected-rerun --sizes=320,landscape,large-text,atelier-320 --pages=index.html,summit.html,get.html
3. node tools/mobile-responsive-matrix-20261007.mjs --phase=mutation-rerun --sizes=landscape,large-text --pages=index.html,summit.html,get.html,studio.html,studio-journey.html,real-journey.html,outcome-archive.html --mutation=all
4. node tools/mobile-responsive-closeout-20261007.mjs

Full runner intentionally returns nonzero for catalogue findings; mutation intentionally returns nonzero. Read JSON, do not relabel exit alone. Closeout verifies the named preserved original proof directories.

## Files for parent integration

${owned.map(p=>'- '+p+' — '+files[p]).join('\n')}

Tools: tools/mobile-responsive-matrix-20261007.mjs; tools/mobile-responsive-results-20261007.mjs; tools/mobile-responsive-closeout-20261007.mjs. Artifacts: this directory (including preserved before CSS and failed/historical evidence). Full source and PNG hashes: ACCEPTANCE.json. Parent should stage Summit together with the pricing owner's accepted change, preserving its exact original prefix.

**NEXT (10–20 min):** parent reviews the four CSS diffs and ACCEPTANCE.json, stages only agreed source/tools/evidence, and keeps catalogue/WebKit/physical-device gates explicit in integration.

Models used: none (provider calls=0, USD=$0.00).
`;
await fs.writeFile(root+'/REPORT.uk.md',report);
console.log(JSON.stringify({status:receipt.status,full:receipt.full,findings:receipt.findings.map(r=>({size:r.size,page:r.page,count:r.issues.length})),pageErrors:receipt.pageErrors,sourceDrift,hashes:Object.keys(files).length}));
