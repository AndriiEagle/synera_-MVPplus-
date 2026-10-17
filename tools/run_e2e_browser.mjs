import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runE2E() {
  console.log('C13.L3: E2E Browser Test against Mock Neon started...');
  
  // 1. Start the server
  const serverPath = path.join(__dirname, '..', 'web_launch', 'server.mjs');
  const serverProc = spawn('node', [serverPath], { env: { ...process.env, SYNERA_PORT: '0', NODE_ENV: 'test' } });
  
  let port = null;
  serverProc.stdout.on('data', data => {
    const output = data.toString();
    const match = output.match(/127\.0\.0\.1:(\d+)/);
    if (match) port = match[1];
  });
  
  // Wait for port to be assigned
  for (let i = 0; i < 50; i++) {
    if (port) break;
    await new Promise(r => setTimeout(r, 100));
  }
  
  if (!port) {
    serverProc.kill();
    throw new Error('Server failed to start');
  }
  
  console.log(`Test server running on port ${port}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle', timeout: 5000 });
    const content = await page.content();
    
    // Very basic check that Synera loaded
    assert.ok(content.includes('Synera') || content.includes('synera'), 'App should render Synera');
    console.log('✅ Synera loaded successfully in Playwright');
    
  } catch (err) {
    console.error(`❌ E2E Failed.`, err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    serverProc.kill();
  }
}

runE2E().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
