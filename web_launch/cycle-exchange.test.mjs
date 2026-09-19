import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCapabilityGraph,
  findExchangeCycles,
  packDisjointCycles,
  buildTriangularCaseProposal,
} from './cycle-exchange.mjs';

const makeProfile = (id, offers, needs) => ({
  id,
  is_discoverable: true,
  brief: {
    goal: `${id} mission`,
    offer_tags: Array.isArray(offers) ? offers : [offers],
    need_tags: Array.isArray(needs) ? needs : [needs],
    modes: ['exchange'],
    languages: ['en'],
  },
});

test('M09: detects bilateral 2-way cycles (A <-> B)', () => {
  const alice = makeProfile('alice', 'video', 'sales');
  const bob = makeProfile('bob', 'sales', 'video');
  const carol = makeProfile('carol', 'finance', 'legal');

  const cycles = findExchangeCycles([alice, bob, carol]);
  const bilateral = cycles.filter(c => c.type === 'bilateral_2way');

  assert.equal(bilateral.length, 1);
  assert.equal(bilateral[0].length, 2);
  assert.deepEqual(bilateral[0].nodes.sort(), ['alice', 'bob']);
  assert.equal(bilateral[0].totalWeight, 2);
});

test('M09: detects triangular 3-way cycles (A -> B -> C -> A)', () => {
  // Alice gives video, needs sales
  // Bob gives sales, needs design
  // Carol gives design, needs video
  const alice = makeProfile('alice', 'video', 'sales');
  const bob = makeProfile('bob', 'sales', 'design');
  const carol = makeProfile('carol', 'design', 'video');

  const cycles = findExchangeCycles([alice, bob, carol]);
  const triangular = cycles.filter(c => c.type === 'triangular_3way');

  assert.equal(triangular.length, 1);
  const tri = triangular[0];
  assert.equal(tri.length, 3);
  assert.deepEqual(tri.nodes.sort(), ['alice', 'bob', 'carol']);
  assert.equal(tri.totalWeight, 3);

  // Verify legs: Alice gives video to Carol; Carol gives design to Bob; Bob gives sales to Alice
  const [e1, e2, e3] = tri.edges;
  assert.equal(e1.from, 'alice');
  assert.equal(e1.to, 'carol');
  assert.deepEqual(e1.tags, ['video']);

  assert.equal(e2.from, 'carol');
  assert.equal(e2.to, 'bob');
  assert.deepEqual(e2.tags, ['design']);

  assert.equal(e3.from, 'bob');
  assert.equal(e3.to, 'alice');
  assert.deepEqual(e3.tags, ['sales']);
});

test('M09: triangular case proposal draft builds valid 3-way structure', () => {
  const alice = makeProfile('alice', 'video', 'sales');
  const bob = makeProfile('bob', 'sales', 'design');
  const carol = makeProfile('carol', 'design', 'video');

  const cycles = findExchangeCycles([alice, bob, carol]);
  const triCycle = cycles.find(c => c.type === 'triangular_3way');
  assert.ok(triCycle);

  const proposal = buildTriangularCaseProposal(triCycle, {
    alice: { name: 'Alice V.' },
    bob: { name: 'Bob S.' },
    carol: { name: 'Carol D.' },
  });

  assert.equal(proposal.schema, 'synera.triangular-case.v1');
  assert.equal(proposal.mode, 'triangular_exchange');
  assert.equal(proposal.participants.length, 3);
  assert.equal(proposal.legs.length, 3);
  assert.equal(proposal.binding, false);
  assert.equal(proposal.status, 'proposal_draft');
});

test('M09: disjoint cycle packing prevents any person from appearing in two cycles simultaneously', () => {
  // Alice is in a bilateral cycle with Bob AND in a 3-way cycle with Carol & Dave
  const alice = makeProfile('alice', ['video', 'automation'], ['sales', 'research']);
  const bob = makeProfile('bob', 'sales', 'video');
  const carol = makeProfile('carol', 'research', 'design');
  const dave = makeProfile('dave', 'design', 'automation');

  const cycles = findExchangeCycles([alice, bob, carol, dave]);
  assert.ok(cycles.length >= 2, 'Must have at least 2 potential overlapping cycles');

  const { packed, rejected, totalParticipantsCovered } = packDisjointCycles(cycles);

  assert.ok(packed.length >= 1);
  assert.ok(rejected.length >= 1);

  // Invariant: no duplicate participants across packed cycles
  const allCommittedNodes = packed.flatMap(c => c.nodes);
  assert.equal(new Set(allCommittedNodes).size, allCommittedNodes.length);
  assert.equal(totalParticipantsCovered, allCommittedNodes.length);

  // Rejected cycle clearly cites conflict
  assert.equal(rejected[0].reason, 'CONFLICT_PARTICIPANT_ALREADY_COMMITTED');
  assert.ok(rejected[0].conflictingNodes.length > 0);
});

