// One-time, workspace-bound preparation of the shared presentation shell.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { COPY } from '../../web_launch/summit.mjs';
import { PRODUCT_COPY } from '../../web_launch/product-access.mjs';
import { TABLE } from '../../web_launch/real-journey-i18n.mjs';
import { ROWS } from '../../web_launch/index-i18n-table.mjs';
const root = path.resolve('web_launch');
if (root.toLowerCase() !== 'c:\\sw\\synera-design\\web_launch') throw new Error('Wrong workspace');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const write = (name, text) => fs.writeFileSync(path.join(root,name),text);
const edit = (name, fn) => write(name, fn(read(name)));

const header = `<header class="site-header"><a class="site-brand" href="/" aria-label="Synera">synera<span aria-hidden="true">·</span></a><details class="header-preferences"><summary>Мова і вигляд</summary><div class="header-preferences-content"><label>Мова<select id="site-language" aria-label="Мова · Sprache · Language"><option value="uk" lang="uk">Українська</option><option value="de" lang="de">Deutsch</option><option value="en" lang="en">English</option></select></label><label>Вигляд<select id="style-preset" aria-label="Вигляд"><option value="atelier">Atelier</option><option value="synera">Current · Synera</option><option value="original">Current · Web</option><option value="night">Night</option><optgroup label="Додаткові пресети"><option value="noir">Noir</option><option value="alpine">Alpine</option><option value="copper">Copper</option><option value="azure">Azure</option><option value="orchid">Orchid</option><option value="terracotta">Terracotta</option><option value="citrus">Citrus</option><option value="slate">Slate</option><option value="ink">Ink</option><option value="harvest">Harvest</option></optgroup></select></label><span id="mode" class="badge" hidden>Перевірка доступу</span><button id="logout" type="button" hidden>Вийти</button><button id="back-login" type="button" hidden>До входу</button><button id="tour-start" type="button" hidden>Тур</button></div></details></header>`;
const modeLinks = [['/','Профіль і знайомства'],['/summit.html','Як працює Synera'],['/studio.html','Майстерня співпраці'],['/studio-journey.html','Спробувати знайомство'],['/real-journey.html','Домовленість удвох'],['/rooms.html','Спільна розмова'],['/triangle.html','Розмова втрьох'],['/get.html','Synera на телефоні']];
const modes = `<details class="more-modes"><summary>Ще режими</summary><nav class="more-modes-links" aria-label="Режими Synera">${modeLinks.map(([url,label])=>`<a href="${url}">${label} <span aria-hidden="true">↗</span></a>`).join('')}</nav></details>`;
const pages = ['index','summit','studio','studio-journey','real-journey','rooms','triangle','legal','catalogue','get','outcome-archive','lab'];
for (const page of pages) edit(page+'.html', html => {
  html = html.replace(/<header\b[^>]*>[\s\S]*?<\/header>/,header);
  html = html.replace(/<html\b[^>]*>/,'<html lang="uk" data-synera-style="atelier">');
  html = html.replace(/<body([^>]*)>/, (_,attrs) => attrs.includes('class=') ? '<body'+attrs.replace(/class="([^"]*)"/, 'class="$1 site-page"')+'>' : '<body class="site-page"'+attrs+'>');
  html = html.replace(/<script type="module" src="\/(index-language|legal-language)\.mjs"><\/script>/g,'');
  html = html.replace('</head>','<link rel="stylesheet" href="/site-shell.css"><script type="module" src="/site-shell.mjs"></script>\n</head>');
  if (!html.includes('src="/atelier.mjs"')) html = html.replace('</head>','<script type="module" src="/atelier.mjs"></script></head>');
  if (!html.includes('href="/atelier.css"')) html = html.replace('<link rel="stylesheet" href="/site-shell.css">','<link rel="stylesheet" href="/atelier.css"><link rel="stylesheet" href="/site-shell.css">');
  html = html.replace(/<a\b[^>]*>Попередн(?:ій дизайн|я презентація|я карта)[^<]*<\/a>/g,'');
  if (page === 'index') {
    html = html.replace(/<ol class="journey">[\s\S]*?<\/ol>/,'');
    html = html.replace(/<details class="summit-entry more-modes">[\s\S]*?<\/details>/,modes);
    const steps = [
      ['match','Знайдіть взаємність','Твій внесок і потреба партнера.'],
      ['calendar','Оберіть час','Зустріч, зручна вам обом.'],
      ['terms','Узгодьте умови','Обсяг, винагорода й межі.'],
      ['signature','Підтвердьте разом','Кожен приймає свою сторону.']
    ];
    const row = `<section class="how-it-works" aria-labelledby="how-title"><h2 id="how-title">Як це працює</h2><ol>${steps.map(([icon,title,body])=>`<li><img src="/premium-${icon}.webp" width="144" height="144" alt="" loading="lazy"><strong>${title}</strong><small>${body}</small></li>`).join('')}</ol></section>`;
    html = html.replace('<section id="welcome"',row+'\n<section id="welcome"');
  } else html = html.replace('</main>',modes+'\n</main>');
  if (page === 'summit') {
    html = html.replace(/(<([\w-]+)\b[^>]*\bdata-copy="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g,(all,open,tag,key,close) => open+(PRODUCT_COPY.uk[key] ?? COPY.uk[key] ?? all)+close);
    html = html.replace('Skip to interactive demo','До інтерактивного прикладу').replace('Synera — Make room for each other.','Synera — сильна робота починається одне з одного.');
  }
  if (page === 'get') html = html.replace(/(<([\w-]+)\b[^>]*\bdata-product-copy="([^"]+)"[^>]*>)[\s\S]*?(<\/\2>)/g,(all,open,tag,key,close) => open+(PRODUCT_COPY.uk[key] ?? all)+close).replace('Skip to app access','До встановлення');
  if (page === 'studio' || page === 'studio-journey') {
    const target = page === 'studio' ? '#fit-form' : '#journey-fit';
    html = html.replace(/<div class="button-row">[\s\S]*?<\/div>/,`<div class="button-row"><a class="primary" href="${target}">Знайти взаємну користь <span aria-hidden="true">↗</span></a></div>`);
    // Keep install/quiet controls available, inside the single collapsed modes section.
    html = html.replace('<nav class="more-modes-links"',`<div class="mode-tools"><button id="install-studio" type="button" hidden>Встановити Synera</button><button id="install-help" type="button">На Android / iPhone ↗</button>${page==='studio-journey'?'<button id="journey-quiet-toggle" type="button" aria-pressed="false">Спокійний режим</button>':''}</div><nav class="more-modes-links"`);
  }
  if (page === 'triangle') html = html.replace('01 · Трикутник L','01 · Розмова втрьох');
  if (page === 'studio') html = html.replace('SYNERA / STUDIO 04','SYNERA / МАЙСТЕРНЯ СПІВПРАЦІ');
  if (page === 'rooms') html = html.replace('SYNERA / TEXT L','SYNERA / СПІЛЬНА РОЗМОВА').replace('Synera — кімната L','Synera — спільна розмова').replace('Відкрити Studio ↗','Підготувати профіль ↗').replace('href="/studio.html" class="rooms-link"','href="/#profile" class="rooms-link"').replace('class="rooms-link" href="/studio.html"','class="rooms-link" href="/#profile"');
  if (page === 'real-journey') html = html.replace('SYNERA / РЕАЛЬНИЙ ПІЛОТ','SYNERA / ДОМОВЛЕНІСТЬ УДВОХ');
  for (const id of page==='rooms'?['rooms-blocked','rooms-auth']:page==='real-journey'?['real-blocked','real-auth']:[]) {
    const icon = page==='rooms'?'signature':'match';
    html = html.replace(new RegExp(`(<section id="${id}"[^>]*>)`),`$1<img class="premium-icon" src="/premium-${icon}.webp" width="144" height="144" alt="">`);
  }
  return html;
});
edit('real-journey.mjs',s=>s.replace("$('real-language')","$('site-language')"));
edit('summit.mjs',s=>s.replace("let language = 'en', step", "let storage = null; try { storage = window.localStorage; } catch {}\n  let language = initLanguage({ search: typeof location === 'undefined' ? '' : location.search, storage }), step").replace("'#summit-language'","'#site-language'").replace("event.target.value:'en'","event.target.value:'uk'"));
// The access page has the same initial language contract, before its first render.
edit('product-access.mjs',s=>"import { initLanguage } from './real-journey-i18n.mjs';\n"+s.replace("  doc.querySelector('#open-live-app').href", "  let storage = null; try { storage = window.localStorage; } catch {}\n  select.value = initLanguage({ search: typeof location === 'undefined' ? '' : location.search, storage });\n  doc.querySelector('#open-live-app').href"));

// Every shared string also belongs to the real path's strict source table.
const rows = [
  ['Мова і вигляд','Sprache und Design','Language and look'],['Мова','Sprache','Language'],['Вигляд','Design','Look'],['Додаткові пресети','Weitere Designs','More presets'],
  ['Ще режими','Weitere Bereiche','More modes'],['Режими Synera','Synera-Bereiche','Synera modes'],['Профіль і знайомства','Profil und Kontakte','Profile and connections'],['Як працює Synera','So funktioniert Synera','How Synera works'],['Майстерня співпраці','Werkstatt für Zusammenarbeit','Collaboration workshop'],['Спробувати знайомство','Ein Kennenlernen ausprobieren','Try a connection'],['Домовленість удвох','Vereinbarung zu zweit','Agreement for two'],['Спільна розмова','Gemeinsames Gespräch','Shared conversation'],['Розмова втрьох','Gespräch zu dritt','Conversation for three'],['Synera на телефоні','Synera auf deinem Handy','Synera on your phone'],
  ['Перевірка доступу','Zugriff prüfen','Checking access'],['Вийти','Abmelden','Log out'],['До входу','Zur Anmeldung','Back to sign-in'],['Тур','Rundgang','Tour'],
  ['SYNERA / ДОМОВЛЕНІСТЬ УДВОХ','SYNERA / VEREINBARUNG ZU ZWEIT','SYNERA / AGREEMENT FOR TWO'],
  ['Як це працює','So funktioniert es','How it works'],['Знайдіть взаємність','Gegenseitigen Nutzen finden','Find mutual value'],['Твій внесок і потреба партнера.','Dein Beitrag und der Bedarf deines Gegenübers.','Your contribution and your partner’s need.'],['Оберіть час','Einen Zeitpunkt wählen','Choose a time'],['Зустріч, зручна вам обом.','Ein Treffen, das euch beiden passt.','A meeting that works for both of you.'],['Узгодьте умови','Bedingungen vereinbaren','Agree on terms'],['Обсяг, винагорода й межі.','Umfang, Vergütung und Grenzen.','Scope, compensation and boundaries.'],['Підтвердьте разом','Beide bestätigen','Confirm together'],['Кожен приймає свою сторону.','Jede Person bestätigt ihre Seite.','Each person confirms their side.'],
  ['Знайти взаємну користь','Gegenseitigen Nutzen finden','Find mutual value'],['До інтерактивного прикладу','Zum interaktiven Beispiel','Skip to interactive demo'],['До встановлення','Zur Installation','Skip to installation'],['SYNERA / МАЙСТЕРНЯ СПІВПРАЦІ','SYNERA / WERKSTATT FÜR ZUSAMMENARBEIT','SYNERA / COLLABORATION WORKSHOP'],['SYNERA / СПІЛЬНА РОЗМОВА','SYNERA / GEMEINSAMES GESPRÄCH','SYNERA / SHARED CONVERSATION'],['01 · Розмова втрьох','01 · Gespräch zu dritt','01 · Conversation for three'],['Підготувати профіль ↗','Profil vorbereiten ↗','Prepare a profile ↗']
];
const norm = s=>s.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
for(const copy of [COPY,PRODUCT_COPY]) for(const [key,uk] of Object.entries(copy.uk)) if(copy.de[key] && copy.en[key] && /[Ѐ-ӿ]/.test(uk)) rows.push([norm(uk),norm(copy.de[key]),norm(copy.en[key])]);
const all = new Set([...TABLE,...ROWS].map(r=>r[0]));
const shared = new Set(TABLE.map(r=>r[0]));
const add = [];
for(const row of rows) if(!shared.has(row[0])) { shared.add(row[0]); add.push(row); }
// Move an existing index row into the shared table only when the common header needs it.
const moving = new Set(add.map(r=>r[0]));
edit('index-i18n-table.mjs',s=>s.split('\n').filter(line=>!ROWS.some(r=>moving.has(r[0]) && line.trimStart().startsWith('['+JSON.stringify(r[0])+','))).join('\n'));
edit('real-journey-i18n.mjs',s=>s.replace('export const TABLE = Object.freeze([','export const TABLE = Object.freeze([\n'+add.map(r=>'  '+JSON.stringify(r)+',').join('\n')));

const extraAssets = ['site-shell.css','site-shell.mjs','premium-match.webp','premium-calendar.webp','premium-terms.webp','premium-signature.webp'];
edit('assets.mjs',s=>s.replace('export const PUBLIC_ASSETS = Object.freeze({','export const PUBLIC_ASSETS = Object.freeze({\n'+extraAssets.map(n=>`  '${n}': '${n.endsWith('.css')?'text/css':n.endsWith('.mjs')?'text/javascript':'image/webp'}',`).join('\n')));
edit('sw.mjs',s=>s.replace('synera-shell-20261028-phone-merge1','synera-shell-20261029-atelier1').replace("self.addEventListener('install'",`SHELL.push(${extraAssets.map(n=>JSON.stringify('/'+n)).join(',')});\nself.addEventListener('install'`));
edit('studio-sw.mjs',s=>s.replace('synera-studio-20261003-v5','synera-studio-20261029-v6').replace("self.addEventListener('install'",`ASSETS.push('/style-switcher.mjs','/real-journey-i18n.mjs','/index-i18n.mjs','/index-i18n-table.mjs','/legal-i18n.mjs',${extraAssets.map(n=>JSON.stringify('/'+n)).join(',')});\nself.addEventListener('install'`));
edit('style-switcher.test.mjs',s=>s.replace('defaults malformed or absent preference to the original Synera visual language','defaults malformed or absent preference to the release Atelier visual language').replace('normalizeStyle(undefined), SYNERA_STYLE','normalizeStyle(undefined), ATELIER_STYLE').replace("normalizeStyle('unknown'), SYNERA_STYLE","normalizeStyle('unknown'), ATELIER_STYLE").replace("mode === 'available' ? ATELIER_STYLE : SYNERA_STYLE","ATELIER_STYLE").replace("mode === 'available' ? ORIGINAL_STYLE : ATELIER_STYLE","ORIGINAL_STYLE").replace("'synera-shell-20261027-phone-v12'","'synera-shell-20261027-phone-v12', 'synera-shell-20261028-phone-merge1'").replace("  assert.match(cacheName, /^synera-shell-/);","  assert.equal(cacheName, 'synera-shell-20261029-atelier1');\n  for (const asset of "+JSON.stringify(extraAssets.map(n=>'/'+n))+") assert.ok(cachedShell.includes(asset), asset);"));
edit('real-journey-i18n.test.mjs',s=>s.replace('/<html lang="uk">/','/<html lang="uk" data-synera-style="atelier">/').replace('id="real-language"','id="site-language"'));
// Sparse checkout omitted two immutable fixtures. Materialize exact HEAD bytes; never alter .git.
for (const file of ['outcome-export-plain.json','outcome-export-gzip.json']) {
 const target=path.resolve('artifacts/overnight-20261004',file);
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,execFileSync('git',['show','HEAD:artifacts/overnight-20261004/'+file]));
}
console.log('Updated',pages.length,'pages;',add.length,'shared translation rows.');

