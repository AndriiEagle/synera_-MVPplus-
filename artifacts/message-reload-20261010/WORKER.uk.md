# Повтор повідомлення після reload — локальна перевірка

## Scope

Змінено лише `web_launch/real-journey-client.mjs` і його цільовий семантичний тест.
Коли POST уже був прийнятий сервером, але відповідь або наступне readback загубилися,
явний повтор того самого обрізаного тексту після reload у тій самій вкладці повторно
використовує UUID. Сам reload нічого не надсилає.

`sessionStorage` містить тільки версіонований об'єкт з salt, actor ID, meeting UUID,
SHA-256 fingerprint тексту та UUID наміру. Текст, токени, профіль і outbox не
зберігаються. Дані з storage не є довіреними: формат перевіряється, а існуючі
серверні/meeting/auth/ack перевірки залишаються перед прийняттям результату.

Після підтвердженого ack+readback запис вилучається. Logout, невдале restore і
підтверджена зміна account вилучають усі записи; початковий restore того самого
actor зберігає лише його записи. Заблокований, зламаний або недоступний storage
дає попередню RAM-only поведінку.

## Evidence

- RED до клієнтської зміни: `RED-node.tap` — 8/9 PASS, 1/9 FAIL. Новий reload
  контракт створив 2 рядки замість 1.
- GREEN після зміни: `GREEN-node.tap` — 9/9 PASS.
- Mutation: `MUTATION-node.tap` тимчасово замінив lookup persisted UUID на новий
  UUID. Цільовий тест впав: 2 рядки замість 1. Після цього точний lookup відновлено
  і GREEN повторено.
- `git diff --check` пройшов. SHA-256 клієнта:
  `442018459E42AAA46D6326AA4A4D66657659313289C9BC8F0D1551DC4EA0D7B0`;
  SHA-256 тесту:
  `13D8708270638423E3FE356536161B7E2F63AB081D222D76159F576AF42F6B2B`.

## Review correction

Після review додано actor/epoch guard після кожного асинхронного SHA-кроку та
current-storage merge замість запису старого snapshot. Детерміновані barrier-тести
підтвердили RED для пізнього digest після logout і для двох паралельних перших
unknown POST; `REVIEW-RED-node.tap` має 2/11 FAIL на попередньому коді. Після
корекції `REVIEW-GREEN-node.tap` проходить 16/16, включно з denied/corrupt storage,
actor/meeting/text binding, sanitization extra storage fields та metadata churn без
POST. CAS-подібне читання обмежене трьома спробами; при постійній зміні metadata
воно завершується 503 до POST, а наступний ручний retry дозволений.

`REVIEW-MUTATION-node.tap` показує, що вилучення actor/epoch guard після digest
знову відновлює metadata після logout (1 запис замість 0); guard відновлено.

## Межі доказу

Це synthetic HTTP oracle у `tools/fixtures/message-intent-fixture.mjs`; він
підтверджує контракт клієнта, але не замінює реальний SQL/RLS або browser acceptance.
Мета-дані не є offline outbox і не відновлюють нічого автоматично. Зовнішніх викликів,
деплою, встановлень, commit або provider calls не було.

Очистка storage є best-effort: браузер, який відхиляє `removeItem`, зберігає лише
недоступні для клієнта метадані, а RAM/session guards та серверні перевірки лишаються
авторитетними. Вдалий restore того самого actor зберігає його retry-записи; очистка
виконується для підтвердженого unauthenticated restore або account change, не для
кожної мережевої помилки restore.
