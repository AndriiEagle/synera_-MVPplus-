import fs from 'node:fs';
import {TABLE} from '../../web_launch/real-journey-i18n.mjs';
import {ROWS} from '../../web_launch/index-i18n-table.mjs';
const edit=(name,fn)=>{const path='web_launch/'+name;fs.writeFileSync(path,fn(fs.readFileSync(path,'utf8')));};
const art=[
['preview','SYNERA / ЗНАЙОМСТВО','SYNERA / KENNENLERNEN','SYNERA / PRODUCT PREVIEW'],
['directions','ДВА НАПРЯМИ. ОДИН ПОЧАТОК.','ZWEI RICHTUNGEN. EIN ANFANG.','TWO DIRECTIONS. ONE BEGINNING.'],
['designRole','Дизайн продукту','Produktdesign','Product design'],
['salesRole','Ділові партнерства','Geschäftspartnerschaften','B2B partnerships'],
['offerCaption','ДАЄ','BIETET','OFFERS'],['seekCaption','ШУКАЄ','SUCHT','SEEKS'],
['productCaption','Виразніший продукт.','Ein klareres Produkt.','A sharper product.'],
['conversationCaption','Корисніші розмови.','Bessere Gespräche.','Better conversations.'],
['illustrationCaption','ПРИКЛАД ВЗАЄМНОСТІ','BEISPIEL EINER VERBINDUNG','ILLUSTRATIVE CONNECTION'],
['wayCaption','ПРИНЦИПИ SYNERA','DIE SYNERA-PRINZIPIEN','THE SYNERA WAY'],
['clarityCaption','01 / ЯСНІСТЬ','01 / KLARHEIT','01 / CLARITY'],['agencyCaption','02 / ВИБІР','02 / EIGENE WAHL','02 / AGENCY'],['realityCaption','03 / ДІЯ','03 / PRAXIS','03 / REALITY'],
['discoverCaption','01 / ЗНАЙТИ','01 / ENTDECKEN','01 / DISCOVER'],['agreeCaption','02 / УЗГОДИТИ','02 / VEREINBAREN','02 / AGREE'],['meetCaption','03 / ЗУСТРІТИСЬ','03 / TREFFEN','03 / MEET'],['chooseCaption','04 / ОБРАТИ','04 / WÄHLEN','04 / CHOOSE']
];
edit('summit.html',s=>{
  for(const [key,uk,de,en] of art){
    if(key==='preview')s=s.replace('SYNERA / PRODUCT PREVIEW',`<span data-copy="${key}">${uk}</span>`);
    else s=s.replaceAll(en,`<span data-copy="${key}">${uk}</span>`);
  }
  return s.replace('aria-label="Demo chapters"','aria-label="Етапи прикладу"');
});
edit('summit.mjs',s=>s.replace('export function installSummit(',`const ART_COPY = ${JSON.stringify(Object.fromEntries(['uk','de','en'].map((lang,i)=>[lang,Object.fromEntries(art.map(row=>[row[0],row[i+1]]))])))};\n\nexport function installSummit(`).replace('PRODUCT_COPY[language][key] ?? COPY[language][key]','ART_COPY[language][key] ?? PRODUCT_COPY[language][key] ?? COPY[language][key]'));
edit('triangle.html',s=>s.replace('<span class="local-badge">','<div class="button-row"><a class="primary" href="#room-setup">Почати спільну розмову <span aria-hidden="true">↗</span></a></div><span class="local-badge">'));
// Subpage mode navigation has a single home in More modes. Keep workflow actions in place.
edit('studio.html',s=>s.replace(/<a class="small-link" href="\/triangle.html#atlas">[^<]*<\/a>/g,''));
edit('get.html',s=>s.replace(/<div class="access-demo-links">([\s\S]*?)<\/div>/,'').replace('Get Synera — Android &amp; iPhone','Synera — Android та iPhone'));
edit('rooms.mjs',s=>s.replace('Пілотна мережна кімната ще не ввімкнена. Можна відкрити локальний Studio.','Пілотна кімната ще готується до відкриття. Поки можеш підготувати свій профіль.').replace('Не вдалося перевірити захищену конфігурацію кімнати. Спробуй пізніше або відкрий Studio.','Не вдалося перевірити доступ до кімнати. Спробуй пізніше або повернися до профілю.'));
const additions=[...art.map(r=>r.slice(1)),['Етапи прикладу','Schritte des Beispiels','Example steps'],['Почати спільну розмову','Ein gemeinsames Gespräch beginnen','Start a shared conversation'],['Пілотна кімната ще готується до відкриття. Поки можеш підготувати свій профіль.','Der Pilotraum wird noch vorbereitet. Inzwischen kannst du dein Profil vorbereiten.','The pilot room is being prepared. You can prepare your profile in the meantime.'],['Не вдалося перевірити доступ до кімнати. Спробуй пізніше або повернися до профілю.','Der Zugang zum Raum konnte nicht geprüft werden. Versuche es später oder kehre zum Profil zurück.','Room access could not be checked. Try later or return to your profile.']];
const known=new Set([...TABLE,...ROWS].map(r=>r[0]));
edit('index-i18n-table.mjs',s=>s.replace('export const ROWS = [','export const ROWS = [\n'+additions.filter(r=>!known.has(r[0])).map(r=>'  '+JSON.stringify(r)+',').join('\n')));
// Copy the existing compact palette values rather than inventing replacements.
const style=fs.readFileSync('web_launch/style.css','utf8');
const presets=[...style.matchAll(/^html\[data-synera-style="(noir|alpine|copper|azure|orchid|terracotta|citrus|slate|ink|harvest)"\] \{[^\n]+/gm)].map(m=>m[0]);
edit('site-shell.css',s=>s.replace(/html\[data-synera-style=(noir|alpine|copper|azure|orchid|terracotta|citrus|slate|ink|harvest)\] \{[^\n]+/g,line=>presets.find(p=>p.includes('"'+line.match(/style=(\w+)/)[1]+'"'))));
console.log('Polished Summit source labels, mode links, closed-state copy and palette preservation.');
