import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

// Two owned modules, joined explicitly; no package downloads or runtime CDN dependencies.
const root = fileURLToPath(new URL('../web_launch/', import.meta.url));
const directory = path.join(root, 'dist-neon');
const assets = Object.keys(PUBLIC_ASSETS);
const generated = ['_worker.js', '_routes.json', 'release.json'];
await fs.mkdir(directory, { recursive: true });
if ((await fs.readdir(directory)).some(name => ![...assets, ...generated].includes(name))) throw new Error('Unexpected release file; inspect before continuing');
const policy = await fs.readFile(path.join(root, 'pilot-policy.mjs'), 'utf8');
const workerSource = await fs.readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
const expectedImport = "import { consentRecord, POLICY_VERSION } from '../web_launch/pilot-policy.mjs';";
if (!workerSource.startsWith(expectedImport) || /\bimport\s/.test(workerSource.slice(expectedImport.length))) throw new Error('Worker dependency changed; review build');
const worker = policy + '\n' + workerSource.slice(expectedImport.length) + '\nexport default createNeonWorker(' + JSON.stringify(assets) + ');\n';
const receipt = { built_at: new Date().toISOString(), backend: 'neon', cloudflare_pages_advanced_mode: true, files: [], published: false, live_auth_verified: false, live_rls_verified: false, automatic_public_ai: false };
for (const name of assets) await fs.copyFile(path.join(root, name), path.join(directory, name));
await fs.writeFile(path.join(directory, '_worker.js'), worker);
await fs.writeFile(path.join(directory, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
for (const name of [...assets, '_worker.js', '_routes.json']) {
  const data = await fs.readFile(path.join(directory, name));
  receipt.files.push({ name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ directory, files: assets.length + generated.length, published: false }));
