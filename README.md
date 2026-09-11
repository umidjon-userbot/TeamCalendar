# Tadbirlar taqvimi

GitHub Pages'da ishlaydigan tadbirlar taqvimi. Build yo'q, npm yo'q, server yo'q — fayllarni repoga qo'yasiz va ishlaydi.

- Taqvim va ro'yxat ko'rinishi, bir tugma bilan almashadi
- Ko'rish hamma uchun ochiq, tahrirlash parol bilan
- Parol bir martalik yoki muddatli bo'ladi, buni admin tanlaydi
- Kim nimani o'zgartirgani tarixda ko'rinib turadi, o'chirilganini qaytarib olish mumkin
- Takrorlanuvchi tadbirlar: har kuni, har hafta, har oy, har yili
- Ko'p kunlik tadbirlar barcha kunlarida ko'rinadi
- Turlar bo'yicha filtr va matn bo'yicha qidiruv
- Devorga osish uchun chop etish rejimi
- `.ics` yuklab olish — Google Calendar, Apple Calendar, Outlook hammasi tushunadi
- To'rt til: o'zbek, rus, ingliz, xitoy

---

## Birinchi marta o'rnatish

### 1. Gist yarating

[gist.github.com](https://gist.github.com) ga kiring va **uchta fayl** qo'shing. Har birining ichiga faqat `[]` yozing:

| Fayl nomi | Ichi |
|---|---|
| `events.json` | `[]` |
| `tokens.json` | `[]` |
| `audit_log.json` | `[]` |

**Create secret gist** tugmasini bosing. Manzilning oxirgi qismi — Gist ID, uni nusxa oling.

### 2. Token oling

[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) → **Generate new token** (fine-grained):

- **Account permissions** → **Gists** → **Read and write**
- Boshqa hech qanday ruxsat bermang

Token faqat bir marta ko'rinadi, nusxa oling.

### 3. Sozlash yordamchisi

`tools/hash.html` ni brauzerda oching. Admin parolini va GitHub tokenni kiriting, kerakli qiymatlarni chiqarib beradi. Bu sahifa hech qayerga ma'lumot yubormaydi.

### 4. `config.js` yarating

`config.example.js` dan nusxa oling va nomini `config.js` qo'ying, keyin to'ldiring:

```js
GIST_ID: "a1b2c3d4e5f6...",
TOKEN_PARTS: ["Z2l0aHViX3BhdF8x", "MjM0NTY3ODkw"],
ADMIN_PASSWORD_HASH: "8c6976e5b5410415bde908bd4dee15df...",
```

### 5. Pages'ni yoqing

Repo → **Settings** → **Pages** → Source: **Deploy from a branch** → `main` / `(root)`.

---

## Yangilash

**`config.js` ni hech qachon ustidan yozmang.** Zip ichida u yo'q, faqat `config.example.js` bor, shuning uchun barcha fayllarni bemalol ko'chirib qo'yaversangiz bo'ladi.

Agar `config.js` baribir yo'qolsa, sayt oq sahifa bermaydi — sozlash ekranini ko'rsatadi. Eski qiymatlarni GitHub'da fayl ustidagi **History** tugmasidan topasiz.

Yangilangandan keyin brauzerda **Cmd/Ctrl + Shift + R** bosing, eski nusxa keshda qolib ketmasin.

### Eski tadbirlar haqida

Ilgari qo'shilgan tadbirlarda "turi" bo'lmagan, ular eski rangini saqlab qoladi va filtrda "Boshqa" deb hisoblanadi. Birinchi marta tahrirlaganingizda tur tanlaysiz.

---

## Foydalanish

**Oddiy foydalanuvchi** tadbirlarni ko'radi, qidiradi, `.ics` yuklab oladi. Tahrirlash uchun paroldan foydalanadi va ismini yozadi, ismi tarixda qoladi.

**Admin** `#/admin` manziliga kiradi:

- yangi parol yaratadi, bir martalik yoki muddatli
- parol faqat yaratilgan paytda bir marta ko'rsatiladi
- qaysi parol kim tomonidan ishlatilgani ko'rinib turadi
- keraksiz parolni yoki tadbirni o'chiradi
- to'liq tarixni ko'radi va o'chirilgan tadbirni tiklaydi

**Takrorlanuvchi tadbirni o'chirganda** ikki variant so'raladi: faqat o'sha sanani, yoki butun turkumni. Tahrirlash esa doim butun turkumga tegadi.

---

## Bilib qo'yish kerak

**Token saytga ochiq.** Statik saytda boshqa yo'l yo'q. Tokenga faqat **gist** ruxsatini bering, gistni **secret** qiling, repoda muhim ma'lumot saqlamang. Kimdir gistni buzsa, GitHub gist tarixini saqlaydi va tiklash mumkin.

**Parollar hash ko'rinishida saqlanadi.** Gistni ochgan odam parollarni ko'rmaydi. Admin ham keyin qayta ko'ra olmaydi, kerak bo'lsa yangisini yaratadi.

**Vaqt mintaqasi.** Tadbir har kimning o'z qurilmasidagi vaqtda ko'rsatiladi. Toshkentdagi 16:00 Pekinda 19:00 bo'lib ko'rinadi. Turli mamlakatdagi odamlar bilan ishlasangiz, tadbir nomida mintaqani yozib qo'ying.

**Bir vaqtda ikki kishi tahrirlasa**, har saqlashdan oldin eng yangi nusxa o'qiladi. Ayni bir soniyada bir tadbirni ikkalasi o'zgartirsa, oxirgisi qoladi.

---

## Fayllar

```
index.html            asosiy sahifa
config.example.js     namuna — nusxa olib config.js qiling
css/style.css         dizayn va chop etish uslubi
js/config.js          sozlamalarni yuklaydi
js/i18n.js            to'rtta til
js/core.js            Gist, parollar, takrorlanish, audit, .ics
js/views.js           taqvim, ro'yxat, modallar
js/admin.js           admin panel
js/app.js             header, qidiruv, filtr, routing
tools/hash.html       sozlash yordamchisi
gist-starter/         gistga nusxa olish uchun bo'sh fayllar
```

## Turlarni o'zgartirish

`config.js` dagi `CATEGORIES` ro'yxatini tahrirlang. Har bir tur uchun `id`, `color` va to'rt tildagi nom kerak. `id` ni keyin o'zgartirmang, eski tadbirlar unga bog'langan.

## Yangi til qo'shish

`js/i18n.js` da `LANGS` ga qo'shing va `DICT` ichida o'sha kodli bo'lim yarating, kalitlarni `en` dan nusxa olib tarjima qiling. `MONTHS`, `DAYS_SHORT`, `DAYS_FULL` ga ham qo'shing.
