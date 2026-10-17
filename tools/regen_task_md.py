import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Регенерує task.md повністю із DNA
dna_path = r'C:\Users\Andrii\Desktop\synera\synera-docs\plan\readiness\READINESS_DNA.json'
task_path = r'C:\Users\Andrii\.gemini\antigravity-ide\brain\d084f5c1-31e8-49df-bec3-5bf79d8125dd\task.md'

dna = json.load(open(dna_path, encoding='utf-8'))

lines = ["# Synera Task Tracker\n"]
lines.append("> Авто-генерований із READINESS_DNA.json\n\n")

for c in dna['categories']:
    lines.append(f"## {c['id']}: {c.get('name','')}\n\n")
    for l in c['layers']:
        lid = l['id']
        s = l.get('status', '?')
        name = l.get('name', '')
        
        if s == 'DONE':
            checkbox = '`[x]`'
        elif s in ('BLOCKED_HUMAN', 'BLOCKED'):
            checkbox = '`[!]`'
        elif s == 'PARKED':
            checkbox = '`[~]`'
        else:
            checkbox = '`[ ]`'
        
        lines.append(f"- {checkbox} {lid}: {name}\n")
    lines.append("\n")

lines.append("\n## Legend\n")
lines.append("- `[x]` DONE\n")
lines.append("- `[ ]` NOT_STARTED\n")
lines.append("- `[!]` BLOCKED_HUMAN\n")
lines.append("- `[~]` PARKED\n")

content = ''.join(lines)
open(task_path, 'w', encoding='utf-8').write(content)

done_count = sum(1 for c in dna['categories'] for l in c['layers'] if l.get('status') == 'DONE')
pending_count = sum(1 for c in dna['categories'] for l in c['layers'] if l.get('status', '?') not in ('DONE', 'BLOCKED_HUMAN', 'BLOCKED', 'PARKED'))
blocked_count = sum(1 for c in dna['categories'] for l in c['layers'] if l.get('status', '?') in ('BLOCKED_HUMAN', 'BLOCKED'))
parked_count = sum(1 for c in dna['categories'] for l in c['layers'] if l.get('status', '?') == 'PARKED')

print(f"task.md регенеровано:")
print(f"  DONE:    {done_count}")
print(f"  PENDING: {pending_count}")
print(f"  BLOCKED: {blocked_count}")
print(f"  PARKED:  {parked_count}")
