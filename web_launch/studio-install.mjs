let pending;
const button=document.querySelector('#install-studio'),status=document.querySelector('#install-status');
const tell=text=>{status.textContent=text;};
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;button.hidden=false;});
button.addEventListener('click',async()=>{if(!pending)return;const prompt=pending;pending=null;button.hidden=true;await prompt.prompt();});
window.addEventListener('appinstalled',()=>{button.hidden=true;tell('Studio встановлена. Дані залишаються на цьому пристрої; мережевої кімнати немає.');});
document.querySelector('#install-help').addEventListener('click',()=>tell('Android: відкрий цю сторінку у Chrome → меню → Встановити застосунок / Додати на головний екран. iPhone: Safari → Поділитися → На початковий екран. Це PWA, без APK і без магазину.'));
if('serviceWorker' in navigator && isSecureContext)navigator.serviceWorker.register('/studio-sw.mjs',{type:'module',scope:'/studio',updateViaCache:'none'}).catch(()=>tell('Офлайн-оболонка недоступна. Онлайн-студія працює; незбережені нотатки залишаються лише у вкладці.'));
window.addEventListener('offline',()=>tell('Офлайн. Працюй із локальною сесією; експортуй файл або явно збережи її на пристрої.'));
// No automatic reload: an update must never discard an unsaved session.
