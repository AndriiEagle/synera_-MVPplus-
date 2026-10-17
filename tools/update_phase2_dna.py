import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'plan/readiness/READINESS_DNA.json'
dna = json.load(open(PATH, encoding='utf-8'))

UPDATES = {
    # --- Phase 2: математичне ядро (C02), статистика (C09) ---
    'C02.L3': ('DONE', 'web_launch/need-decay.mjs (M06 експоненційне згасання потреби, 4/4) + web_launch/b-matching.mjs (M07 зважене b-matching з квотами на людину, 4/4); M06+M07 інтегровано в matching.mjs (коміт e2aa096)'),
    'C02.L4': ('DONE', 'web_launch/stable-matching.mjs (M08 Gale–Shapley багато-до-багатьох, 5/5, включно з 1000-випадковим property-тестом «немає блокуючої пари») + web_launch/cycle-exchange.mjs (M09 цикли ≤3, 4/4; жодна людина не в двох циклах)'),
    'C02.L5': ('DONE', 'web_launch/funnel-analytics.mjs (M11 Kaplan–Meier з цензуруванням, M12 поглинальний Марков: фундаментальна матриця + точні ймовірності поглинання) + web_launch/cusum.mjs (M13 CUSUM/EWMA, 5/5, включно з бюджетом хибнопозитивів на 1000 серіях)'),
    'C02.L6': ('DONE', 'web_launch/thompson.mjs (M14 Beta–Bernoulli Thompson sampling, 5/5); заблокований варіант не обирається навіть з alpha=1000; детермінований за seed'),
    'C02.L7': ('DONE', 'web_launch/ma4.mjs (MA4 офлайн-реплей + заздалегідь зареєстровані ворота + append-only журнал рішень, 5/5); підвищення лише з виграшем на holdout ТА згодою людини'),
    'C02.L8': ('DONE', 'web_launch/n-version-hash.mjs (дві незалежні реалізації канонізації+SHA-256, 5/5; збігаються на 10 000 згенерованих випадках)'),
    'C09.L5': ('DONE', 'web_launch/funnel-analytics.mjs + web_launch/cusum.mjs; fixture parity через node:test (M11 2/2, M12 2/2, M13 5/5)'),
    'C09.L6': ('DONE', 'web_launch/ma4.mjs журнал рішень: hypothesis, metric, holdout, approval, timestamp; append-only'),

    # --- Знайдено реалізованим під час звірки ---
    'C01.L6': ('PARTIAL', 'web_launch/proof-state.mjs: повний ланцюг self_declared→evidence_supplied→checked_with_scope→outcome_confirmed, двостороннє підтвердження, скидання при матеріальній зміні; 3/3 тестів. Лишається: поля source/date/author/scope/expiry на кожну перевірку'),
    'C04.L3': ('PARTIAL', 'web_launch/field-audience.mjs: рівні аудиторії (public/community/...), filterProfileForAudience, canViewField; тести проходять. Лишається: серверне застосування на кожне поле'),
    'C10.L2': ('DONE', 'web_launch/meeting-card.mjs: картка «Ми зустрілися» публічна лише за двосторонньої згоди, кожна сторона може відкликати, терміни/ціни/контакти виключено; 4/4 тестів'),
    'C06.L6': ('DONE', 'web_launch/meeting-card.mjs renderMeetingCardHTML + наявні share card, іконки; картка зустрічі як впізнаваний артефакт; тест C06.L6 у meeting-card.test.mjs'),
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
        done += s == 'DONE'
        partial += s == 'PARTIAL'
        ns += s == 'NOT_STARTED'
        bh += s == 'BLOCKED_HUMAN'
        pk += s == 'PARKED'

print('Змінено:', ', '.join(changed))
print(f'DONE: {done} | PARTIAL: {partial} | NOT_STARTED: {ns} | BLOCKED_HUMAN: {bh} | PARKED: {pk}')
