# UX / visual evidence — Synera

Аудит 18.10.2026 UTC / 19.10.2026 Zürich. Source pin: `7eaa952c6e0e498521cc325ab1cf24fec1e0f725`, єдиний repo `AndriiEagle/synera_-MVPplus-`, main.

## Межа перевірки

**Поточний render і browser flow — NOT RUN.** Локальний HTTP preview у тимчасовій копії дозволено запустити після sandbox escalation. Auto-review rejection не було. Chromium executable у доступному runtime відсутній; cloud browser tab creation для localhost не завершилося, очікування перервано. Відповідно немає нового візуального, keyboard, screen-reader, 200% text, browser-cookie, Android/iPhone чи WCAG PASS.

Прочитано current HTML/CSS/JS owners, PRODUCT_DNA, relevant tests/receipts. Root окремо отримав через GitHub connector та **переглянув п’ять датованих PNG за pin**. Для кожного Git blob SHA збігся; bytes, SHA256 і dimensions у `VISUAL_IMAGE_PROVENANCE.json`. Це додаткові історичні assets до основного snapshot 443 файлів. PNG уже зберігаються в репозиторії; тут вони не дублюються.

| Переглянутий asset | Розмір | Дата / що він доказує |
|---|---|---|
| [Current, index, 320](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/artifacts/mobile-20261007/responsive/full-reviewed/chromium-320-index.png) | 320×2540 | Artifact family 07.10.2026. Видимий історичний Current layout; не поточний auth/config/порядок екрана |
| [Atelier, index, 320](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/artifacts/mobile-20261007/responsive/full-reviewed/chromium-atelier-320-index.png) | 320×2851 | Та сама dated family. Історичний альтернативний стиль; не current preference/flow proof |
| [Private social draft](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/artifacts/gemini-implementation-20261017/case-social-draft-390x844.png) | 390×844 | CASE_SOCIAL_BROWSER generated_at 17.10.2026 23:16UTC, synthetic account/RPC. Видно controls, permission copy й author text |
| [Profile erasure](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/artifacts/gemini-implementation-20261017/profile-erasure-390x844.png) | 390×2467 | Historical erasure family; повна довга сторінка з 390 px viewport. Назва 390×844 не є фактичною висотою PNG |
| [Private result card](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/artifacts/gemini-implementation-20261017/result-card-390x844.png) | 390×844 | Historical private HTML-card render із literal script-like fixture text; не independent certification або live case |

`PRIVATE EVIDENCE`, `private.example/secret`, імена/тексти на цих screens — synthetic test content. Їх не трактуємо як фактичний витік чи реальних клієнтів. Звірка historical browser receipts у головному REPORT має EOL caveat для двох HTML.

## Що видно на датованих знімках

**Current.** Чітка типографічна вага, теплий акцент на primary action, великі округлі панелі й виразний текст обіцянки формують упізнавану основу. **Atelier.** Тонші контури й спокійніша типографіка створюють інший ритм. Жоден із двох screenshots не дає підстав автоматично замінити Current або назвати Atelier кращим для всіх. На вузькій ширині обидва варіанти потребують читання довгих пояснень; фактичне навантаження людей не виміряне.

У двох старих homepage screens кілька transition/preview посилань стоять перед hero. Це варто перевірити як ризик розпорошення першої уваги, **але не записувати як підтверджений current layout defect**: у pinned `index.html:25–26` ці посилання стоять після demo, а остаточний порядок залежить від CSS/JS. Старий screenshot не приймає нову композицію.

**Приватна картка.** На 390 px знімку є виразний заголовок, читабельна колонка, вільні поля та зрозуміле відділення author text від пояснення scope. Світлий фон може бути доречним для окремого файлу й друку; це не причина міняти темний застосунок. Literal `<script>…</script>` відображається як текст, що узгоджується з прочитаним escaping. Водночас screenshot сам по собі не перевіряє активність/відсутність виконання скрипту — це покривається source/tests.

**Social draft.** Явний вибір, формат, редагований текст і окреме копіювання/завантаження допомагають відокремити створення від публікації. Щільність повторних privacy-пояснень висока. Рекомендація — скоротити повтори та підсилити ієрархію зі збереженням усіх суттєвих меж/дозволів; не прибирати згоду заради більшої кнопки.

**Privacy / erasure.** Довга колонка прав і пояснень, дві різні операції видалення та дрібні secondary тексти вимагають уважного читання. На historical full-page image fixed bottom navigation візуально накладається на частину DELETE-поля. Це **кандидат для actual scroll/focus/hit-test**, а не доведена недоступність current control: full-page captures і fixed layers не показують всіх положень скролу чи клавіатури. Не додавати новий confirmed P1/P2 на підставі одного такого кадру.

## Current source: конкретні UX-факти

1. [`real-journey.mjs:50–54`](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/web_launch/real-journey.mjs#L50-L54) відмічає people/terms/invitation/conversation, хоча далі існує outcome UI. Наступна дія й owner результату мають бути видимими. Ступінь реальної плутанини невідомий.
2. [`real-journey.mjs:96–109`](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/web_launch/real-journey.mjs#L96-L109) має мінімальний empty state й загальну сумісність. Показувати конкретний відомий збіг та невідоме; пропонувати тільки реалізовану дію, без fake people чи обіцянки підбору.
3. [`real-journey.html:26–31`](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/web_launch/real-journey.html#L26-L31) збирає обидві сторони й істотні умови до invitation. TA-02 і TA-04 показують саме correctness/contract проблеми цієї форми; погляд на картинку їх не виявляє.
4. [`real-journey.mjs:17–20,37–83`](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/web_launch/real-journey.mjs#L17-L83) має language binding без rerender input, приватний purge і closed-room recovery. Ці механізми потрібно зберегти при progressive disclosure.
5. [`PRODUCT_DNA:23–38`](https://github.com/AndriiEagle/synera_-MVPplus-/blob/7eaa952c6e0e498521cc325ab1cf24fec1e0f725/docs/PRODUCT_DNA.uk.md#L23-L38) визначає Current default, добровільні варіанти й accessibility aims. Це acceptance criteria, не факт current WCAG compliance.

## Три walkthrough-сценарії

| Сценарій | Що перевіряємо наступним фактичним run |
|---|---|
| Новачок, нечітка потреба, мало людей | Чи можна отримати корисний власний brief до matching; чи є чесний empty-state next step; helper можна пропустити |
| Зайнятий скептичний професіонал / нерівні внески | Buyer без skill offer проходить paid mode; форма показує тільки доречні внески; люди самі розуміють компенсацію й критерій |
| Нова редакція / затримка / відмова / спір | Поточний version, хто відповідає, право відмови, збережений людський текст, expired consent/retry/logout і separate accepted/payment states |

Ці сценарії описані в головному REPORT як audit hypotheses, не проведені інтерв’ю.

## Невеликий acceptance для Codex

Після TA-01–04: Current і Atelier на 320/390/768/1440; довгі UK/DE/EN; enlarged text 200%; keyboard/focus; loading/empty/error/success; soft keyboard/resume на фізичних Android/iPhone. Кожний фактичний run повинен мати source/release, viewport, state, clicks/expected/actual і screenshot. Для накладання navigation перевірити реальний hit target і можливість дістатися input після скролу; screenshot без кліків недостатній.

Новачок має назвати: «де я», «що сталося», «яка дія наступна», «хто відповідає». Після прийняття роботи перевірити її відмінність від виконаної компенсації й приватного файлу. Якщо нова композиція ховає істотну зміну умов, додає mandatory кроки або стирає draft — зупинити її.

**Оцінка:** source-defined UX у головному звіті 60/100 з обмеженим покриттям; current visual/mobile/accessibility **Н/О**. Датовані знімки дають змістовні observations, але недостатні для чесного current 9/10 чи 10/10. Повний redesign на цій основі не рекомендований.
