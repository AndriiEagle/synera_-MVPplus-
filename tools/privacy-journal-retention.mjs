// Integration seam for the agents lane. Pure, local, no files or network.
export const JOURNAL_RETENTION_DAYS = 30;
export function purgeExpiredJournal(sessions, now = Date.now()) {
  if (!sessions || Array.isArray(sessions) || typeof sessions !== 'object' || !Number.isFinite(now)) throw Error('Invalid journal retention input');
  const kept = {}, expired = [];
  for (const [id, session] of Object.entries(sessions)) {
    const instants = [...(session?.messages || []), ...(session?.events || [])].map(item => Date.parse(item.at));
    instants.push(Date.parse(session?.case?.updatedAt), Date.parse(session?.case?.createdAt));
    const lastWrite = Math.max(...instants.filter(Number.isFinite));
    // Invalid/undated runtime entries cannot claim indefinite retention.
    if (!Number.isFinite(lastWrite) || now - lastWrite >= JOURNAL_RETENTION_DAYS * 86400000) expired.push(id);
    else kept[id] = session;
  }
  return { sessions: kept, expired };
}
