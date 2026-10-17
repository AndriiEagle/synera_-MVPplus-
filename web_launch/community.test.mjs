import test from 'node:test';
import assert from 'node:assert/strict';
import { postCommunityCase, joinCommunityCase, organizerCanSeeContacts, boardCaseView } from './community.mjs';

const boards = () => [{ boardId: 'b-1', organizerId: 'org-1', cases: [] }];

test('C10.L4: публікація кейсу однією стороною; дубль заборонений', () => {
  const first = postCommunityCase(boards(), { boardId: 'b-1', caseId: 'c-1', authorId: 'a-1', title: 'Дизайн інтерфейсу' });
  assert.equal(first.valid, true);
  assert.equal(first.boards[0].cases.length, 1);
  const duplicate = postCommunityCase(first.boards, { boardId: 'b-1', caseId: 'c-1', authorId: 'a-1', title: 'Дубль' });
  assert.equal(duplicate.reason, 'CASE_ALREADY_POSTED');
});

test('C10.L4: друга сторона підключається; автор не може приєднатися до власного кейсу', () => {
  let board = postCommunityCase(boards(), { boardId: 'b-1', caseId: 'c-1', authorId: 'a-1', title: 'T' }).boards;
  const own = joinCommunityCase(board, { boardId: 'b-1', caseId: 'c-1', participantId: 'a-1' });
  assert.equal(own.reason, 'AUTHOR_CANNOT_JOIN_OWN_CASE');
  const joined = joinCommunityCase(board, { boardId: 'b-1', caseId: 'c-1', participantId: 'b-1' });
  assert.equal(joined.valid, true);
  assert.equal(joined.boards[0].cases[0].joinedBy, 'b-1');
  const twice = joinCommunityCase(joined.boards, { boardId: 'b-1', caseId: 'c-1', participantId: 'c-1' });
  assert.equal(twice.reason, 'CASE_ALREADY_JOINED');
});

test('C10.L4: контакти організатору лише при взаємній згоді (gate)', () => {
  assert.equal(organizerCanSeeContacts({ authorConsent: true, joinerConsent: false }), false);
  assert.equal(organizerCanSeeContacts({ authorConsent: false, joinerConsent: true }), false);
  assert.equal(organizerCanSeeContacts({}), false);
  assert.equal(organizerCanSeeContacts({ authorConsent: true, joinerConsent: true }), true);
});

test('C10.L4: картка на дошці без контактів, доки нема згоди', () => {
  const board = { boardId: 'b-1', cases: [{ caseId: 'c-1', authorId: 'a-1', title: 'T', joinedBy: 'b-1', consents: { authorConsent: true, joinerConsent: false }, contacts: { email: 'x@example.invalid' } }] };
  const hidden = boardCaseView(board, 'c-1');
  assert.equal(hidden.contactsVisible, false);
  assert.equal(hidden.contacts, null);
  const revealed = boardCaseView({ ...board, cases: [{ ...board.cases[0], consents: { authorConsent: true, joinerConsent: true } }] }, 'c-1');
  assert.equal(revealed.contactsVisible, true);
  assert.deepEqual(revealed.contacts, { email: 'x@example.invalid' });
});

test('C10.L4: некоректний вхід — reason codes, не throw', () => {
  assert.equal(postCommunityCase('nope', { boardId: 'b-1', caseId: 'c-1', authorId: 'a-1', title: 'T' }).reason, 'INVALID_BOARDS');
  assert.equal(postCommunityCase(boards(), { boardId: 'nope', caseId: 'c-1', authorId: 'a-1', title: 'T' }).reason, 'BOARD_NOT_FOUND');
  assert.equal(postCommunityCase(boards(), { boardId: 'b-1', caseId: 'c-1', authorId: 'a-1', title: '' }).reason, 'INVALID_TITLE');
  assert.equal(joinCommunityCase(boards(), { boardId: 'b-1', caseId: 'c-1', participantId: 'b-1' }).reason, 'CASE_NOT_FOUND');
  assert.equal(joinCommunityCase(boards(), { boardId: 'nope', caseId: 'c-1', participantId: 'b-1' }).reason, 'BOARD_NOT_FOUND');
  assert.equal(boardCaseView(null, 'c-1').reason, 'INVALID_BOARD');
  assert.equal(boardCaseView({ cases: [] }, 'nope').reason, 'CASE_NOT_FOUND');
});