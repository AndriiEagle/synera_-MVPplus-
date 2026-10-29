import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('P5: emitted ops records mask emails, phone numbers, credentials and IPs', async () => {
  const { logOps } = await import('./ops-log.mjs'); const lines = [];
  logOps('request.failed', { note: 'alice@example.invalid +41 79 123 45 67 Bearer abcdefg', token: 'opaque-secret', url: '?code=secret-otp', json: '{"token":"json-secret"}', ip: '203.0.113.42', ipv6: '2001:db8:abcd:1234:5678:1234:5678:abcd' }, line => lines.push(line));
  const output = lines.join('');
  for (const raw of ['alice@example.invalid', '+41 79 123 45 67', 'abcdefg', 'opaque-secret', 'secret-otp', 'json-secret', '203.0.113.42', '1234:5678']) assert.ok(!output.includes(raw), raw);
  assert.match(output, /203\.0\.113\.0/);
});
export function assertNoRawServerLogging(source) {
  assert.doesNotMatch(source, /\bconsole\s*(?:\?\.)?\s*(?:\.|\[)[\s\S]*?\b(?:log|error|warn|info|debug)\b/);
}
test('P5: every runtime server uses the masking boundary; raw email logging mutant is rejected', async () => {
  for (const file of ['web_launch/server.mjs', 'web_launch/server_cascade_api.mjs', 'web_launch/cascade.mjs', 'web_launch/server/local-profile-ai.mjs', 'web_launch/server/local-journey-ai.mjs', 'neon/worker.mjs', 'neon/google-oauth.mjs']) assertNoRawServerLogging(await fs.readFile(file, 'utf8'));
  assert.throws(() => assertNoRawServerLogging("console.error('alice@example.invalid');"));
});
