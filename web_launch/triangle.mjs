import { createRoom, setContribution, addMessage, addTask, toggleTask, parseCHF, proposeBudget,
  voteBudget, budgetStatus, startRound, roundAction, roundRemaining, facilitatorNote, exportRoom } from './triangle-room.mjs';
import { chooseMeetingPlace, complimentarySkills, googleMapScenario } from './explore-planner.mjs';
import { meetingDirectionsUrl } from './live-location.mjs';

const $ = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
function node(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent=text; if(className)el.className=className; return el; }
const names = ['a','b','c'];
const money = minor => (minor/100).toLocaleString('de-CH',{minimumFractionDigits:2,maximumFractionDigits:2})+' CHF';
let room = null;
const guarded = operation => { try { operation(); $('#studio-status').textContent=''; } catch(error) { $('#studio-status').textContent=error.message; } };
const modeCopy = {
  project:'Назвіть результат, власний внесок і найменший крок. Бюджет, права й доступи погоджуйте окремо.',
  brainstorm:'Спочатку дайте місце кожній ідеї. Потім оберіть один невеликий експеримент.',
  resolve:'Відокремте спостережуваний факт, свою потребу й пропозицію. Суперечливі твердження потребують джерел і права відповісти.',
  focus:'Назвіть роботу кожного й короткий перевірний результат. Перерви та передавання слова добровільні.',
  conversation:'Кожен обирає, чим поділитися. Порада й аналіз потребують запиту; можна пропустити чергу.',
};
function setPane(value) {
  for(const b of all('[data-pane]'))b.setAttribute('aria-pressed',String(b.dataset.pane===value));
  for(const p of all('.studio-pane'))p.hidden=p.id!==`pane-${value}`;
  $('#studio-status').textContent='';
  history.replaceState(null,'',`#${value}`);
}
for(const b of all('[data-pane]'))b.addEventListener('click',()=>setPane(b.dataset.pane));
setPane(['room','atlas','launch'].includes(location.hash.slice(1))?location.hash.slice(1):'room');
$('#room-setup').addEventListener('submit',event=>{event.preventDefault();guarded(()=>{
  if(room&&!confirm('Нова кімната очистить локальні нотатки. Потрібний файл уже експортовано?'))return;
  room=createRoom({goal:$('#room-goal').value,names:names.map(id=>$(`#name-${id}`).value),mode:$('#room-mode').value});
  $('#room-workspace').hidden=false;
  $('#room-setup button').textContent='Створити нову кімнату';
  $('#active-goal').textContent=room.goal; $('#mode-description').textContent=modeCopy[room.mode];
  for(const select of [$('#message-member'),$('#task-owner')]) { select.replaceChildren(); for(const m of room.members){const option=node('option',m.name);option.value=m.id;select.append(option);} }
  $('#contributions').replaceChildren();
  for(const m of room.members){
    const form=node('form',undefined,'studio-card'), title=node('h3',m.name), label=node('label','Мій внесок і межі'), input=node('textarea');
    input.rows=3;input.maxLength=500;input.setAttribute('aria-label',`Внесок ${m.name}`);label.append(input);
    const button=node('button','Записати внесок');button.type='submit';form.append(title,label,button);
    form.addEventListener('submit',event=>{event.preventDefault();guarded(()=>{room=setContribution(room,m.id,input.value);render();});});
    $('#contributions').append(form);
    const seat=$(`[data-member="${m.id}"]`);seat.querySelector('b').textContent=m.name;seat.querySelector('.seat-avatar').textContent=m.name.slice(0,1).toUpperCase();
  }
  const d=new Date(Date.now()+3600000);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());$('#budget-deadline').value=d.toISOString().slice(0,16);
  render();$('#l-note').textContent=modeCopy[room.mode];
});});
function render() {
  for(const m of room.members)$(`[data-member="${m.id}"] small`).textContent=m.contribution||'Внесок ще не уточнений';
  const messages=$('#room-messages');messages.replaceChildren();
  if(!room.messages.length)messages.append(node('p','Поки що немає нотаток розмови.','subtle'));
  for(const m of room.messages){const article=node('article');article.append(node('b',room.members.find(p=>p.id===m.member).name),node('p',m.body));messages.append(article);}
  const tasks=$('#room-tasks');tasks.replaceChildren();
  for(const t of room.tasks){const li=node('li'),label=node('label',undefined,'studio-check'),check=node('input');check.type='checkbox';check.checked=t.done;
    const content=node('span',t.title);content.append(node('small',room.members.find(m=>m.id===t.owner).name));
    check.addEventListener('change',()=>guarded(()=>{room=toggleTask(room,t.id);render();}));label.append(check,content);li.append(label);tasks.append(li);}
  renderBudget();tick();
}
$('#ask-l').addEventListener('click',()=>guarded(()=>{if(!room)throw new Error('Спочатку створи кімнату зі своєю ціллю.');$('#l-note').textContent=facilitatorNote(room,Date.now());}));
$('#message-form').addEventListener('submit',event=>{event.preventDefault();guarded(()=>{room=addMessage(room,$('#message-member').value,$('#message-body').value,Date.now());$('#message-body').value='';render();});});
$('#task-form').addEventListener('submit',event=>{event.preventDefault();guarded(()=>{room=addTask(room,$('#task-owner').value,$('#task-title').value);$('#task-title').value='';render();});});
$('#round-form').addEventListener('submit',event=>{event.preventDefault();guarded(()=>{room=startRound(room,Number($('#round-seconds').value),$('#round-agreed').checked);$('#round-controls').hidden=false;tick();});});
for(const action of ['start','pause','next'])$(`#round-${action}`).addEventListener('click',()=>guarded(()=>{room=roundAction(room,action,Date.now());tick();}));
const statuses={none:'Пропозиції ще немає.',awaiting_responses:'Очікує явних відповідей трьох учасників.',unanimous_local_notes:'Три «так» записані локально. Це не перевірена угода й не платіж.',declined:'Є відповідь «ні». Потрібно уточнити умови.',expired_without_agreement:'Дедлайн минув. Домовленості немає; потрібна нова пропозиція.'};
const choices={yes:'Так',no:'Ні',abstain:'Утримуюсь',withdraw:'Відкликати записану відповідь'};
function updateBudgetStatus(){if(!room?.proposal)return;const state=budgetStatus(room,Date.now()),p=$('#budget-state');if(p){p.textContent=statuses[state];p.dataset.state=state;}
  for(const button of all('.budget-vote button'))button.disabled=Date.now()>=room.proposal.deadline;
}
function tick(){if(!room)return;updateBudgetStatus();if(!room.round)return;
  const r=room.round,remaining=roundRemaining(room,Date.now());
  $('#round-person').textContent=`Слово: ${room.members[r.index].name}`;$('#round-clock').value=`${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
  $('#round-hint').textContent=remaining===0?'Орієнтир часу минув. Заверши думку й передай слово, коли готовий.':r.running?'Черга триває. Можна передати слово або зробити паузу.':'Пауза. Наступний учасник сам обирає початок.';
}
setInterval(tick,1000);
$('#budget-form').addEventListener('submit',event=>{event.preventDefault();guarded(()=>{
  room=proposeBudget(room,{amountMinor:parseCHF($('#budget-amount').value),weights:names.map(id=>Number($(`#weight-${id}`).value)),purpose:$('#budget-purpose').value,deadline:new Date($('#budget-deadline').value).getTime()},Date.now());renderBudget();
});});
function renderBudget(){const target=$('#budget-proposal');target.replaceChildren();if(!room.proposal)return;
  const p=room.proposal,summary=node('div',undefined,'budget-shares');summary.append(node('p',`Версія ${p.revision} · ${money(p.amountMinor)} · до ${new Date(p.deadline).toLocaleString()}`),node('p',p.purpose));
  room.members.forEach((m,i)=>{const row=node('div');row.append(node('span',m.name),node('b',money(p.shares[i])));summary.append(row);});target.append(summary);
  const status=node('p',undefined,'budget-state');status.id='budget-state';status.setAttribute('role','status');target.append(status);
  for(const m of room.members){const form=node('form',undefined,'budget-vote'),label=node('label',`Записати відповідь ${m.name}`),select=node('select');select.setAttribute('aria-label',`Відповідь ${m.name}`);
    for(const [value,title]of Object.entries(choices)){const option=node('option',title);option.value=value;select.append(option);}select.value=p.votes[m.id]?.choice||'abstain';label.append(select);
    const button=node('button','Записати відповідь');button.type='submit';const note=node('p',p.votes[m.id]?`Записано: ${choices[p.votes[m.id].choice]}`:'Відповіді ще немає.');form.append(label,button,note);
    form.addEventListener('submit',event=>{event.preventDefault();guarded(()=>{room=voteBudget(room,m.id,select.value,Date.now());renderBudget();});});target.append(form);
  }updateBudgetStatus();
}
$('#export-room').addEventListener('click',()=>guarded(()=>{
  const blob=new Blob([exportRoom(room,$('#export-chat').checked)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='synera-triangle-local-notes.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}));

// Clearly fictional public examples. They are never mixed with authenticated profiles.
const people=[{id:'mara',name:'Mara',visible:true,offers:['дизайн'],needs:['код'],x:25,y:29,glyph:'◇',role:'Product designer'},
  {id:'leo',name:'Leo',visible:true,offers:['продажі'],needs:['дизайн'],x:68,y:32,glyph:'↗',role:'B2B partnerships'},
  {id:'noor',name:'Noor',visible:true,offers:['код'],needs:['продажі'],x:50,y:68,glyph:'⌘',role:'Software maker'}];
const opportunities=[...people.map(p=>({...p,kind:'people'})),{id:'event',kind:'events',name:'Founder Walk',x:77,y:71,glyph:'◎',description:'Вигаданий приклад зустрічі для знайомства. Реальна дата й наявність учасників не підтверджені.'},
  {id:'project',kind:'projects',name:'Перший MVP',x:18,y:68,glyph:'△',description:'Вигаданий проєкт: дизайн + код + перші клієнти. Потрібні погоджені внески й перевірний результат.'}];
function selectOpportunity(id){const item=opportunities.find(p=>p.id===id),detail=$('#atlas-detail');detail.replaceChildren();detail.append(node('p','ВИГАДАНИЙ ПРИКЛАД','eyebrow'),node('h3',item.name));
  if(item.kind!=='people'){detail.append(node('p',item.description));return;}
  detail.append(node('p',item.role));for(const value of item.offers)detail.append(node('span',`Дає: ${value}`,'atlas-detail-tag'));for(const value of item.needs)detail.append(node('span',`Шукає: ${value}`,'atlas-detail-tag'));
  for(const match of complimentarySkills(people,id)){const card=node('div',undefined,'complement');card.append(node('b',match.name),node('p',[match.gives.length?`Може дати: ${match.gives.join(', ')}.`:'',match.receives.length?`Може отримати: ${match.receives.join(', ')}.`:''].filter(Boolean).join(' ')));detail.append(card);}
  detail.append(node('p','Це відповідність заявлених навичок. Інтерес, компетентність і згода на знайомство ще потребують підтвердження.','subtle'));
  const conversation=node('a',`Почати розмову з ${item.name} ↗`,'primary');conversation.href='/studio-journey.html?person='+encodeURIComponent(item.id);detail.append(conversation);
}
function renderAtlas(){const layers=new Set(all('[data-layer]:checked').map(el=>el.dataset.layer));$('#atlas-markers').replaceChildren();$('#atlas-list').replaceChildren();
  for(const item of opportunities.filter(p=>layers.has(p.kind))){const marker=node('button',undefined,'atlas-marker');marker.type='button';marker.dataset.kind=item.kind;marker.style.left=`${item.x}%`;marker.style.top=`${item.y}%`;marker.setAttribute('aria-label',`${item.name} · вигаданий приклад`);marker.append(node('span',item.glyph),node('small',item.name));marker.addEventListener('click',()=>selectOpportunity(item.id));$('#atlas-markers').append(marker);
    const list=node('button',item.name);list.type='button';list.addEventListener('click',()=>selectOpportunity(item.id));$('#atlas-list').append(list);
  }
}
for(const check of all('[data-layer]'))check.addEventListener('change',renderAtlas);renderAtlas();
for(let i=0;i<3;i++){const group=node('div',undefined,'place-row'),label=node('label',`Місце ${i+1}`),input=node('input');input.id=`place-${i}`;input.required=true;input.maxLength=150;input.placeholder='Введи назву або адресу';label.append(input);group.append(label);
  const fields=node('div',undefined,'weight-fields');for(let j=0;j<3;j++){const l=node('label',`Учасник ${j+1}, хв`),n=node('input');n.type='number';n.min=0;n.max=240;n.required=true;n.id=`minutes-${i}-${j}`;l.append(n);fields.append(l);}group.append(fields);
  const c=node('label','Влаштовує всіх: доступність, ціна, уподобання','studio-check'),check=node('input');check.type='checkbox';check.id=`acceptable-${i}`;c.prepend(check);group.append(c);$('#place-inputs').append(group);
}
$('#place-form').addEventListener('submit',event=>{event.preventDefault();guarded(()=>{
  const result=chooseMeetingPlace([0,1,2].map(i=>({name:$(`#place-${i}`).value,minutes:[0,1,2].map(j=>Number($(`#minutes-${i}-${j}`).value)),acceptable:$(`#acceptable-${i}`).checked})),names.map(id=>Number($(`#limit-${id}`).value)));
  const p=$('#place-result');p.replaceChildren();p.dataset.state=result.status;
  if(!result.candidate){p.textContent='Немає місця, яке проходить усі задані межі. Змініть час, побажання або список місць.';return;}
  const c=result.candidate;p.append(node('span',`Пропозиція: ${c.name}. Ваші оцінки: ${c.minutes.join(' / ')} хв. Найдовший шлях: ${c.max} хв. `));
  const link=node('a','Перевірити маршрут у Google Maps ↗','small-link');link.href=meetingDirectionsUrl(c.name);link.target='_blank';link.rel='noopener noreferrer';p.append(link);
});});
function scenario(){guarded(()=>{
  const members=Number($('#scenario-members').value);$('#scenario-members-value').value=members;
  const loads=members*Number($('#scenario-loads').value),matrixElements=members*Number($('#scenario-meetings').value)*30;
  const cost=googleMapScenario({loads,matrixElements});$('#map-cost').textContent=`Сценарій: ${members} учасників · ${loads} завантажень · ${matrixElements} елементів матриці. Карта: $${cost.mapUSD.toFixed(2)} + матриця: $${cost.matrixUSD.toFixed(2)} = $${cost.totalUSD.toFixed(2)} USD / місяць. Інші витрати невідомі.`;
});}
for(const input of all('#pane-launch input'))input.addEventListener('input',scenario);scenario();
