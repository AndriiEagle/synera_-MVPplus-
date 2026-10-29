// Lane specification SHA-256: 8f385ee4879a0aa99a2d353041a07f01b5843f0b1b5f14a71a73b37da0ed7f4d
export const PALETTES = Object.freeze([
  {
    "id": "gold",
    "name_uk": "Золото",
    "light": {
      "--accent": "#6B4300",
      "--accent-hover": "#573600",
      "--accent-active": "#422900",
      "--on-accent": "#FFFFFF",
      "--accent-text": "#6B4300",
      "--accent-surface": "#FFF6E2",
      "--on-accent-surface": "#6B4300",
      "--accent-border": "#6B4300",
      "--focus-ring": "#6B4300",
      "--focus-ring-gap": "#FFFFFF"
    },
    "dark": {
      "--accent": "#F2C66D",
      "--accent-hover": "#FFD98A",
      "--accent-active": "#E3AF4C",
      "--on-accent": "#14110A",
      "--accent-text": "#F2C66D",
      "--accent-surface": "#2B2416",
      "--on-accent-surface": "#F2C66D",
      "--accent-border": "#F2C66D",
      "--focus-ring": "#F2C66D",
      "--focus-ring-gap": "#0B0B0D"
    }
  },
  {
    "id": "ruby",
    "name_uk": "Рубін",
    "light": {
      "--accent": "#9B1C31",
      "--accent-hover": "#801527",
      "--accent-active": "#68101F",
      "--on-accent": "#FFFFFF",
      "--accent-text": "#9B1C31",
      "--accent-surface": "#FFF0F2",
      "--on-accent-surface": "#9B1C31",
      "--accent-border": "#9B1C31",
      "--focus-ring": "#9B1C31",
      "--focus-ring-gap": "#FFFFFF"
    },
    "dark": {
      "--accent": "#FF9AAA",
      "--accent-hover": "#FFB3BF",
      "--accent-active": "#ED8194",
      "--on-accent": "#210C12",
      "--accent-text": "#FF9AAA",
      "--accent-surface": "#321B23",
      "--on-accent-surface": "#FF9AAA",
      "--accent-border": "#FF9AAA",
      "--focus-ring": "#FF9AAA",
      "--focus-ring-gap": "#0B0B0D"
    }
  },
  {
    "id": "violet",
    "name_uk": "Аметист",
    "light": {
      "--accent": "#6431A5",
      "--accent-hover": "#512486",
      "--accent-active": "#401B6B",
      "--on-accent": "#FFFFFF",
      "--accent-text": "#6431A5",
      "--accent-surface": "#F5EFFF",
      "--on-accent-surface": "#6431A5",
      "--accent-border": "#6431A5",
      "--focus-ring": "#6431A5",
      "--focus-ring-gap": "#FFFFFF"
    },
    "dark": {
      "--accent": "#C6A7FF",
      "--accent-hover": "#D7C2FF",
      "--accent-active": "#B38CEB",
      "--on-accent": "#180D2A",
      "--accent-text": "#C6A7FF",
      "--accent-surface": "#251C35",
      "--on-accent-surface": "#C6A7FF",
      "--accent-border": "#C6A7FF",
      "--focus-ring": "#C6A7FF",
      "--focus-ring-gap": "#0B0B0D"
    }
  },
  {
    "id": "rose",
    "name_uk": "Троянда",
    "light": {
      "--accent": "#9D205D",
      "--accent-hover": "#81184C",
      "--accent-active": "#69113E",
      "--on-accent": "#FFFFFF",
      "--accent-text": "#9D205D",
      "--accent-surface": "#FFF0F7",
      "--on-accent-surface": "#9D205D",
      "--accent-border": "#9D205D",
      "--focus-ring": "#9D205D",
      "--focus-ring-gap": "#FFFFFF"
    },
    "dark": {
      "--accent": "#F6A2CD",
      "--accent-hover": "#FFC0DF",
      "--accent-active": "#E48BB8",
      "--on-accent": "#260D1A",
      "--accent-text": "#F6A2CD",
      "--accent-surface": "#321D2B",
      "--on-accent-surface": "#F6A2CD",
      "--accent-border": "#F6A2CD",
      "--focus-ring": "#F6A2CD",
      "--focus-ring-gap": "#0B0B0D"
    }
  },
  {
    "id": "emerald",
    "name_uk": "Смарагд",
    "light": {
      "--accent": "#1C6348",
      "--accent-hover": "#154F39",
      "--accent-active": "#103C2B",
      "--on-accent": "#FFFFFF",
      "--accent-text": "#1C6348",
      "--accent-surface": "#EDF7F1",
      "--on-accent-surface": "#1C6348",
      "--accent-border": "#1C6348",
      "--focus-ring": "#1C6348",
      "--focus-ring-gap": "#FFFFFF"
    },
    "dark": {
      "--accent": "#87D7B3",
      "--accent-hover": "#A7E7C9",
      "--accent-active": "#6DC39D",
      "--on-accent": "#09251A",
      "--accent-text": "#87D7B3",
      "--accent-surface": "#182D25",
      "--on-accent-surface": "#87D7B3",
      "--accent-border": "#87D7B3",
      "--focus-ring": "#87D7B3",
      "--focus-ring-gap": "#0B0B0D"
    }
  }
]);
export const DENSITIES = Object.freeze([
  {
    "id": "compact",
    "name_uk": "Компактно",
    "metrics": {
      "body_font_rem": 1,
      "secondary_font_rem": 0.875,
      "body_line_height": 1.5,
      "button_label_rem": 1,
      "control_min_height_px": 44,
      "icon_button_min_target_px": 44,
      "functional_icon_px": 24,
      "list_row_min_height_px": 56,
      "panel_padding_px": 12,
      "item_gap_px": 8,
      "section_gap_px": 20,
      "desktop_navigation_width_px": 216,
      "desktop_detail_panel_preferred_width_px": 360,
      "content_max_width_px": 1120
    },
    "proposal": {
      "copy_uk": "Хочеш бачити більше карток на екрані?"
    }
  },
  {
    "id": "comfortable",
    "name_uk": "Комфортно",
    "metrics": {
      "body_font_rem": 1,
      "secondary_font_rem": 0.875,
      "body_line_height": 1.5,
      "button_label_rem": 1,
      "control_min_height_px": 48,
      "icon_button_min_target_px": 48,
      "functional_icon_px": 24,
      "list_row_min_height_px": 64,
      "panel_padding_px": 20,
      "item_gap_px": 12,
      "section_gap_px": 28,
      "desktop_navigation_width_px": 240,
      "desktop_detail_panel_preferred_width_px": 400,
      "content_max_width_px": 1200
    },
    "proposal": {
      "copy_uk": "Додати більше простору між елементами?"
    }
  },
  {
    "id": "large",
    "name_uk": "Збільшено",
    "metrics": {
      "body_font_rem": 1.125,
      "secondary_font_rem": 1,
      "body_line_height": 1.5,
      "button_label_rem": 1.125,
      "control_min_height_px": 56,
      "icon_button_min_target_px": 56,
      "functional_icon_px": 28,
      "list_row_min_height_px": 80,
      "panel_padding_px": 24,
      "item_gap_px": 16,
      "section_gap_px": 32,
      "desktop_navigation_width_px": 272,
      "desktop_detail_panel_preferred_width_px": 448,
      "content_max_width_px": 1280
    },
    "proposal": {
      "copy_uk": "Зробити текст і кнопки більшими всюди?"
    }
  }
]);
export const HINTS = Object.freeze([
  {
    "id": "welcome",
    "uk": "Знайди людей, з якими твоя справа стане сильнішою.",
    "de": "Finde Menschen, mit denen dein Geschäft weiterkommt.",
    "en": "Find people who can help your business grow."
  },
  {
    "id": "exchange",
    "uk": "Напиши, чим можеш допомогти й що потрібно тобі.",
    "de": "Beschreibe, was du anbieten kannst und was du brauchst.",
    "en": "Describe what you can offer and what you need."
  },
  {
    "id": "location",
    "uk": "Почни з Цюриха або обери інше місце роботи.",
    "de": "Starte in Zürich oder wähle einen anderen Arbeitsort.",
    "en": "Start with Zurich or choose another work location."
  },
  {
    "id": "match_reason",
    "uk": "Тут видно, що ви можете дати одне одному.",
    "de": "Hier siehst du, was ihr einander bieten könnt.",
    "en": "See what you could offer each other."
  },
  {
    "id": "save",
    "uk": "Збережи профіль, щоб повернутися до нього пізніше.",
    "de": "Speichere das Profil, um später darauf zurückzukommen.",
    "en": "Save this profile to return to it later."
  },
  {
    "id": "navigation",
    "uk": "Люди, збережені профілі й твій профіль — в основній навігації.",
    "de": "Menschen, gespeicherte Profile und dein Profil findest du im Hauptmenü.",
    "en": "Find people, saved profiles and your profile in the main navigation."
  },
  {
    "id": "invitation",
    "uk": "Запропонуй конкретний обмін: що даєш і що хочеш отримати.",
    "de": "Schlage einen konkreten Austausch vor: Was bietest du, was brauchst du?",
    "en": "Suggest a specific exchange: what can you offer, and what do you need?"
  },
  {
    "id": "send",
    "uk": "Перевір пропозицію. Вона піде лише після натискання «Надіслати».",
    "de": "Prüfe deinen Vorschlag. Er wird erst mit «Senden» verschickt.",
    "en": "Review your proposal. It is sent only when you select Send."
  },
  {
    "id": "interaction_preference",
    "uk": "Обери зручний формат спілкування або залиш «Без переваги».",
    "de": "Wähle deine Kontaktart oder bleibe bei «Keine Präferenz».",
    "en": "Choose how you prefer to connect, or keep No preference."
  },
  {
    "id": "visibility",
    "uk": "Обери, хто бачить це поле. Доступ можна змінити будь-коли.",
    "de": "Wähle, wer dieses Feld sieht. Du kannst den Zugriff jederzeit ändern.",
    "en": "Choose who sees this field. You can change access at any time."
  },
  {
    "id": "matching_permission",
    "uk": "Додаткові дані для підбору — лише за твоїм дозволом.",
    "de": "Zusätzliche Angaben werden nur mit deiner Zustimmung für Vorschläge genutzt.",
    "en": "Extra details are used for matching only with your permission."
  },
  {
    "id": "appearance",
    "uk": "Обери акцент для себе. Усі кольори доступні кожному.",
    "de": "Wähle deinen Akzent. Alle Farben stehen allen offen.",
    "en": "Choose your accent. Every colour is available to everyone."
  },
  {
    "id": "density",
    "uk": "Спробуй інший розмір. Попередній можна повернути будь-коли.",
    "de": "Teste eine andere Grösse. Du kannst jederzeit zurückwechseln.",
    "en": "Try another size. You can return to your previous choice at any time."
  },
  {
    "id": "adaptive_permission",
    "uk": "Дозволь локальні підказки вигляду або налаштовуй усе вручну.",
    "de": "Erlaube lokale Designvorschläge oder passe alles selbst an.",
    "en": "Allow local appearance suggestions, or adjust everything yourself."
  },
  {
    "id": "reset",
    "uk": "Скидання вигляду не змінить твій профіль і дозволи.",
    "de": "Das Zurücksetzen des Designs ändert weder dein Profil noch Freigaben.",
    "en": "Resetting appearance keeps your profile and permissions unchanged."
  },
  {
    "id": "install",
    "uk": "Додай Synera на головний екран, щоб відкривати швидше.",
    "de": "Füge Synera zum Startbildschirm hinzu, um schneller loszulegen.",
    "en": "Add Synera to your home screen for quicker access."
  },
  {
    "id": "install_ios",
    "uk": "У Safari: «Поширити» → «Додати на початковий екран».",
    "de": "In Safari: «Teilen» → «Zum Home-Bildschirm».",
    "en": "In Safari: Share → Add to Home Screen."
  }
]);
