/* ============================================================
   Tillar — o'zbek, rus, ingliz, xitoy
   ============================================================ */

export const LANGS = [
  { code: "uz", label: "O‘zbekcha", short: "UZ" },
  { code: "ru", label: "Русский",   short: "RU" },
  { code: "en", label: "English",   short: "EN" },
  { code: "zh", label: "中文",       short: "ZH" },
];

const MONTHS = {
  uz: ["Yanvar","Fevral","Mart","Aprel","May","Iyun","Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr"],
  ru: ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"],
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  zh: ["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
};

// Ruscha sanada oy kelishik shaklida bo'ladi: «10 сентября»
const MONTHS_GEN = {
  ru: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
};

const DAYS_SHORT = {
  uz: ["Du","Se","Ch","Pa","Ju","Sh","Ya"],
  ru: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
  en: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  zh: ["一","二","三","四","五","六","日"],
};

const DAYS_FULL = {
  uz: ["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba","Yakshanba"],
  ru: ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"],
  en: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
  zh: ["星期一","星期二","星期三","星期四","星期五","星期六","星期日"],
};

const DICT = {
  /* ---------------------------------------------------- UZ */
  uz: {
    "common.loading": "Yuklanmoqda…",
    "common.save": "Saqlash",
    "common.cancel": "Bekor qilish",
    "common.delete": "O‘chirish",
    "common.close": "Yopish",
    "common.copy": "Nusxa olish",
    "common.copied": "Nusxa olindi",
    "common.back": "Orqaga",
    "common.retry": "Qayta urinish",
    "common.optional": "ixtiyoriy",

    "nav.calendarView": "Taqvim",
    "nav.listView": "Ro‘yxat",
    "nav.today": "Bugun",
    "nav.prevMonth": "Oldingi oy",
    "nav.nextMonth": "Keyingi oy",
    "nav.export": "Kalendarga yuklash",
    "nav.signIn": "Parol bilan kirish",
    "nav.signOut": "Chiqish",
    "nav.admin": "Admin",
    "nav.history": "O‘zgarishlar tarixi",
    "nav.language": "Til",
    "nav.addEvent": "Tadbir qo‘shish",

    "auth.title": "Tahrirlash uchun parol",
    "auth.subtitle": "Parolni tadbir tashkilotchisidan oling. Ismingiz o‘zgarishlar tarixida ko‘rinadi.",
    "auth.codeLabel": "Parol",
    "auth.nameLabel": "Ismingiz",
    "auth.namePlaceholder": "Masalan, Akbar",
    "auth.submit": "Kirish",
    "auth.signedInAs": "{name} sifatida tahrirlayapsiz",
    "auth.errEmptyCode": "Parolni kiriting.",
    "auth.errEmptyName": "Ismingizni kiriting.",
    "auth.errNotFound": "Bunday parol yo‘q.",
    "auth.errUsed": "Bu parol allaqachon ishlatilgan — {name}.",
    "auth.errExpired": "Parol muddati tugagan — {date}.",
    "auth.welcome": "Xush kelibsiz, {name}",
    "auth.signedOut": "Chiqdingiz",

    "event.new": "Yangi tadbir",
    "event.edit": "Tadbirni tahrirlash",
    "event.fTitle": "Tadbir nomi",
    "event.fDesc": "Tavsif",
    "event.fStart": "Boshlanishi",
    "event.fEnd": "Tugashi",
    "event.fLocation": "Joyi",
    "event.fColor": "Rang",
    "event.deleteConfirm": "«{title}» o‘chirilsinmi? Buni qaytarib bo‘lmaydi.",
    "event.created": "Tadbir qo‘shildi",
    "event.updated": "Tadbir yangilandi",
    "event.deleted": "Tadbir o‘chirildi",
    "event.errTitle": "Tadbir nomini yozing.",
    "event.errStart": "Boshlanish vaqtini tanlang.",
    "event.errOrder": "Tugash vaqti boshlanishdan keyin bo‘lishi kerak.",
    "event.exportOne": "Shu tadbirni yuklash",
    "event.readOnly": "Ko‘rish uchun ochiq. Tahrirlash uchun parol kerak.",
    "event.by": "Qo‘shgan: {name}",

    "calendar.empty": "Bu oyda tadbir yo‘q.",
    "calendar.more": "yana {n} ta",

    "list.upcoming": "Kelayotgan tadbirlar",
    "list.past": "O‘tgan tadbirlar",
    "list.empty": "Hozircha tadbir qo‘shilmagan.",
    "list.emptyHint": "Birinchi tadbirni siz qo‘shing.",

    "audit.title": "O‘zgarishlar tarixi",
    "audit.empty": "Hali hech kim hech nima o‘zgartirmagan.",
    "audit.CREATE": "qo‘shdi",
    "audit.UPDATE": "o‘zgartirdi",
    "audit.DELETE": "o‘chirdi",
    "audit.noChanges": "o‘zgarish yo‘q",
    "audit.arrow": "→",
    "audit.empty_value": "bo‘sh",

    "field.title": "Nomi",
    "field.description": "Tavsif",
    "field.start_at": "Boshlanishi",
    "field.end_at": "Tugashi",
    "field.location": "Joyi",
    "field.color": "Rang",

    "admin.title": "Admin panel",
    "admin.loginTitle": "Admin paroli",
    "admin.passwordLabel": "Parol",
    "admin.enter": "Kirish",
    "admin.wrongPassword": "Parol noto‘g‘ri.",
    "admin.notConfigured": "Admin paroli sozlanmagan. config.js dagi ADMIN_PASSWORD_HASH ni to‘ldiring.",
    "admin.logout": "Chiqish",
    "admin.backToCalendar": "Taqvimga qaytish",

    "admin.tokensTitle": "Parollar",
    "admin.tokensDesc": "Har bir parol bir marta yoki belgilangan muddatgacha ishlaydi.",
    "admin.createToken": "Yangi parol",
    "admin.labelField": "Kim uchun",
    "admin.labelPlaceholder": "Masalan, Akbar — sentabr uchrashuvi",
    "admin.typeField": "Turi",
    "admin.typeSingle": "Bir martalik",
    "admin.typeTimed": "Muddatli",
    "admin.expiresField": "Amal qilish muddati",
    "admin.generate": "Parol yaratish",
    "admin.createdTitle": "Parol tayyor",
    "admin.createdWarn": "Bu parol faqat hozir ko‘rinadi. Nusxa olib, egasiga yuboring.",
    "admin.statusActive": "Faol",
    "admin.statusUsed": "Ishlatilgan",
    "admin.statusExpired": "Muddati tugagan",
    "admin.usedBy": "{name} — {date}",
    "admin.neverUsed": "Hali ishlatilmagan",
    "admin.deleteToken": "Parolni o‘chirish",
    "admin.deleteTokenConfirm": "«{label}» paroli o‘chirilsinmi?",
    "admin.noTokens": "Parol yaratilmagan.",
    "admin.tokenCreated": "Parol yaratildi",
    "admin.tokenDeleted": "Parol o‘chirildi",
    "admin.eventsTitle": "Barcha tadbirlar",
    "admin.noEvents": "Tadbir yo‘q.",
    "admin.logTitle": "To‘liq tarix",
    "admin.errLabel": "Kim uchun ekanini yozing.",
    "admin.errExpires": "Muddatni tanlang.",
    "admin.errExpiresPast": "Muddat kelajakda bo‘lishi kerak.",

    "err.gistNotConfigured": "GIST_ID sozlanmagan. config.js ni to‘ldiring.",
    "err.gistNotFound": "Gist topilmadi. GIST_ID ni tekshiring.",
    "err.rateLimit": "GitHub so‘rov chegarasi tugadi. Bir ozdan keyin urinib ko‘ring.",
    "err.readFailed": "Ma’lumot o‘qilmadi ({code}).",
    "err.writeNoToken": "Yozish uchun GitHub token sozlanmagan.",
    "err.tokenInvalid": "GitHub token yaroqsiz yoki muddati tugagan.",
    "err.tokenNoScope": "Tokenda gist huquqi yo‘q.",
    "err.saveFailed": "Saqlanmadi ({code}).",

    "time.justNow": "hozirgina",
    "time.minutes": "{n} daqiqa oldin",
    "time.hours": "{n} soat oldin",
    "time.days": "{n} kun oldin",

    "export.done": "{n} ta tadbir yuklandi",
    "export.nothing": "Yuklash uchun tadbir yo‘q.",
  },

  /* ---------------------------------------------------- RU */
  ru: {
    "common.loading": "Загрузка…",
    "common.save": "Сохранить",
    "common.cancel": "Отмена",
    "common.delete": "Удалить",
    "common.close": "Закрыть",
    "common.copy": "Копировать",
    "common.copied": "Скопировано",
    "common.back": "Назад",
    "common.retry": "Повторить",
    "common.optional": "необязательно",

    "nav.calendarView": "Календарь",
    "nav.listView": "Список",
    "nav.today": "Сегодня",
    "nav.prevMonth": "Предыдущий месяц",
    "nav.nextMonth": "Следующий месяц",
    "nav.export": "Скачать в календарь",
    "nav.signIn": "Войти по паролю",
    "nav.signOut": "Выйти",
    "nav.admin": "Админ",
    "nav.history": "История изменений",
    "nav.language": "Язык",
    "nav.addEvent": "Добавить событие",

    "auth.title": "Пароль для редактирования",
    "auth.subtitle": "Пароль выдаёт организатор. Ваше имя будет видно в истории изменений.",
    "auth.codeLabel": "Пароль",
    "auth.nameLabel": "Ваше имя",
    "auth.namePlaceholder": "Например, Акбар",
    "auth.submit": "Войти",
    "auth.signedInAs": "Вы редактируете как {name}",
    "auth.errEmptyCode": "Введите пароль.",
    "auth.errEmptyName": "Введите имя.",
    "auth.errNotFound": "Такого пароля нет.",
    "auth.errUsed": "Пароль уже использован — {name}.",
    "auth.errExpired": "Срок действия пароля истёк — {date}.",
    "auth.welcome": "Добро пожаловать, {name}",
    "auth.signedOut": "Вы вышли",

    "event.new": "Новое событие",
    "event.edit": "Изменить событие",
    "event.fTitle": "Название",
    "event.fDesc": "Описание",
    "event.fStart": "Начало",
    "event.fEnd": "Окончание",
    "event.fLocation": "Место",
    "event.fColor": "Цвет",
    "event.deleteConfirm": "Удалить «{title}»? Это нельзя отменить.",
    "event.created": "Событие добавлено",
    "event.updated": "Событие обновлено",
    "event.deleted": "Событие удалено",
    "event.errTitle": "Введите название события.",
    "event.errStart": "Укажите время начала.",
    "event.errOrder": "Окончание должно быть позже начала.",
    "event.exportOne": "Скачать это событие",
    "event.readOnly": "Открыто для просмотра. Для изменений нужен пароль.",
    "event.by": "Добавил: {name}",

    "calendar.empty": "В этом месяце событий нет.",
    "calendar.more": "ещё {n}",

    "list.upcoming": "Предстоящие события",
    "list.past": "Прошедшие события",
    "list.empty": "Событий пока нет.",
    "list.emptyHint": "Добавьте первое событие.",

    "audit.title": "История изменений",
    "audit.empty": "Пока никто ничего не менял.",
    "audit.CREATE": "добавил(а)",
    "audit.UPDATE": "изменил(а)",
    "audit.DELETE": "удалил(а)",
    "audit.noChanges": "без изменений",
    "audit.arrow": "→",
    "audit.empty_value": "пусто",

    "field.title": "Название",
    "field.description": "Описание",
    "field.start_at": "Начало",
    "field.end_at": "Окончание",
    "field.location": "Место",
    "field.color": "Цвет",

    "admin.title": "Панель администратора",
    "admin.loginTitle": "Пароль администратора",
    "admin.passwordLabel": "Пароль",
    "admin.enter": "Войти",
    "admin.wrongPassword": "Неверный пароль.",
    "admin.notConfigured": "Пароль администратора не задан. Заполните ADMIN_PASSWORD_HASH в config.js.",
    "admin.logout": "Выйти",
    "admin.backToCalendar": "К календарю",

    "admin.tokensTitle": "Пароли",
    "admin.tokensDesc": "Каждый пароль работает один раз или до указанного срока.",
    "admin.createToken": "Новый пароль",
    "admin.labelField": "Для кого",
    "admin.labelPlaceholder": "Например, Акбар — сентябрьская встреча",
    "admin.typeField": "Тип",
    "admin.typeSingle": "Одноразовый",
    "admin.typeTimed": "Со сроком",
    "admin.expiresField": "Действует до",
    "admin.generate": "Создать пароль",
    "admin.createdTitle": "Пароль готов",
    "admin.createdWarn": "Пароль показан только сейчас. Скопируйте и отправьте владельцу.",
    "admin.statusActive": "Активен",
    "admin.statusUsed": "Использован",
    "admin.statusExpired": "Истёк",
    "admin.usedBy": "{name} — {date}",
    "admin.neverUsed": "Ещё не использован",
    "admin.deleteToken": "Удалить пароль",
    "admin.deleteTokenConfirm": "Удалить пароль «{label}»?",
    "admin.noTokens": "Паролей нет.",
    "admin.tokenCreated": "Пароль создан",
    "admin.tokenDeleted": "Пароль удалён",
    "admin.eventsTitle": "Все события",
    "admin.noEvents": "Событий нет.",
    "admin.logTitle": "Полная история",
    "admin.errLabel": "Укажите, для кого пароль.",
    "admin.errExpires": "Укажите срок.",
    "admin.errExpiresPast": "Срок должен быть в будущем.",

    "err.gistNotConfigured": "GIST_ID не задан. Заполните config.js.",
    "err.gistNotFound": "Gist не найден. Проверьте GIST_ID.",
    "err.rateLimit": "Лимит запросов GitHub исчерпан. Попробуйте позже.",
    "err.readFailed": "Не удалось загрузить данные ({code}).",
    "err.writeNoToken": "Токен GitHub не задан.",
    "err.tokenInvalid": "Токен GitHub недействителен или истёк.",
    "err.tokenNoScope": "У токена нет прав на gist.",
    "err.saveFailed": "Не удалось сохранить ({code}).",

    "time.justNow": "только что",
    "time.minutes": "{n} мин назад",
    "time.hours": "{n} ч назад",
    "time.days": "{n} дн назад",

    "export.done": "Скачано событий: {n}",
    "export.nothing": "Нечего скачивать.",
  },

  /* ---------------------------------------------------- EN */
  en: {
    "common.loading": "Loading…",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.close": "Close",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.back": "Back",
    "common.retry": "Try again",
    "common.optional": "optional",

    "nav.calendarView": "Calendar",
    "nav.listView": "List",
    "nav.today": "Today",
    "nav.prevMonth": "Previous month",
    "nav.nextMonth": "Next month",
    "nav.export": "Add to calendar",
    "nav.signIn": "Sign in with password",
    "nav.signOut": "Sign out",
    "nav.admin": "Admin",
    "nav.history": "Change history",
    "nav.language": "Language",
    "nav.addEvent": "Add event",

    "auth.title": "Password to edit",
    "auth.subtitle": "Get a password from the organiser. Your name shows up in the change history.",
    "auth.codeLabel": "Password",
    "auth.nameLabel": "Your name",
    "auth.namePlaceholder": "e.g. Akbar",
    "auth.submit": "Sign in",
    "auth.signedInAs": "Editing as {name}",
    "auth.errEmptyCode": "Enter the password.",
    "auth.errEmptyName": "Enter your name.",
    "auth.errNotFound": "No such password.",
    "auth.errUsed": "This password was already used by {name}.",
    "auth.errExpired": "This password expired on {date}.",
    "auth.welcome": "Welcome, {name}",
    "auth.signedOut": "Signed out",

    "event.new": "New event",
    "event.edit": "Edit event",
    "event.fTitle": "Event name",
    "event.fDesc": "Description",
    "event.fStart": "Starts",
    "event.fEnd": "Ends",
    "event.fLocation": "Location",
    "event.fColor": "Colour",
    "event.deleteConfirm": "Delete “{title}”? This can't be undone.",
    "event.created": "Event added",
    "event.updated": "Event updated",
    "event.deleted": "Event deleted",
    "event.errTitle": "Enter an event name.",
    "event.errStart": "Pick a start time.",
    "event.errOrder": "The end time must come after the start.",
    "event.exportOne": "Download this event",
    "event.readOnly": "Open to view. A password is needed to edit.",
    "event.by": "Added by {name}",

    "calendar.empty": "No events this month.",
    "calendar.more": "{n} more",

    "list.upcoming": "Upcoming events",
    "list.past": "Past events",
    "list.empty": "No events yet.",
    "list.emptyHint": "Add the first one.",

    "audit.title": "Change history",
    "audit.empty": "Nobody has changed anything yet.",
    "audit.CREATE": "added",
    "audit.UPDATE": "changed",
    "audit.DELETE": "deleted",
    "audit.noChanges": "no changes",
    "audit.arrow": "→",
    "audit.empty_value": "empty",

    "field.title": "Name",
    "field.description": "Description",
    "field.start_at": "Starts",
    "field.end_at": "Ends",
    "field.location": "Location",
    "field.color": "Colour",

    "admin.title": "Admin panel",
    "admin.loginTitle": "Admin password",
    "admin.passwordLabel": "Password",
    "admin.enter": "Sign in",
    "admin.wrongPassword": "Wrong password.",
    "admin.notConfigured": "No admin password set. Fill in ADMIN_PASSWORD_HASH in config.js.",
    "admin.logout": "Sign out",
    "admin.backToCalendar": "Back to calendar",

    "admin.tokensTitle": "Passwords",
    "admin.tokensDesc": "Each password works once, or until the time you set.",
    "admin.createToken": "New password",
    "admin.labelField": "Who it's for",
    "admin.labelPlaceholder": "e.g. Akbar — September meetup",
    "admin.typeField": "Type",
    "admin.typeSingle": "One-time",
    "admin.typeTimed": "Time-limited",
    "admin.expiresField": "Works until",
    "admin.generate": "Create password",
    "admin.createdTitle": "Password ready",
    "admin.createdWarn": "This password is shown only now. Copy it and send it on.",
    "admin.statusActive": "Active",
    "admin.statusUsed": "Used",
    "admin.statusExpired": "Expired",
    "admin.usedBy": "{name} — {date}",
    "admin.neverUsed": "Not used yet",
    "admin.deleteToken": "Delete password",
    "admin.deleteTokenConfirm": "Delete the password “{label}”?",
    "admin.noTokens": "No passwords yet.",
    "admin.tokenCreated": "Password created",
    "admin.tokenDeleted": "Password deleted",
    "admin.eventsTitle": "All events",
    "admin.noEvents": "No events.",
    "admin.logTitle": "Full history",
    "admin.errLabel": "Say who the password is for.",
    "admin.errExpires": "Pick an expiry time.",
    "admin.errExpiresPast": "The expiry time must be in the future.",

    "err.gistNotConfigured": "GIST_ID is not set. Fill in config.js.",
    "err.gistNotFound": "Gist not found. Check GIST_ID.",
    "err.rateLimit": "GitHub rate limit reached. Try again shortly.",
    "err.readFailed": "Couldn't load data ({code}).",
    "err.writeNoToken": "No GitHub token set.",
    "err.tokenInvalid": "The GitHub token is invalid or expired.",
    "err.tokenNoScope": "The token has no gist permission.",
    "err.saveFailed": "Couldn't save ({code}).",

    "time.justNow": "just now",
    "time.minutes": "{n} min ago",
    "time.hours": "{n} h ago",
    "time.days": "{n} d ago",

    "export.done": "{n} events downloaded",
    "export.nothing": "Nothing to download.",
  },

  /* ---------------------------------------------------- ZH */
  zh: {
    "common.loading": "加载中…",
    "common.save": "保存",
    "common.cancel": "取消",
    "common.delete": "删除",
    "common.close": "关闭",
    "common.copy": "复制",
    "common.copied": "已复制",
    "common.back": "返回",
    "common.retry": "重试",
    "common.optional": "选填",

    "nav.calendarView": "日历",
    "nav.listView": "列表",
    "nav.today": "今天",
    "nav.prevMonth": "上个月",
    "nav.nextMonth": "下个月",
    "nav.export": "导入日历",
    "nav.signIn": "输入口令",
    "nav.signOut": "退出",
    "nav.admin": "管理",
    "nav.history": "修改记录",
    "nav.language": "语言",
    "nav.addEvent": "添加活动",

    "auth.title": "编辑口令",
    "auth.subtitle": "口令由组织者提供。你的名字会出现在修改记录里。",
    "auth.codeLabel": "口令",
    "auth.nameLabel": "你的名字",
    "auth.namePlaceholder": "例如：阿克巴",
    "auth.submit": "进入",
    "auth.signedInAs": "正在以 {name} 的身份编辑",
    "auth.errEmptyCode": "请输入口令。",
    "auth.errEmptyName": "请输入名字。",
    "auth.errNotFound": "口令不存在。",
    "auth.errUsed": "该口令已被 {name} 使用。",
    "auth.errExpired": "口令已于 {date} 过期。",
    "auth.welcome": "欢迎，{name}",
    "auth.signedOut": "已退出",

    "event.new": "新建活动",
    "event.edit": "编辑活动",
    "event.fTitle": "活动名称",
    "event.fDesc": "说明",
    "event.fStart": "开始",
    "event.fEnd": "结束",
    "event.fLocation": "地点",
    "event.fColor": "颜色",
    "event.deleteConfirm": "删除「{title}」？此操作无法撤销。",
    "event.created": "活动已添加",
    "event.updated": "活动已更新",
    "event.deleted": "活动已删除",
    "event.errTitle": "请填写活动名称。",
    "event.errStart": "请选择开始时间。",
    "event.errOrder": "结束时间必须晚于开始时间。",
    "event.exportOne": "下载此活动",
    "event.readOnly": "可自由浏览，编辑需要口令。",
    "event.by": "添加者：{name}",

    "calendar.empty": "本月没有活动。",
    "calendar.more": "还有 {n} 个",

    "list.upcoming": "即将举行",
    "list.past": "已结束",
    "list.empty": "还没有活动。",
    "list.emptyHint": "来添加第一个吧。",

    "audit.title": "修改记录",
    "audit.empty": "还没有人做过修改。",
    "audit.CREATE": "添加了",
    "audit.UPDATE": "修改了",
    "audit.DELETE": "删除了",
    "audit.noChanges": "无改动",
    "audit.arrow": "→",
    "audit.empty_value": "空",

    "field.title": "名称",
    "field.description": "说明",
    "field.start_at": "开始",
    "field.end_at": "结束",
    "field.location": "地点",
    "field.color": "颜色",

    "admin.title": "管理面板",
    "admin.loginTitle": "管理员口令",
    "admin.passwordLabel": "口令",
    "admin.enter": "进入",
    "admin.wrongPassword": "口令错误。",
    "admin.notConfigured": "尚未设置管理员口令。请填写 config.js 中的 ADMIN_PASSWORD_HASH。",
    "admin.logout": "退出",
    "admin.backToCalendar": "返回日历",

    "admin.tokensTitle": "口令管理",
    "admin.tokensDesc": "每个口令可设为一次性，或在指定时间前有效。",
    "admin.createToken": "新建口令",
    "admin.labelField": "发给谁",
    "admin.labelPlaceholder": "例如：阿克巴 — 九月聚会",
    "admin.typeField": "类型",
    "admin.typeSingle": "一次性",
    "admin.typeTimed": "限时",
    "admin.expiresField": "有效期至",
    "admin.generate": "生成口令",
    "admin.createdTitle": "口令已生成",
    "admin.createdWarn": "口令只显示这一次，请复制后发送。",
    "admin.statusActive": "有效",
    "admin.statusUsed": "已使用",
    "admin.statusExpired": "已过期",
    "admin.usedBy": "{name} — {date}",
    "admin.neverUsed": "尚未使用",
    "admin.deleteToken": "删除口令",
    "admin.deleteTokenConfirm": "删除口令「{label}」？",
    "admin.noTokens": "还没有口令。",
    "admin.tokenCreated": "口令已生成",
    "admin.tokenDeleted": "口令已删除",
    "admin.eventsTitle": "全部活动",
    "admin.noEvents": "没有活动。",
    "admin.logTitle": "完整记录",
    "admin.errLabel": "请填写发给谁。",
    "admin.errExpires": "请选择有效期。",
    "admin.errExpiresPast": "有效期必须晚于现在。",

    "err.gistNotConfigured": "未设置 GIST_ID，请填写 config.js。",
    "err.gistNotFound": "找不到 Gist，请检查 GIST_ID。",
    "err.rateLimit": "GitHub 请求次数已达上限，请稍后再试。",
    "err.readFailed": "数据加载失败（{code}）。",
    "err.writeNoToken": "未设置 GitHub 令牌。",
    "err.tokenInvalid": "GitHub 令牌无效或已过期。",
    "err.tokenNoScope": "令牌缺少 gist 权限。",
    "err.saveFailed": "保存失败（{code}）。",

    "time.justNow": "刚刚",
    "time.minutes": "{n} 分钟前",
    "time.hours": "{n} 小时前",
    "time.days": "{n} 天前",

    "export.done": "已下载 {n} 个活动",
    "export.nothing": "没有可下载的活动。",
  },
};

/* ---------------------------------------------------- API */

function detect() {
  const saved = localStorage.getItem("lang");
  if (saved && DICT[saved]) return saved;
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("uz")) return "uz";
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("zh")) return "zh";
  return "en";
}

let current = detect();
const watchers = new Set();

export const getLang = () => current;

export function setLang(code) {
  if (!DICT[code] || code === current) return;
  current = code;
  localStorage.setItem("lang", code);
  document.documentElement.lang = code;
  watchers.forEach(fn => fn(code));
}

export function onLangChange(fn) {
  watchers.add(fn);
  return () => watchers.delete(fn);
}

export function t(key, vars) {
  let s = DICT[current]?.[key] ?? DICT.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export const months    = () => MONTHS[current];
export const daysShort = () => DAYS_SHORT[current];
export const daysFull  = () => DAYS_FULL[current];

/** Sana — har til o'z tartibida */
export function formatDate(d) {
  const day = d.getDate(), m = d.getMonth(), y = d.getFullYear();
  switch (current) {
    case "zh": return `${y}年${m + 1}月${day}日`;
    case "ru": return `${day} ${MONTHS_GEN.ru[m]} ${y}`;
    case "en": return `${MONTHS[current][m]} ${day}, ${y}`;
    default:   return `${day}-${MONTHS[current][m].toLowerCase()}, ${y}`;
  }
}

/** Sarlavhadagi oy + yil */
export function formatMonthYear(d) {
  const m = MONTHS[current][d.getMonth()], y = d.getFullYear();
  return current === "zh" ? `${y}年 ${m}` : `${m} ${y}`;
}

/** Kun + oy (ro'yxatdagi kunlar uchun) */
export function formatDayMonth(d) {
  const day = d.getDate(), m = d.getMonth();
  switch (current) {
    case "zh": return `${m + 1}月${day}日`;
    case "ru": return `${day} ${MONTHS_GEN.ru[m]}`;
    case "en": return `${MONTHS[current][m].slice(0, 3)} ${day}`;
    default:   return `${day} ${MONTHS[current][m].toLowerCase()}`;
  }
}
