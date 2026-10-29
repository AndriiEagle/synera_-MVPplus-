import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('./simulation-mode.mjs',import.meta.url),'utf8');
test('public mode is selected before parsing while explicit private/LAB links keep their original route',()=>{
  for(const [suffix,mode]of [['','living'],['?lang=de','living'],['?lab=1','lab'],['?person=bot-mira','lab'],['#key=demo-only','lab']]){
    const document={documentElement:{dataset:{}}};
    vm.runInNewContext(script,{document,location:{href:`https://example.invalid/simulation.html${suffix}`},URL});
    assert.equal(document.documentElement.dataset.simulationMode,mode);
  }
});
