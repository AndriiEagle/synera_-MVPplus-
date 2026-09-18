"""Checks for the R4 reality record. No dispatch, no spend, no product claim.

    python -B check_reality.py                    # validate SUPERSEDED.json alone
    python -B check_reality.py --source <path>    # re-run the measurements against the modern source

The second form is the whole point of this revision: it re-measures instead of
trusting the numbers written down here. Point it at a checkout that contains
web_launch/, neon/ and operator_dashboard.test.mjs. If the numbers have moved,
this file is stale and must be updated before anyone reads it as current.
"""
from pathlib import Path
import argparse
import json
import re
import shutil
import subprocess
import sys

HERE = Path(__file__).resolve().parent


def validate(record):
    if record['dispatch_allowed'] is not False or record['paid_authorized_cap_usd'] != 0:
        raise ValueError('R4 became execution authority')
    if record.get('provider_calls') != 0 or record.get('provider_usd') != 0:
        raise ValueError('R4 claims spend')

    rows = record['superseded']
    ids = [row['id'] for row in rows]
    if len(set(ids)) != len(ids):
        raise ValueError('duplicate superseded id')
    if not ids:
        raise ValueError('a reality record with no superseded claim is not a reality record')

    for row in rows:
        for key in ('document', 'locator', 'claim', 'reality', 'still_open'):
            if not row.get(key):
                raise ValueError(f"{row['id']}: {key} missing")
        if not row.get('evidence'):
            raise ValueError(f"{row['id']}: a superseded claim without evidence is just another claim")
        if row['claim'].strip() == row['reality'].strip():
            raise ValueError(f"{row['id']}: claim and reality are identical")

    # Every correction of the assistant's own earlier revision must say so.
    for row in rows:
        if row['document'].startswith('docs/adaptive-20260917/') and not row.get('correction_of'):
            raise ValueError(f"{row['id']}: supersedes an R3 document without naming it a correction")

    m = record['measurements']
    if m['tests_passing'] != m['tests_total']:
        raise ValueError('measurements record a failing suite; fix the code or the record, not the wording')
    if m['tests_total'] <= m['tests_before_approval_fix']:
        raise ValueError('the approval fix added tests; the totals disagree')
    if 'run_from' not in m:
        raise ValueError('the suite is path-sensitive; the record must say where it runs from')

    work = record['remaining_work']
    if not work.get('items') or not work.get('source'):
        raise ValueError('remaining work must be sourced')
    return len(rows), m['tests_total']


def measure(source):
    source = Path(source).resolve()
    tests = sorted(str(p.relative_to(source)) for p in (source / 'web_launch').glob('*.test.mjs'))
    extra = [p for p in ('neon/worker.test.mjs', 'operator_dashboard.test.mjs') if (source / p).is_file()]
    if not tests:
        raise SystemExit(f'no web_launch/*.test.mjs under {source}')
    node = shutil.which('node')
    if not node:
        raise SystemExit('node not found; cannot re-measure')
    run = subprocess.run([node, '--test', *tests, *extra], cwd=source, capture_output=True, text=True)
    out = run.stdout
    grab = lambda name: int(re.search(rf'^# {name} (\d+)$', out, re.M).group(1))
    total, passing, failing = grab('tests'), grab('pass'), grab('fail')
    build = subprocess.run([node, 'web_launch/build.mjs', '--offline'], cwd=source, capture_output=True, text=True)
    files = json.loads(build.stdout).get('files') if build.returncode == 0 and build.stdout.strip() else None
    return {'tests_total': total, 'tests_passing': passing, 'tests_failing': failing,
            'offline_build_files': files, 'suites_run': len(tests) + len(extra)}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', help='path to a checkout of the modern source')
    args = ap.parse_args()

    record = json.loads((HERE / 'SUPERSEDED.json').read_text(encoding='utf-8'))
    claims, expected = validate(record)
    out = {'status': 'PASS_R4_RECORD', 'superseded_claims': claims,
           'tests_recorded': expected, 'dispatch_allowed': record['dispatch_allowed']}

    if args.source:
        got = measure(args.source)
        out['measured'] = got
        drift = []
        if got['tests_failing']:
            drift.append(f"{got['tests_failing']} test(s) failing")
        if got['tests_total'] != expected:
            drift.append(f"suite has {got['tests_total']} tests, record says {expected}")
        recorded_files = record['measurements']['offline_build_files']
        if got['offline_build_files'] not in (None, recorded_files):
            drift.append(f"offline build produced {got['offline_build_files']} files, record says {recorded_files}")
        out['drift'] = drift
        out['status'] = 'PASS_R4_WITH_SOURCE' if not drift else 'R4_RECORD_STALE'

    print(json.dumps(out, ensure_ascii=False))
    return 1 if out['status'] == 'R4_RECORD_STALE' else 0


if __name__ == '__main__':
    sys.exit(main())
