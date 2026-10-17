import { importSessionArchive } from './session-value.mjs';
const KEY = 'synera.studio.journey-handoff.v1';
export function stageJourneyHandoff(archive, storage = globalThis.sessionStorage) {
  const checked = importSessionArchive(archive);
  storage.setItem(KEY, JSON.stringify(checked));
  return '/studio.html#session';
}
export function takeJourneyHandoff(storage = globalThis.sessionStorage) {
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  const checked = importSessionArchive(raw);
  storage.removeItem(KEY);
  return checked;
}
