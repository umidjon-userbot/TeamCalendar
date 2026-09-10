# Tadbirlar taqvimi

GitHub Pages'da ishlaydigan tadbirlar taqvimi. Build yo'q, npm yo'q, server yo'q — fayllarni repoga qo'yasiz va ishlaydi.

- Taqvim va ro'yxat ko'rinishi, bir tugma bilan almashadi
- Ko'rish hamma uchun ochiq, tahrirlash parol bilan
- Parol bir martalik yoki muddatli bo'ladi — buni admin tanlaydi
- Kim nimani o'zgartirgani tarixda ko'rinib turadi
- Tadbirlarni `.ics` qilib yuklab olish — Google Calendar, Apple Calendar, Outlook hammasi tushunadi
- To'rt til: o'zbek, rus, ingliz, xitoy

---

## O'rnatish

### 1. Gist yarating

[gist.github.com](https://gist.github.com) ga kiring va **uchta fayl** qo'shing. Har birining ichiga faqat `[]` yozing:

| Fayl nomi | Ichi |
|---|---|
| `events.json` | `[]` |
| `tokens.json` | `[]` |
| `audit_log.json` | `[]` |

**Create secret gist** tugmasini bosing.

Manzil shunday ko'rinadi: `https://gist.github.com/sizning-ismingiz/a1b2c3d4e5f6...`
Oxirgi qism — Gist ID. Uni nusxa oling.

### 2. Token oling

[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) → **Generate new token** (fine-grained):

- **Expiration** — istaganingizcha (masalan 1 yil)
- **Account permissions** → **Gists** → **Read and write**
- Boshqa hech qanday ruxsat bermang

Tokenni nusxa oling — u faqat bir marta ko'rinadi.

### 3. Sozlash yordamchisini oching

`tools/hash.html` faylini brauzerda oching (repodan yuklab olib, ikki marta bosing).

- Admin parolini yozing → SHA-256 hash chiqadi
- GitHub tokenni yozing → `TOKEN_PARTS` chiqadi

Bu sahifa hech qayerga ma'lumot yubormaydi, hammasi brauzeringizda hisoblanadi.

### 4. `config.js` ni to'ldiring

```js
export const CONFIG = {
  SITE_TITLE: "Tadbirlar taqvimi",
  GIST_ID: "a1b2c3d4e5f6...",
  TOKEN_PARTS: ["Z2l0aHViX3BhdF8x", "MjM0NTY3ODkw"],
  ADMIN_PASSWORD_HASH: "8c6976e5b5410415bde908bd4dee15df...",
  // ...
};
```

### 5. GitHub Pages'ni yoqing

Repo → **Settings** → **Pages** → Source: **Deploy from a branch** → `main` / `(root)` → Save.

Bir-ikki daqiqadan keyin sayt `https://ismingiz.github.io/repo-nomi/` da ochiladi.

---

## Foydalanish

**Oddiy foydalanuvchi** saytga kiradi, tadbirlarni ko'radi, `.ics` yuklab oladi. Tahrirlash uchun paroldan foydalanadi va ismini yozadi — ismi tarixda qoladi.

**Admin** `#/admin` manziliga kiradi (masalan `https://ismingiz.github.io/repo-nomi/#/admin`), o'z paroli bilan kiradi va:

- yangi parol yaratadi — bir martalik yoki muddatli
- parol faqat yaratilgan paytda bir marta ko'rsatiladi, nusxa olib egasiga yuboriladi
- qaysi parol ishlatilgani, kim ishlatgani ko'rinib turadi
- keraksiz parolni yoki tadbirni o'chiradi
- to'liq o'zgarishlar tarixini ko'radi

---

## Bilib qo'yish kerak

**Token saytga ochiq.** Statik saytda boshqa yo'l yo'q — kim brauzerda kodni ochsa, tokenni topa oladi. Shuning uchun:

- tokenga faqat **gist** ruxsatini bering, boshqa hech nima
- gistni **secret** qilib yarating
- repo public bo'lsa, muhim ma'lumot yozmang

**Parollar hash ko'rinishida saqlanadi.** Gistni ochib ko'rgan odam parollarni ko'ra olmaydi — faqat ularning SHA-256 hashini ko'radi. Shu sababli admin ham parolni keyin qayta ko'ra olmaydi; kerak bo'lsa yangisini yaratadi.

**GitHub chegarasi.** Tokenli so'rovlar soatiga 5000 ta. Oddiy foydalanish uchun yetib ortadi.

**Bir vaqtda ikki kishi tahrirlasa**, har saqlashdan oldin eng yangi nusxa o'qiladi, lekin bir soniyada bir xil tadbirni ikkalasi o'zgartirsa, oxirgisi yozilib qoladi.

---

## Fayllar

```
index.html          asosiy sahifa
config.js           siz to'ldiradigan yagona fayl
css/style.css       dizayn
js/i18n.js          to'rtta til
js/core.js          Gist bilan ishlash, parollar, audit, .ics
js/views.js         taqvim, ro'yxat, modallar
js/admin.js         admin panel
js/app.js           header, til almashtirish, routing
tools/hash.html     sozlash yordamchisi (keyin o'chirsa ham bo'ladi)
```

## Yangi til qo'shish

`js/i18n.js` da `LANGS` ro'yxatiga qo'shing va `DICT` ichiga o'sha kodli bo'lim yarating — kalitlarni `en` dan nusxa olib tarjima qiling. `MONTHS`, `DAYS_SHORT`, `DAYS_FULL` ga ham o'z tilingizni qo'shing.
