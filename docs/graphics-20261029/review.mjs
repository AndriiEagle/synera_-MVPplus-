import {chromium} from 'playwright';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('docs/graphics-20261029');
const browser=await chromium.launch({executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1500,height:1200},deviceScaleFactor:1});
 const files=(await readdir(`${out}/shots`)).filter(f=>f.endsWith('.png'));
 for(const[label,select,columns,width]of [['portraits',f=>f.includes('-portrait-'),10,140],['screens',f=>!f.includes('-portrait-')&&!f.startsWith('desktop'),4,340]]) {
  const tiles=await Promise.all(files.filter(select).map(async file=>`<figure><figcaption>${file}</figcaption><img src="data:image/png;base64,${(await readFile(`${out}/shots/${file}`)).toString('base64')}"></figure>`));
  await page.setContent(`<meta charset="utf-8"><style>body{margin:0;background:#15161d;color:#e7bd87;font:12px system-ui}.grid{display:grid;grid-template-columns:repeat(${columns},${width}px);gap:12px;padding:16px;align-items:start}figure{margin:0}img{width:100%;height:auto}figcaption{padding:8px 0}</style><div class="grid">${tiles.join('')}</div>`);
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.screenshot({path:`${out}/review-${label}.png`,fullPage:true});
 }
 // Rebuild the final contact sheet without depending on a live server.
 const keys=['mira','leo','nora','felix','ines','sam','tessa','noah','lina','omar'];
 const portraits=await Promise.all(keys.map(async key=>`<figure><img src="data:image/webp;base64,${(await readFile(`web_launch/persona-${key}.webp`)).toString('base64')}"><figcaption>${key} · Demo</figcaption></figure>`));
 await page.setViewportSize({width:1112,height:560});
 await page.setContent(`<meta charset="utf-8"><style>body{margin:0;background:#15161d;color:#e7bd87;font:16px system-ui}.grid{display:grid;grid-template-columns:repeat(5,200px);gap:16px;padding:24px}figure{margin:0}img{width:200px;height:200px;object-fit:cover}figcaption{padding:8px 0}</style><div class="grid">${portraits.join('')}</div>`);
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));await page.screenshot({path:`${out}/contact-sheet.png`});
 console.log(`Reviewed artifacts prepared: ${files.length} screenshots, 10 portraits.`);
}finally{await browser.close();}
