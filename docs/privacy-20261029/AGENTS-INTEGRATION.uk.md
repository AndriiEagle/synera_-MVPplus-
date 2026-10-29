# Межа з agents lane: P1/P2

Simulation-файли не змінені: це прямо поза дозволеною зоною PRIVACY.
Потрібні дві точки злиття власником agents lane; до них P1 «кожна сторінка» і
P2 журнал runtime лишаються **HOLD**, навіть якщо тести спільних сторінок зелені.

1. `web_launch/simulation.html`: до модулів додати зовнішній класичний
   `<script src="/privacy-retention.mjs"></script>`; він запускає localStorage purge
   до читання чернеток. Додати центр даних `/privacy.html` до header menu і footer,
   перекладаючи через `privacy-content.mjs`. Якщо вводиться спільний site-shell,
   `privacy-common.mjs` уже додає/перекладає посилання та запускає IndexedDB purge.
   Додати нові залежності до `simulation-sw.mjs` без сторонніх API-кешів.
2. `tools/simulation-server.mjs`: після читання/валідації `sessions.json` викликати
   `purgeExpiredJournal(sessions)` з `tools/privacy-journal-retention.mjs` і атомарно
   зберегти очищену карту через наявний `persist`, до запуску HTTP listener.
   Повторити очищення перед записом runtime state, зберігши чергу й stop/consent gates.
   Не зберігати резервну копію старого payload без окремої політики строків.

Helper: чиста функція, без IO/network; 30 днів від останньої дати events/messages
або case.updatedAt; старі/пошкоджені недатовані записи видаляються.
`node --test web_launch/privacy-journal.test.mjs` перевіряє mocked clock та незмінність
вхідного об’єкта. Це component-перевірка, не доказ runtime integration.

Приймання власником: старий fixture-журнал зникає після реального рестарту сервера;
свіжий лишається; читання не подовжує строк; після 30 днів і нового старту прострочений
рядок не повертається з диска. Відвідати simulation.html без входу, побачити обидва
посилання, перевірити expiry до відновлення форми, offline та uk/de/en.

Центр чесно виключає файловий журнал runtime зі свого браузерного export/erase.
Перед застосуванням узгодити diff з власником: simulation lane паралельно змінює ці файли.
