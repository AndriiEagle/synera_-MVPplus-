import { chromium } from 'playwright';
import { readFile, readdir } from 'node:fs/promises';
const out=import.meta.dirname;
const files=(await readdir(`${out}/shots`)).sort();
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
  const page=await browser.newPage();
  for(const [name,selected,columns,width] of [
    ['review-scene-slots',files.filter(f=>f.endsWith('-scene.png')),4,320],
    ['review-staged-first',files.filter(f=>f.endsWith('-staged-first.png')),3,260]
  ]){
    const images=await Promise.all(selected.map(async file=>({file,data:(await readFile(`${out}/shots/${file}`)).toString('base64')})));
    await page.setViewportSize({width:columns*(width+20)+20,height:900});
    await page.setContent(`<meta charset="utf-8"><style>body{margin:0;padding:20px;background:#15161d;color:#e7bd87;font:12px system-ui}.grid{display:grid;grid-template-columns:repeat(${columns},${width}px);gap:20px}figure{margin:0;overflow-wrap:anywhere}img{display:block;width:100%;height:auto}figcaption{padding:8px 0}</style><div class="grid">${images.map(({file,data})=>`<figure><img src="data:image/png;base64,${data}"><figcaption>${file}</figcaption></figure>`).join('')}</div>`);
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
    await page.screenshot({path:`${out}/${name}.png`,fullPage:true});
  }
}finally{await browser.close();}
