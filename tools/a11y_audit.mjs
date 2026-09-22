import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runAudit() {
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
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
      
    if (results.violations.length > 0) {
      console.log('A11y Violations:');
      results.violations.forEach(v => {
        console.log(`- ${v.id}: ${v.description}`);
        console.log(`  Impact: ${v.impact}`);
        v.nodes.forEach(n => console.log(`  Node: ${n.html}`));
      });
      process.exitCode = 1;
    } else {
      console.log('WCAG 2.2 AA Audit Passed!');
    }
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await browser.close();
    serverProc.kill();
  }
}

runAudit();
