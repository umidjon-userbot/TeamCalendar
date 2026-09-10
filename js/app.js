import { CONFIG } from "../config.js";
import { t, LANGS, getLang, setLang, onLangChange, formatMonthYear } from "./i18n.js";
import {
  store, el, esc, subscribe, emit, refresh, canEdit, setSession,
  downloadICS, toast, hasWriteAccess,
} from "./core.js";
import { renderCalendar, renderList, openAuthModal, openEventForm, openAuditDrawer } from "./views.js";
import { renderAdmin } from "./admin.js";

const app = el("#app");

/* ============================================================
   Header
   ============================================================ */

function headerHTML() {
  const signed = canEdit();
  return `
    <header class="topbar">
      <div class="topbar__row">
        <a class="brand" href="#/">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">${esc(CONFIG.SITE_TITLE)}</span>
        </a>

        <div class="topbar__right">
          <div class="langpick">
            <button class="btn btn--ghost btn--small" data-lang-toggle
                    aria-haspopup="true" aria-expanded="false">
              ${esc(LANGS.find(l => l.code === getLang())?.short ?? "EN")}
            </button>
            <ul class="langmenu" data-lang-menu hidden>
              ${LANGS.map(l => `
                <li><button data-lang="${l.code}"${l.code === getLang() ? ' aria-current="true"' : ""}>
                  ${esc(l.label)}</button></li>`).join("")}
            </ul>
          </div>

          <button class="btn btn--ghost btn--small" data-history>${esc(t("nav.history"))}</button>

          ${signed
            ? `<span class="whoami" title="${esc(t("auth.signedInAs", { name: store.session.username }))}">
                 ${esc(store.session.username)}
               </span>
               <button class="btn btn--ghost btn--small" data-signout>${esc(t("nav.signOut"))}</button>`
            : `<button class="btn btn--ghost btn--small" data-signin>${esc(t("nav.signIn"))}</button>`}
        </div>
      </div>

      <div class="topbar__row topbar__row--controls">
        <div class="monthnav">
          <button class="icon-btn" data-prev aria-label="${esc(t("nav.prevMonth"))}">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M12.5 4L7 10l5.5 6" stroke="currentColor" stroke-width="1.7"
                    fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <h1 class="monthnav__title">${esc(formatMonthYear(store.cursor))}</h1>
          <button class="icon-btn" data-next aria-label="${esc(t("nav.nextMonth"))}">
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path d="M7.5 4L13 10l-5.5 6" stroke="currentColor" stroke-width="1.7"
                    fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="btn btn--ghost btn--small" data-today>${esc(t("nav.today"))}</button>
        </div>

        <div class="topbar__tools">
          <div class="segmented segmented--view">
            <label><input type="radio" name="view" value="calendar"
                   ${store.view === "calendar" ? "checked" : ""}><span>${esc(t("nav.calendarView"))}</span></label>
            <label><input type="radio" name="view" value="list"
                   ${store.view === "list" ? "checked" : ""}><span>${esc(t("nav.listView"))}</span></label>
          </div>
          <button class="btn btn--small" data-export>${esc(t("nav.export"))}</button>
          <button class="btn btn--primary btn--small" data-add>${esc(t("nav.addEvent"))}</button>
        </div>
      </div>
    </header>`;
}

function wireHeader(root) {
  const move = n => {
    store.cursor = new Date(store.cursor.getFullYear(), store.cursor.getMonth() + n, 1);
    emit();
  };

  el("[data-prev]", root).onclick = () => move(-1);
  el("[data-next]", root).onclick = () => move(1);
  el("[data-today]", root).onclick = () => { store.cursor = new Date(); emit(); };

  root.querySelectorAll("input[name=view]").forEach(r => {
    r.onchange = () => {
      store.view = r.value;
      localStorage.setItem("view", r.value);
      emit();
    };
  });

  el("[data-export]", root).onclick = () => {
    if (!store.events.length) return toast(t("export.nothing"), "err");
    downloadICS(store.events);
    toast(t("export.done", { n: store.events.length }), "ok");
  };

  el("[data-add]", root).onclick = () => {
    if (canEdit()) openEventForm(null);
    else openAuthModal(() => openEventForm(null));
  };

  el("[data-history]", root).onclick = () => openAuditDrawer();
  el("[data-signin]", root)?.addEventListener("click", () => openAuthModal());
  el("[data-signout]", root)?.addEventListener("click", () => {
    setSession(null);
    toast(t("auth.signedOut"));
  });

  // Til menyusi
  const toggle = el("[data-lang-toggle]", root);
  const menu = el("[data-lang-menu]", root);
  toggle.onclick = e => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };
  menu.querySelectorAll("[data-lang]").forEach(btn => {
    btn.onclick = () => { menu.hidden = true; setLang(btn.dataset.lang); };
  });
  document.addEventListener("click", () => { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); });
}

/* ============================================================
   Sahifalar
   ============================================================ */

function renderCalendarPage() {
  app.innerHTML = headerHTML() + `<main class="page" id="main"></main>`;
  wireHeader(app);

  const main = el("#main", app);

  if (!store.loaded) {
    main.innerHTML = `<div class="empty"><p class="empty__title">${esc(t("common.loading"))}</p></div>`;
    return;
  }

  if (store.view === "calendar") renderCalendar(main);
  else renderList(main);

  if (!hasWriteAccess()) {
    const note = document.createElement("p");
    note.className = "readonly-note";
    note.textContent = t("event.readOnly");
    main.append(note);
  }
}

function renderAdminPage() {
  app.innerHTML = `
    <header class="topbar topbar--admin">
      <div class="topbar__row">
        <a class="brand" href="#/">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">${esc(CONFIG.SITE_TITLE)}</span>
        </a>
        <div class="topbar__right">
          <div class="langpick">
            <button class="btn btn--ghost btn--small" data-lang-toggle>
              ${esc(LANGS.find(l => l.code === getLang())?.short ?? "EN")}</button>
            <ul class="langmenu" data-lang-menu hidden>
              ${LANGS.map(l => `<li><button data-lang="${l.code}">${esc(l.label)}</button></li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </header>
    <main class="page" id="main"></main>`;

  const toggle = el("[data-lang-toggle]", app);
  const menu = el("[data-lang-menu]", app);
  toggle.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  menu.querySelectorAll("[data-lang]").forEach(b => {
    b.onclick = () => { menu.hidden = true; setLang(b.dataset.lang); };
  });
  document.addEventListener("click", () => { menu.hidden = true; });

  renderAdmin(el("#main", app));
}

/* ============================================================
   Router
   ============================================================ */

function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  if (hash.startsWith("/admin")) renderAdminPage();
  else renderCalendarPage();
}

/* ============================================================
   Boshlash
   ============================================================ */

subscribe(() => { if (!location.hash.startsWith("#/admin")) renderCalendarPage(); });
onLangChange(() => route());
window.addEventListener("hashchange", route);

document.documentElement.lang = getLang();
document.title = CONFIG.SITE_TITLE;
route();

refresh().catch(err => {
  toast(err.message, "err");
  const main = el("#main", app);
  if (main) {
    main.innerHTML = `
      <div class="empty">
        <p class="empty__title">${esc(err.message)}</p>
        <button class="btn" id="retry">${esc(t("common.retry"))}</button>
      </div>`;
    el("#retry", main).onclick = () => location.reload();
  }
});

// Boshqa qurilmadagi o'zgarishlarni har 60 soniyada olib keladi
setInterval(() => {
  if (document.hidden || document.querySelector(".backdrop")) return;
  refresh().catch(() => {});
}, 60000);
