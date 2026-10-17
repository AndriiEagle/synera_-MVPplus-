import { parseProfileImport, createPortableProfile, sensitiveFindings } from './profile-portability.mjs';
import { normalizeBrief } from './profile-brief.mjs';
export function completeProfileJson(profile, options) {
  const portable = createPortableProfile(profile, options);
  const brief = normalizeBrief(profile.brief);
  if (sensitiveFindings(brief).length) throw new Error('Прибери приватні контакти або ключі з умов співпраці.');
  return JSON.stringify({ ...portable, format: 'synera-profile-2', profile: { ...portable.profile, brief, map_visible: false } }, null, 2);
}
export function importCompleteProfile(input, options = {}) {
  let parsed;
  try { parsed = JSON.parse(String(input).trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'')); } catch {}
  if (!options.authorized || parsed?.format !== 'synera-profile-2') return parseProfileImport(input, options);
  if (String(input).length > 5000 || sensitiveFindings(input).length) return { status: 'blocked_sensitive', profile: {}, warnings: ['Завеликий профіль або приватні контакти/ключі. Перевір файл.'] };
  const result = parseProfileImport(JSON.stringify({ format: 'synera-profile-1', profile: parsed.profile }), options);
  if (['ready','needs_review'].includes(result.status)) {
    result.profile.brief = normalizeBrief(parsed.profile?.brief);
    result.profile.map_visible = false;
    result.warnings.push('Умови співпраці також перенесено. Перевір їхню актуальність у формі; показ профілю й карти вимкнений.');
  }
  return result;
}
