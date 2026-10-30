import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runOps, transactionBlocks, loadOwnerEnv } from './pilot-ops.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const auth = 'https://ep-example.neonauth.us-east-2.aws.neon.tech/neondb/auth';
const data = auth.replace('.neonauth.', '.apirest.').replace('/auth', '/rest/v1');
const env = { CLOUDFLARE_API_TOKEN:'cf-private-value', NEON_API_KEY:'neon-private-value',
  GOOGLE_OAUTH_CLIENT_ID:'123.apps.googleusercontent.com', GOOGLE_OAUTH_CLIENT_SECRET:'google-private-value',
  SYNERA_PILOT_EMAILS:'owner@example.com,partner@example.com', OPENROUTER_API_KEY:'or-private-value',
  SYNERA_LIVE_AI_HMAC_SECRET:'h'.repeat(64), SYNERA_OPERATOR_TOKEN:'t'.repeat(64) };
const inventory = [{migration:'schema.proposal.sql', kind:'table', object:'public.profiles', present:true}];
const kit = {
  '00-inspect.sql':"select 'schema.proposal.sql' as migration, 'table' as kind, 'public.profiles' as object, true as present; BEGIN READ ONLY; select true as profiles_direct_delete_disabled; ROLLBACK;",
  '10-migrate.sql':"BEGIN; SET LOCAL lock_timeout='5s'; DO $kit$ BEGIN IF false THEN RAISE EXCEPTION 'unknown'; END IF; END $kit$; COMMIT; BEGIN READ ONLY; select true as present; ROLLBACK;",
  '20-add-member.sql':"BEGIN; insert into members values('<PARTNER_EMAIL>') on conflict do nothing; select true as admitted; COMMIT;",
  '21-remove-member.sql':"BEGIN; delete from members where email='<PARTNER_EMAIL>'; COMMIT;",
};
async function fixture(t, options={}) {
  const dir = await fs.mkdtemp(path.join(root,'tmp/liveops-test-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const receipts=path.join(dir,'receipts');
  const calls=[], output=[];
  let providers=[], domains=[],sqlCalls=0;
  const production = {env_vars:{SYNERA_NEON_AUTH_URL:{type:'plain_text',value:auth}, SYNERA_NEON_DATA_URL:{type:'plain_text',value:data}, KEEP:{type:'plain_text',value:'unchanged'}}, kv_namespaces:{SYNERA_LOCATION_EPHEMERAL:{namespace_id:'kv-id'}}};
  const fetchImpl=async(url,init={})=>{
    calls.push({url:String(url),...init});
    if(options.fetchImpl) return options.fetchImpl(url,init,calls);
    const u=new URL(url), body=init.body && JSON.parse(init.body);
    let result;
    if(u.pathname.endsWith('/branches')) result={branches:[{id:'br-prod',name:'production'}]};
    else if(u.pathname.endsWith('/databases')) result={databases:[{name:'neondb',owner_name:'db_owner'}]};
    else if(u.pathname.endsWith('/roles')) result={roles:[{name:'db_owner'}]};
    else if(u.pathname.endsWith('/connection_uri')) result={uri:'postgresql://db_owner:db-secret@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require'};
    else if(u.pathname.endsWith('/sql')) {
      if(++sqlCalls===options.sqlErrorAt)return Response.json({message:'private failing query '+JSON.stringify(env)},{status:400});
      result={results:body.queries.map(({query})=>({command:'SELECT',rows:sqlCalls===options.sqlEmptyAt?[]:query.includes('as migration')?(options.inventory||inventory):query.includes('as admitted')?[{admitted:true}]:query.includes('as present')?[{present:true}]:[]}))};
    }
    else if(u.pathname.endsWith('/auth')) result={auth_provider:'better_auth',branch_id:'br-prod',db_name:'neondb',base_url:auth};
    else if(u.pathname.includes('/oauth_providers')) {
      if(init.method==='POST') providers=[{id:'google',type:'standard',client_id:body.client_id}];
      if(init.method==='PATCH') providers=[{...providers[0],...body}];
      result=init.method==='GET'?{providers}:providers[0];
    } else if(u.pathname.endsWith('/domains')) {
      if(init.method==='POST') domains.push(body);
      result={domains};
    } else if(u.hostname==='api.cloudflare.com') {
      if(init.method==='PATCH') Object.assign(production.env_vars,body.deployment_configs.production.env_vars);
      result={success:true,result:{name:'synera-pilot',subdomain:'synera-pilot.pages.dev',deployment_configs:{production}}};
    } else if(u.pathname==='/release.json') result={...options.release};
    else throw Error('Unexpected fake URL '+url);
    return Response.json(result);
  };
  const run=argv=>runOps({argv,root,env:{...env},fetchImpl,receiptsDir:receipts,emit:x=>output.push(x),
    getKit:async()=>({files:options.kit||kit,manifest:{commit:'a'.repeat(40),zip:{name:'pilot.zip',sha256:'b'.repeat(64)},files:[]}}),
    envFile:path.join(dir,'.env.local'),...(options.env?{env:options.env}:{})});
  return {run,calls,output,production,receipts,dir};
}

test('SQL blocks retain dollar bodies, order and rollback; reject unclosed transaction',()=>{
  const blocks=transactionBlocks(kit['10-migrate.sql']);
  assert.equal(blocks.length,2); assert.equal(blocks[0].readOnly,false); assert.equal(blocks[1].rollback,true);
  assert.match(blocks[0].queries[1],/^DO \$kit\$/); assert.throws(()=>transactionBlocks('BEGIN; select 1;'),/SQL_LAYOUT/);
});
test('inspect prints catalog only and repeats read-only without mutation',async t=>{
  const f=await fixture(t); for(let i=0;i<2;i++)assert.equal((await f.run(['inspect'])).status,'PASS');
  for(const c of f.calls.filter(c=>c.url.endsWith('/sql')))assert.equal(c.headers['Neon-Batch-Read-Only'],'true');
  assert.deepEqual(f.output.at(-1).inventory,inventory);
  const uri=f.calls.find(c=>c.url.includes('/connection_uri')); assert.match(uri.url,/role_name=db_owner/); assert.match(uri.url,/branch_id=br-prod/);
});
test('inspect refuses a partial new migration while accepting entirely absent new objects',async t=>{
  for(const partial of [true,false]){
    const rows=[...inventory,{migration:'case-state.migration.sql',kind:'table',object:'public.cases',present:partial},{migration:'case-state.migration.sql',kind:'column',object:'public.cases.id',present:false}];
    const sql=rows.map(r=>`select '${r.migration}' as migration, '${r.kind}' as kind, '${r.object}' as object, true as present`).join(' union all ');
    const f=await fixture(t,{inventory:rows,kit:{...kit,'00-inspect.sql':sql+';'}});
    const result=await f.run(['inspect']);assert.equal(result.status,partial?'HOLD':'PASS');if(partial)assert.equal(result.error,'PARTIAL_MIGRATION_STATE');
  }
});
test('migrate uses one atomic ordered batch then read-only ROLLBACK, repeats safely',async t=>{
  const f=await fixture(t); for(let i=0;i<2;i++)assert.equal((await f.run(['migrate'])).status,'PASS');
  const sql=f.calls.filter(c=>c.url.endsWith('/sql')).map(c=>JSON.parse(c.body).queries.map(q=>q.query));
  assert.equal(sql.filter(q=>q.some(s=>s.startsWith('SET LOCAL'))).length,2);
  assert.ok(sql.some(q=>q.at(-1)==='ROLLBACK')); assert.ok(sql.every(q=>!q.includes('COMMIT')));
});
test('migration SQL error stops before catalog acceptance, members and any deployment',async t=>{
  const f=await fixture(t,{sqlErrorAt:3}); const result=await f.run(['all']);assert.equal(result.status,'HOLD');
  assert.equal(f.calls.filter(c=>c.url.endsWith('/sql')).length,3);
  assert.equal(f.calls.filter(c=>c.url.endsWith('/sql')).at(-1).headers['Neon-Batch-Read-Only'],'false');
  assert.equal(f.calls.filter(c=>c.url.startsWith('https://api.cloudflare.com')).length,0);
});
test('empty final catalog response cannot certify a migrated pilot',async t=>{
  const f=await fixture(t,{sqlEmptyAt:3});assert.equal((await f.run(['migrate'])).status,'HOLD');
});
test('member add/remove fill only validated email; repeated operations keep SQL semantics',async t=>{
  const f=await fixture(t);
  for(const action of ['add','remove'])for(let i=0;i<2;i++)assert.equal((await f.run(['member',action,'partner@example.com'])).status,'PASS');
  const sql=f.calls.filter(c=>c.url.endsWith('/sql')).map(c=>c.body).join('');
  assert.match(sql,/on conflict do nothing/); assert.match(sql,/delete from members/); assert.doesNotMatch(sql,/<PARTNER_EMAIL>/);
  const before=f.calls.length; assert.equal((await f.run(['member','add',"x');drop@example.com"])).status,'HOLD'); assert.equal(f.calls.length,before);
});
test('deploy explicitly returns manual upload instead of guessed asset API; repeated no writes',async t=>{
  const f=await fixture(t); for(let i=0;i<2;i++)assert.equal((await f.run(['deploy'])).status,'MANUAL_REQUIRED');
  assert.equal(f.calls.filter(c=>c.method==='POST'||c.method==='PATCH').length,0);
  assert.match(JSON.stringify(f.output),/Direct Upload/);
});
test('env set preserves foreign vars and keeps risky flags off; secret set uses secret_text',async t=>{
  const f=await fixture(t);
  f.production.env_vars.EXISTING_SECRET={type:'secret_text',value:'********'};
  for(const cmd of [['env','set'],['secret','set']])for(let i=0;i<2;i++)assert.equal((await f.run(cmd)).status,'CONFIGURED_REDEPLOY_REQUIRED');
  assert.equal(f.production.env_vars.KEEP.value,'unchanged');
  assert.equal(f.production.env_vars.SYNERA_OPEN_REGISTRATION.value,'false');
  assert.equal(f.production.env_vars.SYNERA_LIVE_AI_READY.value,'false');
  for(const name of ['OPENROUTER_API_KEY','SYNERA_OPERATOR_TOKEN','SYNERA_LIVE_AI_HMAC_SECRET'])assert.equal(f.production.env_vars[name].type,'secret_text');
  for(const c of f.calls.filter(c=>c.method==='PATCH')) assert.ok(!Object.hasOwn(JSON.parse(c.body).deployment_configs.production.env_vars,'EXISTING_SECRET'));
});
test('google creates then updates one standard provider and one trusted origin',async t=>{
  const f=await fixture(t); for(let i=0;i<2;i++)assert.equal((await f.run(['google'])).status,'PASS_PROVIDER_CONFIGURED');
  assert.equal(f.calls.filter(c=>c.url.endsWith('/oauth_providers')&&c.method==='POST').length,1);
  assert.equal(f.calls.filter(c=>c.url.endsWith('/oauth_providers/google')&&c.method==='PATCH').length,1);
  assert.equal(f.calls.filter(c=>c.url.endsWith('/domains')&&c.method==='POST').length,1);
  assert.equal(f.output.at(-1).applicationCallback,'https://synera-pilot.pages.dev/api/neon/oauth/google/callback');
});
test('closed/google flags order and KV gates; open blocked before fetch',async t=>{
  const f=await fixture(t);
  assert.equal((await f.run(['flags','google'])).status,'HOLD');
  for(let i=0;i<2;i++)assert.equal((await f.run(['flags','closed'])).status,'CONFIGURED_REDEPLOY_REQUIRED');
  assert.equal((await f.run(['flags','google'])).status,'HOLD');
  assert.equal((await f.run(['google'])).status,'PASS_PROVIDER_CONFIGURED');
  for(let i=0;i<2;i++)assert.equal((await f.run(['flags','google'])).status,'CONFIGURED_REDEPLOY_REQUIRED');
  const before=f.calls.length; const r=await f.run(['flags','open']); assert.equal(r.status,'HOLD'); assert.equal(f.calls.length,before);
  delete f.production.kv_namespaces.SYNERA_LOCATION_EPHEMERAL;
  assert.equal((await f.run(['flags','closed'])).status,'HOLD');
});
test('every command dry-run incl all uses no fetch, no credential read or random-secret append',async t=>{
  const f=await fixture(t,{env:{},fetchImpl:()=>{throw Error('network forbidden');}});
  for(const cmd of [['inspect'],['migrate'],['member','add','partner@example.com'],['member','remove','partner@example.com'],['deploy'],['env','set'],['secret','set'],['google'],['flags','closed'],['flags','google'],['smoke'],['all']]){
    assert.equal((await f.run([...cmd,'--dry-run'])).status,'DRY_RUN');
  }
  assert.equal(f.calls.length,0); assert.ok(f.output.at(-1).calls.some(c=>c.step==='smoke'));
  await assert.rejects(fs.stat(path.join(f.dir,'.env.local')),/ENOENT/);
});
test('all stops at manual deployment, never silently opens flags or sends OTP',async t=>{
  const f=await fixture(t); const r=await f.run(['all']); assert.equal(r.status,'MANUAL_REQUIRED');
  assert.ok(f.calls.some(c=>c.url.endsWith('/sql'))); assert.ok(!f.calls.some(c=>c.url.includes('/otp/')||c.method==='PATCH'));
});
test('provider errors and malformed results never leak credentials or raw returned fields',async t=>{
  const f=await fixture(t,{fetchImpl:()=>Response.json({error:JSON.stringify(env)},{status:403})});
  assert.equal((await f.run(['inspect'])).status,'HOLD');
  const texts=[JSON.stringify(f.output),...(await Promise.all((await fs.readdir(f.receipts)).map(n=>fs.readFile(path.join(f.receipts,n),'utf8'))))].join('');
  for(const value of Object.values(env)) assert.ok(!texts.includes(value));
  assert.ok(!texts.includes('owner@example.com'));
});
test('owner env loading and generated secrets append once, preserve original lines',async t=>{
  const dir=await fs.mkdtemp(path.join(root,'tmp/liveops-env-')); t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'.env.local'); await fs.writeFile(file,'# keep\nNEON_API_KEY=private\n');
  const a=await loadOwnerEnv(file,true), b=await loadOwnerEnv(file,true);
  assert.equal(a.SYNERA_OPERATOR_TOKEN,b.SYNERA_OPERATOR_TOKEN); assert.ok(a.SYNERA_LIVE_AI_HMAC_SECRET.length>=32);
  assert.match(await fs.readFile(file,'utf8'),/^# keep\nNEON_API_KEY=private\n/);
});

test('smoke checks real config/health and provider redirect without following Google; one OTP reservation',async t=>{
  const calls=[];
  const fetchImpl=async(url,init={})=>{
    calls.push({url:String(url),...init});const u=new URL(url);
    if(u.pathname==='/release.json')return Response.json({files:[]});
    if(u.pathname==='/config.json')return Response.json({backend:'neon',registrationEnabled:true,googleOauthReady:true,googleOAuthEnabled:true,pilotSafetyEnabled:true,realPilotEnabled:true,googleOAuthClientId:env.GOOGLE_OAUTH_CLIENT_ID,googleOAuthInitUrl:auth+'/sign-in/social/init'});
    if(u.pathname==='/api/neon/health') {assert.equal(init.headers['X-Synera-Client'],'1');return Response.json({backend:'neon',authGateway:'reachable'});}
    if(u.pathname==='/api/neon/oauth/google/start')return new Response(null,{status:303,headers:{location:auth+'/sign-in/social/init?token='+'x'.repeat(32)}});
    if(u.pathname.endsWith('/sign-in/social/init'))return new Response(null,{status:302,headers:{location:'https://accounts.google.com/o/oauth2/v2/auth?'+new URLSearchParams({client_id:env.GOOGLE_OAUTH_CLIENT_ID,redirect_uri:auth+'/callback/google',state:'state',response_type:'code'})}});
    if(u.pathname==='/api/neon/otp/request'){assert.equal(JSON.parse(init.body).email,'owner@example.com');return Response.json({sent:true});}
    throw Error('Must not contact Google');
  };
  const f=await fixture(t,{fetchImpl});
  assert.equal((await f.run(['smoke'])).status,'PASS_SMOKE_ONLY');
  assert.equal((await f.run(['smoke'])).status,'HOLD_OTP_RATE_LIMIT');
  assert.equal(calls.filter(c=>c.url.endsWith('/otp/request')).length,1);
  assert.ok(calls.every(c=>!c.url.startsWith('https://accounts.google.com')));
  assert.ok(!JSON.stringify(f.output).includes('owner@example.com'));
});

test('concurrent live invocations share a lock and cannot duplicate OTP/secret work',async t=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});
  const f=await fixture(t,{fetchImpl:async()=>{await pending;return Response.json({},{status:403});}});
  const first=f.run(['inspect']);
  while(f.calls.length===0)await new Promise(resolve=>setTimeout(resolve,5));
  const second=await f.run(['inspect']);assert.equal(second.error,'RUN_ALREADY_ACTIVE_OR_STALE_LOCK');
  assert.equal(f.calls.length,1);release();await first;
  await assert.rejects(fs.stat(path.join(f.receipts,'pilot-ops.lock')),/ENOENT/);
});

test('unknown baseline, elevated API role, missing KV and SQL errors fail closed before mutation',async t=>{
  for(const issue of ['missing','role','sql-error','empty']) {
    const f=await fixture(t,{fetchImpl:async(url,init)=>{
      const u=new URL(url);if(u.pathname.endsWith('/branches'))return Response.json({branches:[{id:'br-prod',name:'production'}]});
      if(u.pathname.endsWith('/databases'))return Response.json({databases:[{name:'neondb',owner_name:'db_owner'}]});
      if(u.pathname.endsWith('/roles'))return Response.json({roles:[{name:'db_owner'}]});
      if(u.pathname.endsWith('/connection_uri'))return Response.json({uri:'postgresql://db_owner:secret@ep-example.us-east-2.aws.neon.tech/neondb'});
      if(issue==='sql-error')return Response.json({message:JSON.stringify(env)},{status:400});
      const queries=JSON.parse(init.body).queries;
      return Response.json({results:queries.map((q,i)=>({rows:i===0?(issue==='empty'?[]:inventory.map(r=>({...r,present:issue!=='missing'}))):issue==='role'?[{api_role:'authenticated',rolsuper:true}]:[]}))});
    }});
    assert.equal((await f.run(['migrate'])).status,'HOLD',issue);
    assert.ok(f.calls.filter(c=>c.url.endsWith('/sql')).every(c=>c.headers['Neon-Batch-Read-Only']==='true'));
  }
});

test('dry-run and live outputs/receipt files across commands contain no keys or member addresses',async t=>{
  const f=await fixture(t);
  for(const cmd of [['inspect'],['migrate'],['member','add','partner@example.com'],['member','remove','partner@example.com'],['deploy'],['env','set'],['secret','set'],['google'],['flags','closed'],['flags','google'],['flags','open'],['all']]){
    await f.run(cmd);await f.run([...cmd,'--dry-run']);
  }
  const texts=JSON.stringify(f.output)+(await Promise.all((await fs.readdir(f.receipts)).map(n=>fs.readFile(path.join(f.receipts,n),'utf8')))).join('');
  for(const [key,value] of Object.entries(env))if(key!=='GOOGLE_OAUTH_CLIENT_ID')for(const part of value.split(','))assert.ok(!texts.includes(part),key);
});
