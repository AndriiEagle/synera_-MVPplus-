// One-shot local authoring helper; no network, no generated assets or simulation edits.
import fs from 'node:fs/promises';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';
const root = new URL('../web_launch/', import.meta.url);
const index = await fs.readFile(new URL('index.html', root), 'utf8');
const header = index.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0];
if (!header) throw Error('Shared header not found');
const page = `<!doctype html>
<html lang="uk" data-synera-style="synera"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark"><meta name="referrer" content="no-referrer">
<title>Твої дані · Synera</title>
<link rel="stylesheet" href="/tokens.css"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/atelier.css"><link rel="stylesheet" href="/site-shell.css"><link rel="stylesheet" href="/privacy.css">
<script type="module" src="/site-shell.mjs"></script><script type="module" src="/privacy-centre.mjs"></script>
</head><body class="site-page">${header}
<main class="privacy-centre"><h1 data-privacy-copy="title">Твої дані</h1><p data-privacy-copy="intro"></p>
<div class="privacy-actions"><button type="button" id="privacy-download" data-privacy-copy="download">Завантажити дані пристрою · JSON</button><button type="button" id="privacy-erase" data-privacy-copy="erase">Стерти дані з цього браузера</button></div>
<p id="privacy-status" role="status" aria-live="polite"></p><section aria-label="Privacy notice" id="privacy-notice"></section>
<h2 data-privacy-copy="account"></h2><p data-privacy-copy="accountText"></p><p><a id="privacy-account" href="/?privacy=1" data-privacy-copy="accountLink"></a></p>
<p><a href="/legal.html" data-privacy-copy="legalLink"></a></p>
<noscript><p>Для експорту й стирання потрібен JavaScript. <a href="/legal.html">Правила й контакт</a> · Export und Löschung benötigen JavaScript. · Export and erasure require JavaScript.</p></noscript>
</main><footer><a href="/">Synera</a></footer></body></html>\n`;
const target = new URL('privacy.html', root);
try { await fs.access(target); } catch { await fs.writeFile(target, page); }
for (const name of new Set([...Object.keys(PUBLIC_ASSETS).filter(name => name.endsWith('.html') && !name.startsWith('simulation')), 'privacy.html', 'lab.html'])) {
  const url = new URL(name, root); let html = await fs.readFile(url, 'utf8');
  if (!html.includes('src="/privacy-retention.mjs"')) html = html.replace(/<head[^>]*>/, '$&\n<script src="/privacy-retention.mjs"></script>');
  if (!html.includes('data-privacy-link')) {
    html = html.replace('<div class="header-preferences-content">', '<div class="header-preferences-content"><a data-privacy-link href="/privacy.html">Твої дані</a>');
    const link = '<a data-privacy-link href="/privacy.html">Твої дані</a>';
    html = html.includes('</footer>') ? html.replace('</footer>', link + '</footer>') : html.replace('</body>', '<footer>' + link + '</footer></body>');
  }
  if (name === 'legal.html' && !html.includes('id="privacy-notice"')) html = html.replace('</main>', '<section id="privacy-notice" aria-label="Твої дані"></section></main>');
  await fs.writeFile(url, html);
}
