"""Synthetic specification examples. No production gate, network or provider execution."""
import copy
import itertools
import json
import math
from pathlib import Path
import unittest
from check_package import validate_tasks


def throughput(n, worker_minutes, integrator_minutes, reviewer_minutes):
    if n < 0 or any(not math.isfinite(x) or x <= 0 for x in (worker_minutes, integrator_minutes, reviewer_minutes)):
        raise ValueError('invalid scenario')
    return min(n / worker_minutes, 1 / integrator_minutes, 1 / reviewer_minutes)


def exhaustive_pairs(edges, capacities):
    """Tiny independent oracle; not a production matcher or scheduler."""
    best = 0
    for take in itertools.product((False, True), repeat=len(edges)):
        used = {v: 0 for v in capacities}
        value = 0
        for chosen, (a, b, weight, eligible) in zip(take, edges):
            if not chosen:
                continue
            if not eligible:
                break
            used[a] += 1
            used[b] += 1
            value += weight
        else:
            if all(used[v] <= capacities[v] for v in used):
                best = max(best, value)
    return best


def effect_example(epoch, current_epoch, key, payload_hash, prior):
    """Pure truth-table illustration; atomicity/durability deliberately NOT implemented."""
    if key in prior:
        return 'REPLAY' if prior[key] == payload_hash else 'CONFLICT'
    if epoch != current_epoch:
        return 'STALE'
    return 'ELIGIBLE_FOR_ATOMIC_COMMIT'


class Contracts(unittest.TestCase):
    def test_topology_and_shared_file_mutants(self):
        original = json.loads((Path(__file__).parent / 'V6_TASKS.json').read_text(encoding='utf-8'))
        validate_tasks(original)
        mutations = [
            lambda d: d['tasks'][0]['depends_on'].append('V6-18'),
            lambda d: d['tasks'][1]['depends_on'].append('absent'),
            lambda d: d.update(concurrency_max=4),
            lambda d: d.update(paid_authorized_cap_usd=0.5),
            lambda d: d.update(dispatch_allowed=True),
            lambda d: d['tasks'][2].update(owned_paths=['web_launch/profile-store.mjs']),
            lambda d: d['tasks'][1].update(owned_paths=['../outside']),
            lambda d: d['tasks'][4].update(acceptance=''),
        ]
        for mutation in mutations:
            mutant = copy.deepcopy(original)
            mutation(mutant)
            with self.subTest(mutation=mutations.index(mutation)):
                with self.assertRaises(ValueError):
                    validate_tasks(mutant)

    def test_amdahl_and_critical_path(self):
        self.assertAlmostEqual(1 / (.4 + .6 / 3), 5 / 3)
        durations = {'A': 4, 'B': 6, 'C': 3, 'D': 2}
        deps = {'A': [], 'B': ['A'], 'C': ['A'], 'D': ['B', 'C']}
        end = {}
        for node in durations:
            end[node] = durations[node] + max((end[p] for p in deps[node]), default=0)
        self.assertEqual(max(end.values()), 12)
        self.assertEqual(max(max(end.values()), sum(durations.values()) / 3), 12)

    def test_throughput_worker_and_integrator_bottlenecks(self):
        self.assertAlmostEqual(throughput(3, 30, 2, 5), .1)
        self.assertAlmostEqual(throughput(3, 2, 10, 1), .1)
        self.assertEqual(throughput(0, 30, 2, 5), 0)
        # Held-out N=2 case disproves the imported per-worker lambda formula.
        actual = throughput(2, 20, 1, 1)
        wrong_imported_bound = min(1 / 20, 1)
        self.assertAlmostEqual(actual, .1)
        self.assertNotEqual(actual, wrong_imported_bound)

    def test_duplicate_id_is_effect_scoped_not_source_scoped(self):
        prior = {('job-one', 'revision-3', 'write', 'target-a', 'key-x'): 'payload-1'}
        same = next(iter(prior))
        self.assertEqual(effect_example(12, 13, same, 'payload-1', prior), 'REPLAY')
        self.assertEqual(effect_example(13, 13, same, 'payload-2', prior), 'CONFLICT')
        different = ('job-two', 'revision-3', 'write', 'target-b', 'key-y')
        self.assertEqual(effect_example(13, 13, different, 'payload-1', prior), 'ELIGIBLE_FOR_ATOMIC_COMMIT')

    def test_stale_epoch_and_check_write_race(self):
        self.assertEqual(effect_example(12, 13, 'new', 'p', {}), 'STALE')

    def test_relevant_input_drift_and_disjoint_updates(self):
        binding = {'case-contract': 'revision-7', 'fixture': 'sha-a'}
        live = {**binding, 'unrelated-design': 'revision-2'}
        matches = lambda: all(live.get(k) == v for k, v in binding.items())
        self.assertTrue(matches())
        live['unrelated-design'] = 'revision-3'
        self.assertTrue(matches())
        # Historical blob is still intact, but cannot authorize the changed contract.
        historical = dict(binding)
        live['case-contract'] = 'revision-8'
        self.assertEqual(binding, historical)
        self.assertFalse(matches())
        # A precheck at epoch 12 cannot authorize a later write after takeover.
        self.assertEqual(effect_example(12, 12, 'new', 'p', {}), 'ELIGIBLE_FOR_ATOMIC_COMMIT')
        self.assertEqual(effect_example(12, 13, 'new', 'p', {}), 'STALE')

    def test_lost_heartbeat_is_not_process_stop(self):
        active_processes = {'a', 'b', 'c'}
        missing_heartbeats = {'a'}
        self.assertFalse(len(active_processes) < 3)
        wrong_count = len(active_processes - missing_heartbeats)
        self.assertLess(wrong_count, 3)  # demonstrates unsafe replacement admission
        acknowledged_stopped = {'a'}
        active_processes -= acknowledged_stopped
        self.assertTrue(len(active_processes) < 3)

    def test_matcher_greedy_counterexample_and_permissions(self):
        edges = [('A', 'B', 9, True), ('A', 'C', 8, True), ('B', 'D', 8, True)]
        cap = dict.fromkeys('ABCD', 1)
        self.assertEqual(exhaustive_pairs(edges, cap), 16)
        self.assertNotEqual(exhaustive_pairs(edges, cap), 9)
        blocked = edges[:-1] + [('B', 'D', 800, False)]
        self.assertEqual(exhaustive_pairs(blocked, cap), 9)
        cap['C'] = 0
        self.assertEqual(exhaustive_pairs(edges, cap), 9)

    def test_freshness_and_fixed_denominator(self):
        weights = [2 ** (-age / 7) for age in (0, 7, 14, 21)]
        self.assertEqual(weights, [1, .5, .25, .125])
        cases = set(range(10))
        accepted_events = [0, 1, 2, 3, 4, 5, 5]
        accepted = set(accepted_events) & cases
        self.assertEqual(len(cases - accepted), 4)
        self.assertEqual(len(accepted) / len(cases), .6)


if __name__ == '__main__':
    unittest.main()
