// Executes only local handler code with an in-memory Firebase stub.
// No SDK installation, Firebase connection, credential, or network request.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const targets = [
  ['display_user_info_on_g_marker_tap.js', 'displayUserInfoOnGMarkerTap'],
  ['cloud_function_diarie_a_imatch.js', 'cloudFunctionDiarieAImatch'],
  ['func_for_diaries_for_logged_user2.js', 'funcForDiariesForLoggedUser2'],
];

async function probe(code, name) {
  let databaseReached = false;
  let status = null;
  const exports = {};
  const admin = {
    apps: [{}], initializeApp() {},
    firestore() {
      databaseReached = true;
      throw new Error('STOP_AT_LOCAL_DATABASE_STUB');
    },
  };
  const context = vm.createContext({
    exports,
    console: { log() {}, error() {}, warn() {} },
    require(id) {
      if (id === 'firebase-admin') return admin;
      if (id === 'firebase-functions') return { https: { onRequest: fn => fn } };
      throw new Error('Module outside local probe allowlist');
    },
  });
  new vm.Script(code).runInContext(context, { timeout: 1000 });
  const res = { set() { return this; }, status(value) { status = value; return this; },
    send() { return this; }, json() { return this; } };
  await exports[name]({ method: 'GET', query: {userId:'synthetic-user-b'}, body: {}, headers: {} }, res);
  return {handler: name, anonymous_database_access_reached: databaseReached,
    status_after_stub: status, auth_gate: databaseReached ? 'FAIL' : 'REVIEW_RESPONSE'};
}

(async () => {
  const negativeControl = await probe('exports.guard = require("firebase-functions").https.onRequest((req,res) => res.status(401).send(""));', 'guard');
  assert.equal(negativeControl.anonymous_database_access_reached, false);
  assert.equal(negativeControl.status_after_stub, 401);
  const results = [];
  for (const [file, name] of targets) {
    const code = fs.readFileSync(path.join(root, 'crystallised_in/firebase/custom_cloud_functions', file), 'utf8');
    results.push(await probe(code, name));
  }
  const report = {scope: 'local handler function boundary; Firebase stub; no deployed IAM check',
    network_calls: 0, negative_control: 'PASS', results,
    acceptance: results.some(r => r.anonymous_database_access_reached) ? 'FAIL' : 'NEEDS_REVIEW'};
  const rendered = JSON.stringify(report, null, 2) + '\n';
  if (process.argv[2]) fs.writeFileSync(path.resolve(process.argv[2]), rendered);
  process.stdout.write(rendered);
  process.exitCode = report.acceptance === 'FAIL' ? 1 : 0;
})().catch(() => { process.stderr.write('Local handler probe failed to execute; no source or secret output.\n'); process.exitCode = 2; });
