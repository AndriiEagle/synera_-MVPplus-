// Exercises the runner's actual cleanup body with an injected SQL transport.
// No PostgreSQL execution: receipt/exit behavior only, including the pending primary throw.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source = await fs.readFile(new URL('../tools/meeting-status-guard-sql-acceptance.mjs', import.meta.url), 'utf8');
const start = source.lastIndexOf('finally {') + 'finally {'.length;
const end = source.indexOf('\n  if (receiptPath)', start);
assert.ok(start >= 'finally {'.length && end > start, 'Runner cleanup boundary missing');
const cleanup = source.slice(start, end);

function finalize(run, { primaryError = null } = {}) {
  const report = { status: 'PASS_LOCAL_MEETING_STATUS_GUARD_SQL' };
  const process = { exitCode: 0 };
  const created = ['synera_status_guard_test_1', 'synera_status_guard_test_2'];
  const calls = [];
  const sql = (database, text) => { calls.push({ database, text }); return run(calls.length); };
  const context = { report, process, created, sql, primaryError };
  let thrown;
  try {
    vm.runInNewContext(`try {
      if (primaryError) throw primaryError;
    } catch (error) { report.status = 'NOT_ACCEPTED'; report.error = error.message; throw error; }
    finally { ${cleanup} }`, context, { timeout: 1000 });
  } catch (error) { thrown = error; }
  return { report, process, calls, thrown };
}

test('meeting-status cleanup counts successful drops and preserves PASS', () => {
  const result = finalize(() => ({ status: 0, stderr: '' }));
  assert.equal(result.thrown, undefined);
  assert.equal(result.report.databases_dropped, 2);
  assert.equal(result.report.status, 'PASS_LOCAL_MEETING_STATUS_GUARD_SQL');
  assert.equal(result.report.cleanup_pass, true);
  assert.equal(result.report.cleanup_errors.length, 0);
  assert.equal(result.process.exitCode, 0);
  assert.equal(result.calls.length, 2);
  assert.ok(result.calls.every(call => call.database === 'postgres'));
});

test('meeting-status successful cleanup preserves an earlier acceptance failure', () => {
  const primaryError = new Error('original acceptance failure');
  const result = finalize(() => ({ status: 0, stderr: '' }), { primaryError });
  assert.equal(result.thrown, primaryError);
  assert.equal(result.report.error, 'original acceptance failure');
  assert.equal(result.report.status, 'NOT_ACCEPTED');
  assert.equal(result.report.databases_dropped, 2);
  assert.equal(result.report.cleanup_pass, true);
});

test('meeting-status denied DROP is not counted, fails verdict, and still drops the next DB', () => {
  const result = finalize(n => n === 1 ? { status: 1, stderr: 'drop denied' } : { status: 0, stderr: '' });
  assert.equal(result.report.databases_dropped, 1, 'Failed DROP must not count as successful cleanup');
  assert.equal(result.report.status, 'NOT_ACCEPTED');
  assert.equal(result.report.cleanup_pass, false);
  assert.equal(result.report.cleanup_errors.length, 1);
  assert.equal(result.report.cleanup_errors[0].database, 'synera_status_guard_test_1');
  assert.match(result.report.cleanup_errors[0].error, /drop denied/);
  assert.equal(result.calls.length, 2, 'Cleanup must continue after a denied DROP');
  assert.match(result.calls[1].text, /synera_status_guard_test_2/);
  assert.equal(result.process.exitCode, 1);
  assert.equal(result.thrown, undefined, 'Cleanup records failure without replacing a pending primary throw');
});

test('meeting-status cleanup preserves the original thrown failure while handling transport errors', () => {
  const primaryError = new Error('original acceptance failure');
  const result = finalize(n => {
    if (n === 1) throw new Error('drop transport failure');
    return { status: 0, stderr: '' };
  }, { primaryError });
  assert.equal(result.thrown, primaryError, 'Cleanup must preserve the original error object');
  assert.equal(result.report.error, 'original acceptance failure');
  assert.equal(result.report.databases_dropped, 1);
  assert.equal(result.report.cleanup_pass, false);
  assert.match(result.report.cleanup_errors[0].error, /drop transport failure/);
  assert.equal(result.calls.length, 2);
  assert.equal(result.process.exitCode, 1);
});
