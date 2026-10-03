// Review a private clone with the real provider identity boundary. Never replace Auth.
// All schema, grants and synthetic fixtures stay inside one ROLLBACK transaction.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const migrations = ['case-state.migration.sql', 'meeting-location.migration.sql', 'group-room.migration.sql'];
const acceptances = ['case-state.acceptance.sql', 'meeting-location.acceptance.sql', 'group-room.acceptance.sql'];
export async function buildReviewTransaction() {
  const hashes = {}, chunks = [];
  for (const name of [...migrations, ...acceptances]) {
    const text = await fs.readFile(new URL('../neon/' + name, import.meta.url), 'utf8');
    hashes['neon/' + name] = createHash('sha256').update(text).digest('hex');
    if (!/^begin;$/m.test(text) || !/\b(commit|rollback);\s*$/i.test(text)) throw new Error('Transaction boundary missing: ' + name);
    const body = text.replace(/^begin;\s*$/m, '').replace(/\b(commit|rollback);\s*$/i, '');
    if (migrations.includes(name)) chunks.push(body);
    else {
      const point = 'fixture_' + acceptances.indexOf(name);
      chunks.push('savepoint ' + point + ';\n' + body + '\nrollback to savepoint ' + point + ';\nrelease savepoint ' + point + ';');
    }
  }
  const sql = `-- ONLY private review branch br-quiet-pond-axw377pp; production is excluded.
-- SQL role/claims acceptance, not signed JWT or mobile account acceptance.
begin;
set local statement_timeout='30s';
do $$ begin
  if current_database()<>'neondb' then raise exception 'Wrong review database'; end if;
  if to_regclass('public.match_cases') is not null or to_regclass('public.meeting_location_grants') is not null or to_regclass('public.group_rooms') is not null then raise exception 'Review requires the inspected base clone'; end if;
  if exists(select 1 from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444')) then raise exception 'Fixture identity collision: preserve existing account'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin if public.synera_user_id() is distinct from '11111111-1111-4111-8111-111111111111'::uuid then raise exception 'Provider identity is not available to SQL claims fixture; no shim allowed'; end if; end $$;
reset role;
${chunks.join('\n')}
select 'PASS: case, bilateral project, location and group SQL/RLS on isolated review branch; schema and fixtures will be rolled back' as review_result;
rollback;
select jsonb_build_object('cases_absent',to_regclass('public.match_cases') is null,'locations_absent',to_regclass('public.meeting_location_grants') is null,'rooms_absent',to_regclass('public.group_rooms') is null,'fixture_users_left',(select count(*) from neon_auth."user" where id in ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'))) as rollback_readback;
`;
  return { sql, source_sha256: hashes, sql_sha256: createHash('sha256').update(sql).digest('hex') };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await buildReviewTransaction();
  const dir = new URL('../artifacts/product-completion-20261003/', import.meta.url);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(new URL('NEON_REVIEW_TRANSACTION.sql', dir), result.sql);
  await fs.writeFile(new URL('NEON_REVIEW_SOURCES.json', dir), JSON.stringify({ scope: 'Prepared only; not executed', source_sha256: result.source_sha256, sql_sha256: result.sql_sha256 }, null, 2));
  console.log(JSON.stringify({ prepared: true, sql_sha256: result.sql_sha256, migrations: migrations.length, acceptance_suites: acceptances.length, production_excluded: true }));
}
