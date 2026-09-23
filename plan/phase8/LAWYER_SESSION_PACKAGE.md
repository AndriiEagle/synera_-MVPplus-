# ЮРИСТ-ПАКЕТ: сесія 30 хв — C05.L6 + C15.L7 (Q5+Q10), 2026-09-23

Картка Q5+Q10 оркестратора. **Цей пакет НЕ замінює підпис юриста; C05.L6/C15.L7 залишаються BLOCKED_HUMAN до його рішення.** Призначення: оператор відкриває один файл перед дзвінком з Gilbert — все всередині.

## (a) Огляд системи (5 рядків для юриста)

1. Synera (CNRA) — платформа, що зводить солопідприємців Швейцарії у взаємовигідні співпраці: профіль → пара з причиною → бізнес-кейс з умовами → двостороннє підтвердження → знайомство → проба → результат.
2. Матчинг детермінований (математичні агенти), людина не оцінюється балом; синтетичні учасники завжди з міткою `synthetic: true` і ніколи не потрапляють у справжнє сховище.
3. Монетизація: підписки/комісії ≥ CHF 100k → MWST-реєстрація; QR-bill машина готова але **flag OFF** (жодних грошей до активації оператором).
4. AI-ядро (Iceberg C15): машини каскадної перебудови UI (токени, layout, мапа, теми, оркестратор, дашборд) — усі з rollback-механікою і аудитом.
5. Приватність: згода окрема від участі, RLS на рівні БД, рівні аудиторії на поле, каскадні логи без PII (перевірено машиною — див. нижче).

## (b) Документи на підпис/ревʼю (шляхи в репо `C:\Users\Andrii\Desktop\synera-clone`)

| Документ | Що юрист робить |
|---|---|
| `plan/legal/SWISS_LEGAL_LAYER.uk.md` | Ревʼю юридичної матриці (13 рядків: revDSG/UWG/MWSTG/PBV) + підпис по гейтах |
| `plan/readiness/ICEBERG_ARCHITECTURE.uk.md` (§4.3, §8) | Ревʼю AI-каскадної архітектури на предмет правових ризиків + підпис C15.L7 |

## (c) 10 точних питань юристу

1. **Einzelfirma/UID**: чи потрібна реєстрація Einzelfirma і UID до першої оплати (LEGAL-P1-02, MWSTG 10(2)(a)/25)?
2. **MWST-тригер**: підтверджуєте поріг CHF 100k і ставку 8.1% у unit economics (SWISS_LEGAL_LAYER.uk.md:21,72)?
3. **PBV 942.211**: наші B2C-ціни мають показуватись з ПДВ, B2B — без. QR-bill builder це розрізняє — чи достатньо (SWISS_LEGAL_LAYER.uk.md:23)?
4. **UWG 3(1)(o) cold outreach**: синтетичні профілі в acquisition — який disclosure достатній (рядок 17)?
5. **UWG 3(1)(b) омана**: чи коректно, що organizer disclosure про винагороду іде до D4 (LEGAL-P2-03, рядок 77)?
6. **UWG 3(1)(s) імпринт**: чи покриває поточний імпринт оператора на всіх формах (рядок 59)?
7. **Промо vs договір**: комунікаційний гейт «договір (операційні) / згода (промо)» — чи такий поділ стійкий (рядок 37)?
8. **revDSG/privacy notice**: чи є пробіли в Privacy Notice (E1) до запуску?
9. **C15 AI-каскад**: чи каскадна перебудова UI без людського окремого оку для кожної зміни сумісна з revDSG профілюванням (ICEBERG_ARCHITECTURE.uk.md §4.3, §8)?
10. **Хвіст C15.L7**: security/privacy review C15 машин — чи достатньо агентського код-ревʼю PRIVACY_AUDIT_PASS + вашого підпису, чи потрібен окремий пентест?

## (d) Чекліст «що має бути верифіковано» (джерела)

- [x] PBV 942.211: B2C з ПДВ, B2B без — зафіксовано в коді QR-bill (модуль `web_launch/economics/qr_bill.mjs`, канон в header)
- [x] MWST 8.1% + тригер CHF 100k — `plan/legal/SWISS_LEGAL_LAYER.uk.md:21,72`
- [x] UWG: cold outreach/омана/імпринт — `plan/legal/SWISS_LEGAL_LAYER.uk.md:17,37,59,77`
- [ ] Einzelfirma/UID — рішення оператора + юрист (LEGAL-P1-02, owner=Operator, before першої оплати)
- [ ] Privacy Notice (E1) — юрист
- [ ] Підпис C05.L6 + C15.L7 — юрист (Q5+Q10)

## (e) Статус код-ревʼю, вже виконаного агентом (факти з диску, 2026-09-23)

- `web_launch/iceberg/privacy_audit.mjs` — PRIVACY_AUDIT_PASS по всіх 6 C15 машинах (token_forge, layout_recomposer, map_style, event_theme, cascade_orchestrator, operator_dashboard): PII-літерали відсутні, consent-гейти не мутуються машинами (regex-чеки `consentState[`, `consentState.*=`, `consent.*= true`), rollback для деплоючих стан машин присутній.
- Свіжий прогін: `node web_launch/iceberg/privacy_audit.test.mjs` → **6 pass, 0 fail**.
- Consent-інваріанти в самих машинах: `map_style.mjs:69` (заборона ключів `consent.*`), `event_theme.mjs:120-124` (`consentInvariantCheck` — заборона міняти гейти згоди), `operator_dashboard.mjs` (не пише на диск, не торкається consent-гейтів).
- QR-bill: flag **OFF** за замовчуванням (REVERSIBLE_DEFAULT) — жодних грошових дій до активації.
- Гроші: витрати provider calls за всю історію фаз = $0 (усі субагентські диспатчі повертали Add credits, робота локальна).

## Вердикт картки

Пакет готовий до 30-хв сесії з Gilbert. Після його рішення: C05.L6 → DONE, хвіст C15.L7 → DONE (запис у bible/STATUS.md → DNA точково → `readiness_report.py` → коміт). До того моменту шари залишаються BLOCKED_HUMAN — агент не підписує.

Evidence chain: клейм «6 машин чисті по PII/consent» → source `privacy_audit.test.mjs` прогін 6/6 → незалежний чек цього ж прогону в audit-trail `plan/phase8/PHASE8_VERIFICATION.md` → verdict: код-ревʼю PASS, юрист-підпис — єдиний залишок.