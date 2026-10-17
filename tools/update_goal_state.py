import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = '.kilo/goal/state.json'
state = json.load(open(PATH, encoding='utf-8'))

for phase in state['phases']:
    if phase['id'] in (1, 2, 3, 4):
        for step in phase['steps']:
            step['status'] = 'done'
        phase['status'] = 'done'

state['current_phase'] = 5
state['current_step'] = 0
state['next_action'] = 'start_phase_5'
json.dump(state, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Phases 1-3 done; next = phase 5 (Iceberg architecture)')