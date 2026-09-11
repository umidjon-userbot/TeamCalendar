// ============================================================
//  SOZLAMALAR — bu faylni to'ldiring
//  Batafsil yo'riqnoma uchun README.md ni o'qing.
// ============================================================

export const CONFIG = {
  // Saytning nomi (header'da chiqadi)
  SITE_TITLE: "Tadbirlar taqvimi",

  // 1) Gist ID — gist.github.com da yaratgan gist manzilining oxirgi qismi
  //    Masalan: https://gist.github.com/akbar/a1b2c3d4e5  ->  "a1b2c3d4e5"
  GIST_ID: "",

  // 2) GitHub token — base64 ko'rinishida, 2 qismga bo'lingan.
  //    MUHIM: tokenni to'g'ridan-to'g'ri yozmang — GitHub uni avtomatik
  //    bekor qiladi. tools/hash.html sahifasi orqali bo'laklarni oling.
  TOKEN_PARTS: ["", ""],

  // 3) Admin paroli — SHA-256 hash ko'rinishida.
  //    tools/hash.html orqali hosil qiling.
  ADMIN_PASSWORD_HASH: "",

  // Tadbir turlari. Rang shu yerdan olinadi, alohida tanlanmaydi.
  // Yangi tur qo'shsangiz, to'rt tilda ham nom bering.
  CATEGORIES: [
    { id: "lesson",  color: "#2F6F8F",
      label: { uz: "Dars",    ru: "Занятие",      en: "Class",   zh: "课程" } },
    { id: "event",   color: "#4E7A4A",
      label: { uz: "Tadbir",  ru: "Мероприятие",  en: "Event",   zh: "活动" } },
    { id: "exam",    color: "#C0392B",
      label: { uz: "Imtihon", ru: "Экзамен",      en: "Exam",    zh: "考试" } },
    { id: "holiday", color: "#B8862B",
      label: { uz: "Bayram",  ru: "Праздник",     en: "Holiday", zh: "假期" } },
    { id: "other",   color: "#79876E",
      label: { uz: "Boshqa",  ru: "Другое",       en: "Other",   zh: "其他" } },
  ],
};

// Tokenni qismlardan yig'ish
export function githubToken() {
  const joined = (CONFIG.TOKEN_PARTS || []).join("");
  if (!joined) return "";
  try {
    return atob(joined);
  } catch {
    return "";
  }
}
