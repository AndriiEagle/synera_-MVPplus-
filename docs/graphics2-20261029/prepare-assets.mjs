// Built-in image_gen originals are preserved; this is only deterministic raster sizing/encoding.
import { chromium } from 'playwright';
import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const names = ['summit','studio','triangle','real-journey','rooms','simulation','privacy','legal','get','empty'];
const generated = JSON.parse(await readFile(resolve(import.meta.dirname,'generation.json'),'utf8'));
await mkdir(resolve(import.meta.dirname,'sources'),{recursive:true});
const browser = await chromium.launch({headless:true,executablePath:process.env.SYNERA_CHROMIUM_EXECUTABLE || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page = await browser.newPage();
const evidence = [];
try {
  for (const [i,name] of names.entries()) {
    const source = generated[i].hint.match(/as (C:\\[^\n]+\.png) by default/)[1];
    const sourceFile = resolve(import.meta.dirname,`sources/scene-${name}.png`);
    await copyFile(source,sourceFile);
    const png = await readFile(sourceFile);
    for (const width of [768,1536]) {
      const encoded = await page.evaluate(async ({data,width}) => {
        const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = width*2/3;
        canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
        return canvas.toDataURL('image/webp',.88).split(',')[1];
      },{data:png.toString('base64'),width});
      const bytes = Buffer.from(encoded,'base64');
      if(width===768 && bytes.length>140000) throw new Error(`${name} exceeds 140 KB`);
      const file = `scene-${name}${width===1536?'@2x':''}.webp`;
      await writeFile(resolve(root,'web_launch',file),bytes);
      evidence.push({file,width,height:width*2/3,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),sourceSha256:createHash('sha256').update(png).digest('hex')});
    }
  }
  const images=await Promise.all(names.map(async name=>({name,data:(await readFile(resolve(root,`web_launch/scene-${name}.webp`))).toString('base64')})));
  await page.setViewportSize({width:1440,height:1216});
  await page.setContent(`<meta charset="utf-8"><style>body{margin:0;background:#15161d;color:#dec59c;font:18px system-ui}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:24px}figure{margin:0}img{width:100%;height:auto;display:block}figcaption{padding:8px 0}</style><div class="grid">${images.map(({name,data})=>`<figure><img src="data:image/webp;base64,${data}"><figcaption>${name}</figcaption></figure>`).join('')}</div>`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  await page.screenshot({path:resolve(import.meta.dirname,'contact-sheet.png'),fullPage:true});
  await writeFile(resolve(import.meta.dirname,'asset-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify(evidence.map(({file,bytes})=>({file,bytes}))));
} finally {await browser.close();}
