// Local signing only; installers and deployment belong to the lane operator.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidHome = path.join(os.homedir(), '.synera-android');
const host = 'synera-phone-preview.vercel.app';
const inside = (child, parent) => {
  const relative = path.relative(parent, child);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
};

export function releaseOutput(value, source = repo, privateRoot = androidHome) {
  if (!value) throw new Error('Usage: node tools/android-release.mjs <output-folder>');
  const output = path.resolve(value);
  if (inside(output, privateRoot) || inside(privateRoot, output) ||
      (inside(output, source) && !inside(output, path.join(source, 'tmp')) &&
        output !== path.join(source, 'web_launch/dist-real'))) {
    throw new Error('Output must be outside source/private toolchain (tmp/ or web_launch/dist-real allowed).');
  }
  return output;
}

export function buildManifest(template, privateRoot) {
  const result = JSON.parse(JSON.stringify(template).replaceAll('SYNERA_HOST', host));
  result.signingKey = { path: path.join(privateRoot, 'synera-upload.keystore').replaceAll('\\', '/'), alias: 'synera' };
  result.minSdkVersion = Math.max(24, template.minSdkVersion); // Browser Helper 2.7.4 requires API 24.
  return result;
}

export function assetLinks(fingerprint) {
  if (!/^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(fingerprint)) throw new Error('Invalid certificate SHA-256');
  return [{ relation: ['delegate_permission/common.handle_all_urls'], target: {
    namespace: 'android_app', package_name: 'ch.synera.app', sha256_cert_fingerprints: [fingerprint],
  } }];
}

export function release(value) {
  const output = releaseOutput(value);
  // Reject links before writing any release files, including an existing .well-known directory.
  for (let cursor = output; ; cursor = path.dirname(cursor)) {
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Linked output directory');
    if (cursor === path.dirname(cursor)) break;
  }
  for (const name of ['synera.apk', 'synera.apk.sha256', 'android-release.json', '.well-known', '.well-known/assetlinks.json']) {
    const file = path.join(output, name);
    if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw new Error('Linked output file');
  }
  const config = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.bubblewrap/config.json'), 'utf8'));
  const secrets = Object.fromEntries(fs.readFileSync(path.join(androidHome, 'keystore.env'), 'utf8')
    .trim().split(/\r?\n/).map(line => line.split('=')));
  for (const key of ['BUBBLEWRAP_KEYSTORE_PASSWORD', 'BUBBLEWRAP_KEY_PASSWORD']) {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(secrets[key] || '')) throw new Error('Missing private signing password');
  }
  const work = path.join(androidHome, 'twa');
  const logs = path.join(androidHome, 'logs');
  fs.mkdirSync(work, { recursive: true });
  fs.mkdirSync(logs, { recursive: true });
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    ['SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'USERPROFILE', 'HOME', 'HOMEDRIVE', 'HOMEPATH',
      'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432',
      'SYSTEMDRIVE', 'NUMBER_OF_PROCESSORS', 'OS', 'NODE_USE_SYSTEM_CA',
      'NODE_EXTRA_CA_CERTS', 'NODEFAULTCURRENTDIRECTORYINEXEPATH'].includes(key.toUpperCase())));
  const env = { ...inherited, ...secrets, JAVA_HOME: config.jdkPath,
    ANDROID_HOME: config.androidSdkPath, ANDROID_SDK_ROOT: config.androidSdkPath,
    GRADLE_USER_HOME: path.join(androidHome, 'gradle'),
    GRADLE_OPTS: '-Dorg.gradle.daemon=false -Dorg.gradle.workers.max=2 -Xmx1536m',
    ANDROID_USER_HOME: path.join(androidHome, 'android-user'),
    TEMP: path.join(repo, 'tmp'), TMP: path.join(repo, 'tmp'),
    // Windows may disable implicit current-directory executable lookup.
    PATH: `${work}${path.delimiter}${path.join(config.jdkPath, 'bin')}${path.delimiter}${process.env.PATH}` };
  fs.mkdirSync(env.TEMP, { recursive: true });
  function run(exe, args, name, binary = false) {
    console.log(`${name}...`);
    const result = spawnSync(exe, args, { cwd: work, env, input: '', windowsHide: true,
      timeout: 20 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 });
    let log = Buffer.concat([result.stdout || Buffer.alloc(0), result.stderr || Buffer.alloc(0)]).toString();
    for (const password of Object.values(secrets)) log = log.replaceAll(password, '[REDACTED]');
    if (!binary) fs.writeFileSync(path.join(logs, `${name}.log`), log);
    if (result.error || result.status !== 0) throw new Error(`${name} failed; inspect private logs (${result.error?.code || result.status}).`);
    return binary ? result.stdout : log;
  }
  const manifest = buildManifest(JSON.parse(fs.readFileSync(path.join(repo, 'android/twa-manifest.json'), 'utf8')), androidHome);
  fs.writeFileSync(path.join(work, 'twa-manifest.json'), JSON.stringify(manifest, null, 2));
  const bubblewrap = path.join(androidHome, 'npm/node_modules/@bubblewrap/cli/bin/bubblewrap.js');
  run(process.execPath, [bubblewrap, 'update', '--skipVersionUpgrade'], 'bubblewrap-update');
  run(process.execPath, [bubblewrap, 'build', '--skipPwaValidation'], 'bubblewrap-build');
  const keytool = path.join(config.jdkPath, 'bin/keytool.exe');
  const cert = run(keytool, ['-exportcert', '-keystore', manifest.signingKey.path, '-alias', 'synera',
    '-storepass:env', 'BUBBLEWRAP_KEYSTORE_PASSWORD'], 'certificate', true);
  const certDigest = createHash('sha256').update(cert).digest('hex');
  const fingerprint = certDigest.toUpperCase().match(/../g).join(':');
  const buildTools = path.join(config.androidSdkPath, 'build-tools/34.0.0');
  const apk = path.join(work, 'app-release-signed.apk');
  const signature = run(path.join(config.jdkPath, 'bin/java.exe'), ['-jar', path.join(buildTools, 'lib/apksigner.jar'),
    'verify', '--verbose', '--print-certs', apk], 'apk-signature');
  if (!signature.toLowerCase().includes(`signer #1 certificate sha-256 digest: ${certDigest}`)) {
    throw new Error('APK signer differs from the private keystore');
  }
  const badging = run(path.join(buildTools, 'aapt.exe'), ['dump', 'badging', apk], 'apk-badging');
  const metadata = badging.match(/^package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'/m);
  if (!metadata || metadata[1] !== manifest.packageId || metadata[2] !== String(manifest.appVersionCode) ||
      metadata[3] !== manifest.appVersion) throw new Error('Unexpected APK package or version');
  const data = fs.readFileSync(apk);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const aab = path.join(work, 'app-release-bundle.aab');
  if (fs.statSync(aab).size === 0) throw new Error('Missing AAB');
  const bundleSignature = run(path.join(config.jdkPath, 'bin/jarsigner.exe'), ['-J-Duser.language=en', '-verify', aab], 'aab-signature');
  if (!bundleSignature.includes('jar verified.')) throw new Error('AAB signature was not verified');
  const receipt = { packageId: metadata[1], versionCode: Number(metadata[2]), version: metadata[3],
    host, apk: 'synera.apk', bytes: data.length, sha256, certificateSha256: fingerprint,
    aabBytes: fs.statSync(aab).size, builtAt: new Date().toISOString(), published: false };
  fs.mkdirSync(path.join(output, '.well-known'), { recursive: true });
  fs.writeFileSync(path.join(output, 'synera.apk'), data);
  fs.writeFileSync(path.join(output, 'synera.apk.sha256'), `${sha256}  synera.apk\n`);
  fs.writeFileSync(path.join(output, '.well-known/assetlinks.json'), JSON.stringify(assetLinks(fingerprint), null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'android-release.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify({ output, ...receipt }, null, 2));
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { release(process.argv[2]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
