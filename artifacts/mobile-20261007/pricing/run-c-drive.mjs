import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const temp = 'C:/Users/Andrii/.codex/tmp/synera-mobile-pricing';
const stat = fs.lstatSync(temp);
if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('C: test temp must be a real directory');
const mutation = process.argv.includes('--mutation');
const visualProof = process.argv.includes('--visual-proof');
const result = spawnSync(process.execPath, mutation ? ['artifacts/mobile-20261007/pricing/browser-acceptance.mjs'] : [
  'node_modules/@playwright/test/cli.js', 'test',
  '--config', 'artifacts/mobile-20261007/pricing/playwright-c-drive.config.mjs',
  'tests/product-access.spec.mjs', 'tests/browser-e2e.spec.mjs',
  '--grep', visualProof ? 'Access journey (en|de|uk) at 390|Access journey de at 320|Access journey en at 1440' : 'Access journey|Access and scenario|Presentation leads to real app access|Phone access stays functional',
  ...(visualProof ? ['--output', 'artifacts/mobile-20261007/pricing/visual-proof'] : []),
], {
  env: { ...process.env, TMP: temp, TEMP: temp, ...(mutation ? { SYNERA_ACCESS_MUTATION: 'demo-primary' } : {}) },
  windowsHide: true, encoding: 'utf8', timeout: 180000, maxBuffer: 4 * 1024 * 1024,
});
const output = (result.stdout || '') + (result.stderr || '');
fs.writeFileSync(new URL(mutation ? './MUTATION.txt' : visualProof ? './VISUAL_PROOF.txt' : './GREEN_C_DRIVE.txt', import.meta.url), output);
console.log(output);
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 2);
