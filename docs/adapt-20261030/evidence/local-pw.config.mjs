import base from 'C:/sw/pw-chrome.config.mjs';
export default {...base,testDir:'C:/sw/synera-adaptive/tests',testMatch:'**/*.spec.mjs',outputDir:'C:/sw/synera-adaptive/tmp/pw-results',workers:2,use:{...base.use,channel:'chrome'}};
