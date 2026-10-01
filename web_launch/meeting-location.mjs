// GEO-01 UI for an accepted meeting: static navigation (no GPS) + this person's own location grant.
// DOM only; all rules live in live-location.mjs. Nothing here reads the device position.
import { createLocationGrant, revokeLocationGrant, viewLocation, locationEligibility, staticNavigationUrl, meetingDirectionsUrl, LOCATION_PRECISIONS, LOCATION_LEAD_MINUTES } from './live-location.mjs';

const REASON_TEXT = {
  REVOKED: 'Твій попередній дозвіл відкликано; позицію не збережено.',
  MEETING_CLOSED: 'Зустріч закрито, тож дозвіл закрито разом із нею.',
  EXPIRED: 'Час дозволу минув.',
};
const PRECISION_TEXT = { approximate: 'приблизно (~500 м)', exact: 'точніше (~50 м)' };

export function meetingLocationSection({ doc = document, meeting, viewerId, otherName, grant = null, now = new Date().toISOString(), onChange = () => {} }) {
  const eligibility = locationEligibility(meeting);
  if (meeting?.status !== 'accepted' || eligibility.reason === 'ONLINE_MEETING') return null;
  const el = (tag, text, className) => { const node = doc.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  const time = iso => new Intl.DateTimeFormat('uk-UA', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  const box = el('details', undefined, 'meeting-location');
  box.dataset.meetingId = meeting.id;
  box.append(el('summary', 'Місце і навігація перед зустріччю'));

  const url = staticNavigationUrl(meeting.meeting_place);
  if (url) {
    const line = el('p', undefined, 'meeting-nav');
    const link = el('a', 'Відкрити «' + meeting.meeting_place + '» у Google Maps ↗');
    link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    line.append(link);
    const directions = el('a', 'Пішки до місця зустрічі в Google Maps ↗');
    directions.href = meetingDirectionsUrl(meeting.meeting_place); directions.target = '_blank'; directions.rel = 'noopener noreferrer';
    line.append(doc.createElement('br'), directions);
    box.append(line, el('p', 'Працює без GPS. Точну точку зустрічі узгодьте в «Уточнити деталі»; Google Maps відкривається лише твоїм кліком.', 'fine'));
  }
  if (!eligibility.eligible) { box.append(el('p', 'Показ місця стане доступним, коли в запрошенні буде час зустрічі.', 'fine')); return box; }

  const share = el('div', undefined, 'location-grant');
  share.append(el('h4', 'Моє місце — лише для співрозмовника (' + otherName + ')'));
  const active = grant?.status === 'active' && viewLocation(grant, { viewerId, now }).reason !== 'EXPIRED';
  if (active) {
    share.append(el('p', 'Згода лише в цій вкладці: адресат ' + otherName + ' · з ' + time(grant.opens_at) + ' до ' + time(grant.closes_at) + ' · ' + PRECISION_TEXT[grant.precision] + '. Координати не передаються.', 'fine location-status'));
    const revoke = el('button', 'Відкликати дозвіл', 'quiet'); revoke.type = 'button';
    revoke.addEventListener('click', () => onChange(revokeLocationGrant(grant, { partyId: viewerId, at: new Date().toISOString() }), 'Дозвіл відкликано; позицію не збережено.'));
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
    consent.addEventListener('change', () => { grantButton.disabled = !consent.checked; });
    grantButton.addEventListener('click', () => {
      const next = createLocationGrant({ meeting, grantorId: viewerId, precision: precision.value, leadMinutes: Number(lead.value), consent: consent.checked, now: new Date().toISOString() });
      onChange(next, 'Згоду зафіксовано лише в цій вкладці. Координати співрозмовнику не передаються.');
    });
    const pair = el('div', undefined, 'form-pair'); pair.append(precisionLabel, leadLabel);
    share.append(consentLabel, pair, grantButton);
  }
  share.append(el('p', 'Живий GPS у цьому релізі ще вимкнено політикою браузера. Дозвіл фіксує лише твою згоду, адресата, строк і точність. ' + otherName + ' сам(а) вирішує, чи ділитися своїм місцем — взаємність не обов’язкова.', 'fine'));
  box.append(share);
  return box;
}
