# Синтез незалежних модельних рев’ю — v3

Статус: `LOCALLY_ACCEPTED_REVIEW_INPUT`

Модельні відповіді є джерелом гіпотез, а не прийманням продукту. Нижче залишено лише зауваження, які можна прив’язати до контракту, конкретного збою й локальної перевірки.

## Отримані результати

| Маршрут | Фактична модель | Результат | Receipt | Локальний вердикт |
| --- | --- | --- | ---: | --- |
| TokenRouter free | `z-ai/glm-5.3-free` | три виклики обрізані | `$0.00` | `REJECTED_TRUNCATED`; не використано |
| OpenRouter free | `inclusionai/ling-3.0-flash-fin:free` | повне продуктове рев’ю | `$0.00` | `USABLE_WITH_FILTERING` |
| OpenRouter free | `inclusionai/ling-3.0-flash-sante:free` | повне рев’ю виконання | `$0.00` | `MOSTLY_REJECTED_WITH_3_USEFUL_GUARDS` |
| OpenRouter paid | `moonshotai/kimi-k3` | повне архітектурне рев’ю | `$0.019122` | `USABLE_ACCEPTED` |

## Прийняті зміни до плану й реалізації

1. **Матриця інвалідації.** Для кожної події явно визначити, що анулюється: зміна матеріальних умов, відкликання case-disclosure, terms approval або introduction consent, expiry, revocation, видалення одного hybrid-компонента. Уже виконана зовнішня дія не “скасовується магічно”, але наступна дія блокується й інцидент лишається видимим.
2. **Значення approval.** Approval підтверджує, що сторона бачила конкретний case/version/hash і готова перейти до наступного кроку. Це не договір, не доказ виконання, не юридичний підпис і не відмова від права відкликати згоду.
3. **Байтова канонізація.** Матеріальний payload має закритий список полів, UTF-8, стабільний порядок ключів, JSON без зайвих пробілів, відсутні поля заборонено перетворювати на `null`, числа — лише скінченні й без прихованого округлення. Hash — SHA-256 саме цих байтів.
4. **Закриті стани.** Додати `expired`, `revoked`, `abandoned`; невирішена компенсація не може залишити introduction gate відкритим. Причина закриття зберігається окремо.
5. **Hybrid атомарний на рівні approval.** Кожен компонент перевіряється окремо, але сторони approve весь material payload. Видалення, додавання або зміна будь-якого компонента створює нову версію/hash і скидає обидва approvals.
6. **Закрита таблиця полів режимів.** `exchange`, `paid_service`, `referral`, `hybrid` отримують явні required/optional поля й reason codes. Немає поля — `needs_information`; суперечливі ролі — `incompatible`; це не виправляється LLM-здогадкою.
7. **Походження метрик.** Кожна подія має `source = real_authorized | synthetic_test`. `model_output` взагалі не є подією пілота. У D1 це лише caller-supplied label, не доказ авторизації: навіть вибірка `real_authorized` повертається як `businessEvidenceCandidate`, а не прийняте бізнес-доказування. Synthetic звітується окремо як технічна репетиція.
8. **Accepted outcome прив’язаний до версії.** Одержувач явно приймає або відхиляє результат конкретного trial/case/version/hash. Текстова “задоволеність” або відсутність відповіді не є acceptance.
9. **Повна воронка невдач.** Мінімальні стани: `not_eligible`, `declined`, `no_response`, `trial_agreed`, `trial_started`, `trial_completed`, `outcome_accepted`, `outcome_rejected`, `feedback_missing`, `dispute_open`, `dispute_resolved`, `dispute_unresolved`, `abandoned`.
10. **Manual baseline використовує ту саму форму.** Ручне знайомство організатора проходить ті самі визначення станів, вікно спостереження й правила acceptance. Розмір baseline не вигадується до затвердження дизайну когорти.
11. **Допомога оператора видима.** Кожна дія підтримки має фактичну тривалість і категорію. Результати показуються з розрізом за рівнем operator assistance; довільний поріг “самостійності” не фіксується до першого вимірювання.
12. **Acceptance marker потребує поведінкового доказу.** Унікальний рядок недостатній: потрібні semantic test, негативний сценарій і для критичного guard — mutation, яка робить названий тест червоним.
13. **Генерація SQL серіалізована.** Канонічні SQL-джерела й генератор мають одного writer-а; generated outputs перевіряються byte-for-byte і не редагуються вручну.

## Відхилені поради

- Не дозволяти `degraded mode`, коли oracle/receipt/consent недоступний: це послаблює fail-closed контракт.
- Не вимагати неіснуючого provider-signed nonce або вигаданої схеми підписів. Приймається фактичний receipt канонічного роутера та незалежна локальна перевірка.
- Не “повертати” гроші за невдалий provider call: фактична витрата лишається витратою. Не використаний резерв просто не витрачається.
- Не нав’язувати довільні пороги `5 днів`, `2 rescue actions`, `15-хвилинні блоки`, `<3/5`, `>80% одного каналу` без пілотних даних і попередньо затвердженого протоколу.
- Не вимагати дві acquisition-мережі у першій 10-парній когорті: це змішує сегменти. Канал треба записувати, але перша когорта навмисно вузька.
- Не рахувати різні `need_id` тієї самої людської пари як різні унікальні пари. Для learning gate пара — неупорядкована пара participant IDs; повторні кейси звітуються окремо.
- Не збирати “підтверджену контактну особу” чи назву спільноти в технічному D1. Реальний організатор і будь-який outreach — окремий human gate.
- Не обирати BDM або іншу WTP-методику з відповіді моделі. Спочатку потрібні реальні accepted outcomes і кваліфікований дизайн дослідження.
- Не створювати merge-bot, другий matcher, router, ledger або тимчасову базу-authority заради “незалежності”.

## Прийнятий перший implementation slice

1. Зафіксувати semantic tests для чотирьох режимів і legacy exchange.
2. Розширити існуючий matcher без другого scoring engine.
3. Провести нові режими через profile bridge так, щоб legacy brief-v1 payload не змінювався, а розширений matcher output отримав власну версію й не маскувався під `synera-baseline-1`.
4. Оновити існуючий business-case compiler до приватної non-binding v2 draft.
5. Додати pure terms/approval guard з канонізацією, SHA-256, двома approvals, expiry/revocation/material-change invalidation та introduction gate.
6. Додати source-safe pilot funnel aggregation окремо від сценарної economics-моделі.
7. Запустити focused tests, deliberate mutation, повний локальний suite й offline build. Це доводить D1-поведінку, не D2–D5.

## Післямодельний незалежний adversarial gate

Локальний read-only reviewer не прийняв першу v3 реалізацію й відтворив два P1: пряма мутація `state.material` дозволяла повторно використати старий hash/approvals, а material міг назвати одержувачем або виконавцем третю особу поза двома учасниками кейсу. Обидва semantic tests спочатку були червоними. Після ремонту introduction gate повторно обчислює hash, а create/revise відхиляють сторонніх owner IDs; тести стали зеленими. Також виправлено версію matcher output, unauthenticated-статус metric source та component-fields для hybrid brief. На повторному read-only gate обидва експлойти були відхилені, focused suite пройшов `48/48`, усі дев’ять receipt hashes збіглися, залишкових P0–P2 у перевіреній області немає. Повний результат після ремонту: `97/97`, 26 unpublished offline files.

Окремий transcript-alignment reviewer дав `PASS_WITH_LIMITS`: privacy exclusions і консервативний pricing default лишено як явні **v3 governance additions**, а не видано за рішення транскрипту; pre-D1 `80/80` і post-repair `97/97` більше не названо одночасно “current baseline”.
