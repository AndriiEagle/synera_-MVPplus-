// Adapted from the untrusted Part B gate; no network or legal acceptance is performed.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const REQUIREMENTS = Object.freeze(['dpa_accepted', 'notice_published_with_operator_data',
  'deletion_accepted_live', 'dpia_decided', 'transfer_basis_confirmed']);
export const DEFAULT_READINESS = fileURLToPath(new URL('../config/privacy-readiness.json', import.meta.url));
export function privacyGate(readiness, audience = 'open-registration') {
  if (!['closed-pilot', 'open-registration'].includes(audience)) throw Error('Unknown release audience');
  if (audience === 'closed-pilot') return {audience, status:'CLOSED_PILOT_ONLY', openRegistration:false};
  const missing = REQUIREMENTS.filter(key => readiness?.requirements?.[key] !== true);
  if (missing.length) throw Error('OPEN REGISTRATION BLOCKED: ' + missing.join(', '));
  return {audience, status:'READINESS_DECLARED', openRegistration:true};
}
export async function readPrivacyGate(file = DEFAULT_READINESS, audience = 'open-registration') {
  return privacyGate(JSON.parse(await fs.readFile(file, 'utf8')), audience);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [audience = 'open-registration', file = DEFAULT_READINESS, ...extra] = process.argv.slice(2);
    if (extra.length) throw Error('Usage: node tools/privacy-gate.mjs [closed-pilot|open-registration] [readiness.json]');
    console.log(JSON.stringify(await readPrivacyGate(file, audience)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
