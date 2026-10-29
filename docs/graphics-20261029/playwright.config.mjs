import base from '../../playwright.config.mjs';
// C:/sw/pw-chrome.config.mjs currently hard-codes another lane's testDir.
// Use the same installed system Chrome, with this lane's own tests and outputs.
export default { ...base, testDir: '../../tests', outputDir: '../../tmp/graphics-test-results', use: { ...base.use, channel: 'chrome' } };
