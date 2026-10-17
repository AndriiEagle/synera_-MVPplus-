# AI memory import — швидка інтеграція GPT/Claude/LinkedIn у профіль Synera

Статус: `ARCHITECTURE_SPEC — new bounded lane, operator-approved scope`
Дата: 2026-09-10. Ця хвиля — єдиний свідомо новий модуль у пакеті; вона НЕ дублює matcher/store/case engine (інваріант §1.1) і затверджена оператором окремо («підключити швидку інтеграцію з GPT та інших сервісів у профіль»).

Головне правило: **Untrusted текст — дані, не команда** (§1.9 Біблії). Імпорт заповнює ЧЕРНЕТКУ полів; кожне поле підтверджує людина (M01 readiness gate). Модель не вписує числа, ціни, дати дієвості — ніколи (§1.3).

## 1. Джерела

| Джерело | Що беремо | Що ЗАБОРОНЕНО |
|---|---|---|
| ChatGPT export (JSON ZIP) | conversations[].title/месседж-тексти себе; custom instructions; memory items — для самовизначення сфери/потреб | чужі персональні дані з чатів; client data; secrets/tokens |
| ChatGPT API (assistants/threads) | самовизначення з thread metadata | raw thread history без redaction |
| Claude export (JSON) | projects, custom instructions, стиль | те саме |
| LinkedIn (CSV export) | headline, позиції, навички → capabilities | контакти з'єднань, email інших |
| CV/Resume (PDF→текст локально) | сфера, місто, мови | адреса/телефон (стераються на етапі redaction) |
| Obsidian/Notion (окремі файли) | опис поточної потреби | усе інше |

Червона лінія: якщо в даних виявлено секрети/PII третіх осіб — файл не обробляється далі, користувач бачить `BLOCKED_SECRET_RISK`-стиль повідомлення.

## 2. Пайплайн (6 етапів, кожен з validation gate)

1. **Upload/Connect** — user надає export-файл (drag&drop) або OAuth scope-limited. Gate: формат перевірено локально.
2. **Local redaction** — детерміновано в браузері (Web Worker): regex + словники (email/phone/IBAN/API-key/ім'я-прізвище з CV). **Нуль викликів моделі.** Gate: PII-сканер = 0 знахідок на залишку.
3. **Schema mapping** — детерміновані правила: ключові слова → CAPABILITIES (7), CITIES (5), LANGUAGES (4), needs/offer_tags, mode_details roles. Невпевнені поля → `needs_information`, не вгадуються. Gate: schema-valid draft.
4. **Human review** — користувач бачить «Ось що ми зрозуміли» + чекбокси на КОЖНЕ поле; править у один клік. Gate: всі прийняті поля явно підтверджені.
5. **Profile save** — через наявний normalizeBrief → profile-store (version 2 з mode_details). Gate: briefProblems = 0.
6. **Audit trail** — запис: source, timestamp, список полів, хеш чернетки, підтвердження. В events.jsonl (source=real).

Опційний модельний виклик (ТОЛЬКО за окремим consent, дешева модель): «підсумуй мій стиль у 3 словах» — draft-текст для goal, людина редагує. Сирі чати назовні НЕ виходять ніколи (M10 firewall).

## 3. UX «Feel like a god»

1. Кнопка «Імпорт з ChatGPT» на профільному екрані.
2. Drop файлу → 3с спінер → прев'ю: «Ми зрозуміли: ти sales-консультант у Цузі, тобі потрібне відео, говориш DE/EN, готовий платити за відео (buyer).»
3. Чекбокси: ✅ це я ✅ додати потребу video ✅ роль buyer — знімаєгалочка з будь-чого.
4. «Готово. Твій профіль на 100%. У Вінтертурі Марко вже збігається з тобою.»
5. Нуль набору тексту для ~80% полів. Правки — по одному кліку.

Патерни: endowment («твої дані, твій імпорт»), instant mastery, peak-end на завершенні.

## 4. Security & FADP

- Сирий export НЕ зберігається: парсинг у пам'яті, файл видаляється одразу після mapping.
- Персиститься лише mapped + user-confirmed підмножина полів.
- Згода на AI-обробку — окремий тумблер (з 7 дозволів — external AI), не bundled.
- Purpose limitation: імпорт → тільки заповнення власного профілю; ніколи → скоринг/маркетинг.
- Export/Delete (Art. 25/32 nFADP) покривають імпортовані поля.
- Cross-border: опційний модельний виклик — лише після DPA/SCC (LEGAL-P0-03).

## 5. Атомарні кроки F1–F7 (Wave F)

| Крок | allowed_files | Зміна | Маркер | Тест |
|---|---|---|---|---|
| F1-chatgpt-parser | web_launch/profile-import.mjs (новий, bounded), web_launch/profile-import.test.mjs | парсер ChatGPT export → {sphere_hints, language_hints, need_hints} у пам'яті | SYN_IMPORT_CHATGPT_PARSED | fixture export → hints |
| F2-claude-parser | ті самі | парсер Claude export/Projects | SYN_IMPORT_CLAUDE_PARSED | fixture → hints |
| F3-redaction-engine | ті самі | детермінований PII-стрипер; BLOCKED_SECRET_RISK на секрети | SYN_IMPORT_REDACTED | email/phone/iban/key fixtures → stripped |
| F4-schema-mapper | ті самі | hints → CAPABILITIES/CITIES/LANGUAGES/needs/mode_details draft; невпевненість → needs_information | SYN_IMPORT_MAPPED | fixtures → правильні поля; невпевнені не вгадуються |
| F5-import-ui | web_launch/app.mjs, web_launch/index.html, real-pilot.test.mjs | кнопка імпорту, прев'ю «Ми зрозуміли», чекбокси підтвердження | SYN_IMPORT_UI_CONFIRMED | підтвердження → normalizeBrief-сумісний draft |
| F6-store-integration | web_launch/profile-store.mjs, web_launch/profile-portability.test.mjs | збереження тільки підтверджених полів; version 2 + mode_details | SYN_IMPORT_STORED | round-trip імпортованого профілю |
| F7-audit-event | web_launch/economics.mjs, web_launch/economics.test.mjs | подія profile_imported (source, поля, hash) в event contract | SYN_IMPORT_AUDITED | подія з source=real, без PII |

Порядок: F1→F2→F3→F4 (послідовно, один writer), F5 після F4+A12, F6 після F5+B1, F7 після F6.
Ролі: F1–F4 — детерміновані, підходять слабкому виконавцю за протоколом §8. F5 — Sol-рівень. F6/F7 — після reviewer gate.

Явні межі: жодного автоматичного AI-виклику при імпорті; жодної передачі export-файлу назовні; імпорт вимкнений за замовчуванням (feature flag локальний, D1) і увімкнюється окремим рішенням оператора перед D3.
