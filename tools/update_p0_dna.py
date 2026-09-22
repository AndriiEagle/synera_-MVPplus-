import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'plan/readiness/READINESS_DNA.json'
dna = json.load(open(PATH, encoding='utf-8'))

UPDATES = {
    'C03.L2': ('DONE',
        'B2-rework + P0-2: match_cases пише КОЛОНКИ з розділенням грантів — новий кейс: POST insert-only (case_id, participant_low/high, mode, material, terms_hash, expires_at); оновлення: PATCH лише UPDATE-грантованих колонок (mode, material, terms_hash, expires_at), закриття: PATCH {status} (тригер заморожує решту). Погодження — окремі рядки match_case_approvals (V6-03, withdrawn_at = server-owned). Читання реконструює caseFromRows(row, approvalRows) + P0-3: approvals order=desc, withdrawn_at=is.null (усуває corruption при >100 рядках). P1-6: валідація material (об\'єкт, mode з переліку, ≤16384 б) і expiresAt. Gate: b2-case-store-shape 1/1, case-approval-guard 10/10, portability 14/14, E2E 1/1'),
    'C04.L4': ('DONE',
        'web_launch/soft-block.mjs: м\'який блок за людиною (hiddenPeople) і категорією (hiddenCategories); прихований глядач не бачить жодного поля; filterDiscoverable виключає профілі власників, що приховали глядача; чисто, без сповіщень, fail-closed через C04.L3. 8/8 тестів. Відома межа (P2): фільтр клієнтський; server-ens enforcement потребуватиме column-level грантів, якщо колись додадуть чутливі колонки в profiles (зараз їх у схемі немає: schema.sql:6-14 — id/display_name/city/offers/seeks/is_discoverable/created_at/brief/map_visible)'),
    'C13.L3': ('PARTIAL',
        'e2e-neon-flow.test.mjs: мок-Neon приведено до реального контракту — insert-only POST, PATCH з version-bump як synera_case_guard (material/mode/terms change -> +1), closed-case immutability, server-owned withdrawn_at, детермінований SERVER_NOW. Повний lifecycle (restore→discover→approve×2→revision) 1/1 PASS. Лишається: реальний браузер (Playwright)'),
}

changed = []
for c in dna['categories']:
    for l in c['layers']:
        if l['id'] in UPDATES:
            status, evidence = UPDATES[l['id']]
            if l.get('status') != status:
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
print('Змінено:', ', '.join(changed) if changed else '(evidence only)')
print(f'DONE: {done} | PARTIAL: {partial} | NOT_STARTED: {ns} | BLOCKED_HUMAN: {bh} | PARKED: {pk}')