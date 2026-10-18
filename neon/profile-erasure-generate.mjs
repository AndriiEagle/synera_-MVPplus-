// Preserve the applied outcome migration. Derive its exact reviewed replacement in the new erasure migration.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export function profileErasureOutcomeGuard(source) {
  const hash=createHash('sha256').update(source).digest('hex');
  if(hash!=='5cd6a796b2abe15c01661074e192cc8d0e3de860ca1883855e10a5f5a7073ef6')throw Error('Outcome source changed; review erasure guard derivation');
  const original=source.match(/^create function public\.synera_case_outcome\(p_case_id text,p_payload jsonb\)[\s\S]*?^end \$\$;/m)?.[0];
  const lock='  select * into c from public.match_cases where case_id=p_case_id for update;';
  if(!original||original.split(lock).length!==2)throw Error('Outcome locking contract changed');
  const lockAt=original.indexOf(lock),checkedAt=original.indexOf('  end if;',lockAt)+'  end if;'.length;
  if(checkedAt<lockAt||!original.slice(lockAt,checkedAt).includes("raise exception 'Outcome unavailable'"))throw Error('Outcome case authorization changed');
  const guard=`
  -- Hold the actor profile through the whole RPC: erasure must serialize with this operation.
  -- Recheck AFTER waits. A membership check before a case lock cannot fence a delayed request.
  perform 1 from public.profiles where id=actor for share;
  if not found or public.synera_pilot_member() is not true then
    raise exception 'Outcome unavailable' using errcode='42501';
  end if;`;
  return '-- Derived from neon/case-outcome.migration.sql; original applied source is preserved.\n'+
    '-- Source SHA256='+hash+'\n'+(original.slice(0,checkedAt)+guard+original.slice(checkedAt)).replace('create function','create or replace function');
}
const begin='-- PROFILE-ERASURE-OUTCOME-GUARD-BEGIN',end='-- PROFILE-ERASURE-OUTCOME-GUARD-END';
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const target=new URL('./profile-erasure.migration.sql',import.meta.url);
  const [source,sql]=await Promise.all([fs.readFile(new URL('./case-outcome.migration.sql',import.meta.url),'utf8'),fs.readFile(target,'utf8')]);
  const from=sql.indexOf(begin),to=sql.indexOf(end);if(from<0||to<from)throw Error('Erasure guard markers missing');
  await fs.writeFile(target,sql.slice(0,from)+begin+'\n'+profileErasureOutcomeGuard(source)+'\n'+sql.slice(to));
}
