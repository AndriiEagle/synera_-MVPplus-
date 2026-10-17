import fs from 'node:fs/promises';
const root='artifacts/mobile-20261007/responsive/';
const r=JSON.parse(await fs.readFile(root+process.argv[2]+'/matrix.json','utf8'));
console.log(JSON.stringify({summary:r.summary,failures:r.failures,findings:r.rows.filter(r=>r.issues.length&&(!process.argv.includes('--product')||r.page!=='catalogue')).map(r=>({size:r.size,page:r.page,issues:r.issues})),journeys:r.rows.filter(r=>r.journey).map(r=>({size:r.size,...r.journey}))},null,2));
