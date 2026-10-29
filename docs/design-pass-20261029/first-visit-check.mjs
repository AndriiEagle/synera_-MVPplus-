import {chromium,devices} from 'file:///C:/Users/Andrii/Desktop/synera-premium-pwa-variant/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const ctx=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await ctx.newPage();await page.goto('http://127.0.0.1:49711/',{waitUntil:'networkidle'});await page.waitForTimeout(800);
 assert.equal(await page.locator('.tour-panel').isHidden(),true,'a fresh first screen must keep its hero visible');
 assert.equal(await page.evaluate(()=>scrollY),0,'no automatic scroll away from the hero');
 await page.locator('.header-preferences > summary').click();await page.locator('#tour-start').click();
 assert.equal(await page.locator('.tour-panel').isVisible(),true,'the explicit tour still works');
 console.log('PASS: clean first visit; explicit Tour remains functional.');
}finally{await browser.close();}
