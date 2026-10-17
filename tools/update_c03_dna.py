import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'plan/readiness/READINESS_DNA.json'
dna = json.load(open(PATH, encoding='utf-8'))

UPDATES = {
    'C03.L2': ('PARTIAL',
        'B2-rework частково: per-party approval rows тепер пишуться (клієнт V6-03 → /rest/v1/match_case_approvals, поля case_id/party_id/approved_version/approved_terms_hash; серверна таблиця + RLS + acceptance.sql уже в supabase/case-state.proposal.sql; case-approval-guard 10/10, E2E 1/1). Лишається: match_cases досі шле один JSON-blob state, тоді як SQL-таблиця очікує колонки participant_low/high, mode, material, terms_hash, expires_at'),
    'C13.L3': ('PARTIAL',
        'web_launch/e2e-neon-flow.test.mjs: повний scripted lifecycle проти мок-Neon (restore сесії, discover, audience-фільтр, approval у match_case_approvals, двосторонній approved_for_next_step) — 1/1 PASS. Лишається: реальний браузер (Playwright), не лише fetch-мок'),
}

changed = []
for c in dna['categories']:
    for l in c['layers']:
        if l['id'] in UPDATES:
            status, evidence = UPDATES[l['id']]
            if l.get('status') != status or l.get('evidence') != evidence:
                changed.append(f"{l['id']}:{l.get('status')}→{status}")
            l['status'] = status
            l['evidence'] = evidence
            l.pop('next', None)

json.dump(dna, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

done = partial = ns = bh = pk = 0
for c in dna['categories']:
    for l in c['layers']:
        s = l.get('status', '?')
        done += s == 'DONE'; partial += s == 'PARTIAL'; ns += s == 'NOT_STARTED'
        bh += s == 'BLOCKED_HUMAN'; pk += s == 'PARKED'
print('Змінено:', ', '.join(changed) if changed else '(без змін)')
print(f'DONE: {done} | PARTIAL: {partial} | NOT_STARTED: {ns} | BLOCKED_HUMAN: {bh} | PARKED: {pk}')
