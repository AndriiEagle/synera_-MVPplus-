import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PUBLIC_ASSETS } from '../web_launch/assets.mjs';

// Owned modules joined explicitly; no package downloads or runtime CDN dependencies.
const root = fileURLToPath(new URL('../web_launch/', import.meta.url));
const outputName = process.argv[2] || 'dist-neon';
if (!/^dist-neon(?:-[a-z0-9-]+)?$/.test(outputName)) throw new Error('Output must stay in an owned dist-neon directory');
const directory = path.join(root, outputName);
const assets = Object.keys(PUBLIC_ASSETS);
const generated = ['_worker.js', '_routes.json', 'release.json'];
await fs.mkdir(directory, { recursive: true });
if ((await fs.readdir(directory)).some(name => ![...assets, ...generated].includes(name))) throw new Error('Unexpected release file; inspect before continuing');
const policy = await fs.readFile(path.join(root, 'pilot-policy.mjs'), 'utf8');
const workerSource = await fs.readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
const policyImport = "import { consentRecord, POLICY_VERSION } from '../web_launch/pilot-policy.mjs';";
const expectedImports = policyImport + "\nimport { handleGoogleOAuth } from './google-oauth.mjs';\nimport { handleMeetingLocation, locationReady } from './meeting-location.mjs';\nimport { handleGroupRoom, groupRoomsReady } from './group-room.mjs';\nimport { outcomeReady, outcomeRPCArgs } from './case-outcome.mjs';\nimport { meetingAddressReady, meetingAddressRPCArgs } from './meeting-address.mjs';\nimport { profileErasureReady, profileErasureResult } from './profile-erasure.mjs';";
const budgetImport = "\nimport { caseMaterialBytes, CASE_MATERIAL_MAX_BYTES, CASE_REQUEST_MAX_BYTES } from '../web_launch/case-material-budget.mjs';";
const abuseImport = "\nimport { normalizeOpenEmail, withOtpProtection, OtpProtectionError } from './otp-abuse.mjs';";
const aiImport = "\nimport { handleLiveAi, liveAiReady } from './live-ai.mjs';";
const allExpectedImports = expectedImports + budgetImport + abuseImport + aiImport;
const googleSource = await fs.readFile(new URL('./google-oauth.mjs', import.meta.url), 'utf8');
if (!workerSource.startsWith(allExpectedImports) || /\bimport\s/.test(workerSource.slice(allExpectedImports.length)) ||
    !googleSource.startsWith(policyImport) || /\bimport\s/.test(googleSource.slice(policyImport.length))) throw new Error('Worker dependency changed; review build');
// Keep helper names scoped exactly as they are in the source module.
const google = googleSource.slice(policyImport.length).replace('export async function handleGoogleOAuth', 'async function handleGoogleOAuth');
if (/\bexport\s/.test(google)) throw new Error('OAuth exports changed; review build');
const locationSource = await fs.readFile(new URL('./meeting-location.mjs', import.meta.url), 'utf8');
const liveSource = await fs.readFile(path.join(root, 'live-location.mjs'), 'utf8');
const locationImport = "import { recordLocationSample, LOCATION_SCHEMA } from '../web_launch/live-location.mjs';";
if (!locationSource.startsWith(locationImport) || /\bimport\s/.test(locationSource.slice(locationImport.length)) || /\bimport\s/.test(liveSource)) throw new Error('Location dependencies changed; review build');
const location = '\nconst { handleMeetingLocation, locationReady } = (() => {\n' + liveSource.replace(/^export /gm, '') + '\n' + locationSource.slice(locationImport.length).replace(/^export /gm, '') + '\nreturn {handleMeetingLocation,locationReady};\n})();\n';
const groupSource = await fs.readFile(new URL('./group-room.mjs', import.meta.url), 'utf8');
if (/\bimport\s/.test(groupSource)) throw new Error('Room dependencies changed; review build');
const group = '\nconst {handleGroupRoom,groupRoomsReady}=(()=>{\n' + groupSource.replace(/^export /gm, '') + '\nreturn {handleGroupRoom,groupRoomsReady};\n})();\n';
const outcomeSource = await fs.readFile(new URL('./case-outcome.mjs', import.meta.url), 'utf8');
if (/\bimport\s/.test(outcomeSource)) throw new Error('Outcome dependencies changed; review build');
const outcome = '\nconst {outcomeReady,outcomeRPCArgs}=(()=>{\n' + outcomeSource.replace(/^export /gm, '') + '\nreturn {outcomeReady,outcomeRPCArgs};\n})();\n';
const addressSource = await fs.readFile(new URL('./meeting-address.mjs', import.meta.url), 'utf8');
if (/\bimport\s/.test(addressSource)) throw new Error('Address dependencies changed; review build');
const address = '\nconst {meetingAddressReady,meetingAddressRPCArgs}=(()=>{\n' + addressSource.replace(/^export /gm, '') + '\nreturn {meetingAddressReady,meetingAddressRPCArgs};\n})();\n';
const erasureSource = await fs.readFile(new URL('./profile-erasure.mjs', import.meta.url), 'utf8');
if (/\bimport\s/.test(erasureSource)) throw new Error('Erasure dependencies changed; review build');
const erasure = '\nconst {profileErasureReady,profileErasureResult}=(()=>{\n' + erasureSource.replace(/^export /gm, '') + '\nreturn {profileErasureReady,profileErasureResult};\n})();\n';
const budgetSource = await fs.readFile(path.join(root, 'case-material-budget.mjs'), 'utf8');
if (/\bimport\s/.test(budgetSource)) throw new Error('Case budget dependencies changed; review build');
const budget = '\nconst {caseMaterialBytes,CASE_MATERIAL_MAX_BYTES,CASE_REQUEST_MAX_BYTES}=(()=>{\n' + budgetSource.replace(/^export /gm, '') + '\nreturn {caseMaterialBytes,CASE_MATERIAL_MAX_BYTES,CASE_REQUEST_MAX_BYTES};\n})();\n';
const abuseSource = await fs.readFile(new URL('./otp-abuse.mjs', import.meta.url), 'utf8');
if (/\bimport\s/.test(abuseSource)) throw new Error('OTP dependencies changed; review build');
const abuse = '\nconst {normalizeOpenEmail,withOtpProtection,OtpProtectionError}=(()=>{\n' + abuseSource.replace(/^export /gm, '') + '\nreturn {normalizeOpenEmail,withOtpProtection,OtpProtectionError};\n})();\n';
const aiSource = await fs.readFile(new URL('./live-ai.mjs', import.meta.url), 'utf8');
const aiImports = "import { BOT_PROFILES } from '../web_launch/simulation-personas.mjs';\nimport { maskOpsText } from '../web_launch/ops-log.mjs';";
if (!aiSource.startsWith(aiImports) || /\bimport\s/.test(aiSource.slice(aiImports.length))) throw new Error('Live AI dependencies changed; review build');
const aiPersonas = await fs.readFile(path.join(root, 'simulation-personas.mjs'), 'utf8');
const aiMask = await fs.readFile(path.join(root, 'ops-log.mjs'), 'utf8');
const ai = '\nconst {handleLiveAi,liveAiReady}=(()=>{\n' + [aiPersonas, aiMask, aiSource.slice(aiImports.length)].map(s=>s.replace(/^export /gm,'')).join('\n') + '\nreturn {handleLiveAi,liveAiReady};\n})();\n';
const worker = policy + '\nconst handleGoogleOAuth = (() => {\n' + google + '\nreturn handleGoogleOAuth;\n})();\n' + location + group + outcome + address + erasure + budget + abuse + ai + workerSource.slice(allExpectedImports.length) + '\nexport default createNeonWorker(' + JSON.stringify(assets) + ');\n';
const receipt = { built_at: new Date().toISOString(), backend: 'neon', cloudflare_pages_advanced_mode: true, files: [], published: false, live_auth_verified: false, live_rls_verified: false, automatic_public_ai: false };
for (const name of assets) await fs.copyFile(path.join(root, name), path.join(directory, name));
await fs.writeFile(path.join(directory, '_worker.js'), worker);
await fs.writeFile(path.join(directory, '_routes.json'), JSON.stringify({ version: 1, include: ['/*'], exclude: [] }));
for (const name of [...assets, '_worker.js', '_routes.json']) {
  const data = await fs.readFile(path.join(directory, name));
  receipt.files.push({ name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') });
}
await fs.writeFile(path.join(directory, 'release.json'), JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ directory, files: assets.length + generated.length, published: false }));
