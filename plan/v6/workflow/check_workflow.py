"""Read-only plan lint; delegates topology to existing Harness. Never dispatches."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, 'C:/Users/Andrii/Desktop/KI/andrey-os')
from harness.dag_wave_advisor import analyze_dag

def check(plan):
    errors = []
    tasks = plan.get('tasks', [])
    if not tasks or len(tasks) > 24:
        errors.append('NODE_LIMIT')
    if plan.get('concurrency_max') not in (1, 2, 3):
        errors.append('CONCURRENCY')
    cap = plan.get('task_cap_usd')
    if type(cap) not in (float, int) or not 0 <= cap <= 0.5:
        errors.append('CAP')
    root = Path(plan['source_root']).resolve()
    nodes = []
    for task in tasks:
        ident = task.get('id', '')
        for key in ('objective','owner_role','acceptance','rollback','input_contract',
                    'output_contract','error_contract','required_evidence','handoff','source_lock_policy'):
            if not task.get(key):
                errors.append(f'{ident}:MISSING_{key}')
        if task.get('attempt_limit') != 2 or task.get('privacy') != 'local_only':
            errors.append(f'{ident}:AUTHORITY_DRIFT')
        for source in task.get('source_paths', []):
            candidate = (root / source).resolve()
            if not candidate.is_relative_to(root) or not candidate.is_file():
                errors.append(f'{ident}:SOURCE_PATH')
        for owned in task.get('owned_paths', []):
            if not (root / owned).resolve().is_relative_to(root):
                errors.append(f'{ident}:OWNERSHIP_ESCAPE')
        # Unit duration and zero resources are topology placeholders ONLY. Do not call propose_wave
        # or infer runtime/resource estimates from this static lint.
        nodes.append(dict(id=ident,deps=task.get('depends_on',[]),state='pending',
                          duration_ms=1,cpu_milli=0,ram_mib=0,locks=[]))
    topology = analyze_dag(nodes)
    errors.extend(topology['reason_codes'])
    return {'status':'PLAN_STRUCTURE_PASS' if not errors else 'HOLD',
            'dispatch_allowed':False,'product_accepted':False,'errors':errors,
            'topological_ids':topology['topological_ids']}

if __name__ == '__main__':
    try:
        report = check(json.loads((HERE.parent/'TASKS.json').read_text(encoding='utf-8')))
    except (OSError, ValueError, KeyError, TypeError) as error:
        report = {'status':'HOLD','dispatch_allowed':False,'errors':[type(error).__name__]}
    print(json.dumps(report,ensure_ascii=False,indent=2))
    raise SystemExit(0 if report['status']=='PLAN_STRUCTURE_PASS' else 1)
