"""Independent CSV readback and deterministic rebuild receipt; uses local stdlib only."""
import csv
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/zurich-pilot-model-20261005"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(script):
    result = subprocess.run([sys.executable, "-B", str(ROOT / "tools" / script)], cwd=ROOT, capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout + result.stderr


def main():
    tests = run("zurich-pilot-test.py")
    (OUT / "test-results.txt").write_text(tests, encoding="utf-8")
    run("zurich-pilot-model.py")
    generated = [OUT / name for name in ("results.json", "runs.csv", "sensitivity.csv")]
    first = {p.name: digest(p) for p in generated}
    run("zurich-pilot-model.py")
    assert first == {p.name: digest(p) for p in generated}, "rebuild bytes differ"
    c = json.loads((OUT / "inputs.json").read_text(encoding="utf-8"))
    result = json.loads((OUT / "results.json").read_text(encoding="utf-8"))
    with (OUT / "runs.csv").open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == len(c["scenarios"]) * len(c["modes"]) * c["replications"] * c["months"]
    totals = {}
    for row in rows:
        n = lambda key: float(row[key])
        mode, month = c["modes"][row["mode"]], int(row["month"])
        assert n("active") <= n("admitted_cumulative") <= c["cohort_cap"]
        assert n("active") == n("retained") + n("new_active")
        assert n("scheduled_meetings") * 2 <= n("active")
        if mode["support_from_month"] is None or month < mode["support_from_month"]:
            assert n("donations_chf") == 0
        if mode["basic_from_month"] is None or month < mode["basic_from_month"]:
            assert n("recurring_revenue_chf") == 0
        assert abs(n("cash_balance_chf") - (n("recurring_revenue_chf") + n("donations_chf") - n("cash_cost_chf"))) < 1e-9
        key = row["scenario"] + "/" + row["mode"]
        totals[key] = totals.get(key, 0) + n("accepted_meetings")
    for key, total in totals.items():
        assert abs(result["totals"][key]["accepted_meetings"]["mean"] - total / c["replications"]) < 1e-12
    protected = digest(ROOT / "web_launch/journey-ui.mjs")
    expected = "68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b"
    assert protected == expected, "protected source changed; inspect ownership before completion"
    tracked = [ROOT / "tools" / name for name in ("zurich-pilot-model.py", "zurich-pilot-test.py", "zurich-pilot-verify.py", "zurich-pilot-source-check.py")]
    tracked += [OUT / "inputs.json", OUT / "sources.json", OUT / "source-checks.json", *generated]
    receipt = {"status": "LOCAL_SCENARIO_CHECKS_PASS_PARENT_REVIEW_PENDING", "unit_tests": 11,
               "mutation": "in-memory activation bypass rejected by free-launch invariant",
               "csv_rows_checked": len(rows), "byte_identical_rebuild": True,
               "protected_journey_ui_sha256": protected, "provider_calls": 0, "provider_usd": 0,
               "limitations": ["No observed demand, live product, user retention or payment verified", "Official anchor checks are not individual legal clearance"],
               "sha256": {p.relative_to(ROOT).as_posix(): digest(p) for p in tracked}}
    (OUT / "acceptance.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in receipt.items() if k != "sha256"}, indent=2))


if __name__ == "__main__":
    main()
