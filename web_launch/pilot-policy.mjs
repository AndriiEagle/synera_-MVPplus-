export const POLICY_VERSION = '2026-09-05-pilot-2';
export const OPERATOR = Object.freeze({ name: 'Andrii Pokrovskyi', email: 'andriipokrovskyi@gmail.com' });
export function consentRecord(value = {}) {
  const terms = value.terms === true || value.terms_accepted === true;
  const privacy = value.privacy === true || value.privacy_acknowledged === true;
  const demo = value.demo === true;
  if (terms !== true || privacy !== true) throw new Error('Прочитай правила й повідомлення про дані та підтвердь обидва пункти.');
  return { policy_version: POLICY_VERSION, terms_accepted: true, privacy_acknowledged: true, demo_only: demo === true };
}
export const GPT_PROFILE_PROMPT = `Допоможи мені перенести ВЛАСНИЙ професійний профіль у Synera. Використай лише те, що я явно повідомив у цій розмові. Не вигадуй факти, посади, вміння чи результати. Не додавай email, телефон, точну адресу, ключі, здоров'я, фінансові реквізити, приватні дані інших людей або текст усієї переписки. Якщо чогось не знаєш, залиш порожній рядок. Стисло опиши конкретну користь, яку я можу дати, і що шукаю. Поверни тільки JSON без markdown:
{"format":"synera-profile-1","profile":{"display_name":"до 60 символів","city":"місто, до 80 символів","offers":"конкретно, до 300 символів","seeks":"конкретно, до 300 символів","is_discoverable":false}}
Я сам перевірю прев'ю в Synera перед збереженням.`;
