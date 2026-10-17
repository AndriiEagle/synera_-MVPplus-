import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_STEPS, demoInvitationDraft, nextDemoStep } from './demo-journey.mjs';

test('synthetic demo has a finite mutual-benefit journey and never turns a draft into a send', () => {
  assert.equal(DEMO_STEPS.length, 4);
  assert.equal(nextDemoStep(3), 0);
  assert.match(DEMO_STEPS[0].body, /синтетичний/);
  assert.match(DEMO_STEPS[3].body, /не відправляється/);
  assert.match(demoInvitationDraft(), /НЕ ВІДПРАВЛЕНО/);
});
