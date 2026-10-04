// GEO-01 UI for an accepted meeting: static navigation (no GPS) + this person's own location grant.
// DOM only; all rules live in live-location.mjs. Nothing here reads the device position.
import { createLocationGrant, revokeLocationGrant, viewLocation, locationEligibility, staticNavigationUrl, meetingDirectionsUrl, LOCATION_PRECISIONS, LOCATION_LEAD_MINUTES } from './live-location.mjs';

const REASON_TEXT = {
  REVOKED: 'Твій попередній дозвіл відкликано; позицію не збережено.',
  MEETING_CLOSED: 'Зустріч закрито, тож дозвіл закрито разом із нею.',
  EXPIRED: 'Час дозволу минув.',
};
const PRECISION_TEXT = { approximate: 'приблизно (~500 м)', exact: 'точніше (~50 м)' };

export function meetingLocationSection({ doc = document, meeting, viewerId, otherName, grant = null, now = new Date().toISOString(), onChange = () => {}, live = null, addressAgreementRequired = false }) {
  if (live) grant = live.state.own;
  const eligibility = locationEligibility(meeting);
  if (meeting?.status !== 'accepted' || eligibility.reason === 'ONLINE_MEETING') return null;
  const el = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const time = iso => new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const box = el('details', undefined, 'meeting-location');
  box.dataset.meetingId = meeting.id;
  box.dataset.savedAddress = meeting.meeting_address || '';
  box.append(el('summary', 'Місце і навігація перед зустріччю'));
  if (addressAgreementRequired) {
    const link = el('a', 'Погодити адресу в приватній розмові'); link.href = '/real-journey.html';
    box.append(link, el('p', 'Місце й маршрут доступні після окремого погодження обох. У розмові відкрий потрібну зустріч і картку адреси.', 'fine'));
  }
  if (live && !addressAgreementRequired) {
    const addressForm = el('form'), addressLabel = el('label', 'Узгоджена адреса зустрічі');
    const address = el('input'); address.name = 'meeting-address'; address.maxLength = 200; address.value = meeting.meeting_address || '';
    address.placeholder = 'Наприклад: Bahnhofplatz 15, Zürich'; addressLabel.append(address);
    const save = el('button', 'Зберегти адресу', 'quiet'); save.type = 'submit';
    save.disabled = Date.parse(meeting.proposed_at) <= Date.parse(now);
    addressForm.append(addressLabel, save);
    addressForm.addEventListener('submit', event => { event.preventDefault(); live.address(address.value.trim()); });
    box.append(addressForm, el('p', 'Адресу можна зберегти до початку зустрічі. Її зміна припиняє попередні дозволи GPS. Нову адресу погодьте у розмові.', 'fine'));
  }

  const destination = meeting.meeting_address || meeting.meeting_place;
  const url = staticNavigationUrl(destination);
  if (url && !addressAgreementRequired) {
    const line = el('p', undefined, 'meeting-nav');
    const link = el('a', 'Відкрити «' + destination + '» у Google Maps ↗');
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    line.append(link);
    const directions = el('a', 'Пішки до місця зустрічі в Google Maps ↗');
    directions.href = meetingDirectionsUrl(destination); directions.target = '_blank'; directions.rel = 'noopener noreferrer';
    line.append(doc.createElement('br'), directions);
    box.append(line, el('p', 'Працює без GPS. Точну точку зустрічі узгодьте в «Уточнити деталі»; Google Maps відкривається лише твоїм кліком.', 'fine'));
  }
  if (!eligibility.eligible) { box.append(el('p', 'Показ місця стане доступним, коли в запрошенні буде час зустрічі.', 'fine')); return box; }

  const share = el('div', undefined, 'location-grant');
  if (live) {
    share.append(el('h4', 'Місце співрозмовника: ' + otherName));
    const peer = live.state.peer, position = peer ? viewLocation(peer, { viewerId, now }) : null;
    if (position?.visible && !position.stale) {
      share.append(el('p', position.accuracy_label + ' · оновлено ' + position.age_seconds + ' с тому', 'fine location-peer'));
      const link = el('a', 'Пішки до співрозмовника в Google Maps ↗');
      link.href = meetingDirectionsUrl(position.lat + ',' + position.lon); link.target = '_blank'; link.rel = 'noopener noreferrer';
      share.append(link, el('p', 'Лише після цього кліку Google Maps отримає показану точку.', 'fine'));
    } else {
      share.append(el('p', position?.stale ? 'Позиція застаріла. Зачекай нового оновлення; маршрут до старої точки приховано.' : 'Зараз немає доступної позиції. Співрозмовник сам вирішує, чи ділитися нею.', 'fine location-peer'));
    }
    if (live.state.error) share.append(el('p', live.state.error, 'fine location-error'));
    const refresh = el('button', 'Оновити локацію', 'quiet'); refresh.type = 'button'; refresh.addEventListener('click', live.refresh); share.append(refresh);
  }
  share.append(el('h4', 'Моє місце — лише для співрозмовника (' + otherName + ')'));
  if (live?.state.eligible === false) {
    share.append(el('p', 'Показ місця недоступний. Перевір, чи зустріч і умови співпраці досі погоджені.', 'fine'));
    box.append(share); return box;
  }
  const active = grant?.status === 'active' && viewLocation(grant, { viewerId, now }).reason !== 'EXPIRED';
  if (active) {
    share.append(el('p', (live ? 'Дозвіл збережено: адресат ' : 'Згода лише в цій вкладці: адресат ') + otherName + ' · з ' + time(grant.opens_at) + ' до ' + time(grant.closes_at) + ' · ' + PRECISION_TEXT[grant.precision] + (live ? '.' : '. Координати не передаються.'), 'fine location-status'));
    if (live) {
      const sharing = live.state.capture === 'sharing' || live.state.capture === 'requesting';
      share.append(el('p', sharing ? 'GPS працює, поки Synera відкрита на екрані. Оновлення може надходити із затримкою до хвилини.' : 'GPS зупинено. Натисни «Увімкнути GPS» у межах дозволеного часу.', 'fine location-capture'));
      const start = el('button', sharing ? 'Зупинити GPS' : 'Увімкнути GPS', 'quiet'); start.type = 'button';
      start.addEventListener('click', sharing ? live.pause : live.start); share.append(start);
    }
    const revoke = el('button', 'Відкликати дозвіл', 'quiet'); revoke.type = 'button';
    revoke.addEventListener('click', () => live ? live.revoke() : onChange(revokeLocationGrant(grant, { partyId: viewerId, at: new Date().toISOString() }), 'Дозвіл відкликано; позицію не збережено.'));
    share.append(revoke);
  } else {
    if (grant) {
      const reason = viewLocation(grant, { viewerId, now }).reason;
      if (REASON_TEXT[reason]) share.append(el('p', REASON_TEXT[reason], 'fine'));
    }
    const consentLabel = el('label', undefined, 'check');
    const consent = el('input'); consent.type = 'checkbox'; consent.name = 'location-consent';
    consentLabel.append(consent, doc.createTextNode(' Я сам(а) дозволяю показати моє місце лише співрозмовнику (' + otherName + ') на час цієї зустрічі'));
    const precisionLabel = el('label', 'Точність');
    const precision = el('select'); precision.name = 'location-precision';
    for (const key of Object.keys(LOCATION_PRECISIONS)) { const option = el('option', PRECISION_TEXT[key]); option.value = key; precision.append(option); }
    precisionLabel.append(precision);
    const leadLabel = el('label', 'З якого часу');
    const lead = el('select'); lead.name = 'location-lead';
    for (const minutes of LOCATION_LEAD_MINUTES) { const option = el('option', 'за ' + minutes + ' хв до початку'); option.value = String(minutes); lead.append(option); }
    leadLabel.append(lead);
    const grantButton = el('button', 'Дозволити на час зустрічі'); grantButton.type = 'button'; grantButton.disabled = true;
    grantButton.dataset.locationConsentAction = 'true';
    consent.addEventListener('change', () => { grantButton.disabled = !consent.checked; });
    grantButton.addEventListener('click', () => {
      if (live) { live.grant({ precision: precision.value, leadMinutes: Number(lead.value), consent: consent.checked }); return; }
      const next = createLocationGrant({ meeting, grantorId: viewerId, precision: precision.value, leadMinutes: Number(lead.value), consent: consent.checked, now: new Date().toISOString() });
      onChange(next, 'Згоду зафіксовано лише в цій вкладці. Координати співрозмовнику не передаються.');
    });
    const pair = el('div', undefined, 'form-pair'); pair.append(precisionLabel, leadLabel);
    share.append(consentLabel, pair, grantButton);
  }
  share.append(el('p', live ? 'Показ місця — добровільний і лише для цього співрозмовника. Після відкликання, блокування або скасування зустрічі доступ припиняється. Остання точка автоматично видаляється не пізніше кінця дозволу. У фоні та після виходу GPS зупиняється; остання точка може залишатися до відкликання або кінця дозволу. Взаємність не обов’язкова.' : 'Живий GPS у цьому релізі ще вимкнено політикою браузера. Дозвіл фіксує лише твою згоду, адресата, строк і точність. ' + otherName + ' сам(а) вирішує, чи ділитися своїм місцем — взаємність не обов’язкова.', 'fine'));
  box.append(share);
  return box;
}
