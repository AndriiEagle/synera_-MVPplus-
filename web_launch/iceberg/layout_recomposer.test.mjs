// C15.L2 — тести Layout Recomposer. Запуск з КОРЕНЯ: node web_launch/iceberg/layout_recomposer.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SCREENS, listScreens, domId, validateOrder, recomposeOrder, toggleVisibility, regressionGate, describeLayout } from './layout_recomposer.mjs';

const BASE_ORDER = ['welcome', 'people', 'profile', 'meetings', 'settings'];

test('C15.L2: реєстр екранів відповідає index.html (реальні id)', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const screen of listScreens()) {
    assert.ok(html.includes('id="' + domId(screen) + '"'), screen + ' ↔ #' + domId(screen));
  }
  assert.deepEqual(listScreens(), BASE_ORDER);
  assert.ok(Object.isFrozen(SCREENS));
});

test('C15.L2: валідна перестановка приймається, дублікати/відсутні/зайві — відкидаються', () => {
  assert.deepEqual(validateOrder(BASE_ORDER), { valid: true, reason: null });
  assert.equal(validateOrder(['people', 'welcome', 'profile', 'meetings', 'settings']).valid, true);
  assert.equal(validateOrder(['people', 'people', 'profile', 'meetings', 'settings']).reason, 'ДУБЛІКАТ ЕКРАНУ');
  assert.equal(validateOrder(['people', 'welcome', 'profile', 'meetings']).reason, 'НЕВІДПОВІДНА ДОВЖИНА');
  assert.equal(validateOrder(['x', 'welcome', 'profile', 'meetings', 'settings']).reason, 'НЕВІДОМИЙ ЕКРАН');
});

test('C15.L2: recomposeOrder move — детерміновано, вхід не мутується', () => {
  const next = recomposeOrder(BASE_ORDER, { move: 'profile', toIndex: 0 });
  assert.deepEqual(next, ['profile', 'welcome', 'people', 'meetings', 'settings']);
  assert.deepEqual(BASE_ORDER, ['welcome', 'people', 'profile', 'meetings', 'settings'], 'вхід не мутується');
  // індекс за межами — обрізається детерміновано
  assert.deepEqual(recomposeOrder(BASE_ORDER, { move: 'profile', toIndex: 99 }), ['welcome', 'people', 'meetings', 'settings', 'profile']);
});

test('C15.L2: recomposeOrder promote — переміщення на початок', () => {
  const next = recomposeOrder(BASE_ORDER, { promote: 'meetings' });
  assert.deepEqual(next, ['meetings', 'welcome', 'people', 'profile', 'settings']);
});

test('C15.L2: recomposeOrder fail-closed — невідомий екран і криве правило (українська помилка)', () => {
  assert.throws(() => recomposeOrder(BASE_ORDER, { move: 'nope', toIndex: 0 }), /Невідомий екран/);
  assert.throws(() => recomposeOrder(BASE_ORDER, {}), /Некоректне правило перекомпоновки/);
  assert.throws(() => recomposeOrder(['broken'], { promote: 'welcome' }), /Некоректний порядок екранів/);
});

test('C15.L2: toggleVisibility — settings захищений інваріантом канону', () => {
  const visible = [...BASE_ORDER];
  assert.throws(() => toggleVisibility(visible, 'settings', false), /Екран приватності не можна приховати/);
  const hidden = toggleVisibility(visible, 'people', false);
  assert.ok(!hidden.includes('people'));
  assert.ok(hidden.includes('settings'), 'settings завжди видимий');
  const back = toggleVisibility(hidden, 'people', true);
  assert.deepEqual(back.sort(), BASE_ORDER.slice().sort());
});

test('C15.L2: toggleVisibility fail-closed на невідомому екрані', () => {
  assert.throws(() => toggleVisibility([], 'ghost', true), /Невідомий екран/);
});

test('C15.L2: regression gate — зміна порядку проходить, зміна набору ламає', () => {
  const ok = regressionGate(
    { order: BASE_ORDER, visible: BASE_ORDER },
    { order: recomposeOrder(BASE_ORDER, { promote: 'profile' }), visible: BASE_ORDER },
  );
  assert.equal(ok.pass, true);
  const broken = regressionGate(
    { order: BASE_ORDER, visible: BASE_ORDER },
    { order: ['welcome', 'people', 'profile', 'meetings', 'settings', 'extra'], visible: BASE_ORDER },
  );
  assert.equal(broken.pass, false);
  assert.ok(broken.reasons.includes('НАБІР ЕКРАНІВ ЗМІНИВСЯ'));
});

test('C15.L2: regression gate ловить приховану панель приватності', () => {
  const broken = regressionGate(
    { order: BASE_ORDER, visible: BASE_ORDER },
    { order: BASE_ORDER, visible: ['welcome', 'people', 'profile', 'meetings'] },
  );
  assert.equal(broken.pass, false);
  assert.ok(broken.reasons.includes('ЕКРАН ПРИВАТНОСТІ ПРИХОВАНИЙ'));
});

test('C15.L2: describeLayout — канонічний рядок для audit log', () => {
  const line = describeLayout(recomposeOrder(BASE_ORDER, { promote: 'profile' }), BASE_ORDER);
  assert.equal(line, 'layout:order=profile>welcome>people>meetings>settings;visible=welcome,people,profile,meetings,settings');
  assert.throws(() => describeLayout(['x'], []), /Некоректний порядок екранів/);
});

test('C15.L2: domId fail-closed на невідомому екрані', () => {
  assert.throws(() => domId('nope'), /Невідомий екран/);
});

// Інваріант канону: машина layout НІКОЛИ не мутує consent-гейти.
test('C15.L2: інваріант — немає мутацій consentState у модулі', () => {
  const src = fs.readFileSync(new URL('./layout_recomposer.mjs', import.meta.url), 'utf8');
  assert.ok(!src.includes('consentState['), 'прямі мутації consentState заборонені');
  assert.ok(!src.includes('consentState.'), 'властивості consentState заборонені');
});