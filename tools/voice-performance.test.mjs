import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

test('performance audit bounds a server that never announces readiness and kills its owned PID', () => {
  mkdirSync('tmp', { recursive:true });
  writeFileSync('tmp/voice-hanging-server.mjs', 'setInterval(() => {}, 1000);');
  const result = spawnSync(process.execPath, ['tools/voice-performance.mjs','timeout-check'], {
    env:{ ...process.env, VOICE_AUDIT_SERVER:'tmp/voice-hanging-server.mjs', VOICE_AUDIT_TIMEOUT_MS:'700' },
    encoding:'utf8', timeout:10000,
  });
  assert.equal(result.status,124, result.stderr);
  assert.match(result.stderr,/deadline exceeded/);
  const { pid } = JSON.parse(readFileSync('tmp/voice-performance-timeout-check-server.json','utf8'));
  assert.throws(()=>process.kill(pid,0), { code:'ESRCH' });
});

test('performance audit reports a server startup failure without waiting for browser readiness', () => {
  const result = spawnSync(process.execPath, ['tools/voice-performance.mjs','startup-check'], {
    env:{ ...process.env, VOICE_AUDIT_SERVER:'tmp/voice-server-does-not-exist.mjs', VOICE_AUDIT_TIMEOUT_MS:'10000' },
    encoding:'utf8', timeout:15000,
  });
  assert.equal(result.status,1, result.stderr);
  assert.match(result.stderr,/Audit server exited 1/);
  assert.doesNotMatch(result.stderr,/deadline exceeded/);
});
