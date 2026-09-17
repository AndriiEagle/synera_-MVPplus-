"""ADP-08 reference implementation and falsification harness.

Two formalisations of the same object already exist in the repository:

  docs/multihost-20260915/MATH.uk.md   w_ab = min(u_ab, u_ba),  max sum w_ab x_ab
                                       subject to per-person capacity
  ki-math-extract.md                   F(z) = b'z + 1/2 z'Mz - lambda*||z||_0,  M = S - C

This file does not assert that they agree. It runs both, finds where they
disagree, and checks every claim the two documents make. Every number printed
below is produced by this file on synthetic data. No network, no provider
calls, no spend. This is a specification example, not a production matcher.

    python -B adp08_matching.py
"""
from itertools import combinations
import random
import sys

ELIGIBLE_SCORED = 'ELIGIBLE_SCORED'
NEEDS_INFORMATION = 'NEEDS_INFORMATION'
INELIGIBLE = 'INELIGIBLE'

UNKNOWN = None


# --------------------------------------------------------------------------
# Edge construction: hard constraints first, then a three-valued state.
# Unknown utility never becomes 0 and never silently excludes a person.
# --------------------------------------------------------------------------

def edge_state(u_ab, u_ba, mode_allowed, both_available):
    """Hard constraints first (MATH.uk.md), then scoring."""
    if not (mode_allowed and both_available):
        return INELIGIBLE
    if u_ab is UNKNOWN or u_ba is UNKNOWN:
        return NEEDS_INFORMATION
    return ELIGIBLE_SCORED


def w_min(u_ab, u_ba):
    """Conservative edge utility. Does not hide a one-sided zero."""
    return min(u_ab, u_ba)


def w_sum(u_ab, u_ba):
    """Additive synergy, the shape M_ij = S_ij - C_ij takes when S is the
    total declared value of the pair and C is zero."""
    return u_ab + u_ba


# --------------------------------------------------------------------------
# Exact optimum over capacity-feasible edge subsets. Exhaustive on purpose:
# at pilot scale it is exact and fast, and it is the oracle the heuristics
# are checked against.
# --------------------------------------------------------------------------

def best_matching(edges, capacity):
    """edges: list of (a, b, weight). capacity: dict person -> int.
    Returns (total_weight, chosen_edges) maximising the total."""
    edges = sorted(edges, key=lambda e: (-e[2], e[0], e[1]))
    best = [0.0, []]

    def rec(i, used, total, chosen):
        remaining = sum(e[2] for e in edges[i:] if e[2] > 0)
        if total + remaining <= best[0]:
            return
        if i == len(edges):
            if total > best[0]:
                best[0], best[1] = total, list(chosen)
            return
        a, b, w = edges[i]
        if used.get(a, 0) < capacity.get(a, 1) and used.get(b, 0) < capacity.get(b, 1):
            used[a] = used.get(a, 0) + 1
            used[b] = used.get(b, 0) + 1
            chosen.append((a, b, w))
            rec(i + 1, used, total + w, chosen)
            chosen.pop()
            used[a] -= 1
            used[b] -= 1
        rec(i + 1, used, total, chosen)

    rec(0, {}, 0.0, [])
    if best[0] <= 0:
        best[1] = [e for e in best[1] if e[2] > 0]
    return best[0], best[1]


def greedy_matching(edges, capacity):
    used, chosen, total = {}, [], 0.0
    for a, b, w in sorted(edges, key=lambda e: (-e[2], e[0], e[1])):
        if w <= 0:
            continue
        if used.get(a, 0) < capacity.get(a, 1) and used.get(b, 0) < capacity.get(b, 1):
            used[a] = used.get(a, 0) + 1
            used[b] = used.get(b, 0) + 1
            chosen.append((a, b, w))
            total += w
    return total, chosen


def pairs_of(chosen):
    return {tuple(sorted((a, b))) for a, b, _ in chosen}


# --------------------------------------------------------------------------
# Experiments. Each one states a claim and then tries to break it.
# --------------------------------------------------------------------------

results = []


def record(name, claim, passed, detail):
    results.append((name, passed))
    print(f"[{'PASS' if passed else 'FAIL'}] {name}")
    print(f"       claim : {claim}")
    print(f"       result: {detail}\n")


def e1_formulas_disagree():
    """The two weightings are not interchangeable."""
    # a can extract 10 from b; b gets nothing. a and c would exchange fairly.
    u = {('a', 'b'): (10, 0), ('a', 'c'): (4, 4)}
    cap = {'a': 1, 'b': 1, 'c': 1}
    e_min = [(x, y, w_min(*v)) for (x, y), v in u.items()]
    e_sum = [(x, y, w_sum(*v)) for (x, y), v in u.items()]
    tot_min, sel_min = best_matching(e_min, cap)
    tot_sum, sel_sum = best_matching(e_sum, cap)
    differ = pairs_of(sel_min) != pairs_of(sel_sum)
    picks_exploitative = ('a', 'b') in pairs_of(sel_sum) and ('a', 'b') not in pairs_of(sel_min)
    record(
        'E1 min vs sum disagree',
        'min(u_ab,u_ba) and an additive weight can select different pairs; the additive one can select a one-sided pair',
        differ and picks_exploitative,
        f"w_min picks {sorted(pairs_of(sel_min))} total {tot_min:g}; "
        f"w_sum picks {sorted(pairs_of(sel_sum))} total {tot_sum:g}. "
        f"Pair (a,b) declares 10 for a and 0 for b.",
    )


def e2_greedy_counterexample():
    """MATH.uk.md states greedy AB=9 loses to AC+BD=16. Verify."""
    edges = [('A', 'B', 9), ('A', 'C', 8), ('B', 'D', 8)]
    cap = {k: 1 for k in 'ABCD'}
    g, gs = greedy_matching(edges, cap)
    o, os_ = best_matching(edges, cap)
    record(
        'E2 greedy counterexample',
        'greedy takes AB=9 and totals 9; the optimum is AC+BD=16 (MATH.uk.md)',
        g == 9 and o == 16 and pairs_of(os_) == {('A', 'C'), ('B', 'D')},
        f"greedy {g:g} {sorted(pairs_of(gs))}; optimum {o:g} {sorted(pairs_of(os_))}",
    )


def e3_pair_beats_singles(trials=20000, seed=11):
    """ki-math-extract.md section 3: pair (i,j) beats both singles
    iff M_ij > lambda - min(b_i, b_j). Brute-force against F(z)."""
    rnd = random.Random(seed)
    bad = 0
    for _ in range(trials):
        bi, bj = rnd.uniform(0, 3), rnd.uniform(0, 3)
        m = rnd.uniform(-3, 3)
        lam = rnd.uniform(0, 3)
        f_none = 0.0
        f_i = bi - lam
        f_j = bj - lam
        f_ij = bi + bj + m - 2 * lam
        brute = f_ij > max(f_i, f_j)
        criterion = m > lam - min(bi, bj)
        if brute != criterion:
            bad += 1
        # F(empty) is available too; the criterion is only about pair vs singles
        del f_none
    record(
        'E3 pair-beats-singles criterion',
        'M_ij > lambda - min(b_i,b_j) is exactly the condition for the pair to beat both singletons',
        bad == 0,
        f"{trials} random instances, {bad} disagreements with brute force",
    )


def e4_unknown_is_not_zero(trials=4000, seed=23):
    """Coercing an unknown utility to 0 destroys the needs_information signal.

    First written with a stronger claim than the data supports; the harness
    rejected it and it is restated here. See section 'corrected claims' in
    ADP-08-DECISION.uk.md.
    """
    rnd = random.Random(seed)
    changed = 0
    for _ in range(trials):
        people = list('abcdef')
        cap = {p: 1 for p in people}
        honest, coerced = [], []
        for x, y in combinations(people, 2):
            uab = rnd.choice([UNKNOWN] + [rnd.uniform(0, 5) for _ in range(6)])
            uba = rnd.choice([UNKNOWN] + [rnd.uniform(0, 5) for _ in range(6)])
            st = edge_state(uab, uba, True, True)
            if st == ELIGIBLE_SCORED:
                w = w_min(uab, uba)
                honest.append((x, y, w))
                coerced.append((x, y, w))
            elif st == NEEDS_INFORMATION:
                coerced.append((x, y, 0.0))  # the coerced reading scores it 0
        _, sel_h = best_matching(honest, cap)
        _, sel_c = best_matching(coerced, cap)
        if pairs_of(sel_h) != pairs_of(sel_c):
            changed += 1

    # Constructed case: a cohort where the only candidate for one person
    # carries an unknown counter-utility.
    cap = {p: 1 for p in 'abcd'}
    decl = {('a', 'b'): (3.0, 3.0), ('c', 'd'): (4.0, UNKNOWN)}
    honest, coerced, surfaced = [], [], []
    for (x, y), (uxy, uyx) in decl.items():
        st = edge_state(uxy, uyx, True, True)
        if st == ELIGIBLE_SCORED:
            honest.append((x, y, w_min(uxy, uyx)))
            coerced.append((x, y, w_min(uxy, uyx)))
        elif st == NEEDS_INFORMATION:
            surfaced.append((x, y))
            coerced.append((x, y, 0.0))
    _, sel_c = best_matching(coerced, cap)
    dropped_silently = ('c', 'd') not in pairs_of(sel_c) and not surfaced
    signal_kept = surfaced == [('c', 'd')]

    record(
        'E4 unknown is not zero',
        'coercing UNKNOWN to 0 removes the needs_information signal: the pair vanishes from the result with no stated reason, while the three-valued reading always surfaces it',
        signal_kept and not dropped_silently and changed > 0,
        f"{trials} random instances: selection differed in {changed} "
        f"({100.0 * changed / trials:.1f}%). Constructed case: three-valued reading surfaces "
        f"{surfaced} as needs_information; the coerced reading scores it 0, it loses to every "
        f"positive edge and leaves no trace in the output.",
    )


def e5_freshness_never_flips_eligibility(trials=5000, seed=31):
    """w(age) = 2^(-age/half_life) scales a scored edge and nothing else."""
    rnd = random.Random(seed)
    violations = 0
    for _ in range(trials):
        age = rnd.uniform(0, 400)
        half = rnd.uniform(1, 90)
        f = 2 ** (-age / half)
        if not (0 < f <= 1):
            violations += 1
        st = edge_state(UNKNOWN, 1.0, True, True)
        if st != NEEDS_INFORMATION:
            violations += 1
        st2 = edge_state(1.0, 1.0, False, True)
        if st2 != INELIGIBLE:
            violations += 1
    f0 = 2 ** (-0 / 30)
    fh = 2 ** (-30 / 30)
    record(
        'E5 freshness is a multiplier, not a gate',
        'w(0)=1, w(half_life)=0.5, 0 < w <= 1 always; freshness never turns INELIGIBLE or NEEDS_INFORMATION into a scored edge',
        violations == 0 and f0 == 1.0 and fh == 0.5,
        f"w(0)={f0:g}, w(half_life)={fh:g}, {trials} randomised checks, {violations} violations",
    )


def e6_capacity_monotonicity(trials=3000, seed=47):
    """MATH.uk.md: reduced eligible capacity cannot increase the feasible set."""
    rnd = random.Random(seed)
    bad = 0
    for _ in range(trials):
        people = list('abcde')
        edges = [(x, y, round(rnd.uniform(0, 5), 3)) for x, y in combinations(people, 2)]
        hi = {p: 2 for p in people}
        lo = dict(hi)
        lo[rnd.choice(people)] = 1
        t_hi, _ = best_matching(edges, hi)
        t_lo, _ = best_matching(edges, lo)
        if t_lo > t_hi + 1e-9:
            bad += 1
    record(
        'E6 capacity monotonicity',
        'lowering one person capacity can never raise the achievable optimum',
        bad == 0,
        f"{trials} instances, {bad} violations",
    )


def e7_tie_policy_exposure(rounds=200):
    """Constant tie-break by identifier produces unequal exposure.

    The first version of this check used an even cohort, where a perfect
    matching covers everybody and the spread is 0 - the measurement
    contradicted the claim while the check still reported PASS. Corrected
    to an odd cohort, where somebody must be left out every round.
    """
    even = list('abcdef')
    odd = list('abcde')
    out = {}
    for label, people in (('even n=6', even), ('odd n=5', odd)):
        cap = {p: 1 for p in people}
        edges = [(x, y, 1.0) for x, y in combinations(people, 2)]
        exposure = {p: 0 for p in people}
        for _ in range(rounds):
            _, sel = best_matching(edges, cap)
            for a, b, _w in sel:
                exposure[a] += 1
                exposure[b] += 1
        out[label] = (exposure, max(exposure.values()) - min(exposure.values()))
    odd_exposure, odd_spread = out['odd n=5']
    even_spread = out['even n=6'][1]
    starved = [p for p, v in odd_exposure.items() if v == 0]
    record(
        'E7 deterministic tie-break is not fair',
        'with all weights tied and an odd cohort, a constant ordering starves the same person every round; determinism is reproducibility, not fairness',
        odd_spread == rounds and len(starved) == 1 and even_spread == 0,
        f"even n=6 spread {even_spread} (a perfect matching covers everyone, so ties are invisible); "
        f"odd n=5 exposure {odd_exposure}, spread {odd_spread}, always starved: {starved}. "
        f"Fairness must be measured on its own, not inferred from determinism.",
    )


def e8_exhaustive_scale():
    """Where the exact oracle stops being viable.

    The first version of this check asserted the exhaustive oracle covers the
    P14 pilot and measured n=10 to prove it. That was wrong twice over: P14
    says 10 DISJOINT PAIRS, which is 20 participants, not 10; and density
    matters more than n. Corrected to measure both axes.
    """
    import time
    rnd = random.Random(7)
    dense, sparse = [], []
    for n in (6, 8, 10, 12, 14):
        people = [f'p{i}' for i in range(n)]
        cap = {p: 1 for p in people}
        edges = [(x, y, round(rnd.uniform(0, 5), 3)) for x, y in combinations(people, 2)]
        t0 = time.perf_counter()
        best_matching(edges, cap)
        dense.append((n, len(edges), (time.perf_counter() - t0) * 1000))
    # 20 participants (the real P14 shape) at decreasing eligible density
    people = [f'p{i}' for i in range(20)]
    cap = {p: 1 for p in people}
    allp = list(combinations(people, 2))
    for keep in (0.10, 0.20, 0.30):
        rnd2 = random.Random(3)
        edges = [(x, y, round(rnd2.uniform(0, 5), 3)) for x, y in allp if rnd2.random() < keep]
        t0 = time.perf_counter()
        best_matching(edges, cap)
        sparse.append((keep, len(edges), (time.perf_counter() - t0) * 1000))
    n12 = [r for r in dense if r[0] == 12][0][2]
    n14 = [r for r in dense if r[0] == 14][0][2]
    cliff = n14 > 10 * n12
    record(
        'E8 exact oracle scale',
        'the exhaustive oracle is exact but its cliff sits near 12-14 participants on a dense eligible graph; the P14 pilot shape is 20 participants, so only eligible-graph sparsity keeps it tractable there',
        cliff,
        'dense: ' + '; '.join(f"n={n} edges={e} {ms:.1f}ms" for n, e, ms in dense)
        + ' | 20 participants: ' + '; '.join(f"density={k:.0%} edges={e} {ms:.1f}ms" for k, e, ms in sparse),
    )


def e9_unified_objective():
    """The chosen unified form, on one instance, end to end."""
    # Declared utilities. c<->d is a fair exchange, a->b is one-sided,
    # e has not answered yet, f is not available in this window.
    decl = {
        ('a', 'b'): (10.0, 0.0),
        ('a', 'c'): (4.0, 4.0),
        ('c', 'd'): (5.0, 5.0),
        ('b', 'd'): (3.0, 3.5),
        ('a', 'e'): (4.0, UNKNOWN),
        ('c', 'f'): (4.0, 4.0),
    }
    availability = {('c', 'f'): False}
    ages = {('c', 'd'): 60.0}
    half_life, lam = 30.0, 0.5
    cap = {p: 1 for p in 'abcdef'}

    scored, needs_info, ineligible = [], [], []
    for (x, y), (uxy, uyx) in decl.items():
        st = edge_state(uxy, uyx, True, availability.get((x, y), True))
        if st == ELIGIBLE_SCORED:
            fresh = 2 ** (-ages.get((x, y), 0.0) / half_life)
            scored.append((x, y, w_min(uxy, uyx) * fresh - lam))
        elif st == NEEDS_INFORMATION:
            needs_info.append((x, y))
        else:
            ineligible.append((x, y))

    total, sel = best_matching(scored, cap)
    ok = (('a', 'b') not in pairs_of(sel)
          and ('a', 'e') in {tuple(sorted(p)) for p in needs_info}
          and ('c', 'f') in {tuple(sorted(p)) for p in ineligible})
    record(
        'E9 unified objective end to end',
        'one-sided pair not selected; unknown routed to needs_information rather than scored 0; unavailable pair ineligible regardless of weight',
        ok,
        f"selected {sorted(pairs_of(sel))} total {total:.3f}; "
        f"needs_information {sorted(needs_info)}; ineligible {sorted(ineligible)}; "
        f"c-d weight carries freshness 2^(-60/30)=0.25",
    )


def main():
    print(__doc__.strip().splitlines()[0])
    print('=' * 78)
    e1_formulas_disagree()
    e2_greedy_counterexample()
    e3_pair_beats_singles()
    e4_unknown_is_not_zero()
    e5_freshness_never_flips_eligibility()
    e6_capacity_monotonicity()
    e7_tie_policy_exposure()
    e8_exhaustive_scale()
    e9_unified_objective()
    passed = sum(1 for _, p in results if p)
    print('=' * 78)
    print(f"{passed}/{len(results)} checks passed. provider calls: 0. usd: 0.00")
    return 0 if passed == len(results) else 1


if __name__ == '__main__':
    sys.exit(main())
