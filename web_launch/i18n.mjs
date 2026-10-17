// web_launch/i18n.mjs — Багатомовне ядро Synera (DE-CH, EN, UK)
// Дотримується інваріантів ринку Швейцарії (Цюрих, Цуг, Берн, Базель)

export const SUPPORTED_LOCALES = ['uk', 'de', 'en'];
export const DEFAULT_LOCALE = 'uk';

export const DICTIONARY = {
  uk: {
    // Brand & Header
    'brand.name': 'synera',
    'header.check_access': 'Перевірка доступу',
    'header.logout': 'Вийти',
    'header.back_to_login': 'До входу',
    'install.button': 'Встановити Synera',
    'install.status': 'Android та iPhone · з домашнього екрана',

    // Intro
    'intro.eyebrow': 'СОЛОПІДПРИЄМЦІ · МАЛИЙ БІЗНЕС · ВЗАЄМНА КОРИСТЬ',
    'intro.title': 'Твоя майстерність.\nВаш спільний результат.',
    'intro.lead': 'Запропонуй те, що вмієш робити добре.\nЗнайди партнера, чия допомога потрібна твоєму бізнесу.',
    'intro.step1.title': 'Даю й шукаю',
    'intro.step1.desc': 'Твоя компетенція та конкретна потреба зараз.',
    'intro.step2.title': 'Бізнес-кейс для двох',
    'intro.step2.desc': 'Користь кожному, теми розмови й умови для узгодження.',
    'intro.step3.title': 'Перевірте співпрацю',
    'intro.step3.desc': 'Домовтеся про один невеликий результат для кожного.',

    // Navigation & Tabs
    'nav.people': 'Люди',
    'nav.profile': 'Мій профіль',
    'nav.meetings': 'Зустрічі',
    'nav.privacy': 'Приватність',

    // People view
    'people.eyebrow': 'ВЗАЄМНІСТЬ МАЄ ПРИЧИНУ',
    'people.title': 'З ким варто поговорити',
    'people.refresh': 'Оновити',
    'people.search_placeholder': 'Дизайн, продажі, дослідження…',
    'people.reciprocal_only': 'Лише сумісні за умовами',
    'people.toggle_map': 'Показати карту',
    'people.more': 'Ще 50 профілів',
    'people.disclaimer': 'Враховуємо підтверджені навички, потреби, мови, час і формат. Це причини для розмови, а не рейтинг цінності людей.',

    // Profile view
    'profile.eyebrow': 'ТВІЙ ПРОФІЛЬ',
    'profile.title': 'Що можемо зробити разом?',
    'profile.import': 'Імпорт',
    'profile.card': 'Картка',
    'profile.chatgpt_import': 'Імпорт з ChatGPT / Claude',
    'profile.save': 'Зберегти профіль',
    'profile.invite_colleague': 'Запросити колегу',

    // Meetings view
    'meetings.eyebrow': 'ВІД ІНТЕРЕСУ ДО ДІЇ',
    'meetings.title': 'Наші домовленості',
    'meetings.refresh': 'Оновити',

    // Actions & Buttons
    'action.save': 'Зберегти',
    'action.cancel': 'Скасувати',
    'action.confirm': 'Підтвердити',
    'action.close': 'Закрити',
    'action.login': 'Увійти',
    'action.signup': 'Створити акаунт',
    'action.delete': 'Видалити',

    // Safety & Rules
    'rules.eighteen_plus': 'Мені 18+, я приймаю правила пілоту.',
    'rules.privacy_accepted': 'Я прочитав повідомлення про обробку даних.',
  },
  de: {
    // Brand & Header (Swiss / Standard German)
    'brand.name': 'synera',
    'header.check_access': 'Zugriff prüfen',
    'header.logout': 'Abmelden',
    'header.back_to_login': 'Zurück zur Anmeldung',
    'install.button': 'Synera installieren',
    'install.status': 'Android & iPhone · vom Home-Bildschirm',

    // Intro
    'intro.eyebrow': 'SOLO-UNTERNEHMER · KLEINUNTERNEHMEN · GEGENSEITIGER NUTZEN',
    'intro.title': 'Deine Kompetenz.\nEuer gemeinsames Ergebnis.',
    'intro.lead': 'Biete an, was du exzellent kannst.\nFinde einen Partner, dessen Unterstützung dein Business voranbringt.',
    'intro.step1.title': 'Biete & Suche',
    'intro.step1.desc': 'Deine Kernkompetenz und dein aktueller konkreter Bedarf.',
    'intro.step2.title': 'Business-Case für zwei',
    'intro.step2.desc': 'Mehrwert für beide, Gesprächsthemen und Rahmenbedingungen.',
    'intro.step3.title': 'Zusammenarbeit testen',
    'intro.step3.desc': 'Vereinbart ein erstes konkretes Kleinprojekt für beide.',

    // Navigation & Tabs
    'nav.people': 'Personen',
    'nav.profile': 'Mein Profil',
    'nav.meetings': 'Treffen',
    'nav.privacy': 'Datenschutz',

    // People view
    'people.eyebrow': 'REZIPROZITÄT HAT EINEN GRUND',
    'people.title': 'Mit wem lohnt sich ein Austausch',
    'people.refresh': 'Aktualisieren',
    'people.search_placeholder': 'Design, Vertrieb, Marktforschung…',
    'people.reciprocal_only': 'Nur mit passenden Bedingungen',
    'people.toggle_map': 'Karte anzeigen',
    'people.more': 'Weitere 50 Profile',
    'people.disclaimer': 'Wir berücksichtigen geprüfte Kompetenzen, Bedarfe, Sprachen und Formate. Dies sind Anlässe für Gespräche, keine Bewertung von Menschen.',

    // Profile view
    'profile.eyebrow': 'DEIN PROFIL',
    'profile.title': 'Was können wir gemeinsam erreichen?',
    'profile.import': 'Importieren',
    'profile.card': 'Visitenkarte',
    'profile.chatgpt_import': 'Import von ChatGPT / Claude',
    'profile.save': 'Profil speichern',
    'profile.invite_colleague': 'Kollegen einladen',

    // Meetings view
    'meetings.eyebrow': 'VOM INTERESSE ZUR TAT',
    'meetings.title': 'Unsere Vereinbarungen',
    'meetings.refresh': 'Aktualisieren',

    // Actions & Buttons
    'action.save': 'Speichern',
    'action.cancel': 'Abbrechen',
    'action.confirm': 'Bestätigen',
    'action.close': 'Schliessen',
    'action.login': 'Anmelden',
    'action.signup': 'Konto erstellen',
    'action.delete': 'Löschen',

    // Safety & Rules
    'rules.eighteen_plus': 'Ich bin 18+ und akzeptiere die Pilot-Bedingungen.',
    'rules.privacy_accepted': 'Ich habe die Datenschutzerklärung gelesen.',
  },
  en: {
    // Brand & Header
    'brand.name': 'synera',
    'header.check_access': 'Checking access',
    'header.logout': 'Log out',
    'header.back_to_login': 'Back to login',
    'install.button': 'Install Synera',
    'install.status': 'Android & iPhone · from home screen',

    // Intro
    'intro.eyebrow': 'SOLOPRENEURS · SMALL BUSINESS · MUTUAL BENEFIT',
    'intro.title': 'Your craft.\nYour shared outcome.',
    'intro.lead': 'Offer what you do best.\nFind a partner whose support your business needs right now.',
    'intro.step1.title': 'Give & Seek',
    'intro.step1.desc': 'Your key skill and concrete current need.',
    'intro.step2.title': 'Business case for two',
    'intro.step2.desc': 'Value for both, conversation topics and mutual terms.',
    'intro.step3.title': 'Test collaboration',
    'intro.step3.desc': 'Agree on one small tangible outcome for each other.',

    // Navigation & Tabs
    'nav.people': 'People',
    'nav.profile': 'My profile',
    'nav.meetings': 'Meetings',
    'nav.privacy': 'Privacy',

    // People view
    'people.eyebrow': 'RECIPROCITY HAS A PURPOSE',
    'people.title': 'Who is worth talking to',
    'people.refresh': 'Refresh',
    'people.search_placeholder': 'Design, sales, customer research…',
    'people.reciprocal_only': 'Compatible conditions only',
    'people.toggle_map': 'Show map',
    'people.more': '50 more profiles',
    'people.disclaimer': 'We match verified skills, needs, languages, time, and format. These are conversation reasons, not ratings of human worth.',

    // Profile view
    'profile.eyebrow': 'YOUR PROFILE',
    'profile.title': 'What can we build together?',
    'profile.import': 'Import',
    'profile.card': 'Card',
    'profile.chatgpt_import': 'Import from ChatGPT / Claude',
    'profile.save': 'Save profile',
    'profile.invite_colleague': 'Invite a colleague',

    // Meetings view
    'meetings.eyebrow': 'FROM INTEREST TO ACTION',
    'meetings.title': 'Our agreements',
    'meetings.refresh': 'Refresh',

    // Actions & Buttons
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.close': 'Close',
    'action.login': 'Log in',
    'action.signup': 'Create account',
    'action.delete': 'Delete',

    // Safety & Rules
    'rules.eighteen_plus': 'I am 18+ and accept the pilot terms.',
    'rules.privacy_accepted': 'I have read the privacy notice.',
  }
};

let currentLocale = DEFAULT_LOCALE;

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (SUPPORTED_LOCALES.includes(locale)) {
    currentLocale = locale;
    return true;
  }
  return false;
}

export function t(key, locale = currentLocale, params = {}) {
  const langDict = DICTIONARY[locale] || DICTIONARY[DEFAULT_LOCALE];
  let text = langDict[key] || DICTIONARY[DEFAULT_LOCALE][key] || key;
  
  for (const [pKey, pVal] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
  }
  return text;
}

export function detectLocale(navLang) {
  if (!navLang) return DEFAULT_LOCALE;
  const lower = navLang.toLowerCase();
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('uk') || lower.startsWith('ua')) return 'uk';
  return DEFAULT_LOCALE;
}
