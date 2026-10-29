import base from 'C:/sw/pw-chrome.config.mjs';
// Shared config points at the design lane. Bind its Chrome runner to THIS worktree.
export default { ...base, testDir: new URL('../../tests/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), outputDir: new URL('./test-results/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), timeout: 60000 };
