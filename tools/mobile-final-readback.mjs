import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='artifacts/mobile-20261007';
for(const area of ['responsive','pricing']){
  console.log(area,await fs.readdir(root+'/'+area));
}
for(const phase of ['red-reviewed','green-targeted','full-reviewed','green-extra','mutation-reviewed']) {
  try {
    const r=JSON.parse(await fs.readFile(`${root}/responsive/${phase}/matrix.json`));
    console.log(JSON.stringify({phase,summary:r.summary,failures:r.failures,findings:r.rows.filter(x=>x.page!=='catalogue'&&x.issues.length).map(x=>({size:x.size,page:x.page,issues:x.issues.length})),source_keys:Object.keys(r).filter(x=>x.includes('hash')||x.includes('source'))}));
  }catch(e){if(e.code!=='ENOENT')throw e;}
}
console.log(JSON.stringify({foreign_sha256:createHash('sha256').update(await fs.readFile('web_launch/journey-ui.mjs')).digest('hex')}));
