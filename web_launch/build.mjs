// Dependency-free static release. Copy only reviewed public assets, never the repository.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadConfig, securityHeaders } from './config.mjs';
import { PUBLIC_ASSETS } from './assets.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(root, process.argv.includes('--demo') ? 'dist-demo' : 'dist');
const assets = Object.keys(PUBLIC_ASSETS);
const generated = ['config.json', '_headers', '404.html', 'release.json'];
const config = await loadConfig({ demo: process.argv.includes('--demo') });
await fs.mkdir(destination, { recursive: true });
const existing = await fs.readdir(destination);
if (existing.some(file => ![...assets, ...generated].includes(file))) throw new Error('Unexpected file in release directory; inspect before continuing.');
const receipt = { built_at: new Date().toISOString(), mode: config.supabaseUrl ? 'supabase' : 'synthetic-demo', files: [], published: false };
for (const asset of assets) {
  const data = await fs.readFile(path.join(root, asset));
  await fs.writeFile(path.join(destination, asset), data);
  receipt.files.push({ name: asset, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
await fs.writeFile(path.join(destination, 'config.json'), JSON.stringify(config));
await fs.writeFile(path.join(destination, '_headers'), '/*\n' + Object.entries(securityHeaders(config)).map(([key,value]) => `  ${key}: ${value}`).join('\n') + '\n');
await fs.writeFile(path.join(destination, '404.html'), '<!doctype html><html lang="uk"><meta charset="utf-8"><title>Synera — сторінку не знайдено</title><h1>Сторінку не знайдено</h1><a href="/">Відкрити Synera</a></html>');
await fs.writeFile(path.join(destination, 'release.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ directory: destination, mode: receipt.mode, files: assets.length + generated.length, published: false }));
