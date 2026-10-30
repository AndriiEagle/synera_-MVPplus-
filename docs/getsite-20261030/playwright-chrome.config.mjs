import base from '../../playwright.config.mjs';
import { fileURLToPath } from 'node:url';
export default {
  ...base,
  testDir:fileURLToPath(new URL('../../tests/',import.meta.url)),
  outputDir:fileURLToPath(new URL('../../tmp/getsite-playwright/',import.meta.url)),
  workers:1,
  use:{...base.use,channel:'chrome'},
};
