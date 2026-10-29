import base from '../../playwright.config.mjs';
// Shared C:/sw config points at a different lane. Same system Chrome, this worktree only.
export default {...base,testDir:'../../tests',outputDir:'../../tmp/graphics2-test-results',use:{...base.use,channel:'chrome'}};
