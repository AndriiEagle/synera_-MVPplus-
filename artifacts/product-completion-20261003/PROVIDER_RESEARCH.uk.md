# Карта й голос: вибір для Synera

Перевірено 2026-10-04. Це вибір кандидатів і поточні тарифи; жодного платного API-виклику не виконано. Якість, затримка на Android і повна ціна сесії Synera ще не виміряні.

## Рішення

**Карта:** Google Maps JavaScript API, Places Autocomplete (New), Routes Compute Routes Essentials. JS потрібен для власних шарів і вибору людей; маршрути відкриваються також через чинні Maps URLs. SDK не замінює Routes/Places API. Не завантажувати карту до відкриття її екрана. Місце зустрічі й точна локація людини мають різні дозволи.

**Голос першого знайомства:** OpenAI GPT-Realtime-2.1 — кандидат для преміальної розмови; Gemini 3.8 Live — дешевший кандидат для порівняльного тесту. Виробники заявляють відповідні поліпшення; це не незалежна оцінка голосу Synera. AI перемикає лише вже підготовлені режими інтерфейсу. Публікація, передача локації та погодження чужої сторони не є голосовими автоматичними діями.

## Тарифи та джерела

| Сервіс | Офіційний тариф, USD | Межа |
|---|---|---|
| Dynamic Maps | 10 000 безкоштовних loads на місяць; перший платний діапазон $7/1000 | Навіть безкоштовна квота вимагає налаштованого Google проєкту |
| Autocomplete Requests | 10 000 free; потім $2.83/1000 | Завершення сесії й запитані Place Details можуть мати іншу ціну |
| Routes Essentials | 10 000 free; потім $5/1000 | Pro/Enterprise опції змінюють SKU |
| GPT-Realtime-2.1 | Audio input $32/1M tokens, output $64/1M; text input $4/output $24 | Це не тариф за хвилину; reasoning додає витрати/затримку |
| Gemini 3.8 Live | Audio input $0.005/хв, output $0.018/хв у paid tier | Повна сесія може також містити text/tool/grounding витрати |

[Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing) · [OpenAI model/pricing](https://developers.openai.com/api/docs/models/gpt-realtime-2.1) · [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing).

Для браузерного голосу: авторизований сервер створює короткоживучий credential, клієнт використовує WebRTC. Явні Start/Stop, відмова мікрофона та збій провайдера потрібні до активації. [OpenAI Realtime](https://developers.openai.com/api/docs/guides/realtime), [WebRTC](https://developers.openai.com/api/docs/guides/realtime-webrtc). ElevenLabs наразі не обраний: повна ціна агента з LLM pass-through для конкретного плану не встановлена. [ElevenLabs pricing](https://elevenlabs.io/pricing).

## Що знайшли в оригіналі

- `crystallised_in/web/index.html:59` містить історичний Maps browser credential. Значення не копіювали, не тестували й не повторно використовували. Власник має перевірити його обмеження та usage; потрібна безпечна окрема конфігурація.
- У поточному `web_launch/live-location.mjs` працюють Maps URLs; JS SDK/Places/Routes у новому циклі не активовані.
- У поточному web_launch немає живого WebRTC/getUserMedia voice transport. Старі прямі OpenAI-виклики з Flutter не є готовим захищеним voice-сервером.

Google вимагає application/API restrictions. Budget alert не є жорстким стопом витрат. [Google API security](https://developers.google.com/maps/api-security-best-practices).

## Перед активацією

Потрібні налаштовані account/project, обмежені credentials, дозволений точний бюджет та server-side quota/spend policy. Спочатку один однаковий короткий тест обох voice-кандидатів: мова, переривання, шум, Android, реальні usage receipts і оцінка голосу людиною. Ключі в чат не потрібні.

10× compression **не доведено**. Для економії можна скорочувати повторюваний текст і використовувати підготовлені UI-команди/кеш; оригінали, точні цитати та істотні умови залишаються доступними. Стиснення не замінює приймання якості й не гарантує збереження кожного нюансу.

Models used: none (provider calls=0, USD=$0.00).
