// C14.L5 — тести vector store. Запуск з КОРЕНЯ: node web_launch/memory/vector_store.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { STORE_OPTIONS, DEFAULT_STORE, resolveStore, decisionRecord, isAllowlistedLocation } from './vector_store.mjs';

test('C14.L5: дефолт = local-tfidf (диск-доказ D:\AI_DEPOT), env не заданий', () => {
  const r = resolveStore({ SYNERA_VECTOR_STORE: undefined });
  assert.equal(r.store, 'local-tfidf');
  assert.equal(r.overridden, false);
  assert.equal(r.source, 'default');
});

test('C14.L5: env override перемикає store; невідоме значення — fail-closed українською', () => {
  assert.equal(resolveStore({ SYNERA_VECTOR_STORE: 'local-tfidf' }).overridden, true);
  assert.throws(() => resolveStore({ SYNERA_VECTOR_STORE: 'holographic' }), /Невідомий vector store/);
});

test('C14.L5: nvidia-nim вимагає NVIDIA_API_KEY — без ключа fail-closed', () => {
  assert.throws(() => resolveStore({ SYNERA_VECTOR_STORE: 'nvidia-nim' }), /NVIDIA_API_KEY/);
  const ok = resolveStore({ SYNERA_VECTOR_STORE: 'nvidia-nim', NVIDIA_API_KEY: 'k' });
  assert.equal(ok.store, 'nvidia-nim');
});

test('C14.L5: локальна точка store існує на диску (перевірка з часу розвідки)', async () => {
  const { localStoreExists } = await import('./vector_store.mjs');
  assert.equal(await localStoreExists(), true, 'D:\\AI_DEPOT\\vector_db\\context-gateway має існувати');
});

test('C14.L5: decisionRecord — реверсивний дефолт, не owner-approval', () => {
  const r = decisionRecord();
  assert.equal(r.layer, 'C14.L5');
  assert.match(r.decided_by, /reversible-default/);
  assert.equal(r.reversible, true);
});

test('C14.L5: allowlist locations — тільки з STORAGE_OPTIONS, довільні шляхи відкидаються', () => {
  assert.equal(isAllowlistedLocation('D:\\AI_DEPOT\\vector_db\\context-gateway'), true);
  assert.equal(isAllowlistedLocation('C:\\Windows'), false);
  assert.equal(isAllowlistedLocation(null), false);
});

test('C14.L5: STORE_OPTIONS заморожені, обидва варіанти реверсивні (Q9 контракт)', () => {
  assert.ok(Object.isFrozen(STORE_OPTIONS));
  for (const o of STORE_OPTIONS) assert.equal(o.reversible, true);
});