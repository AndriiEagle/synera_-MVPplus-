// Part B idea, implemented for both Synera builders. Diagnostics never echo matches.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const RULES = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/i],
  ['database-url', /postgres(?:ql)?:\/\/[^\s"'<>]+/i],
  ['provider-token', /\b(?:sk-(?:proj-|or-v1-)?[a-z0-9_-]{16,}|gh[pousr]_[a-z0-9]{20,}|github_pat_[a-z0-9_]{20,})\b/i],
  ['secret-binding', /\b(?:NEON_API_KEY|CLOUDFLARE_API_TOKEN|LOG_PSEUDONYM_KEY|ERASURE_LEDGER_KEY|OPENROUTER_API_KEY|TOKENROUTER_API_KEY)\b/i],
];
export async function scanClientBundle(directory) {
  const root = path.resolve(directory); let files = 0;
  async function walk(dir) {
    for (const item of await fs.readdir(dir, {withFileTypes:true})) {
      const file = path.join(dir, item.name), relative = path.relative(root, file);
      if (item.isSymbolicLink()) throw Error('Bundle symlink refused: ' + relative);
      if (item.isDirectory()) { await walk(file); continue; }
      if (!item.isFile()) throw Error('Unexpected bundle entry: ' + relative);
      // Scan all bytes, including extensionless files; secret markers are ASCII.
      const value = (await fs.readFile(file)).toString('utf8'); files++;
      for (const [name, rule] of RULES) if (rule.test(value)) throw Error('Bundle secret pattern [' + name + '] in ' + relative);
    }
  }
  if ((await fs.lstat(root)).isSymbolicLink()) throw Error('Bundle root symlink refused');
  await walk(root);
  if (!files) throw Error('No bundle files scanned');
  return {directory:root, files, status:'PATTERN_SCAN_PASS', limitation:'Pattern scan cannot prove absence of every secret'};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const directories = process.argv.slice(2);
    for (const dir of directories.length ? directories : ['web_launch/dist-real', 'web_launch/dist-neon-ci']) console.log(JSON.stringify(await scanClientBundle(dir)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
