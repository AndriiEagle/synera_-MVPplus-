import { profileMatchHint } from './profile-portability.mjs';

// Fictional adults, public sample data only. Never insert these into auth.users.
export const BOT_PROFILES = Object.freeze([
  ['mira', 'Mira · Demo', 'Дизайн продукту', 'UX design, Figma, дизайн продукту', 'B2B sales, customer interviews'],
  ['leo', 'Leo · Demo', 'B2B-продажі', 'B2B sales, перші інтро та customer interviews', 'UX design і відеопрезентація'],
  ['nora', 'Nora · Demo', 'AI-автоматизація', 'AI workflow automation, CRM', 'Ціна підписки, finance та budget'],
  ['felix', 'Felix · Demo', 'Фінанси', 'Finance, pricing, бюджет малого бізнесу', 'AI workflow automation'],
  ['ines', 'Ines · Demo', 'Відео', 'Video, відеопрезентація, монтаж', 'B2B sales та події для community'],
  ['sam', 'Sam · Demo', 'Спільноти', 'Community events, воркшопи, meetup', 'Video та дизайн подій'],
  ['tessa', 'Tessa · Demo', 'Дослідження', 'Customer research, interviews, validation', 'AI automation і UX design'],
  ['noah', 'Noah · Demo', 'Прототипи', 'AI automation, UX design, прототипи', 'Customer research, pricing'],
  ['lina', 'Lina · Demo', 'Брендинг', 'Brand design, фотографія та video', 'Community events і B2B sales'],
  ['omar', 'Omar · Demo', 'Партнерства', 'B2B sales, community events', 'Brand design і customer research'],
].map(([key, display_name, role, offers, seeks], index) => Object.freeze({
  id: `bot-${key}`, display_name, role, offers, seeks, city: 'Zürich',
  is_discoverable: true, is_bot: true, index,
})));

export const DEMO_PLACES = Object.freeze([
  { id: 'west', name: 'Zürich West · демозона', lat: 47.389, lon: 8.518 },
  { id: 'hb', name: 'Hauptbahnhof · демозона', lat: 47.378, lon: 8.540 },
  { id: 'university', name: 'Університетський район · демозона', lat: 47.376, lon: 8.548 },
  { id: 'sihl', name: 'Sihl · демозона', lat: 47.366, lon: 8.530 },
  { id: 'lake', name: 'Набережна · демозона', lat: 47.358, lon: 8.550 },
]);
const ACTIVITIES = [
  ['available', 'Відкритий до короткої розмови'],
  ['working', 'Працює над маленьким прототипом'],
  ['meeting', 'Обговорює спільний експеримент'],
  ['learning', 'Перевіряє ідею з учасниками спільноти'],
  ['walking', 'Перерва і прогулянка'],
];
export function hourSlot(at = new Date()) {
  const ms = new Date(at).getTime();
  if (!Number.isFinite(ms)) throw new Error('Некоректний симуляційний годинник');
  return Math.floor(ms / 3600000);
}
export function simulationAt(at = new Date()) {
  const slot = hourSlot(at);
  const localHour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hourCycle: 'h23' }).format(new Date(at)));
  return BOT_PROFILES.map((bot, index) => {
    const awake = localHour >= 8 && localHour < 21;
    const place = DEMO_PLACES[((awake ? slot : 0) + index) % DEMO_PLACES.length];
    const [state, activity] = awake ? ACTIVITIES[(slot + index) % ACTIVITIES.length] : ['offline', 'Відпочиває до ранку'];
    return { ...bot, state, activity, place: place.name, lat: place.lat + (index % 2) * 0.0012,
      lon: place.lon + Math.floor(index / 2) * 0.001, updated_hour: slot,
      location_kind: 'synthetic', source: 'local-simulation' };
  });
}
export function simulatedReply(sender, bot, at = new Date()) {
  if (!bot?.is_bot || !BOT_PROFILES.some(p => p.id === bot.id)) throw new Error('Потрібен отримувач для симуляції');
  const hint = profileMatchHint(sender, bot);
  const accepted = hint.status === 'reciprocal';
  return { status: accepted ? 'accepted' : 'declined', simulated: true,
    response_note: accepted
      ? `ДЕМО-ВІДПОВІДЬ: ${hint.summary} Давай почнемо з 20 хвилин і одного спільного експерименту.`
      : `ДЕМО-ВІДПОВІДЬ: ${hint.summary} Уточни, що кожен отримає; цей запит поки відхиляю.`,
    responded_hour: hourSlot(at) };
}
export function demoCollaborations(at = new Date()) {
  const bots = simulationAt(at);
  return [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9]].map(([a, b]) => ({
    id: `${bots[a].id}:${bots[b].id}:${hourSlot(at)}`, left: bots[a].display_name, right: bots[b].display_name,
    summary: profileMatchHint(bots[a], bots[b]).summary,
    next_step: ['20 хвилин: сформулювати потребу', 'Обмінятися прикладами робіт', 'Домовитись про маленький спільний тест'][hourSlot(at) % 3],
    simulated: true,
  }));
}
