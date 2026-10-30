// Local packaging only. No credentials, provider SDK, network call or live SQL executor.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { deflateRawSync } from 'node:zlib';
import { readPrivacyGate, DEFAULT_READINESS } from './privacy-gate.mjs';

const sha = b => createHash('sha256').update(b).digest('hex');
const lit = s => "'" + String(s).replaceAll("'", "''") + "'";
const json = x => JSON.stringify(x, null, 2) + '\n';
const slash = s => s.replaceAll('\\', '/');
export const ORDER = ['case-state', 'case-expiry-repair', 'meeting-status-guard', 'meeting-location', 'group-room', 'case-outcome', 'meeting-address-agreement', 'message-intent', 'profile-erasure', 'privacy-complete-erasure', 'privacy-retention-purge', 'consent-evidence', 'rls-hardening'];

// Split only at SQL statement boundaries; dollar bodies and quoted text stay verbatim.
export function splitSQL(sql) {
  const out = []; let buf = '', quote = '', dollar = '', depth = 0;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i], next = sql[i + 1];
    if (dollar) { if (sql.startsWith(dollar, i)) { buf += dollar; i += dollar.length - 1; dollar = ''; } else buf += c; continue; }
    if (quote) { buf += c; if (c === quote) { if (next === quote) { buf += next; i++; } else quote = ''; } continue; }
    if (c === '-' && next === '-') { while (i < sql.length && sql[i] !== '\n') i++; buf += '\n'; continue; }
    if (c === '/' && next === '*') { depth = 1; i += 2; for (; i < sql.length && depth; i++) { if (sql[i] === '/' && sql[i+1] === '*') { depth++; i++; } else if (sql[i] === '*' && sql[i+1] === '/') { depth--; i++; } } if (depth) throw Error('Unclosed SQL comment'); i--; buf += ' '; continue; }
    if (c === "'" || c === '"') { quote = c; buf += c; continue; }
    const tag = c === '$' && sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
    if (tag) { dollar = tag; buf += tag; i += tag.length - 1; continue; }
    if (c === ';') { if (buf.trim()) out.push(buf.trim()); buf = ''; } else buf += c;
  }
  if (quote || dollar) throw Error('Unclosed SQL literal');
  if (buf.trim()) out.push(buf.trim()); return out;
}

function comma(text) {
  let depth = 0, quoted = false, start = 0; const parts = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "'") { if (quoted && text[i+1] === "'") { i++; continue; } quoted = !quoted; }
    if (quoted) continue;
    if (text[i] === '(') depth++; if (text[i] === ')') depth--;
    if (text[i] === ',' && !depth) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(text.slice(start).trim()); return parts;
}
function callParts(s) { const open = s.indexOf('('); let depth = 1, i = open + 1; for (; i < s.length && depth; i++) { if (s[i] === '(') depth++; if (s[i] === ')') depth--; } return { head:s.slice(0,open), args:s.slice(open+1,i-1), tail:s.slice(i) }; }
const proc = signature => {
  const name = signature.slice(0, signature.indexOf('(')).split('.').at(-1);
  const types=signature.slice(signature.indexOf('(')+1,-1).replaceAll('public.','').replaceAll('timestamptz','timestamp with time zone').split(',').map(s=>s.trim()).join(', ');
  return `(select p.oid from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname=${lit(name)} and replace(pg_catalog.oidvectortypes(p.proargtypes),'public.','')=${lit(types)})`;
};
const columnPrivilege=(role,table,column,permission)=>`has_column_privilege(${lit(role)},to_regclass(${lit(table)}),(select attnum from pg_catalog.pg_attribute where attrelid=to_regclass(${lit(table)}) and attname=${lit(column)} and not attisdropped),${lit(permission)})`;

export function migrationInventory(source, sql) {
  const rows = [], add = (kind, object, check, extra = {}) => rows.push({source,kind,object,check,...extra});
  const tableCheck = t => `to_regclass(${lit(t)}) is not null`;
  const col = (t,c) => add('column',t+'.'+c, `exists(select 1 from information_schema.columns where table_schema='public' and table_name=${lit(t.split('.').at(-1))} and column_name=${lit(c)})`);
  for (const s of splitSQL(sql)) {
    let m;
    if ((m = s.match(/^create table (public\.\w+)\s*\(/i))) {
      const t = m[1]; add('table',t,tableCheck(t));
      for (const p of comma(callParts(s).args)) { const name = p.match(/^(\w+)\s+/)?.[1]; if (name && !/^(primary|foreign|check|unique|constraint)$/i.test(name)) col(t,name); }
    } else if ((m = s.match(/^create (or replace )?function (public\.\w+)\s*\(/i))) {
      const p = callParts(s), types = comma(p.args).filter(Boolean).map(a => a.replace(/\s+default\s+[\s\S]*$/i,'').replace(/^\w+\s+/, '').trim());
      const signature = m[2]+'('+types.join(',')+')', body = s.match(/as\s+(\$(?:\w*)\$)([\s\S]*?)\1/i)?.[2];
      add('function',signature,`${proc(signature)} is not null`, {replacement:!!m[1],body:body ?? null,statement:s});
    } else if ((m = s.match(/^create policy (\w+) on (public\.\w+)/i))) {
      add('policy',m[2]+'.'+m[1],`exists(select 1 from pg_catalog.pg_policy where polrelid=to_regclass(${lit(m[2])}) and polname=${lit(m[1])})`,{statement:s,table:m[2],name:m[1]});
    } else if ((m = s.match(/^create trigger (\w+)[\s\S]*? on (public\.\w+)/i))) {
      add('trigger',m[2]+'.'+m[1],`exists(select 1 from pg_catalog.pg_trigger where tgrelid=to_regclass(${lit(m[2])}) and tgname=${lit(m[1])} and not tgisinternal)`);
    } else if ((m = s.match(/^create (?:unique )?index (\w+) on/i))) {
      add('index','public.'+m[1],tableCheck('public.'+m[1]));
    } else if ((m = s.match(/^alter table (public\.\w+)\s+([\s\S]*)/i))) {
      for (const a of m[2].matchAll(/\badd column (\w+)/gi)) col(m[1],a[1]);
      for (const a of m[2].matchAll(/\badd constraint (\w+)/gi)) add('constraint',m[1]+'.'+a[1],`exists(select 1 from pg_catalog.pg_constraint where conrelid=to_regclass(${lit(m[1])}) and conname=${lit(a[1])})`);
      if (/enable row level security/i.test(m[2])) add('rls',m[1],`coalesce((select relrowsecurity from pg_catalog.pg_class where oid=to_regclass(${lit(m[1])})),false)`);
      if (/force row level security/i.test(m[2])) add('forced-rls',m[1],`exists(select 1 from pg_catalog.pg_class c join pg_catalog.pg_policy p on p.polrelid=c.oid where c.oid=to_regclass(${lit(m[1])}) and c.relforcerowsecurity and p.polname='synera_owner_maintenance' and p.polroles=ARRAY[c.relowner]::oid[] and pg_get_expr(p.polqual,c.oid)='true' and pg_get_expr(p.polwithcheck,c.oid)='true')`);
    } else if ((m = s.match(/^revoke (\w+)\s*\(([^)]+)\) on (public\.\w+) from ([\s\S]+)$/i))) {
      for(const role of comma(m[4])) for(const c of comma(m[2])) add('grant',role+':'+m[1].toUpperCase()+':'+m[3]+'.'+c,role==='public' ? `not exists(select 1 from information_schema.column_privileges where grantee='PUBLIC' and table_schema='public' and table_name=${lit(m[3].split('.').at(-1))} and column_name=${lit(c)} and privilege_type=${lit(m[1].toUpperCase())})` : `not coalesce(${columnPrivilege(role,m[3],c,m[1])},false)`,{denied:true});
    } else if ((m = s.match(/^grant ([\s\S]+?) on (function )?([\s\S]+?) to ([\s\S]+)$/i))) {
      const roles = comma(m[4]);
      for (const obj of comma(m[3])) for (const role of roles) {
        if (m[2]) add('grant',role+':EXECUTE:'+obj,`coalesce(has_function_privilege(${lit(role)},${proc(obj)},'EXECUTE'),false)`);
        else if(m[3].startsWith('schema ')) add('grant',role+':'+m[1].toUpperCase()+':'+m[3],`has_schema_privilege(${lit(role)},${lit(m[3].slice(7))},${lit(m[1])})`);
        else for (const permission of comma(m[1])) {
          const p = permission.match(/^(\w+)(?:\s*\(([^)]+)\))?$/); if (!p) throw Error('Unsupported grant: '+s);
          if (p[2]) for (const c of comma(p[2])) add('grant',role+':'+p[1].toUpperCase()+':'+obj+'.'+c,`coalesce(${columnPrivilege(role,obj,c,p[1])},false)`);
          else add('grant',role+':'+p[1].toUpperCase()+':'+obj,`coalesce(has_table_privilege(${lit(role)},to_regclass(${lit(obj)}),${lit(p[1])}),false)`);
        }
      }
    }
  }
  return rows.filter((r,i) => rows.findIndex(x => x.kind===r.kind && x.object===r.object && x.body===r.body)===i);
}

export async function workerEnvironment(root, entry = 'neon/worker.mjs') {
  const sources = [], variables = new Map();
  async function visit(name) {
    if (sources.includes(name)) return; sources.push(name);
    const code = await fs.readFile(path.join(root,name),'utf8');
    if (/\benv\s*\[/.test(code) || /\{[^}\n]+\}\s*=\s*env\b/.test(code)) throw Error('Dynamic/destructured env reads need review: '+name);
    for (const m of code.matchAll(/\benv\.([A-Z][A-Z0-9_]*)/g)) variables.set(m[1],[...(variables.get(m[1])||[]),name]);
    for (const m of code.matchAll(/(?:import|export)\s+[^;]*?from\s*['"]([^'"]+)['"]/g)) {
      if (!m[1].startsWith('.')) throw Error('Worker external dependency needs review: '+m[1]);
      const child=slash(path.normalize(path.join(path.dirname(name),m[1]))); if (child.startsWith('../')) throw Error('Worker dependency escapes root'); await visit(child);
    }
  }
  await visit(entry);
  return {sources:sources.sort(),variables:[...variables].sort(([a],[b])=>a.localeCompare(b)).map(([name,uses])=>({name,sources:[...new Set(uses)].sort()}))};
}

export function validateUpload(files, allowlist) {
  if (files.length>1000) throw Error('Dashboard upload exceeds 1000 files');
  for (const {name,data} of files) {
    if (!allowlist.includes(name) || !/^[a-zA-Z0-9_./-]+(@[1-9]x\.[a-z0-9]+)?$/.test(name) || name.split('/').some(p=>!p || p==='.' || p==='..' || p.startsWith('.')) || /(?:\.map$|(?:^|[./-])(?:test|spec|env|secrets?)(?:[./-]|$)|\.sql$)/i.test(name)) throw Error('Unsafe upload path: '+name);
    if (data.length>25*1024*1024) throw Error('Upload file exceeds 25 MiB: '+name);
    const text=data.toString('utf8');
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@|\b(?:sk-or-v1-[a-f0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b|sourceMappingURL\s*=/.test(text)) throw Error('Secret or source map found in '+name);
  }
  if(new Set(files.map(f=>f.name)).size!==files.length) throw Error('Duplicate upload path');
}

const crcTable = Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function zip(files) {
  const local=[], central=[]; let offset=0;
  for(const {name,data} of files) {
    const filename=Buffer.from(name), compressed=deflateRawSync(data,{level:9});
    let crc=0xffffffff;for(const b of data)crc=crcTable[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
    const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(0x800,6);h.writeUInt16LE(8,8);h.writeUInt16LE(33,12);h.writeUInt32LE(crc,14);h.writeUInt32LE(compressed.length,18);h.writeUInt32LE(data.length,22);h.writeUInt16LE(filename.length,26);
    const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);h.copy(c,6,4,30);c.writeUInt32LE(offset,42);
    local.push(h,filename,compressed);central.push(c,filename);offset+=h.length+filename.length+compressed.length;
  }
  const directory=Buffer.concat(central), end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...local,directory,end]);
}

const checksSQL = rows => rows.map(r=>`select ${lit(r.source)} as migration, ${lit(r.kind)} as kind, ${lit(r.object)} as object, coalesce((${r.check}),false) as present`).join('\nunion all\n');
const has = rows => rows.map(r=>'coalesce(('+r.check+'),false)').join(' and ') || 'true';
function functionKnown(rows) {
  const groups=new Map();
  for(const r of rows.filter(r=>r.kind==='function')) groups.set(r.object,[...(groups.get(r.object)||[]),r]);
  const contract=r=>{
    const header=r.statement.split(/\bas\s+\$/i)[0];
    const settings=[...header.matchAll(/\bset\s+(\w+)\s*=\s*'([^']*)'/gi)].map(m=>m[1].toLowerCase()+'='+(m[2]||'""'));
    const definition=r.body===null ? "prosqlbody is not null and pg_get_functiondef(oid) like '%RETURN auth.uid()%'" : `btrim(replace(prosrc,chr(13),''),chr(9)||chr(10)||' ')=${lit(r.body.replaceAll('\r','').trim())}`;
    return `(${definition} and prosecdef=${/security definer/i.test(header)} and provolatile=${lit(/\bimmutable\b/i.test(header)?'i':/\bstable\b/i.test(header)?'s':'v')} and prolang=(select oid from pg_catalog.pg_language where lanname=${lit(header.match(/\blanguage\s+(\w+)/i)?.[1].toLowerCase())}) and coalesce(proconfig,'{}'::text[])=ARRAY[${settings.map(lit).join(',')}]::text[])`;
  };
  return [...groups].map(([signature,versions])=>`if ${proc(signature)} is not null and not exists(select 1 from pg_catalog.pg_proc where oid=${proc(signature)} and (${versions.map(contract).join(' or ')})) then raise exception 'Unknown function definition: ${signature}'; end if;`).join('\n');
}
function policyDefinitions(rows) {
  return rows.filter(r=>r.kind==='policy').map(r=>{
    const probe='__kit_policy_'+sha(r.object).slice(0,16);
    return r.statement.replace(/^create policy \w+/i,'CREATE POLICY '+probe)+`;\nDO $kit$ BEGIN\nif not exists(select 1 from pg_catalog.pg_policy a join pg_catalog.pg_policy b on a.polrelid=b.polrelid where a.polrelid=to_regclass(${lit(r.table)}) and a.polname=${lit(r.name)} and b.polname=${lit(probe)} and a.polcmd=b.polcmd and a.polpermissive=b.polpermissive and a.polroles=b.polroles and pg_get_expr(a.polqual,a.polrelid) is not distinct from pg_get_expr(b.polqual,b.polrelid) and pg_get_expr(a.polwithcheck,a.polrelid) is not distinct from pg_get_expr(b.polwithcheck,b.polrelid)) then raise exception 'Unknown policy definition: ${r.object}'; end if;\nEND $kit$;\nDROP POLICY ${probe} ON ${r.table};`;
  }).join('\n');
}
export function migrationSQL(base, migrations, allRows) {
  const baseline=base.filter(r=>['table','column','function','policy','rls','grant'].includes(r.kind));
  let sql=`-- Owner reviews project quiet-credit-94155104 / production in the console first.\n-- Source bodies are frozen; wrappers only skip complete known migrations.\n-- Copy the ENTIRE file into SQL Editor, never only the selected line.\nBEGIN;\nSET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='120s';\nSELECT pg_advisory_xact_lock(97720261029);\nDO $kit$ BEGIN\nif not (${has(baseline)}) then raise exception 'Baseline r8 objects missing; do not apply schema.proposal.sql to production'; end if;\n${functionKnown(allRows)}\nEND $kit$;\n`;
  const seen=new Set(base.map(r=>r.kind+':'+r.object));
  for(const migration of migrations) {
    const own=migration.rows.filter(r=>!['grant','rls','constraint'].includes(r.kind) && !seen.has(r.kind+':'+r.object));
    const marker=own.length?has(own):null;
    const body=splitSQL(migration.sql).filter(s=>! /^(begin|commit|rollback)$/i.test(s)).map(s=>s+';').join('\n');
    let condition;
    if(marker) condition=`if (${marker}) then\nraise notice 'Already complete: ${migration.name}';\nelsif (${own.map(r=>'not coalesce(('+r.check+'),false)').join(' and ')}) then\n${body}\nelse raise exception 'Partial or unexpected migration: ${migration.name}';\nend if;`;
    else {
      const fn=migration.rows.find(r=>r.kind==='function' && r.body!==null);
      if(!fn || migration.rows.some(r=>r.kind!=='function')) throw Error('Migration without a structural marker needs review: '+migration.name);
      condition=`if exists(select 1 from pg_catalog.pg_proc where oid=${proc(fn.object)} and btrim(prosrc)=btrim(${lit(fn.body)})) then raise notice 'Already complete: ${migration.name}'; else\n${body}\nend if;`;
    }
    sql+=`\n-- ${migration.name} sha256=${sha(migration.sql)}\nDO $kit$ BEGIN\n${condition}\nEND $kit$;\n`;
    for(const r of migration.rows)seen.add(r.kind+':'+r.object);
  }
  // Recheck every expected structural object and positive grant before committing any DDL.
  const final=[...new Map(allRows.map(r=>[r.kind+':'+r.object,r])).values()];
  sql+=`\n-- Compare parsed RLS definitions using transaction-local probes; remove every probe before commit.\n${policyDefinitions(final)}\nDO $kit$ BEGIN\nif not (${has(final)}) then raise exception 'Final catalog acceptance failed; all migrations roll back'; end if;\nEND $kit$;\nCOMMIT;\n\n-- Read-only post-commit catalog acceptance, explicitly rolled back.\n-- Original fixture suites are in 11-acceptance-disposable.sql, NEVER on production.\nBEGIN READ ONLY;\n${checksSQL(final)};\nROLLBACK;\n`;
  return sql;
}

function envValues(env,r8) {
  const values={ASSETS:['Pages automatic binding','Pages supplies the static asset service'],SYNERA_SITE_URL:['https://synera-pilot.pages.dev','same HTTPS origin'],SYNERA_NEON_AUTH_URL:['owner fills','copy current production Auth URL ending /neondb/auth; keep existing'],SYNERA_NEON_DATA_URL:['owner fills','copy current production Data API URL ending /neondb/rest/v1; same branch/database'],SYNERA_PILOT_EMAILS:['owner fills','exact owner email,<PARTNER_EMAIL>; private, 2 distinct addresses, 1–10 supported'],SYNERA_PILOT_READY:['true','only after SQL/backup/config checks'],SYNERA_REGISTRATION_ENABLED:['true','false during preparation; true for the two admitted people'],SYNERA_REAL_JOURNEY_READY:['true','only after SQL acceptance; enables terms and two-party confirmations'],SYNERA_CASE_OUTCOMES_READY:['true','only after outcome SQL acceptance'],SYNERA_MESSAGE_INTENTS_READY:['true','only after message-intent SQL acceptance'],SYNERA_MEETING_ADDRESS_READY:['true','only after address SQL acceptance'],SYNERA_OPEN_REGISTRATION:['false','MUST STAY OFF: two-person closed pilot'],SYNERA_GOOGLE_OAUTH_READY:['false','MUST STAY OFF until provider and callback configured and tested'],SYNERA_LOCATION_READY:['false','keep GPS OFF for this walk'],SYNERA_GROUP_ROOMS_READY:['false','keep rooms OFF for this walk'],SYNERA_PROFILE_ERASURE_READY:['false','keep erasure OFF until separate live acceptance'],SYNERA_COMPLETE_ERASURE_READY:['false','keep complete account erasure OFF until the identity-provider deletion (gate G7) is accepted live'],SYNERA_LOCATION_EPHEMERAL:['not required while GPS/open registration OFF','KV binding with get/put/delete, only if those features later enabled']};
  return {...env,variables:env.variables.map(r=>{if(!values[r.name])throw Error('New env binding requires an owner value: '+r.name);return {...r,value:values[r.name][0],instructions:values[r.name][1],r8:r.name==='ASSETS'?'automatic binding already used by r8 Pages Advanced mode':r8.includes('`'+r.name+'`')?'documented in r8 launch instructions; current dashboard value UNVERIFIED':'new since documented r8; current dashboard presence UNVERIFIED'};})};
}

function checklist(commit,filename,env) {
  return `# Двоє людей: закритий пілот, до 30 хв після підготовки\n\nКомплект ${commit}. Завантажувати лише \`${filename}\`. Нічого тут не запускає cloud API.\nЧас нижче — план, не виміряна тривалість. SQL і реальні телефони власник ще не прийняв.\n\n## Перед стартом (обов'язково; якщо бракує — HOLD)\n\n- Власник має доступ до двох кабінетів, дві різні email-адреси й два фізичні телефони.\n- Neon: project **quiet-credit-94155104**, branch **production**, database **neondb**, AWS **us-east-2 (Ohio, США)**. Не створюй новий project.\n- Збережи ID/URL останнього справного production deployment r8 і всі попередні environment values ПРИВАТНО. Не вставляй їх у git/чат.\n- Neon: перевір наявну точку відновлення/backup і restore у disposable branch. Кнопки/доступність recovery залежать від акаунта; якщо restore не перевірений — зупинись. Це підготовка, не обіцянка 30 хв з нуля.\n- Прочитай \`env.md\`, \`changes-since-r8.uk.md\`, \`rollback.md\`. До SQL закрий нові входи: SYNERA_REGISTRATION_ENABLED=false, Google/open registration=false.\n\n## Власник: порядок 0–30 хв\n\n1. **0–3 хв — інспекція.** Neon console → project synera → Branch production → **SQL Editor** → database neondb, owner role → встав увесь \`00-inspect.sql\` → Run. Один рядок на очікуваний об'єкт; present=true/false. Відсутні нові об'єкти допустимі, відсутні базові r8 або часткова міграція — HOLD. Збережи результат локально. Не запускай базовий schema.proposal.sql вдруге.\n2. **3–7 хв — SQL.** Звір локальний receipt ../postgres-acceptance.json зі звітом лінії та manifest.json: source_commit і SHA 10-migrate/11-acceptance мають збігатися. Fixture suites вже перевірені локально з identity shim; на production їх не запускай. Якщо є підготовлений disposable clone, спершу виконай на ньому лише 10-migrate.sql. Якщо backup/restore ще не перевірені, відклади 30-хв вікно. Потім у production SQL Editor виконай увесь \`10-migrate.sql\`. Успіх: COMMIT і всі фінальні present=true; повторний запуск пропускає повні міграції. Помилка означає STOP: не запускай хвіст файлу окремо, виконай ROLLBACK за потреби.\n3. **7–9 хв — один партнер.** Відкрий \`20-add-member.sql\`, заміни <PARTNER_EMAIL> лише локально на адресу партнера малими літерами, виконай увесь файл у production. Успіх: admitted=true. Власник уже має свій допуск r8; якщо ні, HOLD для окремого owner review. Не вставляй вигаданих Demo-людей.\n4. **9–12 хв — environment.** Cloudflare dashboard → **Workers & Pages → synera-pilot → Settings → Variables and Secrets / Environment variables → Production**. Запиши попередні значення; вистав \`env.md\`. Список SYNERA_PILOT_EMAILS = попередня адреса власника + адреса партнера. URL Neon збережи чинними. Поки SYNERA_REGISTRATION_ENABLED=false. Google/open registration/GPS/rooms/erasure=false. Нові значення застосуються до НОВОГО deployment; вони не перемикають уже активний Worker.\n5. **12–15 хв — ZIP.** Pages → **synera-pilot → Deployments → Create a new deployment / Upload → Production** → перетягни \`${filename}\` → Save and Deploy. Не Create application, не новий project. ZIP має _worker.js та index.html у корені; не завантажуй усю теку kit. Успіх: новий production deployment Success. Зафіксуй його ID. Dashboard підтримує _worker.js, але не компілює functions/.\n6. **15–17 хв — read-only перевірка.** Відкрий https://synera-pilot.pages.dev/release.json у приватній вкладці: built_at=${commit ? 'час commit (див. manifest.json)' : ''}, звір _worker.js sha256 з manifest.json (це відрізняє старий Worker). https://synera-pilot.pages.dev/config.json: backend=neon, realPilotEnabled=true, realJourneyEnabled=true, messageIntentsEnabled=true, caseOutcomesEnabled=true, meetingAddressEnabled=true, registrationEnabled=false; googleOAuthEnabled/liveLocationEnabled/groupRoomsEnabled/profileErasureEnabled=false. Перевір health у DevTools Console НА цьому origin готовим GET нижче. Має бути HTTP 200, backend=neon, authGateway=reachable. Це перевіряє Auth gateway, не RLS/схему.\n7. **17–19 хв — відкрити вхід лише двом.** Приймай це лише після SQL/config/health перевірок; телефони A/B — наступний живий gate. Settings → Environment variables: SYNERA_REGISTRATION_ENABLED=true. Повторно Upload того самого ZIP у Production (env застосовується при deployment). /config.json тепер registrationEnabled=true; інші очікування кроку 6 зберігаються. Не підміняй SYNERA_OPEN_REGISTRATION.\n8. **19–22 хв — телефони A і B.** На кожному Safari/iPhone або Chrome/Android відкрий https://synera-pilot.pages.dev/; закрий стару PWA/вкладку, онови, за потреби очисти дані саме цього сайту (локальні чернетки спершу збережи). Звір новий темний із золотим дизайн. Прочитай правила/дані, постав обидві згоди, введи СВОЮ адресу, отримай новий 6-значний код. Код не пересилай іншій людині. Після входу збережи власний профіль, онови сторінку: має повернутися саме твій профіль. Для видимості партнера кожен окремо свідомо вмикає discoverable; GPS не потрібен. Не використовуй Demo для реального шляху.\n9. **22–27 хв — спільний шлях.** Відкрий https://synera-pilot.pages.dev/real-journey.html (Pages може прибрати .html). Вибери видимий профіль партнера. Спочатку узгодьте конкретні умови й створіть справу; кожна людина підтверджує ТУ САМУ версію окремо зі свого телефона. Після першої згоди друга лишається очікуваною. Потім надішли запрошення на зустріч, одержувач приймає на B; A не може прийняти за B. Порядок даних у чинному SQL: умови → дві згоди → запрошення/зустріч (не навпаки). Адреса, якщо потрібна, має окрему пропозицію/згоду; для швидкого проходу оберіть онлайн.\n10. **27–30 хв — результат і межі.** Виконайте малий справжній результат, наприклад взаємний огляд одного екрана. Автор додає результат, лише одержувач перевіряє й приймає його; автор не приймає власну роботу. Онови обидва телефони: умови, незалежні згоди, зустріч і прийнятий результат збереглися. Вийди на одному телефоні: інший лишається своїм користувачем. Без входу приватний шлях недоступний; чужий прихований профіль/повідомлення не читаються. До цих перевірок статус LIVE_TWO_PERSON=HOLD.\n\nHealth GET (не вставляй коди/токени; пряме відкриття health у адресному рядку дає 403 без службового заголовка):\n\n\`\`\`js\nconst r = await fetch('/api/neon/health', {headers:{'X-Synera-Client':'1'}});\nconsole.log(r.status, await r.json());\n\`\`\`\n\n## ROLLBACK — ціль 2 хв для Worker\n\n1. Pages → synera-pilot → Deployments → All deployments → **…** біля ЗБЕРЕЖЕНОГО попереднього production ID → **Rollback to this deployment** → Confirm. Preview не є rollback target.\n2. /release.json та /config.json мають збігатися зі збереженим r8. Вийди з нової PWA/онови дані сайту на обох телефонах; service worker старої вкладки може показувати кеш.\n3. Поверни збережені environment values для майбутніх deployment. Rollback deployment не означає видалення SQL/акаунтів. Для видалення саме нового admission: \`21-remove-member.sql\` і прибери тільки партнера із SYNERA_PILOT_EMAILS у НАСТУПНОМУ deployment. Старий r8 не має цього партнера у своєму env.\n4. **Не DROP нові таблиці після використання.** Additive SQL лишається; raw down statements у \`rollback.md\` — лише для disposable clone або restore в перевірену точку за окремим рішенням власника. Відкат даних не має доведеної межі 2 хв.\n\nДжерела UI/лімітів: [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Cloudflare Rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/). Новий suite/receipt не є доказом живого проходу чи часу власника.\n`;
}

export async function generateKit({root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'docs/deploy-kit-20261029/kit'),audience='closed-pilot',readiness=DEFAULT_READINESS}={}) {
  root=path.resolve(root);out=path.resolve(out);
  const allowed=path.join(root,'docs/deploy-kit-20261029');
  if(!out.startsWith(allowed+path.sep))throw Error('Output must be inside docs/deploy-kit-20261029/');
  for(let candidate=out;candidate!==root;candidate=path.dirname(candidate)) {
    try {if((await fs.lstat(candidate)).isSymbolicLink())throw Error('Output path contains a symlink/junction: '+candidate);}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  await fs.mkdir(out,{recursive:true});
  const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
  const commit=git('rev-parse','HEAD'),epoch=git('show','-s','--format=%cI','HEAD');
  const {PUBLIC_ASSETS}=await import(pathToFileURL(path.join(root,'web_launch/assets.mjs')).href+'?kit='+Date.now());
  const env=envValues(await workerEnvironment(root),await fs.readFile(path.join(root,'docs/NEON_LAUNCH.uk.md'),'utf8'));
  const inputs=[...new Set(['neon/build.mjs','web_launch/assets.mjs',...env.sources,...Object.keys(PUBLIC_ASSETS).map(n=>'web_launch/'+n)])].sort();
  for(const name of inputs)if(!/^(neon|web_launch)\/[\w./-]+(@[1-9]x\.[a-z0-9]+)?$/.test(name)||name.includes('..'))throw Error('Unsafe build input '+name);
  const changed=git('diff','HEAD','--name-only','--',...inputs);if(changed)throw Error('Commit-named kit requires clean build inputs: '+changed);
  const source=[];for(const name of inputs)source.push({name,sha256:sha(await fs.readFile(path.join(root,name)))});
  await fs.mkdir(path.join(root,'tmp'),{recursive:true});
  const scratch=await fs.mkdtemp(path.join(root,'tmp/kit-build-'));let files;
  try {
    for(const name of inputs){const dest=path.join(scratch,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(path.join(root,name),dest);}
    const clock=path.join(scratch,'clock.cjs');await fs.writeFile(clock,`const NativeDate=Date;global.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[${JSON.stringify(epoch)}]));}static now(){return new NativeDate(${JSON.stringify(epoch)}).valueOf();}};`);
    execFileSync(process.execPath,['--require',clock,path.join(scratch,'neon/build.mjs'),'dist-neon-kit'],{cwd:scratch,stdio:'pipe'});
    const dist=path.join(scratch,'web_launch/dist-neon-kit');
    files=await Promise.all((await fs.readdir(dist)).sort().map(async name=>({name,data:await fs.readFile(path.join(dist,name))})));
  } finally {await fs.rm(scratch,{recursive:true,force:true});}
  validateUpload(files,[...Object.keys(PUBLIC_ASSETS),'_worker.js','_routes.json','release.json']);
  const names=(await fs.readdir(path.join(root,'neon'))).filter(n=>n.endsWith('.migration.sql')).sort();
  if(json(names)!==json(ORDER.map(n=>n+'.migration.sql').sort()))throw Error('Migration set changed; review dependency order before packaging');
  const sqlSource=new Map();
  const read=async name=>{const bytes=await fs.readFile(path.join(root,'neon',name));sqlSource.set('neon/'+name,sha(bytes));return bytes.toString('utf8').replaceAll('\r\n','\n');};
  const baseline=await read('schema.proposal.sql'),base=migrationInventory('schema.proposal.sql',baseline),migrations=[];
  for(const prefix of ORDER){const name=prefix+'.migration.sql',sql=await read(name);migrations.push({name,sql,rows:migrationInventory(name,sql)});}
  const allRows=[...base,...migrations.flatMap(m=>m.rows)];
  const zipName='synera-pilot-'+commit+'.zip',zipBytes=zip(files),artifacts=new Map();
  artifacts.set(zipName,zipBytes);
  artifacts.set('00-inspect.sql','-- Read-only catalog inventory. false means absent; never reads member emails or private rows.\n'+checksSQL(allRows)+'\norder by migration,kind,object;\n');
  artifacts.set('10-migrate.sql',migrationSQL(base,migrations,allRows));
  const member=`DO $member$ DECLARE partner_email text := lower(btrim('<PARTNER_EMAIL>')); BEGIN\nif partner_email='<partner_email>' or partner_email !~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$' then raise exception 'Replace PARTNER_EMAIL locally'; end if;\nif to_regclass('public.synera_pilot_members') is null then raise exception 'Admission schema missing'; end if;\nif exists(select 1 from neon_auth."user" u join public.profile_erasures e on e.user_id=u.id where lower(u.email)=partner_email) then raise exception 'Partner has an erasure tombstone; do not bypass'; end if;\ninsert into public.synera_pilot_members(email) values(partner_email) on conflict do nothing;\nEND $member$;`;
  artifacts.set('20-add-member.sql',`-- ONE email only. Keep the owner's existing row. Do not commit the filled file.\nBEGIN;\n${member}\nselect exists(select 1 from public.synera_pilot_members where email=lower(btrim('<PARTNER_EMAIL>'))) as admitted;\nCOMMIT;\n-- Removal is separate: 21-remove-member.sql.\n`);
  artifacts.set('21-remove-member.sql',`-- Remove only the new partner admission, not Auth, profiles or the owner's row.\nBEGIN;\nDO $member$ BEGIN if '<PARTNER_EMAIL>' like '<%' then raise exception 'Replace PARTNER_EMAIL locally'; end if; END $member$;\nDELETE FROM public.synera_pilot_members WHERE email=lower(btrim('<PARTNER_EMAIL>'));\nCOMMIT;\n`);
  // Source suites explicitly forbid production and some require runner-supplied fixtures.
  // Keep that authority: a disposable replay exercises each historical stack, not live Auth tables.
  const acceptanceNames=(await fs.readdir(path.join(root,'neon'))).filter(n=>n.endsWith('.acceptance.sql')||n==='acceptance.sql').sort();
  const acceptance=await Promise.all(acceptanceNames.map(async name=>({name,sql:await read(name)})));
  let replay=`-- DISPOSABLE EMPTY database/branch ONLY. Never run on production.\n-- Refuses any existing product table. A local identity shim is supplied by tests, never by production SQL.\nBEGIN;\nDO $replay$ BEGIN if to_regclass('public.profiles') is not null then raise exception 'Disposable EMPTY database required'; end if; END $replay$;\n`;
  const body=sql=>splitSQL(sql).filter(s=>! /^(begin|commit|rollback)$/i.test(s)).map(s=>s+';').join('\n');
  const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
  const {exchangeMaterial}=await import(pathToFileURL(path.join(root,'web_launch/real-journey-client.mjs')).href);
  const {hashMaterialPayload}=await import(pathToFileURL(path.join(root,'web_launch/business-case.mjs')).href);
  const day=n=>new Date(Date.parse(epoch)+n*86400000).toISOString().slice(0,10);
  const material=exchangeMaterial(A,B,{starts_on:day(1),due_on:day(7),give_tag:'automation',take_tag:'design',give_target:'One working prototype',take_target:'One reviewed screen',give_criteria:'Opens the agreed screen',take_criteria:'Both reviewed on their own phone',compensation_status:'agreed_exchange',revision_limit:'1',confidentiality:'required',intellectual_property:'shared',cancellation:'mutual_written_notice'});
  const termsHash=await hashMaterialPayload(material),revised=structuredClone(material);revised.trial.deliverables[0].target+=' revised';
  const revisedHash=await hashMaterialPayload(revised);
  const fixture=body(acceptance.find(a=>a.name==='case-state.acceptance.sql').sql.split('set local role authenticated;')[0]);
  const session=id=>`SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims',${lit(JSON.stringify({sub:id,role:'authenticated'}))},true);\n`;
  const seedCase=id=>session(A)+`insert into public.match_cases(case_id,participant_low,participant_high,mode,material,terms_hash,expires_at) values(${lit(id)},'${A}','${B}','exchange',${lit(JSON.stringify(material))}::jsonb,'${termsHash}',now()+interval '14 days');\nRESET ROLE;\n`;
  const approvals=id=>[A,B].map(actor=>session(actor)+`insert into public.match_case_approvals(case_id,party_id,approved_version,approved_terms_hash) values(${lit(id)},'${actor}',1,'${termsHash}');\nRESET ROLE;\n`).join('');
  const meeting=id=>`select set_config('request.jwt.claims',${lit(JSON.stringify({sub:A,role:'authenticated'}))},true);\ninsert into public.meeting_requests(id,sender_id,recipient_id,note,status,proposed_at,duration_minutes,meeting_place) values('${id}','${A}','${B}','Disposable agreed exchange','accepted',now()+interval '1 day',30,'Zürich');\n`;
  const suite=(sql,seed='')=>`SAVEPOINT fixtures;\nSELECT set_config('request.jwt.claims','{}',true);\n${seed}\n${body(sql)}\nRESET ROLE;\nROLLBACK TO SAVEPOINT fixtures;\nRELEASE SAVEPOINT fixtures;\n`;
  replay+=body(baseline)+'\n';
  replay+=suite(acceptance.find(a=>a.name==='acceptance.sql').sql);
  // Roll back the fixtures at each stage; retain DDL only until the final outer ROLLBACK.
  for(const m of migrations) {
    replay+='\n-- '+m.name+'\n'+body(m.sql)+'\n';
    const matching=acceptance.find(a=>a.name===m.name.replace('.migration.sql','.acceptance.sql'));
    if(matching && ['case-state','meeting-status-guard','meeting-location','group-room'].some(p=>m.name===p+'.migration.sql')) replay+=suite(matching.sql);
    if(m.name==='case-outcome.migration.sql') replay+=suite(matching.sql,fixture+seedCase('case-outcome-ab'));
    if(m.name==='meeting-address-agreement.migration.sql') replay+=suite(matching.sql,fixture+seedCase('case-address-ab')+approvals('case-address-ab')+meeting('44444444-4444-4444-8444-444444444444')+`select set_config('synera.revised_material',${lit(JSON.stringify(revised))},true); select set_config('synera.revised_hash','${revisedHash}',true);\n`);
    if(m.name==='message-intent.migration.sql') replay+=suite(acceptance.find(a=>a.name==='message-intent-consent.acceptance.sql').sql,fixture+seedCase('message-ab')+approvals('message-ab')+meeting('44444444-4444-4444-8444-444444444444')+session(A)+`select public.synera_send_message('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-123456789012','Retained fixture message');\nRESET ROLE;\n`);
    if(m.name==='profile-erasure.migration.sql') {
      const seed=fixture+seedCase('erase-ab')+approvals('erase-ab')+meeting('44444444-4444-4444-8444-444444444444')+session(A)+`select public.synera_room_create('Disposable room','A shared review',array['${B}'::uuid]); select public.synera_send_message('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-123456789012','Retained fixture message'); select public.synera_erase_profile_data();\nRESET ROLE;\n`;
      replay+=suite(acceptance.find(a=>a.name==='profile-erasure-surfaces.acceptance.sql').sql+'\n'+body(acceptance.find(a=>a.name==='profile-erasure-lifecycle.acceptance.sql').sql),seed);
    }
  }
  replay+=`SAVEPOINT fixtures;\n${body(acceptance.find(a=>a.name==='stack-invariants.acceptance.sql').sql)}\nRESET ROLE;\nROLLBACK TO SAVEPOINT fixtures;\nROLLBACK;\n`;
  artifacts.set('11-acceptance-disposable.sql',replay);
  // Bundle every original as data, with SHA in manifest; no fixture suite is silently labelled run.
  artifacts.set('acceptance-sources.json',json(acceptance.map(a=>({name:a.name,sha256:sqlSource.get('neon/'+a.name),normalized_sha256:sha(a.sql),sql:a.sql,execution:'DISPOSABLE_ONLY; all source suites included in 11-acceptance-disposable.sql with runner-shaped fixtures; never production'}))));
  artifacts.set('env.json',json(env));
  artifacts.set('env.md',`# Production environment — ${commit}\n\nOnly exact string true enables a flag. Current dashboard values were NOT read. No credentials are bundled.\n\n| Name / binding | Value for this walk | r8 evidence | Instructions |\n|---|---|---|---|\n${env.variables.map(v=>`| \`${v.name}\` | ${v.value} | ${v.r8} | ${v.instructions} |`).join('\n')}\n\nClosed OTP does not need KV. ASSETS is automatic in Pages Advanced mode; do not create a secret called ASSETS. No Google client secret belongs in this Worker. URLs and member emails stay in the owner's dashboard, outside git. New variables require a new deployment to take effect.\n\nWorker source closure: ${env.sources.map(s=>'`'+s+'`').join(', ')}.\n`);
  artifacts.set('CHECKLIST.uk.md',checklist(commit,zipName,env));
  artifacts.set('changes-since-r8.uk.md',`# Що побачить партнер після r8 (06.09 → цей checkout)\n\n| Зміна | Що видно | Ризик / перевірка | Джерело |\n|---|---|---|---|\n| Новий спільний shell, темний із золотим дизайн, власні акценти | Головна, профіль, Studio/Summit/Triangle | Стара PWA може тримати кеш; оновити на двох телефонах | web_launch/assets.mjs, style-switcher.mjs, adaptive.mjs |\n| Реальна справа і незалежні згоди | Узгоджені умови, дві окремі згоди до запрошення | Старі pending-запрошення тепер потребують чинних згод; автор не приймає за адресата | case-state, meeting-status-guard |\n| Результат роботи | Автор подає, одержувач перевіряє/приймає | Не платіж і не автоматичне підтвердження чужою людиною | case-outcome |\n| Узгоджена адреса | Окрема пропозиція й підтвердження адреси | GPS залишається вимкнений; онлайн достатньо для проходу | meeting-address-agreement |\n| Повтор надсилання повідомлення | Стабільний intent замість дублювання | Потребує RPC/грантів, два сеанси | message-intent |\n| Demo, simulation, Summit/Studio/Triangle | Демонстраційні екрани окремо від реальних людей | Demo не є доказом збереження, AI чи реальних акаунтів | web_launch/assets.mjs |\n| Open registration, Google, GPS, rooms, erasure | Закриті перемикачами цього kit | Не вмикати для цього проходу | neon/worker.mjs та imports |\n\nЦе карта вихідного коду відносно описаного r8, не побайтний diff із живим deployment: його повний source snapshot тут відсутній. Комплект перегенерується після merge; перевір commit у manifest.json.\n`);
  artifacts.set('rollback.md',`# Rollback\n\nFast route: Pages → synera-pilot → Deployments → … on the saved previous PRODUCTION deployment → Rollback to this deployment. Restore saved environment values for future uploads. Do not assume SQL rolled back. No tested 2-minute database restore is claimed.\n\nAdmission down: run 21-remove-member.sql with ONLY the partner email and remove that address from the next deployment's SYNERA_PILOT_EMAILS. Does not revoke provider sessions directly.\n\nSchema down: source migrations have no reviewed lossless down scripts. New tables can hold shared agreements and results. Production must retain additive tables or use the owner's verified recovery point; never execute destructive DROP automatically.\n\nFor an EMPTY disposable replay only, the entire 11-acceptance-disposable.sql ends ROLLBACK: this is its complete SQL down statement. On a failed migration transaction use ROLLBACK; no DDL in 10-migrate.sql commits before its final catalog gate.\n\n\`\`\`sql\n-- Current failed/uncommitted migration/replay only:\nROLLBACK;\n-- Partner admission only (filled locally):\nBEGIN;\nDELETE FROM public.synera_pilot_members WHERE email=lower(btrim('<PARTNER_EMAIL>'));\nCOMMIT;\n\`\`\`\n\nDo not replace functions with old bodies after new data was written. A successful Pages rollback proves routing to that deployment, not restored database state or emptied phone caches.\n`);
  artifacts.set('README.uk.md',`# Комплект власника\n\n1. Почни з CHECKLIST.uk.md. Нічого не застосовано й не опубліковано.\n2. 00-inspect.sql — лише каталоги; 10-migrate.sql — атомарний conditional apply відсутніх повних відомих міграцій. Невідомі function body/атрибути, RLS policy definition, частковий marker або відсутня база r8 — RAISE і rollback усіх DDL. Повторний apply пропускає завершені міграції. RLS probes створюються й видаляються всередині тієї самої транзакції; назовні вони не публікуються. Історичний GRANT meeting_address після нової міграції навмисно відсутній; фінальна перевірка враховує REVOKE.\n3. 11-acceptance-disposable.sql — **лише EMPTY disposable database** з сумісними provider identity fixtures; створює базу/міграції тимчасово й закінчується ROLLBACK. Усі 11 вихідних suites включені: base, case-state, meeting-status-guard, meeting-location, group-room, outcome, address, message consent, erasure surfaces/lifecycle, stack-invariants. Fixtures outcome/address/message/erasure відтворюють контракти наявних JS runners. Кожний набір відкочується до SAVEPOINT; фінальний ROLLBACK прибирає весь replay.\n4. Локальний PostgreSQL тест використовує **identity shim** з neon/local_acceptance.mjs. Це не signed JWT і не перевірка живого Neon. У Neon SQL Editor не підміняй auth.uid() і не запускай fixture suite на production. Якщо справжній disposable Neon не підтримує fixture JWT context, це HOLD саме для цього replay; локальне приймання не дозволяє підміняти provider identity. Production-файл має окремі catalog/definition/grant checks; реальні OTP, RLS і сценарій приймаються з двох телефонів.\n5. acceptance-sources.json зберігає всі вихідні suites і SHA оригінальних байтів та нормалізованого SQL (лише CRLF → LF). manifest.json містить commit, вихідні SHA, ZIP SHA/size, кожний upload file та SHA артефактів. ZIP = PUBLIC_ASSETS + _worker.js + _routes.json + release.json, без SQL/docs/tests/maps. Незмінений neon/build.mjs виконується в sandbox; лише Date для release.json фіксується на час commit. Окремий тест запускає canonical build без цього hook і порівнює всі файли після нормалізації тільки built_at.\n6. Межі: 30 хв — сценарій ПІСЛЯ account/backup/restore/local acceptance gates; 2 хв — ціль Worker rollback, не гарантія DB restore. Lossless schema-down джерелами не визначено: production зберігає additive SQL або відновлюється з перевіреної точки за окремим рішенням власника. Після merge перегенеруй kit з чистих build inputs; новий невідомий env/migration зупиняє generator для review.\n`);
  const manifest={format:1,commit,build_time:epoch,build:'neon/build.mjs (unchanged; Date fixed to commit time)',published:false,live_two_person:'HOLD',source,zip:{name:zipName,bytes:zipBytes.length,sha256:sha(zipBytes)},limits:{max_files:1000,max_file_bytes:25*1024*1024},files:files.map(({name,data})=>({name,bytes:data.length,sha256:sha(data)})),sql:[...sqlSource].sort(([a],[b])=>a.localeCompare(b)).map(([name,sha256])=>({name,sha256})),artifacts:[...artifacts].map(([name,data])=>({name,bytes:Buffer.byteLength(data),sha256:sha(data)}))};
  // Detect concurrent edits before claiming a source-bound kit.
  for(const row of source)if(sha(await fs.readFile(path.join(root,row.name)))!==row.sha256)throw Error('Source changed during build: '+row.name);
  for(const [name,hash] of sqlSource)if(sha(await fs.readFile(path.join(root,name)))!==hash)throw Error('SQL source changed during build: '+name);
  if(git('rev-parse','HEAD')!==commit)throw Error('HEAD changed during build');
  artifacts.set('env.md', artifacts.get('env.md') + '\n## Worker invocation logs\n\nIn the owner-reviewed Wrangler configuration set:\n\n```toml\n[observability.logs]\ninvocation_logs = false\n```\n\nInvocation logs may contain request URLs. For dashboard-uploaded Pages, verify the equivalent platform setting and read back after deployment. This kit does not apply a Wrangler file or change the dashboard. Keep custom logs sanitised; this is not a separate DSV Art.4 audit archive.\n');
  manifest.artifacts=[...artifacts].map(([name,data])=>({name,bytes:Buffer.byteLength(data),sha256:sha(data)}));
  await writeKitArtifacts({out,artifacts,manifest,audience,readiness});
  return {commit,out,files:files.length,zip:manifest.zip,buildComparison:true,published:false};
}

// LAST release step: no ZIP or manifest is written until the audience gate passes.
export async function writeKitArtifacts({out,artifacts,manifest,audience='closed-pilot',readiness=DEFAULT_READINESS}) {
  const gate=await readPrivacyGate(readiness,audience);
  for(const [name,data] of artifacts)await fs.writeFile(path.join(out,name),data);
  await fs.writeFile(path.join(out,'manifest.json'),json({...manifest,release_audience:audience,privacy_gate:gate}));
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const options={},args=process.argv.slice(2);
    for(let i=0;i<args.length;i+=2) {
      const key={'--out':'out','--audience':'audience','--readiness':'readiness'}[args[i]];
      if(!key || !args[i+1] || Object.hasOwn(options,key))throw Error('Usage: node tools/pilot-deploy-kit.mjs [--out path] [--audience closed-pilot|open-registration] [--readiness path]');
      options[key]=args[i+1];
    }
    console.log(json(await generateKit(options)));
  }
  catch(error){console.error(error.message);process.exitCode=1;}
}
