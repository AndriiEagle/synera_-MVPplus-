// Matches octet_length(material::text) in the existing PostgreSQL JSONB constraint.
// Canonical material contains only strings, safe integers, booleans, null, arrays and objects.
export const CASE_MATERIAL_MAX_BYTES = 16384;
// Room for the current row IDs, hash, timestamps and JSON envelope; only match_cases uses it.
export const CASE_REQUEST_MAX_BYTES = CASE_MATERIAL_MAX_BYTES + 2048;
export const CASE_MATERIAL_TOO_LARGE = 'Забагато тексту в умовах. Скороти опис; чернетка залишається у формі.';
export function caseMaterialBytes(value) {
  const encode = item => {
    if (Array.isArray(item)) return '[' + item.map(encode).join(', ') + ']';
    if (item && typeof item === 'object') return '{' + Object.entries(item).map(([key, val]) => encode(key) + ': ' + encode(val)).join(', ') + '}';
    if (typeof item === 'string') {
      // PostgreSQL JSONB cannot represent NUL or unpaired UTF-16 surrogates.
      for (const char of item) { const point=char.codePointAt(0); if (point===0 || point>=0xd800 && point<=0xdfff) throw new Error('Некоректний символ у тексті умов.'); }
    } else if (item!==null && typeof item!=='boolean' && !Number.isSafeInteger(item)) throw new Error('Некоректне значення умов.');
    return JSON.stringify(item);
  };
  return new TextEncoder().encode(encode(value)).length;
}
export function assertCaseMaterialBudget(value) {
  if (caseMaterialBytes(value) > CASE_MATERIAL_MAX_BYTES) throw new Error(CASE_MATERIAL_TOO_LARGE);
}
