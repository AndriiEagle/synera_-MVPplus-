// Explicit local handoff only: opening the draft alone never persists its text.
import { createJournal } from './journal.mjs';
import { copy } from './simulation-copy.mjs';
import { mountDeviceControls, inputNotice } from './demo-device-controls.mjs';
let storage; try { storage = localStorage; } catch {}
const form = document.getElementById('profile-form');
if (form) { inputNotice(form); mountDeviceControls(form.parentElement, { draftForm: form }); }
function saveDraft() {
  if (!form || document.getElementById('workspace')?.hidden) return;
  const data = new FormData(form), profile = { name: String(data.get('display_name') || '').trim(), offers: String(data.get('offers') || '').trim(), seeks: String(data.get('seeks') || '').trim() };
  if (!Object.values(profile).some(Boolean)) return;
  const journal = createJournal(storage);
  if (JSON.stringify(profile) !== JSON.stringify(journal.profile())) journal.add('profile', 'visitor', copy(document.documentElement.lang, 'profileSaved'), { source: 'profile', profile });
  if (!journal.persistent) {
    // Stay in this tab with the filled form; do not silently lose the handoff.
    document.getElementById('notice').textContent = copy(document.documentElement.lang, 'storageError');
    return false;
  }
  return true;
}
for (const a of document.querySelectorAll('a[href="/simulation.html"]')) a.addEventListener('click', e => { if (saveDraft() === false) e.preventDefault(); });
const action = document.getElementById('draft-journal-save');
action?.addEventListener('click', () => { if (saveDraft()) document.getElementById('notice').textContent = copy(document.documentElement.lang, 'profileSaved'); });
