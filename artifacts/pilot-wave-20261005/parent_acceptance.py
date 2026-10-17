"""Independent held-out arithmetic and source readback; local artifacts only."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("scenario", ROOT / "tools/zurich-pilot-model.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
c = json.loads((m.OWNED / "inputs.json").read_text())
c["contacts_per_month"] = [10, 0, 0]
c["archetypes"] = [{"id": "reciprocal", "weight": 1, "offers": ["review"], "needs": ["review"]}]
s = {k: 1 for k in c["scenarios"]["base"]}
free = c["modes"]["free_launch"]
m.validate(c)
rows = m.simulate(c, s, free, 907)
assert [r["accepted_meetings"] for r in rows] == [4, 4, 4]
assert [r["possible_pairs"] for r in rows] == [45, 45, 45]
assert all(r["active"] == 10 and r["donations_chf"] == r["recurring_revenue_chf"] == 0 for r in rows)
for gate in ("show_each", "accept_each", "time_overlap", "context_fit"):
    assert sum(r["accepted_meetings"] for r in m.simulate(c, dict(s, **{gate: 0}), free, 907)) == 0, gate
capacity_zero = copy.deepcopy(c)
capacity_zero["operator_meetings_per_month"] = 0
assert all(r["scheduled_meetings"] == 0 for r in m.simulate(capacity_zero, s, free, 907))
hashes = {}
for name in ("TRANSPORT.json", "MUTATION.json", "SQL.json"):
    receipt = json.loads((ROOT / "artifacts/pilot-hardening-20261005" / name).read_text())
    assert receipt["status"] in {"PASS_LOCAL_TRANSPORT_AND_CLIENT", "MUTANT_REJECTED_ALLOWLIST", "PASS_LOCAL_SQL_DISTINCT_INTENTS"}
    for rel, expected in receipt["source_sha256"].items():
        actual = hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
        assert actual == expected, rel
        hashes[rel] = actual
model_receipt = json.loads((m.OWNED / "acceptance.json").read_text())
for rel, expected in model_receipt["sha256"].items():
    actual = hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()
    assert actual == expected, rel
    hashes[rel] = actual
skill = ROOT / "skills/synera-pilot-operator"
installed = Path("C:/Users/Andrii/.codex/skills/synera-pilot-operator")
for rel in ("SKILL.md", "references/task-recipes.md", "agents/openai.yaml"):
    assert (skill / rel).read_bytes() == (installed / rel).read_bytes(), rel
assert hashlib.sha256((ROOT / "web_launch/journey-ui.mjs").read_bytes()).hexdigest() == "68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b"
result = {"status": "PARENT_LOCAL_ACCEPTANCE_PASS", "held_out": ["perfect bilateral cohort: 12 accepted meetings, 10 active, 45 pairs each month", "free remains zero revenue even with full willingness", "zero show/accept/time/context prevents accepted outcomes", "zero operator capacity prevents scheduling"], "source_sha256": hashes, "skill_installed_parity": True, "scope": "Deterministic model and local transport/SQL contracts only; no demand, production, throughput, legal or automatic skill discovery acceptance", "provider_calls": 0, "provider_usd": 0}
(OUT / "PARENT_ACCEPTANCE.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps({k: v for k, v in result.items() if k != "source_sha256"}, indent=2))
