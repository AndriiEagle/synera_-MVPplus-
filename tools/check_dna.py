import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

dna = json.load(open(r'C:\Users\Andrii\Desktop\synera-clone\plan\readiness\READINESS_DNA.json', encoding='utf-8'))

done, blocked, pending = [], [], []

for c in dna['categories']:
    for l in c['layers']:
        s = l.get('status', '?')
        lid = l['id']
        name = l.get('name', '')[:50]
        label = f"{lid}: {name}"
        if s == 'DONE':
            done.append(label)
        elif s == 'BLOCKED':
            blocked.append(label)
        else:
            pending.append(f"{label} [{s}]")

print(f"DONE:    {len(done)}")
print(f"BLOCKED: {len(blocked)}")
print(f"PENDING: {len(pending)}")
print()
print("--- PENDING ---")
for p in pending:
    print(" ", p)
print()
print("--- BLOCKED ---")
for b in blocked:
    print(" ", b)
