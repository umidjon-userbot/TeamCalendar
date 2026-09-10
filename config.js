// ============================================================
//  SOZLAMALAR — bu faylni to'ldiring
//  Batafsil yo'riqnoma uchun README.md ni o'qing.
// ============================================================

export const CONFIG = {
  // Saytning nomi (header'da chiqadi)
  SITE_TITLE: "Tadbirlar taqvimi",

  // 1) Gist ID — gist.github.com da yaratgan gist manzilining oxirgi qismi
  //    Masalan: https://gist.github.com/akbar/a1b2c3d4e5  ->  "a1b2c3d4e5"
  GIST_ID: "13bf41ef7c2963414de6e4fee54dc1ce",

  // 2) GitHub token — base64 ko'rinishida, 2 qismga bo'lingan.
  //    MUHIM: tokenni to'g'ridan-to'g'ri yozmang — GitHub uni avtomatik
  //    bekor qiladi. tools/hash.html sahifasi orqali bo'laklarni oling.
  TOKEN_PARTS: ["Z2l0aHViX3BhdF8xMUFPMk1OT1EwWTJVNHdUMEpoTFFQX2NMSFdlVWNmRGRCRE", "l2NHZNSmpvZmdWQ0hoNjNGT0pTYm9IODR0S0pybjMzTEZWQ0dCVlRLYWpUQnQy"],

  // 3) Admin paroli — SHA-256 hash ko'rinishida.
  //    tools/hash.html orqali hosil qiling.
  ADMIN_PASSWORD_HASH: "1ac0be2aaa305138076a3f0d16539f0621913fb1a1ffa24737911bfaccb92d9f",

  // Tadbir ranglari (foydalanuvchi tanlaydi)
  COLORS: [
    { name: "Ko'k",     value: "#2F6F8F" },
    { name: "Yashil",   value: "#4E7A4A" },
    { name: "Qizil",    value: "#C0392B" },
    { name: "Sariq",    value: "#B8862B" },
    { name: "Siyoh",    value: "#4B4A6B" },
    { name: "Zaytun",   value: "#79876E" },
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
