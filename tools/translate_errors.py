import os
import glob
import re

translations = {
    "'Invalid profile'": "'Некоректний профіль'",
    "'Sign in required'": "'Потрібна авторизація'",
    "'Invalid page'": "'Некоректна сторінка'",
    "'Invalid request'": "'Некоректний запит'",
    "'Invalid status'": "'Некоректний статус'",
    "'Request unavailable'": "'Запит недоступний'",
    "'Invalid block'": "'Некоректне блокування'",
    "'Invalid report'": "'Некоректна скарга'",
    "'Invalid case state'": "'Некоректний стан кейсу'",
    "'Case participants cannot change'": "'Учасники кейсу не можуть змінюватися'",
    "'Case version cannot move backwards'": "'Версія кейсу не може зменшуватися'",
    "'A case is closed only by the party doing it'": "'Кейс може бути закритий лише ініціатором'",
    "'Invalid case id'": "'Некоректний ідентифікатор кейсу'",
    "'Profile name is required'": "'Ім\\'я профілю є обов\\'язковим'",
    "'Remove private contacts or secrets before sharing'": "'Прибери контакти, ключі та приватні дані перед поширенням'",
    "'AI returned invalid JSON. Profile unchanged.'": "'AI повернув некоректний JSON. Профіль не змінено.'",
    "'Local AI unavailable'": "'Локальний AI недоступний'",
    "'Local receipt unavailable'": "'Локальний чек недоступний'",
    "'Acceptance receipt unavailable'": "'Чек підтвердження недоступний'",
    "'Invalid input'": "'Некоректні вхідні дані'",
    "'Simulation clock cannot go backwards'": "'Симуляційний годинник не може йти назад'",
    "'Invalid simulation clock'": "'Некоректний симуляційний годинник'",
    "'Simulation recipient required'": "'Потрібен отримувач для симуляції'",
    "'Profile lacks goal definition'": "'У профілі відсутня мета'",
    "'Not enough match slots left for this cohort'": "'Недостатньо слотів для метчу в цій когорті'",
    "'Cycle must contain exactly 3 participant nodes'": "'Цикл має містити рівно 3 учасників'",
    "'Cycle exchange contains unresolved or disconnected paths'": "'Циклічний обмін містить нерозв\\'язані шляхи'",
    "'Cycle paths do not form a closed loop'": "'Шляхи циклу не утворюють замкнене коло'",
    "'Case terms do not support cycle exchange logic'": "'Умови кейсу не підтримують логіку циклічного обміну'"
}

def translate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for eng, ukr in translations.items():
        content = content.replace(eng, ukr)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Translated in {filepath}")

for root, _, files in os.walk(r"C:\Users\Andrii\Desktop\synera\synera_-MVPplus-\web_launch"):
    for file in files:
        if file.endswith('.mjs'):
            translate_file(os.path.join(root, file))

print("Translation done.")
