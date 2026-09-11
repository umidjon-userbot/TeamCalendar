import { CONFIG, githubToken } from "./config.js";
import { t, formatDate, formatDayMonth, getLang } from "./i18n.js";

/* ============================================================
   Umumiy yordamchilar
   ============================================================ */

export const uid = () =>
  (crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));

export const el = (sel, root = document) => root.querySelector(sel);
export const els = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

/* ---- Sana ---- */

// Dushanba = 0
export const weekIndex = d => (d.getDay() + 6) % 7;

export const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const dateKey = d =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export const fmtDate = iso => formatDate(new Date(iso));
export const fmtDayMonth = iso => formatDayMonth(new Date(iso));

export function fmtTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export function fmtDateTime(iso) {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`;
}

export function relTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)     return t("time.justNow");
  if (diff < 3600)   return t("time.minutes", { n: Math.floor(diff / 60) });
  if (diff < 86400)  return t("time.hours",   { n: Math.floor(diff / 3600) });
  if (diff < 604800) return t("time.days",    { n: Math.floor(diff / 86400) });
  return fmtDate(iso);
}

// <input type="datetime-local"> uchun
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const fromLocalInput = v => (v ? new Date(v).toISOString() : null);

/* ---- SHA-256 ---- */

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function randomCode(len = 6) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // O, 0, I, 1 yo'q
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return [...bytes].map(b => alphabet[b % alphabet.length]).join("");
}

/* ============================================================
   Gist qatlami
   ============================================================ */

const API = "https://api.github.com/gists";
const FILE = { events: "events.json", tokens: "tokens.json", audit: "audit_log.json" };

export const hasWriteAccess = () => Boolean(githubToken() && CONFIG.GIST_ID);

function ghHeaders(withAuth) {
  const h = { Accept: "application/vnd.github+json" };
  const ghToken = githubToken();
  if (withAuth && ghToken) h.Authorization = `Bearer ${ghToken}`;
  return h;
}

async function fileContent(file) {
  if (!file) return "[]";
  if (file.truncated && file.raw_url) {
    const r = await fetch(file.raw_url);
    return r.text();
  }
  return file.content ?? "[]";
}

function safeParse(text, fallback = []) {
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export async function readAll() {
  if (!CONFIG.GIST_ID) throw new Error(t("err.gistNotConfigured"));

  const res = await fetch(`${API}/${CONFIG.GIST_ID}`, {
    headers: ghHeaders(true),
    cache: "no-store",
  });

  if (res.status === 404) throw new Error(t("err.gistNotFound"));
  if (res.status === 403) throw new Error(t("err.rateLimit"));
  if (!res.ok) throw new Error(t("err.readFailed", { code: res.status }));

  const data = await res.json();
  const [ev, tk, au] = await Promise.all([
    fileContent(data.files?.[FILE.events]),
    fileContent(data.files?.[FILE.tokens]),
    fileContent(data.files?.[FILE.audit]),
  ]);

  return {
    events: safeParse(ev),
    tokens: safeParse(tk),
    audit:  safeParse(au),
  };
}

export async function writeAll({ events, tokens, audit }) {
  const ghToken = githubToken();
  if (!ghToken) throw new Error(t("err.writeNoToken"));

  const files = {};
  if (events) files[FILE.events] = { content: JSON.stringify(events, null, 2) };
  if (tokens) files[FILE.tokens] = { content: JSON.stringify(tokens, null, 2) };
  if (audit)  files[FILE.audit]  = { content: JSON.stringify(audit.slice(-500), null, 2) };

  const res = await fetch(`${API}/${CONFIG.GIST_ID}`, {
    method: "PATCH",
    headers: { ...ghHeaders(true), "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });

  if (res.status === 401) throw new Error(t("err.tokenInvalid"));
  if (res.status === 403) throw new Error(t("err.tokenNoScope"));
  if (!res.ok) throw new Error(t("err.saveFailed", { code: res.status }));

  return res.json();
}

/* ============================================================
   Holat (state)
   ============================================================ */

export const store = {
  events: [],
  tokens: [],
  audit: [],
  loaded: false,
  view: localStorage.getItem("view") || "calendar",
  cursor: new Date(),
  query: "",
  hidden: new Set(JSON.parse(localStorage.getItem("hiddenCats") || "[]")),
  session: JSON.parse(sessionStorage.getItem("session") || "null"), // { code, username, tokenId }
  listeners: new Set(),
};

export function subscribe(fn) {
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}

export function emit() {
  store.listeners.forEach(fn => fn());
}

export async function refresh() {
  const data = await readAll();
  store.events = data.events;
  store.tokens = data.tokens;
  store.audit  = data.audit;
  store.loaded = true;
  emit();
  return data;
}

export function setSession(s) {
  store.session = s;
  if (s) sessionStorage.setItem("session", JSON.stringify(s));
  else sessionStorage.removeItem("session");
  emit();
}

export const canEdit = () => Boolean(store.session);

/* ============================================================
   Parol (token) tekshirish
   ============================================================ */

export function tokenStatus(t) {
  if (t.type === "single_use" && t.used) return "used";
  if (t.type === "timed" && t.expires_at && new Date(t.expires_at) < new Date()) return "expired";
  return "active";
}

export async function verifyToken(code, username) {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, error: t("auth.errEmptyCode") };
  if (!username.trim()) return { ok: false, error: t("auth.errEmptyName") };

  const fresh = await readAll();
  store.tokens = fresh.tokens;
  store.events = fresh.events;
  store.audit  = fresh.audit;

  const hash = await sha256(clean);
  const token = fresh.tokens.find(t => t.code_hash === hash);

  if (!token) return { ok: false, error: t("auth.errNotFound") };

  const status = tokenStatus(token);
  if (status === "used")
    return { ok: false, error: t("auth.errUsed", { name: token.used_by ?? "—" }) };
  if (status === "expired")
    return { ok: false, error: t("auth.errExpired", { date: fmtDateTime(token.expires_at) }) };

  const now = new Date().toISOString();
  const updated = fresh.tokens.map(t =>
    t.id === token.id
      ? {
          ...t,
          used: t.type === "single_use" ? true : t.used,
          used_by: t.used_by ?? username.trim(),
          used_at: t.used_at ?? now,
          use_count: (t.use_count ?? 0) + 1,
          last_used_at: now,
        }
      : t
  );

  await writeAll({ tokens: updated });
  store.tokens = updated;

  setSession({ code: clean, username: username.trim(), tokenId: token.id, label: token.label });
  return { ok: true };
}

/* ============================================================
   Audit
   ============================================================ */

const TRACKED = ["title", "description", "start_at", "end_at", "location", "category", "rrule"];

export function computeDiff(before, after) {
  const diff = { before: {}, after: {} };
  for (const k of TRACKED) {
    const b = before?.[k] ?? null;
    const a = after?.[k] ?? null;
    // rrule obyekt — mazmuni bo'yicha solishtiramiz
    const same = k === "rrule" ? JSON.stringify(b) === JSON.stringify(a) : b === a;
    if (!same) { diff.before[k] = b; diff.after[k] = a; }
  }
  return diff;
}

export function buildAuditEntry({ event, action, before, after }) {
  return {
    id: uid(),
    snapshot: action === "DELETE" ? { ...event } : null,
    event_id: event.id,
    event_title: event.title,
    action,
    changed_by: store.session?.username ?? "noma'lum",
    token_label: store.session?.label ?? null,
    diff: computeDiff(before, after),
    changed_at: new Date().toISOString(),
  };
}

const FIELD_KEYS = { category: "event.fCategory", rrule: "event.fRepeat" };
export const fieldLabel = key => t(FIELD_KEYS[key] ?? `field.${key}`);
export const TRACKED_FIELDS = TRACKED;

/* ============================================================
   Tadbir CRUD
   ============================================================ */

export async function saveEvent(draft) {
  const fresh = await readAll();
  const existing = fresh.events.find(e => e.id === draft.id);
  const action = existing ? "UPDATE" : "CREATE";

  const event = {
    id: draft.id ?? uid(),
    title: draft.title.trim(),
    description: draft.description?.trim() ?? "",
    location: draft.location?.trim() ?? "",
    start_at: draft.start_at,
    end_at: draft.end_at || null,
    category: draft.category || CONFIG.CATEGORIES[0].id,
    rrule: draft.rrule?.freq ? { ...draft.rrule } : null,
    exdates: existing?.exdates ?? [],
    created_at: existing?.created_at ?? new Date().toISOString(),
    created_by: existing?.created_by ?? store.session?.username ?? "noma'lum",
    updated_at: new Date().toISOString(),
  };

  const events = existing
    ? fresh.events.map(e => (e.id === event.id ? event : e))
    : [...fresh.events, event];

  const audit = [...fresh.audit, buildAuditEntry({
    event, action, before: existing ?? null, after: event,
  })];

  await writeAll({ events, audit });
  store.events = events;
  store.audit = audit;
  emit();
  return event;
}

export async function deleteEvent(id) {
  const fresh = await readAll();
  const existing = fresh.events.find(e => e.id === id);
  if (!existing) return;

  const events = fresh.events.filter(e => e.id !== id);
  const audit = [...fresh.audit, buildAuditEntry({
    event: existing, action: "DELETE", before: existing, after: null,
  })];

  await writeAll({ events, audit });
  store.events = events;
  store.audit = audit;
  emit();
}

/* ============================================================
   .ics eksport (RFC 5545)
   ============================================================ */

function icsEscape(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsStamp(d) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth()+1)}${p(d.getUTCDate())}T` +
         `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

// 75 oktetdan uzun qatorlarni buklash
function fold(line) {
  const out = [];
  let cur = line;
  while (cur.length > 74) {
    out.push(cur.slice(0, 74));
    cur = " " + cur.slice(74);
  }
  out.push(cur);
  return out.join("\r\n");
}

export function buildICS(events) {
  const now = icsStamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tadbirlar taqvimi//UZ",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(CONFIG.SITE_TITLE)}`,
  ];

  for (const e of events) {
    const start = new Date(e.start_at);
    const end = e.end_at ? new Date(e.end_at) : new Date(start.getTime() + 3600000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.series_id ?? e.id}-${e.occ_key ?? dateKey(start)}@tadbirlar`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsStamp(start)}`,
      `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsEscape(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadICS(events, filename = "tadbirlar.ics") {
  const blob = new Blob([buildICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   Toast
   ============================================================ */

export function toast(message, kind = "info") {
  let host = el("#toasts");
  if (!host) {
    host = document.createElement("div");
    host.id = "toasts";
    document.body.append(host);
  }
  const node = document.createElement("div");
  node.className = `toast toast--${kind}`;
  node.textContent = message;
  host.append(node);
  setTimeout(() => {
    node.classList.add("is-out");
    setTimeout(() => node.remove(), 250);
  }, 3600);
}


/* ============================================================
   Turlar (kategoriyalar)
   ============================================================ */

export const categoryOf = e =>
  CONFIG.CATEGORIES.find(c => c.id === (e.category ?? "")) ?? null;

export const eventColor = e =>
  categoryOf(e)?.color ?? e.color ?? "#79876E";

export const categoryLabel = c =>
  c?.label?.[getLang()] ?? c?.label?.en ?? c?.id ?? "";

/* ============================================================
   Takrorlanish
   ============================================================ */

export const FREQS = ["daily", "weekly", "monthly", "yearly"];

/** k-chi takror. Har doim asl sanadan hisoblanadi, shuning uchun
 *  oy oxiri (31-son) kabi hollarda sana siljib ketmaydi. */
function occurrenceAt(start, freq, step, k) {
  const x = new Date(start);
  if (freq === "daily")        x.setDate(x.getDate() + step * k);
  else if (freq === "weekly")  x.setDate(x.getDate() + 7 * step * k);
  else if (freq === "monthly") x.setMonth(x.getMonth() + step * k);
  else if (freq === "yearly")  x.setFullYear(x.getFullYear() + step * k);
  return x;
}

/** Diapazon boshiga yaqin takrorni topadi. Busiz 2020-yilda boshlangan
 *  kundalik tadbir uchun 2026-yilga yetguncha limit tugab qolardi. */
function firstIndexNear(start, freq, step, from, durDays) {
  if (start >= from) return 0;
  const days = (from - start) / 86400000;
  let k = 0;
  if (freq === "daily")        k = Math.floor(days / step);
  else if (freq === "weekly")  k = Math.floor(days / (7 * step));
  else if (freq === "monthly") k = Math.floor(
    ((from.getFullYear() - start.getFullYear()) * 12 + from.getMonth() - start.getMonth()) / step);
  else if (freq === "yearly")  k = Math.floor((from.getFullYear() - start.getFullYear()) / step);

  // Ko'p kunlik tadbir diapazonga cho'zilib kirishi mumkin — biroz orqaga qaytamiz
  const stepDays = freq === "daily" ? step : freq === "weekly" ? 7 * step : 28 * step;
  const back = 2 + Math.ceil(durDays / Math.max(1, stepDays));
  return Math.max(0, k - back);
}

const WIDE_FROM = new Date(2000, 0, 1);
const WIDE_TO   = new Date(2100, 0, 1);

/**
 * Takrorlanuvchi tadbirlarni alohida sanalarga yoyadi.
 * Qaytadigan har bir element oddiy tadbirga o'xshaydi, ustiga:
 *   series_id — asl tadbir id si
 *   occ_key   — shu takrorning sanasi (YYYY-MM-DD)
 *   repeating — turkumga tegishlimi
 */
export function expandEvents(events, from = WIDE_FROM, to = WIDE_TO, limit = 600) {
  const out = [];

  for (const e of events) {
    const start = new Date(e.start_at);
    if (isNaN(start)) continue;
    const dur = e.end_at ? Math.max(0, new Date(e.end_at) - start) : 0;
    const rule = e.rrule;

    const push = d => {
      const key = dateKey(d);
      if (e.exdates?.includes(key)) return;
      out.push({
        ...e,
        start_at: d.toISOString(),
        end_at: e.end_at ? new Date(d.getTime() + dur).toISOString() : null,
        series_id: e.id,
        occ_key: key,
        repeating: Boolean(rule?.freq),
      });
    };

    if (!rule?.freq || !FREQS.includes(rule.freq)) {
      if (new Date(start.getTime() + dur) >= from && start <= to) push(start);
      continue;
    }

    const step = Math.max(1, Number(rule.interval) || 1);
    const until = rule.until ? new Date(rule.until) : null;
    let k = firstIndexNear(start, rule.freq, step, from, dur / 86400000);
    let made = 0;

    while (made < limit) {
      const cur = occurrenceAt(start, rule.freq, step, k++);
      if (until && cur > until) break;
      if (cur > to) break;
      if (new Date(cur.getTime() + dur) >= from) { push(cur); made++; }
      // juda uzoqqa ketib qolmaslik uchun
      if (k > 100000) break;
    }
  }

  return out.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
}

export function describeRule(rule) {
  if (!rule?.freq) return "";
  const step = Math.max(1, Number(rule.interval) || 1);
  const base = t("rec." + rule.freq);
  return step > 1 ? `${base} · ${t("rec.every", { n: step })}` : base;
}

/* ============================================================
   Ko'p kunlik tadbirlar
   ============================================================ */

/** Tadbir qamrab olgan barcha sanalar */
export function occDays(occ, cap = 90) {
  const s = startOfDay(new Date(occ.start_at));
  const e = startOfDay(new Date(occ.end_at ?? occ.start_at));
  const out = [];
  const d = new Date(s);
  while (d <= e && out.length < cap) {
    out.push(dateKey(d));
    d.setDate(d.getDate() + 1);
  }
  return out.length ? out : [dateKey(s)];
}

export const occSpan = occ => occDays(occ).length;

/* ============================================================
   Qidiruv va filtr
   ============================================================ */

export function matchesFilters(e) {
  if (store.hidden.has(e.category ?? "other")) return false;
  const q = store.query.trim().toLowerCase();
  if (!q) return true;
  return [e.title, e.description, e.location]
    .some(v => (v ?? "").toLowerCase().includes(q));
}

/** Ko'rinishlar shu ro'yxatdan foydalanadi */
export function visibleOccurrences(from, to) {
  return expandEvents(store.events.filter(matchesFilters), from, to);
}

export function toggleCategory(id) {
  store.hidden.has(id) ? store.hidden.delete(id) : store.hidden.add(id);
  localStorage.setItem("hiddenCats", JSON.stringify([...store.hidden]));
  emit();
}

export function setQuery(q) {
  store.query = q;
  emit();
}

/* ============================================================
   Bitta sanani turkumdan chiqarish
   ============================================================ */

export async function skipOccurrence(seriesId, key) {
  const fresh = await readAll();
  const existing = fresh.events.find(e => e.id === seriesId);
  if (!existing) return;

  const updated = {
    ...existing,
    exdates: [...new Set([...(existing.exdates ?? []), key])],
    updated_at: new Date().toISOString(),
  };
  const events = fresh.events.map(e => (e.id === seriesId ? updated : e));
  const audit = [...fresh.audit, buildAuditEntry({
    event: updated, action: "UPDATE", before: existing, after: updated,
  })];

  await writeAll({ events, audit });
  store.events = events;
  store.audit = audit;
  emit();
}

/* ============================================================
   O'chirilgan tadbirni tiklash
   ============================================================ */

export async function restoreEvent(auditId) {
  const fresh = await readAll();
  const entry = fresh.audit.find(a => a.id === auditId);
  if (!entry?.snapshot) throw new Error(t("err.saveFailed", { code: "no snapshot" }));
  if (fresh.events.some(e => e.id === entry.snapshot.id)) return entry.snapshot;

  const event = { ...entry.snapshot, updated_at: new Date().toISOString() };
  const events = [...fresh.events, event];
  const audit = [...fresh.audit, buildAuditEntry({
    event, action: "CREATE", before: null, after: event,
  })];

  await writeAll({ events, audit });
  store.events = events;
  store.audit = audit;
  emit();
  return event;
}
