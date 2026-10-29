// Application ops records are diagnostic only and are never returned to users.
// Host/provider access logs have their own owner-reviewed retention settings.
export function maskOpsText(value) {
  return String(value)
    .replace(/[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(?:token|secret|password|api[_-]?key|authorization|cookie|otp|code|session|jwt)["']?\s*[:=]\s*["']?[^\s,;"']+/gi, '[credential]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]')
    .replace(/\b(?:sk|pk)[_-][A-Za-z0-9_-]{12,}\b/g, '[token]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, ip => ip.split('.').slice(0, 3).join('.') + '.0')
    .replace(/\b(?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}\b/gi, ip => ip.split(':').slice(0, 3).join(':') + '::/48')
    .replace(/\+?\d[\d ()-]{7,}\d/g, '[phone]');
}
function masked(value, key = '', depth = 0) {
  if (/email|phone|token|secret|password|cookie|authorization|api.?key|otp|session|jwt/i.test(key)) return '[redacted]';
  if (depth > 5) return '[omitted]';
  if (typeof value === 'string') return maskOpsText(value);
  if (Array.isArray(value)) return value.slice(0, 32).map(item => masked(item, key, depth + 1));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 32).map(([name, item]) => [maskOpsText(name), masked(item, name, depth + 1)]));
  return ['number', 'boolean'].includes(typeof value) || value === null ? value : '[omitted]';
}
export function logOps(event, fields = {}, sink = console.log) {
  const code = /^[a-z][a-z0-9_.-]{0,79}$/.test(event) ? event : 'invalid_event';
  sink(JSON.stringify({ event: code, ...masked(fields) }));
}
export function logListening(port, sink = console.log) {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw Error('Invalid listen port');
  // Preserve the existing CLI startup contract. The loopback address is a code
  // constant, not a request IP, and no request/user values enter this line.
  sink(`Synera real-user pilot: http://127.0.0.1:${port}`);
}
