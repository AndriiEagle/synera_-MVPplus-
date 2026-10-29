import fs from 'node:fs/promises';
import { ROWS } from '../web_launch/legal-i18n.mjs';
const url = new URL('../web_launch/legal.html', import.meta.url), translations = new URL('../web_launch/legal-i18n.mjs', import.meta.url);
let html = await fs.readFile(url, 'utf8'), source = await fs.readFile(translations, 'utf8');
const replacements = [
  ['Чернетки, імпорт і AI-прев’ю', [
    'Чернетка профілю, імпорт і AI-прев’ю на головній зберігаються лише в пам’яті вкладки до закриття або перезавантаження. Окремі чернетки Demo та збережені сесії Studio мають строк 30 днів; точні сховища та перехідний строк старих чернеток описані у «Твої дані». Офлайн-кеш містить тільки код і статичні сторінки. Neon використовує захищену HttpOnly cookie сесії; токен недоступний JavaScript. На спільному пристрої виходь з акаунта. Старий шлях Supabase може зберегти токен відновлення лише за явним вибором; у Neon він не використовується.',
    'Profilentwurf, Import und KI-Vorschau der Startseite bleiben bis zum Schliessen oder Neuladen nur im Arbeitsspeicher des Tabs. Demo-Entwürfe und gespeicherte Studio-Sitzungen haben eine Frist von 30 Tagen; genaue Speicher und die Übergangsfrist für alte Entwürfe stehen unter «Deine Daten». Der Offline-Cache enthält nur Code und statische Seiten. Neon nutzt ein geschütztes HttpOnly-Sitzungscookie; das Token ist für JavaScript nicht zugänglich. Melde dich auf gemeinsam genutzten Geräten ab. Der alte Supabase-Weg kann ein Refresh-Token nur nach ausdrücklicher Wahl speichern; Neon verwendet diesen Weg nicht.',
    'The home-page profile draft, import and AI preview stay only in tab memory until closing or reloading. Demo drafts and saved Studio sessions have a 30-day retention period; exact storage and the grace period for old drafts are listed in “Your data”. The offline cache contains only code and static pages. Neon uses a protected HttpOnly session cookie; its token is inaccessible to JavaScript. Sign out on shared devices. The legacy Supabase route can store a refresh token only after an explicit choice; Neon does not use it.',
  ]],
  ['Фон OpenStreetMap завантажується', [
    'Фон OpenStreetMap завантажується після твого кліку; постачальник отримує IP та область перегляду. Synera не додає cookie для стеження, рекламних чи аналітичних трекерів. Строки по категоріях, постачальники, країни та непідтверджені підстави передавання наведені нижче й у «Твої дані». Застосування строків на живому сервері та резервні копії ще потребують перевірки; автоматичне видалення акаунта у провайдера не підтверджене.',
    'OpenStreetMap wird nach deinem Klick geladen; der Anbieter erhält IP-Adresse und Kartenausschnitt. Synera fügt keine Tracking-Cookies, Werbe- oder Analyse-Tracker hinzu. Fristen je Kategorie, Anbieter, Länder und unbestätigte Übermittlungsgrundlagen stehen unten und unter «Deine Daten». Die Umsetzung auf dem Live-Server und Backups müssen noch geprüft werden; die automatische Kontolöschung beim Anbieter ist nicht bestätigt.',
    'OpenStreetMap loads after your click; the provider receives your IP address and viewport. Synera adds no tracking cookies, advertising or analytics trackers. Category retention, providers, countries and unconfirmed transfer bases are listed below and in “Your data”. Live-server enforcement and backups still need verification; automatic identity-provider account deletion is unconfirmed.',
  ]],
];
for (const [prefix, replacement] of replacements) {
  const row = ROWS.find(row => row[0].startsWith(prefix));
  if (!row) continue; // Already authored: keep this helper idempotent.
  if (!html.includes(row[0])) throw Error('Legal source no longer matches translation');
  html = html.replace(row[0], replacement[0]);
  for (let i = 0; i < 3; i++) {
    const literal = JSON.stringify(row[i]); if (!source.includes(literal)) throw Error('Legal translation literal changed');
    source = source.replace(literal, JSON.stringify(replacement[i]));
  }
}
if (!html.includes('<p class="privacy-draft">')) {
  html = html.replace('</h1>', '</h1><p class="privacy-draft">Чернетка — до перевірки юристом</p>');
  source = source.replace('export const ROWS = [', 'export const ROWS = [\n  ["Чернетка — до перевірки юристом", "Entwurf — vor der juristischen Prüfung", "Draft — pending legal review"],');
}
await fs.writeFile(url, html); await fs.writeFile(translations, source);
