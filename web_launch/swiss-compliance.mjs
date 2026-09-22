// web_launch/swiss-compliance.mjs — Swiss Cantonal Localization & Compliance (DE-CH)
// Підтримка 26 кантонів Швейцарії, форматування CHF та освітні застереження щодо MWST/ПДВ (Art. 10 MWSTG).

export const SWISS_CANTONS = Object.freeze({
  ZH: Object.freeze({ code: 'ZH', name: { de: 'Zürich', fr: 'Zurich', it: 'Zurigo', en: 'Zurich' }, primaryLang: 'de' }),
  BE: Object.freeze({ code: 'BE', name: { de: 'Bern', fr: 'Berne', it: 'Berna', en: 'Bern' }, primaryLang: 'de' }),
  LU: Object.freeze({ code: 'LU', name: { de: 'Luzern', fr: 'Lucerne', it: 'Lucerna', en: 'Lucerne' }, primaryLang: 'de' }),
  UR: Object.freeze({ code: 'UR', name: { de: 'Uri', fr: 'Uri', it: 'Uri', en: 'Uri' }, primaryLang: 'de' }),
  SZ: Object.freeze({ code: 'SZ', name: { de: 'Schwyz', fr: 'Schwytz', it: 'Svitto', en: 'Schwyz' }, primaryLang: 'de' }),
  OW: Object.freeze({ code: 'OW', name: { de: 'Obwalden', fr: 'Obwald', it: 'Obvaldo', en: 'Obwalden' }, primaryLang: 'de' }),
  NW: Object.freeze({ code: 'NW', name: { de: 'Nidwalden', fr: 'Nidwald', it: 'Nidvaldo', en: 'Nidwalden' }, primaryLang: 'de' }),
  GL: Object.freeze({ code: 'GL', name: { de: 'Glarus', fr: 'Glaris', it: 'Glarona', en: 'Glarus' }, primaryLang: 'de' }),
  ZG: Object.freeze({ code: 'ZG', name: { de: 'Zug', fr: 'Zoug', it: 'Zugo', en: 'Zug' }, primaryLang: 'de' }),
  FR: Object.freeze({ code: 'FR', name: { de: 'Freiburg', fr: 'Fribourg', it: 'Friburgo', en: 'Fribourg' }, primaryLang: 'fr' }),
  SO: Object.freeze({ code: 'SO', name: { de: 'Solothurn', fr: 'Soleure', it: 'Soletta', en: 'Solothurn' }, primaryLang: 'de' }),
  BS: Object.freeze({ code: 'BS', name: { de: 'Basel-Stadt', fr: 'Bâle-Ville', it: 'Basilea Città', en: 'Basel-City' }, primaryLang: 'de' }),
  BL: Object.freeze({ code: 'BL', name: { de: 'Basel-Landschaft', fr: 'Bâle-Campagne', it: 'Basilea Campagna', en: 'Basel-Country' }, primaryLang: 'de' }),
  SH: Object.freeze({ code: 'SH', name: { de: 'Schaffhausen', fr: 'Schaffhouse', it: 'Sciaffusa', en: 'Schaffhausen' }, primaryLang: 'de' }),
  AR: Object.freeze({ code: 'AR', name: { de: 'Appenzell Ausserrhoden', fr: 'Appenzell Rhodes-Extérieures', it: 'Appenzello Esterno', en: 'Appenzell Outer Rhodes' }, primaryLang: 'de' }),
  AI: Object.freeze({ code: 'AI', name: { de: 'Appenzell Innerrhoden', fr: 'Appenzell Rhodes-Intérieures', it: 'Appenzello Interno', en: 'Appenzell Inner Rhodes' }, primaryLang: 'de' }),
  SG: Object.freeze({ code: 'SG', name: { de: 'St. Gallen', fr: 'Saint-Gall', it: 'San Gallo', en: 'St. Gallen' }, primaryLang: 'de' }),
  GR: Object.freeze({ code: 'GR', name: { de: 'Graubünden', fr: 'Grisons', it: 'Grigioni', en: 'Grisons' }, primaryLang: 'de' }),
  AG: Object.freeze({ code: 'AG', name: { de: 'Aargau', fr: 'Argovie', it: 'Argovia', en: 'Aargau' }, primaryLang: 'de' }),
  TG: Object.freeze({ code: 'TG', name: { de: 'Thurgau', fr: 'Thurgovie', it: 'Turgovia', en: 'Thurgau' }, primaryLang: 'de' }),
  TI: Object.freeze({ code: 'TI', name: { de: 'Tessin', fr: 'Tessin', it: 'Ticino', en: 'Ticino' }, primaryLang: 'it' }),
  VD: Object.freeze({ code: 'VD', name: { de: 'Waadt', fr: 'Vaud', it: 'Vaud', en: 'Vaud' }, primaryLang: 'fr' }),
  VS: Object.freeze({ code: 'VS', name: { de: 'Wallis', fr: 'Valais', it: 'Vallese', en: 'Valais' }, primaryLang: 'fr' }),
  NE: Object.freeze({ code: 'NE', name: { de: 'Neuenburg', fr: 'Neuchâtel', it: 'Neuchâtel', en: 'Neuchatel' }, primaryLang: 'fr' }),
  GE: Object.freeze({ code: 'GE', name: { de: 'Genf', fr: 'Genève', it: 'Ginevra', en: 'Geneva' }, primaryLang: 'fr' }),
  JU: Object.freeze({ code: 'JU', name: { de: 'Jura', fr: 'Jura', it: 'Giura', en: 'Jura' }, primaryLang: 'fr' }),
});

export const SWISS_VAT_THRESHOLD_CHF = 100000;

/**
 * Перевіряє, чи є рядок валідним дволітерним кодом кантону Швейцарії.
 */
export function validateSwissCanton(code) {
  if (typeof code !== 'string') return false;
  const upper = code.trim().toUpperCase();
  return Object.hasOwn(SWISS_CANTONS, upper);
}

/**
 * Отримує метадані кантону за його кодом.
 */
export function getCantonInfo(code) {
  if (!validateSwissCanton(code)) return null;
  return SWISS_CANTONS[code.trim().toUpperCase()];
}

/**
 * Форматує суму в мінорних одиницях (раппенах / сантимах) у швейцарський грошовий формат.
 * Приклад: 15000 -> "CHF 150.00", 125000 -> "CHF 1'250.00"
 */
export function formatSwissFrancs(amountMinor) {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) {
    return 'CHF 0.00';
  }
  const francs = Math.floor(amountMinor / 100);
  const rappen = amountMinor % 100;
  const rappenStr = rappen < 10 ? `0${rappen}` : `${rappen}`;

  // Швейцарський роздільник тисяч — одинарний апостроф
  const francsStr = francs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `CHF ${francsStr}.${rappenStr}`;
}

/**
 * Генерує детерміністичне освітнє застереження щодо обов'язку реєстрації платником MWST (Art. 10 MWSTG).
 * Не є юридичною чи податковою консультацією.
 */
export function getSwissVatDisclaimer(amountChf = 0, lang = 'de') {
  const isAboveThreshold = typeof amountChf === 'number' && amountChf >= SWISS_VAT_THRESHOLD_CHF;

  if (lang === 'en') {
    return {
      thresholdChf: SWISS_VAT_THRESHOLD_CHF,
      appliesExemption: !isAboveThreshold,
      text: isAboveThreshold
        ? "Notice under Swiss VAT Act (Art. 10 MWSTG): Businesses with an annual taxable turnover of CHF 100'000 or more are generally liable to register for Swiss VAT with the Federal Tax Administration (ESTV). This platform provides no legal or tax advice."
        : "Notice under Swiss VAT Act (Art. 10 MWSTG): Solopreneurs and small businesses with an annual turnover below CHF 100'000 are generally exempt from mandatory Swiss VAT registration. This platform provides no legal or tax advice.",
      statute: 'MWSTG Art. 10',
    };
  }

  // За замовчуванням швейцарська німецька (de-CH)
  return {
    thresholdChf: SWISS_VAT_THRESHOLD_CHF,
    appliesExemption: !isAboveThreshold,
    text: isAboveThreshold
      ? "Hinweis gemäss Art. 10 MWSTG: Bei Erreichen eines steuerbaren Jahresumsatzes von mindestens CHF 100'000 besteht die Pflicht zur Eintragung ins MWST-Register bei der Eidgenössischen Steuerverwaltung (ESTV). Diese Plattform stellt keine Steuer- oder Rechtsberatung dar."
      : "Hinweis gemäss Art. 10 MWSTG: Solopreneure und Kleinunternehmen mit einem steuerbaren Jahresumsatz unter CHF 100'000 sind in der Schweiz grundsätzlich von der MWST-Pflicht befreit. Diese Plattform stellt keine Steuer- oder Rechtsberatung dar.",
    statute: 'MWSTG Art. 10',
  };
}
