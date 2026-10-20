import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("simulation_provider", Path(__file__).with_name("simulation-provider.py"))
provider = importlib.util.module_from_spec(spec)
spec.loader.exec_module(provider)
CAPS = {provider.MODEL: 4, "z-ai/glm-5.3": 1, "google/gemini-4-argon": 1}


class LifecycleFixture:
    @staticmethod
    def dispatch_states(rows):
        return {r["dispatch_id"]: r for r in rows}

    @staticmethod
    def known_cost(value):
        return value if type(value) in (int, float) and value >= 0 else None

    @staticmethod
    def terminal_event(row):
        return row.get("terminal") is True


class BudgetTests(unittest.TestCase):
    def row(self, cost, model=provider.MODEL):
        return {"dispatch_id": "one", "run": provider.ROOT_RUN + "-one", "terminal": True, "cost": cost, "model": model}

    def test_unknown_and_unfinished_stop_before_dispatch(self):
        for row in [self.row(None), {**self.row(0), "terminal": False}]:
            with self.assertRaises(ValueError):
                provider.spend_state([row], LifecycleFixture, {}, CAPS)

    def test_architecture_cost_and_retries_share_root_cap(self):
        rows = [{**self.row(.041034, "google/gemini-4-argon"), "run": provider.ARCHITECTURE_RUN},
                {**self.row(3.99), "dispatch_id": "two"}]
        spent = provider.spend_state(rows, LifecycleFixture, {}, CAPS)
        self.assertAlmostEqual(sum(spent.values()), 4.031034)
        rows.append({**self.row(.02), "dispatch_id": "retry"})
        with self.assertRaises(ValueError):
            provider.spend_state(rows, LifecycleFixture, {}, CAPS)

    def test_only_canonical_recovery_resolves_unknown(self):
        rows = [self.row(None)]
        self.assertEqual(provider.spend_state(rows, LifecycleFixture, {"one": 0}, CAPS)[provider.MODEL], 0)
        with self.assertRaises(ValueError):
            provider.spend_state([self.row(.01, "other/model")], LifecycleFixture, {}, CAPS)


if __name__ == "__main__":
    unittest.main()
