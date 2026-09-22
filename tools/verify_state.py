import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Перевіряємо, чи task.md узгоджений з DNA
dna_path = r'C:\Users\Andrii\Desktop\synera\synera-docs\plan\readiness\READINESS_DNA.json'
task_path = r'C:\Users\Andrii\.gemini\antigravity-ide\brain\d084f5c1-31e8-49df-bec3-5bf79d8125dd\task.md'

dna = json.load(open(dna_path, encoding='utf-8'))
task_md = open(task_path, encoding='utf-8').read()

mismatches = []
for c in dna['categories']:
    for l in c['layers']:
        lid = l['id']
        s = l.get('status', '?')
        if s == 'DONE':
            # має бути [x] в task.md
            if f'- `[ ]` {lid}' in task_md:
                mismatches.append(f"DNA=DONE але task.md=[ ] : {lid}")
            elif f'- `[x]` {lid}' not in task_md and f'- `[/]` {lid}' not in task_md:
                mismatches.append(f"DNA=DONE але {lid} відсутній у task.md")
        else:
            # не DONE - має бути [ ] або відсутній
            if f'- `[x]` {lid}' in task_md:
                mismatches.append(f"DNA={s} але task.md=[x] : {lid}")

if mismatches:
    print(f"РОЗБІЖНОСТІ ({len(mismatches)}):")
    for m in mismatches:
        print(" !", m)
else:
    print("OK: DNA і task.md синхронізовані")

# Перевіряємо чи всі файли з commitів реально існують
import os
key_files = [
    'web_launch/tokens.css',
    'web_launch/catalogue.html',
    'web_launch/cascade.mjs',
    'web_launch/iceberg-client.mjs',
    'web_launch/server_cascade_api.mjs',
    'tools/a11y_audit.mjs',
    'tools/vector_db_service.py',
    'web_launch/sw.mjs',
    'web_launch/pwa.mjs',
    'web_launch/assets.mjs',
]

print()
print("--- ФАЙЛИ ---")
for f in key_files:
    exists = os.path.exists(f)
    print(f"  {'OK' if exists else 'MISSING'}: {f}")
