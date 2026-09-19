import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonStore } from './neon-store.mjs';
import {
  createCaseState,
  approveCase,
  reviseCase,
} from './business-case.mjs';
import {
  filterProfileForAudience,
  resolveViewerAudienceLevel,
} from './field-audience.mjs';

test('C13.L3: complete scripted E2E lifecycle against mock Neon backend', async () => {
  const userA = { id: 'u-solopreneur-a', email: 'party-a@example.com' };
  const userB = { id: 'u-designer-b', email: 'party-b@example.com' };

  // Mock Neon database tables
  const db = {
    cases: new Map(),
    approvals: new Map(),
    profiles: new Map([
      [userA.id, {
        id: userA.id,
        display_name: 'Solopreneur A',
        city: 'Zurich',
        offers: 'Backend development, automated testing',
        seeks: 'Design & branding for Swiss launch',
        contact_email: 'party-a@example.com',
        contact_phone: '+41 44 123 4567',
        private_notes: 'Target launch Q4',
        is_discoverable: true,
      }],
      [userB.id, {
        id: userB.id,
        display_name: 'Designer B',
        city: 'Geneva',
        offers: 'Design & branding for Swiss launch',
        seeks: 'Backend development, automated testing',
        contact_email: 'party-b@example.com',
        contact_phone: '+41 22 765 4321',
        private_notes: 'Available 10h/week',
        is_discoverable: true,
      }],
    ]),
  };

  // Mock fetch mimicking Neon gateway worker routing
  let activeUser = userA;
  const mockFetch = async (path, init = {}) => {
    const url = new URL(path, 'http://localhost');
    const pathname = url.pathname;
    const method = init.method || 'GET';

    if (pathname === '/api/neon/session') {
      return new Response(JSON.stringify({ user: activeUser }));
    }

    if (pathname === '/api/neon/health') {
      return new Response(JSON.stringify({ status: 'healthy', backend: 'neon' }));
    }

    if (pathname === '/api/neon/data/profiles') {
      const all = Array.from(db.profiles.values()).filter(p => p.id !== activeUser?.id);
      return new Response(JSON.stringify(all));
    }

    if (pathname === '/api/neon/data/match_cases') {
      if (method === 'POST') {
        const body = JSON.parse(init.body);
        db.cases.set(body.case_id, body.state);
        return new Response(null, { status: 204 });
      }
      const caseIdParam = url.searchParams.get('case_id');
      const caseId = caseIdParam?.replace('eq.', '');
      const item = db.cases.get(caseId);
      return new Response(JSON.stringify(item ? [{ state: item }] : []));
    }

    if (pathname === '/api/neon/data/match_case_approvals') {
      if (method === 'POST') {
        const body = JSON.parse(init.body);
        db.approvals.set(`${body.case_id}:${body.party_id}`, body);
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(Array.from(db.approvals.values())));
    }

    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  };

  // 1. Initialize store & restore session for Party A
  const storeA = new NeonStore({
    backend: 'neon',
    pilotSafetyEnabled: true,
    realPilotEnabled: true,
  }, mockFetch);

  const restoredA = await storeA.restore();
  assert.equal(restoredA, true, 'Party A session restored');
  assert.equal(storeA.user.id, userA.id);

  // 2. Discover partner profiles
  const discovered = await storeA.discover();
  assert.equal(discovered.length, 1);
  assert.equal(discovered[0].id, userB.id);

  // 3. Bilateral privacy check before meeting
  const partyBFull = db.profiles.get(userB.id);
  const initialContext = {
    isOwner: false,
    inCommunity: true,
    hasMet: false,
  };
  const initialLevel = resolveViewerAudienceLevel(initialContext);
  assert.equal(initialLevel, 'community', 'Audience level is community prior to meeting');

  const filteredBForA = filterProfileForAudience(partyBFull, initialContext);
  assert.equal(filteredBForA.display_name, 'Designer B');
  assert.equal(filteredBForA.offers, 'Design & branding for Swiss launch');
  assert.equal(filteredBForA.contact_email, undefined, 'Direct email hidden before meeting');
  assert.equal(filteredBForA.contact_phone, undefined, 'Phone hidden before meeting');
  assert.equal(filteredBForA.private_notes, undefined, 'Private notes hidden');

  // 4. Bilateral case creation
  const now = '2026-09-19T14:00:00.000Z';
  const expiresAt = '2026-10-19T14:00:00.000Z';
  const caseId = 'case-solopreneur-a-b';
  const initialMaterial = {
    mode: 'exchange',
    components: ['exchange'],
    outcomes: [
      { receiver_id: userA.id, capability_tag: 'design', target: 'Brand identity and UI kit delivered' },
      { receiver_id: userB.id, capability_tag: 'automation', target: 'REST API & database layer deployed' },
    ],
    terms: {
      cancellation: 'mutual_written_notice',
      confidentiality: 'required',
      intellectual_property: 'shared',
      revision_limit: 3,
    },
    trial: {
      starts_on: '2026-09-20',
      due_on: '2026-09-30',
      deliverables: [
        {
          giver_id: userB.id,
          receiver_id: userA.id,
          capability_tag: 'design',
          target: 'Figma prototype of home & profile views',
          acceptance_criteria: 'Solopreneur A reviews responsive fidelity',
        },
        {
          giver_id: userA.id,
          receiver_id: userB.id,
          capability_tag: 'automation',
          target: 'Working Node.js server with health check',
          acceptance_criteria: 'Designer B checks local dev startup',
        },
      ],
    },
    compensation: { status: 'agreed_none' },
  };

  let caseState = await createCaseState({
    caseId,
    participants: [userA.id, userB.id],
    material: initialMaterial,
    now,
    expiresAt,
  });

  assert.equal(caseState.status, 'draft');
  assert.equal(caseState.version, 1);
  assert.ok(caseState.termsHash);

  // Save initial case state via store A to Neon
  await storeA.saveCaseState(caseState);
  assert.ok(db.cases.has(caseId), 'Case stored in Neon mock');

  // 5. Party A approves
  const approveTimeA = '2026-09-19T14:05:00.000Z';
  caseState = approveCase(caseState, {
    partyId: userA.id,
    termsHash: caseState.termsHash,
    now: approveTimeA,
  });
  await storeA.saveCaseState(caseState);
  assert.ok(db.approvals.has(`${caseId}:${userA.id}`), 'Approval recorded in Neon table');

  // 6. Party B signs in & approves
  activeUser = userB;
  const storeB = new NeonStore({
    backend: 'neon',
    pilotSafetyEnabled: true,
    realPilotEnabled: true,
  }, mockFetch);
  await storeB.restore();
  assert.equal(storeB.user.id, userB.id);

  const loadedStateForB = await storeB.caseState(caseId);
  assert.equal(loadedStateForB.status, 'awaiting_approval');

  const approveTimeB = '2026-09-19T14:10:00.000Z';
  caseState = approveCase(loadedStateForB, {
    partyId: userB.id,
    termsHash: loadedStateForB.termsHash,
    now: approveTimeB,
  });
  await storeB.saveCaseState(caseState);

  const mutualState = await storeB.caseState(caseId);
  assert.equal(mutualState.status, 'approved_for_next_step', 'Mutual consent achieved');
  assert.ok(mutualState.approvals[userA.id]);
  assert.ok(mutualState.approvals[userB.id]);

  // 7. Audience elevation: contacts unlocked after meeting/agreement
  const postMeetingContext = {
    isOwner: false,
    inCommunity: true,
    hasMet: true,
  };
  const postMeetingLevel = resolveViewerAudienceLevel(postMeetingContext);
  assert.equal(postMeetingLevel, 'after_meeting', 'Elevated to after_meeting');

  const unlockedB = filterProfileForAudience(partyBFull, postMeetingContext);
  assert.equal(unlockedB.contact_email, 'party-b@example.com', 'Email is now unlocked');
  assert.equal(unlockedB.contact_phone, '+41 22 765 4321', 'Phone is now unlocked');
  assert.equal(unlockedB.private_notes, undefined, 'Private notes stay strictly protected');

  // 8. Material revision resets approvals and invalidates agreement
  activeUser = userA;
  const revisionTime = '2026-09-19T14:20:00.000Z';
  const modifiedMaterial = JSON.parse(JSON.stringify(initialMaterial));
  modifiedMaterial.trial.due_on = '2026-10-05'; // Material revision: extended due date

  caseState = await reviseCase(mutualState, {
    material: modifiedMaterial,
    now: revisionTime,
  });

  assert.equal(caseState.version, 2, 'Version incremented to 2');
  assert.equal(caseState.status, 'draft', 'Status invalidated and dropped back to draft');
  assert.deepEqual(caseState.approvals, {}, 'Both prior approvals revoked on material change');

  // Save revision
  await storeA.saveCaseState(caseState);
  const reloaded = await storeB.caseState(caseId);
  assert.equal(reloaded.version, 2);
  assert.equal(reloaded.status, 'draft');
  assert.deepEqual(reloaded.approvals, {});
});
