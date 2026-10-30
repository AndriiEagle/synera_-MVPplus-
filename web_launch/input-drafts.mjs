// Reload recovery only. No account state, consents, server writes or long-lived store.
export const INPUT_DRAFT_PREFIX = 'synera.voice.draft.v1:';
function tabStorage() { try { return globalThis.sessionStorage; } catch { return null; } }
export function readInputDraft(scope) {
  try { const value = JSON.parse(tabStorage()?.getItem(INPUT_DRAFT_PREFIX + scope) || 'null'); return value && typeof value === 'object' && !Array.isArray(value) ? value : null; } catch { return null; }
}
export function writeInputDraft(scope, data) {
  try { const storage = tabStorage(); if (!storage) return false; storage.setItem(INPUT_DRAFT_PREFIX + scope, JSON.stringify(data)); return true; } catch { return false; }
}
export function clearInputDraft(scope) { try { tabStorage()?.removeItem(INPUT_DRAFT_PREFIX + scope); } catch {} }
const profileNames = ['display_name','city','offers','seeks','goal'];
export function restoreProfileDraft(form) {
  const saved = readInputDraft('profile');
  if (saved) for (const key of profileNames) { const field = form.elements.namedItem(key); if (field && typeof saved[key] === 'string') field.value = saved[key]; }
}
export function saveProfileDraft(form) { return writeInputDraft('profile', Object.fromEntries(profileNames.map(key => [key, form.elements.namedItem(key)?.value || '']))); }
