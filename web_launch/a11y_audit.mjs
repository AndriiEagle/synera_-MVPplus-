/**
 * Synera Accessibility Audit
 * Runs axe-core on index.html and catalogue.html
 * Outputs violations list and suggested fixes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGES = [
  { name: 'index.html' },
  { name: 'catalogue.html' },
];

async function runAudit() {
  // Root-relative assets and module imports need the same HTTP origin as the product.
  // A file:// audit silently lost every shared stylesheet and audited an unstyled document.
  const server = spawn(process.execPath, [path.join(__dirname, 'server.mjs')], { env: { ...process.env, SYNERA_PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  const results = [];

  try {
    const base = await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('Audit server timeout: ' + output)), 30000);
      server.stdout.on('data', chunk => { output += chunk; const url = output.match(/http:\/\/127\.0\.0\.1:\d+/); if (url) { clearTimeout(timer); resolve(url[0]); } });
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', code => { clearTimeout(timer); reject(new Error('Audit server exited: ' + code)); });
    });
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await browser.newContext();
    for (const page of PAGES) {
      page.url = base + '/' + page.name;
      console.log(`\n=== Auditing ${page.name} ===`);
      const pageInstance = await context.newPage();
      await pageInstance.goto(page.url, { waitUntil: 'networkidle', timeout: 30000 });
      await pageInstance.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-canvas').trim() !== '');
      await pageInstance.evaluate(() => document.fonts.ready);

      const axe = new AxeBuilder({ page: pageInstance });
      const result = await axe.analyze();

      const violations = result.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map(n => ({
          target: n.target,
          html: n.html,
          failureSummary: n.failureSummary,
          any: n.any.map(a => ({ message: a.message, data: a.data })).filter(a => a.message),
        })),
      }));

      const passes = result.passes.map(p => ({
        id: p.id,
        impact: p.impact,
      }));

      const incomplete = result.incomplete.map(i => ({
        id: i.id,
        impact: i.impact,
      }));

      results.push({
        page: page.name,
        url: page.url,
        timestamp: new Date().toISOString(),
        violations,
        passes: passes.length,
        incomplete: incomplete.length,
        summary: {
          critical: violations.filter(v => v.impact === 'critical').length,
          serious: violations.filter(v => v.impact === 'serious').length,
          moderate: violations.filter(v => v.impact === 'moderate').length,
          minor: violations.filter(v => v.impact === 'minor').length,
        },
      });

      console.log(`Violations: ${violations.length} (critical: ${results[results.length-1].summary.critical}, serious: ${results[results.length-1].summary.serious}, moderate: ${results[results.length-1].summary.moderate}, minor: ${results[results.length-1].summary.minor})`);
      console.log(`Passes: ${passes.length}, Incomplete: ${incomplete.length}`);

      await pageInstance.close();
    }

    // Write detailed report
    const reportPath = path.join(__dirname, 'a11y_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nDetailed report written to: ${reportPath}`);

    // Generate human-readable summary
    let summary = '# Synera Accessibility Audit Report\n\n';
    summary += `Generated: ${new Date().toISOString()}\n\n`;

    for (const r of results) {
      summary += `## ${r.page}\n\n`;
      summary += `**Violations:** ${r.violations.length} | **Passes:** ${r.passes} | **Incomplete:** ${r.incomplete}\n\n`;

      if (r.violations.length > 0) {
        summary += '### Violations\n\n';
        for (const v of r.violations) {
          summary += `#### ${v.id} (${v.impact})\n`;
          summary += `${v.description}\n\n`;
          summary += `**Help:** ${v.help}\n`;
          summary += `**Reference:** ${v.helpUrl}\n\n`;
          summary += '**Affected elements:**\n';
          for (const node of v.nodes) {
            summary += `- \`${node.target.join(' > ')}\`\n`;
            if (node.failureSummary) summary += `  - ${node.failureSummary}\n`;
            for (const any of node.any) {
              if (any.message) summary += `  - ${any.message}\n`;
            }
          }
          summary += '\n';
        }
      } else {
        summary += '✅ No violations found.\n\n';
      }
    }

    const summaryPath = path.join(__dirname, 'a11y_audit.md');
    fs.writeFileSync(summaryPath, summary);
    console.log(`Summary written to: ${summaryPath}`);

    // Exit with code 1 if critical/serious violations exist
    const hasCriticalOrSerious = results.some(r => r.summary.critical > 0 || r.summary.serious > 0);
    if (hasCriticalOrSerious) {
      console.log('\n❌ CRITICAL/SERIOUS violations found - see report');
      process.exitCode = 1;
    } else {
      console.log('\n✅ No critical or serious violations');
      process.exitCode = 0;
    }

  } catch (error) {
    console.error('Audit failed:', error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    if (server.exitCode === null) { server.kill(); await new Promise(resolve => server.once('exit', resolve)); }
  }
}

runAudit();
