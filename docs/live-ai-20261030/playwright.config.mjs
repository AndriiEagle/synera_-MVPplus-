// Keep the wave's system-Chrome configuration; scope discovery/output to this lane.
import base from 'C:/sw/pw-chrome.config.mjs';
export default {...base,testDir:'C:/sw/synera-liveai/tests',outputDir:'C:/sw/synera-liveai/tmp/playwright-results',workers:2,use:{...base.use,channel:'chrome',serviceWorkers:'block'}};
