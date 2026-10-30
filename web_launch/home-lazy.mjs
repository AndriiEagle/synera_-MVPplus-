// The optional tour and its translation table do not block the first input.
// The module installs its own replay listener after the first explicit request.
import { readInputDraft, writeInputDraft } from './input-drafts.mjs';
// The first text input works and saves even while speech enhancement is loading.
const capture = document.getElementById('capture-home');
if (capture) {
  const saved = readInputDraft('capture:home');
  if (!capture.value && typeof saved?.text === 'string') capture.value = saved.text;
  capture.addEventListener('input', () => writeInputDraft('capture:home', {text:capture.value}));
}
let loaded = false, loading = false;
document.getElementById('tour-start')?.addEventListener('click', async () => {
  if (loaded || loading) return;
  loading = true;
  try { const module = await import('./onboarding-tour.mjs'); loaded = true; module.activeTour?.start(); }
  finally { loading = false; }
});
