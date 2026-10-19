// Audit-only baseline repro. Node 24; no install or external requests required.
// Default layout: <repo>/artifacts/independent-audit-20261019/<this script>.
// Override with an ABSOLUTE SYNERA_AUDIT_SOURCE path to the pinned source snapshot.
// This verifies exact baseline bytes BEFORE importing product code. A repaired source
// must be tested by a separate regression test; it is intentionally refused here.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isAbsolute, resolve, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const BASELINE_COMMIT = '7eaa952c6e0e498521cc325ab1cf24fec1e0f725';
const EXPECTED_SOURCE_SHA256 = Object.freeze({
  "neon/case-outcome.mjs": "84e19ab78520c143a4e1622b783afa77ea15d82b82cd9bde2ec0ca560419820e",
  "neon/google-oauth.mjs": "0e8839c19aa5b427df821a505189f237de23b4d109a5742a262b376faf6678ca",
  "neon/group-room.mjs": "e66e0224256c13a9d4c6eac1fcf335c3774e278d710070a552ddd8a0843197ae",
  "neon/meeting-address.mjs": "602ac92501e937c93feca1edaeb980c1768541d5b5635009d8e3957f92cbafb0",
  "neon/meeting-location.mjs": "73de7d89f33b028aaf464aed9e6ef9827b9a786ef7cd631087e961bfa4c790a6",
  "neon/profile-erasure.mjs": "8eddaa8f4c9e638285870b603f1a95366be393b1d49bf0297b02e0765eae10de",
  "neon/worker.mjs": "f4eaad8deb0da77fdcaf351f0e40cac5113cef9d6c1fe3f6615584dc2f05d484",
  "tools/fixtures/case-outcome-fixture.mjs": "358a1304bd7a4a3a100e0c0867662e5097403dac37c71398e4d583025aec5c63",
  "tools/fixtures/real-journey-fixture.mjs": "531e7f617e8c35fdec8b677625085c2f4b5db1115e00cabb76963e793549dfb3",
  "web_launch/action-scoper.mjs": "0e6f2453628d331972c07354c2e2cfd02096902b2d0d3f1366f08e907b62ed07",
  "web_launch/app.mjs": "da581331b7d1cf200468dc69c5b4195a0ca1e7729fbf397aa9fc7f4cb683ee57",
  "web_launch/archive-codec.mjs": "2f23a59e5c7f65a7049bd1d2e572a855ec24435595e01b129ded838e8eb33d04",
  "web_launch/b-matching.mjs": "14039c77a85f4ac55bdbecf7fefb806d0c47e6066d3dd6b89c2e85fd4a6f5acd",
  "web_launch/business-case.mjs": "1e6e2642a01ad434ef1cb6e182eccebb6d4c1dd92d590c8b51356a5a50b3bd47",
  "web_launch/index.html": "fd0e7a7fb6169ce38ec323c3aec05c7a049d0042e21308b6e17ee16f896fe5b5",
  "web_launch/live-location.mjs": "3da2a3249c2c0c5fa2cb6f5f218944d22c82c2e0b7a3c43c9389e6cf176a5741",
  "web_launch/matching.mjs": "ec88c16ddc1372853025d9aa1efc8b5c51f7c3135f1f0539272759470d866c89",
  "web_launch/need-decay.mjs": "d9ffc6a2d8cd720938c18c686b2600e2191c7ee57d5b4b93954df0c6ae29afb8",
  "web_launch/neon-store.mjs": "ba054fcb10d851cab6e1a80c2bef4eb97fc7bb8d23942320fed3be44ccb3854b",
  "web_launch/pilot-policy.mjs": "2448fccaa949df9066d93d604c9670700db06e20b476866b43a7a46063194ac1",
  "web_launch/profile-brief.mjs": "8e0f7e78438e05df0aa0cedd3190ef192128253adc60ac1ba8b1f902cedddd77",
  "web_launch/profile-portability.mjs": "f4a84d6b04d644dbe95fb5cd629a7ad18bcc692c698fee9a175dc2b0d882f6fb",
  "web_launch/profile-store.mjs": "1232b25bbc3433c41fe68dda80b36d29a3c6208beb1333562e7661185b08e26f",
  "web_launch/proof-state.mjs": "479b14de89262249c90afc3153721123d7aab6fc75680ccb2410cfa5b6f5d3de",
  "web_launch/real-journey-client.mjs": "442018459e42aaa46d6326aa4a4d66657659313289c9bc8f0d1551dc4ea0d7b0",
  "web_launch/real-journey.html": "adceb5436f9c604327044538017e5145879bfdb00ea2698bd4d1b2850de869b5",
  "web_launch/session-value.mjs": "eea39771726ead3a1b4090f5a005d97cf454fa5dde0dc754b333d04cf3afda62"
});
const outputFile = new URL('./technical-repros.json', import.meta.url);
let sourceRoot;
async function refusePreflight(reason, details = {}) {
  const failure = { status: 'PINNED_REPLAY_REFUSED', expectedBaselineCommit: BASELINE_COMMIT,
    sourcePinVerified: false, productCodeImported: false, findingsReplayed: false, reason, ...details };
  await fs.writeFile(new URL('./technical-repros.json.preflight-rejected.json', import.meta.url), JSON.stringify(failure, null, 2) + '\n');
  throw Object.assign(new Error(reason), { code: 'PINNED_REPLAY_REFUSED', details });
}
const override = process.env.SYNERA_AUDIT_SOURCE;
if (override !== undefined && (!override || !isAbsolute(override))) await refusePreflight('SYNERA_AUDIT_SOURCE must be an absolute path.');
const rootPath = override === undefined ? fileURLToPath(new URL('../../', import.meta.url)) : override;
try { sourceRoot = pathToFileURL((await fs.realpath(resolve(rootPath))) + sep); }
catch (error) { await refusePreflight('Source root cannot be read.', { code: error.code, sourceRoot: rootPath }); }
const sourceChecks = await Promise.all(Object.entries(EXPECTED_SOURCE_SHA256).map(async ([path, expected]) => {
  let actual; try { actual = createHash('sha256').update(await fs.readFile(new URL(path, sourceRoot))).digest('hex'); }
  catch (error) { actual = error.code; }
  return { path, expected, actual, matches: actual === expected };
}));
const drift = sourceChecks.filter(check => !check.matches);
if (drift.length) await refusePreflight('Source differs from the audited baseline; no pinned replay performed.', { sourceRoot: fileURLToPath(sourceRoot), mismatches: drift });
const provenance = { sourcePinVerified: true, verification: 'Exact raw SHA256 of every direct/transitive product import and related UI bytes before dynamic import',
  verifiedSourceFiles: sourceChecks.length, sourceRoot: fileURLToPath(sourceRoot), sourceSha256: EXPECTED_SOURCE_SHA256,
  runnerSha256: createHash('sha256').update(await fs.readFile(fileURLToPath(import.meta.url))).digest('hex') };
// No product imports occur above this line.

const { NeonStore } = await import(new URL('web_launch/neon-store.mjs', sourceRoot));
const { RealJourneyStore, materialFromEditor } = await import(new URL('web_launch/real-journey-client.mjs', sourceRoot));
const { caseMaterialProblems } = await import(new URL('web_launch/business-case.mjs', sourceRoot));
const { handleNeon } = await import(new URL('neon/worker.mjs', sourceRoot));
const { createFixture, A, B, origin, config, fields } = await import(new URL('tools/fixtures/real-journey-fixture.mjs', sourceRoot));

const results = [];
const accepted = { status: 'application_data_erased', providerDeletion: 'pending', retainedScope: 'bilateral_records_and_safety_evidence', repeated: false };

// A cookie jar is shared by tabs. In-memory NeonStore instances are not.
{
  const db = createFixture(), erasedActors = [], requestBodies = [];
  let cookieJar = A;
  const env = { ...db.env, SYNERA_PROFILE_ERASURE_READY: 'true' };
  const upstream = async (url, init) => {
    if (url.endsWith('/rpc/synera_erase_profile_data')) {
      erasedActors.push(new Headers(init.headers).get('Authorization').split('.')[1]);
      return Response.json(accepted);
    }
    return db.upstream(url, init);
  };
  const transport = (path, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set('Origin', origin);
    headers.set('Cookie', '__Host-synera-session=' + cookieJar);
    if (path.endsWith('/profile-erasure')) requestBodies.push(JSON.parse(init.body));
    return handleNeon(new Request(new URL(path, origin), { ...init, headers }), env, upstream);
  };
  const tabA = new NeonStore({ ...config, profileErasureEnabled: true }, transport);
  const tabB = new NeonStore({ ...config, profileErasureEnabled: true }, transport);
  await tabA.restore();
  assert.equal(tabA.user.id, A);
  cookieJar = B; // A sign-in completed in another tab; the browser now sends B's cookie.
  await tabB.restore();
  const displayedActorAtConfirmation = tabA.user.id;
  const receipt = await tabA.eraseProfileData();
  assert.deepEqual(erasedActors, [B]);
  assert.equal(displayedActorAtConfirmation, A);
  assert.equal(tabA.user, null);
  results.push({ id: 'TA-01', severity: 'P1', status: 'REPRODUCED_WRONG_ACTOR_ERASURE_DISPATCH',
    displayedActorAtConfirmation, actualBearerActorDispatchedToErasureRpc: erasedActors[0],
    requestBody: requestBodies[0], clientAcceptedReceipt: receipt,
    scope: 'Actual NeonStore and worker; confirmation actor is taken from tabA.user as the original UI does. UI is not rendered; provider/RPC and shared cookie jar are synthetic. No real data deleted.' });
}

// All four values below are well within the form's 2000-character limit.
{
  const db = createFixture(), statuses = [];
  const transport = async (path, init = {}) => {
    const headers = new Headers(init.headers);
    headers.set('Origin', origin);
    headers.set('Cookie', '__Host-synera-session=' + A);
    const response = await handleNeon(new Request(new URL(path, origin), { ...init, headers }), db.env, db.upstream);
    if (init.method === 'POST') statuses.push({ path, status: response.status, bytes: Buffer.byteLength(init.body) });
    return response;
  };
  const store = new RealJourneyStore(config, transport, { storage: null });
  await store.restore();
  const input = fields({ mode: 'exchange', give_target: 'а'.repeat(500), take_target: 'б'.repeat(500),
    give_criteria: 'в'.repeat(500), take_criteria: 'г'.repeat(500) });
  const material = materialFromEditor(A, B, input);
  assert.deepEqual(caseMaterialProblems(material), []);
  let rejection;
  try { await store.saveTerms(B, material); }
  catch (error) { rejection = { status: error.status, code: error.code ?? null, message: error.message }; }
  assert.equal(rejection?.status, 413);
  assert.equal(db.cases.length, 0);
  results.push({ id: 'TA-02', severity: 'P2', status: 'REPRODUCED_VALID_EDITOR_MATERIAL_REJECTED',
    textCharactersPerField: 500, editorLimitPerField: 2000, materialValidationProblems: [],
    post: statuses[0], rejection, scope: 'Actual canonicalizer, RealJourneyStore, worker; synthetic provider.' });
}

// Erasure's stale response avoids Set-Cookie; a stale /session 401 still clears a new cookie.
{
  const db = createFixture();
  let release;
  const upstream = async (url, init) => {
    if (url.endsWith('/get-session')) {
      return await new Promise(resolve => { release = () => resolve(Response.json({}, { status: 401 })); });
    }
    return db.upstream(url, init);
  };
  const request = new Request(origin + '/api/neon/session', { headers: {
    Origin: origin, 'X-Synera-Client': '1', Cookie: '__Host-synera-session=' + A,
  } });
  const pending = handleNeon(request, db.env, upstream);
  let cookieJar = B; // Sign-in of B completes while A's session request remains in flight.
  release();
  const response = await pending;
  const setCookie = response.headers.get('Set-Cookie');
  assert.equal(response.status, 401);
  assert.match(setCookie, /__Host-synera-session=;.*Max-Age=0/);
  if (setCookie.includes('Max-Age=0')) cookieJar = null; // Browser cookie processing.
  results.push({ id: 'TA-03', severity: 'P2', status: 'REPRODUCED_STALE_401_CLEARS_NEW_SESSION_COOKIE',
    staleRequestActor: A, newLoginActor: B, staleResponseSetCookie: setCookie,
    browserCookieAfterStaleResponse: cookieJar,
    scope: 'Actual worker and delayed synthetic upstream 401. Cookie-jar application is an explicit model, not executed browser behavior.' });
}

const hashes = {};
for (const file of ['neon/worker.mjs', 'web_launch/neon-store.mjs', 'web_launch/real-journey-client.mjs', 'web_launch/real-journey.html', 'web_launch/app.mjs']) {
  const source = await fs.readFile(new URL(file, sourceRoot));
  hashes[file] = createHash('sha256').update(source).digest('hex');
}
const report = { auditedCommit: BASELINE_COMMIT, ...provenance,
  generatedAt: new Date().toISOString(), sourceModified: false, liveAccountsUsed: false,
  providerCalls: 0, postgresTestsRun: false, findingSourceSha256: hashes, results };
await fs.writeFile(outputFile, JSON.stringify(report, null, 2) + '\n');
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
