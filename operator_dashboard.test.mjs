import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDashboard, renderDashboardHtml } from './operator_dashboard.mjs';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

const now = new Date();
const iso = (hoursAgo) => new Date(now.getTime() - hoursAgo * 3600 * 1000).toISOString();

const FIXTURE_EVENTS = [
  // real events (all within last 24h)
  { type: 'profile_started', at: iso(10), source: 'real', properties: { pair_id: 'p1', profile_id: 'u1', mode: 'exchange' } },
  { type: 'profile_completed', at: iso(9), source: 'real', properties: { pair_id: 'p1', profile_id: 'u1', mode: 'exchange' } },
  { type: 'profile_started', at: iso(8), source: 'real', properties: { pair_id: 'p2', profile_id: 'u2', mode: 'paid_service' } },
  { type: 'case_created', at: iso(7), source: 'real', properties: { pair_id: 'p1', mode: 'exchange' } },
  { type: 'approval_given', at: iso(6), source: 'real', properties: { pair_id: 'p1', operator_minutes: 5, operator_category: 'clarification' } },
  { type: 'trial_agreed', at: iso(5), source: 'real', properties: { pair_id: 'p1' } },
  { type: 'trial_completed', at: iso(4), source: 'real', properties: { pair_id: 'p1' } },
  { type: 'consent_granted', at: iso(3), source: 'real', properties: { pair_id: 'p1', consent_topic: 'visibility' } },
  { type: 'consent_revoked', at: iso(2), source: 'real', properties: { pair_id: 'p1', consent_topic: 'comparison' } },
  { type: 'consent_revoked', at: iso(1), source: 'real', properties: { pair_id: 'p2', consent_topic: 'analytics_sync' } },
  // synthetic events (should be filtered out from real metrics)
  { type: 'profile_started', at: iso(10), source: 'synthetic', properties: { pair_id: 's1', profile_id: 'su1', mode: 'exchange' } },
  { type: 'case_created', at: iso(9), source: 'synthetic', properties: { pair_id: 's1' } },
];

test('computeDashboard: separates real/synthetic, counts pairs and modes', () => {
  const m = computeDashboard(FIXTURE_EVENTS);
  assert.equal(m.pilotHealth.activePairs, 2);
  assert.equal(m.pilotHealth.funnel.started, 2);
  assert.equal(m.pilotHealth.funnel.completed, 1);
  assert.equal(m.pilotHealth.funnel.casesCreated, 1);
  assert.equal(m.pilotHealth.funnel.trialsAgreed, 1);
  assert.equal(m.pilotHealth.funnel.trialsCompleted, 1);
  assert.deepEqual(m.cohortQuality.modeDistribution, { exchange: 3, paid_service: 1 });
  assert.equal(m.cohortQuality.realVsSynthetic.real, 10);
  assert.equal(m.cohortQuality.realVsSynthetic.synthetic, 2);
});

test('computeDashboard: operator load by category', () => {
  const m = computeDashboard(FIXTURE_EVENTS);
  assert.equal(m.operatorLoad.categories.clarification, 5);
  assert.equal(m.operatorLoad.categories.moderation, 0);
  assert.equal(m.operatorLoad.categories.technical, 0);
  assert.equal(m.operatorLoad.categories.dispute, 0);
});

test('computeDashboard: consent withdrawal alerts', () => {
  // 2 revokes, 1 grant in last 24h -> rate 2.0 >= 2/24 -> alert
  const m = computeDashboard(FIXTURE_EVENTS);
  const alert = m.alerts.find(a => a.code === 'CONSENT_WITHDRAWAL_SPIKE');
  assert.ok(alert, 'consent withdrawal spike alert expected');
});

test('computeDashboard: ghost rate calculation', () => {
  // p1 has recent events, p2 has recent events -> ghost rate 0
  const m = computeDashboard(FIXTURE_EVENTS);
  assert.equal(m.cohortQuality.ghostRate, 0);
});

test('computeDashboard: version mismatch detection', () => {
  const events = [...FIXTURE_EVENTS,
    { type: 'profile_completed', at: iso(1), source: 'real', properties: { pair_id: 'p3', profile_id: 'u3', version: 1 } },
    { type: 'profile_completed', at: iso(1), source: 'real', properties: { pair_id: 'p4', profile_id: 'u4', version: 2 } }
  ];
  const m = computeDashboard(events);
  const alert = m.alerts.find(a => a.code === 'VERSION_MISMATCH');
  assert.ok(alert);
  assert.ok(alert.msg.includes('1'));
  assert.ok(alert.msg.includes('2'));
});

test('computeDashboard: open dispute alert', () => {
  const events = [...FIXTURE_EVENTS, { type: 'dispute_opened', at: iso(1), source: 'real', properties: { pair_id: 'p1' } }];
  const m = computeDashboard(events);
  const alert = m.alerts.find(a => a.code === 'OPEN_DISPUTE');
  assert.ok(alert);
  assert.equal(alert.level, 'critical');
});

test('renderDashboardHtml: produces valid HTML with CSV button', () => {
  const m = computeDashboard(FIXTURE_EVENTS);
  const html = renderDashboardHtml(m);
  assert.ok(html.includes('<!doctype html>'));
  assert.ok(html.includes('<title>Synera Operator Cockpit</title>'));
  assert.ok(html.includes('id="csv-btn"'));
  assert.ok(html.includes('Pilot Health'));
  assert.ok(html.includes('Cohort Quality'));
  assert.ok(html.includes('Operator Load'));
  assert.ok(html.includes('Revenue Signals'));
  assert.ok(html.includes('Alerts'));
});

test('CLI writes HTML file', async () => {
  const tmpEvents = 'web_launch/.test-events.jsonl';
  const tmpOut = 'web_launch/.test-dashboard.html';
  await fs.writeFile(tmpEvents, FIXTURE_EVENTS.map(e => JSON.stringify(e)).join('\n'));
  await new Promise((resolve, reject) => {
    const proc = spawn('node', ['operator_dashboard.mjs', tmpEvents, tmpOut], { cwd: process.cwd() });
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
    proc.on('error', reject);
  });
  const out = await fs.readFile(tmpOut, 'utf8');
  assert.ok(out.includes('Synera Operator Cockpit'));
  await fs.rm(tmpEvents); await fs.rm(tmpOut);
});