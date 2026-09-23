import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

function validateDraft({ plan, html, policy, active }) {
  const errors = [];
  const require = (value, message) => { if (!value) errors.push(message); };
  require(/LEGAL_PREPARATION_DRAFT[\s\S]*EXPERT_REQUIRED/.test(plan), 'draft must reject legal-certification claim');
  require(/FDPIC[\s\S]*Cross-border transfer/.test(plan) && /eur-lex\.europa\.eu[\s\S]*AI Act/.test(plan), 'claim map must retain primary sources');
  require(!/зараз НЕ тригерований/.test(plan), 'plan must not make a categorical GDPR non-scope claim');
  require(/2026-09-23-legal-draft/.test(html) && /ще не є активною політикою входу/.test(html), 'page must not pretend draft acceptance is live');
  require(/Видимість:[\s\S]*Матчинг і введення:[\s\S]*Зовнішній AI:[\s\S]*Запис і публікація:/.test(html), 'page must keep distinct consent boundaries');
  require(/Зовнішній AI:[\s\S]*вимкнений[\s\S]*договір обробки[\s\S]*opt-in/.test(html), 'external AI needs consent plus transfer and contract gate');
  require(/запис зустрічей і авто-публікація вимкнені/.test(html), 'recording and autopost must remain off');
  require(/Cloudflare[\s\S]*глобально[\s\S]*окремою конфігурацією/.test(html), 'page must not promise a residency setting without evidence');
  require(/QR-bill activation/.test(plan) && /manually issued invoice/.test(plan), 'payment finding must remain a hold, not an activation claim');
  const version = policy.match(/POLICY_VERSION\s*=\s*'([^']+)'/)?.[1];
  require(version && active.includes(version), 'the active legal page must show the policy version recorded by login');
  require(!active.includes('2026-09-23-legal-draft'), 'draft must not replace the active legal page');
  require(version !== '2026-09-23-legal-draft', 'draft must not be misrepresented as accepted login version');
  if (errors.length) throw new Error(errors.join('; '));
}

test('legal draft gives a truthful, source-linked pre-launch boundary', async () => {
  const [plan, html, policy, active] = await Promise.all([
    readFile(path.join(here, 'SWISS_LEGAL_LAYER.uk.md'), 'utf8'),
    readFile(path.join(here, 'LEGAL_PAGE_DRAFT.html'), 'utf8'),
    readFile(path.join(root, 'web_launch', 'pilot-policy.mjs'), 'utf8'),
    readFile(path.join(root, 'web_launch', 'legal.html'), 'utf8'),
  ]);
  assert.doesNotThrow(() => validateDraft({ plan, html, policy, active }));
});

test('adversarial mutation: deleting the external-AI hold fails local acceptance', async () => {
  const [plan, html, policy, active] = await Promise.all([
    readFile(path.join(here, 'SWISS_LEGAL_LAYER.uk.md'), 'utf8'),
    readFile(path.join(here, 'LEGAL_PAGE_DRAFT.html'), 'utf8'),
    readFile(path.join(root, 'web_launch', 'pilot-policy.mjs'), 'utf8'),
    readFile(path.join(root, 'web_launch', 'legal.html'), 'utf8'),
  ]);
  const weakened = html.replace('вимкнений. Його не можна увімкнути самим чекбоксом: до першого передавання потрібні окреме повідомлення про постачальника, мінімальний payload, договір обробки/механізм міжнародної передачі та новий явний opt-in.', 'доступний після чекбокса.');
  assert.throws(() => validateDraft({ plan, html: weakened, policy, active }), /external AI needs consent plus transfer and contract gate/);
  assert.throws(() => validateDraft({ plan, html, policy, active: html }), /draft must not replace the active legal page/);
});
