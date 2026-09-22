// C15.L6 — тести Operator Dashboard Integration. Запуск з КОРЕНЯ: node web_launch/iceberg/operator_dashboard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COHORTS, listCohorts, composePreview, auditLine, auditTrail, makeAuditEntry, renderPreviewPanel, batchPreview } from './operator_dashboard.mjs';

test('C15.L6: когорти заморожені і згідні з каноном §4.1 (designers/sales/winterthur-devs)', () => {
  assert.ok(Object.isFrozen(COHORTS));
  assert.deepEqual(listCohorts().map(c => c.id), ['designers', 'sales', 'winterthur-devs']);
  for (const c of listCohorts()) assert.ok(Object.isFrozen(c));
});

test('C15.L6: composePreview детермінований, sha256 стабільний, requiresOperatorConfirm=true', () => {
  const a = composePreview('designers', { layoutOrder: ['profile', 'welcome', 'people', 'meetings', 'settings'] });
  const b = composePreview('designers', { layoutOrder: ['profile', 'welcome', 'people', 'meetings', 'settings'] });
  assert.equal(a.sha256, b.sha256);
  assert.equal(a.level, 'L2');
  assert.equal(a.requiresOperatorConfirm, true);
  assert.equal(a.plan.mapStyle, 'schematic', 'default з когорти');
  assert.equal(a.plan.layoutOrder[0], 'profile', 'portfolio first — канон §4.1');
});

test('C15.L6: невідома когорта — українська доменна помилка', () => {
  assert.throws(() => composePreview('aliens'), /Невідома когорта/);
});

test('C15.L6: layoutOrder — валідна перестановка канонічного набору, інакше fail-closed', () => {
  assert.throws(() => composePreview('sales', { layoutOrder: ['profile', 'welcome', 'people', 'meetings'] }), /Некоректний порядок|перестановкою|Невідома/);
  assert.throws(() => composePreview('sales', { layoutOrder: ['welcome', 'welcome', 'people', 'profile', 'settings'] }), /перестановкою/);
  const ok = composePreview('sales', { layoutOrder: ['welcome', 'people', 'profile', 'meetings', 'settings'] });
  assert.deepEqual(ok.plan.layoutOrder, ['welcome', 'people', 'profile', 'meetings', 'settings']);
});

test('C15.L6: невідома карта-підкладка у intent — fail-closed', () => {
  assert.throws(() => composePreview('sales', { mapStyle: 'hologram' }), /Невідома карта-підкладка/);
});

test('C15.L6: renderPreviewPanel — українські лейбли і підтвердження оператора', () => {
  const p = composePreview('designers', { layoutOrder: ['welcome', 'people', 'profile', 'meetings', 'settings'] });
  const panel = renderPreviewPanel(p);
  assert.ok(panel.includes('Когорта: designers'));
  assert.ok(panel.includes('Порядок екранів:'));
  assert.ok(panel.includes('Карта: schematic'));
  assert.ok(panel.includes('Потрібне підтвердження оператора: так'));
});

test('C15.L6: batchPreview — 3 дозволені, 4 відкидаються з українською помилкою', () => {
  const three = batchPreview(['sales', 'designers', 'winterthur-devs']);
  assert.equal(three.length, 3);
  assert.deepEqual(three.map(p => p.cohort), ['designers', 'sales', 'winterthur-devs'], 'порядок COHORTS');
  assert.throws(() => batchPreview(['sales', 'designers', 'winterthur-devs', 'sales']), /Максимум 3 когорти/);
  assert.throws(() => batchPreview(Array(4).fill('sales')), /Максимум 3 когорти/);
});

test('C15.L6: auditLine — канонічний рядок з відсортованими ключами', () => {
  const line = auditLine({ cohortId: 'sales', decision: 'previewed', intentId: 'i-1', operatorId: 'andrii', sha256: 'abc', prev_hash: 'GENESIS', ts: '2026-09-22T12:00:00.000Z' });
  const keys = Object.keys(JSON.parse(line));
  assert.deepEqual(keys, [...keys].sort());
  assert.equal(JSON.parse(line).decision, 'previewed');
});

test('C15.L6: auditTrail — чистий ланцюг валідний, тампірінг ловиться за індексом', () => {
  const e1 = makeAuditEntry({ ts: '2026-09-22T12:00:00.000Z', cohortId: 'sales', intentId: 'i-1', decision: 'previewed', sha256: 'abc', operatorId: 'andrii', prevHash: 'GENESIS' });
  const e2 = makeAuditEntry({ ts: '2026-09-22T12:01:00.000Z', cohortId: 'sales', intentId: 'i-1', decision: 'confirmed', sha256: 'abc', operatorId: 'andrii', prevHash: e1.entry_hash });
  const trail = [e1, e2];
  assert.deepEqual(auditTrail(trail), { chainValid: true, brokenAt: null });
  const tampered = [{ ...e1, ts: '2020-01-01T00:00:00.000Z' }, e2];
  assert.deepEqual(auditTrail(tampered), { chainValid: false, brokenAt: 0 });
});

test('C15.L6: composePreview з невалідним layoutOrder НЕ проходить (fail-closed до деплою)', () => {
  assert.throws(() => composePreview('winterthur-devs', { layoutOrder: ['people'] }), /перестановкою|Невідома/);
});

// Інваріант канону: dashboard не імпортує sibling-модулі напряму (слабка звʼязність)
// і не мутує consentState.
test('C15.L6: інваріант — без імпорту sibling-модулів, без мутацій consentState', () => {
  const src = fs.readFileSync(new URL('./operator_dashboard.mjs', import.meta.url), 'utf8');
  assert.ok(!src.includes("from './token_forge.mjs'"));
  assert.ok(!src.includes("from './cascade_orchestrator.mjs'"));
  assert.ok(!src.includes('consentState'), 'мутації consentState заборонені');
});