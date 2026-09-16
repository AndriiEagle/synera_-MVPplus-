"""Offline completeness checks for the derived context; no dispatch or product claims."""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent


def validate(context, spec, insights, claims):
    expected = {r['id'] for r in spec['data']['requirements']}
    rows = context['requirements']
    if expected != {f'P{i:02d}' for i in range(1, 17)}:
        raise ValueError('source specification incomplete')
    if {r['requirement_id'] for r in rows} != expected or len(rows) != len(expected):
        raise ValueError('requirement lost or duplicated')
    original = {r['id']: r for r in spec['data']['requirements']}
    source_ids = {s['id'] for s in context['sources']}
    for row in rows:
        if row['source_id'] not in source_ids or not row['source_locator'] or not row['gap_or_boundary']:
            raise ValueError('unbound requirement')
        if row['acceptance'] != original[row['requirement_id']]['acceptance']:
            raise ValueError('original acceptance clause changed')
        if row['coverage_verdict'] not in {'PARTIAL', 'PLANNED_NOT_ACCEPTED', 'EXPLICITLY_PARKED',
                'CROSS_CUTTING_SOURCE_REVIEW', 'EXTERNAL_GATE', 'MISSING_DEDICATED_OWNER', 'MISSING_PRESERVATION_ORACLE'}:
            raise ValueError('unsupported completion claim')
    if context['dispatch_allowed'] is not False or context['paid_authorized_cap_usd'] != 0:
        raise ValueError('context became execution authority')
    features = {f['id']: f for f in context['preservation_inventory']}
    for fid in ['LEGACY_MAP', 'CITY_MAP', 'PROFILE', 'DISCOVERY', 'CASE', 'MEETING', 'PRIVACY']:
        if fid not in features or features[fid]['source_id'] not in source_ids:
            raise ValueError('existing capability omitted')
    if context['geo_requirement']['id'] != 'GEO-01' or context['geo_requirement']['v6_task_added']:
        raise ValueError('geo requirement omitted or silently dispatched')
    ids = [i['id'] for i in insights['items']]
    if set(ids) != {f'C{i:02d}' for i in range(1, 44)} | {f'D{i:02d}' for i in range(1, 19)} or len(ids) != 61:
        raise ValueError('source decisions omitted')
    if {c['id'] for c in claims['claims']} != {f'F{i:02d}' for i in range(1, 25)} or len(claims['claims']) != 24:
        raise ValueError('archived fact-check index incomplete')
    if claims['current_external_verification'] is not False:
        raise ValueError('archived assessment promoted to current fact')


def load(name):
    return json.loads((ROOT / name).read_text(encoding='utf-8'))


def check(final=False):
    validate(load('CONTEXT.json'), load('archive/PRODUCT_SPEC.json'), load('INSIGHTS.json'), load('archive/CLAIM_DISPOSITIONS.json'))
    for file in [REPO / 'SYNERA_START_HERE.uk.md', *ROOT.glob('*.md')]:
        for target in re.findall(r'\]\(([^)]+)\)', file.read_text(encoding='utf-8')):
            if '://' in target or target.startswith('#'):
                continue
            dest = (file.parent / target.split('#')[0]).resolve()
            if not dest.is_relative_to(REPO) or not dest.is_file():
                raise ValueError(f'missing linked context: {file.name}: {target}')
    if final:
        receipt = load('RECONCILIATION.json')
        if receipt['status'] != 'CONTEXT_RECONCILED_WITH_SOURCE_AND_RUNTIME_LIMITS':
            raise ValueError('reconciliation incomplete')
        expected = {'README.md', '.gitattributes', 'SYNERA_START_HERE.uk.md'} | {
            str(f.relative_to(REPO)).replace('\\', '/') for f in ROOT.rglob('*')
            if f.is_file() and f.name != 'RECONCILIATION.json' and '__pycache__' not in f.parts}
        if set(receipt['public_artifact_hashes']) != expected:
            raise ValueError('public inventory incomplete')
        for name, sha in receipt['public_artifact_hashes'].items():
            file = (REPO / name).resolve()
            if not file.is_relative_to(REPO) or hashlib.sha256(file.read_bytes()).hexdigest() != sha:
                raise ValueError('artifact drift: '+name)
    print(json.dumps({'status': 'PASS_FINAL_CONTEXT' if final else 'PASS_DRAFT_CONTEXT', 'requirements':16,'insights':61,'archived_claims':24}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--final', action='store_true')
    check(parser.parse_args().final)
