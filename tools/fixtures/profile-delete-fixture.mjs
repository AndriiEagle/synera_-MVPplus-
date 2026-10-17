import {handleNeon} from '../../neon/worker.mjs';
import {createFixture,A,B,origin,config} from './real-journey-fixture.mjs';
export {A,B,origin};
export function world({status=409,success=false}={}){
  const db=createFixture(),calls=[],upstreamCalls=[];
  for(const p of db.profiles){p.display_name='Synthetic '+p.id[0];p.offers='Synthetic offer';p.seeks='Synthetic need';}
  const env={...db.env,SYNERA_GROUP_ROOMS_READY:'false'};
  const upstream=async(url,init)=>{
    const path=new URL(url).pathname,method=init.method||'GET';upstreamCalls.push({path,method});
    if(path.endsWith('/get-session')&&!new Headers(init.headers).get('Cookie'))return Response.json({});
    if(path.endsWith('/profiles')&&method==='DELETE'){
      if(success){const index=db.profiles.findIndex(p=>p.id===A);return Response.json(index<0?[]:db.profiles.splice(index,1));}
      return Response.json({code:'23503',message:'PRIVATE_UPSTREAM_DIAGNOSTIC'},{status});
    }
    if(path.endsWith('/profile_blocks'))return Response.json([]);
    if(path.endsWith('/meeting_requests')&&method==='POST')return Response.json({code:'23505',message:'PRIVATE_MEETING_DIAGNOSTIC'},{status:409});
    return db.upstream(url,init);
  };
  const fetchFor=async(path,init={})=>{
    const url=new URL(path,origin),headers=new Headers(init.headers);headers.set('Origin',origin);headers.set('Cookie','__Host-synera-session='+A);
    const response=await handleNeon(new Request(url,{...init,headers}),env,upstream);
    calls.push({path:url.pathname+url.search,method:init.method||'GET',status:response.status});return response;
  };
  return {db,env,config:{...config,groupRoomsEnabled:false,registrationEnabled:false},calls,upstreamCalls,fetchFor};
}
