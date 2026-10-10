// Display language for the two-person path. Ukrainian stays the default and the source: every key IS the
// Ukrainian text, so the Ukrainian page is unchanged and a missing translation shows Ukrainian instead of an
// empty control. Language is presentation only: it never changes stored terms, their hash, consent,
// permissions or anything sent to the server.
export const LANGUAGES = Object.freeze({ uk: 'Українська', de: 'Deutsch', en: 'English' });
export const LANGUAGE_KEY = 'synera.real-journey.language.v1';
const DATE_LOCALES = Object.freeze({ uk: 'uk', de: 'de-CH', en: 'en-GB' });

// [Ukrainian source, German (Swiss spelling, informal «du»), English]
export const TABLE = Object.freeze([
  // Page frame
  ['Synera · реальна домовленість', 'Synera · echte Vereinbarung', 'Synera · real agreement'],
  ['Перейти до вмісту', 'Zum Inhalt springen', 'Skip to content'],
  ['Навігація', 'Navigation', 'Navigation'],
  // These three links lead to pages that exist only in Ukrainian so far; the label says so before the click.
  ['Вхід і профіль', 'Anmeldung und Profil (auf Ukrainisch)', 'Sign-in and profile (in Ukrainian)'],
  ['Демо', 'Demo (auf Ukrainisch)', 'Demo (in Ukrainian)'],
  ['SYNERA / РЕАЛЬНИЙ ПІЛОТ', 'SYNERA / ECHTER PILOT', 'SYNERA / REAL PILOT'],
  ['Домовленість між двома людьми', 'Vereinbarung zwischen zwei Menschen', 'An agreement between two people'],
  ['Умови стають наступним кроком лише після окремого підтвердження кожного. Це не контракт і не завершена зустріч.', 'Die Bedingungen werden erst zum nächsten Schritt, wenn beide sie getrennt bestätigt haben. Das ist kein Vertrag und kein abgeschlossenes Treffen.', 'The terms become the next step only after each person confirms them separately. This is not a contract and not a completed meeting.'],
  ['Перевіряємо доступ…', 'Zugang wird geprüft…', 'Checking access…'],
  ['Реальний шлях недоступний', 'Der echte Ablauf ist nicht verfügbar', 'The real path is unavailable'],
  ['Пілот або захищений бекенд не увімкнено. Тут немає демо-замінника.', 'Der Pilot oder das geschützte Backend ist nicht aktiviert. Hier gibt es keinen Demo-Ersatz.', 'The pilot or the protected backend is not enabled. There is no demo substitute here.'],
  ['Відкрити вхід і профіль', 'Anmeldung und Profil öffnen (auf Ukrainisch)', 'Open sign-in and profile (in Ukrainian)'],
  ['Потрібен активний сеанс', 'Aktive Sitzung erforderlich', 'An active session is required'],
  ['Увійди та заповни профіль у головному застосунку.', 'Melde dich an und fülle dein Profil in der Haupt-App aus.', 'Sign in and complete your profile in the main app.'],
  ['Оновити', 'Aktualisieren', 'Refresh'],
  ['Вийти', 'Abmelden', 'Sign out'],
  ['Шлях домовленості', 'Ablauf der Vereinbarung', 'Agreement path'],
  ['Люди', 'Personen', 'People'],
  ['Спільні умови', 'Gemeinsame Bedingungen', 'Shared terms'],
  ['Запрошення', 'Einladung', 'Invitation'],
  ['Розмова', 'Gespräch', 'Conversation'],
  ['Показані лише профілі, доступні твоєму обліковому запису.', 'Angezeigt werden nur Profile, die für dein Konto verfügbar sind.', 'Only profiles available to your account are shown.'],
  ['Домовленості', 'Vereinbarungen', 'Agreements'],
  ['Зустрічі', 'Treffen', 'Meetings'],

  // Terms editor
  ['Умови співпраці', 'Bedingungen der Zusammenarbeit', 'Terms of collaboration'],
  ['Заповни руками обидві сторони. Нова редакція скидає підтвердження.', 'Fülle beide Seiten von Hand aus. Eine neue Fassung setzt die Bestätigungen zurück.', 'Fill in both sides by hand. A new revision resets the confirmations.'],
  ['Запропонувати умови / змінити редакцію', 'Bedingungen vorschlagen / Fassung ändern', 'Propose terms / change the revision'],
  ['Формат', 'Format', 'Format'],
  ['Режим умов', 'Art der Bedingungen', 'Type of terms'],
  ['Обери', 'Auswählen', 'Choose'],
  ['Взаємний обмін', 'Gegenseitiger Austausch', 'Mutual exchange'],
  ['Спільний проєкт', 'Gemeinsames Projekt', 'Joint project'],
  ['Оплачувана послуга', 'Bezahlte Dienstleistung', 'Paid service'],
  ['Рекомендація', 'Empfehlung', 'Referral'],
  ['Поєднання форматів', 'Kombination von Formaten', 'Combination of formats'],
  ['Поєднання способів співпраці', 'Kombination von Formen der Zusammenarbeit', 'Combination of collaboration types'],
  ['Для поєднання явно обери щонайменше два компоненти.', 'Wähle für eine Kombination ausdrücklich mindestens zwei Bestandteile.', 'For a combination, explicitly choose at least two components.'],
  ['Це двосторонній пробний спільний проєкт: кожна людина вручну описує свій конкретний внесок, результат і критерій. Це не автоматичний набір команди.', 'Das ist ein zweiseitiges gemeinsames Probeprojekt: Jede Person beschreibt ihren konkreten Beitrag, das Ergebnis und das Kriterium von Hand. Das ist keine automatische Teamzusammenstellung.', 'This is a two-sided trial joint project: each person describes their specific contribution, result and criterion by hand. It is not automatic team assembly.'],
  ['Рекомендація не створює контакту чи згоди третьої особи: підтвердь їх окремо перед дією.', 'Eine Empfehlung schafft weder einen Kontakt noch die Zustimmung einer dritten Person: Bestätige beides getrennt, bevor du handelst.', 'A referral does not create a contact or a third person’s consent: confirm them separately before acting.'],
  ['Поєднання зберігає лише явно вибрані компоненти; вони не замінюють окремих погоджень.', 'Eine Kombination speichert nur die ausdrücklich gewählten Bestandteile; sie ersetzen keine getrennten Zustimmungen.', 'A combination stores only the explicitly chosen components; they do not replace separate approvals.'],
  ['Ти даєш іншій людині', 'Du gibst der anderen Person', 'You give to the other person'],
  ['Інша людина дає тобі', 'Die andere Person gibt dir', 'The other person gives you'],
  ['Навичка', 'Fähigkeit', 'Skill'],
  ['Результат', 'Ergebnis', 'Result'],
  ['Критерій прийняття', 'Abnahmekriterium', 'Acceptance criterion'],
  ["Обсяг (необов'язково)", 'Umfang (optional)', 'Amount (optional)'],
  ['Одиниця', 'Einheit', 'Unit'],
  ['Години', 'Stunden', 'Hours'],
  ['Результати', 'Ergebnisse', 'Results'],
  ['Сесії', 'Sitzungen', 'Sessions'],
  ['Строк і умови', 'Frist und Bedingungen', 'Deadline and terms'],
  ['Початок', 'Beginn', 'Start'],
  ['Строк завершення', 'Abschlussfrist', 'Completion deadline'],
  ['Строк', 'Frist', 'Deadline'],
  ['Компенсація', 'Vergütung', 'Compensation'],
  ['Взаємний обмін без грошової оплати', 'Gegenseitiger Austausch ohne Geldzahlung', 'Mutual exchange without money'],
  ['Грошова винагорода', 'Geldvergütung', 'Monetary payment'],
  ['Без винагороди', 'Ohne Vergütung', 'No compensation'],
  ['Сума', 'Betrag', 'Amount'],
  ['Валюта', 'Währung', 'Currency'],
  ['Рахунок', 'Rechnung', 'Invoice'],
  ['Потрібен', 'Erforderlich', 'Required'],
  ['Не потрібен', 'Nicht erforderlich', 'Not required'],
  ['Оплачувана послуга потребує явної суми, валюти та рішення щодо рахунку. Synera не проводить оплату.', 'Eine bezahlte Dienstleistung braucht einen ausdrücklichen Betrag, eine Währung und eine Entscheidung zur Rechnung. Synera wickelt keine Zahlung ab.', 'A paid service needs an explicit amount, currency and a decision about the invoice. Synera does not process payments.'],
  ['Кількість редакцій', 'Anzahl Überarbeitungen', 'Number of revisions'],
  ['Редакції', 'Überarbeitungen', 'Revisions'],
  ['Конфіденційність', 'Vertraulichkeit', 'Confidentiality'],
  ['Потрібна', 'Erforderlich', 'Required'],
  ['Не потрібна', 'Nicht erforderlich', 'Not required'],
  ['Інтелектуальна власність', 'Geistiges Eigentum', 'Intellectual property'],
  ['У того, хто дає', 'Bei der gebenden Person', 'With the giver'],
  ['У того, хто надає', 'Bei der gebenden Person', 'With the giver'],
  ['У того, хто отримує', 'Bei der empfangenden Person', 'With the receiver'],
  ['Спільна', 'Gemeinsam', 'Shared'],
  ['Скасування', 'Rücktritt', 'Cancellation'],
  ['Взаємне письмове повідомлення', 'Gegenseitige schriftliche Mitteilung', 'Mutual written notice'],
  ['Будь-хто до початку', 'Jede Seite vor Beginn', 'Either party before the start'],
  ['Зберегти нову редакцію', 'Neue Fassung speichern', 'Save new revision'],
  ['Я прочитала/прочитав саме цю редакцію умов.', 'Ich habe genau diese Fassung der Bedingungen gelesen.', 'I have read exactly this revision of the terms.'],
  ['Підтвердити свою сторону', 'Meine Seite bestätigen', 'Confirm my side'],
  ['Відкликати своє підтвердження', 'Meine Bestätigung zurückziehen', 'Withdraw my confirmation'],
  ['Закрити ці умови', 'Diese Bedingungen schliessen', 'Close these terms'],
  ['Закриті умови залишаться історією. Новий обмін потребує нових підтверджень.', 'Geschlossene Bedingungen bleiben als Verlauf erhalten. Ein neuer Austausch braucht neue Bestätigungen.', 'Closed terms remain as history. A new exchange needs new confirmations.'],

  // Review of a saved revision
  ['Редакція {version} · {status}', 'Fassung {version} · {status}', 'Revision {version} · {status}'],
  ['Перевірити версію', 'Version prüfen', 'Verify version'],
  ['Контрольна сума: {hash}', 'Prüfsumme: {hash}', 'Checksum: {hash}'],
  ['відсутня', 'fehlt', 'missing'],
  ['Ти даєш', 'Du gibst', 'You give'],
  ['{name} дає', '{name} gibt', '{name} gives'],
  ['{name} дає тобі', '{name} gibt dir', '{name} gives you'],
  ['Результат: {text}', 'Ergebnis: {text}', 'Result: {text}'],
  ['Критерій: {text}', 'Kriterium: {text}', 'Criterion: {text}'],
  ['Обсяг: {amount} {unit}', 'Umfang: {amount} {unit}', 'Amount: {amount} {unit}'],
  // Stored unit codes are shown as they are in Ukrainian (unchanged behaviour) and named in German.
  ['hours', 'Stunden', 'hours'],
  ['items', 'Ergebnisse', 'items'],
  ['sessions', 'Sitzungen', 'sessions'],
  ['Очікуваний підсумок для {name}: {target}', 'Erwartetes Ergebnis für {name}: {target}', 'Expected outcome for {name}: {target}'],
  ['Винагорода: {amount} {currency}', 'Vergütung: {amount} {currency}', 'Payment: {amount} {currency}'],
  ['Рахунок: {value}', 'Rechnung: {value}', 'Invoice: {value}'],
  ['так', 'ja', 'yes'],
  ['ні', 'nein', 'no'],
  ['потрібно узгодити', 'noch abzustimmen', 'to be agreed'],
  ['не вказано', 'nicht angegeben', 'not specified'],
  ['підтвердив(ла) цю редакцію', 'hat diese Fassung bestätigt', 'has confirmed this revision'],
  ['ще не підтвердив(ла)', 'hat noch nicht bestätigt', 'has not confirmed yet'],
  ['Ідентифікатор профілю: {id}', 'Profil-ID: {id}', 'Profile ID: {id}'],

  // People, agreements, meetings
  ['Учасник домовленості', 'Beteiligte Person', 'Agreement participant'],
  ['Учасник', 'Person', 'Participant'],
  ['Місто не вказано', 'Ort nicht angegeben', 'City not specified'],
  ['Наразі немає доступних профілів.', 'Derzeit sind keine Profile verfügbar.', 'No profiles are available right now.'],
  ['Дає: {offered}. Шукає: {needed}.', 'Bietet: {offered}. Sucht: {needed}.', 'Offers: {offered}. Looking for: {needed}.'],
  ['Є заявлена взаємна користь. Потрібна розмова.', 'Es gibt einen angegebenen gegenseitigen Nutzen. Ein Gespräch ist nötig.', 'A declared mutual benefit exists. A conversation is needed.'],
  ['Умови підбору ще не збігаються.', 'Die Angaben passen noch nicht zusammen.', 'The matching conditions do not align yet.'],
  ['Відкрити умови', 'Bedingungen öffnen', 'Open terms'],
  ['Відкритих домовленостей немає.', 'Keine offenen Vereinbarungen.', 'There are no open agreements.'],
  ['Недоступно', 'Nicht verfügbar', 'Unavailable'],
  ['Переглянути умови', 'Bedingungen ansehen', 'View terms'],
  ['Запрошень або прийнятих розмов немає.', 'Keine Einladungen oder angenommenen Gespräche.', 'There are no invitations or accepted conversations.'],
  ['Умови змінилися після цього запрошення. Прийняти його можна, коли обидва підтвердять поточну редакцію.', 'Die Bedingungen haben sich nach dieser Einladung geändert. Du kannst sie annehmen, sobald beide die aktuelle Fassung bestätigt haben.', 'The terms changed after this invitation. You can accept it once both confirm the current revision.'],
  ['Запрошення чекає: спершу обидва мають підтвердити поточну редакцію умов.', 'Die Einladung wartet: Zuerst müssen beide die aktuelle Fassung der Bedingungen bestätigen.', 'The invitation is waiting: first both must confirm the current revision of the terms.'],
  ['Прийняти', 'Annehmen', 'Accept'],
  ['Відхилити', 'Ablehnen', 'Decline'],
  ['Відкрити розмову', 'Gespräch öffnen', 'Open conversation'],
  ['Чернетка', 'Entwurf', 'Draft'],
  ['Очікує підтвердження', 'Wartet auf Bestätigung', 'Awaiting confirmation'],
  ['Погоджено обома', 'Von beiden bestätigt', 'Confirmed by both'],
  ['Чекає відповіді', 'Wartet auf Antwort', 'Awaiting reply'],
  ['Прийнято', 'Angenommen', 'Accepted'],
  ['Відхилено', 'Abgelehnt', 'Declined'],
  ['Скасовано', 'Abgesagt', 'Cancelled'],
  ['Час не вказано', 'Zeit nicht angegeben', 'Time not specified'],

  // Invitation
  ['Запросити на розмову', 'Zum Gespräch einladen', 'Invite to a conversation'],
  ['Коротка нотатка', 'Kurze Notiz', 'Short note'],
  ['Час', 'Zeit', 'Time'],
  ['Тривалість', 'Dauer', 'Duration'],
  ['20 хв', '20 Min.', '20 min'],
  ['30 хв', '30 Min.', '30 min'],
  ['60 хв', '60 Min.', '60 min'],
  ['Місце', 'Ort', 'Place'],
  ['Онлайн', 'Online', 'Online'],
  ['Надіслати запрошення', 'Einladung senden', 'Send invitation'],
  ['Запрошення для цієї пари вже надіслано й чекає відповіді. Його видно в розділі «Зустрічі».', 'Für dieses Paar wurde bereits eine Einladung gesendet; sie wartet auf Antwort. Du findest sie im Bereich «Treffen».', 'An invitation for this pair has already been sent and is awaiting a reply. You can see it in the “Meetings” section.'],

  // Conversation
  ['Приватна розмова після прийняття', 'Privates Gespräch nach der Annahme', 'Private conversation after acceptance'],
  ['Приватні повідомлення', 'Private Nachrichten', 'Private messages'],
  ['Повідомлення', 'Nachricht', 'Message'],
  ['Надіслати', 'Senden', 'Send'],
  ['Повідомлень ще немає.', 'Noch keine Nachrichten.', 'No messages yet.'],
  ['Розмову закрито: зустріч скасовано або її стан змінився. Текст у полі лишився тобі, але надіслати його сюди вже не можна.', 'Das Gespräch ist geschlossen: Das Treffen wurde abgesagt oder sein Status hat sich geändert. Der Text im Feld bleibt dir erhalten, kann hier aber nicht mehr gesendet werden.', 'The conversation is closed: the meeting was cancelled or its state changed. The text in the field is still yours, but it can no longer be sent here.'],

  // Meeting address
  ['Адреса зустрічі', 'Adresse des Treffens', 'Meeting address'],
  ['Кожен обирає окремо. Адреса зміниться після згоди другої людини.', 'Jede Person wählt getrennt. Die Adresse ändert sich erst nach Zustimmung der anderen Person.', 'Each person chooses separately. The address changes after the other person agrees.'],
  ['Перевірити адресу', 'Adresse prüfen', 'Check address'],
  ['Історія вибору місця', 'Verlauf der Ortswahl', 'History of the place choice'],
  ['Адресу ще не погоджено', 'Adresse noch nicht abgestimmt', 'The address is not agreed yet'],
  ['Пропозиція застаріла', 'Der Vorschlag ist veraltet', 'The proposal is out of date'],
  ['Пропозицію відхилено', 'Vorschlag abgelehnt', 'Proposal declined'],
  ['Потрібне актуальне погодження умов', 'Aktuelle Bestätigung der Bedingungen erforderlich', 'A current confirmation of the terms is required'],
  ['Очікує вибору другої людини', 'Wartet auf die Entscheidung der anderen Person', 'Awaiting the other person’s choice'],
  ['{when} · {minutes} хв · {place}', '{when} · {minutes} Min. · {place}', '{when} · {minutes} min · {place}'],
  ['Попередня адреса: {address}', 'Bisherige Adresse: {address}', 'Previous address: {address}'],
  ['Пропонує: {name}', 'Vorgeschlagen von: {name}', 'Proposed by: {name}'],
  ['Я погоджую саме цю адресу й час.', 'Ich stimme genau dieser Adresse und Zeit zu.', 'I agree to exactly this address and time.'],
  ['Погодити адресу', 'Adresse bestätigen', 'Agree to address'],
  ['Відхилити адресу', 'Adresse ablehnen', 'Decline address'],
  ['Маршрут у Google Maps ↗', 'Route in Google Maps ↗', 'Route in Google Maps ↗'],
  ['Відкриє Google Maps у цьому вікні й передасть адресу. Перевір точку на карті.', 'Öffnet Google Maps in diesem Fenster und übergibt die Adresse. Prüfe den Punkt auf der Karte.', 'Opens Google Maps in this window and passes the address. Check the point on the map.'],
  ['Запропонувати іншу адресу', 'Eine andere Adresse vorschlagen', 'Propose a different address'],
  ['Точна адреса або точка зустрічі', 'Genaue Adresse oder Treffpunkt', 'Exact address or meeting point'],
  ['Я пропоную це місце другій людині.', 'Ich schlage diesen Ort der anderen Person vor.', 'I propose this place to the other person.'],
  ['Запропонувати адресу', 'Adresse vorschlagen', 'Propose address'],
  ['Для нового вибору потрібні актуальні підтвердження обох і майбутній час зустрічі.', 'Für eine neue Wahl braucht es aktuelle Bestätigungen beider und einen Termin in der Zukunft.', 'A new choice requires current confirmations from both and a meeting time in the future.'],
  ['запропоновано', 'vorgeschlagen', 'proposed'],
  ['погоджено', 'zugestimmt', 'agreed'],
  ['відхилено', 'abgelehnt', 'declined'],

  // Results
  ['Результати домовленості', 'Ergebnisse der Vereinbarung', 'Results of the agreement'],
  ['Кожен результат приймає його одержувач. Synera зберігає ваші підтвердження; це не незалежна перевірка якості.', 'Jedes Ergebnis nimmt die Person ab, die es erhält. Synera speichert eure Bestätigungen; das ist keine unabhängige Qualitätsprüfung.', 'Each result is accepted by its receiver. Synera stores your confirmations; this is not an independent quality check.'],
  ['Перевірити результати', 'Ergebnisse prüfen', 'Check results'],
  ['Історія підтверджень', 'Verlauf der Bestätigungen', 'Confirmation history'],
  ['Усі результати прийняті одержувачами', 'Alle Ergebnisse wurden von den Empfangenden abgenommen', 'All results have been accepted by their receivers'],
  ['Прийнято {accepted} з {total} результатів', '{accepted} von {total} Ergebnissen abgenommen', '{accepted} of {total} results accepted'],
  ['Доказ: {text}', 'Nachweis: {text}', 'Evidence: {text}'],
  ['Перевірка: {text}', 'Prüfung: {text}', 'Check: {text}'],
  ['Очікує доказу', 'Wartet auf Nachweis', 'Awaiting evidence'],
  ['Доказ подано', 'Nachweis eingereicht', 'Evidence submitted'],
  ['Перевірено за критерієм', 'Nach Kriterium geprüft', 'Checked against the criterion'],
  ['Прийнято одержувачем', 'Von der empfangenden Person abgenommen', 'Accepted by the receiver'],
  ['Є відкритий спір', 'Es gibt einen offenen Streitfall', 'There is an open dispute'],
  ['Результат не надано', 'Ergebnis nicht geliefert', 'Result not delivered'],
  ['Поза погодженим обсягом', 'Ausserhalb des vereinbarten Umfangs', 'Outside the agreed scope'],
  ['Критерій ще не виконано', 'Kriterium noch nicht erfüllt', 'Criterion not yet met'],
  ['Інша причина', 'Anderer Grund', 'Other reason'],
  ['Одержувач відкрив спір. У цій редакції новий доказ подати не можна: обговоріть у розмові й збережіть нову редакцію умов, яку окремо підтвердять обоє, або одержувач може прийняти результат після перевірки.', 'Die empfangende Person hat einen Streitfall eröffnet. In dieser Fassung kann kein neuer Nachweis eingereicht werden: Besprecht es im Gespräch und speichert eine neue Fassung der Bedingungen, die beide getrennt bestätigen, oder die empfangende Person nimmt das Ergebnis nach einer Prüfung ab.', 'The receiver opened a dispute. New evidence cannot be submitted in this revision: discuss it in the conversation and save a new revision of the terms that both confirm separately, or the receiver may accept the result after checking.'],
  ['Спір відкрито тобою. Ти можеш прийняти результат пізніше; для нового доказу потрібна нова редакція умов, яку окремо підтвердять обоє.', 'Du hast den Streitfall eröffnet. Du kannst das Ergebnis später abnehmen; für einen neuen Nachweis braucht es eine neue Fassung der Bedingungen, die beide getrennt bestätigen.', 'You opened the dispute. You can accept the result later; new evidence needs a new revision of the terms that both confirm separately.'],
  ['Посилання або опис доказу', 'Link oder Beschreibung des Nachweises', 'Link or description of the evidence'],
  ['Що перевірено за погодженим критерієм', 'Was nach dem vereinbarten Kriterium geprüft wurde', 'What was checked against the agreed criterion'],
  ['Я перевірила/перевірив результат за цим критерієм.', 'Ich habe das Ergebnis nach diesem Kriterium geprüft.', 'I have checked the result against this criterion.'],
  ['Прийняти результат', 'Ergebnis abnehmen', 'Accept result'],
  ['Нейтральна причина', 'Neutraler Grund', 'Neutral reason'],
  ['Обери причину', 'Grund auswählen', 'Choose a reason'],
  ['Подати доказ', 'Nachweis einreichen', 'Submit evidence'],
  ['Зберегти перевірку', 'Prüfung speichern', 'Save check'],
  ['Відкрити спір', 'Streitfall eröffnen', 'Open dispute'],
  ['подано доказ', 'Nachweis eingereicht', 'evidence submitted'],
  ['перевірено критерій', 'Kriterium geprüft', 'criterion checked'],
  ['прийнято результат', 'Ergebnis abgenommen', 'result accepted'],
  ['відкрито спір', 'Streitfall eröffnet', 'dispute opened'],

  // Private copy and private social draft
  ['Приватна копія', 'Private Kopie', 'Private copy'],
  ['Файл містить умови та підтвердження обох учасників. Стиснення не шифрує дані. Копія не змінює серверний стан.', 'Die Datei enthält die Bedingungen und Bestätigungen beider Beteiligten. Komprimierung verschlüsselt die Daten nicht. Die Kopie ändert den Serverstand nicht.', 'The file contains the terms and confirmations of both participants. Compression does not encrypt the data. The copy does not change the server state.'],
  ['Стиснути без зміни тексту', 'Komprimieren, ohne den Text zu ändern', 'Compress without changing the text'],
  ['Завантажити приватний архів', 'Privates Archiv herunterladen', 'Download private archive'],
  ['Переглянути збережену копію', 'Gespeicherte Kopie ansehen (Seite auf Ukrainisch)', 'View a saved copy (page in Ukrainian)'],
  ['Приватна соціальна чернетка', 'Privater Social-Media-Entwurf', 'Private social draft'],
  ['Лише твій прийнятий внесок. Докази й дані партнера не додаються. Назва результату може містити приватні відомості — перевір текст і дозволи перед поширенням.', 'Nur dein abgenommener Beitrag. Nachweise und Daten der anderen Person werden nicht hinzugefügt. Der Name des Ergebnisses kann private Angaben enthalten – prüfe Text und Freigaben, bevor du ihn teilst.', 'Only your accepted contribution. The partner’s evidence and data are not included. The result title may contain private details — check the text and permissions before sharing.'],
  ['Підготувати локальну чернетку з назвою мого результату.', 'Einen lokalen Entwurf mit dem Namen meines Ergebnisses vorbereiten.', 'Prepare a local draft with the title of my result.'],
  ['Загальна чернетка', 'Allgemeiner Entwurf', 'General draft'],
  ['Створити приватну чернетку', 'Privaten Entwurf erstellen', 'Create private draft'],
  ['Твій текст — перевір і відредагуй', 'Dein Text – prüfen und bearbeiten', 'Your text — check and edit'],
  ['Виділити для копіювання', 'Zum Kopieren markieren', 'Select for copying'],
  ['Приватна чернетка для LinkedIn (не опубліковано):', 'Privater Entwurf für LinkedIn (nicht veröffentlicht):', 'Private draft for LinkedIn (not published):'],
  ['Приватна загальна social-чернетка (не опубліковано):', 'Privater allgemeiner Social-Media-Entwurf (nicht veröffentlicht):', 'Private general social draft (not published):'],
  ['Це мої результати у Synera, прийняті їхніми одержувачами. Підтвердження учасників не є незалежною перевіркою якості.', 'Das sind meine Ergebnisse in Synera, abgenommen von den Personen, die sie erhalten haben. Die Bestätigungen der Beteiligten sind keine unabhängige Qualitätsprüfung.', 'These are my results in Synera, accepted by their receivers. Participant confirmations are not an independent quality check.'],

  // Status line: what just happened and what is next
  ['Реальний шлях закритий.', 'Der echte Ablauf ist geschlossen.', 'The real path is closed.'],
  ['Потрібен активний сеанс.', 'Aktive Sitzung erforderlich.', 'An active session is required.'],
  ['Список зустрічей оновлено.', 'Die Liste der Treffen wurde aktualisiert.', 'The meeting list has been updated.'],
  ['Твій ненадісланий текст лишився у полі: скопіюй його, якщо він потрібен.', 'Dein nicht gesendeter Text ist im Feld geblieben: Kopiere ihn, wenn du ihn brauchst.', 'Your unsent text is still in the field: copy it if you need it.'],
  ['Твій текст лишився у полі.', 'Dein Text ist im Feld geblieben.', 'Your text is still in the field.'],
  ['Збереження умов не підтверджено. Текст лишився у формі. Натисни «Оновити» й перевір домовленість перед повтором: зміни могли вже зберегтися.', 'Ob die Bedingungen gespeichert wurden, ist nicht bestätigt. Dein Text ist im Formular geblieben. Tippe auf «Aktualisieren» und prüfe die Vereinbarung vor einem erneuten Versuch: Die Änderungen könnten bereits gespeichert sein.', 'Saving the terms has not been confirmed. Your text is still in the form. Press “Refresh” and check the agreement before retrying: the changes may already have been saved.'],
  ['Завантажуємо поточну редакцію умов…', 'Die aktuelle Fassung der Bedingungen wird geladen…', 'Loading the current revision of the terms…'],
  ['Показано поточну редакцію. Прочитай її перед підтвердженням.', 'Die aktuelle Fassung wird angezeigt. Lies sie, bevor du bestätigst.', 'The current revision is shown. Read it before confirming.'],
  ['Нові умови порожні: заповни їх вручну.', 'Die neuen Bedingungen sind leer: Fülle sie von Hand aus.', 'The new terms are empty: fill them in by hand.'],
  ['Нову редакцію збережено. Обидва підтвердження потрібно зробити окремо.', 'Die neue Fassung wurde gespeichert. Beide Bestätigungen müssen getrennt erfolgen.', 'The new revision has been saved. Both confirmations must be made separately.'],
  ['Постав позначку лише після читання поточної редакції.', 'Setze das Häkchen erst, nachdem du die aktuelle Fassung gelesen hast.', 'Tick the box only after reading the current revision.'],
  ['Твоє підтвердження збережено.', 'Deine Bestätigung wurde gespeichert.', 'Your confirmation has been saved.'],
  ['Твоє підтвердження відкликано.', 'Deine Bestätigung wurde zurückgezogen.', 'Your confirmation has been withdrawn.'],
  ['Умови закрито, історію збережено. Новий обмін потребує нових підтверджень.', 'Die Bedingungen wurden geschlossen, der Verlauf bleibt erhalten. Ein neuer Austausch braucht neue Bestätigungen.', 'The terms have been closed and the history kept. A new exchange needs new confirmations.'],
  ['Вкажи коректний час.', 'Gib eine gültige Zeit an.', 'Enter a valid time.'],
  ['Запрошення надіслано. Воно ще не є прийнятою зустріччю.', 'Einladung gesendet. Sie ist noch kein angenommenes Treffen.', 'Invitation sent. It is not an accepted meeting yet.'],
  ['Запрошення прийнято. Розмова доступна обом.', 'Einladung angenommen. Das Gespräch ist für beide verfügbar.', 'Invitation accepted. The conversation is available to both.'],
  ['Запрошення відхилено.', 'Einladung abgelehnt.', 'Invitation declined.'],
  ['Показано приватну розмову після прийнятого запрошення.', 'Das private Gespräch nach der angenommenen Einladung wird angezeigt.', 'The private conversation after the accepted invitation is shown.'],
  ['Повідомлення надіслано й прочитано з сервера.', 'Nachricht gesendet und vom Server gelesen.', 'Message sent and read back from the server.'],
  ['Новий текст лишився чернеткою.', 'Der neue Text ist als Entwurf geblieben.', 'The new text remains as a draft.'],
  ['Доставку не підтверджено. Текст збережено; онови чат перед повторним надсиланням — повідомлення могло вже дійти.', 'Die Zustellung wurde nicht bestätigt. Der Text ist erhalten; aktualisiere den Chat, bevor du erneut sendest – die Nachricht könnte schon angekommen sein.', 'Delivery was not confirmed. The text is kept; refresh the chat before sending again — the message may already have arrived.'],
  ['Дані оновлено з сервера.', 'Daten vom Server aktualisiert.', 'Data refreshed from the server.'],
  ['Дані не вдалося оновити. Показані попередні дані; твій незбережений текст лишився тут. Спробуй «Оновити» ще раз.', 'Die Daten konnten nicht aktualisiert werden. Angezeigt werden die bisherigen Daten; dein nicht gespeicherter Text ist hier geblieben. Versuche «Aktualisieren» noch einmal.', 'The data could not be refreshed. The previous data is shown; your unsaved text is still here. Try “Refresh” again.'],
  ['Ця розмова недоступна. Вибери прийняту зустріч зі свого списку.', 'Dieses Gespräch ist nicht verfügbar. Wähle ein angenommenes Treffen aus deiner Liste.', 'This conversation is unavailable. Choose an accepted meeting from your list.'],
  ['Ти вийшов/вийшла з Synera.', 'Du hast dich von Synera abgemeldet.', 'You have signed out of Synera.'],
  ['Локальні дані прибрано. Серверний вихід потребує повторної спроби.', 'Die lokalen Daten wurden entfernt. Die Abmeldung auf dem Server muss erneut versucht werden.', 'Local data has been cleared. Signing out on the server needs another attempt.'],
  ['Умови партнера змінилися. Твою чернетку збережено; звір нову редакцію перед збереженням.', 'Die Bedingungen der anderen Person haben sich geändert. Dein Entwurf ist erhalten; vergleiche ihn mit der neuen Fassung, bevor du speicherst.', 'The partner’s terms have changed. Your draft is kept; compare it with the new revision before saving.'],
  ['Умови партнера оновлено. Прочитай нову редакцію перед окремим підтвердженням.', 'Die Bedingungen der anderen Person wurden aktualisiert. Lies die neue Fassung, bevor du getrennt bestätigst.', 'The partner’s terms have been updated. Read the new revision before confirming separately.'],
  ['Запрошення: {status}.', 'Einladung: {status}.', 'Invitation: {status}.'],
  ['Можеш відкрити приватну розмову.', 'Du kannst das private Gespräch öffnen.', 'You can open the private conversation.'],
  ['Відповідь потребує окремого вибору.', 'Die Antwort braucht eine getrennte Entscheidung.', 'The reply needs a separate choice.'],
  ['Переглянь список зустрічей.', 'Sieh dir die Liste der Treffen an.', 'Review the meeting list.'],
  ['Умови погоджено обома. Можеш надіслати запрошення.', 'Beide haben die Bedingungen bestätigt. Du kannst eine Einladung senden.', 'Both have confirmed the terms. You can send an invitation.'],
  ['Погодження умов оновлено. Переглянь стан кожного учасника.', 'Die Bestätigungen der Bedingungen wurden aktualisiert. Sieh dir den Stand jeder Person an.', 'The confirmations of the terms have been updated. Review each participant’s state.'],
  ['Для погодження адреси потрібна відкрита домовленість.', 'Für die Abstimmung der Adresse ist eine offene Vereinbarung nötig.', 'Agreeing on an address requires an open agreement.'],
  ['Актуальний стан адреси прочитано з сервера.', 'Der aktuelle Stand der Adresse wurde vom Server gelesen.', 'The current address state has been read from the server.'],
  ['Умови або зустріч змінились. Перевір адресу знову.', 'Die Bedingungen oder das Treffen haben sich geändert. Prüfe die Adresse erneut.', 'The terms or the meeting have changed. Check the address again.'],
  ['Не вдалося прочитати адресу. Приватна розмова доступна; перевір адресу пізніше.', 'Die Adresse konnte nicht gelesen werden. Das private Gespräch ist verfügbar; prüfe die Adresse später.', 'The address could not be read. The private conversation is available; check the address later.'],
  ['Адресу запропоновано. Чекаємо окремого вибору другої людини.', 'Adresse vorgeschlagen. Wir warten auf die getrennte Entscheidung der anderen Person.', 'Address proposed. Waiting for the other person’s separate choice.'],
  ['Твій вибір адреси збережено на сервері.', 'Deine Adresswahl wurde auf dem Server gespeichert.', 'Your address choice has been saved on the server.'],
  ['Пропозиція або умови змінилися. Перевір адресу й підтвердь новий вибір окремо.', 'Der Vorschlag oder die Bedingungen haben sich geändert. Prüfe die Adresse und bestätige die neue Wahl getrennt.', 'The proposal or the terms have changed. Check the address and confirm the new choice separately.'],
  ['Не вдалося зберегти адресу. Твій вибір лишився у картці; повтори цю дію пізніше.', 'Die Adresse konnte nicht gespeichert werden. Deine Wahl ist in der Karte geblieben; wiederhole die Aktion später.', 'The address could not be saved. Your choice is still in the card; repeat this action later.'],
  ['Адреса або погодження змінились. Переглянь актуальний стан перед маршрутом.', 'Die Adresse oder die Zustimmung hat sich geändert. Sieh dir den aktuellen Stand an, bevor du die Route öffnest.', 'The address or the approval has changed. Review the current state before opening the route.'],
  ['Не вдалося перевірити маршрут. Повтори свій вибір пізніше.', 'Die Route konnte nicht geprüft werden. Wiederhole deine Auswahl später.', 'The route could not be checked. Repeat your choice later.'],
  ['Відкритої домовленості для цієї пари немає.', 'Für dieses Paar gibt es keine offene Vereinbarung.', 'There is no open agreement for this pair.'],
  ['Результати домовленості прочитано з сервера.', 'Die Ergebnisse der Vereinbarung wurden vom Server gelesen.', 'The results of the agreement have been read from the server.'],
  ['Домовленість змінилася. Перевір результати знову.', 'Die Vereinbarung hat sich geändert. Prüfe die Ergebnisse erneut.', 'The agreement has changed. Check the results again.'],
  ['Не вдалося прочитати результати. Чат доступний; повтори перевірку пізніше.', 'Die Ergebnisse konnten nicht gelesen werden. Der Chat ist verfügbar; wiederhole die Prüfung später.', 'The results could not be read. The chat is available; repeat the check later.'],
  ['Твою дію збережено й прочитано з сервера.', 'Deine Aktion wurde gespeichert und vom Server gelesen.', 'Your action has been saved and read back from the server.'],
  ['Сервер результатів тимчасово недоступний. Твій текст лишився у полі; повтори цю дію пізніше.', 'Der Ergebnis-Server ist vorübergehend nicht verfügbar. Dein Text ist im Feld geblieben; wiederhole die Aktion später.', 'The results server is temporarily unavailable. Your text is still in the field; repeat this action later.'],
  ['Приватну копію створено. Вихідний UTF-8: {original} байт; файл: {file} байт.', 'Private Kopie erstellt. Ursprüngliches UTF-8: {original} Bytes; Datei: {file} Bytes.', 'Private copy created. Original UTF-8: {original} bytes; file: {file} bytes.'],
  ['Домовленість змінилася. Перевір результати перед експортом.', 'Die Vereinbarung hat sich geändert. Prüfe die Ergebnisse vor dem Export.', 'The agreement has changed. Check the results before exporting.'],
  ['Не вдалося створити приватний архів. Чат і твій текст збережені; повтори завантаження пізніше.', 'Das private Archiv konnte nicht erstellt werden. Der Chat und dein Text sind erhalten; wiederhole den Download später.', 'The private archive could not be created. The chat and your text are kept; repeat the download later.'],
  ['Приватну чернетку створено з прийнятого внеску. Перевір текст та дозволи перед зовнішнім поширенням.', 'Der private Entwurf wurde aus dem abgenommenen Beitrag erstellt. Prüfe Text und Freigaben, bevor du ihn nach aussen teilst.', 'The private draft was created from the accepted contribution. Check the text and permissions before sharing it externally.'],
  ['Домовленість змінилася. Перевір результати перед створенням чернетки.', 'Die Vereinbarung hat sich geändert. Prüfe die Ergebnisse, bevor du einen Entwurf erstellst.', 'The agreement has changed. Check the results before creating a draft.'],
  ['Не вдалося створити приватну чернетку. Чат доступний; повтори створення пізніше.', 'Der private Entwurf konnte nicht erstellt werden. Der Chat ist verfügbar; versuche es später erneut.', 'The private draft could not be created. The chat is available; try again later.'],
  ['Текст виділено. Скопіюй його вручну після перевірки; Synera нічого не публікує.', 'Der Text ist markiert. Kopiere ihn nach der Prüfung von Hand; Synera veröffentlicht nichts.', 'The text is selected. Copy it by hand after checking; Synera publishes nothing.'],

  // Refusals and errors (page, client, shared store)
  ['Сеанс завершився. Увійди знову.', 'Die Sitzung ist beendet. Melde dich erneut an.', 'The session has ended. Sign in again.'],
  ['Ця дія недоступна для поточного облікового запису.', 'Diese Aktion ist für das aktuelle Konto nicht verfügbar.', 'This action is not available for the current account.'],
  ['Реальний шлях тимчасово недоступний.', 'Der echte Ablauf ist vorübergehend nicht verfügbar.', 'The real path is temporarily unavailable.'],
  ['Сервер не прийняв цю дію: можливий денний ліміт дій або застарілі дані. Натисни «Оновити» й перевір поля; якщо повториться, спробуй пізніше.', 'Der Server hat diese Aktion nicht angenommen: Möglicherweise ist das Tageslimit erreicht oder die Daten sind veraltet. Tippe auf «Aktualisieren» und prüfe die Felder; wenn es wieder passiert, versuche es später.', 'The server did not accept this action: the daily action limit may be reached or the data may be out of date. Press “Refresh” and check the fields; if it happens again, try later.'],
  ['Не вдалося завершити дію.', 'Die Aktion konnte nicht abgeschlossen werden.', 'The action could not be completed.'],
  ['Форма або сервер не прийняли ці дані. Перевір поля й спробуй ще раз.', 'Das Formular oder der Server hat diese Daten nicht angenommen. Prüfe die Felder und versuche es noch einmal.', 'The form or the server did not accept this data. Check the fields and try again.'],
  ['Умови змінилися. Онови їх, перечитай і підтвердь нову версію.', 'Die Bedingungen haben sich geändert. Aktualisiere sie, lies sie erneut und bestätige die neue Version.', 'The terms have changed. Refresh them, read them again and confirm the new version.'],
  ['Умови змінилися після цього запрошення. Прийняти його можна, коли обидва підтвердять поточну редакцію. Відхилити можна будь-коли.', 'Die Bedingungen haben sich nach dieser Einladung geändert. Du kannst sie annehmen, sobald beide die aktuelle Fassung bestätigt haben. Ablehnen kannst du jederzeit.', 'The terms changed after this invitation. You can accept it once both confirm the current revision. You can decline at any time.'],
  ['Це запрошення вже змінилося або скасоване.', 'Diese Einladung hat sich bereits geändert oder wurde abgesagt.', 'This invitation has already changed or been cancelled.'],
  ['Ця розмова більше недоступна: зустріч скасовано або її стан змінився.', 'Dieses Gespräch ist nicht mehr verfügbar: Das Treffen wurde abgesagt oder sein Status hat sich geändert.', 'This conversation is no longer available: the meeting was cancelled or its state changed.'],
  ['Чернетка досягнення доступна після приймання всіх результатів їхніми одержувачами.', 'Der Entwurf ist verfügbar, sobald alle Ergebnisse von ihren Empfangenden abgenommen wurden.', 'The achievement draft is available once all results have been accepted by their receivers.'],
  ['Чернетка доступна лише після явного підтвердження кожним учасником.', 'Der Entwurf ist erst verfügbar, nachdem jede beteiligte Person ausdrücklich bestätigt hat.', 'The draft is available only after each participant has explicitly confirmed.'],
  ['Знайдено суперечливі відкриті домовленості. Потрібна перевірка сервера.', 'Es wurden widersprüchliche offene Vereinbarungen gefunden. Eine Prüfung auf dem Server ist nötig.', 'Conflicting open agreements were found. A server check is needed.'],
  ['Зміст умов не відповідає їхній контрольній сумі.', 'Der Inhalt der Bedingungen stimmt nicht mit ihrer Prüfsumme überein.', 'The content of the terms does not match their checksum.'],
  ['Заповни конкретні результати й усі умови обміну.', 'Fülle die konkreten Ergebnisse und alle Bedingungen des Austauschs aus.', 'Fill in the specific results and all terms of the exchange.'],
  ['Спочатку обидва учасники мають підтвердити поточні умови.', 'Zuerst müssen beide die aktuellen Bedingungen bestätigen.', 'First both participants must confirm the current terms.'],
  ['Обери підтриманий режим умов.', 'Wähle eine unterstützte Art der Bedingungen.', 'Choose a supported type of terms.'],
  ['Поєднання потребує щонайменше двох явних компонентів.', 'Eine Kombination braucht mindestens zwei ausdrücklich gewählte Bestandteile.', 'A combination needs at least two explicit components.'],
  ['Оплачувана послуга вимагає явної грошової винагороди, валюти й рахунку.', 'Eine bezahlte Dienstleistung braucht eine ausdrückliche Geldvergütung, eine Währung und eine Angabe zur Rechnung.', 'A paid service requires an explicit payment, currency and invoice decision.'],
  ['Потрібно явно обрати всі матеріальні умови.', 'Alle materiellen Bedingungen müssen ausdrücklich gewählt werden.', 'All material terms must be chosen explicitly.'],
  ['Обери взаємний обмін без грошової оплати.', 'Wähle gegenseitigen Austausch ohne Geldzahlung.', 'Choose mutual exchange without money.'],
  ['Онлайн-сервіс тимчасово недоступний через обмеження хостингу. Власник уже має інформацію для відновлення.', 'Der Online-Dienst ist wegen einer Hosting-Beschränkung vorübergehend nicht verfügbar. Der Betreiber ist bereits informiert.', 'The online service is temporarily unavailable because of a hosting limit. The owner has already been informed.'],
  ['Такий запит уже існує. Відкрий розділ «Зустрічі».', 'Eine solche Anfrage besteht bereits. Öffne den Bereich «Treffen».', 'Such a request already exists. Open the “Meetings” section.'],
  ['Перевір введені дані.', 'Prüfe die eingegebenen Daten.', 'Check the data you entered.'],
  ['Забагато спроб. Зачекай кілька хвилин перед наступною.', 'Zu viele Versuche. Warte ein paar Minuten vor dem nächsten.', 'Too many attempts. Wait a few minutes before the next one.'],
  ['Сервіс тимчасово недоступний. Спробуй пізніше.', 'Der Dienst ist vorübergehend nicht verfügbar. Versuche es später.', 'The service is temporarily unavailable. Try again later.'],
  ['Не вдалося відновити з’єднання з акаунтом. Спробуй ще раз.', 'Die Verbindung zum Konto konnte nicht wiederhergestellt werden. Versuche es noch einmal.', 'The connection to the account could not be restored. Try again.'],
  ['Не вдалося завантажити або зберегти дані. Повтори дію; введені поля залишаються у формі.', 'Die Daten konnten nicht geladen oder gespeichert werden. Wiederhole die Aktion; die eingegebenen Felder bleiben im Formular.', 'The data could not be loaded or saved. Repeat the action; the fields you entered stay in the form.'],

  // Skills offered and needed (labels of the shared capability list)
  ['Автоматизація процесів', 'Prozessautomatisierung', 'Process automation'],
  ['Дизайн продукту', 'Produktdesign', 'Product design'],
  ['Інтерв’ю з клієнтами', 'Kundeninterviews', 'Customer interviews'],
  ['B2B-продажі', 'B2B-Vertrieb', 'B2B sales'],
  ['Відеопрезентація', 'Videopräsentation', 'Video presentation'],
  ['Бюджетування', 'Budgetplanung', 'Budgeting'],
  ['Організація подій', 'Eventorganisation', 'Event organisation'],

  // View switcher (built by atelier.mjs; translated here so that module stays unchanged for other pages)
  ['Вигляд', 'Ansicht', 'Appearance'],
  ['Вигляд Synera: чинний або Atelier 2026', 'Synera-Ansicht: aktuell oder Atelier 2026', 'Synera appearance: current or Atelier 2026'],
  ['Твій простір. Твій темп.', 'Dein Raum. Dein Tempo.', 'Your space. Your pace.'],
  ['Версія вигляду', 'Version der Ansicht', 'Appearance version'],
  ['Чинний', 'Aktuell', 'Current'],
  ['Акцент', 'Akzent', 'Accent'],
  ['Золото', 'Gold', 'Gold'],
  ['Червоний', 'Rot', 'Red'],
  ['Сливовий', 'Pflaume', 'Plum'],
  ['Простір між елементами', 'Abstand zwischen Elementen', 'Spacing between elements'],
  ['Вільний', 'Luftig', 'Comfortable'],
  ['Компактний', 'Kompakt', 'Compact'],
  ['Більший текст', 'Grösserer Text', 'Larger text'],
  ['Чіткіші межі', 'Klarere Konturen', 'Sharper borders'],
  ['Зберігається лише вигляд у цьому браузері. Налаштування Atelier діють після його вибору.', 'Gespeichert wird nur die Ansicht in diesem Browser. Atelier-Einstellungen gelten, sobald Atelier gewählt ist.', 'Only the appearance is stored in this browser. Atelier settings apply once Atelier is selected.'],
  ['Atelier увімкнено. Вигляд збережено.', 'Atelier ist eingeschaltet. Ansicht gespeichert.', 'Atelier is on. Appearance saved.'],
  ['Atelier увімкнено. Лише в цій вкладці.', 'Atelier ist eingeschaltet. Nur in diesem Tab.', 'Atelier is on. In this tab only.'],
  ['Чинний вигляд повернуто. Вигляд збережено.', 'Die aktuelle Ansicht ist zurück. Ansicht gespeichert.', 'The current appearance is back. Appearance saved.'],
  ['Чинний вигляд повернуто. Лише в цій вкладці.', 'Die aktuelle Ansicht ist zurück. Nur in diesem Tab.', 'The current appearance is back. In this tab only.'],
]);

const DICTIONARY = Object.freeze({ de: new Map(TABLE.map(row => [row[0], row[1]])), en: new Map(TABLE.map(row => [row[0], row[2]])) });
const SOURCES = new Set(TABLE.map(row => row[0]));
let language = 'uk';

export const getLanguage = () => language;
export const dateLocale = () => DATE_LOCALES[language];
// True when `key` is one of our own source strings (and so safe to translate by exact match).
export const hasSource = key => SOURCES.has(key);
// True when showing `key` through tr() yields text in the current language.
export const known = key => language === 'uk' || DICTIONARY[language].has(key);

// Placeholders are filled in one pass over the template, so text supplied by a person is never re-scanned.
export function tr(key, params) {
  const template = language === 'uk' ? key : DICTIONARY[language].get(key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    if (!Object.hasOwn(params, name)) return match;
    const value = params[name]; return String(typeof value === 'function' ? value() : value);
  });
}
// A deferred tr(): the page keeps the function and calls it again when the language changes.
export const t = (key, params) => () => tr(key, params);

export function setLanguage(next, storage) {
  language = Object.hasOwn(LANGUAGES, next) ? next : 'uk';
  try { storage?.setItem(LANGUAGE_KEY, language); } catch { /* The choice then lasts for this page only. */ }
  return language;
}
// An explicit ?lang= wins and is remembered; otherwise the person's earlier choice; otherwise Ukrainian.
// The browser's language is deliberately not consulted: the default look stays the current one.
export function initLanguage({ search = '', storage = null } = {}) {
  const asked = new URLSearchParams(search).get('lang');
  if (asked && Object.hasOwn(LANGUAGES, asked)) return setLanguage(asked, storage);
  let saved = null; try { saved = storage?.getItem(LANGUAGE_KEY); } catch { /* Private mode: fall through. */ }
  language = saved && Object.hasOwn(LANGUAGES, saved) ? saved : 'uk';
  return language;
}

// Markup that exists before any data is shown: remember each Ukrainian source once, then re-apply on demand.
// Only our own source strings are touched, so names, numbers and brand words stay as written.
export function collectStatic(document) {
  const items = [], title = document.title;
  const walker = document.createTreeWalker(document.body, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const source = node.nodeValue, key = source.trim();
    if (key && hasSource(key)) items.push(() => { node.nodeValue = source.replace(key, tr(key)); });
  }
  for (const element of document.body.querySelectorAll('[aria-label],[placeholder],[title]')) {
    for (const name of ['aria-label', 'placeholder', 'title']) {
      const key = element.getAttribute(name);
      if (key && hasSource(key)) items.push(() => element.setAttribute(name, tr(key)));
    }
  }
  if (hasSource(title)) items.push(() => { document.title = tr(title); });
  return { size: items.length, apply() { for (const item of items) item(); } };
}

// A line of text that another module rewrites (the view switcher's own status). When that module writes one
// of our source strings, show it in the current language; when the language changes, show it again.
export function mirrorText(node, Observer = globalThis.MutationObserver) {
  let key = null;
  const show = () => { const text = key && tr(key); if (text && node.textContent !== text) node.textContent = text; };
  const read = () => { const text = node.textContent; if (hasSource(text)) { key = text; show(); } else if (!text) key = null; };
  if (node && Observer) { new Observer(read).observe(node, { childList: true, characterData: true, subtree: true }); read(); }
  return { apply: show };
}
