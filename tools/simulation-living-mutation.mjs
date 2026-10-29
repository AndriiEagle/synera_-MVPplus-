// Finite negative control: same semantic oracle, current source and one in-memory mutant.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const file = new URL('../web_launch/simulation-living.mjs', import.meta.url);
const source = await fs.readFile(file, 'utf8');
const load = text => import('data:text/javascript;base64,' + Buffer.from(text.replace(/from '(\.\/[^']+)'/g, (_, path) => `from '${new URL(path, file)}'`)).toString('base64'));
function oracle(api) {
  let s = api.startVisitor('bot-mira', { name: 'Alex', offers: 'Research', seeks: 'Draft' }, 29, 'en');
  s = api.personaRespond(api.visitorMessage(s, 'Yes', 'en'), 'en');
  assert.deepEqual(s.approvals, { visitor: true, persona: true });
  s = api.personaRespond(api.visitorMessage(s, 'Instead, one sketch', 'en'), 'en');
  assert.deepEqual(s.approvals, { visitor: false, persona: false });
  assert.throws(() => api.recordVisitorResult(s, 'en'));
}
oracle(await load(source));
const original = "s.approvals = { visitor: false, persona: false }; s.status = 'negotiating';";
assert.ok(source.includes(original));
const mutant = source.replace(original, "s.status = 'negotiating'; // mutant preserves stale consents");
const changed = await load(mutant);
assert.throws(() => oracle(changed), { name: 'AssertionError' });
console.log(JSON.stringify({ sourceSha256: createHash('sha256').update(source).digest('hex'), original: 'PASS', staleConsentMutant: 'REJECTED', providerCalls: 0 }, null, 2));
