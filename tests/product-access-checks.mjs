import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
export async function checkAccessPage(page, { width, language, base, screenshot }) {
  await page.setViewportSize({ width, height:900 });
  const unexpected=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
    const request=route.request();
    if(!request.url().startsWith(base+'/')||request.method()!=='GET'||/\/api\//.test(request.url())){unexpected.push(request.url());return route.abort();}
    if(process.env.SYNERA_ACCESS_MUTATION==='demo-primary'&&new URL(request.url()).pathname==='/get.html'){
      const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('id="open-demo-journey"','class="primary" id="open-demo-journey"')});
    }
    return route.continue();
  });
  await page.goto(`${base}/get.html`);
  await page.locator('.header-preferences > summary').click();await page.locator('#site-language').selectOption(language);await page.locator('.header-preferences > summary').click();
  await expect(page.locator('html')).toHaveAttribute('lang',language);
  await expect(page.locator('main a.primary')).toHaveCount(1);
  await expect(page.locator('main a.primary')).toHaveAttribute('id','install-primary');
  expect(new URL(await page.locator('#install-primary').getAttribute('href'),base).href).toBe(`${base}/?draft=1&lang=${language}`);
  await expect(page.locator('#phone-qr svg')).toBeVisible();
  await page.locator('.get-more > summary').click();
  await expect(page.locator('#payment-availability')).toContainText('CHF 0');
  await expect(page.locator('#payment-availability')).toHaveAttribute('data-state','free-pilot');
  await expect(page.locator('#pricing-scenario')).toContainText('CHF 12');
  await expect(page.locator('#pricing-scenario a,#pricing-scenario button,#pricing-scenario input')).toHaveCount(0);
  await expect(page.locator('#pricing-scenario')).toContainText(/scenario|Szenario|Сценарій/i);
  await expect(page.locator('#feedback-note')).toContainText(/optional|freiwillig|добровільний/);
  await expect(page.locator('#open-demo-journey')).toHaveAttribute('href',`/simulation.html?lang=${language}`);
  await page.locator('#manual-install').click();
  for(const platform of ['ios','android']){
    await page.locator(`#guide-${platform}`).click();
    await expect(page.locator(`[data-platform="${platform}"]`)).toBeVisible();
  }
  await page.locator('#install-guide-close').click();await page.locator('.get-more > summary').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const translations=await page.locator('[data-product-copy],[data-get-copy]').allTextContents();
  expect(translations.every(t=>t.trim()&&t!=='undefined')).toBe(true);
  if(language!=='uk')expect(await page.locator('main').innerText()).not.toMatch(/[А-Яа-яІіЇїЄє]/);
  await expect(page.locator('form,iframe,a[href*="stripe"],a[href*="paypal"],input[type="email"]')).toHaveCount(0);
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
  expect(unexpected).toEqual([]);expect(errors).toEqual([]);
  await page.evaluate(()=>scrollTo(0,0));
  const hit=await page.locator('#install-primary').evaluate(a=>{const r=a.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('a')?.id;});
  expect(hit).toBe('install-primary');
  await page.screenshot({path:screenshot,fullPage:true});
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(audit.violations).toEqual([]);
  await page.locator('#install-primary').click();await expect(page.locator('#install-guide')).toBeVisible();
  await page.locator('#install-guide-close').click();
  await page.locator('#continue-browser').click();await expect(page).toHaveURL(`${base}/?draft=1&lang=${language}`);
  await expect(page.locator('#profile-form')).toBeVisible();
}
