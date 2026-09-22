import json
dna = json.load(open('plan/readiness/READINESS_DNA.json', encoding='utf-8'))
for c in dna['categories']:
    for l in c['layers']:
        if l['id'] in ['C06.L2','C06.L3','C06.L4','C06.L5','C07.L2','C07.L5']:
            print(f"{l['id']}: {l['status']} - {l.get('name','')[:60]}")