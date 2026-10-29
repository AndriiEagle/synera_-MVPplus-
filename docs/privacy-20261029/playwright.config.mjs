import base from '../../playwright.config.mjs';
export default { ...base, testDir: '../../tests', outputDir: '../../tmp/privacy-playwright', use: { ...base.use, channel: 'chrome' } };
