import { CONFIG } from "../config.js";
import { t, daysShort, formatMonthYear, formatDayMonth } from "./i18n.js";
import {
  store, el, esc, uid, weekIndex, startOfDay, sameDay, dateKey,
  fmtTime, fmtDate, fmtDateTime, fmtDayMonth, relTime,
  toLocalInput, fromLocalInput, canEdit, saveEvent, deleteEvent,
  verifyToken, setSession, downloadICS, toast, fieldLabel, emit,
} from "./core.js";

/* ============================================================
   Modal
   ============================================================ */

let openModals = 0;

export function modal({ title, body, footer, wide = false, onMount }) {
  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";
  backdrop.innerHTML = `
    <div class="modal${wide ? " modal--wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header class="modal__head">
        <h2 class="modal__title">${esc(title)}</h2>
        <button class="icon-btn" data-close aria-label="${esc(t("common.close"))}">
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          </svg>
        </button>
      </header>
      <div class="modal__body"></div>
      ${footer ? `<footer class="modal__foot"></footer>` : ""}
    </div>`;

  const bodyHost = el(".modal__body", backdrop);
  if (typeof body === "string") bodyHost.innerHTML = body;
  else bodyHost.append(body);

  if (footer) {
    const f = el(".modal__foot", backdrop);
    if (typeof footer === "string") f.innerHTML = footer;
    else f.append(footer);
  }

  const close = () => {
    backdrop.classList.add("is-out");
    setTimeout(() => backdrop.remove(), 160);
    if (--openModals === 0) document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKey);
  };

  const onKey = e => { if (e.key === "Escape") close(); };

  backdrop.addEventListener("click", e => {
    if (e.target === backdrop || e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", onKey);

  document.body.append(backdrop);
  openModals++;
  document.body.classList.add("no-scroll");

  const focusable = backdrop.querySelector("input, textarea, button:not([data-close])");
  focusable?.focus();

  onMount?.(backdrop, close);
  return { root: backdrop, close };
}

/* ============================================================
   Kirish modali
   ============================================================ */

export function openAuthModal(after) {
  const form = document.createElement("form");
  form.className = "form";
  form.innerHTML = `
    <p class="form__intro">${esc(t("auth.subtitle"))}</p>
    <label class="field">
      <span class="field__label">${esc(t("auth.codeLabel"))}</span>
      <input name="code" class="input input--code" autocomplete="off"
             spellcheck="false" maxlength="12" placeholder="••••••" required>
    </label>
    <label class="field">
      <span class="field__label">${esc(t("auth.nameLabel"))}</span>
      <input name="username" class="input" autocomplete="name"
             placeholder="${esc(t("auth.namePlaceholder"))}"
             value="${esc(localStorage.getItem("username") || "")}" required>
    </label>
    <p class="form__error" data-error hidden></p>
    <button class="btn btn--primary btn--block" type="submit">${esc(t("auth.submit"))}</button>`;

  const m = modal({ title: t("auth.title"), body: form });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = el("button[type=submit]", form);
    const errBox = el("[data-error]", form);
    const code = form.elements.code.value;
    const username = form.elements.username.value;

    btn.disabled = true;
    btn.textContent = t("common.loading");
    errBox.hidden = true;

    try {
      const res = await verifyToken(code, username);
      if (!res.ok) {
        errBox.textContent = res.error;
        errBox.hidden = false;
        form.elements.code.select();
        return;
      }
      localStorage.setItem("username", username.trim());
      m.close();
      toast(t("auth.welcome", { name: username.trim() }), "ok");
      after?.();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = t("auth.submit");
    }
  });
}

/* ============================================================
   Tadbir modali (ko'rish / tahrirlash)
   ============================================================ */

export function openEventDetail(event) {
  const body = document.createElement("div");
  body.className = "detail";
  body.innerHTML = `
    <div class="detail__when" style="--dot:${esc(event.color)}">
      <strong>${esc(fmtDate(event.start_at))}</strong>
      <span>${esc(fmtTime(event.start_at))}${event.end_at ? " – " + esc(fmtTime(event.end_at)) : ""}</span>
    </div>
    ${event.location ? `<p class="detail__row"><span class="detail__key">${esc(t("field.location"))}</span>${esc(event.location)}</p>` : ""}
    ${event.description ? `<p class="detail__desc">${esc(event.description)}</p>` : ""}
    <p class="detail__meta">${esc(t("event.by", { name: event.created_by ?? "—" }))} · ${esc(relTime(event.updated_at ?? event.created_at))}</p>`;

  const footer = document.createElement("div");
  footer.className = "modal__actions";
  footer.innerHTML = `
    <button class="btn" data-ics>${esc(t("event.exportOne"))}</button>
    <span class="spacer"></span>
    ${canEdit()
      ? `<button class="btn btn--danger-ghost" data-del>${esc(t("common.delete"))}</button>
         <button class="btn btn--primary" data-edit>${esc(t("event.edit"))}</button>`
      : `<button class="btn btn--primary" data-signin>${esc(t("nav.signIn"))}</button>`}`;

  const m = modal({ title: event.title, body, footer });

  el("[data-ics]", footer).onclick = () => {
    downloadICS([event], `${event.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40)}.ics`);
  };
  el("[data-signin]", footer)?.addEventListener("click", () => {
    m.close();
    openAuthModal(() => openEventDetail(event));
  });
  el("[data-edit]", footer)?.addEventListener("click", () => {
    m.close();
    openEventForm(event);
  });
  el("[data-del]", footer)?.addEventListener("click", async () => {
    if (!confirm(t("event.deleteConfirm", { title: event.title }))) return;
    try {
      await deleteEvent(event.id);
      m.close();
      toast(t("event.deleted"), "ok");
    } catch (err) { toast(err.message, "err"); }
  });
}

export function openEventForm(event, presetDate) {
  const isNew = !event;
  const start = event?.start_at ?? (presetDate
    ? new Date(presetDate.getFullYear(), presetDate.getMonth(), presetDate.getDate(), 10, 0).toISOString()
    : new Date(Date.now() + 3600000).toISOString());

  const form = document.createElement("form");
  form.className = "form";
  form.innerHTML = `
    <label class="field">
      <span class="field__label">${esc(t("event.fTitle"))}</span>
      <input name="title" class="input" required maxlength="120"
             value="${esc(event?.title ?? "")}">
    </label>
    <div class="field-row">
      <label class="field">
        <span class="field__label">${esc(t("event.fStart"))}</span>
        <input name="start_at" class="input" type="datetime-local" required
               value="${esc(toLocalInput(start))}">
      </label>
      <label class="field">
        <span class="field__label">${esc(t("event.fEnd"))} <em>${esc(t("common.optional"))}</em></span>
        <input name="end_at" class="input" type="datetime-local"
               value="${esc(toLocalInput(event?.end_at))}">
      </label>
    </div>
    <label class="field">
      <span class="field__label">${esc(t("event.fLocation"))} <em>${esc(t("common.optional"))}</em></span>
      <input name="location" class="input" maxlength="120" value="${esc(event?.location ?? "")}">
    </label>
    <label class="field">
      <span class="field__label">${esc(t("event.fDesc"))} <em>${esc(t("common.optional"))}</em></span>
      <textarea name="description" class="input" rows="3" maxlength="600">${esc(event?.description ?? "")}</textarea>
    </label>
    <fieldset class="field">
      <legend class="field__label">${esc(t("event.fColor"))}</legend>
      <div class="swatches">
        ${CONFIG.COLORS.map((c, i) => `
          <label class="swatch" style="--c:${esc(c.value)}">
            <input type="radio" name="color" value="${esc(c.value)}"
              ${(event?.color ?? CONFIG.COLORS[0].value) === c.value ? "checked" : ""}>
            <span aria-label="${esc(c.name)}"></span>
          </label>`).join("")}
      </div>
    </fieldset>
    <p class="form__error" data-error hidden></p>`;

  const footer = document.createElement("div");
  footer.className = "modal__actions";
  footer.innerHTML = `
    <button class="btn" data-close type="button">${esc(t("common.cancel"))}</button>
    <span class="spacer"></span>
    <button class="btn btn--primary" data-save type="button">${esc(t("common.save"))}</button>`;

  const m = modal({ title: isNew ? t("event.new") : t("event.edit"), body: form, footer });

  el("[data-save]", footer).onclick = async () => {
    const errBox = el("[data-error]", form);
    const btn = el("[data-save]", footer);
    errBox.hidden = true;

    const draft = {
      id: event?.id,
      title: form.elements.title.value.trim(),
      description: form.elements.description.value,
      location: form.elements.location.value,
      start_at: fromLocalInput(form.elements.start_at.value),
      end_at: fromLocalInput(form.elements.end_at.value),
      color: form.elements.color.value,
    };

    const fail = msg => { errBox.textContent = msg; errBox.hidden = false; };
    if (!draft.title) return fail(t("event.errTitle"));
    if (!draft.start_at) return fail(t("event.errStart"));
    if (draft.end_at && new Date(draft.end_at) <= new Date(draft.start_at))
      return fail(t("event.errOrder"));

    btn.disabled = true;
    btn.textContent = t("common.loading");
    try {
      await saveEvent(draft);
      m.close();
      toast(isNew ? t("event.created") : t("event.updated"), "ok");
    } catch (err) {
      fail(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = t("common.save");
    }
  };
}

/* ============================================================
   Taqvim ko'rinishi
   ============================================================ */

function eventsByDay(events) {
  const map = new Map();
  for (const e of events) {
    const k = dateKey(new Date(e.start_at));
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  }
  for (const list of map.values())
    list.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  return map;
}

export function renderCalendar(host) {
  const cursor = store.cursor;
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - weekIndex(first));

  const byDay = eventsByDay(store.events);
  const today = startOfDay(new Date());
  const cells = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const inMonth = d.getMonth() === cursor.getMonth();
    const isToday = sameDay(d, today);
    const weekend = weekIndex(d) >= 5;
    const list = byDay.get(dateKey(d)) ?? [];
    const shown = list.slice(0, 3);
    const rest = list.length - shown.length;

    cells.push(`
      <div class="cell${inMonth ? "" : " cell--out"}${weekend ? " cell--weekend" : ""}${isToday ? " cell--today" : ""}"
           data-date="${dateKey(d)}">
        <button class="cell__hit" data-add="${dateKey(d)}"
                aria-label="${esc(formatDayMonth(d))}"></button>
        <span class="cell__num">${d.getDate()}</span>
        <div class="cell__events">
          ${shown.map(e => `
            <button class="chip" data-event="${esc(e.id)}" style="--c:${esc(e.color)}"
                    title="${esc(e.title)}">
              <span class="chip__time">${esc(fmtTime(e.start_at))}</span>
              <span class="chip__title">${esc(e.title)}</span>
            </button>`).join("")}
          ${rest > 0 ? `<button class="chip chip--more" data-more="${dateKey(d)}">${esc(t("calendar.more", { n: rest }))}</button>` : ""}
        </div>
      </div>`);
  }

  host.innerHTML = `
    <div class="grid">
      <div class="grid__head">
        ${daysShort().map((d, i) =>
          `<div class="grid__dow${i >= 5 ? " grid__dow--weekend" : ""}">${esc(d)}</div>`).join("")}
      </div>
      <div class="grid__body">${cells.join("")}</div>
    </div>`;

  host.querySelectorAll("[data-event]").forEach(btn => {
    btn.onclick = () => {
      const ev = store.events.find(x => x.id === btn.dataset.event);
      if (ev) openEventDetail(ev);
    };
  });

  host.querySelectorAll("[data-more]").forEach(btn => {
    btn.onclick = () => openDay(new Date(btn.dataset.more + "T00:00:00"));
  });

  host.querySelectorAll("[data-add]").forEach(btn => {
    btn.onclick = () => {
      const d = new Date(btn.dataset.add + "T00:00:00");
      if (canEdit()) openEventForm(null, d);
      else openAuthModal(() => openEventForm(null, d));
    };
  });
}

function openDay(date) {
  const list = store.events
    .filter(e => sameDay(new Date(e.start_at), date))
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

  const body = document.createElement("div");
  body.className = "daylist";
  body.innerHTML = list.map(e => `
    <button class="dayrow" data-event="${esc(e.id)}" style="--c:${esc(e.color)}">
      <span class="dayrow__time">${esc(fmtTime(e.start_at))}</span>
      <span class="dayrow__body">
        <span class="dayrow__title">${esc(e.title)}</span>
        ${e.location ? `<span class="dayrow__place">${esc(e.location)}</span>` : ""}
      </span>
    </button>`).join("");

  const m = modal({ title: formatDayMonth(date), body });
  body.querySelectorAll("[data-event]").forEach(btn => {
    btn.onclick = () => {
      m.close();
      openEventDetail(store.events.find(x => x.id === btn.dataset.event));
    };
  });
}

/* ============================================================
   Ro'yxat ko'rinishi
   ============================================================ */

export function renderList(host) {
  const now = Date.now();
  const sorted = [...store.events].sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  const upcoming = sorted.filter(e => new Date(e.end_at ?? e.start_at).getTime() >= now);
  const past = sorted.filter(e => new Date(e.end_at ?? e.start_at).getTime() < now).reverse();

  if (!sorted.length) {
    host.innerHTML = `
      <div class="empty">
        <p class="empty__title">${esc(t("list.empty"))}</p>
        <p class="empty__hint">${esc(t("list.emptyHint"))}</p>
      </div>`;
    return;
  }

  const section = (label, items, dim) => items.length ? `
    <section class="agenda${dim ? " agenda--past" : ""}">
      <h2 class="agenda__label">${esc(label)}</h2>
      ${items.map(e => `
        <button class="row" data-event="${esc(e.id)}" style="--c:${esc(e.color)}">
          <span class="row__date">
            <span class="row__day">${esc(fmtDayMonth(e.start_at))}</span>
            <span class="row__time">${esc(fmtTime(e.start_at))}</span>
          </span>
          <span class="row__main">
            <span class="row__title">${esc(e.title)}</span>
            ${e.location ? `<span class="row__place">${esc(e.location)}</span>` : ""}
          </span>
        </button>`).join("")}
    </section>` : "";

  host.innerHTML = section(t("list.upcoming"), upcoming, false) + section(t("list.past"), past, true);

  host.querySelectorAll("[data-event]").forEach(btn => {
    btn.onclick = () => openEventDetail(store.events.find(x => x.id === btn.dataset.event));
  });
}

/* ============================================================
   O'zgarishlar tarixi
   ============================================================ */

export function auditItemHTML(entry) {
  const changes = Object.keys(entry.diff?.after ?? {});
  const detail = entry.action === "UPDATE" && changes.length
    ? `<ul class="log__changes">${changes.map(k => `
        <li><span class="log__field">${esc(fieldLabel(k))}</span>
          <s>${esc(shortVal(k, entry.diff.before[k]))}</s>
          <span class="log__arrow">${esc(t("audit.arrow"))}</span>
          <b>${esc(shortVal(k, entry.diff.after[k]))}</b></li>`).join("")}</ul>`
    : "";

  return `
    <li class="log">
      <div class="log__line">
        <span class="log__who">${esc(entry.changed_by)}</span>
        <span class="log__verb log__verb--${entry.action.toLowerCase()}">${esc(t("audit." + entry.action))}</span>
        <span class="log__what">${esc(entry.event_title ?? "—")}</span>
      </div>
      ${detail}
      <time class="log__time" datetime="${esc(entry.changed_at)}">${esc(relTime(entry.changed_at))}</time>
    </li>`;
}

function shortVal(key, v) {
  if (v === null || v === undefined || v === "") return t("audit.empty_value");
  if (key === "start_at" || key === "end_at") return fmtDateTime(v);
  return String(v).length > 40 ? String(v).slice(0, 40) + "…" : String(v);
}

export function openAuditDrawer() {
  const entries = [...store.audit].reverse();
  const body = document.createElement("div");
  body.className = "logwrap";
  body.innerHTML = entries.length
    ? `<ul class="logs">${entries.map(auditItemHTML).join("")}</ul>`
    : `<div class="empty"><p class="empty__title">${esc(t("audit.empty"))}</p></div>`;
  modal({ title: t("audit.title"), body, wide: true });
}
