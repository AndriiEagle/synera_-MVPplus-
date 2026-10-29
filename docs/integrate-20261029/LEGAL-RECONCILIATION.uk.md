# Правові джерела й розбіжності · 29.10.2026

Це журнал інтеграції двох наданих досліджень, **не висновок юриста**.
Вхідні SHA-256 і точні локатори: `inputs.json`. REPORT_A §6–12 і REPORT_C §0–5 —
чернетки. Статус VERIFIED у звіті не означає перевіреної конфігурації Synera.

| Тема | Розбіжність / межа | Рішення цієї лінії та джерело |
|---|---|---|
| Допуск | PLAN 28.10 орієнтований на відкриту реєстрацію; C §0 допускає лише умовне демо; A §15 розділяє три етапи | **NEEDS_REVIEW:** реалізовано локальне демо, реальні акаунти NO-GO. Це продуктове рішення, не юридична гарантія. [DSG Art.7,19](https://www.fedlex.admin.ch/eli/cc/2022/491/de) |
| GDPR | PLAN не закрив застосовність; A §3/C §0.2 відкидають автоматичне «Швейцарія = GDPR не діє» | **EXPERT_REQUIRED:** визначити фактичну аудиторію й територіальні критерії; не робити висновку за місцем оператора. [GDPR Art.3,27](https://eur-lex.europa.eu/eli/reg/2016/679/oj) |
| Мова / версія | Старі правила `2026-09-05-pilot-3` мають український основний текст; C §4.1 просить німецьку основу нового документа | **NEEDS_REVIEW:** новий DE-основний проєкт + повні UK/EN, старі правила доступні в архівному details. POLICY_VERSION і записи прийнятих згод не змінені; новий документ ще не набрав чинності. [DSG Art.19 / DSV Art.13](https://www.edoeb.admin.ch/en/duty-to-provide-information) |
| Neon-регіон | PLAN і C §4.1 називають Ohio фактом; A §11.4 розрізняє регіон, міграцію, Auth і віддалений доступ | **NEEDS_REVIEW:** у тексті Ohio позначений як дані попереднього плану. Frankfurt — пропозиція. Живий project/account не перевірявся. [Neon region migration](https://neon.com/blog/easiest-way-migrate-postgres-database-neon) |
| Договір Neon | Старий Neon DPA в PLAN проти зміненого пакета Databricks у C §4.5; A §11.3 ще цитує старий sensitive-information annex | **EXPERT_REQUIRED:** встановити застосовний до конкретного акаунта пакет, контрагента, дату прийняття й охоплення Postgres/Auth/OTP. Старий PDF не вважати автоматично чинним. [Schedule](https://neon.com/platform-terms), [DPA](https://www.databricks.com/legal/dpa), [старий PDF](https://neon.com/pdf/DPA.pdf) |
| DPF | Заяви постачальників у C/A не є незалежною перевіркою Active Swiss-U.S. DPF | **NEEDS_REVIEW:** зберегти запис точного юрлица, Swiss-U.S. scope, Non-HR, дочірні компанії й сервіс; DPF не заміняє DPA. [Реєстр](https://www.dataprivacyframework.gov/list), [processor contracts](https://www.dataprivacyframework.gov/program-articles/Contract-Requirements-for-Data-Transfers-to-a-Processor) |
| Видалення | PLAN G7 pending; A §12 пояснює можливість Better Auth, але не доводить її доступність у managed Neon | **NEEDS_REVIEW:** жодного «весь акаунт знищено»; потрібні Auth/session/API/branch/backup докази. [Better Auth](https://better-auth.com/docs/concepts/users-accounts), [Neon Auth branches](https://neon.com/blog/handling-auth-in-a-staging-environment) |
| Backup строки | У PLAN є тарифні числа; A §12.3 не підтвердив точний договірний строк | **NEEDS_REVIEW:** не переносити 7/14/30 днів у privacy notice як факт; отримати договірний доказ конкретного плану. [Neon recovery](https://neon.com/docs/introduction/branching) |
| Інциденти | 72 години у старому runbook — внутрішня контрольна точка; швейцарський строк не універсальні 72 години | **VERIFIED:** тригер ймовірного високого ризику, повідомлення якнайшвидше; первинний портал підтверджено в цій сесії. Див. [EDÖB §1.3,1.5](https://www.edoeb.admin.ch/de/databreach). GDPR строк оцінюється окремо. |
| DSV логування | 90-денні ops-події не заміняють спеціальний Art.4-журнал; A §7 посилається на новішу редакцію | **EXPERT_REQUIRED:** застосовність і чинну редакцію звіряє юрист; не перетворювати всі localStorage події на журнал ідентичностей. [DSV Art.4](https://www.fedlex.admin.ch/eli/cc/2022/568/de) |
| DPIA | PLAN/A радять до real accounts; сам розмір пілоту не доводить юридичного обов’язку | **EXPERT_REQUIRED:** заповнити screening/outline і юридично оцінити Art.22–23; високий залишковий ризик — окремий gate. [DSG](https://www.fedlex.admin.ch/eli/cc/2022/491/de) |
| Cookies | Попередня загальна згода не заміняє повідомлення про localStorage; швейцарський режим не дорівнює opt-in на все | **EXPERT_REQUIRED:** мінімізація, доступний inventory, відмова/стирання; застосовність конкретного consent визначити окремо. [FMG Art.45c](https://www.fedlex.admin.ch/eli/cc/1997/2187_2187_2187/de) |
| Стиль | PLAN 28.10 каже Atelier default; чинні shared rules та рішення 29.10 — dark/gold | Збережено dark/gold. Це продуктова, не правова зміна. |

Незалежне читання в цій сесії: сторінки EDÖB про duty to inform і DataBreach,
офіційний PDF incident guide v1.2 (23.04.2025), SECO Onlinehandel.
Fedlex HTML повернув JavaScript-заглушку, спроба PDF нової редакції DSV недоступна.
Тому повну повторну перевірку всіх статей, DPA/DPF і provider-сервісів **не заявлено**.
Юридичні частини продуктового тексту мають NEEDS_REVIEW/EXPERT_REQUIRED та URL джерела.
Чекліст MUST перевіряє покриття тем, а не заповнені реквізити чи законність запуску.
