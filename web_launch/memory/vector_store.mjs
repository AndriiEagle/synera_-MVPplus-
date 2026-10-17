// C14.L5 — Vector store конфігурація (REVERSIBLE_DEFAULT, реверсивно за наказом оператора).
// Канон: BLOCKED_HUMAN.md Q9; READINESS_DNA C14.L5 «location confirmed».
// Диск-факти: D:\AI_DEPOT\vector_db\context-gateway існує (vector-producer/ + sqlite);
// NVIDIA lane — пакунок PRESENT_BUT_UNTESTED, живі виклики тільки з exact approval капу.
// Рішення: локальний store = дефолт (A-варіант з Q9), перемикається конфігом, реверсивно.
import fs from 'node:fs/promises';
import path from 'node:path';

export const STORE_OPTIONS = Object.freeze([
  { id: 'local-tfidf', location: 'D:\\AI_DEPOT\\vector_db\\context-gateway', cost: 0, reversible: true },
  { id: 'nvidia-nim', location: 'C:\\Users\\Andrii\\Desktop\\KI-distributed-factory\\nvidia-cuda-lane', cost: 'requires_exact_cap_approval', reversible: true },
]);

export const DEFAULT_STORE = 'local-tfidf';

function explicitStore() {
  const v = process.env.SYNERA_VECTOR_STORE;
  return v && STORE_OPTIONS.some(o => o.id === v) ? v : null;
}

/**
 * Активний store: SYNERA_VECTOR_STORE > дефолт (local-tfidf).
 * Невідоме значення env — fail-closed з українською помилкою (не тихий fallback).
 */
export function resolveStore(env = process.env) {
  const v = env.SYNERA_VECTOR_STORE;
  if (v === undefined || v === null || v === '') return { store: DEFAULT_STORE, source: 'default', overridden: false };
  const option = STORE_OPTIONS.find(o => o.id === v);
  if (!option) throw new Error('Невідомий vector store: ' + v);
  if (option.id === 'nvidia-nim') {
    if (!env.NVIDIA_API_KEY) throw new Error('nvidia-nim потребує NVIDIA_API_KEY і exact approval капу (TOKEN_MONSTER)');
  }
  return { store: option.id, location: option.location, source: 'env', overridden: true };
}

/** Перевірка локальної точки на диску (детермінована, без мережі). */
export async function localStoreExists() {
  try {
    const stat = await fs.stat(STORE_OPTIONS[0].location);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

/** Канонічний запис вибору для bible/STATUS.md (реверсивний дефолт, не owner-approval). */
export function decisionRecord() {
  const active = resolveStore();
  return {
    layer: 'C14.L5',
    decided_by: active.overridden ? 'operator:env-override' : 'reversible-default:local-tfidf',
    store: active.store,
    reversible: true,
    note: 'nvidia-nim залишається доступним перемикачем env після exact approval капу',
  };
}

/** Перевірка, що шлях store — з дозволеного списку (без довільних шляхів). */
export function isAllowlistedLocation(location) {
  return STORE_OPTIONS.some(o => path.normalize(o.location) === path.normalize(String(location ?? '')));
}