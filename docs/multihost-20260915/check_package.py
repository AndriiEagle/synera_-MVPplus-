"""Read-only, stdlib checks for this finite planning package; no runtime authority."""
import hashlib
import json
from pathlib import Path
import re
import argparse

ROOT = Path(__file__).resolve().parent


def validate_tasks(data):
    if data.get('dispatch_allowed') is not False or data.get('paid_authorized_cap_usd') != 0:
        raise ValueError('planning authority escaped')
    tasks = data['tasks']
    if len(tasks) != 19 or len(tasks) > data['node_limit'] or data['node_limit'] > 24:
        raise ValueError('node count escaped')
    if not 0 <= data['concurrency_max'] <= 3:
        raise ValueError('global worker ceiling escaped')
    seen = set()
    ancestors = {}
    owners = {}
    for task in tasks:
        tid = task['id']
        if tid in seen or not set(task['depends_on']) <= seen:
            raise ValueError('duplicate, cycle or missing dependency')
        ancestors[tid] = set(task['depends_on'])
        for dep in task['depends_on']:
            ancestors[tid].update(ancestors[dep])
        for field in ['acceptance', 'rollback', 'owner_role', 'input_contract', 'output_contract', 'error_contract']:
            if not task.get(field):
                raise ValueError('incomplete task contract')
        override = data.get('r1_overrides', {}).get(tid, {})
        for name in override.get('owned_paths', task['owned_paths']):
            parts = Path(name).parts
            if Path(name).is_absolute() or '..' in parts or ':' in name or '\\' in name:
                raise ValueError('path escape')
            normal = name.casefold()
            if normal in owners and owners[normal] not in ancestors[tid]:
                raise ValueError('unordered shared writer')
            owners[normal] = tid
        seen.add(tid)
    if seen != {f'V6-{i:02d}' for i in range(19)}:
        raise ValueError('legacy identities changed')
    return {'tasks': len(tasks), 'effective_owned_files': len(owners)}


def check(require_acceptance=False):
    summary = validate_tasks(json.loads((ROOT / 'V6_TASKS.json').read_text(encoding='utf-8')))
    for path in ROOT.glob('*.json'):
        json.loads(path.read_text(encoding='utf-8'))
    for path in ROOT.glob('*.md'):
        body = path.read_text(encoding='utf-8')
        for link in re.findall(r'\]\(([^)]+)\)', body):
            if '://' in link or link.startswith('#'):
                continue
            target = (ROOT / link.split('#')[0]).resolve()
            if not target.is_relative_to(ROOT) or not target.is_file():
                raise ValueError(f'broken/outside package link in {path.name}: {link}')
    plan = json.loads((ROOT / 'PLAN.json').read_text(encoding='utf-8'))
    if plan['mode'] != 'plan_only' or len(plan['steps']) != 5:
        raise ValueError('five finite preparation layers required')
    for i, step in enumerate(plan['steps']):
        expected = [] if i == 0 else [plan['steps'][i-1]['step_id']]
        if step['depends_on'] != expected:
            raise ValueError('preparation layers must be sequential')
    receipt = ROOT / 'ACCEPTANCE.json'
    if require_acceptance:
        if not receipt.is_file():
            raise ValueError('final acceptance receipt missing')
        layers = json.loads((ROOT / 'REVIEW_LAYERS.json').read_text(encoding='utf-8'))['layers']
        if [row['layer'] for row in layers] != [1, 2, 3, 4, 5]:
            raise ValueError('five completed review layers required')
        if any(row['status'] != 'VERIFIED_WITH_LIMITS' for row in layers):
            raise ValueError('review layer incomplete')
    if receipt.exists():
        record = json.loads(receipt.read_text(encoding='utf-8'))
        expected_files = {f.name for f in ROOT.iterdir() if f.is_file() and f.name != 'ACCEPTANCE.json'}
        if require_acceptance and set(record['artifact_hashes']) != expected_files:
            raise ValueError('final artifact inventory incomplete')
        for name, expected in record['artifact_hashes'].items():
            if name != Path(name).name or name in ('.', '..'):
                raise ValueError('receipt path escape')
            actual = hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
            if actual != expected:
                raise ValueError(f'accepted artifact drift: {name}')
    label = 'PASS_DOCUMENTATION_ACCEPTANCE_ONLY' if require_acceptance else 'PASS_DRAFT_PLANNING_CHECKS_ONLY'
    print(json.dumps({'status': label, **summary}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--final', action='store_true', help='Require all five layers and complete artifact hashes')
    check(parser.parse_args().final)
