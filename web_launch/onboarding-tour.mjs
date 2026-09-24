export const TOUR_STORAGE_KEY = 'synera.first-user-tour.v1';

export const TOUR_STEPS = Object.freeze([
  { target: '[data-tour="identity"]', title: 'Твій профіль — під твоїм контролем', body: 'Почни зі входу за запрошенням. Правила підтверджуються окремо; видимість профілю не вмикається автоматично.' },
  { target: '[data-tour="offer"]', title: 'Що ти даєш', body: 'Опиши конкретну сильну сторону й приклад. Це причина для розмови, а не рейтинг твоєї цінності.' },
  { target: '[data-tour="need"]', title: 'Що шукаєш', body: 'Назви потрібний зараз результат. Synera показує лише пояснювані перетини «даю ↔ шукаю».' },
  { target: '[data-tour="conditions"]', title: 'Умови й запрошення', body: 'Ти керуєш видимістю та умовами. Контакт відкривається тільки після двох окремих «так», без автоматичних відправлень.' },
  { target: '[data-tour="result"]', title: 'Малий перший результат', body: 'Зафіксуй перевірюваний перший крок для обох сторін. Приклади в інтерфейсі синтетичні — вони не обіцяють збіг чи угоду.' },
]);

function validStep(index) { return Number.isInteger(index) && index >= 0 && index < TOUR_STEPS.length; }
export function nextTourStep(index, direction) { return Math.max(0, Math.min(TOUR_STEPS.length - 1, index + direction)); }
export function shouldOfferTour(storage) { try { return storage?.getItem(TOUR_STORAGE_KEY) !== 'done'; } catch { return true; } }

export function installOnboardingTour({ document: doc = document, storage = window.localStorage } = {}) {
  const replay = doc.querySelector('#tour-start');
  let index = 0, activeTarget;
  const overlay = doc.createElement('div'); overlay.className = 'tour-overlay'; overlay.hidden = true;
  const panel = doc.createElement('aside'); panel.className = 'tour-panel'; panel.hidden = true; panel.setAttribute('role', 'region'); panel.setAttribute('aria-live', 'polite');
  const eyebrow = doc.createElement('p'); eyebrow.className = 'eyebrow';
  const title = doc.createElement('h2'); const body = doc.createElement('p');
  const actions = doc.createElement('div'); actions.className = 'actions';
  const back = doc.createElement('button'); back.type = 'button'; back.textContent = 'Назад';
  const next = doc.createElement('button'); next.type = 'button';
  const skip = doc.createElement('button'); skip.type = 'button'; skip.className = 'quiet'; skip.textContent = 'Пропустити';
  actions.append(back, next, skip); panel.append(eyebrow, title, body, actions); doc.body.append(overlay, panel);
  const finish = completed => {
    activeTarget?.classList.remove('tour-target'); activeTarget = null; overlay.hidden = panel.hidden = true; doc.documentElement.classList.remove('tour-active');
    if (completed) try { storage?.setItem(TOUR_STORAGE_KEY, 'done'); } catch { /* a replay remains available */ }
    replay?.focus();
  };
  const render = () => {
    const step = TOUR_STEPS[index], target = doc.querySelector(step.target);
    if (!target) { finish(false); return; }
    activeTarget?.classList.remove('tour-target'); activeTarget = target; activeTarget.classList.add('tour-target');
    doc.documentElement.classList.add('tour-active'); overlay.hidden = panel.hidden = false;
    eyebrow.textContent = `КРОК ${index + 1} / ${TOUR_STEPS.length}`; title.textContent = step.title; body.textContent = step.body;
    back.disabled = index === 0; next.textContent = index === TOUR_STEPS.length - 1 ? 'Завершити' : 'Далі';
    target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const start = () => { index = 0; render(); };
  replay?.addEventListener('click', start); back.addEventListener('click', () => { index = nextTourStep(index, -1); render(); });
  next.addEventListener('click', () => { if (index === TOUR_STEPS.length - 1) finish(true); else { index = nextTourStep(index, 1); render(); } });
  skip.addEventListener('click', () => finish(true));
  doc.addEventListener('keydown', event => { if (panel.hidden) return; if (event.key === 'Escape') { event.preventDefault(); finish(true); } if (event.key === 'ArrowRight') { event.preventDefault(); next.click(); } if (event.key === 'ArrowLeft' && index) { event.preventDefault(); back.click(); } });
  if (shouldOfferTour(storage)) setTimeout(start, 250);
  return { start, finish, get index() { return index; } };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') installOnboardingTour();
