"""Offline checks for the R3 addendum. No dispatch, no spend, no product claim.

Usage:
    python -B check_r3.py                      # validate CONTEXT_R3.json alone
    python -B check_r3.py --repo /path/to/repo # also re-verify every claim made about the repository

The second form is the point: it re-runs the audit instead of trusting it.
"""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import sys

HERE = Path(__file__).resolve().parent

ADP_IDS = {f'ADP-{i:02d}' for i in range(1, 10)}
P_IDS = {f'P{i:02d}' for i in range(1, 17)}
VERDICTS = {
    'EXTENDS_P02', 'COLLIDES_RESOLVED_BY_FORM', 'BOUNDED_BY_C28', 'PARTIALLY_EXISTS',
    'HARD_COLLISION_NEEDS_OWNER_DECISION', 'MUST_BE_BOUNDED', 'DESIGN_CONSTRAINT',
    'SUBSTRATE_EXISTS_UNCONNECTED', 'SCOPE_DECLARATION',
}
SEVERITIES = {
    'BLOCKS_DOCUMENTED_GATE', 'OPERATIONAL_RISK', 'CONTEXT_LOSS', 'VERIFICATION_TRAP',
    'DECLARATION_MISMATCH', 'HYGIENE', 'HYGIENE_NOT_A_LEAK', 'MISFILED',
}


def validate_addendum(ctx):
    if ctx['dispatch_allowed'] is not False or ctx['paid_authorized_cap_usd'] != 0:
        raise ValueError('R3 became execution authority')
    if ctx.get('provider_calls') != 0 or ctx.get('provider_usd') != 0:
        raise ValueError('R3 claims spend')

    rows = ctx['adp_requirements']
    ids = [r['id'] for r in rows]
    if set(ids) != ADP_IDS or len(ids) != len(ADP_IDS):
        raise ValueError('ADP requirement lost or duplicated')

    known = P_IDS | {f'C{i:02d}' for i in range(1, 44)} | {f'D{i:02d}' for i in range(1, 19)}
    for row in rows:
        if not row.get('requirement') or not row.get('acceptance'):
            raise ValueError(f"{row['id']}: requirement or acceptance missing")
        if row['verdict'] not in VERDICTS:
            raise ValueError(f"{row['id']}: unsupported verdict {row['verdict']}")
        if not isinstance(row.get('dispatch_recommended_now'), bool):
            raise ValueError(f"{row['id']}: dispatch recommendation must be explicit")
        for cid in row.get('collides_with', []):
            if cid not in known:
                raise ValueError(f"{row['id']}: collision {cid} is not a known requirement or decision id")
        if row['verdict'] == 'HARD_COLLISION_NEEDS_OWNER_DECISION' and not row.get('open_decision'):
            raise ValueError(f"{row['id']}: hard collision must name the open decision")
        if row['dispatch_recommended_now'] and not row.get('why_now'):
            raise ValueError(f"{row['id']}: a dispatch recommendation must justify itself")

    # A requirement that reads consent data must not be recommended before P03/P04.
    for rid in ('ADP-02', 'ADP-03', 'ADP-05'):
        row = next(r for r in rows if r['id'] == rid)
        if row['dispatch_recommended_now']:
            raise ValueError(f'{rid} recommended before the consent record it depends on')

    # A contract may only exist for a requirement that was recommended for work.
    # This is the guard against quietly advancing the parked ones.
    for row in rows:
        if 'contract' not in row:
            continue
        if not row['dispatch_recommended_now']:
            raise ValueError(f"{row['id']}: carries a contract but was not recommended for work")
        c = row['contract']
        for key in ('document', 'reference_implementation', 'status', 'checks'):
            if not c.get(key):
                raise ValueError(f"{row['id']}: contract missing {key}")
        if not c['status'].endswith('_FOR_SOURCE_REVIEW'):
            raise ValueError(f"{row['id']}: a contract cannot claim more than source-review readiness")
        if not c.get('open_preconditions') and not c.get('unknown_inputs'):
            raise ValueError(f"{row['id']}: contract states no open preconditions or unknown inputs")

    if not ctx['sequencing'].get('order') or not ctx['sequencing'].get('rule'):
        raise ValueError('sequencing incomplete')

    for d in ctx['defects_found']:
        if d['severity'] not in SEVERITIES:
            raise ValueError(f"{d['id']}: unsupported severity")
        if not d.get('fix'):
            raise ValueError(f"{d['id']}: defect reported without a fix")

    for key in ('P01-P16', 'GEO-01', 'F01-F24', 'C01-C43', '19 V6'):
        if not any(key.split()[0] in line for line in ctx['preserves_unchanged']):
            raise ValueError(f'preservation statement missing for {key}')
    return len(rows), len(ctx['defects_found'])


def sh(repo, *args):
    return subprocess.run(args, cwd=repo, capture_output=True, text=True).stdout.strip()


def verify_repo(ctx, repo):
    repo = Path(repo).resolve()
    findings = []

    head = sh(repo, 'git', 'rev-parse', 'HEAD')
    audited = ctx['audited_commit']
    # The audited commit must be reachable from HEAD. Equality is too strict:
    # a fix or a later revision legitimately sits on top of it.
    reachable = subprocess.run(['git', 'merge-base', '--is-ancestor', audited, 'HEAD'],
                               cwd=repo, capture_output=True).returncode == 0
    if not reachable and head != audited:
        findings.append(f"audited commit {audited[:12]} is not reachable from HEAD {head[:12]}")

    context = json.loads((repo / 'docs/context-20260916/CONTEXT.json').read_text(encoding='utf-8'))
    if {r['requirement_id'] for r in context['requirements']} != P_IDS:
        findings.append('P01-P16 no longer intact in CONTEXT.json')
    if context['geo_requirement']['v6_task_added'] is not False:
        findings.append('GEO-01 was silently dispatched')
    if context['dispatch_allowed'] is not False:
        findings.append('R2 context became execution authority')

    tasks = json.loads((repo / 'docs/multihost-20260915/V6_TASKS.json').read_text(encoding='utf-8'))['tasks']
    planned = sum(1 for t in tasks if t.get('status') == 'PLANNED')
    if len(tasks) != 19:
        findings.append(f'V6 card count changed: {len(tasks)}')
    if planned != 18:
        findings.append(f'V6 PLANNED count is {planned}, audit recorded 18')

    drift = next(d for d in ctx['defects_found'] if d['id'] == 'DEF-R3-01')
    pc = repo / 'docs/context-20260916/PRODUCT_CONTEXT.uk.md'
    actual = hashlib.sha256(pc.read_bytes()).hexdigest()
    recorded = json.loads((repo / 'docs/context-20260916/RECONCILIATION.json').read_text(
        encoding='utf-8'))['public_artifact_hashes']['docs/context-20260916/PRODUCT_CONTEXT.uk.md']
    if actual != drift['actual_hash']:
        findings.append('PRODUCT_CONTEXT.uk.md content changed since the audit')
    gate = 'FIXED' if recorded == actual else 'STILL_DRIFTED'

    # DEF-R3-08: recorded MODERN_SOURCE hashes reproduce only from CRLF bytes.
    crlf_only = []
    for s in context['sources']:
        if s['root_alias'] != 'MODERN_SOURCE':
            continue
        f = repo / s['source_path']
        if not f.is_file():
            continue
        lf = f.read_bytes().replace(b'\r\n', b'\n')
        if hashlib.sha256(lf).hexdigest() == s['sha256']:
            continue
        if hashlib.sha256(lf.replace(b'\n', b'\r\n')).hexdigest() == s['sha256']:
            crlf_only.append(s['id'])
        else:
            findings.append(f"{s['id']}: content differs from record beyond line endings")

    return {'findings': findings, 'r2_gate': gate, 'crlf_only_hashes': crlf_only}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--repo', help='path to a checkout of the audited branch')
    args = ap.parse_args()

    ctx = json.loads((HERE / 'CONTEXT_R3.json').read_text(encoding='utf-8'))
    count, defects = validate_addendum(ctx)

    # Re-run every harness a contract points at. A claimed check count that the
    # script itself does not produce is a failure, not a note.
    harnesses = {}
    for row in ctx['adp_requirements']:
        c = row.get('contract')
        if not c:
            continue
        impl = HERE / c['reference_implementation']
        if not impl.is_file():
            raise ValueError(f"{row['id']}: reference implementation {impl.name} missing")
        run = subprocess.run([sys.executable, '-B', str(impl)], cwd=HERE,
                             capture_output=True, text=True)
        passed = [ln for ln in run.stdout.splitlines() if ln.endswith('passed. provider calls: 0. usd: 0.00')]
        claimed = c['checks']
        actual = passed[0].split()[0] if passed else 'none'
        if run.returncode != 0 or actual != claimed:
            raise ValueError(f"{row['id']}: harness reports {actual}, contract claims {claimed}, rc={run.returncode}")
        harnesses[impl.name] = actual

    out = {'status': 'PASS_R3_ADDENDUM', 'adp_requirements': count, 'defects': defects,
           'contracts': sorted(harnesses), 'harness_results': harnesses,
           'dispatch_allowed': ctx['dispatch_allowed'], 'paid_authorized_cap_usd': ctx['paid_authorized_cap_usd']}

    if args.repo:
        repo = verify_repo(ctx, args.repo)
        out['repo_r2_gate'] = repo['r2_gate']
        out['repo_crlf_only_hashes'] = repo['crlf_only_hashes']
        out['repo_findings'] = repo['findings']
        out['status'] = 'PASS_R3_WITH_REPO' if not repo['findings'] else 'R3_REPO_DIVERGED'

    print(json.dumps(out, ensure_ascii=False))
    return 0 if out['status'] != 'R3_REPO_DIVERGED' else 1


if __name__ == '__main__':
    sys.exit(main())
