// Test helper, not shipped: lists the string literals and template text of a JavaScript source, skipping
// comments and regular-expression literals. The language tests use it to prove that every Ukrainian string
// a page can show has German and English text.
const REGEX_AFTER = new Set(['return', 'typeof', 'case', 'in', 'of', 'void', 'delete', 'throw', 'new', 'else', 'do', 'yield', 'await']);

export function sourceStrings(source) {
  const found = [], depth = []; let i = 0, line = 1, last = '', word = '';
  const step = (count = 1) => { for (let n = 0; n < count && i < source.length; n++) { if (source[i] === '\n') line++; i++; } };
  const quoted = quote => { const at = i, from = line; step(); while (i < source.length && source[i] !== quote) step(source[i] === '\\' ? 2 : 1); step(); found.push({ quote, raw: source.slice(at + 1, i - 1), line: from, start: at, end: i }); };
  const template = () => { const at = i, from = line;
    while (i < source.length) {
      if (source[i] === '\\') { step(2); continue; }
      if (source[i] === '`') { found.push({ quote: '`', raw: source.slice(at, i), line: from, start: at, end: i }); step(); return; }
      if (source[i] === '$' && source[i + 1] === '{') { found.push({ quote: '`', raw: source.slice(at, i), line: from, start: at, end: i, interpolated: true }); step(2); depth.push(0); return; }
      step();
    } };
  const regex = () => { step(); let inClass = false; while (i < source.length && source[i] !== '\n') { const c = source[i]; if (c === '\\') { step(2); continue; } if (c === '[') inClass = true; else if (c === ']') inClass = false; else if (c === '/' && !inClass) break; step(); } step(); while (/[a-z]/.test(source[i] || '')) step(); };
  while (i < source.length) {
    const c = source[i], next = source[i + 1];
    if (c === '/' && next === '/') { while (i < source.length && source[i] !== '\n') step(); continue; }
    if (c === '/' && next === '*') { const end = source.indexOf('*/', i + 2); step((end < 0 ? source.length : end + 2) - i); continue; }
    if (c === '\'' || c === '"') { quoted(c); last = c; word = ''; continue; }
    if (c === '`') { step(); template(); last = '`'; word = ''; continue; }
    if (c === '/') { if (!last || '(,=:[!&|?{};+-*%<>~^'.includes(last) || REGEX_AFTER.has(word)) { regex(); last = '/'; word = ''; continue; } step(); last = '/'; word = ''; continue; }
    if (depth.length && c === '{') depth[depth.length - 1]++;
    if (depth.length && c === '}') { if (depth[depth.length - 1] === 0) { depth.pop(); step(); template(); last = '`'; word = ''; continue; } depth[depth.length - 1]--; }
    if (/\s/.test(c)) { step(); continue; }
    if (/[\w$]/.test(c)) { const at = i; while (/[\w$]/.test(source[i] || '')) step(); word = source.slice(at, i); last = 'a'; continue; }
    last = c; word = ''; step();
  }
  return found;
}

// The text a literal evaluates to (escapes resolved). Template text is returned as written between ${…} parts.
export function cooked(item) {
  try { return Function('return ' + (item.quote === '`' ? '`' + item.raw.replace(/\$\{/g, '\\${') + '`' : item.quote + item.raw + item.quote))(); }
  catch { return item.raw; }
}

// Module files a page loads: its <script src> entries and everything they import from the same folder.
export function pageModules(html, read) {
  const todo = [...html.matchAll(/<script[^>]*\ssrc="\/?([\w.-]+\.mjs)"/g)].map(match => match[1]), seen = [];
  while (todo.length) {
    const name = todo.shift(); if (seen.includes(name)) continue;
    let source; try { source = read(name); } catch { continue; }
    seen.push(name);
    for (const match of source.matchAll(/(?:from\s+|import\()\s*'\.\/([\w.-]+\.mjs)'/g)) todo.push(match[1]);
  }
  return seen;
}
