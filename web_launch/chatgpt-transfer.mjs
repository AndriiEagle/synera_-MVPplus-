import { normalizeBrief, CAPABILITIES, CITIES, LANGUAGES, MODES } from './profile-brief.mjs';

const UNKNOWN = 'Не вказано';
const own = (value, key) => value != null && typeof value === 'object' && Object.hasOwn(value, key) ? value[key] : undefined;
const labels = entries => entries.map(([id, label]) => `${id}: ${label}`).join('; ');

export const CHATGPT_PROFILE_PROMPT = `Ти допомагаєш людині створити короткий професійний профіль Synera з її ВЛАСНОГО звичайного чату ChatGPT.

Використай лише факти, які реально доступні тобі зараз у цьому чаті, у збережених пам’ятях або явно посиланих чатах. Ти можеш не мати доступу до повної історії чи пам’ятей: не стверджуй, що маєш такий доступ, і не вигадуй пропущені факти. Не додавай до профілю email, телефон, точну адресу, облікові дані, медичні дані, приватні фінанси, дані сім’ї, третіх осіб або сирий текст історії чатів.

Поверни ЛИШЕ один JSON без Markdown. Це має бути рівно формат synera-profile-2:
{
  "format": "synera-profile-2",
  "profile": {
    "display_name": "", "city": "", "offers": "", "seeks": "",
    "is_discoverable": false, "map_visible": false,
    "brief": {
      "version": 1, "goal": "", "offer_tags": [], "need_tags": [],
      "languages": [], "modes": [], "available_from": "", "available_until": "",
      "remote": false, "max_km": 25, "city_code": "",
      "confidentiality": false, "accepts_confidentiality": false
    }
  }
}

Обмеження: display_name до 60 символів; city до 80; offers і seeks до 300; goal до 240. Якщо факт невідомий, постав порожній рядок або [], не вигадуй дату доступності, готовність, юридичні чи приватні уподобання. Історичну доступність або давню ціль не вважай поточною без явного підтвердження в поточному контексті; невідомі дати лишай порожніми. Усі булеві поля видимості, приватності й дозволів мають лишатися false. Використовуй тільки ці точні ID, якщо для них є явний доказ:
capability IDs: ${labels(Object.entries(CAPABILITIES))}
language IDs: ${labels(Object.entries(LANGUAGES))}
mode IDs: ${labels(Object.entries(MODES))}
city_code IDs: ${labels(Object.entries(CITIES).map(([id, city]) => [id, city.label]))}
Не додавай жодних інших полів або ID.`;

const valueOrUnknown = value => value || UNKNOWN;
const mapped = (ids, dictionary) => ids.map(id => dictionary[id]).filter(Boolean).join(', ') || UNKNOWN;

export function summarizeTransfer(profile) {
  const input = profile && typeof profile === 'object' ? profile : {};
  const brief = normalizeBrief(own(input, 'brief'));
  const city = CITIES[brief.city_code]?.label || '';
  const location = city || (brief.remote ? 'Онлайн' : '');
  const availability = brief.available_from && brief.available_until
    ? `${brief.available_from} — ${brief.available_until}`
    : brief.available_from || brief.available_until || '';
  return [
    { label: 'Ціль', value: valueOrUnknown(brief.goal) },
    { label: 'Пропоную', value: mapped(brief.offer_tags, CAPABILITIES) },
    { label: 'Шукаю', value: mapped(brief.need_tags, CAPABILITIES) },
    { label: 'Мови', value: mapped(brief.languages, LANGUAGES) },
    { label: 'Формати', value: mapped(brief.modes, MODES) },
    { label: 'Місто або онлайн', value: valueOrUnknown(location) },
    { label: 'Онлайн', value: brief.remote ? 'Так' : 'Ні' },
    { label: 'Максимальна відстань', value: `${brief.max_km} км` },
    { label: 'Доступність', value: valueOrUnknown(availability) },
    { label: 'Потребує конфіденційності', value: brief.confidentiality ? 'Так' : 'Ні' },
    { label: 'Приймає конфіденційність', value: brief.accepts_confidentiality ? 'Так' : 'Ні' },
  ];
}
