import { CONFIG, githubToken } from "../config.js";
import { t, formatDate, formatDayMonth } from "./i18n.js";

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

const TRACKED = ["title", "description", "start_at", "end_at", "location", "color"];

export function computeDiff(before, after) {
  const diff = { before: {}, after: {} };
  for (const k of TRACKED) {
    const b = before?.[k] ?? null;
    const a = after?.[k] ?? null;
    if (b !== a) { diff.before[k] = b; diff.after[k] = a; }
  }
  return diff;
}

export function buildAuditEntry({ event, action, before, after }) {
  return {
    id: uid(),
    event_id: event.id,
    event_title: event.title,
    action,
    changed_by: store.session?.username ?? "noma'lum",
    token_label: store.session?.label ?? null,
    diff: computeDiff(before, after),
    changed_at: new Date().toISOString(),
  };
}

export const fieldLabel = key => t(`field.${key}`);
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
    color: draft.color || CONFIG.COLORS[0].value,
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
      `UID:${e.id}@tadbirlar`,
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
