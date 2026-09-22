import fs from 'node:fs/promises';

export function validateConfig(config) {
  const { supabaseUrl = '', publishableKey = '', registrationEnabled = false } = config;
  if (config.backend !== undefined && !['supabase', 'neon'].includes(config.backend)) throw new Error('Непідтримуваний бекенд');
  if (config.backend === 'neon' && (supabaseUrl || publishableKey)) throw new Error('Оберіть один бекенд');
  if ((supabaseUrl || publishableKey) && (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(supabaseUrl) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))) {
    throw new Error('Потрібні URL проекту Supabase та сучасний публічний ключ.');
  }
  if (typeof registrationEnabled !== 'boolean') throw new Error('Некоректна налаштування реєстрації');
  if (registrationEnabled && (!config.pilotSafetyEnabled || !config.publicSiteUrl)) throw new Error('Реєстрація вимагає перевірену схему безпеки пілоту та публічний HTTPS сайт.');
  const optional = {};
  if (config.backend === 'neon') optional.backend = 'neon';
  if (config.pilotSafetyEnabled !== undefined) {
    if (typeof config.pilotSafetyEnabled !== 'boolean') throw new Error('Некоректне налаштування безпеки пілоту');
    optional.pilotSafetyEnabled = config.pilotSafetyEnabled;
  }
  if (config.realPilotEnabled !== undefined) {
    if (typeof config.realPilotEnabled !== 'boolean') throw new Error('Некоректне налаштування реального пілоту');
    optional.realPilotEnabled = config.realPilotEnabled;
  }
  if (registrationEnabled && !config.realPilotEnabled) throw new Error('Реєстрація вимагає переглянуту схему real-pilot.');
  if (config.publicSiteUrl) {
    const url = new URL(config.publicSiteUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || /^(localhost|127\.|10\.|192\.168\.|\[)/.test(url.hostname)) throw new Error('Потрібний публічний HTTPS origin');
    optional.publicSiteUrl = url.origin;
  }
  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), publishableKey, registrationEnabled, ...optional };
}

export async function loadConfig({ demo = false, neon = false } = {}) {
  if (neon) return validateConfig({ backend: 'neon' });
  if (demo) return validateConfig({});
  const config = JSON.parse(await fs.readFile(new URL('./config.public.json', import.meta.url), 'utf8'));
  if (process.env.SYNERA_SUPABASE_URL || process.env.SYNERA_SUPABASE_PUBLISHABLE_KEY) {
    config.supabaseUrl = process.env.SYNERA_SUPABASE_URL || '';
    config.publishableKey = process.env.SYNERA_SUPABASE_PUBLISHABLE_KEY || '';
  }
  return validateConfig(config);
}

export function securityHeaders(config) {
  return {
    'Cache-Control': 'no-store', 'Strict-Transport-Security': 'max-age=31536000', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'${config.supabaseUrl ? ' ' + config.supabaseUrl : ''}; img-src 'self' data: https://tile.openstreetmap.org; worker-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`,
  };
}
