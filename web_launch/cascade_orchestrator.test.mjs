import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, SYNERA_PORT: port }, cwd: __dirname });
    let text = '';
    let errors = '';
    const timer = setTimeout(() => reject(new Error(`Server failed to start. stderr: ${errors}`)), 20000);
    server.stdout.on('data', data => {
      text += data.toString();
      if (text.includes(`127.0.0.1:${port}`)) { clearTimeout(timer); resolve(server); }
    });
    server.stderr.on('data', data => { errors += data.toString(); });
    server.on('error', error => { clearTimeout(timer); reject(error); });
    server.on('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}. stderr: ${errors}`)); });
  });
}

test('Iceberg Cascade Orchestrator - deploy and stream', async (t) => {
  const port = 8011;
  const server = await startServer(port);
  let req;

  try {
    // 1. Connect to SSE
    const messages = [];
    req = http.request(`http://127.0.0.1:${port}/api/cascade/stream`, { headers: { Accept: 'text/event-stream' } }, (res) => {
      res.on('data', chunk => {
        const str = chunk.toString();
        if (str.startsWith('data: ')) {
          messages.push(JSON.parse(str.replace('data: ', '').trim()));
        }
      });
    });
    // Teardown of the long-lived SSE socket is expected when the server is killed.
    req.on('error', () => {});
    req.end();

    // Wait for initial state
    await new Promise(r => setTimeout(r, 200));

    // 2. Deploy new state
    const newState = {
      tokens: { '--synera-primary': '#ff0000', '--synera-bg': '#000000', '--synera-text': '#ffffff' },
      layout: ['pricing', 'hero']
    };
    
    const deployRes = await fetch(`http://127.0.0.1:${port}/api/cascade/deploy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newState)
    });
    assert.equal(deployRes.status, 200);

    // Wait for SSE broadcast
    await new Promise(r => setTimeout(r, 200));

    // 3. Verify state
    const lastMsg = messages[messages.length - 1];
    assert.ok(lastMsg);
    assert.equal(lastMsg.tokens['--synera-primary'], '#ff0000');
    assert.deepEqual(lastMsg.layout, ['pricing', 'hero']);
  } finally {
    if (req) req.destroy();
    server.kill();
  }
});
