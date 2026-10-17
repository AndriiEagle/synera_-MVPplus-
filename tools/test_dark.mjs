import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTest() {
  const serverPath = path.join(__dirname, '..', 'web_launch', 'server.mjs');
  const serverProc = spawn('node', [serverPath], { env: { ...process.env, SYNERA_PORT: '0', NODE_ENV: 'test' } });
  
  let port = null;
  serverProc.stdout.on('data', data => {
    const output = data.toString();
    const match = output.match(/127\.0\.0\.1:(\d+)/);
    if (match) port = match[1];
  });
  
  for (let i = 0; i < 50; i++) {
    if (port) break;
    await new Promise(r => setTimeout(r, 100));
  }
  
  if (!port) {
    serverProc.kill();
    throw new Error('Server failed to start');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(`http://127.0.0.1:${port}/catalogue.html`);
    
    const bodyBgLight = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    // wait for layout
    await new Promise(r => setTimeout(r, 50));
    
    const bodyBgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    
    console.log('Light BG:', bodyBgLight);
    console.log('Dark BG:', bodyBgDark);
    
    if (bodyBgLight === bodyBgDark) {
      console.error('BG color did not change when class="dark" was added!');
      process.exitCode = 1;
    } else {
      console.log('Dark mode toggle works!');
    }
    
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    serverProc.kill();
  }
}

runTest();
