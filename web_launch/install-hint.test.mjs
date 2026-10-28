import test from 'node:test';
import assert from 'node:assert/strict';
import { installHintMode } from './install-hint.mjs';

const android = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const safari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const crios = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1';

test('Android Chrome offers installation only with a real pending prompt', () => {
  assert.equal(installHintMode({ userAgent: android, hasInstallPrompt: true }), 'android-install');
  assert.equal(installHintMode({ userAgent: android }), 'none');
});
test('iPhone Safari offers the share guide', () => {
  assert.equal(installHintMode({ userAgent: safari }), 'ios-share');
});
test('iPhone Chrome is not given Safari instructions, even with a prompt', () => {
  assert.equal(installHintMode({ userAgent: crios, hasInstallPrompt: true }), 'none');
  assert.equal(installHintMode({ userAgent: safari + ' CriOS/131.0' }), 'none');
});
test('standalone suppresses both installation modes', () => {
  for (const userAgent of [android, safari]) assert.equal(installHintMode({ userAgent, standalone: true, hasInstallPrompt: true }), 'none');
});
test('invalid or empty user agents and missing platform return none without throwing', () => {
  for (const platform of [undefined, null, false, '', {}, { userAgent: '' }, { userAgent: false }, { userAgent: 42 }, { userAgent: {} }, { userAgent: 'Android' }, { userAgent: 'iPhone Safari' }]) {
    assert.equal(installHintMode(platform), 'none');
  }
});
test('desktop browsers and Android without Chromium do not show the phone strip', () => {
  for (const userAgent of ['Mozilla/5.0 (Windows NT 10.0) Chrome/131.0 Safari/537.36', android.replace('Chrome/131.0.0.0', 'Firefox/131.0')]) assert.equal(installHintMode({ userAgent, hasInstallPrompt: true }), 'none');
});
