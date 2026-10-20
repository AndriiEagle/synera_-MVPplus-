# Synera

Synera допомагає солопідприємцям і малому бізнесу знайти взаємну користь, погодити умови й перевірити спільний результат. Початковий пілот — Цюрих.

**Актуальна версія для незалежного review — гілка `main`. Репозиторій публічний.** Інтеграція 17.10.2026 поєднує перевірений продукт `76e1897` зі збереженою історією попереднього `main` (`6642c89`). Стан коду: локально перевірений кандидат; запуск людей у production ще потребує окремого приймання.

Реалізація рекомендацій аудиту 19.10: [зміни, тести й відкриті gates](artifacts/gemini-implementation-20261017/REPORT.uk.md). Новий [промпт повторної перевірки](docs/CLAUDE_OPUS_REVIEW_PROMPT.uk.md) прив’язаний до `7eaa952`.

Кандидат 20.10: [Synera LAB для Android — 20 вигаданих AI-учасників](docs/ANDROID_SIMULATION.uk.md).
Локальні HTTP/browser-перевірки й тимчасове приватне HTTPS пройдено;
живий GLM vision і встановлення на фізичний телефон залишаються відкритими.
[Докази й конкретні блокери](artifacts/android-simulation-20261020/RESULT.uk.md).

## Почати review

1. [Продуктова ДНК та інваріанти](docs/PRODUCT_DNA.uk.md) — що має отримати людина й що треба зберегти.
2. [Поточний handoff: код, запуск, докази та відкриті питання](docs/REVIEW_HANDOFF.uk.md).
3. [Готове завдання незалежному рев’юеру](docs/CLAUDE_OPUS_REVIEW_PROMPT.uk.md) — підходить також іншій моделі або інженеру.

Передавай людині посилання на цей репозиторій і handoff. Для повторюваного review зафіксуйте SHA через `git rev-parse HEAD`. Доступ до публічного source не потребує запрошення; production-доступ і ключі не входять у цей пакет.

## Запуск із чистого clone

Потрібен Node.js 22; Python, Flutter, production-акаунт і секрети для локального перегляду не потрібні.

```sh
git clone --branch main https://github.com/AndriiEagle/synera_-MVPplus-.git
cd synera_-MVPplus-
node web_launch/server.mjs
```

Відкрий loopback URL, який надрукує сервер. Це перегляд інтерфейсу й локальної чернетки із закритою реєстрацією. Сервер не емулює живі акаунти чи повний шлях двох людей. Для автоматичного шляху з тестовими акаунтами та збірки — [команди в handoff](docs/REVIEW_HANDOFF.uk.md#відтворення-перевірок).

## Де що лежить

| Шлях | Призначення |
|---|---|
| `web_launch/` | Поточний браузерний застосунок / PWA, Current та добровільні стилі |
| `neon/` | Gateway, SQL, серверні обмеження та збірка кандидата |
| `tests/`, `tools/`, `.github/workflows/ci.yml` | Браузерні сценарії, acceptance-перевірки та CI |
| `docs/PRODUCT_DNA.uk.md`, `docs/REVIEW_HANDOFF.uk.md` | Чинна точка входу для review |
| `artifacts/`, `docs/quality/` | Датовані докази з межами перевірки; вони прив’язані до source SHA |
| `crystallised_in/`, `supabase/`, `plan/` | Попередні реалізації / плани; їхня наявність не означає активний backend |
| `SYNERA_START_HERE.uk.md`, `docs/*-202609*/` | Збережений вересневий planning snapshot |
| `START_HERE.uk.md` | Історичний журнал із посиланням на поточний handoff |

[Прийняті зміни 15.10](docs/quality/reviewed-release-20261015.uk.md): мобільна шапка й меню, офлайн-оболонка, відновлення після відмови видалення профілю; 668 Node PASS / 1 SKIP і 39 browser PASS на тому зрізі. Поточні результати — у [GitHub Actions](https://github.com/AndriiEagle/synera_-MVPplus-/actions/workflows/ci.yml); звіряй SHA запуску зі своїм checkout.

Перед запрошенням користувачів залишаються: production-схема та відновлення, точний rollout, справжній JWT-цикл двох акаунтів і фізичні Android/iPhone. Повне видалення акаунта з room retention та окремі provider-функції також мають відкриті межі. Деталі й пріоритети — у handoff. Push коду не змінює live-сайт.
