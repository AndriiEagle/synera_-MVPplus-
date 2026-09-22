import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'plan/readiness/READINESS_DNA.json'
dna = json.load(open(PATH, encoding='utf-8'))

# Phase 1 completed layers with evidence on disk
UPDATES = {
    'C06.L2': {
        'status': 'DONE',
        'evidence': 'web_launch/tokens.css: 162 semantic tokens extracted from style.css; no raw hex outside tokens.css',
    },
    'C06.L3': {
        'status': 'DONE',
        'evidence': 'web_launch/catalogue.html: every component in default/hover/focus/disabled/loading/error states; 135 state references',
    },
    'C06.L4': {
        'status': 'DONE',
        'evidence': 'web_launch/a11y_audit.mjs + a11y_audit.md: axe-core, index.html 0 violations, catalogue.html 0 violations (3 critical/serious fixed)',
    },
    'C06.L5': {
        'status': 'DONE',
        'evidence': 'tokens.css @media (prefers-reduced-motion: reduce); --transition-fast 0.15s / --transition-normal 0.3s',
    },
    'C07.L2': {
        'status': 'DONE',
        'evidence': 'web_launch/i18n/de.json, en.json, fr.json: 231 keys each; DE complete for Swiss target audience',
    },
    'C07.L5': {
        'status': 'DONE',
        'evidence': 'All domain errors translated to Ukrainian across 14 .mjs files (app, build, business-case, config, data, economics, health-check, matching, neon-store, online-store, profile-portability, profile-store, simulation, calendar)',
    },
}

changed = []
for c in dna['categories']:
    for l in c['layers']:
        if l['id'] in UPDATES:
            l['status'] = UPDATES[l['id']]['status']
            l['evidence'] = UPDATES[l['id']]['evidence']
            l.pop('next', None)
            changed.append(l['id'])

json.dump(dna, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# Recount
done = partial = ns = bh = pk = 0
for c in dna['categories']:
    for l in c['layers']:
        s = l.get('status', '?')
        done += s == 'DONE'
        partial += s == 'PARTIAL'
        ns += s == 'NOT_STARTED'
        bh += s == 'BLOCKED_HUMAN'
        pk += s == 'PARKED'

print('Updated layers:', ', '.join(changed))
print(f'DONE: {done} | PARTIAL: {partial} | NOT_STARTED: {ns} | BLOCKED_HUMAN: {bh} | PARKED: {pk}')
