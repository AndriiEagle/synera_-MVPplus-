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
