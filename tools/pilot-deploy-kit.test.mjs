import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { generateKit, splitSQL, migrationInventory, validateUpload, workerEnvironment } from './pilot-deploy-kit.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = path.join(root, 'docs/deploy-kit-20261029');
const hash = b => createHash('sha256').update(b).digest('hex');
// Independent ZIP reader: validate central and local records, not the generator's input array.
function unzip(bytes) {
  const end = bytes.length - 22;
  assert.equal(bytes.readUInt32LE(end), 0x06054b50);
  const files = new Map();
  let offset = bytes.readUInt32LE(end + 16);
  for (let i = 0; i < bytes.readUInt16LE(end + 10); i++) {
    assert.equal(bytes.readUInt32LE(offset), 0x02014b50);
    const size = bytes.readUInt32LE(offset + 20), length = bytes.readUInt16LE(offset + 28);
    const name = bytes.subarray(offset + 46, offset + 46 + length).toString();
    const local = bytes.readUInt32LE(offset + 42);
    assert.equal(bytes.readUInt32LE(local), 0x04034b50);
    assert.equal(bytes.subarray(local + 30, local + 30 + bytes.readUInt16LE(local + 26)).toString(), name);
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const compressed = bytes.subarray(start, start + size);
    const data = bytes.readUInt16LE(offset + 10) === 8 ? inflateRawSync(compressed) : compressed;
    assert.equal(data.length, bytes.readUInt32LE(offset + 24));
    assert.ok(!files.has(name)); files.set(name, data);
    offset += 46 + length + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }
  return files;
}

test('owner kit: repeatable bytes, ZIP exactly matches isolated canonical build, SQL and env closure', async () => {
  const out = await fs.mkdtemp(path.join(base, '.test-'));
  try {
    const first = await generateKit({ root, out });
    const before = new Map(await Promise.all((await fs.readdir(out)).filter(n => !n.startsWith('.')).map(async n => [n, hash(await fs.readFile(path.join(out, n)))])));
    await generateKit({ root, out });
    for (const [name, digest] of before) assert.equal(hash(await fs.readFile(path.join(out, name))), digest, name + ' changed on repeat');
    const manifest = JSON.parse(await fs.readFile(path.join(out, 'manifest.json')));
    const files = unzip(await fs.readFile(path.join(out, manifest.zip.name)));
    const { PUBLIC_ASSETS } = await import('../web_launch/assets.mjs');
    assert.deepEqual([...files.keys()].sort(), [...Object.keys(PUBLIC_ASSETS), '_worker.js', '_routes.json', 'release.json'].sort());
    assert.equal(files.size, manifest.files.length);
    for (const row of manifest.files) { assert.equal(hash(files.get(row.name)), row.sha256); assert.equal(files.get(row.name).length, row.bytes); }
    for (const name of Object.keys(PUBLIC_ASSETS)) assert.deepEqual(files.get(name), await fs.readFile(path.join(root, 'web_launch', name)));
    const release = JSON.parse(files.get('release.json'));
    for (const row of release.files) assert.equal(hash(files.get(row.name)), row.sha256);
    // Execute the repository build independently without the generator's clock shim.
    const buildRoot=path.join(out,'build-oracle');
    for(const row of manifest.source) {const target=path.join(buildRoot,row.name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.copyFile(path.join(root,row.name),target);}
    const built=spawnSync(process.execPath,[path.join(buildRoot,'neon/build.mjs'),'dist-neon-oracle'],{encoding:'utf8'});
    assert.equal(built.status,0,built.stderr);
    const buildDir=path.join(buildRoot,'web_launch/dist-neon-oracle');
    assert.deepEqual((await fs.readdir(buildDir)).sort(),[...files.keys()].sort());
    for(const [name,data] of files) {
      let expected=await fs.readFile(path.join(buildDir,name));
      if(name==='release.json') {const receipt=JSON.parse(expected);receipt.built_at=new Date(manifest.build_time).toISOString();expected=Buffer.from(JSON.stringify(receipt,null,2));}
      assert.deepEqual(data,expected,name+' differs from neon/build.mjs');
    }
    const inspect = await fs.readFile(path.join(out, '00-inspect.sql'), 'utf8');
    assert.doesNotMatch(inspect.replace(/--[^\n]*/g, '').replace(/'(?:[^']|'')*'/g, "''"), /\b(insert|update|delete|alter|create|drop|grant|revoke|truncate|do|call)\b/i);
    const migrate = await fs.readFile(path.join(out, '10-migrate.sql'), 'utf8');
    assert.match(migrate, /^BEGIN;/m); assert.match(migrate, /COMMIT;/); assert.match(migrate, /ROLLBACK;/);
    assert.match(migrate, /Partial or unexpected migration/); assert.match(migrate, /pg_advisory_xact_lock/);
    const env = JSON.parse(await fs.readFile(path.join(out, 'env.json')));
    const independentlyFound = new Set();
    for (const file of env.sources) {
      for (const m of (await fs.readFile(path.join(root, file), 'utf8')).matchAll(/\benv\.([A-Z][A-Z0-9_]*)/g)) independentlyFound.add(m[1]);
    }
    assert.deepEqual(env.variables.map(v => v.name).sort(), [...independentlyFound].sort());
    for (const name of ['SYNERA_OPEN_REGISTRATION', 'SYNERA_GOOGLE_OAUTH_READY']) assert.equal(env.variables.find(v => v.name === name).value, 'false');
    assert.ok(env.sources.includes('neon/otp-abuse.mjs'));
    assert.ok(manifest.sql.every(row => row.sha256.length === 64));
  } finally { await fs.rm(out, { recursive: true, force: true }); }
});

test('SQL splitter preserves quoted semicolons, comments and dollar bodies', () => {
  assert.deepEqual(splitSQL("-- x\nselect 'a;--b'; do $f$ begin perform ';'; end $f$; select 3;"), ["select 'a;--b'", "do $f$ begin perform ';'; end $f$", 'select 3']);
});

test('inventory includes columns, function signatures, policies, grants and replacement fingerprints', () => {
  const rows = migrationInventory('fixture.sql', `create table public.x (id uuid, label text, primary key(id));
create function public.f(p_id uuid, p_flags text[] default '{}') returns boolean language sql as $$ select true $$;
create policy own on public.x for select to authenticated using (true);
grant select, update(label) on public.x to authenticated;
alter table public.x add column extra integer;
create or replace function public.f(p_id uuid, p_flags text[] default '{}') returns boolean language sql as $$ select false $$;`);
  for (const kind of ['table','column','function','policy','grant']) assert.ok(rows.some(r => r.kind === kind), kind);
  assert.ok(rows.some(r => r.object === 'public.x.extra'));
  assert.ok(rows.some(r => r.object === 'public.f(uuid,text[])'));
  assert.ok(rows.some(r => r.kind === 'function' && r.replacement));
});

test('ZIP boundary rejects traversal, maps, tests, secret material and size overflow', () => {
  for (const name of ['../worker.js', 'a.test.mjs', 'app.js.map', '.env', 'neon/schema.sql']) {
    assert.throws(() => validateUpload([{ name, data: Buffer.from('x') }], [name]));
  }
  assert.throws(() => validateUpload([{name:'ok.js',data:Buffer.from('-----BEGIN PRIVATE KEY-----')}], ['ok.js']));
  assert.throws(() => validateUpload([{name:'ok.js',data:Buffer.alloc(25 * 1024 * 1024 + 1)}], ['ok.js']));
  assert.throws(() => validateUpload([{name:'extra.js',data:Buffer.from('x')}], []));
});

test('environment discovery refuses dynamic names instead of silently omitting a binding', async () => {
  const dir = await fs.mkdtemp(path.join(base, '.env-test-'));
  try {
    await fs.writeFile(path.join(dir, 'worker.mjs'), 'export const f = env => env[name];');
    await assert.rejects(workerEnvironment(dir, 'worker.mjs'), /dynamic|Dynamic/);
  } finally { await fs.rm(dir, {recursive:true,force:true}); }
});

// Opt in with an existing portable psql and our disposable loopback cluster; no cloud DSN.
if (process.env.SYNERA_KIT_PSQL) test('real PostgreSQL: r8 upgrade, second apply, partial/drift rejection and rolled-back source suites', async () => {
  const port=process.env.SYNERA_KIT_PGPORT;
  assert.match(port || '', /^\d{2,5}$/);
  const env={...Object.fromEntries(Object.entries(process.env).filter(([k])=>!/^PG/i.test(k))),PGCLIENTENCODING:'UTF8'};
  const run=(db,sql)=>spawnSync(process.env.SYNERA_KIT_PSQL,['-h','127.0.0.1','-p',port,'-U','kit_acceptance','-w','-X','-At','-q','-d',db,'-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',env,timeout:60000,maxBuffer:4*1024*1024});
  const must=(db,sql)=>{const r=run(db,sql);assert.equal(r.status,0,(r.stderr || r.error?.message || '')+'\nLast SQL output: '+r.stdout?.slice(-1400));return r.stdout.trim();};
  assert.equal(must('postgres',"select host(inet_server_addr());"),'127.0.0.1');
  const prefix='kit_'+Date.now();
  const {neonAuthShimSql}=await import('../neon/local_acceptance.mjs');
  const read=async f=>fs.readFile(path.join(root,f),'utf8');
  const out=await fs.mkdtemp(path.join(base,'.test-pg-'));
  const results=[];
  try {
    await generateKit({root,out});
    for(const kind of ['upgrade','partial','drift','security','policy','replay']) {
      const db=prefix+'_'+kind;must('postgres',`create database ${db} template template0 encoding 'UTF8';`);
      must(db,neonAuthShimSql());
      if(kind!=='replay')must(db,await read('neon/schema.proposal.sql'));
      const migrate=await fs.readFile(path.join(out,'10-migrate.sql'),'utf8');
      if(kind==='upgrade') {
        must(db,await fs.readFile(path.join(out,'00-inspect.sql'),'utf8'));
        must(db,migrate);
        const before=must(db,"select string_agg(proname||':'||md5(prosrc),',' order by proname) from pg_proc where pronamespace='public'::regnamespace;");
        must(db,migrate);
        assert.equal(must(db,"select string_agg(proname||':'||md5(prosrc),',' order by proname) from pg_proc where pronamespace='public'::regnamespace;"),before);
        assert.equal(must(db,'select count(*) from neon_auth."user";'),'0');
        const add=await fs.readFile(path.join(out,'20-add-member.sql'),'utf8');
        assert.notEqual(run(db,add).status,0);
        must(db,add.replaceAll('<PARTNER_EMAIL>','partner@pilot.example'));
        must(db,add.replaceAll('<PARTNER_EMAIL>','partner@pilot.example'));
        assert.equal(must(db,'select count(*) from public.synera_pilot_members;'),'1');
        must(db,(await fs.readFile(path.join(out,'21-remove-member.sql'),'utf8')).replaceAll('<PARTNER_EMAIL>','partner@pilot.example'));
        assert.equal(must(db,'select count(*) from public.synera_pilot_members;'),'0');
      } else if(kind==='partial') {
        must(db,'create table public.match_cases(case_id text);');
        const r=run(db,migrate);assert.notEqual(r.status,0);assert.match(r.stderr,/Partial or unexpected/);
        assert.equal(must(db,"select to_regprocedure('public.synera_valid_mode_details(jsonb)') is null;"),'t');
      } else if(kind==='drift') {
        must(db,'create or replace function public.synera_pilot_member() returns boolean language sql as $$ select true $$;');
        const r=run(db,migrate);assert.notEqual(r.status,0);assert.match(r.stderr,/Unknown function definition/);
      } else if(kind==='security') {
        must(db,'alter function public.synera_valid_brief(jsonb) security definer;');
        const r=run(db,migrate);assert.notEqual(r.status,0);assert.match(r.stderr,/Unknown function definition/);
      } else if(kind==='policy') {
        must(db,'alter policy profiles_read on public.profiles using (true);');
        const r=run(db,migrate);assert.notEqual(r.status,0);assert.match(r.stderr,/Unknown policy definition/);
        assert.equal(must(db,"select to_regclass('public.match_cases') is null;"),'t');
      } else {
        must(db,await fs.readFile(path.join(out,'11-acceptance-disposable.sql'),'utf8'));
        assert.equal(must(db,"select to_regclass('public.profiles') is null;"),'t');
        assert.equal(must(db,'select count(*) from neon_auth."user";'),'0');
      }
      results.push({kind,database:db,pass:true});
    }
    const manifest=JSON.parse(await fs.readFile(path.join(out,'manifest.json')));
    await fs.writeFile(path.join(base,'postgres-acceptance.json'),JSON.stringify({status:'PASS_LOCAL_POSTGRESQL',scope:'Disposable loopback identity shim only; no Neon, signed HTTP JWT, live accounts or deployment',source_commit:manifest.commit,generator_sha256:hash(await read('tools/pilot-deploy-kit.mjs')),oracle_sha256:hash(await read('tools/pilot-deploy-kit.test.mjs')),migrate_sha256:hash(await fs.readFile(path.join(out,'10-migrate.sql'))),replay_sha256:hash(await fs.readFile(path.join(out,'11-acceptance-disposable.sql'))),source_sql:manifest.sql,results},null,2)+'\n');
  } finally {await fs.rm(out,{recursive:true,force:true});}
});
