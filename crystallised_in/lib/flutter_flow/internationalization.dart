import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _kLocaleStorageKey = '__locale_key__';

class FFLocalizations {
  FFLocalizations(this.locale);

  final Locale locale;

  static FFLocalizations of(BuildContext context) =>
      Localizations.of<FFLocalizations>(context, FFLocalizations)!;

  static List<String> languages() => ['en', 'uk'];

  static late SharedPreferences _prefs;
  static Future initialize() async =>
      _prefs = await SharedPreferences.getInstance();
  static Future storeLocale(String locale) =>
      _prefs.setString(_kLocaleStorageKey, locale);
  static Locale? getStoredLocale() {
    final locale = _prefs.getString(_kLocaleStorageKey);
    return locale != null && locale.isNotEmpty ? createLocale(locale) : null;
  }

  String get languageCode => locale.toString();
  String? get languageShortCode =>
      _languagesWithShortCode.contains(locale.toString())
          ? '${locale.toString()}_short'
          : null;
  int get languageIndex => languages().contains(languageCode)
      ? languages().indexOf(languageCode)
      : 0;

  String getText(String key) =>
      (kTranslationsMap[key] ?? {})[locale.toString()] ?? '';

  String getVariableText({
    String? enText = '',
    String? ukText = '',
  }) =>
      [enText, ukText][languageIndex] ?? '';

  static const Set<String> _languagesWithShortCode = {
    'ar',
    'az',
    'ca',
    'cs',
    'da',
    'de',
    'dv',
    'en',
    'es',
    'et',
    'fi',
    'fr',
    'gr',
    'he',
    'hi',
    'hu',
    'it',
    'km',
    'ku',
    'mn',
    'ms',
    'no',
    'pt',
    'ro',
    'ru',
    'rw',
    'sv',
    'th',
    'uk',
    'vi',
  };
}

class FFLocalizationsDelegate extends LocalizationsDelegate<FFLocalizations> {
  const FFLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    final language = locale.toString();
    return FFLocalizations.languages().contains(
      language.endsWith('_')
          ? language.substring(0, language.length - 1)
          : language,
    );
  }

  @override
  Future<FFLocalizations> load(Locale locale) =>
      SynchronousFuture<FFLocalizations>(FFLocalizations(locale));

  @override
  bool shouldReload(FFLocalizationsDelegate old) => false;
}

Locale createLocale(String language) => language.contains('_')
    ? Locale.fromSubtags(
        languageCode: language.split('_').first,
        scriptCode: language.split('_').last,
      )
    : Locale(language);

final kTranslationsMap = <Map<String, Map<String, String>>>[
  // Authentication
  {
    '0fvgbe71': {
      'en': 'Create Account',
      'uk': 'Створити акаунт',
    },
    '192rdgup': {
      'en': 'Create Account',
      'uk': 'Створити акаунт',
    },
    'g21pbe7x': {
      'en': 'Let\'s get started by filling out the form below.',
      'uk': 'Давайте почнемо, заповнивши форму нижче.',
    },
    'vegenue4': {
      'en': 'Email',
      'uk': 'Електронна пошта',
    },
    '6uirvsc8': {
      'en': 'Password',
      'uk': 'Пароль',
    },
    '127c8ozz': {
      'en': 'Confirm Password',
      'uk': 'Підтвердьте пароль',
    },
    '9truviu3': {
      'en': 'Continue ',
      'uk': 'Продовжити',
    },
    '92j4icsp': {
      'en': 'Or use a Google aaccount to register',
      'uk': 'Або скористайтеся обліковим записом Google для реєстрації',
    },
    'iyw4vz8m': {
      'en': 'Create Acccount with Google',
      'uk': 'Створіть обліковий запис Google',
    },
    'wmyk1hkk': {
      'en': 'Log In',
      'uk': 'Увійти',
    },
    '0h9jwfsg': {
      'en': 'Welcome Back',
      'uk': 'Ласкаво просимо назад',
    },
    'alswh420': {
      'en': 'Fill out the information below in order to access your account.',
      'uk':
          'Заповніть інформацію нижче, щоб отримати доступ до свого облікового запису.',
    },
    'x4twh6pa': {
      'en': 'Email',
      'uk': 'Електронна пошта',
    },
    't0eja9xe': {
      'en': 'Password',
      'uk': 'Пароль',
    },
    'xea8gf5e': {
      'en': 'Login to Account',
      'uk': 'Увійти в обліковий запис',
    },
    '8fnf9jcl': {
      'en': 'Or use a Google aaccount to register',
      'uk': 'Або скористайтеся обліковим записом Google для реєстрації',
    },
    'mzwhe219': {
      'en': 'Login with Google',
      'uk': 'Увійдіть через Google',
    },
    'jt96dxfa': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // AboutMe
  {
    'j70adu9t': {
      'en': 'Record About Me',
      'uk': 'Запис про мене',
    },
    'z7vhr95x': {
      'en': 'About Me',
      'uk': 'Про мене',
    },
    '1fg4d90a': {
      'en': 'Finish Account',
      'uk': 'Завершити обліковий запис',
    },
    'ubk080ai': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // ProfilePhoto
  {
    '7vbr7zfi': {
      'en': 'Add Photo',
      'uk': 'Додати фото',
    },
    'g1jyctfd': {
      'en': 'Save and Continue ',
      'uk': 'Зберегти та продовжити',
    },
    'hctuqd18': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // MapPage
  {
    'epg54x6r': {
      'en': 'Map',
      'uk': 'Карта',
    },
  },
  // NotePage
  {
    '9fz9c52f': {
      'en': 'Date and Time',
      'uk': 'Дата і час',
    },
    'y8e0xts7': {
      'en': 'Participants',
      'uk': 'Учасники',
    },
    'ell6bmnh': {
      'en': 'Key Points',
      'uk': 'Ключові моменти',
    },
    'o3zh6oih': {
      'en': 'Actions',
      'uk': 'Дії',
    },
    'wlua1sap': {
      'en': 'Notes',
      'uk': 'Примітки',
    },
    '7mbrdysi': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // DiariesPage
  {
    '7wcmro10': {
      'en': 'Diaries',
      'uk': 'Щоденники',
    },
    'myhkutmf': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // UserFeedbackPage
  {
    'ar6hticz': {
      'en': 'Level:',
      'uk': 'рівень:',
    },
    'bcvkcc41': {
      'en': '25',
      'uk': '25',
    },
    '52gd7le1': {
      'en': '21',
      'uk': '21',
    },
    'e6ovmvhl': {
      'en': '35',
      'uk': '35',
    },
    'sspf67cb': {
      'en': '9',
      'uk': '9',
    },
    '6wibdyyp': {
      'en': 'Meetings',
      'uk': 'Зустрічі',
    },
    'qa056ro9': {
      'en': 'Friends',
      'uk': 'друзі',
    },
    '5gqwm5v7': {
      'en': 'Reviews',
      'uk': 'Відгуки',
    },
    '3qlwarsl': {
      'en': 'Randy Alcorn',
      'uk': 'Ренді Алкорн',
    },
    '17uhdut2': {
      'en':
          'I\'m not really sure about this section here aI think you should do soemthing cool!',
      'uk':
          'Я не дуже впевнений щодо цього розділу, але я думаю, що ви повинні зробити щось круте!',
    },
    'eney7zyi': {
      'en': 'a min ago',
      'uk': 'хвилину тому',
    },
    'rb0ci74y': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // ProfilePrivatePage
  {
    'rpr6nsjx': {
      'en': 'Musician DJ',
      'uk': 'Музикант DJ',
    },
    'rlcw1jwk': {
      'en': 'Feelings',
      'uk': 'Почуття',
    },
    'hj2unzn3': {
      'en': 'Sport',
      'uk': 'спорт',
    },
    'itsgnyuh': {
      'en': 'About Me',
      'uk': 'Про мене',
    },
    'qe4zyluf': {
      'en': 'See All',
      'uk': 'Переглянути всі',
    },
    'b17aryjn': {
      'en': '21',
      'uk': '21',
    },
    'jlrnl9gy': {
      'en': 'Meetings',
      'uk': 'Зустрічі',
    },
    's0wdwu0s': {
      'en': '35',
      'uk': '35',
    },
    'p502doy4': {
      'en': 'Friends',
      'uk': 'друзі',
    },
    'etzv8cad': {
      'en': '17',
      'uk': '17',
    },
    'fcmmtscz': {
      'en': 'Reviews',
      'uk': 'Відгуки',
    },
    'rfcsijyy': {
      'en': 'Level',
      'uk': 'Рівень',
    },
    'ak1pcn9t': {
      'en': '25',
      'uk': '25',
    },
    'if8v5b1a': {
      'en': 'All Photos',
      'uk': 'Всі фото',
    },
    'm7wz9819': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // PhotosPrivatePage
  {
    'upofrbsd': {
      'en': 'Photos',
      'uk': 'Фотографії',
    },
    'kp61p9ma': {
      'en': 'Add Photo',
      'uk': 'Додати фото',
    },
    'bni336w0': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // OptimizerPage
  {
    'mv3du6dw': {
      'en': 'Optimizer',
      'uk': 'Оптимізатор',
    },
    'e1kecoue': {
      'en': 'Analysis',
      'uk': 'Аналіз',
    },
    'xyrtbsuk': {
      'en': 'Diaries',
      'uk': 'Щоденники',
    },
    'yzg0xtx1': {
      'en': 'Family',
      'uk': 'Сім\'я',
    },
    '4q89ccyr': {
      'en': 'Intellect',
      'uk': 'Інтелект',
    },
    'kz9nmlpe': {
      'en': 'Emotions',
      'uk': 'емоції',
    },
    '0jyhhdy9': {
      'en': 'Love',
      'uk': 'кохання',
    },
    'nek0bafl': {
      'en': 'Finances',
      'uk': 'Фінанси',
    },
    'er5qra6e': {
      'en': 'Health',
      'uk': 'Здоров\'я',
    },
    'fu6ld9mf': {
      'en': 'Networking',
      'uk': 'Мережа',
    },
    'l2xt9xu8': {
      'en': 'Drive&Chill',
      'uk': 'Drive&Chill',
    },
    'yhgjl3bj': {
      'en': 'Spirit',
      'uk': 'Дух',
    },
    'rewz9oin': {
      'en': 'Character',
      'uk': 'характер',
    },
    'x521n1ua': {
      'en': 'Business',
      'uk': 'Бізнес',
    },
    '6o4p91l7': {
      'en': 'Balance',
      'uk': 'Баланс',
    },
    'zsp3tayv': {
      'en': '50%',
      'uk': '50%',
    },
    'qeqs9yyh': {
      'en': '74',
      'uk': '74',
    },
    'n7lz6j6o': {
      'en': '%',
      'uk': '%',
    },
    'pero3345': {
      'en': 'Family',
      'uk': 'Сім\'я',
    },
    'zlku924f': {
      'en': '50%',
      'uk': '50%',
    },
    'zxu777mv': {
      'en': 'Intellect',
      'uk': 'Інтелект',
    },
    'bgxitx8w': {
      'en': '50%',
      'uk': '50%',
    },
    'h1hos9ma': {
      'en': 'Emotions',
      'uk': 'емоції',
    },
    'fn3lkdsg': {
      'en': '50%',
      'uk': '50%',
    },
    'k2hdwccq': {
      'en': 'Love',
      'uk': 'кохання',
    },
    's2n513h8': {
      'en': '50%',
      'uk': '50%',
    },
    'bmd14b7q': {
      'en': 'Finances',
      'uk': 'Фінанси',
    },
    'hus5dz6t': {
      'en': '50%',
      'uk': '50%',
    },
    '5npibmnp': {
      'en': 'Networking',
      'uk': 'Мережа',
    },
    '0mc1az4q': {
      'en': '50%',
      'uk': '50%',
    },
    'e875iutp': {
      'en': 'Dirve&Chill',
      'uk': 'Dirve&Chill',
    },
    'g9rhqbox': {
      'en': '50%',
      'uk': '50%',
    },
    'wm0dvbak': {
      'en': 'Spirit',
      'uk': 'Дух',
    },
    'acjkl9r1': {
      'en': '50%',
      'uk': '50%',
    },
    'dpwldpr0': {
      'en': 'Character',
      'uk': 'характер',
    },
    '7hgt606u': {
      'en': '50%',
      'uk': '50%',
    },
    '2f3t7bdc': {
      'en': 'Business',
      'uk': 'Бізнес',
    },
    '4evei10a': {
      'en': '50%',
      'uk': '50%',
    },
    'txz16fy4': {
      'en': 'Balance',
      'uk': 'Баланс',
    },
    'nz0onvas': {
      'en': '50%',
      'uk': '50%',
    },
    'cmld88lh': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // MeetingRequestPage
  {
    'ykcex5ce': {
      'en': 'Meeting Request',
      'uk': 'Заявка на зустріч',
    },
    'fnfax1ru': {
      'en': '\"Every meeting is a new opportunity\"',
      'uk': '«Кожна зустріч — це нова можливість»',
    },
    'itwi8z3q': {
      'en': 'Here write location....',
      'uk': 'Тут напишіть місце розташування....',
    },
    'j3hvmwhz': {
      'en': 'Here write custom message if you wont.....',
      'uk': 'Тут напишіть власне повідомлення, якщо хочете...',
    },
    '94ur81al': {
      'en': 'Invite for Meeting',
      'uk': 'Запросити на зустріч',
    },
    'o9ypzc3u': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // MeetingsManagmentPage
  {
    'f1epxbdw': {
      'en': 'Meeting Menagment',
      'uk': 'Менеджмент зустрічі',
    },
    'd47wafgo': {
      'en': 'Sent',
      'uk': 'Надіслано',
    },
    'eo3hcwcy': {
      'en': 'Requests',
      'uk': 'Запити',
    },
    'jjnoxmhc': {
      'en': 'Recived',
      'uk': 'Отримав',
    },
    'di7c7u76': {
      'en': 'Requests',
      'uk': 'Запити',
    },
    '5a0fspk6': {
      'en': 'Booked',
      'uk': 'Заброньовано',
    },
    'irdddj3o': {
      'en': 'Meetings',
      'uk': 'Зустрічі',
    },
    'fonpw9rt': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // PotnentialMutualBenifitsPage
  {
    'mavgsjz8': {
      'en': 'Potential Mutual Benifits',
      'uk': 'Потенційні взаємні вигоди',
    },
    'vy5tld6n': {
      'en': 'AI',
      'uk': 'ШІ',
    },
    'aav3wlu4': {
      'en': 'GENERATE',
      'uk': 'ГЕНЕРУВАТИ',
    },
    'fxkdj1hj': {
      'en': 'Collaboration Overview',
      'uk': 'Огляд співпраці',
    },
    'uoau2tp9': {
      'en': 'Continue to Book a Meet',
      'uk': 'Продовжуйте бронювати зустріч',
    },
    'c3v57bma': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // ProfilePublicPage
  {
    '1t8cldib': {
      'en': 'Musician DJ',
      'uk': 'Музикант діджей',
    },
    'n72oq4n3': {
      'en': 'Feeling/Self',
      'uk': 'Відчуття/Я',
    },
    'y3i61vj2': {
      'en': 'Music,Sports',
      'uk': 'Музика, Спорт',
    },
    'lsjlluzn': {
      'en': 'About Me',
      'uk': 'Про мене',
    },
    'w6easas6': {
      'en': 'See All',
      'uk': 'Переглянути всі',
    },
    '9w3qybre': {
      'en': 'Meeting with ',
      'uk': 'Зустріч с',
    },
    '8o1un3d0': {
      'en': '21',
      'uk': '21',
    },
    '0pee6t3e': {
      'en': 'Meetings',
      'uk': 'Зустрічі',
    },
    '2voyzv9q': {
      'en': '35',
      'uk': '35',
    },
    'kml4cf9d': {
      'en': 'Friends',
      'uk': 'друзі',
    },
    'xrejmpl0': {
      'en': '17',
      'uk': '17',
    },
    '27fevnco': {
      'en': 'Reviews',
      'uk': 'Відгуки',
    },
    'dcegbfk3': {
      'en': 'Level',
      'uk': 'Рівень',
    },
    'x1o8q32r': {
      'en': '25',
      'uk': '25',
    },
    'osz4fkk3': {
      'en': 'All Photos',
      'uk': 'Всі фото',
    },
    '748u0mw9': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // PhotosPublicPage
  {
    'e049g88n': {
      'en': 'Photos',
      'uk': 'Фотографії',
    },
    'k724qdfa': {
      'en': 'Photos',
      'uk': 'Фотографії',
    },
    'cw6lvk8i': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // RecordPage
  {
    's9j308tv': {
      'en': 'Record',
      'uk': 'запис',
    },
    'xvddjbff': {
      'en': 'Values',
      'uk': 'Цінності',
    },
    'gawloz0g': {
      'en': 'Notes',
      'uk': 'Примітки',
    },
    '3ts24nes': {
      'en': 'GPT',
      'uk': 'GPT',
    },
    'x76hp2ct': {
      'en':
          'Click on microphone record yourself and AI will automaticly generate your Give/Take example',
      'uk':
          'Клацніть запис мікрофона самостійно, і AI автоматично згенерує ваш приклад',
    },
    'jv3zrvu9': {
      'en':
          'Click on microphone record yourself and AI will automaticly generate your Give/Take example',
      'uk':
          'Клацніть запис мікрофона самостійно, і AI автоматично згенерує ваш приклад',
    },
    'se6budry': {
      'en': 'Home',
      'uk': 'додому',
    },
  },
  // BootomNavigationComponent
  {
    '0h8odf1l': {
      'en': '',
      'uk': '',
    },
    'jg9jln8l': {
      'en': '',
      'uk': '',
    },
  },
  // PotentialMutualBenefitComponent
  {
    '07n8z1z2': {
      'en': 'Potential mutual benefit',
      'uk': 'Потенційна взаємна вигода',
    },
    'v4z3mxnm': {
      'en': 'Close',
      'uk': 'Закрити',
    },
    'on4eqk6a': {
      'en': 'Select context',
      'uk': 'Виберіть контекст',
    },
  },
  // InfoDialogSphereOfLife
  {
    'efjvis5u': {
      'en': 'Profile',
      'uk': 'Профіль',
    },
    '1439ceip': {
      'en': 'Meeting',
      'uk': 'Зустріч',
    },
  },
  // WalkthoughtGMap1
  {
    'taribs85': {
      'en': 'Filter users by Give/Take life spheres.',
      'uk': 'Фільтруйте користувачів за життєвими сферами.',
    },
  },
  // WalkthoughtGMap2
  {
    'kv7f6gkr': {
      'en':
          'Create entries in 12 diaries or set Give/Take values to find like-minded people.',
      'uk':
          'Створюйте записи в 12 щоденниках або встановлюйте значення Give/Take, щоб знайти однодумців.',
    },
  },
  // WalkthoughtOptimizerPage1
  {
    '0dsbn9wz': {
      'en':
          'An opportunity to develop skills in managing twelve different areas',
      'uk':
          'Можливість розвинути навички управління дванадцятьма різними сферами',
    },
  },
  // WalkthoughtOptimizerPage2
  {
    't46x2tiq': {
      'en':
          'Average percentage deviation from the mean number of entries in one of the 12 journals',
      'uk':
          'Середнє процентне відхилення від середньої кількості записів в одному з 12 журналів',
    },
  },
  // WalkthoughtOptimizerPage2Copy
  {
    'uxx2zu4i': {
      'en': 'But what is here,bro???',
      'uk': 'Але що тут, брате???',
    },
  },
  // DiariesItem
  {
    'qypbvm5f': {
      'en': 'Title',
      'uk': 'Назва',
    },
  },
  // SentRequestsComponent
  {
    'gqsumi2j': {
      'en': 'Some Titile',
      'uk': 'Деякі Title',
    },
    'vpivtgrh': {
      'en': 'Cancel',
      'uk': 'Скасувати',
    },
  },
  // ResivedRequestsComponent
  {
    'ynunklli': {
      'en': 'Some Titile',
      'uk': 'Деякі Title',
    },
    'qmsvj9ij': {
      'en': 'Cancel',
      'uk': 'Скасувати',
    },
    'myllfr5g': {
      'en': 'Accept',
      'uk': 'прийняти',
    },
  },
  // BookedMeetingsComponent
  {
    'ee15277b': {
      'en': 'Some Titile',
      'uk': 'Деякі Title',
    },
    '1544hdch': {
      'en': 'Cancel',
      'uk': 'Скасувати',
    },
  },
  // Match
  {
    'oywy535n': {
      'en': 'Match',
      'uk': 'Матч',
    },
    'orzub5kr': {
      'en': '%',
      'uk': '%',
    },
  },
  // NewDesignSpheresFilter
  {
    'lex4dzuh': {
      'en': 'on List',
      'uk': 'у списку',
    },
    'nv0pgb83': {
      'en': 'Map',
      'uk': 'Карта',
    },
    'd2ib56mg': {
      'en': 'Map',
      'uk': 'Карта',
    },
    '2laxtjfs': {
      'en': 'on List',
      'uk': 'у списку',
    },
    'zt7hemkq': {
      'en': 'I Give',
      'uk': 'Я даю',
    },
    '0f5s986y': {
      'en': 'Intellect',
      'uk': 'Інтелект',
    },
    'lekyp58m': {
      'en': 'Health',
      'uk': 'Здоров\'я',
    },
    'lal82xgk': {
      'en': 'Career',
      'uk': 'Кар\'єра',
    },
    'azokhie9': {
      'en': 'Balance',
      'uk': 'Баланс',
    },
    'xqt0l0p0': {
      'en': 'Love',
      'uk': 'кохання',
    },
    'sozo1m9n': {
      'en': 'Character',
      'uk': 'характер',
    },
    'h31uxo0g': {
      'en': 'Family',
      'uk': 'Сім\'я',
    },
    '4keeafi1': {
      'en': 'Drive&Chill',
      'uk': 'Drive&Chill',
    },
    'ds6ju2bb': {
      'en': 'Networking',
      'uk': 'Мережа',
    },
    '9x4yue00': {
      'en': 'Emotions',
      'uk': 'емоції',
    },
    'u63ycljh': {
      'en': 'Spirit',
      'uk': 'Дух',
    },
    '2iadqlz8': {
      'en': 'Finances',
      'uk': 'Фінанси',
    },
    'eupcknbb': {
      'en': 'I Take',
      'uk': 'Я беру',
    },
    'p588bnya': {
      'en': 'Love',
      'uk': 'кохання',
    },
    'ymadzg24': {
      'en': 'Character',
      'uk': 'характер',
    },
    'stzys0d3': {
      'en': 'Family',
      'uk': 'Сім\'я',
    },
    '5mq75fe3': {
      'en': 'Drive&Chill',
      'uk': 'Drive&Chill',
    },
    'hkjax50q': {
      'en': 'Networking',
      'uk': 'Мережа',
    },
    'is34800s': {
      'en': 'Emotions',
      'uk': 'емоції',
    },
    '8s2btnvn': {
      'en': 'Spirit',
      'uk': 'Дух',
    },
    'uqgpdjad': {
      'en': 'Finances',
      'uk': 'Фінанси',
    },
    '2pqtglvu': {
      'en': 'Intellect',
      'uk': 'Інтелект',
    },
    'f9x5u104': {
      'en': 'Health',
      'uk': 'Здоров\'я',
    },
    'u3r2t3lk': {
      'en': 'Career',
      'uk': 'Кар\'єра',
    },
    'w25ko5v9': {
      'en': 'Balance',
      'uk': 'Баланс',
    },
  },
  // OnMarkerClickNewDesign
  {
    'brt5jded': {
      'en': 'Optimizer',
      'uk': 'Оптимізатор',
    },
    '74xfskua': {
      'en': 'I Take',
      'uk': 'Я беру',
    },
    'gwi6pibt': {
      'en': 'Match',
      'uk': 'Матч',
    },
    '291f3jkr': {
      'en': '33',
      'uk': '33',
    },
    'l7mj3b6m': {
      'en': '%',
      'uk': '%',
    },
    's42cgh74': {
      'en': 'I Give',
      'uk': 'Я даю',
    },
    't02cz3tq': {
      'en': 'Musician DJ',
      'uk': 'Музикант DJ',
    },
    '257f0aao': {
      'en': 'Traveling',
      'uk': 'Подорожі',
    },
    'cb9vs6uc': {
      'en': 'ISFP-A',
      'uk': 'ISFP-A',
    },
    'ed1lenmo': {
      'en': 'I\'ll take what\'s worthy, amplify it, and give it back stronger',
      'uk': 'Я візьму те, що гідне, посилю це і поверну сильніше',
    },
    'ncdqt6xr': {
      'en': 'Optimizer',
      'uk': 'Оптимізатор',
    },
    'yri1btcu': {
      'en': 'I Take',
      'uk': 'Я беру',
    },
    'a0cbhy52': {
      'en': 'Match',
      'uk': 'Матч',
    },
    '9xkiet9r': {
      'en': '61',
      'uk': '61',
    },
    '8oacomh3': {
      'en': '%',
      'uk': '%',
    },
    '1mz02cbm': {
      'en': 'I Give',
      'uk': 'Я даю',
    },
    'tgtiusb2': {
      'en': 'Musician DJ',
      'uk': 'Музикант DJ',
    },
    '34w32wsl': {
      'en': 'Traveling',
      'uk': 'Подорожі',
    },
    'arcbcm6v': {
      'en': 'ISFP-A',
      'uk': 'ISFP-A',
    },
    'ozfxl35x': {
      'en': 'I\'ll give my best to inspire and empower',
      'uk': 'Я докладу всіх зусиль, щоб надихати та надавати сили',
    },
  },
  // GMapValuesTable
  {
    'dgj6bf0i': {
      'en': 'I Take',
      'uk': 'Я беру',
    },
    '29dz3v65': {
      'en': 'I Give',
      'uk': 'Я даю',
    },
    'v4pjtxfs': {
      'en': '',
      'uk': '',
    },
    'w97hkeww': {
      'en': 'I Take',
      'uk': 'Я беру',
    },
    'amie6gsl': {
      'en': 'I Give',
      'uk': 'Я даю',
    },
    '4klml6j7': {
      'en': '',
      'uk': '',
    },
  },
  // NewDesignPotencialBenefitsGmapTable
  {
    'smsa2ibu': {
      'en': 'Potential Mutual Benifits',
      'uk': 'Потенційні взаємні вигоди',
    },
    'xv3vc162': {
      'en': 'AI',
      'uk': 'ШІ',
    },
    'aavwidca': {
      'en': '',
      'uk': '',
    },
  },
  // Miscellaneous
  {
    '6ygvn8j6': {
      'en': 'Please allow microphone to record',
      'uk': 'Будь ласка, дозвольте мікрофон для запису',
    },
    '85wb2r6s': {
      'en': 'This is Notification',
      'uk': 'Це сповіщення',
    },
    '627hazx6': {
      'en': '',
      'uk': '',
    },
    'pqvz341f': {
      'en': '',
      'uk': '',
    },
    'cokygvky': {
      'en': '',
      'uk': '',
    },
    '6szq10ra': {
      'en': '',
      'uk': '',
    },
    'g617bj7m': {
      'en': '',
      'uk': '',
    },
    'fo6k12vo': {
      'en': '',
      'uk': '',
    },
    'q7bs8jj1': {
      'en': '',
      'uk': '',
    },
    '3rcil826': {
      'en': '',
      'uk': '',
    },
    'q22r3thn': {
      'en': '',
      'uk': '',
    },
    'jaja5y1p': {
      'en': '',
      'uk': '',
    },
    'cbesh5rh': {
      'en': '',
      'uk': '',
    },
    'wkfk58lv': {
      'en': '',
      'uk': '',
    },
    'ko7s3480': {
      'en': '',
      'uk': '',
    },
    '4dto49w7': {
      'en': '',
      'uk': '',
    },
    'wrlxzxdm': {
      'en': '',
      'uk': '',
    },
    'vkqpbbcj': {
      'en': '',
      'uk': '',
    },
    '1sxtua8z': {
      'en': '',
      'uk': '',
    },
    'qj7yuz3u': {
      'en': '',
      'uk': '',
    },
    'snupnsz6': {
      'en': '',
      'uk': '',
    },
    'zcuu7rtv': {
      'en': '',
      'uk': '',
    },
    'v4b07s1d': {
      'en': '',
      'uk': '',
    },
    'q2jti9tw': {
      'en': '',
      'uk': '',
    },
    '4sn87h2r': {
      'en': '',
      'uk': '',
    },
    'fkp38nxf': {
      'en': '',
      'uk': '',
    },
    'zdovmxi1': {
      'en': '',
      'uk': '',
    },
  },
].reduce((a, b) => a..addAll(b));
