import { CONFIG } from "./config.js";
import { t, LANGS, getLang, setLang, onLangChange, formatMonthYear } from "./i18n.js";
import {
  store, el, esc, subscribe, emit, refresh, canEdit, setSession,
  downloadICS, toast, hasWriteAccess, categoryLabel,
  toggleCategory, setQuery, visibleOccurrences,
} from "./core.js";
import { renderCalendar, renderList, openAuthModal, openEventForm, openAuditDrawer } from "./views.js";
import { renderAdmin } from "./admin.js";

const app = el("#app");
const configured = () => Boolean(CONFIG.GIST_ID);

/* ============================================================
   Bo'laklar
   ============================================================ */

function brandHTML() {
  return `
    <a class="brand" href="#/">
      <svg class="brand__mark" viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
        <rect x="2.5" y="5.5" width="23" height="20" rx="3.5" fill="none"
              stroke="currentColor" stroke-width="1.6"/>
        <path d="M2.5 11.5h23" stroke="currentColor" stroke-width="1.6"/>
        <path d="M9 2.5v5M19 2.5v5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="7" y="15" width="5" height="5" rx="1.2" fill="var(--red)"/>
      </svg>
      <span class="brand__name">${esc(CONFIG.SITE_TITLE)}</span>
    </a>`;
}

function langHTML() {
  return `
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
    </div>`;
}

function wireLang(root) {
  const toggle = el("[data-lang-toggle]", root);
  const menu = el("[data-lang-menu]", root);
  if (!toggle) return;
  toggle.onclick = e => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };
  menu.querySelectorAll("[data-lang]").forEach(btn => {
    btn.onclick = () => { menu.hidden = true; setLang(btn.dataset.lang); };
  });
}

document.addEventListener("click", () => {
  document.querySelectorAll("[data-lang-menu]").forEach(m => { m.hidden = true; });
});

/* ============================================================
   Header
   ============================================================ */

function headerHTML() {
  const signed = canEdit();
  return `
    <header class="topbar">
      <div class="topbar__row">
        ${brandHTML()}
        <div class="topbar__right">
          ${langHTML()}
          <button class="btn btn--ghost btn--small" data-history>${esc(t("nav.history"))}</button>
          ${signed
            ? `<span class="whoami">${esc(store.session.username)}</span>
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
          <div class="search">
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/>
              <path d="M13.2 13.2L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <input class="search__input" data-search type="search"
                   placeholder="${esc(t("search.placeholder"))}"
                   value="${esc(store.query)}" aria-label="${esc(t("search.placeholder"))}">
          </div>
          <div class="segmented segmented--view">
            <label><input type="radio" name="view" value="calendar"
                   ${store.view === "calendar" ? "checked" : ""}><span>${esc(t("nav.calendarView"))}</span></label>
            <label><input type="radio" name="view" value="list"
                   ${store.view === "list" ? "checked" : ""}><span>${esc(t("nav.listView"))}</span></label>
          </div>
          <button class="btn btn--small" data-print>${esc(t("print.btn"))}</button>
          <button class="btn btn--small" data-export>${esc(t("nav.export"))}</button>
          <button class="btn btn--primary btn--small" data-add>${esc(t("nav.addEvent"))}</button>
        </div>
      </div>
    </header>`;
}

function filterBarHTML() {
  return `
    <div class="filters">
      <span class="filters__label">${esc(t("filter.label"))}</span>
      ${CONFIG.CATEGORIES.map(c => {
        const off = store.hidden.has(c.id);
        return `<button class="fchip${off ? " fchip--off" : ""}" style="--c:${esc(c.color)}"
                        data-cat="${esc(c.id)}" aria-pressed="${!off}">
                  ${esc(categoryLabel(c))}
                </button>`;
      }).join("")}
    </div>`;
}

/* Qidiruv maydonidagi fokusni yangilanishdan keyin tiklaymiz */
let searchFocused = false;
let searchTimer = null;

function wireControls(root) {
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

  const search = el("[data-search]", root);
  search.addEventListener("focus", () => { searchFocused = true; });
  search.addEventListener("blur", () => { searchFocused = false; });
  search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setQuery(search.value), 220);
  });

  el("[data-print]", root).onclick = () => window.print();

  el("[data-export]", root).onclick = () => {
    const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365);
    const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 730);
    const occs = visibleOccurrences(from, to);
    if (!occs.length) return toast(t("export.nothing"), "err");
    downloadICS(occs);
    toast(t("export.done", { n: occs.length }), "ok");
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

  root.querySelectorAll("[data-cat]").forEach(btn => {
    btn.onclick = () => toggleCategory(btn.dataset.cat);
  });

  wireLang(root);
}

/* ============================================================
   Sahifalar
   ============================================================ */

function setupScreen() {
  app.innerHTML = `
    <header class="topbar"><div class="topbar__row">${brandHTML()}
      <div class="topbar__right">${langHTML()}</div></div></header>
    <main class="page">
      <div class="panel panel--narrow">
        <h1 class="panel__title">${esc(t("setup.title"))}</h1>
        <p class="setup__body">${esc(t("setup.body"))}</p>
        <ol class="setup__steps">
          <li>${esc(t("setup.s1"))}</li>
          <li>${esc(t("setup.s2"))}</li>
          <li>${esc(t("setup.s3"))}</li>
        </ol>
        <p class="setup__hint">${esc(t("setup.hint"))}</p>
      </div>
    </main>`;
  wireLang(app);
}

function renderCalendarPage() {
  app.innerHTML = headerHTML() + filterBarHTML() + `<main class="page" id="main"></main>`;
  wireControls(app);

  if (searchFocused) {
    const s = el("[data-search]", app);
    s.focus();
    s.setSelectionRange(s.value.length, s.value.length);
  }

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
        ${brandHTML()}
        <div class="topbar__right">${langHTML()}</div>
      </div>
    </header>
    <main class="page" id="main"></main>`;
  wireLang(app);
  renderAdmin(el("#main", app));
}

/* ============================================================
   Router
   ============================================================ */

function route() {
  if (!configured()) return setupScreen();
  const hash = location.hash.replace(/^#/, "") || "/";
  if (hash.startsWith("/admin")) renderAdminPage();
  else renderCalendarPage();
}

/* ============================================================
   Boshlash
   ============================================================ */

subscribe(() => {
  if (configured() && !location.hash.startsWith("#/admin")) renderCalendarPage();
});
onLangChange(() => route());
window.addEventListener("hashchange", route);

document.documentElement.lang = getLang();
document.title = CONFIG.SITE_TITLE;
route();

if (configured()) {
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

  // Boshqa qurilmadagi o'zgarishlarni olib keladi
  setInterval(() => {
    if (document.hidden || document.querySelector(".backdrop") || searchFocused) return;
    refresh().catch(() => {});
  }, 60000);
}
