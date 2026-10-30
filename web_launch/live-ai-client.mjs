export const LIVE_AI_NOTICE_VERSION='live-ai-v1';
export const LIVE_AI_COPY={
  uk:{toggle:'Живі відповіді (AI)',title:'Передати повідомлення для AI-відповіді?',processor:'Виконавець запиту через OpenRouter',
    unreachable:'Живий AI недоступний: з’єднання з Worker не підтверджене. Відповіді за сценарієм.',
    notice:'Це необов’язковий Demo. Твоє нове повідомлення та до 8 попередніх введених тобою повідомлень цієї розмови підуть через Cloudflare до OpenRouter і названого нижче виконавця запиту. Модель: GLM 5.3 Flash, розробник Z.ai. Картка профілю не передається. Email, телефони та посилання маскуються; це не гарантує анонімності. Фактичний сервер і країни обробки не підтверджені; можливі США, Китай та інші країни. Запит дозволяє лише маршрути без навчання на даних і з нульовим зберіганням (ZDR); договори й фактичне виконання ще перевіряються. Не вводь чужі приватні або чутливі дані. Вимкнення припиняє нові надсилання, але не повертає вже надісланий текст. Згода діє лише в цій вкладці до перезавантаження.',
    accept:'Погоджуюсь',decline:'Ні, за сценарієм',active:'Demo · Стрічка за сценарієм. У твоїй розмові відповідає AI. Люди, зустрічі й результати вигадані.',
    local:'Картка залишається на пристрої. Лише введені тобою повідомлення цієї розмови передаються для AI-відповіді за твоєю згодою.',
    off:'AI вимкнено. Нові повідомлення не надсилаються моделі.',unavailable:'Живий AI недоступний: оператор ще не завершив налаштування. Відповіді за сценарієм.',
    fallback:'AI зараз недоступний. Відповідь за сценарієм.',cap:'Денний ліміт AI вичерпано. Відповідь за сценарієм.',privacy:'Твої дані',tag:'AI · створено ШІ',grant:'Згоду на AI надано',revoke:'Згоду на AI відкликано'},
  de:{toggle:'Live-Antworten (KI)',title:'Nachrichten für eine KI-Antwort senden?',processor:'Ausführender Anbieter über OpenRouter',
    unreachable:'Live-KI nicht verfügbar: Die Verbindung zum Worker ist nicht bestätigt. Antworten nach Skript.',
    notice:'Dieser Demo-Modus ist freiwillig. Deine neue und bis zu 8 frühere, von dir eingegebene Nachrichten dieses Gesprächs gehen über Cloudflare an OpenRouter und den unten genannten ausführenden Anbieter. Modell: GLM 5.3 Flash, Entwickler Z.ai. Deine Profilkarte wird nicht gesendet. E-Mail, Telefonnummern und Links werden maskiert; das garantiert keine Anonymität. Tatsächliche Server und Verarbeitungsländer sind nicht bestätigt; USA, China und andere Länder sind möglich. Die Anfrage erlaubt nur Routen ohne Datentraining und mit Zero Data Retention (ZDR); Verträge und tatsächliche Umsetzung werden noch geprüft. Keine privaten Daten anderer oder sensiblen Angaben eingeben. Ausschalten stoppt neue Übertragungen; bereits gesendeten Text kann es nicht zurückholen. Die Zustimmung gilt nur in diesem Tab bis zum Neuladen.',
    accept:'Ich stimme zu',decline:'Nein, nach Skript',active:'Demo · Der Feed folgt einem Skript. In deinem Gespräch antwortet KI. Menschen, Treffen und Ergebnisse sind fiktiv.',
    local:'Die Profilkarte bleibt auf dem Gerät. Nur deine eingegebenen Gesprächsnachrichten werden mit deiner Zustimmung für KI-Antworten übertragen.',
    off:'KI ausgeschaltet. Neue Nachrichten werden nicht an das Modell gesendet.',unavailable:'Live-KI nicht verfügbar: Die Einrichtung durch den Betreiber ist noch offen. Antworten nach Skript.',
    fallback:'KI derzeit nicht verfügbar. Antwort nach Skript.',cap:'Das tägliche KI-Limit ist erreicht. Antwort nach Skript.',privacy:'Deine Daten',tag:'AI · KI-generiert',grant:'KI-Zustimmung erteilt',revoke:'KI-Zustimmung widerrufen'},
  en:{toggle:'Live replies (AI)',title:'Send messages for an AI reply?',processor:'Inference provider through OpenRouter',
    unreachable:'Live AI unavailable: the Worker connection could not be verified. Replies use the script.',
    notice:'This Demo mode is optional. Your new message and up to 8 previous messages you typed in this conversation go through Cloudflare to OpenRouter and the inference provider named below. Model: GLM 5.3 Flash, developed by Z.ai. Your profile card is not sent. Emails, phones and links are masked; this does not guarantee anonymity. Actual servers and processing countries are unconfirmed; the US, China and other countries are possible. Requests allow only routes without data training and with Zero Data Retention (ZDR); contracts and actual execution are still under review. Do not enter other people’s private or sensitive data. Switching off stops new transfers; it cannot retrieve text already sent. Consent lasts only in this tab until reload.',
    accept:'I agree',decline:'No, use the script',active:'Demo · The feed is scripted. AI replies in your conversation. People, meetings and results are fictional.',
    local:'Your profile card stays on this device. Only messages you typed in this conversation are sent for AI replies with your consent.',
    off:'AI is off. New messages are not sent to the model.',unavailable:'Live AI unavailable: operator setup is not complete. Replies use the script.',
    fallback:'AI is unavailable right now. This reply uses the script.',cap:'The daily AI limit is reached. This reply uses the script.',privacy:'Your data',tag:'AI · AI-generated',grant:'AI consent granted',revoke:'AI consent withdrawn'},
};
export function mountLiveAi({target,locale,record,onChange,fetchImpl=fetch}) {
  const c=LIVE_AI_COPY[locale]||LIVE_AI_COPY.uk;
  let ready=false,enabled=false,controller,epoch=0,grantId,provider;
  const root=document.createElement('section'); root.className='living-card live-ai-controls';
  root.innerHTML='<label id="live-ai-switch" hidden><input id="live-ai-toggle" type="checkbox" role="switch"><span></span></label><p id="live-ai-status" role="status"></p><section id="live-ai-notice" aria-labelledby="live-ai-title" hidden><h3 id="live-ai-title" tabindex="-1"></h3><p></p><a href="/privacy.html"></a><div class="living-controls"><button id="live-ai-accept" type="button"></button><button id="live-ai-decline" type="button"></button></div></section>';
  target.prepend(root);
  const $=s=>root.querySelector(s), toggle=$('#live-ai-toggle'), notice=$('#live-ai-notice'),status=$('#live-ai-status');
  $('#live-ai-switch span').textContent=c.toggle; $('#live-ai-title').textContent=c.title; notice.querySelector('p').textContent=c.notice;
  notice.querySelector('a').textContent=c.privacy;notice.querySelector('a').href+='?lang='+locale;
  $('#live-ai-accept').textContent=c.accept;$('#live-ai-decline').textContent=c.decline;
  function consent(decision) {
    const eventId=crypto.randomUUID();
    record('consent','visitor',decision==='grant'?c.grant:c.revoke,{source:'visitor',purpose:'live_ai_persona_reply',decision,eventId,
      previousEventId:decision==='revoke'?grantId:null,noticeVersion:LIVE_AI_NOTICE_VERSION,locale,model:'z-ai/glm-5.3-flash',provider,localOnly:true});
    if(decision==='grant') grantId=eventId;
  }
  function disable(log=true) {
    const was=enabled; enabled=false;epoch++;controller?.abort();toggle.checked=false;notice.hidden=true;
    if(was&&log) consent('revoke'); if(was) status.textContent=c.off;onChange(false);
  }
  toggle.addEventListener('change',()=>{
    if(!toggle.checked) return disable();
    toggle.checked=false;if(!ready) return;
    notice.hidden=false;$('#live-ai-title').focus();
  });
  $('#live-ai-decline').addEventListener('click',()=>{notice.hidden=true;toggle.focus();});
  $('#live-ai-accept').addEventListener('click',()=>{
    if(!ready) return; consent('grant'); enabled=true;epoch++;toggle.checked=true;notice.hidden=true;status.textContent=c.active;onChange(true);toggle.focus();
  });
  status.textContent=c.unavailable;
  fetchImpl('/config.json',{cache:'no-store',credentials:'same-origin'}).then(r=>{if(!r.ok) throw Error();return r.json();}).then(config=>{
    provider=config.liveAiProvider;
    ready=config.liveAiReady===true && config.liveAiModel==='z-ai/glm-5.3-flash' && typeof provider==='string' && provider.length>0;
    notice.querySelector('p').textContent=c.notice+' '+c.processor+': '+(provider||'—')+'.';
    $('#live-ai-switch').hidden=!ready;status.textContent=ready?c.off:c.unavailable;
  }).catch(()=>{status.textContent=c.unreachable;});
  return {
    get enabled(){return enabled;},disable,
    async reply(session) {
      if(!enabled) return null;
      const current=epoch; controller=new AbortController();
      const typed=session.messages.filter(m=>m.actor==='visitor');
      const body={persona:session.personId,conversation:typed.slice(0,-1).slice(-8).map(m=>({role:'user',content:m.text})),visitorText:typed.at(-1).text,locale};
      const timer=setTimeout(()=>controller.abort(),21000);
      try {
        const response=await fetchImpl('/api/ai/persona-reply',{method:'POST',credentials:'same-origin',cache:'no-store',signal:controller.signal,
          headers:{'Content-Type':'application/json','X-Synera-Client':'1','X-Synera-AI-Consent':LIVE_AI_NOTICE_VERSION},body:JSON.stringify(body)});
        const data=await response.json();
        if(!enabled||current!==epoch) return null;
        if(!response.ok || data.model!=='z-ai/glm-5.3-flash' || typeof data.text!=='string' || !data.text.trim()) {
          status.textContent=data.error==='live_ai_cap_reached'?c.cap:c.fallback;return null;
        }
        return {...data,ai:true};
      } catch { if(current===epoch) status.textContent=c.fallback;return null; }
      finally {clearTimeout(timer);}
    }
  };
}
