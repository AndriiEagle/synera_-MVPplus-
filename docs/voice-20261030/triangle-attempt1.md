# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser-e2e.spec.mjs >> Triangle L local journey preserves explicit answers, version changes, optional notes export and voluntary turns
- Location: tests\browser-e2e.spec.mjs:564:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#round-form button')

```

# Test source

```ts
  499 |   await page.locator('.header-preferences > summary').click();
  500 |   const h1 = await page.locator('.intro h1').boundingBox();
  501 |   const cta = await page.locator('.draft-entry').boundingBox();
  502 |   expect(h1.y).toBeLessThan(cta.y);
  503 |   expect(cta.y + cta.height).toBeLessThan(812);
  504 |   expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  505 |   await openPreferences(page);
  506 |   await page.locator('#style-preset').selectOption('synera');
  507 |   await expect(page.locator('html')).toHaveAttribute('data-synera-style', 'synera');
  508 |   await context.close();
  509 | });
  510 | 
  511 | test('Presentation leads to real app access and both phone guides without pretending checkout is available', async ({ page }, testInfo) => {
  512 |   await page.setViewportSize({ width: 390, height: 844 });
  513 |   const pageErrors = [];
  514 |   page.on('pageerror', error => pageErrors.push(error.message));
  515 |   const privateRequests = [];
  516 |   page.on('request', request => { if (/\/api\/|\/auth\/|\/rest\//.test(request.url())) privateRequests.push(request.url()); });
  517 |   if (process.env.SYNERA_ACCESS_MUTATION === 'wrong-origin') {
  518 |     await page.route('**/product-access.mjs', async route => {
  519 |       const response = await route.fetch();
  520 |       await route.fulfill({ response, body: (await response.text()).replace('https://synera-pilot.pages.dev/', 'https://wrong-app.example.invalid/') });
  521 |     });
  522 |   }
  523 |   await page.goto(`${baseUrl}/summit.html`);
  524 |   await page.locator('.closing > a.primary').click();
  525 |   await expect(page.locator('[data-platform]')).toHaveCount(2, { timeout: 4000 });
  526 |   await page.locator('[data-platform="ios"] summary').click();
  527 |   await expect(page.locator('[data-platform="ios"]')).toHaveAttribute('open', '');
  528 |   await expect(page.locator('[data-platform="ios"]')).toContainText('Safari');
  529 |   await expect(page.locator('[data-platform="android"]')).toContainText('Chrome');
  530 |   const app = page.locator('#open-live-app');
  531 |   expect(new URL(await app.getAttribute('href')).origin).toBe('https://synera-pilot.pages.dev');
  532 |   await expect(page.locator('#payment-availability')).toHaveAttribute('data-state', 'free-pilot');
  533 |   expect(await page.locator('a[href*="checkout.stripe.com"], a[href*="buy.stripe.com"], a[href*="apps.apple.com"], a[href*="play.google.com/store"]').count()).toBe(0);
  534 |   expect(privateRequests).toEqual([]);
  535 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  536 |   await openPreferences(page);
  537 |   await page.locator('#site-language').selectOption('en');
  538 |   await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  539 |   await expect(page.locator('#open-live-app')).toHaveText('Open Synera ↗');
  540 |   await page.locator('#site-language').selectOption('uk');
  541 |   await expect(page.locator('html')).toHaveAttribute('lang', 'uk');
  542 |   await expect(page.locator('[data-platform="ios"]')).toContainText('Safari');
  543 |   await expect(page.locator('#open-live-app')).toHaveText('Відкрити Synera ↗');
  544 |   const { default: AxeBuilder } = await import('@axe-core/playwright');
  545 |   const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  546 |   expect(audit.violations.filter(item => ['critical', 'serious'].includes(item.impact))).toEqual([]);
  547 |   expect(pageErrors).toEqual([]);
  548 |   await page.screenshot({ path: testInfo.outputPath('product-access-mobile.png'), fullPage: true });
  549 | });
  550 | 
  551 | test('Phone access stays functional without JavaScript', async ({ browser }) => {
  552 |   const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  553 |   const page = await context.newPage();
  554 |   await page.goto(`${baseUrl}/summit.html`);
  555 |   await page.locator('.closing > a.primary').click();
  556 |   await expect(page.locator('[data-platform]')).toHaveCount(2);
  557 |   await page.locator('[data-platform="ios"] summary').click();
  558 |   await expect(page.locator('[data-platform="ios"]')).toHaveAttribute('open', '');
  559 |   await expect(page.locator('[data-platform="ios"]')).toContainText('Safari');
  560 |   expect(new URL(await page.locator('#open-live-app').getAttribute('href')).origin).toBe('https://synera-pilot.pages.dev');
  561 |   await context.close();
  562 | });
  563 | 
  564 | test('Triangle L local journey preserves explicit answers, version changes, optional notes export and voluntary turns', async ({ page }, testInfo) => {
  565 |   await page.setViewportSize({width:390,height:844});
  566 |   await page.clock.install({time:new Date('2026-10-02T14:00:00Z')});
  567 |   const errors=[],privateRequests=[];
  568 |   page.on('pageerror',error=>errors.push(error.message));
  569 |   page.on('request',request=>{if(/\/api\/|\/auth\/|googleapis|facebook|linkedin/.test(request.url()))privateRequests.push(request.url());});
  570 |   if(process.env.SYNERA_TRIANGLE_MUTATION==='keep-votes')await page.route('**/triangle-room.mjs',async route=>{
  571 |     const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('next.proposal.votes = {};','for (const vote of Object.values(next.proposal.votes)) vote.revision = next.proposal.revision; /* mutation: old answers falsely copied to new scope */')});
  572 |   });
  573 |   await page.goto(`${baseUrl}/triangle.html`);
  574 |   await page.locator('#room-goal').fill('Перший прототип для трьох');
  575 |   for(const [id,name]of [['a','Mara'],['b','Leo'],['c','Noor']])await page.locator(`#name-${id}`).fill(name);
  576 |   await page.locator('#local-understood').check();
  577 |   await page.locator('#room-setup button[type=submit]').click();
  578 |   for(const form of await page.locator('#contributions form').all()){
  579 |     await form.locator('textarea').fill('Зроблю свою частину'); await form.locator('button[type=submit]').click();
  580 |   }
  581 |   await page.locator('#message-body').fill('<img src=x onerror="window.__bad=true"> Приватна ідея');
  582 |   await page.locator('#message-form button[type=submit]').click();
  583 |   await expect(page.locator('#room-messages')).toContainText('<img src=x');
  584 |   expect(await page.locator('#room-messages img').count()).toBe(0);
  585 |   await page.locator('#task-title').fill('Перевірити прототип із клієнтом');
  586 |   await page.locator('#task-form button[type=submit]').click();
  587 |   await page.locator('#ask-l').click();
  588 |   await expect(page.locator('#l-note')).toContainText('відкритий крок');
  589 |   await page.locator('#budget-purpose').fill('Прототип: погодити витрати й права');
  590 |   await page.locator('#budget-form button[type=submit]').click();
  591 |   const vote=async(index,choice)=>{const form=page.locator('.budget-vote').nth(index);await form.locator('select').selectOption(choice);await form.locator('button[type=submit]').click();};
  592 |   await vote(0,'yes'); await vote(1,'yes');
  593 |   await expect(page.locator('#budget-state')).toHaveAttribute('data-state','awaiting_responses');
  594 |   await vote(2,'no');await expect(page.locator('#budget-state')).toHaveAttribute('data-state','declined');
  595 |   await vote(2,'yes');await expect(page.locator('#budget-state')).toHaveAttribute('data-state','unanimous_local_notes');
  596 |   const first=page.locator('#contributions form').first();await first.locator('textarea').fill('Змінив обсяг роботи');await first.locator('button[type=submit]').click();
  597 |   await expect(page.locator('#budget-state')).toHaveAttribute('data-state','awaiting_responses');
  598 |   await expect(page.locator('.budget-vote').first()).toContainText('Відповіді ще немає');
> 599 |   await page.locator('#round-seconds').fill('15');await page.locator('#round-agreed').check();await page.locator('#round-form button').click();await page.locator('#round-start').click();
      |                                                                                                                                        ^ Error: locator.click: Test timeout of 30000ms exceeded.
  600 |   await page.clock.fastForward(16000);await expect(page.locator('#round-clock')).toHaveText('0:00');
  601 |   await expect(page.locator('#round-person')).toContainText('Mara');
  602 |   await page.locator('#round-next').click();await expect(page.locator('#round-person')).toContainText('Leo');
  603 |   const downloadPromise=page.waitForEvent('download');await page.locator('#export-room').click();const download=await downloadPromise;
  604 |   const fs=await import('node:fs/promises');const exported=JSON.parse(await fs.readFile(await download.path(),'utf8'));
  605 |   expect(exported.goal).toBe('Перший прототип для трьох');expect(exported.binding).toBe(false);expect(exported.messages).toEqual([]);
  606 |   expect(exported.tasks[0].title).toBe('Перевірити прототип із клієнтом');
  607 |   expect(privateRequests).toEqual([]);expect(errors).toEqual([]);
  608 |   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  609 |   const {default:AxeBuilder}=await import('@axe-core/playwright');const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  610 |   await page.screenshot({path:testInfo.outputPath('triangle-mobile.png'),fullPage:true});
  611 | });
  612 | 
  613 | test('Opportunity map layers explain complementarity and fair-place proposal uses entered limits, with no provider request', async ({page},testInfo)=>{
  614 |   await page.setViewportSize({width:390,height:844});await page.goto(`${baseUrl}/triangle.html#atlas`);
  615 |   await expect(page.locator('.atlas-marker')).toHaveCount(5);
  616 |   await page.locator('[data-layer="events"]').uncheck();await expect(page.locator('.atlas-marker')).toHaveCount(4);
  617 |   await page.locator('.atlas-marker').filter({hasText:'Noor'}).click();await expect(page.locator('#atlas-detail')).toContainText('Mara');await expect(page.locator('#atlas-detail')).toContainText('Leo');
  618 |   for(const [i,name,times]of [[0,'Місце A Zürich',[2,40,30]],[1,'Місце B Zürich',[20,20,20]],[2,'Місце C Zürich',[15,18,16]]]){
  619 |     await page.locator(`#place-${i}`).fill(name);for(let j=0;j<3;j++)await page.locator(`#minutes-${i}-${j}`).fill(String(times[j]));await page.locator(`#acceptable-${i}`).check();
  620 |   }
  621 |   await expect(page.locator('#place-form button[type=submit]')).toHaveCount(1);
  622 |   await page.locator('#place-form button[type=submit]').click();await expect(page.locator('#place-result')).toContainText('Місце C Zürich');
  623 |   const route=new URL(await page.locator('#place-result a').getAttribute('href'));expect(route.searchParams.get('destination')).toBe('Місце C Zürich');expect(route.searchParams.has('origin')).toBe(false);
  624 |   await page.locator('#limit-a').fill('1');await page.locator('#place-form button[type=submit]').click();await expect(page.locator('#place-result')).toHaveAttribute('data-state','no_feasible_place');
  625 |   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  626 |   const {default:AxeBuilder}=await import('@axe-core/playwright');const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  627 |   await page.screenshot({path:testInfo.outputPath('atlas-mobile.png'),fullPage:true});
  628 | });
  629 | 
  630 | test('Free launch displays a hypothetical usage-based map cost and restores existing presentation',async({page},testInfo)=>{
  631 |   await page.goto(`${baseUrl}/triangle.html#launch`);
  632 |   await page.locator('#scenario-members').fill('600');await expect(page.locator('#map-cost')).toContainText('$144.00 USD');
  633 |   await page.locator('#scenario-members').fill('0');await expect(page.locator('#map-cost')).toContainText('$0.00 USD');
  634 |   const {default:AxeBuilder}=await import('@axe-core/playwright');const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  635 |   await page.screenshot({path:testInfo.outputPath('launch-desktop.png'),fullPage:true});
  636 |   await page.locator('.more-modes > summary').click();
  637 |   await page.locator('.more-modes-links').getByRole('link',{name:'Як працює Synera',exact:true}).click();
  638 |   await expect(page.locator('#hero-title')).toBeVisible();
  639 | });
  640 | 
```