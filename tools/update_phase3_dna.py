import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'plan/readiness/READINESS_DNA.json'
dna = json.load(open(PATH, encoding='utf-8'))

UPDATES = {
    # --- Phase 3: дані/синхронізація/приватність ---
    'C03.L2': ('DONE', 'B2-rework завершено: match_cases пише КОЛОНКИ (case_id, participant_low/high, mode, material, terms_hash, expires_at; закриття через PATCH status), погодження — окремі рядки match_case_approvals (V6-03), читання реконструює стан з caseFromRows(row, approvalRows). Gate: web_launch/b2-case-store-shape.test.mjs SYN_CASE_STORE_MATCHES_SQL 1/1 + case-approval-guard 10/10 + E2E 1/1'),
    'C03.L5': ('DONE', 'neon/worker.mjs TABLES allowlist (profiles, pilot_consents, meeting_requests, meeting_messages, profile_blocks, profile_reports, match_cases, match_case_approvals); усе поза списком → 404 (/data/rpc, /data/synera_pilot_members). RLS+column grants — справжнє застосування. neon/worker.test.mjs 16/16'),
    'C03.L6': ('DONE', 'Двостороння синхронізація кейсу через store: party A і party B незалежно погоджують і доходять до approved_for_next_step. Gate: case-approval-guard.test.mjs «X6 / V6-06» + e2e-neon-flow.test.mjs (restore→approve→invalidate) 1/1'),
    'C04.L4': ('DONE', 'web_launch/soft-block.mjs: м\'який блок за людиною (hiddenPeople) і категорією (hiddenCategories); прихований глядач не бачить жодного поля; filterDiscoverable виключає профілі власників, що приховали глядача; чисто, без сповіщень, fail-closed через C04.L3. 8/8 тестів'),
    'C13.L3': ('PARTIAL', 'e2e-neon-flow.test.mjs: повний scripted lifecycle проти мок-Neon (restore, discover, audience, двостороннє погодження, матеріальна ревізія з version+=1 і скиданням погоджень) — 1/1 PASS. Лишається: реальний браузер (Playwright), не лише fetch-мок'),
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
print('Змінено:', ', '.join(changed) if changed else '(без змін)')
print(f'DONE: {done} | PARTIAL: {partial} | NOT_STARTED: {ns} | BLOCKED_HUMAN: {bh} | PARKED: {pk}')