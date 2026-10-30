import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {privacyGate, REQUIREMENTS} from './privacy-gate.mjs';
import {scanClientBundle} from './check-client-bundle.mjs';
import {createErasureLedgerDouble} from './erasure-ledger.test-double.mjs';
import {writeKitArtifacts} from './pilot-deploy-kit.mjs';
const temp = path.resolve('tmp'); await fs.mkdir(temp, {recursive:true});
test('open gate fails closed on absent, empty, partial, string and false requirements', () => {
  const ready = {requirements:Object.fromEntries(REQUIREMENTS.map(k => [k,true]))};
  assert.equal(privacyGate(ready).openRegistration, true);
  for (const bad of [null, {}, {requirements:{}}, {requirements:{dpa_accepted:true}}]) assert.throws(() => privacyGate(bad), /BLOCKED/);
  for (const key of REQUIREMENTS) for (const value of [false, 'true', null, undefined]) assert.throws(() => privacyGate({requirements:{...ready.requirements, [key]:value}}), /BLOCKED/);
  assert.equal(privacyGate(null, 'closed-pilot').openRegistration, false);
  assert.throws(() => privacyGate(ready, 'typo'));
  assert.equal(spawnSync(process.execPath, ['tools/privacy-gate.mjs']).status, 1);
});
test('bundle scanner accepts clean files and rejects secrets nested/in any extension without echo', async () => {
  const dir = await fs.mkdtemp(path.join(temp, 'bundle-'));
  try {
    await assert.rejects(scanClientBundle(dir), /No bundle/);
    await fs.writeFile(path.join(dir, 'index.html'), '<p>Demo</p>');
    assert.equal((await scanClientBundle(dir)).files,1);
    await fs.mkdir(path.join(dir,'nested'));
    for (const secret of ['postgresql://fake:fake@localhost/db', '-----BEGIN PRIVATE KEY-----', 'sk-proj-'+'a'.repeat(25), 'NEON_API_KEY']) {
      await fs.writeFile(path.join(dir,'nested','payload'), secret);
      await assert.rejects(scanClientBundle(dir), e => /Bundle secret pattern/.test(e.message) && !e.message.includes(secret));
    }
    const cli=spawnSync(process.execPath,['tools/check-client-bundle.mjs',dir],{encoding:'utf8'});
    assert.equal(cli.status,1); assert.doesNotMatch(cli.stderr,/NEON_API_KEY/);
    await assert.rejects(scanClientBundle(path.join(dir,'missing')), /ENOENT/);
  } finally { await fs.rm(dir,{recursive:true,force:true}); }
});
test('erasure intent survives simulated database restore and retry, with no raw subjects', () => {
  const ledger=createErasureLedgerDouble('test-double-key-'.repeat(4));
  assert.equal(ledger.assertRestoreSafe(['Demo-other']),true);
  const hash=ledger.intent('Demo-deleted'); assert.equal(ledger.intent('Demo-deleted'),hash);
  assert.throws(() => ledger.assertRestoreSafe(['Demo-deleted']),/Restore blocked/);
  assert.doesNotMatch(JSON.stringify(ledger.snapshot()),/Demo-deleted/);
  ledger.complete('Demo-deleted'); assert.throws(() => ledger.assertRestoreSafe(['Demo-deleted']),/Restore blocked/);
  assert.equal(ledger.snapshot().length,1); assert.throws(() => ledger.complete('missing'),/Intent/);
});
test('last kit step blocks open output, preserves existing output and packages closed pilot', async () => {
  const out=await fs.mkdtemp(path.join(temp,'gate-kit-'));
  try {
    const args={out,artifacts:new Map([['upload.zip',Buffer.from('Demo fixture')]]),manifest:{published:false}};
    await assert.rejects(writeKitArtifacts({...args,audience:'open-registration'}),/BLOCKED/);
    assert.deepEqual(await fs.readdir(out),[]);
    await writeKitArtifacts(args);
    assert.equal(JSON.parse(await fs.readFile(path.join(out,'manifest.json'))).release_audience,'closed-pilot');
    const original=await fs.readFile(path.join(out,'upload.zip'));
    await assert.rejects(writeKitArtifacts({...args,audience:'open-registration',artifacts:new Map([['upload.zip','changed']])}),/BLOCKED/);
    assert.deepEqual(await fs.readFile(path.join(out,'upload.zip')),original);
    const ready=path.join(out,'ready.json'); await fs.writeFile(ready,JSON.stringify({requirements:Object.fromEntries(REQUIREMENTS.map(k=>[k,true]))}));
    await writeKitArtifacts({...args,audience:'open-registration',readiness:ready});
    assert.equal(JSON.parse(await fs.readFile(path.join(out,'manifest.json'))).release_audience,'open-registration');
  } finally {await fs.rm(out,{recursive:true,force:true});}
});


test('server _worker.js may name secret bindings but never carry a secret value; client files may not even name them', async () => {
  const fsp = await import('node:fs/promises'), os = await import('node:os'), p = await import('node:path');
  const dir = await fsp.mkdtemp(p.join(os.tmpdir(), 'bundle-worker-'));
  try {
    await fsp.writeFile(p.join(dir, '_worker.js'), 'const k = env.OPENROUTER_API_KEY;');
    assert.equal((await scanClientBundle(dir)).status, 'PATTERN_SCAN_PASS');
    await fsp.writeFile(p.join(dir, '_worker.js'), 'const k = "sk-or-v1-' + 'a'.repeat(32) + '";');
    await assert.rejects(scanClientBundle(dir), /provider-token/);
    await fsp.writeFile(p.join(dir, '_worker.js'), 'ok');
    await fsp.writeFile(p.join(dir, 'app.mjs'), 'const k = env.OPENROUTER_API_KEY;');
    await assert.rejects(scanClientBundle(dir), /secret-binding/);
  } finally { await fsp.rm(dir, { recursive: true, force: true }); }
});
