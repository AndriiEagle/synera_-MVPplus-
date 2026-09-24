export const DEMO_STEPS = Object.freeze([
  { title: '1. Двоє вигаданих людей', body: 'Марія (дизайн продукту) шукає 3 B2B-розмови. Олексій (B2B-продажі) шукає короткий аудит воронки. Це синтетичний приклад, не профілі учасників.', action: 'Показати взаємну користь' },
  { title: '2. Причина для розмови в обидва боки', body: 'Марія може дати аудит воронки; Олексій може організувати 3 розмови. Synera пояснює цей перетин, але не оцінює людей і не гарантує результат.', action: 'Перевірити умови' },
  { title: '3. Умови до контакту', body: 'Приклад: 90 хвилин на кожну сторону, термін до п’ятниці, результат і критерій прийняття узгоджують обидві людини. У реальному пілоті потрібні окремі згоди.', action: 'Підготувати чернетку запрошення' },
  { title: '4. Чернетка — не відправлення', body: 'Чернетку можна переглянути й змінити. Тут нічого не відправляється, не створюється і не записується для реальних людей.', action: 'Почати спочатку' },
]);

export function nextDemoStep(index) { return (index + 1) % DEMO_STEPS.length; }
export function demoInvitationDraft() { return 'Чернетка для синтетичного прикладу: Марія робить короткий аудит воронки, Олексій організовує 3 B2B-розмови. Обидві сторони спершу погоджують час, результат і критерій прийняття. НЕ ВІДПРАВЛЕНО.'; }

export function installDemoJourney({ document: doc = document } = {}) {
  const target = doc.querySelector('#demo-journey-stage'); if (!target) return null;
  let index = 0;
  const render = () => {
    const step = DEMO_STEPS[index]; target.replaceChildren();
    const heading = doc.createElement('h3'); heading.textContent = step.title;
    const body = doc.createElement('p'); body.textContent = step.body;
    target.append(heading, body);
    if (index === DEMO_STEPS.length - 1) {
      const draft = doc.createElement('textarea'); draft.readOnly = true; draft.rows = 4; draft.value = demoInvitationDraft(); draft.setAttribute('aria-label', 'Чернетка синтетичного запрошення, не відправлено');
      const marker = doc.createElement('p'); marker.className = 'demo-unsent'; marker.textContent = 'НЕ ВІДПРАВЛЕНО · лише локальна демонстрація'; target.append(draft, marker);
    }
    const button = doc.createElement('button'); button.type = 'button'; button.textContent = step.action; button.addEventListener('click', () => { index = nextDemoStep(index); render(); }); target.append(button);
  };
  render(); return { get index() { return index; }, next: () => { index = nextDemoStep(index); render(); } };
}
if (typeof document !== 'undefined') installDemoJourney();
