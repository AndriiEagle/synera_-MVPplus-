"""Offline hypothetical cohort model. Stdlib only; never imports production or sends data."""
import argparse
import csv
import hashlib
import itertools
import json
import math
from pathlib import Path
import statistics

ROOT = Path(__file__).resolve().parents[1]
OWNED = ROOT / "artifacts/zurich-pilot-model-20261005"


def uniform(seed, *key):
    """Keyed uniform variates: changing a gate does not shift unrelated draws."""
    data = json.dumps([seed, *key], separators=(",", ":")).encode()
    return int.from_bytes(hashlib.sha256(data).digest()[:8], "big") / 2**64


def validate(c):
    def integer(x, low, high):
        return type(x) is int and low <= x <= high
    if not integer(c["months"], 1, 12) or not integer(c["replications"], 1, 10000):
        raise ValueError("months 1..12; replications 1..10000")
    if not integer(c["seed"], 0, 2**53):
        raise ValueError("seed must be nonnegative integer")
    if type(c["hypothetical_expansion"]) is not bool:
        raise ValueError("hypothetical_expansion must be boolean")
    if not integer(c["cohort_cap"], 0, 100) or (c["cohort_cap"] > 10 and not c["hypothetical_expansion"]):
        raise ValueError("cap >10 requires explicitly hypothetical expansion; never live authority")
    if len(c["contacts_per_month"]) != c["months"] or any(not integer(n, 0, 10000) for n in c["contacts_per_month"]):
        raise ValueError("contacts must be bounded unique new people per month")
    if not integer(c["operator_meetings_per_month"], 0, 100):
        raise ValueError("invalid meeting capacity")
    rate_keys = {"join", "activate", "context_fit", "time_overlap", "consent_each", "show_each", "accept_each", "retain_without_value", "retain_with_value", "donate", "paid_opt_in", "advanced_share"}
    for s in c["scenarios"].values():
        if set(s) != rate_keys or any(type(v) not in (int, float) or not math.isfinite(v) or not 0 <= v <= 1 for v in s.values()):
            raise ValueError("behavior rates must be finite probabilities with exact keys")
    for m in c["modes"].values():
        if set(m) != {"support_from_month", "basic_from_month", "advanced_from_month"}:
            raise ValueError("explicit activation keys required")
        if any(v is not None and not integer(v, 1, 120) for v in m.values()):
            raise ValueError("activation must be null or positive month")
        if m["advanced_from_month"] is not None and (m["basic_from_month"] is None or m["advanced_from_month"] < m["basic_from_month"]):
            raise ValueError("advanced tier cannot precede basic")
    e = c["economics"]
    for key, value in e.items():
        if key != "currency" and (type(value) not in (int, float) or not math.isfinite(value) or value < 0):
            raise ValueError("costs must be finite and nonnegative")
    if e["currency"] != "CHF" or e["fee_fraction"] + e["tax_fraction_reserve"] >= 1 or e["retry_multiplier"] < 1:
        raise ValueError("invalid currency, deductions, or retry multiplier")
    if not c["archetypes"] or len({a["id"] for a in c["archetypes"]}) != len(c["archetypes"]):
        raise ValueError("unique archetypes required")
    for a in c["archetypes"]:
        if type(a["weight"]) not in (int, float) or not math.isfinite(a["weight"]) or a["weight"] <= 0:
            raise ValueError("positive archetype weights required")
        for k in ("offers", "needs"):
            if not isinstance(a[k], list) or any(not isinstance(x, str) or not x for x in a[k]):
                raise ValueError("tags must be string lists")


def archetype(c, seed, person):
    remaining = uniform(seed, "type", person) * sum(a["weight"] for a in c["archetypes"])
    for a in c["archetypes"]:
        remaining -= a["weight"]
        if remaining < 0:
            return a
    return c["archetypes"][-1]


def pair_funnel(c, s, seed, month, active):
    groups = {k: [] for k in ("possible", "bilateral", "context", "time", "consent")}
    for i, j in itertools.combinations(sorted(active), 2):
        pair = (i, j)
        groups["possible"].append(pair)
        a, b = archetype(c, seed, i), archetype(c, seed, j)
        if not (set(a["offers"]) & set(b["needs"]) and set(b["offers"]) & set(a["needs"])):
            continue
        groups["bilateral"].append(pair)
        if uniform(seed, month, i, j, "context") >= s["context_fit"]:
            continue
        groups["context"].append(pair)
        if uniform(seed, month, i, j, "time") >= s["time_overlap"]:
            continue
        groups["time"].append(pair)
        if any(uniform(seed, month, i, j, "consent", who) >= s["consent_each"] for who in pair):
            continue
        groups["consent"].append(pair)
    return groups


def activated(mode, key, month):
    return mode[key] is not None and month >= mode[key]


def accounting(c, active, scheduled, basic, advanced, donors):
    e = c["economics"]
    gross = basic * e["basic_price_month"] + advanced * e["advanced_price_month"]
    support = donors * e["donation_once"]
    fees = (gross + support) * e["fee_fraction"] + (basic + advanced + donors) * e["fee_fixed_transaction"]
    base_requests = active * e["free_user_ai_requests_month"] * e["retry_multiplier"]
    extra_requests = (basic * e["basic_extra_ai_requests_month"] + advanced * e["advanced_extra_ai_requests_month"]) * e["retry_multiplier"]
    ai = max(0, base_requests + extra_requests - e["provider_free_requests_month"]) * e["assumed_chf_per_ai_request"]
    hours = e["fixed_operator_hours_month"] + (active * e["support_minutes_active_month"] + scheduled * e["minutes_scheduled_meeting"]) / 60
    cash_cost = e["infrastructure_month"] + e["acquisition_month"] + ai + fees + (gross + support) * e["tax_fraction_reserve"]
    return {"recurring_revenue_chf": gross, "donations_chf": support, "ai_cost_chf": ai, "fees_chf": fees,
            "cash_cost_chf": cash_cost, "operator_hours": hours,
            "cash_balance_chf": gross + support - cash_cost,
            "economic_balance_chf": gross + support - cash_cost - hours * e["operator_hour_value"]}


def simulate(c, s, mode, seed):
    active, admitted, valued, donated, previous_value, initial_active = set(), set(), set(), set(), set(), set()
    rows, next_id = [], 0
    for month in range(1, c["months"] + 1):
        prior = set(active)
        active = {p for p in prior if uniform(seed, month, "retain", p) < s["retain_with_value" if p in previous_value else "retain_without_value"]}
        retained = len(active)
        contacts = c["contacts_per_month"][month - 1]
        candidates = [p for p in range(next_id, next_id + contacts) if uniform(seed, "join", p) < s["join"]]
        next_id += contacts
        new = candidates[:max(0, c["cohort_cap"] - len(admitted))]
        admitted.update(new)  # lifetime cap; departures never silently open admission slots
        new_active = {p for p in new if uniform(seed, "activate", p) < s["activate"]}
        active.update(new_active)
        if month == 1:
            initial_active = set(active)
        funnel = pair_funnel(c, s, seed, month, active)
        used, scheduled = set(), []
        # Deterministic random-priority greedy matching, NOT maximum-cardinality optimization.
        for i, j in sorted(funnel["consent"], key=lambda pair: uniform(seed, month, "priority", *pair)):
            if len(scheduled) >= c["operator_meetings_per_month"]:
                break
            if i not in used and j not in used:
                scheduled.append((i, j))
                used.update((i, j))
        completed, accepted = [], []
        for pair in scheduled:
            if all(uniform(seed, month, *pair, "show", p) < s["show_each"] for p in pair):
                completed.append(pair)
                if all(uniform(seed, month, *pair, "accept", p) < s["accept_each"] for p in pair):
                    accepted.append(pair)
        previous_value = {p for pair in accepted for p in pair}
        valued.update(previous_value)
        eligible = active & valued
        donors = {p for p in eligible - donated if activated(mode, "support_from_month", month) and uniform(seed, "donate", p) < s["donate"]}
        donated.update(donors)  # at most one gift per person over the whole modeled horizon
        payers = {p for p in eligible if activated(mode, "basic_from_month", month) and uniform(seed, "paid", p) < s["paid_opt_in"]}
        advanced = {p for p in payers if activated(mode, "advanced_from_month", month) and uniform(seed, "advanced", p) < s["advanced_share"]}
        row = {"month": month, "contacts": contacts, "join_candidates": len(candidates), "new_admitted": len(new), "admitted_cumulative": len(admitted),
               "new_active": len(new_active), "prior_active": len(prior), "retained": retained, "churned": len(prior) - retained,
               "active": len(active), "initial_active": len(initial_active), "initial_cohort_retained": len(active & initial_active),
               **{k + "_pairs": len(v) for k, v in funnel.items()}, "scheduled_meetings": len(scheduled), "completed_meetings": len(completed),
               "accepted_meetings": len(accepted), "value_users_month": len(previous_value), "unique_value_users_cumulative": len(valued),
               "eligible_payers": len(eligible), "basic_payers": len(payers - advanced), "advanced_payers": len(advanced), "donors": len(donors)}
        row.update(accounting(c, len(active), len(scheduled), len(payers - advanced), len(advanced), len(donors)))
        rows.append(row)
    return rows


def quantile(values, q):
    ordered = sorted(values)
    at = (len(ordered) - 1) * q
    lo, hi = math.floor(at), math.ceil(at)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (at - lo)


def summarize(rows):
    return {k: {"mean": statistics.mean(r[k] for r in rows), "p10": quantile([r[k] for r in rows], .1),
                "p90": quantile([r[k] for r in rows], .9)} for k in rows[0] if k != "month"}


def break_even(c, price, extra_requests, active=10, scheduled=4):
    """Conservative incremental AI assumes free provider quota already exhausted."""
    e = c["economics"]
    base = accounting(c, active, scheduled, 0, 0, 0)
    contribution = price * (1 - e["fee_fraction"] - e["tax_fraction_reserve"]) - e["fee_fixed_transaction"] - extra_requests * e["retry_multiplier"] * e["assumed_chf_per_ai_request"]
    def need(cost):
        return math.ceil(cost / contribution) if contribution > 0 else None
    return {"price_chf_month": price, "incremental_contribution_chf": contribution, "cash_payers_needed": need(base["cash_cost_chf"]),
            "economic_payers_needed": need(-base["economic_balance_chf"]), "available_active_people": active,
            "excludes_donations": True, "fixed_cohort_assumption": True}


def sensitivity(c):
    result = []
    baseline = c["scenarios"]["base"]
    mode = c["modes"]["free_launch"]
    for key in ("join", "context_fit", "time_overlap", "consent_each", "retain_with_value"):
        for delta in (-.15, 0, .15):
            s = dict(baseline, **{key: min(1, max(0, baseline[key] + delta))})
            runs = [simulate(c, s, mode, c["seed"] + r) for r in range(c["replications"])]
            result.append({"parameter": key, "value": s[key], "horizon_days": c["months"] * 30,
                           "accepted_horizon_mean": statistics.mean(sum(x["accepted_meetings"] for x in run) for run in runs),
                           "active_end_mean": statistics.mean(run[-1]["active"] for run in runs)})
    return result


def generate(c):
    validate(c)
    monthly, totals, raw = {}, {}, []
    for name, s in c["scenarios"].items():
        for mode_name, mode in c["modes"].items():
            runs = [simulate(c, s, mode, c["seed"] + r) for r in range(c["replications"])]
            key = name + "/" + mode_name
            monthly[key] = [{"month": i + 1, "metrics": summarize([run[i] for run in runs])} for i in range(c["months"])]
            totals[key] = summarize([{k: sum(row[k] for row in run) for k in ("accepted_meetings", "recurring_revenue_chf", "donations_chf", "cash_balance_chf", "economic_balance_chf")} for run in runs])
            for rep, run in enumerate(runs):
                raw.extend({"scenario": name, "mode": mode_name, "seed": c["seed"] + rep, **row} for row in run)
    e = c["economics"]
    return {"kind": "SCENARIO_NOT_FORECAST", "interval": "p10/p90 across hypothetical stochastic runs; not population confidence intervals",
            "input_sha256_canonical": hashlib.sha256(json.dumps(c, sort_keys=True, separators=(",", ":")).encode()).hexdigest(),
            "monthly": monthly, "totals": totals, "sensitivity": sensitivity(c),
            "break_even": {tier: break_even(c, e[tier + "_price_month"], e[tier + "_extra_ai_requests_month"], c["cohort_cap"], min(c["operator_meetings_per_month"], c["cohort_cap"] // 2)) for tier in ("basic", "advanced")}}, raw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inputs", type=Path, default=OWNED / "inputs.json")
    parser.add_argument("--output", type=Path, default=OWNED)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to(OWNED.resolve()):
        parser.error("output must remain inside owned artifact directory")
    c = json.loads(args.inputs.read_text(encoding="utf-8-sig"))
    summary, raw = generate(c)
    output.mkdir(parents=True, exist_ok=True)
    (output / "results.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for filename, rows in (("runs.csv", raw), ("sensitivity.csv", summary["sensitivity"])):
        with (output / filename).open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
            writer.writeheader()
            writer.writerows(rows)
    print(json.dumps({"kind": summary["kind"], "rows": len(raw), "output": str(output), "break_even": summary["break_even"]}, indent=2))


if __name__ == "__main__":
    main()
