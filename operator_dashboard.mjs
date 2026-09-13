// operator_dashboard.mjs — offline CNRA pilot operator cockpit
// Reads events.jsonl, computes 5 panels + alerts, emits static HTML + CSV.
// Zero network. CLI: node operator_dashboard.mjs <events.jsonl> [output.html]

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SCHEMA = 'synera.telemetry.v1';
const CORE_EVENTS = Object.freeze([
  'profile_started', 'profile_completed', 'mode_selected', 'candidate_viewed',
  'case_created', 'approval_given', 'approval_withdrawn', 'terms_revised',
  'intro_requested', 'trial_agreed', 'trial_completed', 'outcome_submitted',
  'feedback_given', 'feedback_missing', 'dispute_opened', 'export_requested',
  'delete_requested', 'consent_granted', 'consent_revoked'
]);
const OPERATOR_CATS = Object.freeze(['clarification', 'moderation', 'technical', 'dispute']);

function parseEvents(text) {
  return text.trim().split('\n')
    .filter(line => line.trim())
    .map((line, i) => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

function filterBySource(events, source) {
  return events.filter(e => e.source === source);
}

function uniquePairs(events) {
  return new Set(events.map(e => e.properties?.pair_id).filter(Boolean)).size;
}

function uniqueProfiles(events) {
  return new Set(events.map(e => e.properties?.profile_id).filter(Boolean)).size;
}

function modeDistribution(events) {
  const dist = {};
  for (const e of events) {
    const m = e.properties?.mode;
    if (m) dist[m] = (dist[m] || 0) + 1;
  }
  return dist;
}

function cityDistribution(events) {
  const dist = {};
  for (const e of events) {
    const c = e.properties?.city_bucket;
    if (c) dist[c] = (dist[c] || 0) + 1;
  }
  return dist;
}

function consentWithdrawalRate(events, hours = 24) {
  const cutoff = Date.now() - hours * 3600 * 1000;
  const revoked = events.filter(e => e.type === 'consent_revoked' && Date.parse(e.at) > cutoff).length;
  const granted = events.filter(e => e.type === 'consent_granted' && Date.parse(e.at) > cutoff).length;
  return granted > 0 ? revoked / granted : (revoked > 0 ? Infinity : 0);
}

function ghostRate(events) {
  const pairs = new Map();
  for (const e of events) {
    const pid = e.properties?.pair_id;
    if (!pid) continue;
    if (!pairs.has(pid)) pairs.set(pid, { events: [], last: 0 });
    const p = pairs.get(pid);
    p.events.push(e.type);
    p.last = Math.max(p.last, Date.parse(e.at));
  }
  let ghost = 0, total = 0;
  const now = Date.now();
  for (const [, p] of pairs) {
    total++;
    if (now - p.last > 14 * 24 * 3600 * 1000) ghost++; // no activity 14 days
  }
  return total > 0 ? ghost / total : 0;
}

function versionMismatch(events) {
  const versions = new Set(events.map(e => e.properties?.version).filter(Boolean));
  return versions.size > 1 ? [...versions].sort().join(', ') : null;
}

function dropOffRate(events) {
  const started = events.filter(e => e.type === 'profile_started').length;
  const completed = events.filter(e => e.type === 'profile_completed').length;
  return started > 0 ? 1 - completed / started : 0;
}

function operatorLoadByCategory(events) {
  const load = { clarification: 0, moderation: 0, technical: 0, dispute: 0 };
  for (const e of events) {
    const cat = e.properties?.operator_category;
    const mins = e.properties?.operator_minutes;
    if (cat && OPERATOR_CATS.includes(cat) && Number.isFinite(mins)) {
      load[cat] += mins;
    }
  }
  return load;
}

function computeAlerts(events) {
  const alerts = [];
  if (consentWithdrawalRate(events) >= 2/24) alerts.push({ level: 'warning', code: 'CONSENT_WITHDRAWAL_SPIKE', msg: 'Consent withdrawal rate ≥2/24h' });
  if (events.some(e => e.type === 'dispute_opened')) alerts.push({ level: 'critical', code: 'OPEN_DISPUTE', msg: 'Open dispute detected' });
  if (ghostRate(events) > 0.25) alerts.push({ level: 'warning', code: 'GHOST_RATE', msg: `Ghost rate ${Math.round(ghostRate(events)*100)}% > 25%` });
  const vm = versionMismatch(events);
  if (vm) alerts.push({ level: 'info', code: 'VERSION_MISMATCH', msg: `Multiple versions: ${vm}` });
  if (dropOffRate(events) > 0.3) alerts.push({ level: 'warning', code: 'DROP_OFF', msg: `Drop-off ${Math.round(dropOffRate(events)*100)}% > 30%` });
  return alerts;
}

export function computeDashboard(events) {
  const real = filterBySource(events, 'real');
  const synthetic = filterBySource(events, 'synthetic');
  const totalEvents = events.length;
  const realPairs = uniquePairs(real);
  const realProfiles = uniqueProfiles(real);
  const modeDist = modeDistribution(real);
  const cityDist = cityDistribution(real);
  const alerts = computeAlerts(real);
  const opLoad = operatorLoadByCategory(real);

  return {
    generatedAt: new Date().toISOString(),
    schema: SCHEMA,
    pilotHealth: {
      activePairs: realPairs,
      activeProfiles: realProfiles,
      totalEvents: real.length,
      funnel: {
        started: real.filter(e => e.type === 'profile_started').length,
        completed: real.filter(e => e.type === 'profile_completed').length,
        casesCreated: real.filter(e => e.type === 'case_created').length,
        trialsAgreed: real.filter(e => e.type === 'trial_agreed').length,
        trialsCompleted: real.filter(e => e.type === 'trial_completed').length,
      },
      missingFeedback: real.filter(e => e.type === 'feedback_missing').length,
      openDisputes: real.filter(e => e.type === 'dispute_opened').length,
      avgTrialDays: null, // requires case state correlation
    },
    cohortQuality: {
      modeDistribution: modeDist,
      cityDistribution: cityDist,
      ghostRate: ghostRate(real),
      legacyVsPilot: { legacy: 0, pilot: realProfiles }, // legacy profiles not tracked in telemetry
      realVsSynthetic: { real: real.length, synthetic: synthetic.length },
    },
    operatorLoad: {
      todayMinutes: opLoad, // simplified: all time
      weekTrend: null,
      categories: opLoad,
    },
    revenueSignals: {
      wtpDistribution: null, // requires case terms
      acceptedVsManual: null,
      paidReferralRatio: null,
    },
    alerts,
  };
}

export function renderDashboardHtml(metrics) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&','<':'<','>':'>','"':'"'}[c]));
  const fmtNum = n => Number.isFinite(n) ? n.toLocaleString() : '—';
  const fmtPct = n => Number.isFinite(n) ? (n*100).toFixed(1)+'%' : '—';

  const alertRows = metrics.alerts.map(a =>
    `<tr class="${a.level}"><td>${esc(a.code)}</td><td>${esc(a.msg)}</td></tr>`).join('');

  const funnel = metrics.pilotHealth.funnel;
  const funnelRows = [
    ['Started', funnel.started],
    ['Completed', funnel.completed],
    ['Cases', funnel.casesCreated],
    ['Trials Agreed', funnel.trialsAgreed],
    ['Trials Completed', funnel.trialsCompleted],
  ].map(([k,v]) => `<tr><td>${esc(k)}</td><td>${fmtNum(v)}</td></tr>`).join('');

  const modeRows = Object.entries(metrics.cohortQuality.modeDistribution)
    .map(([k,v]) => `<tr><td>${esc(k)}</td><td>${fmtNum(v)}</td></tr>`).join('');

  const cityRows = Object.entries(metrics.cohortQuality.cityDistribution)
    .map(([k,v]) => `<tr><td>${esc(k)}</td><td>${fmtNum(v)}</td></tr>`).join('');

  const loadRows = Object.entries(metrics.operatorLoad.categories)
    .map(([k,v]) => `<tr><td>${esc(k)}</td><td>${fmtNum(v)} min</td></tr>`).join('');

  const alertHtml = metrics.alerts.length ? `
    <h2>Alerts</h2>
    <table><thead><tr><th>Code</th><th>Message</th></tr></thead><tbody>${alertRows}</tbody></table>
  ` : '<h2>Alerts</h2><p class="fine">No alerts.</p>';

  return `<!doctype html><html lang="uk"><meta charset="utf-8">
<title>Synera Operator Cockpit</title>
<style>
body{font-family:system-ui,sans-serif;margin:2rem;max-width:1200px;line-height:1.5}
h1,h2{color:#1a1a2e} .fine{color:#666;font-size:.9rem} table{border-collapse:collapse;width:100%;margin:1rem 0}
th,td{border:1px solid #ddd;padding:.5rem;text-align:left} th{background:#f5f5f5}
.warning{background:#fff3cd} .critical{background:#f8d7da} .info{background:#d1ecf1}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem}
.panel{border:1px solid #eee;border-radius:8px;padding:1rem}
button{background:#0066cc;color:#fff;border:none;padding:.5rem 1rem;border-radius:4px;cursor:pointer}
button:hover{background:#0052a3}
</style>
<h1>Synera Operator Cockpit</h1>
<p class="fine">Generated: ${esc(metrics.generatedAt)} · Schema: ${esc(metrics.schema)} · Events: ${fmtNum(metrics.pilotHealth.totalEvents + (metrics.pilotHealth.totalEvents === 0 ? metrics.cohortQuality.realVsSynthetic.synthetic : 0))}</p>
<div class="grid">
  <div class="panel"><h2>Pilot Health</h2>
    <p>Active pairs: <strong>${fmtNum(metrics.pilotHealth.activePairs)}</strong> · Active profiles: <strong>${fmtNum(metrics.pilotHealth.activeProfiles)}</strong></p>
    <p>Missing feedback: ${fmtNum(metrics.pilotHealth.missingFeedback)} · Open disputes: ${fmtNum(metrics.pilotHealth.openDisputes)}</p>
    <table><thead><tr><th>Stage</th><th>Count</th></tr></thead><tbody>${funnelRows}</tbody></table>
  </div>
  <div class="panel"><h2>Cohort Quality</h2>
    <p>Ghost rate: ${fmtPct(metrics.cohortQuality.ghostRate)} · Real/Synthetic: ${fmtNum(metrics.cohortQuality.realVsSynthetic.real)}/${fmtNum(metrics.cohortQuality.realVsSynthetic.synthetic)}</p>
    <h3>Modes</h3><table><thead><tr><th>Mode</th><th>Events</th></tr></thead><tbody>${modeRows}</tbody></table>
    <h3>Cities</h3><table><thead><tr><th>City</th><th>Events</th></tr></thead><tbody>${cityRows}</tbody></table>
  </div>
  <div class="panel"><h2>Operator Load</h2>
    <table><thead><tr><th>Category</th><th>Minutes</th></tr></thead><tbody>${loadRows}</tbody></table>
  </div>
  <div class="panel"><h2>Revenue Signals</h2>
    <p class="fine">Requires case terms correlation — not yet available from telemetry alone.</p>
  </div>
</div>
${alertHtml}
<h2>Export</h2>
<p class="fine">Download current metrics as CSV.</p>
<button id="csv-btn">Download CSV</button>
<script>
(function(){
  const metrics = ${JSON.stringify(metrics, null, 2)};
  function flatten(obj, prefix='') {
    const out = [];
    for (const [k,v] of Object.entries(obj)) {
      const key = prefix ? prefix + '.' + k : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatten(v, key));
      else out.push([key, Array.isArray(v) ? v.join(';') : v]);
    }
    return out;
  }
  const rows = [['metric','value'], ...flatten(metrics)];
  const csv = rows.map(r => r.map(c => '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  document.getElementById('csv-btn').addEventListener('click', () => {
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'operator-dashboard-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click(); URL.revokeObjectURL(url);
  });
})();
</script>
</html>`;
}

// CLI entry
// new URL('C:\...') parses the drive letter as a scheme, so the guard never matched and the
// CLI silently did nothing while exiting 0. pathToFileURL is the pattern neon/generate-schema.mjs uses.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [,, inputPath, outputPath] = process.argv;
  if (!inputPath) {
    console.error('Usage: node operator_dashboard.mjs <events.jsonl> [output.html]');
    process.exit(1);
  }
  const text = await fs.readFile(inputPath, 'utf8');
  const events = parseEvents(text);
  const metrics = computeDashboard(events);
  const html = renderDashboardHtml(metrics);
  const out = outputPath || 'operator_dashboard.html';
  await fs.writeFile(out, html, 'utf8');
  console.log(`Dashboard written to ${out} (${metrics.alerts.length} alerts)`);
}
