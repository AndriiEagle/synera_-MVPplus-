"""Write the owned mobile acceptance report and one shared checkpoint."""
from pathlib import Path
import json

root=Path(__file__).resolve().parents[1]
proof=root/'artifacts/mobile-20261007'
release=json.loads((proof/'RELEASE.json').read_text(encoding='utf8'))
assert release['status']=='PASS_LOCAL_MOBILE_CANDIDATE'
report='''# Synera: Android, iPhone та безплатний пілот — 07.10.2026

**LOCAL_MOBILE_UI_ACCEPTED_WITH_LIMITS. Живий запуск і встановлення на телефони не прийняті.**

Checkout `C:/Users/Andrii/Desktop/synera-premium-pwa-variant`, branch `codex/synera-product-20261002`, вихідний commit `a284a1e`. Це PWA для браузера й головного екрана Android/iPhone, не нативний APK/IPA. Current за замовчуванням, Atelier і спокійний режим збережені.

## Що дороблено та перевірено

| Ділянка | Прийнятий результат | Що це дає людині |
|---|---|---|
| Встановлення | Ручна інструкція доступна без Chrome install event, у тому числі для Safari; відмова браузера оброблена | Людина має зрозумілий наступний крок на обох платформах |
| Оновлення PWA | Service worker більше не перезавантажує активну форму автоматично | Незбережену думку не стирає несподіваний reload |
| Адаптивність | Навігація росте з текстом; заголовки переносяться; Studio heading не перекриває форми в landscape | Кнопки залишаються доступними, збільшення тексту не карає користувача |
| Вхід | Один головний вхід у пілот; Studio/demo — окремо; інструкції Android/iPhone | Менше вибору перед першою дією, зрозумілий тип застосунку |
| Монетизація | Тимчасово CHF 0 без картки; майбутній **сценарій**, не продаж: CHF 12/місяць і до 10 AI-запитів | Видно поточні й запропоновані умови без прихованого списання |
| Зворотний зв'язок | Добровільне обговорення з людиною, яка демонструє Synera | Без примусової форми або непомітного надсилання даних |

Останній стовпець — мета UX, не виміряні емоції, гормони, попит чи задоволення.

### Докази

- PWA: [RED](install/RED.txt), [6 GREEN tests](install/GREEN.txt), [baseline mutation: 3 guards catch defect](install/MUTATION.txt). Справжні кліки в Chrome на C:, 320×568 / 390×844 / 412×915: [BROWSER.json](install/BROWSER.json), [екран інструкції](install/iphone-sized.png). Runner завершився exit 0.
- [Responsive report](responsive/REPORT.uk.md): 180 спостережень сторінок/станів у 12 конфігураціях: ширини 320, 360, 375, 390, 412, 430, 768; landscape; 200% computed text; reduced motion; два Atelier. Це не 180 моделей телефонів. 12 synthetic bilateral flows доходять до двох згод, accepted invitation і приватного повідомлення.
- Перші CSS-дефекти: 27 знахідок до зміни → 0 у тих самих 16 спостереженнях. Додаткові large-text дефекти index/Summit виправлені та перевірені у 12 цільових спостереженнях. Повернення старих стилів відтворило 26 знахідок. Каталог компонентів має окремі сирі знахідки; він не зарахований як готовий користувацький шлях. Матриця не доводить усі приховані стани, screen reader, OS keyboard або safe areas.
- [Pricing report](pricing/REPORT.uk.md), [receipt](pricing/FINAL_RECEIPT.json): 12/12 browser tests завершилися exit 0, включно зі старими access checks, EN/DE/UK × 320/390/1440, no-JS, axe. Додаткові 5 CTA text/hit-target checks пройшли, **але suite teardown отримав timeout**. Mutation семантично відхилений, **wrapper також завершився timeout**. Ці два запуски не названі clean PASS.
- Parent перевірила фактичний diff двічі, інсталяційний PNG та [коректний UK390](pricing/regression/product-access-Access-journey-uk-at-390/access-uk-390.png). Ранній screenshot після axe мав хибний focus overlay; він відхилений, точний CTA перевірений повторно. Остаточні hashes прийняті незалежним `tools/mobile-release-acceptance.mjs`.

## Карта

[14 location/navigation tests](install/MAPS.txt) пройшли. У справжньому браузері відкриті Zürich HB та walking directions. Приватна початкова точка не записана, GPS permission не надавався. Це перевірка зовнішнього переходу, не вбудованої Google-карти або фізичної навігації.
[Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) підтримує Android/iOS/browser без API key. Embedded Google SDK залишається відкритою інтеграцією.

## Android Studio на D: — точний незакритий крок

Завантажені офіційні ZIP у `D:/SyneraAndroid`: `studio.zip` (спостережено 1,526,567,345 bytes) та `tools.zip` (155,655,386 bytes). [Офіційне джерело/SHA256](https://developer.android.com/studio).
Читання D: і checksum зависали. Локальний Playwright cache також виявився junction на D:, тому браузерні тести переведені на **наявний Chrome C:** та окремі C: temp-профілі. Глобальні налаштування, PATH, BIOS і профілі користувача не змінювалися.
**Checksum, розпакування, SDK/AVD, boot Android Emulator та встановлення PWA не підтверджені.** Не виконувати архіви як перевірені та не завантажувати повторно до reconciliation. Причина зависання D: не встановлена; це не діагноз несправного диска. `tools/mobile-android-unpack.py` — підготовлений helper, не доказ інсталяції.

## iPhone та живий пілот

[Apple web app](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios): Safari → Share → Add to Home Screen. [Справжній iOS Simulator/Xcode](https://developer.apple.com/xcode/system-requirements) потребує Mac/macOS. На Windows перевірені responsive Chrome viewports; Safari/WebKit, iPhone installation та physical Android ще відкриті.

Підписаний live JWT, дві живі сесії з новою схемою, Google SDK, передовий voice AI, store downloads, платежі та навантаження сотнями користувачів не прийняті. Наявна [таблиця систем](../product-status-20261004/STATUS.uk.md) лишається з цими межами. Тариф CHF12/10 запитів — припущення моделі, не підтверджений попит або реалізований billing guard. Платежів, донатів, платних provider-викликів, міграцій і deployment не виконувала.

## Пакет, чати й синхронізація

[RELEASE.json](RELEASE.json): 97 файлів / 96 manifest rows, `web_launch/dist-neon-mobile-20261007`; сім змінених assets, решта byte-identical попередньому candidate. Release SHA256: `RELEASE_HASH`. **Не опублікований.** Чужий `journey-ui.mjs` збережений, SHA256 `68d8498139426050e54cd85c3347092701bac990ccbd9fb31205a5878bd4d33b`; у candidate використані committed HEAD bytes.

Два окремі чати: `01a115a3-30cc-7bb3-9d9e-e64684e62b5c` (responsive) і `01a115a3-4a6e-7b71-9993-f68760e454af` (pricing). Результати приймає parent; counts різних наборів не сумуються як унікальні тести. Старі завислі diagnostic sessions зазначені в їхніх звітах; довільні Node/Chrome процеси не завершувати.

Commit/push фіксуються окремим Git readback після цього звіту. Перед push remote був `5861dde`; push не є Pages deployment. Exact production/rollout approval лишається окремим відкритим gate.

**NEXT (15 хв):** відновити читання D: й прийняти checksum вже завантажених Android ZIP; потім SDK/AVD та встановлення. Паралельно фізичний iPhone лишається окремим acceptance, не замінюється Chromium.

Models used: none (provider calls=0, USD=$0.00). Два Codex-чати використовують підписку; її економію не вимірювали.
'''.replace('RELEASE_HASH',release['release_sha256']).replace('web_launch/dist-neon-mobile-20261007',release['candidate']).replace('12 цільових спостереженнях','12 цільових спостереженнях на остаточних байтах (green-extra-final)')
(proof/'REPORT.uk.md').write_text(report,encoding='utf8')
checkpoint='''## Мобільний checkpoint — 07.10.2026

[Android/iPhone PWA, responsive та ціновий сценарій](PREFIXartifacts/mobile-20261007/REPORT.uk.md): збереження чернетки під час SW update; доступна Safari install-help; wrap/grow navigation та неперекриті Studio controls; один вхід, CHF0 зараз/CHF12 як гіпотеза без оплати. Локальні браузерні/семантичні перевірки й 97-file candidate прийняті з явними runner limits; Current/Atelier збережені. Android ZIP завантажені на D:, checksum/SDK/AVD blocked by D reads. Safari/фізичні телефони, live JWT/two accounts, production rollout та capacity не прийняті. Push не є deployment. Попередні checkpoints нижче історичні.

'''
for name,prefix in [('START_HERE.uk.md',''),('README.md',''),('CLAUDE.md',''),('artifacts/product-status-20261004/STATUS.uk.md','../../')]:
    p=root/name
    text=p.read_text(encoding='utf8')
    if '## Мобільний checkpoint — 07.10.2026' not in text:
        first,rest=text.split('\n',1)
        p.write_text(first+'\n\n'+checkpoint.replace('PREFIX',prefix)+rest.lstrip('\n'),encoding='utf8')
entry={'date':'2026-10-07','task':'mobile-pwa-pricing','result':'LOCAL_MOBILE_UI_ACCEPTED_WITH_LIMITS','report':'artifacts/mobile-20261007/REPORT.uk.md','candidate':release['candidate'],'release_sha256':release['release_sha256'],'provider_calls':0,'provider_usd':0,'live':False,'next':'D checksum and Android AVD; separate physical iPhone acceptance'}
log=root/'task_log.jsonl'
if '"task": "mobile-pwa-pricing"' in log.read_text(encoding='utf8'):
    lines=log.read_text(encoding='utf8').splitlines(keepends=True)
    log.write_text(''.join(json.dumps(entry,ensure_ascii=False)+'\n' if '"task": "mobile-pwa-pricing"' in line else line for line in lines),encoding='utf8')
else:
    with log.open('a',encoding='utf8') as f:f.write(json.dumps(entry,ensure_ascii=False)+'\n')
print('Updated owned report, shared checkpoint and one task_log entry.')
