// Neon/Postgres owns identity, membership, turn revision and the clock.
// The gateway admits only this explicit RPC contract; it stores no transcripts.
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
export function groupRoomsReady(env){return env.SYNERA_PILOT_READY==='true'&&env.SYNERA_GROUP_ROOMS_READY==='true';}
async function bodyOf(request){
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return null;
  if(Number(request.headers.get('content-length'))>12288||!request.body)return null;
  const reader=request.body.getReader();let size=0,parts=[];
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12288){await reader.cancel();return null;}parts.push(value);}
  const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length;}
  try{const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return body&&typeof body==='object'&&!Array.isArray(body)?body:null;}catch{return null;}
}
export async function handleGroupRoom(request,env,session,rpc){
  if(!groupRoomsReady(env))return reply({error:'rooms_unavailable',status:503},503);
  if(!session?.user?.id)return reply({error:'rooms_unauthorized',status:401},401);
  const url=new URL(request.url),match=url.pathname.match(/^\/api\/neon\/rooms\/(?:(list|create)|([^/]+)\/(get|accept|leave|start|message|advance|close))$/);
  if(request.method!=='POST'||url.search||!match||(match[2]&&!uuid(match[2])))return reply({error:'not_found',status:404},404);
  const action=match[1]||match[3],body=await bodyOf(request),fields={list:[],create:['title','goal','invitee_ids'],get:[],accept:[],leave:[],start:['expected_revision'],message:['expected_revision','message_id','body'],advance:['expected_revision'],close:['expected_revision']}[action];
  const invalid=()=>reply({error:'rooms_invalid',status:400},400);
  if(!body||Object.keys(body).some(key=>!fields.includes(key)))return invalid();
  const args=match[2]?{p_room_id:match[2]}:{};
  if(action==='create'){
    if(typeof body.title!=='string'||body.title.trim().length<1||body.title.length>120||typeof body.goal!=='string'||body.goal.trim().length<1||body.goal.length>500||!Array.isArray(body.invitee_ids)||![1,2].includes(body.invitee_ids.length)||!body.invitee_ids.every(uuid)||new Set(body.invitee_ids).size!==body.invitee_ids.length||body.invitee_ids.includes(session.user.id))return invalid();
    Object.assign(args,{p_title:body.title.trim(),p_goal:body.goal.trim(),p_invitee_ids:body.invitee_ids});
  }
  if(fields.includes('expected_revision')){
    if(!Number.isSafeInteger(body.expected_revision)||body.expected_revision<1||body.expected_revision>2147483647)return invalid();
    args.p_expected_revision=body.expected_revision;
  }
  if(action==='message'){
    if(!uuid(body.message_id)||typeof body.body!=='string'||!body.body.trim()||body.body.length>2000)return invalid();
    Object.assign(args,{p_message_id:body.message_id,p_body:body.body.trim()});
  }
  return reply(await rpc('synera_room_'+action,args));
}
