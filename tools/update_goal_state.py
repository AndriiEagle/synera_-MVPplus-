import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = '.kilo/goal/state.json'
state = json.load(open(PATH, encoding='utf-8'))

for phase in state['phases']:
    if phase['id'] == 2:
        for step in phase['steps']:
            step['status'] = 'done'
        phase['status'] = 'done'
    if phase['id'] == 1:
        phase['status'] = 'done'

state['current_phase'] = 3
state['current_step'] = 0
state['next_action'] = 'start_phase_3'
json.dump(state, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('Phase 1 + Phase 2 marked done; next = phase 3')
