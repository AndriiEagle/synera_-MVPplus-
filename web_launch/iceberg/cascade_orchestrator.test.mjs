// C15.L5 — тести Cascade Orchestrator. Запуск з КОРЕНЯ: node web_launch/iceberg/cascade_orchestrator.test.mjs
// Лог у ТИМЧАСОВОМУ каталозі (os.tmpdir) — реальний iceberg/cascade_log.jsonl з тестів не пишеться.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createOrchestrator, verifyLog, selectTemplate, GENESIS } from './cascade_orchestrator.mjs';

function tmpLog() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cascade-test-'));
  return path.join(dir, 'cascade_log.jsonl');
}

const FIXED_NOW = () => '2026-09-22T12:00:00.000Z';

test('C15.L5: Template Selector — детермінована мапа рівнів (канон §2.2)', () => {
  assert.deepEqual(selectTemplate('L1'), ['select', 'forge', 'preview', 'confirm', 'deploy', 'log']);
  assert.deepEqual(selectTemplate('L2'), ['select', 'forge', 'reorder', 'preview', 'confirm', 'deploy', 'log']);
  assert.deepEqual(selectTemplate('L3'), ['select', 'theme', 'preview', 'confirm', 'deploy', 'log']);
  assert.throws(() => selectTemplate('L9'), /Некоректна гіпотеза каскаду/);
});

test('C15.L5: fromHypothesis — детермінований план зі стабільним sha256', () => {
  const o = createOrchestrator({ now: FIXED_NOW, logPath: tmpLog() });
  const a = o.fromHypothesis({ level: 'L1', hypothesis: { metric: 'matching dropoff', dropoff: 0.34 }, proposal: {} });
  const o2 = createOrchestrator({ now: FIXED_NOW });
  const b = o2.fromHypothesis({ level: 'L1', hypothesis: { metric: 'matching dropoff', dropoff: 0.34 }, proposal: {} });
  assert.equal(a.id, b.id, 'однаковий вхід → той самий id');
  assert.equal(a.sha256, b.sha256);
  assert.ok(a.sha256.length === 64);
  assert.ok(a.steps.includes('forge'));
});

test('C15.L5: fail-closed гіпотеза — dropoff <= 0 і L2 без когорти (українська помилка)', () => {
  const o = createOrchestrator({ logPath: tmpLog() });
  assert.throws(() => o.fromHypothesis({ level: 'L1', hypothesis: { dropoff: 0 }, proposal: {} }), /dropoff має бути > 0/);
  assert.throws(() => o.fromHypothesis({ level: 'L1', hypothesis: { dropoff: -0.2 }, proposal: {} }), /Некоректна гіпотеза каскаду/);
  assert.throws(() => o.fromHypothesis({ level: 'L2', hypothesis: { dropoff: 0.3 }, proposal: {} }), /для L2 потрібна когорта/);
});

test('C15.L5: preview — два варіанти A/B, консервативний = baseline, агресивний = proposal', () => {
  const o = createOrchestrator({ now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L1', hypothesis: { dropoff: 0.1 }, proposal: { tokens: { '--color-green-primary': '#19513e' } } });
  const p = o.preview(plan.id);
  assert.equal(p.variants.length, 2);
  assert.deepEqual(p.variants.map(v => v.id), ['A', 'B']);
  assert.equal(p.variants[0].tokens['--color-green-primary'], '#254f3b');
  assert.equal(p.variants[1].tokens['--color-green-primary'], '#19513e');
  assert.equal(p.requiresOperatorConfirm, true);
  // детермінізм
  const p2 = o.preview(plan.id);
  assert.equal(p.variants[0].sha256, p2.variants[0].sha256);
  assert.notEqual(p.variants[0].sha256, p.variants[1].sha256);
});

test('C15.L5: preview reject варіант, що ламає WCAG AA (світлий текст на світлому фоні)', () => {
  const o = createOrchestrator({ now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L1', hypothesis: { dropoff: 0.1 }, proposal: { tokens: { '--color-green-primary': '#94ad66' } } });
  assert.throws(() => o.preview(plan.id), /WCAG AA/);
});

test('C15.L5: preview — план не знайдений → fail-closed', () => {
  const o = createOrchestrator({ logPath: tmpLog() });
  assert.throws(() => o.preview('plan-nope'), /план не знайдений/);
});

test('C15.L5: confirm вимагає operatorId — тихих змін немає (канон §4.3)', () => {
  const o = createOrchestrator({ now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L2', cohort: 'designers', hypothesis: { dropoff: 0.34 }, proposal: {} });
  assert.throws(() => o.confirm(plan.id, ''), /Потрібне підтвердження оператора/);
  assert.throws(() => o.confirm(plan.id, undefined), /Потрібне підтвердження оператора/);
  const c = o.confirm(plan.id, 'andrii');
  assert.equal(c.state, 'confirmed');
});

test('C15.L5: deploy без confirm відкидається', async () => {
  const o = createOrchestrator({ logPath: tmpLog(), now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L2', cohort: 'designers', hypothesis: { dropoff: 0.34 }, proposal: {} });
  await assert.rejects(() => o.deployAndLog(plan.id, 'andrii'), /Потрібне підтвердження оператора/);
});

test('C15.L5: deployAndLog — один запис з artifact_sha256, changed_paths, без PII', async () => {
  const logPath = tmpLog();
  const o = createOrchestrator({ logPath, now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L2', cohort: 'designers', hypothesis: { metric: 'funnel', dropoff: 0.34 }, proposal: {} });
  o.confirm(plan.id, 'andrii');
  const entry = await o.deployAndLog(plan.id, 'andrii');
  assert.equal(entry.seq, 1);
  assert.equal(entry.prev_hash, GENESIS);
  assert.ok(entry.payload.artifact_sha256.length === 64);
  assert.deepEqual(entry.payload.changed_paths, ['tokens', 'layout']);
  assert.equal(entry.payload.operatorId, 'andrii');
  const text = fs.readFileSync(logPath, 'utf8');
  for (const pii of ['email', 'phone', 'display_name']) assert.ok(!text.includes(pii), pii);
  for (const gate of ['visibility', 'recording', 'external_ai']) assert.ok(!text.includes('"' + gate + '"'), gate);
});

test('C15.L5: hash-ланцюг верифікується; тампірінг ловиться на конкретному рядку', async () => {
  const logPath = tmpLog();
  const o = createOrchestrator({ logPath, now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L2', cohort: 'designers', hypothesis: { dropoff: 0.34 }, proposal: {} });
  o.confirm(plan.id, 'andrii');
  await o.deployAndLog(plan.id, 'andrii');
  await o.rollbackLast();
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, 2);
  assert.deepEqual(verifyLog(lines), { pass: true, brokenAt: null });
  // тампірінг payload першого запису ламає entry_hash
  const tampered = [...lines];
  const e0 = JSON.parse(tampered[0]);
  e0.payload.operatorId = 'attacker';
  tampered[0] = JSON.stringify(e0);
  assert.deepEqual(verifyLog(tampered), { pass: false, brokenAt: 0 });
  // розрив ланцюга: підміна prev_hash другого рядка
  const broken = [...lines];
  const e1 = JSON.parse(broken[1]);
  e1.prev_hash = 'GENESIS';
  broken[1] = JSON.stringify(e1);
  assert.deepEqual(verifyLog(broken), { pass: false, brokenAt: 1 });
});

test('C15.L5: rollbackLast — audit-запис з system-rollback і prev_hash попереднього', async () => {
  const logPath = tmpLog();
  const o = createOrchestrator({ logPath, now: FIXED_NOW });
  const plan = o.fromHypothesis({ level: 'L3', hypothesis: { dropoff: 0.5 }, proposal: {} });
  o.confirm(plan.id, 'andrii');
  await o.deployAndLog(plan.id, 'andrii');
  const rb = await o.rollbackLast();
  assert.equal(rb.payload.operatorId, 'system-rollback');
  assert.deepEqual(rb.payload.changed_paths, ['rollback']);
  assert.equal(rb.seq, 2);
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.deepEqual(verifyLog(lines), { pass: true, brokenAt: null });
});

test('C15.L5: повний каскад L2 end-to-end — hypothesis → preview → confirm → deploy → verify', async () => {
  const logPath = tmpLog();
  let deployed = null;
  const o = createOrchestrator({ logPath, now: FIXED_NOW, deploy: async plan => { deployed = plan.id; } });
  const plan = o.fromHypothesis({ level: 'L2', cohort: 'designers', hypothesis: { metric: 'matching dropoff', dropoff: 0.34 }, proposal: { tokens: { '--color-green-primary': '#19513e' } } });
  const pv = o.preview(plan.id);
  assert.equal(pv.requiresOperatorConfirm, true);
  o.confirm(plan.id, 'andrii');
  const entry = await o.deployAndLog(plan.id, 'andrii');
  assert.equal(deployed, plan.id, 'runtime-деплой викликаний');
  assert.equal(entry.payload.changed_paths.includes('layout'), true);
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.deepEqual(verifyLog(lines), { pass: true, brokenAt: null });
});

test('C15.L5: повний каскад L2 end-to-end через інʼєкції (deploy/rollback фейкові)', async () => {
  const logPath = tmpLog();
  let deployed = null, rolled = false;
  const o = createOrchestrator({
    logPath,
    now: FIXED_NOW,
    deploy: async plan => { deployed = plan; },
    rollback: async () => { rolled = true; },
  });
  const plan = o.fromHypothesis({ level: 'L2', cohort: 'designers', hypothesis: { metric: 'matching_dropoff', dropoff: 0.34 }, proposal: {} });
  const p = o.preview(plan.id);
  assert.equal(p.requiresOperatorConfirm, true);
  o.confirm(plan.id, 'andrii');
  const entry = await o.deployAndLog(plan.id, 'andrii');
  assert.ok(deployed && deployed.id === plan.id);
  assert.ok(entry.payload.changed_paths.includes('layout'));
  const rb = await o.rollbackLast();
  assert.equal(rolled, true);
  assert.equal(rb.payload.operatorId, 'system-rollback');
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.deepEqual(verifyLog(lines), { pass: true, brokenAt: null });
});