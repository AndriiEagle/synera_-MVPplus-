import test from 'node:test';
import assert from 'node:assert/strict';
import { LIVE_AI_COPY } from './live-ai-client.mjs';
import { PRIVACY_COPY } from './privacy-content.mjs';
test('live AI notices have uk/de/en key symmetry and named data flow',()=>{
  for(const locale of ['uk','de','en']) {
    assert.deepEqual(Object.keys(LIVE_AI_COPY[locale]).sort(),Object.keys(LIVE_AI_COPY.uk).sort());
    assert.match(LIVE_AI_COPY[locale].notice,/OpenRouter/);assert.match(LIVE_AI_COPY[locale].notice,/Z.ai/);
    assert.match(PRIVACY_COPY[locale].liveAi,/90/);assert.match(PRIVACY_COPY[locale].liveAi,/HMAC/);
  }
});
