import json

filepath = r"C:\Users\Andrii\Desktop\synera\synera-docs\plan\readiness\READINESS_DNA.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

for category in data.get('categories', []):
    for item in category.get('layers', []):
        if item['id'] == 'C06.L1':
            item['status'] = 'DONE'
            item['evidence'] = 'docs/BRAND_DNA.uk.md created'
        elif item['id'] == 'C07.L5':
            item['status'] = 'DONE'
            item['evidence'] = 'Errors translated to Ukrainian in .mjs files'
        elif item['id'] == 'C09.L4':
            item['status'] = 'DONE'
            item['evidence'] = 'docs/METRICS_TREE.uk.md created'
        elif item['id'] == 'C13.L4':
            item['status'] = 'DONE'
            item['evidence'] = 'tools/synera_lock.py created'

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated READINESS_DNA.json")
