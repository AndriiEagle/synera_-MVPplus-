import test from 'node:test';
import assert from 'node:assert/strict';
import { installStyleSwitcher, ALL_STYLES } from './style-switcher.mjs';
import fs from 'node:fs';
import { PUBLIC_ASSETS } from './assets.mjs';

test('release look defaults to dark with gold (Synera) without overwriting any explicit saved style or consent', () => {
  for (const preference of [null, 'invalid', ...ALL_STYLES]) {
    const saved = new Map(preference === null ? [] : [['synera.style', preference]]);
    const root = { dataset: { consent: 'private' } };
    const current = installStyleSwitcher({ root, button: null, select: null, storage: {
      getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value)
    } });
    assert.equal(current, ALL_STYLES.includes(preference) ? preference : 'synera');
    assert.equal(root.dataset.consent, 'private');
    assert.equal(saved.get('synera.style'), preference === null ? undefined : preference, 'reading a default never writes a preference');
  }
});

test('the common look selector retains the chosen style and never changes consent, including denied storage', () => {
  for (const denied of [false,true]) {
    const handlers = {}, saved = new Map(), root = {dataset:{consent:'private'}};
    const select = {value:'', addEventListener:(type,handler)=>{handlers[type]=handler;}};
    installStyleSwitcher({root,button:null,select,storage:{
      getItem(){if(denied)throw new Error('denied');return null;},
      setItem(key,value){if(denied)throw new Error('denied');saved.set(key,value);}
    }});
    assert.equal(select.value,'synera');
    for(const value of ALL_STYLES){
      select.value=value;handlers.change();
      assert.equal(root.dataset.syneraStyle,value);
      assert.equal(root.dataset.consent,'private');
      assert.equal(saved.get('synera.style'),denied?undefined:value);
    }
  }
});

test('all twelve user pages ship the same single header and one collapsed mode navigation', () => {
  let common;
  for(const page of ['index','summit','studio','studio-journey','real-journey','rooms','triangle','legal','catalogue','get','outcome-archive','lab']){
    const html=fs.readFileSync(new URL(page+'.html',import.meta.url),'utf8');
    const headers=[...html.matchAll(/<header\b[^>]*>[\s\S]*?<\/header>/g)];
    assert.equal(headers.length,1,page);
    common ??= headers[0][0];assert.equal(headers[0][0],common,page);
    assert.equal((html.match(/<details class="more-modes">/g)||[]).length,1,page);
    assert.ok(!/<details class="more-modes"[^>]*\bopen/.test(html),page);
    for(const match of html.matchAll(/(?:src|href)="\/([\w.-]+\.(?:css|mjs|webp))"/g)) {
      if(page !== 'lab') assert.ok(PUBLIC_ASSETS[match[1]],page+' missing public asset '+match[1]);
      assert.ok(fs.existsSync(new URL(match[1],import.meta.url)),match[1]);
    }
  }
});
