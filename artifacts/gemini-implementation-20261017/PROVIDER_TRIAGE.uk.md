# Незалежне приймання рекомендацій GLM

18.10.2026. Моделі отримують лише source пакети й синтетичні тести. Висновки нижче перевіряє координаторка; факт відповіді провайдера не означає прийняття кожної фрази. Це текстове review, не vision.

| Матеріал | Рішення та незалежний oracle |
|---|---|
| social-card-design | Використано малий presentation contract. Відхилено перенесення sessionId, учасників та consent metadata у файл: картка містить лише авторський текст і чесну межу. result-card.test та CASE_SOCIAL_BROWSER.json перевіряють redaction/escaping/реальне завантаження. |
| intro-scoper-contract | Використано допомогу з чернеткою в наявних полях. Вигадані поля binding/disclosure не додаються до бізнес-схеми; збереження, гроші, згода й запрошення залишаються явними. action-scoper tests + SCOPER.uk.md + повний journey browser. |
| card-review1 | F1/F4 про in-place reviewed: відхилено як описаний дефект, бо renderOutcomes викликає clearSocialDraft і змінює socialGeneration. Реальний remote-withdrawal і edit-during-validation не дають download. F2/F3 прийнято: окремий feedback для invalid text/draft і тест точного UTF-8 ліміту. |
| scoper-review1 | NO_CHANGE підтверджено source та позитивними/негативними тестами. Допомога не змінює непорожній людський текст або компенсацію і не робить store writes. Markup/control input повертає needs_input; ручний редактор збережений. Косметичні покращення diagnostics відкладені. |
| erasure-ui-review | Відкликання доступу застосунку доводиться SQL tombstone, не provider signout. Provider deletion pending прямо показане. Не зберігаємо receipt A у новій сесії B: це створило б додаткове поширення приватних даних. Прийнято споріднений відтворений дефект destructive confirmation після звичайного logout: ERASURE_UI_LOGOUT_RED → ERASURE_BROWSER PASS. Окремий restore race відтворений і виправлений; точні тести у звіті ERASURE. |
| erasure-sql-review | Замість сліпого копіювання email tombstone/видалення locks виконуються реальні PG reproductions. New-sub lifecycle і UPSERT lock inversion відтворені; фінальні рішення й source transitions — ERASURE.uk.md. Спекулятивні твердження щодо невиданих reviewer-у RPC/policies самі по собі не є дефектами; перевірено фактичні restrictive member policies та surface SQL. |

Проміжні невдалі та прийняті receipts збережені. Для остаточного висновку використовуються лише receipts, чиї source_sha256 збігаються з current source; старий зелений receipt не закриває змінений файл. Підсумкова квитанція провайдера і finite review linkage готуються після збору всіх термінальних відповідей.
