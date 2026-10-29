import base from '../../playwright.config.mjs';
export default { ...base, testDir:new URL('../../tests/',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'), outputDir:new URL('../../tmp/integrate/playwright-results',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'), use:{...base.use,channel:'chrome'} };
