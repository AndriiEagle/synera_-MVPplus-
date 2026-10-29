// Additive source splice: never serialize a page or replace another lane's copy/scripts/forms.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export const scenes = JSON.parse(await readFile(new URL('./scenes.json',import.meta.url),'utf8'));
export function figure(name) {
  return `<figure class="scene scene-${name}"><picture><source type="image/webp" srcset="/scene-${name}.webp 768w, /scene-${name}@2x.webp 1536w" sizes="(max-width:700px) calc(100vw - 48px), 768px"><img src="/scene-${name}.webp" width="768" height="512" alt="" decoding="async" loading="lazy"></picture></figure>`;
}
export function insertScene(html,row) {
  const newline=html.includes('\r\n')?'\r\n':'\n';
  if(!html.includes('href="/scenes.css"'))html=html.replace('</head>',`<link rel="stylesheet" href="/scenes.css">${newline}</head>`);
  if(/<figure\b[^>]*class="scene\b/.test(html)) {
    if(!html.includes(`class="scene scene-${row.name}"`)) throw new Error(`Unexpected scene in ${row.page}`);
    return html;
  }
  const heading = row.heading==='h1' ? /<h1\b[^>]*>/ : new RegExp(`<([a-z]+)\\b[^>]*class="[^"]*\\b${row.heading.slice(1)}\\b[^"]*"[^>]*>`);
  const start=heading.exec(html);
  if(!start) throw new Error(`Heading ${row.heading} missing from ${row.page}`);
  const tag=row.heading==='h1'?'h1':start[1];
  const tokens=new RegExp(`</?${tag}\\b[^>]*>`,'g'); tokens.lastIndex=start.index;
  let depth=0,end;
  for(let m;(m=tokens.exec(html));) {depth+=m[0].startsWith('</')?-1:1;if(depth===0){end=tokens.lastIndex;break;}}
  if(!end) throw new Error(`Unclosed heading block in ${row.page}`);
  html=html.slice(0,end)+newline+figure(row.name)+html.slice(end);
  return html;
}
export async function apply(root,{requireAll=false}={}) {
  const result={changed:[],pending:[],runtime:[]};
  for(const row of scenes) {
    const path=resolve(root,'web_launch',row.page);let before;
    try{before=await readFile(path,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;result.pending.push(row.page);continue;}
    let after;
    if(row.page==='pilot-consent.html'&&!/<h1\b/.test(before)&&before.includes('id="legal-documents"')){
      const renderer=await readFile(resolve(root,'web_launch/legal-documents.mjs'),'utf8');
      if(!renderer.includes('class="scene scene-legal"'))throw new Error('Apply the reviewed owning-lane renderer patch before Pilot consent integration');
      after=before.includes('href="/scenes.css"')?before:before.replace('</head>','<link rel="stylesheet" href="/scenes.css">\n</head>');
      result.runtime.push({page:row.page,renderer:'legal-documents.mjs'});
    }else after=insertScene(before,row);
    if(after!==before){await writeFile(path,after);result.changed.push(row.page);}
  }
  if(requireAll&&result.pending.length)throw new Error(`Merge owning lane first: ${result.pending.join(', ')}`);
  return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(await apply(resolve(import.meta.dirname,'../..'),{requireAll:process.argv.includes('--require-all')}),null,2));
