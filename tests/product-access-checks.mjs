import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
export async function checkAccessPage(page, { width, language, base, screenshot }) {
    await page.setViewportSize({ width, height: 900 });
    const unexpected = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const request = route.request();
      if (!request.url().startsWith(base + '/') || request.method() !== 'GET' || /\/api\//.test(request.url())) {
        unexpected.push(request.url()); return route.abort();
      }
      if (process.env.SYNERA_ACCESS_MUTATION === 'demo-primary' && new URL(request.url()).pathname === '/get.html') {
        const response = await route.fetch();
        return route.fulfill({ response, body: (await response.text()).replace('id="open-studio-app" class="small-link"', 'id="open-studio-app" class="primary"') });
      }
      return route.continue();
    });
    await page.goto(`${base}/get.html`);
    await page.locator('#access-language').selectOption(language);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    // One visual primary entry, encountered before demos in reading/tab order.
    await expect(page.locator('main a.primary')).toHaveCount(1);
    await expect(page.locator('main a').first()).toHaveAttribute('href', 'https://synera-pilot.pages.dev/');
    await expect(page.locator('main a.primary')).toHaveAttribute('id', 'open-live-app');
    await expect(page.locator('#payment-availability')).toContainText('CHF 0');
    await expect(page.locator('#payment-availability')).toHaveAttribute('data-state', 'free-pilot');
    await expect(page.locator('#pricing-scenario')).toContainText('CHF 12');
    await expect(page.locator('#pricing-scenario a, #pricing-scenario button, #pricing-scenario input')).toHaveCount(0);
    await expect(page.locator('#pricing-scenario')).toContainText(/scenario|Szenario|Сценарій/i);
    await expect(page.locator('#feedback-note')).toContainText(/optional|freiwillig|добровільний/);
    await expect(page.locator('#open-studio-app')).toHaveAttribute('href', '/studio.html');
    await expect(page.locator('#open-demo-journey')).toHaveAttribute('href', '/studio-journey.html');
    for (const platform of ['android', 'ios']) {
      await page.locator(`[data-platform="${platform}"] summary`).click();
      await expect(page.locator(`[data-platform="${platform}"]`)).toHaveAttribute('open', '');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const translations = await page.locator('[data-product-copy]').allTextContents();
    expect(translations.every(text => text.trim() && text !== 'undefined')).toBe(true);
    if (language !== 'uk') expect((await page.locator('main').innerText()).match(/[А-Яа-яІіЇїЄє]/)).toBeNull();
    await expect(page.locator('form, iframe, a[href*="stripe"], a[href*="paypal"], input[type="email"]')).toHaveCount(0);
    expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
    expect(unexpected).toEqual([]);
    expect(errors).toEqual([]);
    // Capture the reading state at the top, not a scrolled/focused audit state.
    await page.locator('h1').click();
    await page.evaluate(() => window.scrollTo(0, 0));
    const ctaText = { en: 'Open Synera ↗', de: 'Synera öffnen ↗', uk: 'Відкрити Synera ↗' };
    await expect(page.locator('#open-live-app')).toHaveText(ctaText[language]);
    const hitTarget = await page.locator('#open-live-app').evaluate(link => {
      const rect = link.getBoundingClientRect();
      return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('a')?.id;
    });
    expect(hitTarget).toBe('open-live-app');
    await page.screenshot({ path: screenshot, fullPage: true });
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(audit.violations).toEqual([]);
    // Follow the primary link into an explicit local fixture: no live-pilot request.
    await page.route('https://synera-pilot.pages.dev/', route => route.fulfill({ contentType: 'text/html', body: '<h1>Pilot destination fixture</h1>' }));
    await page.locator('#open-live-app').click();
    await expect(page).toHaveURL('https://synera-pilot.pages.dev/');
    await expect(page.locator('h1')).toHaveText('Pilot destination fixture');
}
