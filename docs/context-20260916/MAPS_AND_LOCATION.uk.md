# Карта, Google Maps і зустрічі: збережений scope GEO-01

## Джерела й різниця між трьома станами

| Стан | Доказ у source | Що це доводить |
|---|---|---|
| Legacy Google Maps | `crystallised_in/lib/app_pages/map/map_page/map_page_widget.dart`: getCurrentUserLocation, LocationsRecord, FlutterFlowGoogleMap; `custom_code/widgets/firestore_map.dart`: GoogleMap/myLocationEnabled/markers | Код карти, отримання/збереження координат і маркерів існує. Поточні keys/billing/deployment та коректний permission flow не перевірені |
| Сучасна web-карта | `web_launch/map.mjs`: cityLocation/createPeopleMap; `app.mjs` імпортує модуль; `assets.mjs` включає map.mjs | Приблизні центри міст, map_visible + is_discoverable, optional OSM tiles; це не live GPS |
| Зустріч і live-навігація | Уточнення користувача 2026-09-16: бачити дозволену локацію партнера перед зустріччю, орієнтовно за 15–30 хв, швидко знаходити одне одного | Реальна продуктова вимога. Реалізацію та end-to-end acceptance не встановлено |

Функція карти не є вигаданим розширенням лише тому, що її пропустив похідний пакет. Водночас наявність GoogleMap widget не доводить, що live sharing/ETA/navigation already work. Оригінальний SPEC має P01–P16 без окремого Maps пункту; legacy feature inventory — обов’язкове додаткове джерело.

## Що треба зберегти й перевірити

1. **Карта та список:** map/list parity, вибір учасника й зрозуміла точність точки. Центр міста не підписувати як точну позицію людини. Без доступу до location лишаються профіль, список, адреса погодженого місця та ручні вказівки.
2. **Google Maps:** явно врахувати наявну Google integration при виборі target architecture/provider. Не заміняти її мовчки на «будь-яку карту». Поточна web OSM schematic — інша можливість, не доказ виконання Google/live navigation requirement. API/key restrictions, дозволені SDK, вартість і ліцензії перевірити перед implementation/provider activation.
3. **Конкретна зустріч:** sharing пов’язаний із підтвердженим meeting/case, конкретним отримувачем, purpose і коротким видимим строком. 15–30 хв до зустрічі — опис користувача, не вже затверджений fixed system timeout. Точний старт/кінець/late-arrival UX визначити в contract review; always-on із цього запиту не випливає.
4. **Власний дозвіл:** кожна людина явно керує передаванням своїх координат, recipient, precision і строком. Не вимагати взаємного розкриття GPS як умову користуватися базовим сервісом. Погодження зустрічі не дорівнює дозволу GPS. Пропозиція Claude «обоє обов’язково діляться» не була затверджена користувачем.
5. **Відкликання:** кнопка припиняє нові location effects; server access і viewer readback це підтверджують. Відкликання свого grant не розширює прав іншого учасника. Cancel/revoke meeting закриває meeting-dependent grants. Жодної обіцянки стерти вже побачену інформацію з чужої пам’яті.
6. **Навігація:** погоджене місце зустрічі та рухома позиція партнера — різні targets. Користувач бачить, куди його ведуть; automatic guidance працює лише в запущеній дозволеній session. Platform permission, background pause, stale sample, неточний GPS, unavailable route або provider outage не створюють фальшиву точку/ETA. Arrival/stop завершує sharing за договореним правилом.
7. **Свіжість:** last update і точність показуються явно. «Рухається» не перетворюється на рейтинг поваги, чесності чи намірів людини; відмова від GPS не карається.
8. **Мінімізація:** точні координати не додаються мовчки до профілю, matcher, records, telemetry чи external-AI payload. City/radius logistics уже є в `matching.mjs` і мають зберегтися. Теза «matcher не використовує жодної локації» неправильна: він використовує міста/відстань, але не доведену live GPS траєкторію.
9. **Retention:** запропонований напрям — latest sample замість історії переміщень; конкретні TTL/cache/backup/delete guarantees потребують реалізації й перевірки, а не обіцянки «нічого ніде не зберігається».
10. **Три рівні адаптації:** вибір вигляду карти — персональний UI; власний location grant — персональний permission; додавання SDK/provider/schema чи нових effects — глобальна versioned зміна. Не називати будь-яке використання карти глобальною зміною.

## Власники, залежності, приймання

GEO-01 не запускає новий task і не змінює 19 карток V6. До implementation потрібні: source baseline/preservation review; V6-03 per-party authority contract; calendar/meeting identity; privacy/retention review; provider choice/capability/cost decision; explicit implementation scope. Після цього його можна оформити як одну bounded card у чинному Harness, з owner для map adapter/UI та окремим reviewer для auth/privacy. Ліміт вузлів не є наказом заповнити вільні місця.

Приймання: дві synthetic sessions і outsider; explicit own grant; no grant/no GPS; wrong meeting/recipient rejected; cancelled meeting/expired/revoked grant rejects new samples; offline/background/stale sample явно позначені; static venue navigation доступна без sharing; exact pin не плутається з city center; no telemetry/profile leakage; provider failure fallback; rollback до попередньої карти. Реальні mobile background/permission/navigation сценарії потребують перевірки на пристроях і human acceptance. Цей документ їх не сертифікує.
