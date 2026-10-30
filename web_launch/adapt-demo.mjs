import { BOT_PROFILES } from './simulation-personas.mjs';
import { adaptCopy } from './adapt-copy.mjs';
const tags=['design','sales','automation','finance','video','events','research','automation','design','sales'];
export const demoParties=BOT_PROFILES.map((p,i)=>({id:p.id,give:[tags[i]],need:[tags[(i+1)%tags.length]],goal:'Demo',limits:[],formats:['remote']}));
export function demoBalanceContext(lang='uk') {
  const t=adaptCopy(lang),parties=demoParties.slice(0,2),collaborationId='demo-balance';
  const e=(id,type,actor,extra={})=>({id,type,actor,collaborationId,at:0,...extra});
  return {parties,collaborationId,lang,now:2*86400000,events:[
    e('demo-delivered','contribution','bot-mira',{concrete:true,delivered:true,contributionId:'sketch',agreementId:'demo-v1',text:t.demoDelivered}),
    e('demo-ask-1','ask','bot-leo',{hasOffer:false,text:t.demoAsk}),e('demo-ask-2','ask','bot-leo',{hasOffer:false,text:t.demoAsk}),
    e('demo-pressure','message','bot-leo',{text:t.demoPressure}),e('demo-move','deadline_moved','bot-leo',{agreementId:'demo-v1'}),
    e('demo-terms-1','terms_changed','bot-leo',{agreed:false}),e('demo-terms-2','terms_changed','bot-leo',{agreed:false}),e('demo-confirm','confirmed','bot-mira',{revision:'demo-v1'}),
  ]};
}
