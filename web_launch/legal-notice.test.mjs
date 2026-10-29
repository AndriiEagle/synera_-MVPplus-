import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NOTICE, TERMS, PILOT, SOURCES } from './legal-documents.mjs';
import { DEMO_COPY } from './demo-device-controls.mjs';
const checklist=JSON.parse(await readFile('docs/integrate-20261029/notice-must-checklist.json','utf8'));
function gaps(notice){return checklist.items.filter(item=>!notice[item.section] || item.terms.some(term=>!new RegExp(term,'iu').test(notice[item.section].join(' ')))).map(item=>item.id);}
test('I4: every REPORT_A §6.1 MUST/conditional MUST is covered in DE, UK and EN; release gaps stay explicit',()=>{
  assert.equal(checklist.items.length,10);
  for(const [lang,notice]of Object.entries(NOTICE)){
    assert.deepEqual(gaps(notice),[],lang);
    assert.deepEqual(Object.keys(notice),Object.keys(NOTICE.de));
    assert.match(notice.controller.join(' '),/\[.*OPERATOR NAME/);
    assert.match(notice.safeguards.join(' '),/\[/);
  }
  for(const key of ['uk','de','en']){assert.deepEqual(Object.keys(DEMO_COPY[key]),Object.keys(DEMO_COPY.de));assert.equal(PILOT[key].length,PILOT.de.length);assert.equal(TERMS[key].length,2);}
  for(const value of Object.values(SOURCES))assert.match(value,/^https:\/\//);
});
test('I4: checklist rejects removed controller, omitted transfer basis and missing human review',()=>{
  const removed=structuredClone(NOTICE.de);delete removed.controller;delete removed.safeguards;removed.automated=['KI','Live-KI ausgeschaltet'];
  assert.deepEqual(gaps(removed),['controller','contact','safeguards','automated']);
});
test('I5: ops and meeting handoff retain incident fields, conditional legal gates and owner actions with sources',async()=>{
 const ops=await readFile('docs/PRIVACY-BY-DESIGN-20261029.uk.md','utf8'), meeting=await readFile('docs/GILBERT-MEETING-20261030.uk.md','utf8');
 for(const phrase of ['voraussichtlich hohes Risiko','so rasch als möglich','databreach.edoeb.admin.ch','DPIA-A01','EXPERT_REQUIRED','https://www.fedlex.admin.ch/eli/cc/2022/568/de','https://www.databricks.com/legal/dpa'])assert.ok(ops.includes(phrase),phrase);
 for(const field of ['a','b','c','d','e','f','g'])assert.match(ops,new RegExp('\\| '+field+' \\|'));
 for(const phrase of ['Vielen Dank, dass Sie sich heute Zeit nehmen.','Die Live-KI ist ausgeschaltet.','NO-GO','Підписана участь','Auth/session/API/branch/backup','so rasch als möglich'])assert.ok((meeting+ops).includes(phrase),phrase);
});
