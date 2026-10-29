import fs from 'node:fs';
import {TABLE} from '../../web_launch/real-journey-i18n.mjs';
import {ROWS} from '../../web_launch/index-i18n-table.mjs';
const edit=(name,fn)=>{const path='web_launch/'+name;fs.writeFileSync(path,fn(fs.readFileSync(path,'utf8')));};
edit('lab.html',s=>{
 const nav=s.match(/<nav class="lab-nav"[\s\S]*?<\/nav>/)[0];
 s=s.replace(nav,'').replace('<summary>Ще режими</summary>','<summary>Ще режими</summary>'+nav);
 return s.replace('ДО ЗУСТРІЧІ · 04 ВЕРЕСНЯ 2026','SYNERA / ПОРІВНЯННЯ МОЖЛИВОСТЕЙ').replace('</p></section>','</p><a class="primary" href="#comparison">Порівняти можливості ↗</a></section>');
});
edit('catalogue.html',s=>s.replace('<h1>Synera Component Catalogue</h1>\n<p class="lead">All components in all states: default, hover, focus, disabled, loading, error</p>',`<section class="reference-intro"><p class="eyebrow">SYNERA / БІБЛІОТЕКА ДИЗАЙНУ</p><h1>Деталі складаються в ціле.</h1><p>Компоненти Synera та їхні стани — довідник для команди продукту.</p><a class="primary" href="#catalogue-components">Переглянути компоненти ↗</a></section>`).replace('<section class="catalogue-section">','<section id="catalogue-components" class="catalogue-section">'));
edit('legal.html',s=>s.replace('<h2>1. Участь</h2>','<h2 id="legal-participation">1. Участь</h2>').replace('</h1>','</h1><a class="primary" href="#legal-participation">Читати правила ↗</a>'));
edit('triangle.html',s=>s.replace('class="sr-only">Трикутник L','class="sr-only">Розмова втрьох'));
const additions=[
 ['SYNERA / ПОРІВНЯННЯ МОЖЛИВОСТЕЙ','SYNERA / MÖGLICHKEITEN VERGLEICHEN','SYNERA / COMPARE OPPORTUNITIES'],
 ['Порівняти можливості ↗','Möglichkeiten vergleichen ↗','Compare opportunities ↗'],
 ['SYNERA / БІБЛІОТЕКА ДИЗАЙНУ','SYNERA / DESIGNBIBLIOTHEK','SYNERA / DESIGN LIBRARY'],
 ['Деталі складаються в ціле.','Details ergeben ein Ganzes.','Details become a whole.'],
 ['Компоненти Synera та їхні стани — довідник для команди продукту.','Synera-Komponenten und ihre Zustände – ein Nachschlagewerk für das Produktteam.','Synera components and their states – a reference for the product team.'],
 ['Переглянути компоненти ↗','Komponenten ansehen ↗','View components ↗'],
 ['Читати правила ↗','Regeln lesen ↗','Read the rules ↗'],
 ['Synera — сильна робота починається одне з одного.','Synera – gute Arbeit beginnt miteinander.','Synera – great work starts with each other.'],
 ['Synera — спільна розмова','Synera – gemeinsames Gespräch','Synera – shared conversation'],
 ['synera · спільна шапка сторінок','synera · gemeinsame Kopfzeile','synera · shared page header']
];
const existing=new Set([...TABLE,...ROWS].map(r=>r[0]));
edit('real-journey-i18n.mjs',s=>s.replace('export const TABLE = Object.freeze([','export const TABLE = Object.freeze([\n'+additions.filter(r=>!existing.has(r[0])).map(r=>'  '+JSON.stringify(r)+',').join('\n')));
