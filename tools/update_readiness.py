import json

filepath = r"C:\Users\Andrii\Desktop\synera\synera-docs\plan\readiness\READINESS_DNA.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

for category in data.get('categories', []):
    for item in category.get('layers', []):
        if item['id'] == 'C06.L6':
            item['status'] = 'DONE'
            item['evidence'] = 'meeting-card.mjs renderMeetingCardHTML and tested'
        elif item['id'] == 'C11.L1':
            item['status'] = 'DONE'
            item['evidence'] = 'economics.mjs caseEconomics logic added'
        elif item['id'] == 'C11.L2':
            item['status'] = 'DONE'
            item['evidence'] = 'docs/MONETIZATION_C11.uk.md explicit matrix'
        elif item['id'] == 'C13.L3':
            item['status'] = 'DONE'
            item['evidence'] = 'tools/run_e2e_browser.mjs via Playwright'

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Updated READINESS_DNA.json for the 4 tasks")
