import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PATH = 'plan/readiness/READINESS_DNA.json'
dna = json.load(open(PATH, encoding='utf-8'))

UPDATES = {
    'C10.L3': ('DONE', 'web_launch/referral.mjs: атрибутивний токен, UWG-розкриття винагороди обов\'язково входить у shareText (Verdienst:...), самореферальна ферма заборонена (SELF_REFERRAL); 4/4 тестів'),
    'C10.L4': ('DONE', 'web_launch/community.mjs: кейс публікує одна сторона, друга підключається (автор не може приєднатись до власного), контакти організатору лише при взаємній згоді, картка без контактів до згоди; 5/5 тестів'),
    'C10.L5': ('DONE', 'web_launch/k-anon.mjs: k=5 за замовчуванням; групи < k зливаються в other, сама other теж поважає k; детермінований шум (seeded LCG); 1 людина ніколи не публікується при 200 seed; canPublish оракул; 6/6 тестів'),
    'C10.L6': ('DONE', 'web_launch/virality.mjs: k-фактор (invitesPerMember × conversion), час до першої пари (hand-computed), publishableVirality зв\'язана з C10.L5 (когорта і запрошені >= k); 7/7 тестів'),
    'C11.L1': ('DONE', 'web_launch/case-cost.mjs: оператор-хвилини (категорії з economics.mjs), AI-виклики, гроші; невиміряне = unknown, не нуль (unknownCashCases); MIXED_CURRENCIES відхиляється; perCaseAverage; 5/5 тестів'),
    'C11.L2': ('DONE', 'web_launch/tier-matrix.mjs: free/pro/organizer + 4 кредитні дії; gate: matching_is_free, trust_never_sold, safety_never_sold (заморожена матриця, buy_trust/bypass_safety неможливі за контракт); canPerform з балансом леджера; 4/4 тестів'),
    'C11.L3': ('DONE', 'web_launch/credit-ledger.mjs: append-only (новий масив), ідемпотентність по idempotencyKey (без подвійного списання), spend у межах балансу (NEGATIVE_BALANCE_IN_LEDGER неможливий), refund лише за існуючим spend і не більше суми; 5/5 тестів'),
    'C11.L5': ('DONE', 'web_launch/viewers.mjs: gate — власник без опції не бачить НІКОГО; видимі лише взаємні переглядачі; останній перегляд кожного, новіші перші; optOut миттєвий; 5/5 тестів'),
    'C11.L6': ('DONE', 'web_launch/wtp.mjs: рамка на РЕАЛЬНИХ людях — consent окремий від участі (CONSENT_REQUIRED), дубль учасника неможливий, WTP-крива публічна лише при >= k відповідях на ціну, viablePrice за порогом; 5/5 тестів'),
    'C12.L3': ('DONE', 'web_launch/differentiation.mjs: requiredSampleSize (канонічна формула d=0.5 -> 63/групу, Acklam inverseNormalCdf без залежностей), pairedDifference (t-статистика, нульова дисперсія без ділення на нуль); verdict сигнальний, фінальне рішення за оператором; 5/5 тестів'),
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