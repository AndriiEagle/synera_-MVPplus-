import fs from 'node:fs/promises';

export function validateConfig(config) {
  const { supabaseUrl = '', publishableKey = '', registrationEnabled = false } = config;
  if (config.backend !== undefined && !['supabase', 'neon'].includes(config.backend)) throw new Error('Unsupported backend');
  if (config.backend === 'neon' && (supabaseUrl || publishableKey)) throw new Error('Choose one backend');
  if ((supabaseUrl || publishableKey) && (!/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(supabaseUrl) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))) {
    throw new Error('A Supabase project URL and modern publishable key are required.');
  }
  if (typeof registrationEnabled !== 'boolean') throw new Error('Invalid registration setting');
  if (registrationEnabled && (!config.pilotSafetyEnabled || !config.publicSiteUrl)) throw new Error('Registration requires verified pilot safety schema and a public HTTPS site.');
  const optional = {};
  if (config.backend === 'neon') optional.backend = 'neon';
  if (config.pilotSafetyEnabled !== undefined) {
    if (typeof config.pilotSafetyEnabled !== 'boolean') throw new Error('Invalid pilot safety setting');
    optional.pilotSafetyEnabled = config.pilotSafetyEnabled;
  }
  if (config.realPilotEnabled !== undefined) {
    if (typeof config.realPilotEnabled !== 'boolean') throw new Error('Invalid real pilot setting');
    optional.realPilotEnabled = config.realPilotEnabled;
  }
  if (registrationEnabled && !config.realPilotEnabled) throw new Error('Registration requires the reviewed real-pilot schema.');
  if (config.publicSiteUrl) {
    const url = new URL(config.publicSiteUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || /^(localhost|127\.|10\.|192\.168\.|\[)/.test(url.hostname)) throw new Error('Public HTTPS origin required');
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
