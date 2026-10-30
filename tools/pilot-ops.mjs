// Owner-run only. Dry-run never loads credentials or sends requests.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash } from 'node:crypto';
import { parseEnv } from 'node:util';
import { generateKit, splitSQL, ORDER } from './pilot-deploy-kit.mjs';
import { readPrivacyGate } from './privacy-gate.mjs';
import { googleSigninSmoke } from './google-signin-smoke.mjs';
import { POLICY_VERSION } from '../web_launch/pilot-policy.mjs';
import { neonEndpoints } from '../neon/worker.mjs';

const ROOT = fileURLToPath(new URL('../',import.meta.url));
const OWNER_ENV = 'C:/Users/Andrii/Desktop/KI/.env.local';
const NEON = 'https://console.neon.tech/api/v2/projects/quiet-credit-94155104';
const CF = 'https://api.cloudflare.com/client/v4/accounts/37d2df88cd4557b3c81da2a7002bba1e/pages/projects/synera-pilot';
const SITE = 'https://synera-pilot.pages.dev';
const GENERATED = ['SYNERA_LIVE_AI_HMAC_SECRET','SYNERA_OPERATOR_TOKEN'];
const SECRETS = ['OPENROUTER_API_KEY',...GENERATED];
const SQL_TARGET='https://<resolved-production-endpoint>/sql';
const AUTH_TARGET=NEON+'/branches/<production-branch-id>/auth';
const DISCOVERY=[['GET',NEON+'/branches?search=production&limit=100'],['GET',NEON+'/branches/<production-branch-id>/databases'],
  ['GET',NEON+'/branches/<production-branch-id>/roles'],['GET',NEON+'/connection_uri?branch_id=<production-branch-id>&database_name=neondb&role_name=<database-owner>&pooled=false']];
const DRY_CALLS={
  inspect:[['POST',SQL_TARGET,'00-inspect + baseline guard, read-only batch, ROLLBACK']],
  migrate:[['POST',SQL_TARGET,'repeat read-only inspection'],['POST',SQL_TARGET,'ordered 10-migrate transaction'],['POST',SQL_TARGET,'read-only final acceptance + ROLLBACK']],
  member:[['POST',SQL_TARGET,'20/21 SQL transaction; one per supplied/allowlisted email, payload redacted']],
  deploy:[['MANUAL','Cloudflare Pages > synera-pilot > Production > Direct Upload','kit ZIP; all stops here until manual continuation']],
  env:[['GET',CF],['GET',AUTH_TARGET],['PATCH',CF,'production env_vars; risky flags off; redeploy required']],
  secret:[['LOCAL',OWNER_ENV,'append only missing random secrets on live run'],['GET',CF],['PATCH',CF,'secret_text; values redacted; redeploy required']],
  google:[['GET',AUTH_TARGET],['GET',AUTH_TARGET+'/oauth_providers'],['POST or PATCH',AUTH_TARGET+'/oauth_providers[/google]','credentials redacted; existing provider selects PATCH'],
    ['GET',AUTH_TARGET+'/domains'],['POST',AUTH_TARGET+'/domains','trusted origin, only if absent'],['GET',AUTH_TARGET+'/oauth_providers','readback']],
  'flags closed':[['GET',CF,'KV binding required'],['POST',SQL_TARGET,'read-only inspection'],['POST',SQL_TARGET,'read-only final acceptance + ROLLBACK'],['PATCH',CF,'closed flags + private allowlist; redeploy required']],
  'flags google':[['GET',CF],['GET',AUTH_TARGET+'/oauth_providers'],['PATCH',CF,'Google flag; redeploy required']],
  'flags open':[['LOCAL','config/privacy-readiness.json','all gates required'],['GET',CF],['PATCH',CF,'open flag; redeploy required']],
  smoke:[['GET',SITE+'/release.json','compare kit file hashes'],['GET',SITE+'/config.json'],['GET',SITE+'/api/neon/health','X-Synera-Client: 1'],
    ['GET',SITE+'/config.json','existing Google smoke helper'],['GET',SITE+'/api/neon/oauth/google/start','manual redirect'],['GET','<validated-Neon-Auth-bridge>','manual redirect; never request Google'],
    ['POST',SITE+'/api/neon/otp/request','one owner OTP per 15 minutes; payload redacted; no sign-in']],
};
const hash = x=>createHash('sha256').update(x).digest('hex');
class Hold extends Error { constructor(code){super(code);} }
const requireThat = (ok,code)=>{if(!ok)throw new Hold(code);};
const email = value=>{requireThat(typeof value==='string' && value.length<=254 && /^[A-Za-z0-9.!#$%&*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value),'INVALID_EMAIL');return value.toLowerCase();};
const emails = env=>{const values=String(env.SYNERA_PILOT_EMAILS||'').split(',').map(s=>s.trim());requireThat(values.length>=1&&values.length<=10,'PILOT_EMAILS_REQUIRED');return [...new Set(values.map(email))];};

export async function loadOwnerEnv(file=OWNER_ENV,generate=false) {
  // Preserve existing bytes and append only missing random values; never echo file contents.
  const text=await fs.readFile(file,'utf8'), env=parseEnv(text), additions=[];
  for(const name of GENERATED)if(generate&&!env[name]){env[name]=randomBytes(32).toString('hex');additions.push(`${name}=${env[name]}`);}
  if(additions.length)await fs.appendFile(file,'\n'+additions.join('\n')+'\n',{mode:0o600});
  return env;
}

export function transactionBlocks(sql) {
  const blocks=[]; let active=null;
  for(const query of splitSQL(sql)) {
    if(/^BEGIN(?: READ ONLY)?$/i.test(query)){requireThat(!active,'SQL_LAYOUT');active={readOnly:/READ ONLY/i.test(query),queries:[]};}
    else if(/^(COMMIT|ROLLBACK)$/i.test(query)){
      requireThat(active&&active.queries.length,'SQL_LAYOUT');blocks.push({...active,rollback:/ROLLBACK/i.test(query)});active=null;
    } else {requireThat(active,'SQL_LAYOUT');active.queries.push(query);}
  }
  requireThat(!active&&blocks.length,'SQL_LAYOUT');return blocks;
}

export async function runOps({argv,root=ROOT,env,envFile=OWNER_ENV,fetchImpl=fetch,
  receiptsDir=path.join(root,'docs/pilot-ops-20261030/receipts'),emit=x=>console.log(JSON.stringify(x,null,2)),getKit}={}) {
  const dryRun=argv.includes('--dry-run'), args=argv.filter(a=>a!=='--dry-run');
  const command=args.join(' '), receipt={command:args[0]||'unknown',at:new Date().toISOString(),toolSha256:hash(await fs.readFile(fileURLToPath(import.meta.url))),dryRun,status:'HOLD',calls:[]};
  let currentStep=args[0], kitCache, branchCache, connectionCache, runLock;
  const lockFile=path.join(receiptsDir,'pilot-ops.lock');
  const receiptDirectory=async()=>{
    for(let p=path.resolve(receiptsDir);p!==path.dirname(p);p=path.dirname(p)){try{requireThat(!(await fs.lstat(p)).isSymbolicLink(),'RECEIPT_PATH_SYMLINK');}catch(error){if(error.code!=='ENOENT')throw error;}}
    await fs.mkdir(receiptsDir,{recursive:true});
  };
  const credentials=names=>{for(const name of names)requireThat(typeof env?.[name]==='string'&&env[name].length>0,'MISSING_'+name);};
  const call=async(step,url,method='GET',body,headers={})=>{
    // Descriptions are constants, never provider payloads, SQL, emails, tokens or redirect URLs.
    receipt.calls.push({step,method,target:url.startsWith(CF)?'Cloudflare Pages':url.startsWith(NEON)?'Neon API':url.endsWith('/sql')?'Neon SQL':url.startsWith(SITE)?'Synera':'Neon Auth bridge'});
    let response;
    try {response=await fetchImpl(url,{method,redirect:'error',signal:AbortSignal.timeout(135000),headers:{'Content-Type':'application/json',...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});}
    catch {throw new Hold(method==='GET'?'NETWORK_ERROR':'OUTCOME_UNKNOWN_NO_AUTOMATIC_RETRY');}
    requireThat(response.ok,'HTTP_'+response.status);
    try {return await response.json();}catch{throw new Hold('INVALID_JSON_RESPONSE');}
  };
  const neon=(suffix,method='GET',body)=>{credentials(['NEON_API_KEY']);return call(currentStep,NEON+suffix,method,body,{Authorization:'Bearer '+env.NEON_API_KEY});};
  const cloud=async(method='GET',body)=>{
    credentials(['CLOUDFLARE_API_TOKEN']);const value=await call(currentStep,CF,method,body,{Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN});
    requireThat(value.success===true&&value.result?.name==='synera-pilot','CLOUDFLARE_PROJECT_MISMATCH');return value.result;
  };
  const branch=async()=>{
    if(branchCache)return branchCache;
    const value=await neon('/branches?search=production&limit=100');
    const matches=value.branches?.filter(b=>b.name==='production'&&!b.deleted_at);
    requireThat(matches?.length===1&&/^br-[a-z0-9-]+$/.test(matches[0].id),'PRODUCTION_BRANCH_AMBIGUOUS');
    branchCache=matches[0].id;return branchCache;
  };
  const connection=async()=>{
    if(connectionCache)return connectionCache;
    const b=await branch(), databases=await neon(`/branches/${b}/databases`),roles=await neon(`/branches/${b}/roles`);
    const db=databases.databases?.filter(d=>d.name==='neondb');
    requireThat(db?.length===1&&roles.roles?.some(r=>r.name===db[0].owner_name),'DATABASE_OWNER_NOT_RESOLVED');
    const query=new URLSearchParams({branch_id:b,database_name:'neondb',role_name:db[0].owner_name,pooled:'false'});
    const value=await neon('/connection_uri?'+query);
    let uri;try{uri=new URL(value.uri);}catch{throw new Hold('INVALID_CONNECTION_URI');}
    requireThat(['postgres:','postgresql:'].includes(uri.protocol)&&/^ep-[a-z0-9-]+\.us-east-2\.aws\.neon\.tech$/.test(uri.hostname)&&!uri.port&&uri.pathname==='/neondb'&&decodeURIComponent(uri.username)===db[0].owner_name&&uri.password,'INVALID_CONNECTION_URI');
    connectionCache={uri:value.uri,url:'https://'+uri.hostname+'/sql'};return connectionCache;
  };
  const kit=async()=>{
    if(kitCache)return kitCache;
    if(getKit)kitCache=await getKit();
    else {
      const out=path.join(root,'docs/deploy-kit-20261029/liveops');
      await generateKit({root,out});
      const manifest=JSON.parse(await fs.readFile(path.join(out,'manifest.json'),'utf8'));
      const files=Object.fromEntries(await Promise.all(['00-inspect.sql','10-migrate.sql','20-add-member.sql','21-remove-member.sql'].map(async name=>[name,await fs.readFile(path.join(out,name),'utf8')])));
      requireThat(hash(await fs.readFile(path.join(out,manifest.zip.name)))===manifest.zip.sha256,'KIT_HASH_MISMATCH');
      kitCache={files,manifest};
    }
    receipt.kitCommit=kitCache.manifest.commit;receipt.zipSha256=kitCache.manifest.zip.sha256;return kitCache;
  };
  const sql=async(queries,{readOnly=false,rollback=false}={})=>{
    const c=await connection();
    const statements=[...queries,...(rollback?['ROLLBACK']:[])];
    const result=await call(currentStep,c.url,'POST',{queries:statements.map(query=>({query,params:[]}))},{'Neon-Connection-String':c.uri,'Neon-Batch-Read-Only':String(readOnly)});
    requireThat(Array.isArray(result.results)&&result.results.length===statements.length&&result.results.every(r=>Array.isArray(r.rows)&&!r.error),'SQL_RESULT_MISMATCH');
    return result.results;
  };
  const acceptCatalog=(results,queries)=>{
    const expected=queries.join('\n').match(/\bas present\b/gi)?.length||0;
    const rows=results.flatMap(r=>r.rows);
    requireThat(expected>0&&rows.length===expected&&rows.every(row=>row.present===true),'POST_MIGRATION_ACCEPTANCE_FAILED');
  };
  const inspect=async()=>{
    const k=await kit();
    const queries=splitSQL(k.files['00-inspect.sql']).filter(q=>! /^(BEGIN READ ONLY|ROLLBACK)$/i.test(q));
    // The same baseline/body guard as the kit, before any migration block is considered.
    const first=transactionBlocks(k.files['10-migrate.sql'])[0];
    const guard=first.queries.find(q=>/^DO \$kit\$/i.test(q));
    requireThat(guard,'KIT_BASELINE_GUARD_MISSING');
    const results=await sql([...queries,guard],{readOnly:true,rollback:true});
    const expected=[...k.files['00-inspect.sql'].matchAll(/select '([^']+)' as migration, '([^']+)' as kind, '([^']+)' as object,/gi)].map(m=>({migration:m[1],kind:m[2],object:m[3]}));
    const rows=results[0].rows;requireThat(expected.length>0&&rows.length===expected.length,'INSPECTION_SHAPE_MISMATCH');
    const inventory=expected.map(e=>{const found=rows.filter(r=>r.migration===e.migration&&r.kind===e.kind&&r.object===e.object);requireThat(found.length===1&&typeof found[0].present==='boolean','INSPECTION_SHAPE_MISMATCH');return {...e,present:found[0].present};});
    requireThat(inventory.filter(r=>r.migration==='schema.proposal.sql'&&['table','column','function','policy','rls','grant'].includes(r.kind)).every(r=>r.present),'BASELINE_MISSING');
    const seen=new Set(inventory.filter(r=>r.migration==='schema.proposal.sql').map(r=>r.kind+':'+r.object));
    for(const migration of ORDER){
      const group=inventory.filter(r=>r.migration===migration+'.migration.sql');
      const own=group.filter(r=>!['grant','rls','constraint'].includes(r.kind)&&!seen.has(r.kind+':'+r.object));
      requireThat(!own.length||own.every(r=>r.present)||own.every(r=>!r.present),'PARTIAL_MIGRATION_STATE');
      for(const row of group)seen.add(row.kind+':'+row.object);
    }
    for(const result of results)for(const row of result.rows)if(row.api_role==='authenticated')requireThat(row.rolsuper===false&&row.rolbypassrls===false&&row.inherits_table_owner===false,'API_ROLE_BYPASSES_RLS');
    receipt.inventory=inventory;return 'PASS';
  };
  const production=project=>{requireThat(project.deployment_configs?.production?.env_vars,'PRODUCTION_CONFIG_MISSING');return project.deployment_configs.production;};
  const patch=async(project,vars)=>{
    const old=production(project).env_vars;
    const changed=Object.entries(vars).some(([k,v])=>v.type==='secret_text'||old[k]?.type!==v.type||old[k]?.value!==v.value);
    // Pages PATCH merges supplied keys (Wrangler uses the same contract). Never resend masked secrets.
    if(changed){const result=await cloud('PATCH',{deployment_configs:{production:{env_vars:vars,...(production(project).wrangler_config_hash?{wrangler_config_hash:production(project).wrangler_config_hash}:{})}}});const actual=production(result).env_vars;
      for(const [name,value] of Object.entries(vars))requireThat(actual[name]?.type===value.type&&(value.type==='secret_text'||actual[name].value===value.value),'CONFIG_READBACK_MISMATCH');}
    receipt.redeployRequired=true;return 'CONFIGURED_REDEPLOY_REQUIRED';
  };
  const plain=values=>Object.fromEntries(Object.entries(values).map(([k,value])=>[k,{type:'plain_text',value}]));
  const google=async()=>{
    credentials(['GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET']);requireThat(/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(env.GOOGLE_OAUTH_CLIENT_ID),'INVALID_GOOGLE_CLIENT_ID');
    const prefix=`/branches/${await branch()}/auth`,integration=await neon(prefix);
    requireThat(integration.auth_provider==='better_auth'&&integration.branch_id===await branch()&&integration.db_name==='neondb','AUTH_INTEGRATION_MISMATCH');
    const providers=await neon(prefix+'/oauth_providers');requireThat(Array.isArray(providers.providers),'OAUTH_PROVIDER_SHAPE');
    const matches=providers.providers.filter(p=>p.id==='google');requireThat(matches.length<=1,'GOOGLE_PROVIDER_AMBIGUOUS');
    await neon(prefix+'/oauth_providers'+(matches.length?'/google':''),matches.length?'PATCH':'POST',{...(matches.length?{}:{id:'google'}),client_id:env.GOOGLE_OAUTH_CLIENT_ID,client_secret:env.GOOGLE_OAUTH_CLIENT_SECRET});
    const domains=await neon(prefix+'/domains');requireThat(Array.isArray(domains.domains),'AUTH_DOMAINS_SHAPE');
    if(!domains.domains.some(d=>d.domain===SITE&&d.auth_provider==='better_auth'))await neon(prefix+'/domains','POST',{domain:SITE,auth_provider:'better_auth'});
    const after=await neon(prefix+'/oauth_providers');requireThat(after.providers?.some(p=>p.id==='google'&&p.type==='standard'&&p.client_id===env.GOOGLE_OAUTH_CLIENT_ID),'GOOGLE_PROVIDER_READBACK_MISMATCH');
    receipt.applicationCallback=SITE+'/api/neon/oauth/google/callback';
    receipt.googleCloudRedirect='Copy exact Provider callback from Neon production Auth > Google into Google Cloud; never substitute the application callback';
    return 'PASS_PROVIDER_CONFIGURED';
  };
  const steps=async(parts)=>{
    currentStep=parts[0];const [name,action,value]=parts;
    if(name==='inspect')return inspect();
    if(name==='migrate'){
      await inspect();const k=await kit();
      for(const block of transactionBlocks(k.files['10-migrate.sql'])){
        const results=await sql(block.queries,block);
        if(block.readOnly)acceptCatalog(results,block.queries);
      } return 'PASS';
    }
    if(name==='member'){
      const address=email(value);requireThat(['add','remove'].includes(action),'USAGE');
      if(action==='add')requireThat(emails(env).includes(address),'MEMBER_NOT_ALLOWLISTED');
      const k=await kit(),file=action==='add'?'20-add-member.sql':'21-remove-member.sql';
      for(const block of transactionBlocks(k.files[file].replaceAll('<PARTNER_EMAIL>',address))){
        const results=await sql(block.queries,block);
        if(action==='add')requireThat(results.some(r=>r.rows.some(row=>row.admitted===true)),'MEMBER_NOT_ADMITTED');
      } receipt.admissionOnly=true;return 'PASS';
    }
    if(name==='deploy'){
      const k=await kit();
      receipt.manualUpload={dashboard:`https://dash.cloudflare.com/37d2df88cd4557b3c81da2a7002bba1e/pages/view/synera-pilot`,zip:k.manifest.zip.name,
        steps:['Workers & Pages > synera-pilot > Create deployment > Production > Direct Upload',
          'Upload the generated ZIP from docs/deploy-kit-20261029/liveops; save previous production deployment ID first',
          'Verify _worker.js Advanced mode, deploy, then rerun the same command'],reason:'Deployment manifest is documented; asset content-hash upload protocol is not sufficiently documented. No guessed upload requests.'};
      receipt.continueAfterUpload=['env set','secret set','google','flags closed','flags google','manual Production ZIP redeploy (activates settings)','smoke'];
      return 'MANUAL_REQUIRED';
    }
    if(name==='env'){
      const project=await cloud(),vars=production(project).env_vars;
      const prefix=`/branches/${await branch()}/auth`,integration=await neon(prefix);
      requireThat(integration.auth_provider==='better_auth'&&integration.branch_id===await branch()&&integration.db_name==='neondb','AUTH_INTEGRATION_MISMATCH');
      try{neonEndpoints({SYNERA_SITE_URL:SITE,SYNERA_NEON_AUTH_URL:integration.base_url,SYNERA_NEON_DATA_URL:vars.SYNERA_NEON_DATA_URL?.value});}catch{throw new Hold('NEON_URLS_REQUIRE_OWNER_REVIEW');}
      credentials(['GOOGLE_OAUTH_CLIENT_ID']);
      return patch(project,plain({SYNERA_SITE_URL:SITE,SYNERA_NEON_AUTH_URL:integration.base_url,SYNERA_NEON_DATA_URL:vars.SYNERA_NEON_DATA_URL.value,
        SYNERA_GOOGLE_CLIENT_ID:env.GOOGLE_OAUTH_CLIENT_ID,SYNERA_PILOT_READY:'false',SYNERA_REGISTRATION_ENABLED:'false',SYNERA_GOOGLE_OAUTH_READY:'false',
        SYNERA_OPEN_REGISTRATION:'false',SYNERA_LOCATION_READY:'false',SYNERA_GROUP_ROOMS_READY:'false',SYNERA_PROFILE_ERASURE_READY:'false',SYNERA_COMPLETE_ERASURE_READY:'false',SYNERA_LIVE_AI_READY:'false',
        SYNERA_REAL_JOURNEY_READY:'true',SYNERA_CASE_OUTCOMES_READY:'true',SYNERA_MESSAGE_INTENTS_READY:'true',SYNERA_MEETING_ADDRESS_READY:'true'}));
    }
    if(name==='secret'){
      credentials(GENERATED);requireThat(GENERATED.every(k=>env[k].length>=32),'GENERATED_SECRET_TOO_SHORT');
      const project=await cloud(),vars={};
      for(const key of SECRETS) {
        if(env[key])vars[key]={type:'secret_text',value:env[key]};
        else requireThat(production(project).env_vars[key]?.type==='secret_text','MISSING_'+key);
      }
      return patch(project,vars);
    }
    if(name==='google')return google();
    if(name==='flags'){
      if(action==='open')await readPrivacyGate(path.join(root,'config/privacy-readiness.json'),'open-registration');
      const project=await cloud(),config=production(project),vars=config.env_vars;
      requireThat(config.kv_namespaces?.SYNERA_LOCATION_EPHEMERAL?.namespace_id,'OTP_KV_REQUIRED');
      if(action==='closed'){
        await inspect();
        const blocks=transactionBlocks((await kit()).files['10-migrate.sql']);
        const acceptance=blocks.at(-1);
        requireThat(acceptance.readOnly&&acceptance.rollback,'KIT_ACCEPTANCE_MISSING');
        const results=await sql(acceptance.queries,acceptance);
        acceptCatalog(results,acceptance.queries);
        return patch(project,{...plain({SYNERA_PILOT_READY:'true',SYNERA_REGISTRATION_ENABLED:'true',SYNERA_OPEN_REGISTRATION:'false',SYNERA_GOOGLE_OAUTH_READY:'false'}),SYNERA_PILOT_EMAILS:{type:'secret_text',value:emails(env).join(',')}});
      }
      requireThat(vars.SYNERA_PILOT_READY?.value==='true'&&vars.SYNERA_REGISTRATION_ENABLED?.value==='true','CLOSED_FLAGS_REQUIRED');
      if(action==='google'){
        const providers=await neon(`/branches/${await branch()}/auth/oauth_providers`);
        requireThat(providers.providers?.some(p=>p.id==='google'&&p.type==='standard'&&p.client_id===env.GOOGLE_OAUTH_CLIENT_ID),'GOOGLE_PROVIDER_REQUIRED');
      }
      return patch(project,plain(action==='open'?{SYNERA_OPEN_REGISTRATION:'true'}:{SYNERA_GOOGLE_OAUTH_READY:'true'}));
    }
    if(name==='smoke'){
      const expected=(await kit()).manifest.files.filter(f=>f.name!=='release.json');
      const release=await call('smoke',SITE+'/release.json');
      requireThat(Array.isArray(release.files)&&release.files.length===expected.length&&expected.every(f=>release.files.some(r=>r.name===f.name&&r.sha256===f.sha256)),'DEPLOYED_RELEASE_MISMATCH');
      receipt.release='MATCHED_KIT_FILES';
      const config=await call('smoke',SITE+'/config.json');requireThat(config.backend==='neon'&&config.registrationEnabled===true&&config.realPilotEnabled===true,'CONFIG_GATE_CLOSED');
      const health=await call('smoke',SITE+'/api/neon/health','GET',undefined,{'X-Synera-Client':'1'});requireThat(health.backend==='neon'&&health.authGateway==='reachable','AUTH_HEALTH_FAILED');
      try{await googleSigninSmoke({origin:SITE,clientId:env.GOOGLE_OAUTH_CLIENT_ID,fetchImpl});}catch{throw new Hold('GOOGLE_REDIRECT_SMOKE_FAILED');}
      const address=emails(env)[0],stateFile=path.join(receiptsDir,'otp-rate-limit.private.json');
      let previous={};try{previous=JSON.parse(await fs.readFile(stateFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw new Hold('OTP_RESERVATION_INVALID');}
      if(Date.now()-(previous.at||0)<15*60*1000){receipt.otp='SKIPPED_LOCAL_15_MIN_RESERVATION';return 'HOLD_OTP_RATE_LIMIT';}
      await fs.mkdir(receiptsDir,{recursive:true});await fs.writeFile(stateFile,JSON.stringify({at:Date.now()}));
      const result=await call('smoke',SITE+'/api/neon/otp/request','POST',{email:address,consent:{policy_version:POLICY_VERSION,terms:true,privacy:true}},{'X-Synera-Client':'1',Origin:SITE});
      requireThat(result.sent===true,'OTP_NOT_ACCEPTED');receipt.otp='ACCEPTED_REQUEST_ONLY';receipt.signedIn=false;receipt.persistence='UNVERIFIED_TWO_PHONES_REQUIRED';
      return 'PASS_SMOKE_ONLY';
    }
    throw new Hold('USAGE');
  };
  try {
    await receiptDirectory();
    const layouts={inspect:1,migrate:1,member:3,deploy:1,env:2,secret:2,google:1,flags:2,smoke:1,all:1};
    requireThat(layouts[args[0]]===args.length&&(!['env','secret'].includes(args[0])||args[1]==='set')&&(!['flags'].includes(args[0])||['closed','google','open'].includes(args[1])),'USAGE');
    if(args[0]==='flags'&&args[1]==='open')await readPrivacyGate(path.join(root,'config/privacy-readiness.json'),'open-registration');
    if(args[0]==='member'){requireThat(['add','remove'].includes(args[1]),'USAGE');email(args[2]);}
    if(dryRun){
      const sequence=args[0]==='all'?['inspect','migrate','member','deploy','env','secret','google','flags closed','flags google','smoke']:[args[0]==='member'?'member':command];
      let discovered=false;
      for(const step of sequence){
        const key=DRY_CALLS[step]?step:step.split(' ')[0];
        if(!discovered&&['inspect','migrate','member','env','google','flags closed','flags google'].includes(key)){
          for(const [method,url] of DISCOVERY)receipt.calls.push({step,method,url,condition:'when not yet resolved'});
          discovered=true;
        }
        for(const [method,url,detail] of DRY_CALLS[key]||[])receipt.calls.push({step,method,url,...(detail?{detail}:{})});
      }
      receipt.status='DRY_RUN';receipt.liveVerified=false;
    } else {
      try{runLock=await fs.open(lockFile,'wx');}catch(error){if(error.code==='EEXIST')throw new Hold('RUN_ALREADY_ACTIVE_OR_STALE_LOCK');throw error;}
      if(!env)env=await loadOwnerEnv(envFile,args[0]==='secret'||args[0]==='all');
      if(args[0]==='all'){
        credentials(['CLOUDFLARE_API_TOKEN','NEON_API_KEY','GOOGLE_OAUTH_CLIENT_ID','GOOGLE_OAUTH_CLIENT_SECRET']);
        const addresses=emails(env);
        const sequence=[['inspect'],['migrate'],...addresses.map(a=>['member','add',a]),['deploy'],['env','set'],['secret','set'],['google'],['flags','closed'],['flags','google'],['smoke']];
        for(const step of sequence){receipt.status=await steps(step);if(receipt.status==='MANUAL_REQUIRED')break;}
      } else receipt.status=await steps(args);
    }
  } catch(error) {receipt.status='HOLD';receipt.error=error instanceof Hold?error.message:args[0]==='flags'&&args[1]==='open'?'OPEN_REGISTRATION_BLOCKED':'LOCAL_VALIDATION_FAILED';}
  // Do not persist a raw command: member arguments and arbitrary input may contain PII/secrets.
  receipt.command=['inspect','migrate','member','deploy','env','secret','google','flags','smoke','all'].includes(args[0])?args[0]:'unknown';
  try {
    await receiptDirectory();
    await fs.writeFile(path.join(receiptsDir,receipt.at.replace(/[:.]/g,'-')+'-'+receipt.command+'-'+randomBytes(4).toString('hex')+'.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  } catch {receipt.status='HOLD';receipt.error='RECEIPT_WRITE_FAILED';}
  if(runLock){await runLock.close();await fs.unlink(lockFile);}
  emit(receipt);return receipt;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=await runOps({argv:process.argv.slice(2)});
  if(['HOLD','MANUAL_REQUIRED','HOLD_OTP_RATE_LIMIT'].includes(result.status))process.exitCode=2;
}
