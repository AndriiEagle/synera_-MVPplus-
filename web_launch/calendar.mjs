// RFC 5545 text-only invitation: no auto email, addresses, alarms or external URLs.
const escaped = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, v => '\\' + v);
const stamp = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function fold(line) {
  const result = []; let part = '', bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 73) { result.push(part); part = ' '; bytes = 1; }
    part += char; bytes += size;
  }
  result.push(part); return result.join('\r\n');
}
export function meetingCalendar(meeting, now = new Date()) {
  if (meeting.status !== 'accepted' || !Number.isFinite(Date.parse(meeting.proposed_at)) || ![20, 30, 60].includes(meeting.duration_minutes) || !/^[a-z0-9-]{1,40}$/i.test(meeting.id)) throw new Error('До календаря можна додати лише прийняту зустріч із погодженим часом.');
  const until = new Date(Date.parse(meeting.proposed_at) + meeting.duration_minutes * 60000);
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Synera//Meetings//UK', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:' + meeting.id + '@synera', 'DTSTAMP:' + stamp(now), 'DTSTART:' + stamp(meeting.proposed_at), 'DTEND:' + stamp(until),
    'SUMMARY:Synera — розмова про співпрацю', 'LOCATION:' + escaped(meeting.meeting_place), 'DESCRIPTION:' + escaped(meeting.note),
    'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
}
