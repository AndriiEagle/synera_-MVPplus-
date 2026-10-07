import original from '../../../playwright.config.mjs';
import { fileURLToPath } from 'node:url';
import { lstatSync } from 'node:fs';
process.env.TMP = process.env.TEMP = 'C:/Users/Andrii/.codex/tmp/synera-mobile-pricing';
const stat = lstatSync(process.env.TMP);
if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Expected real C: temp directory');
export default {
  ...original,
  testDir: fileURLToPath(new URL('../../../tests/', import.meta.url)),
  outputDir: fileURLToPath(new URL('./regression/', import.meta.url)),
  globalTimeout: 150000,
  use: { ...original.use, launchOptions: { executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' } },
};
