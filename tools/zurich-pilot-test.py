"""Semantic acceptance plus in-memory mutation oracle; no app changes."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

PATH = Path(__file__).with_name("zurich-pilot-model.py")
spec = importlib.util.spec_from_file_location("zurich_pilot", PATH)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class ModelTests(unittest.TestCase):
    def setUp(self):
        self.c = json.loads((m.OWNED / "inputs.json").read_text(encoding="utf-8"))
        self.s = self.c["scenarios"]["base"]
        self.free = self.c["modes"]["free_launch"]

    def test_zero_funnel(self):
        for zero in ("contacts", "join", "activate"):
            c, s = copy.deepcopy(self.c), dict(self.s)
            if zero == "contacts":
                c["contacts_per_month"] = [0] * c["months"]
            else:
                s[zero] = 0
            for row in m.simulate(c, s, self.free, 10):
                self.assertEqual(row["active"], 0)
                self.assertEqual(row["accepted_meetings"], 0)
                self.assertEqual(row["recurring_revenue_chf"], 0)

    def test_people_capacity_and_funnel_conservation(self):
        for seed in range(80):
            previous_admitted = 0
            for r in m.simulate(self.c, self.s, self.free, seed):
                self.assertEqual(r["active"], r["retained"] + r["new_active"])
                self.assertEqual(r["prior_active"], r["retained"] + r["churned"])
                self.assertEqual(r["admitted_cumulative"], previous_admitted + r["new_admitted"])
                previous_admitted = r["admitted_cumulative"]
                self.assertLessEqual(previous_admitted, 10)
                self.assertLessEqual(r["active"], previous_admitted)
                self.assertLessEqual(r["unique_value_users_cumulative"], previous_admitted)
                self.assertLessEqual(r["initial_cohort_retained"], r["initial_active"])
                self.assertLessEqual(r["scheduled_meetings"], min(r["active"] // 2, self.c["operator_meetings_per_month"]))
                funnel = [r[k] for k in ("possible_pairs", "bilateral_pairs", "context_pairs", "time_pairs", "consent_pairs", "scheduled_meetings", "completed_meetings", "accepted_meetings")]
                self.assertEqual(funnel, sorted(funnel, reverse=True))
                self.assertEqual(r["value_users_month"], 2 * r["accepted_meetings"])

    def test_consent_zero_and_coupled_edge_monotonicity(self):
        # Fixed cohort: eligible edges are monotone. Downstream greedy schedule is not claimed monotone.
        for seed in range(30):
            counts = [len(m.pair_funnel(self.c, dict(self.s, consent_each=p), seed, 1, set(range(10)))["consent"]) for p in (0, .3, .6, 1)]
            self.assertEqual(counts[0], 0)
            self.assertEqual(counts, sorted(counts))
            for row in m.simulate(self.c, dict(self.s, consent_each=0), self.free, seed):
                self.assertEqual(row["accepted_meetings"], 0)

    def test_repeatability(self):
        a = m.simulate(self.c, self.s, self.free, 123)
        self.assertEqual(a, m.simulate(self.c, self.s, self.free, 123))
        self.assertNotEqual(a, m.simulate(self.c, self.s, self.free, 124))

    def test_no_revenue_before_activation_and_donations_separate(self):
        s = {k: 1 for k in self.s}
        c = copy.deepcopy(self.c)
        c["contacts_per_month"] = [10, 0, 0]
        for seed in range(20):
            for row in m.simulate(c, s, self.free, seed):
                self.assertEqual(row["donations_chf"] + row["recurring_revenue_chf"], 0)
            support = m.simulate(c, s, c["modes"]["optional_support_hypothesis"], seed)
            self.assertEqual(support[0]["donations_chf"], 0)
            self.assertTrue(all(r["recurring_revenue_chf"] == 0 for r in support))
            self.assertLessEqual(sum(r["donors"] for r in support), support[-1]["admitted_cumulative"])
            tiers = m.simulate(c, s, c["modes"]["optional_tiers_hypothesis"], seed)
            self.assertEqual(tiers[0]["recurring_revenue_chf"], 0)
            self.assertEqual(tiers[1]["advanced_payers"], 0)
            self.assertLessEqual(tiers[2]["basic_payers"] + tiers[2]["advanced_payers"], tiers[2]["eligible_payers"])
        self.assertGreater(support[1]["donations_chf"], 0)
        self.assertGreater(tiers[2]["recurring_revenue_chf"], 0)

    def test_one_way_no_meetings(self):
        self.c["archetypes"] = [{"id": "one", "weight": 1, "offers": ["design"], "needs": ["finance"]}]
        for r in m.simulate(self.c, {k: 1 for k in self.s}, self.free, 3):
            self.assertEqual(r["bilateral_pairs"], 0)

    def test_cash_arithmetic_and_quota(self):
        e = self.c["economics"]
        r = m.accounting(self.c, 4, 2, 1, 1, 1)
        self.assertEqual(r["recurring_revenue_chf"], 41)
        self.assertEqual(r["donations_chf"], 10)
        self.assertAlmostEqual(r["ai_cost_chf"], (8 + 8 + 28) * 1.1 * .02)
        self.assertAlmostEqual(r["fees_chf"], 51 * .035 + 3 * .3)
        self.assertAlmostEqual(r["economic_balance_chf"], r["cash_balance_chf"] - r["operator_hours"] * 40)
        e["provider_free_requests_month"] = 10000
        self.assertEqual(m.accounting(self.c, 4, 2, 1, 1, 0)["ai_cost_chf"], 0)

    def test_break_even_boundary_and_sensitivity(self):
        r = m.break_even(self.c, 12, 8)
        base_cost = m.accounting(self.c, 10, 4, 0, 0, 0)["cash_cost_chf"]
        n, cm = r["cash_payers_needed"], r["incremental_contribution_chf"]
        self.assertGreaterEqual(n * cm, base_cost)
        self.assertLess((n - 1) * cm, base_cost)
        self.c["economics"]["assumed_chf_per_ai_request"] *= 100
        self.assertLess(m.break_even(self.c, 12, 8)["incremental_contribution_chf"], cm)
        self.assertIsNone(m.break_even(self.c, 0, 8)["cash_payers_needed"])

    def test_sensitivity_rows_recalculate(self):
        self.c["replications"] = 4
        self.c["months"] = 2
        self.c["contacts_per_month"] = [12, 8]
        rows = m.sensitivity(self.c)
        target = rows[7]
        s = dict(self.s, **{target["parameter"]: target["value"]})
        expected = sum(sum(r["accepted_meetings"] for r in m.simulate(self.c, s, self.free, self.c["seed"] + i)) for i in range(4)) / 4
        self.assertEqual(target["accepted_horizon_mean"], expected)
        self.assertEqual(target["horizon_days"], 60)

    def test_invalid_inputs(self):
        for key, value in (("cohort_cap", 11), ("cohort_cap", -1), ("replications", 0), ("operator_meetings_per_month", -1)):
            c = copy.deepcopy(self.c)
            c[key] = value
            with self.assertRaises(ValueError):
                m.validate(c)
        self.c["scenarios"]["base"]["join"] = float("nan")
        with self.assertRaises(ValueError):
            m.validate(self.c)

    def test_mutation_oracle_catches_gate_bypass(self):
        original = m.activated
        try:
            m.activated = lambda *args: True
            rows = m.simulate(self.c, {k: 1 for k in self.s}, self.free, 10)
            # The free-launch invariant must reject this intentional in-memory defect.
            with self.assertRaises(AssertionError):
                self.assertTrue(all(r["recurring_revenue_chf"] + r["donations_chf"] == 0 for r in rows))
        finally:
            m.activated = original


if __name__ == "__main__":
    unittest.main(verbosity=2)
