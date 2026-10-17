// C10.L4 — Сторінки спільнот/організаторів: кейс публікує одна сторона, друга підключається за згодою.
// Gate: consent-gated; організатор не бачить контактів доти, доки обидва не погодяться.
// Детерміновано, чисто.

const VALID_ID = value => typeof value === 'string' && value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9_:-]+$/.test(value);

/** Дошка спільноти: організатор запрошує когорту; кейс публікує одна сторона. */
export function postCommunityCase(boards, { boardId, caseId, authorId, title } = {}) {
  if (!Array.isArray(boards)) return { valid: false, reason: 'INVALID_BOARDS' };
  if (!VALID_ID(boardId) || !VALID_ID(caseId) || !VALID_ID(authorId)) return { valid: false, reason: 'INVALID_IDS' };
  if (typeof title !== 'string' || !title.trim() || title.length > 120) return { valid: false, reason: 'INVALID_TITLE' };
  const existing = boards.find(board => board.boardId === boardId);
  if (!existing) return { valid: false, reason: 'BOARD_NOT_FOUND' };
  const duplicate = existing.cases.some(posted => posted.caseId === caseId);
  if (duplicate) return { valid: false, reason: 'CASE_ALREADY_POSTED' };
  const next = boards.map(board => board.boardId === boardId
    ? { ...board, cases: [...board.cases, { caseId, authorId, title: title.trim(), joinedBy: null }] }
    : board);
  return { valid: true, boards: next };
}

/** Друга сторона підключається ДО опублікованого кейсу; контакти лишаються приховані. */
export function joinCommunityCase(boards, { boardId, caseId, participantId } = {}) {
  if (!Array.isArray(boards)) return { valid: false, reason: 'INVALID_BOARDS' };
  const board = boards.find(entry => entry.boardId === boardId);
  if (!board) return { valid: false, reason: 'BOARD_NOT_FOUND' };
  const posted = board.cases.find(entry => entry.caseId === caseId);
  if (!posted) return { valid: false, reason: 'CASE_NOT_FOUND' };
  if (posted.authorId === participantId) return { valid: false, reason: 'AUTHOR_CANNOT_JOIN_OWN_CASE' };
  if (posted.joinedBy) return { valid: false, reason: 'CASE_ALREADY_JOINED' };
  const next = boards.map(entry => entry.boardId === boardId
    ? { ...entry, cases: entry.cases.map(item => item.caseId === caseId ? { ...item, joinedBy: participantId } : item) }
    : entry);
  return { valid: true, boards: next };
}

/**
 * Контакти організатору: лише коли обидва учасники дали окрему згоду.
 * Згода дається парами учасників, не організатору напряму.
 */
export function organizerCanSeeContacts({ authorConsent, joinerConsent } = {}) {
  return authorConsent === true && joinerConsent === true;
}

/** Видима картка кейсу на дошці: без контактів, поки нема взаємної згоди. */
export function boardCaseView(board, caseId) {
  if (!board || typeof board !== 'object') return { valid: false, reason: 'INVALID_BOARD' };
  const posted = (board.cases ?? []).find(entry => entry.caseId === caseId);
  if (!posted) return { valid: false, reason: 'CASE_NOT_FOUND' };
  const consent = organizerCanSeeContacts(posted.consents ?? {});
  return {
    valid: true,
    caseId: posted.caseId,
    title: posted.title,
    authorId: posted.authorId,
    joinedBy: posted.joinedBy,
    contactsVisible: consent,
    contacts: consent ? (posted.contacts ?? null) : null,
  };
}