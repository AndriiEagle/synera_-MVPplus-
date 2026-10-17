let capability = null;
const unavailable = reason => ({ enabled: false, mode: 'unavailable', model: '', provider: '', reason });
const hashPattern = /^[a-f0-9]{64}$/;
const sha256 = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(value => value.toString(16).padStart(2, '0')).join('');
export async function readJourneyAICapability() {
  try {
    const response = await fetch('/config.json', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error('config');
    const value = (await response.json()).journeyAI;
    if (value?.enabled !== true || value.mode !== 'local' || location.hostname !== '127.0.0.1' || typeof value.nonce !== 'string' || !value.nonce) {
      capability = null;
      return unavailable('На цьому сайті серверний AI ще не активований. Доступний окремий сценарний режим.');
    }
    capability = value;
    return { enabled: true, mode: 'local', model: value.model, provider: 'local-domovyk', reason: 'Текст обробляє локальна модель на цьому комп’ютері. Дані не надсилаються зовнішньому провайдеру.' };
  } catch {
    capability = null;
    return unavailable('Не вдалося перевірити серверний AI. Сценарний режим доступний без мережі.');
  }
}
export async function requestJourneyReply({ state, text, consent, signal } = {}) {
  if (consent !== true || !capability || !state || state.phase !== 'chat') throw new Error('Потрібні доступний AI і твій окремий дозвіл.');
  const messages = state.messages.map(message => ({ id: message.id, author: message.author, text: message.text }));
  const latest = messages.at(-1);
  if (!latest || latest.author !== 'you' || latest.text !== text || typeof latest.id !== 'string' || !latest.id) throw new Error('AI може відповідати лише на останнє точне повідомлення в розмові.');
  const response = await fetch('/api/journey-ai', { method: 'POST', credentials: 'same-origin', signal,
    headers: { 'Content-Type': 'application/json', 'X-Synera-Local': capability.nonce },
    body: JSON.stringify({ version: 1, consent: true, personId: state.personId, mine: { gives: state.mine.gives, needs: state.mine.needs }, messages, turnId: latest.id }),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.message || 'AI не зміг відповісти. Повідомлення й умови збережені.');
  const receipt = value.receipt;
  if (typeof value.text !== 'string' || !value.text.trim() || value.turnId !== latest.id || !hashPattern.test(value.replySha256 || '') || await sha256(value.text) !== value.replySha256 || receipt?.engine !== 'local-domovyk' || receipt.providerCalls !== 0 || receipt.actualUsd !== 0 || typeof receipt.actualModel !== 'string' || !receipt.actualModel.trim() || !hashPattern.test(receipt.modelSha256 || '') || receipt.finishReason !== 'stop' || !hashPattern.test(receipt.promptSha256 || '') || !hashPattern.test(receipt.outputSha256 || '')) throw new Error('AI-відповідь не має перевіреного локального походження.');
  return { text: value.text, receipt: { ...receipt, turnId: value.turnId, replySha256: value.replySha256 } };
}
