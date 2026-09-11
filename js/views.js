import { CONFIG } from "./config.js";
import { t, daysShort, formatDayMonth } from "./i18n.js";
import {
  store, el, esc, weekIndex, startOfDay, sameDay, dateKey,
  fmtTime, fmtDate, fmtDateTime, fmtDayMonth, relTime,
  toLocalInput, fromLocalInput, canEdit, saveEvent, deleteEvent,
  verifyToken, downloadICS, toast, fieldLabel,
  categoryOf, categoryLabel, eventColor, describeRule, FREQS,
  occDays, occSpan, visibleOccurrences, skipOccurrence, restoreEvent,
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
  backdrop.querySelector("input, textarea, select, button:not([data-close])")?.focus();

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
   Yordamchilar
   ============================================================ */

const seriesOf = occ => store.events.find(e => e.id === (occ.series_id ?? occ.id)) ?? occ;

const requireAuth = fn => (canEdit() ? fn() : openAuthModal(fn));

function catBadge(e) {
  const c = categoryOf(e);
  if (!c) return "";
  return `<span class="badge" style="--c:${esc(c.color)}">${esc(categoryLabel(c))}</span>`;
}

/* ============================================================
   Tadbir tafsiloti
   ============================================================ */

export function openEventDetail(occ) {
  const span = occSpan(occ);
  const color = eventColor(occ);

  const body = document.createElement("div");
  body.className = "detail";
  body.innerHTML = `
    <div class="detail__tags">
      ${catBadge(occ)}
      ${occ.repeating ? `<span class="badge badge--plain">↻ ${esc(describeRule(occ.rrule))}</span>` : ""}
      ${span > 1 ? `<span class="badge badge--plain">${esc(t("multi.span", { n: span }))}</span>` : ""}
    </div>
    <div class="detail__when" style="--dot:${esc(color)}">
      <strong>${esc(fmtDate(occ.start_at))}${span > 1 ? " – " + esc(fmtDate(occ.end_at)) : ""}</strong>
      <span>${esc(fmtTime(occ.start_at))}${occ.end_at ? " – " + esc(fmtTime(occ.end_at)) : ""}</span>
    </div>
    ${occ.location ? `<p class="detail__row"><span class="detail__key">${esc(t("field.location"))}</span>${esc(occ.location)}</p>` : ""}
    ${occ.description ? `<p class="detail__desc">${esc(occ.description)}</p>` : ""}
    <p class="detail__meta">${esc(t("event.by", { name: occ.created_by ?? "—" }))} · ${esc(relTime(occ.updated_at ?? occ.created_at))}</p>`;

  const footer = document.createElement("div");
  footer.className = "modal__actions";
  footer.innerHTML = `
    <button class="btn" data-ics>${esc(t("event.exportOne"))}</button>
    <span class="spacer"></span>
    <button class="btn btn--danger-ghost" data-del>${esc(t("common.delete"))}</button>
    <button class="btn btn--primary" data-edit>${esc(t("event.edit"))}</button>`;

  const m = modal({ title: occ.title, body, footer });

  el("[data-ics]", footer).onclick = () =>
    downloadICS([occ], `${occ.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40) || "tadbir"}.ics`);

  el("[data-edit]", footer).onclick = () => requireAuth(() => {
    m.close();
    openEventForm(seriesOf(occ));
  });

  el("[data-del]", footer).onclick = () => requireAuth(() => askDelete(occ, m));
}

function askDelete(occ, parent) {
  const finish = async (fn, msg) => {
    try { await fn(); parent.close(); toast(msg, "ok"); }
    catch (err) { toast(err.message, "err"); }
  };

  if (!occ.repeating) {
    if (!confirm(t("event.deleteConfirm", { title: occ.title }))) return;
    return finish(() => deleteEvent(occ.series_id ?? occ.id), t("event.deleted"));
  }

  const body = document.createElement("div");
  body.className = "choice";
  body.innerHTML = `
    <button class="choice__opt" data-one>
      <strong>${esc(t("rec.deleteOne"))}</strong>
      <span>${esc(fmtDate(occ.start_at))}</span>
    </button>
    <button class="choice__opt choice__opt--danger" data-all>
      <strong>${esc(t("rec.deleteAll"))}</strong>
      <span>${esc(describeRule(occ.rrule))}</span>
    </button>`;

  const c = modal({ title: t("rec.deleteTitle"), body });

  el("[data-one]", body).onclick = () => {
    c.close();
    finish(() => skipOccurrence(occ.series_id, occ.occ_key), t("rec.skipped"));
  };
  el("[data-all]", body).onclick = () => {
    c.close();
    finish(() => deleteEvent(occ.series_id ?? occ.id), t("event.deleted"));
  };
}

/* ============================================================
   Tadbir formasi
   ============================================================ */

export function openEventForm(event, presetDate) {
  const isNew = !event;
  const start = event?.start_at ?? (presetDate
    ? new Date(presetDate.getFullYear(), presetDate.getMonth(), presetDate.getDate(), 10, 0).toISOString()
    : new Date(Date.now() + 3600000).toISOString());
  const rule = event?.rrule ?? null;

  const form = document.createElement("form");
  form.className = "form";
  form.innerHTML = `
    <label class="field">
      <span class="field__label">${esc(t("event.fTitle"))}</span>
      <input name="title" class="input" required maxlength="120" value="${esc(event?.title ?? "")}">
    </label>

    <fieldset class="field">
      <legend class="field__label">${esc(t("event.fCategory"))}</legend>
      <div class="cats">
        ${CONFIG.CATEGORIES.map(c => `
          <label class="cat" style="--c:${esc(c.color)}">
            <input type="radio" name="category" value="${esc(c.id)}"
              ${(event?.category ?? CONFIG.CATEGORIES[0].id) === c.id ? "checked" : ""}>
            <span>${esc(categoryLabel(c))}</span>
          </label>`).join("")}
      </div>
    </fieldset>

    <div class="field-row">
      <label class="field">
        <span class="field__label">${esc(t("event.fStart"))}</span>
        <input name="start_at" class="input" type="datetime-local" required value="${esc(toLocalInput(start))}">
      </label>
      <label class="field">
        <span class="field__label">${esc(t("event.fEnd"))} <em>${esc(t("common.optional"))}</em></span>
        <input name="end_at" class="input" type="datetime-local" value="${esc(toLocalInput(event?.end_at))}">
      </label>
    </div>

    <div class="field-row">
      <label class="field">
        <span class="field__label">${esc(t("event.fRepeat"))}</span>
        <select name="freq" class="input">
          <option value="">${esc(t("rec.none"))}</option>
          ${FREQS.map(f => `<option value="${f}" ${rule?.freq === f ? "selected" : ""}>${esc(t("rec." + f))}</option>`).join("")}
        </select>
      </label>
      <label class="field" data-rec hidden>
        <span class="field__label">${esc(t("rec.interval"))}</span>
        <input name="interval" class="input" type="number" min="1" max="52" value="${esc(rule?.interval ?? 1)}">
      </label>
      <label class="field" data-rec hidden>
        <span class="field__label">${esc(t("rec.until"))} <em>${esc(t("rec.untilNone"))}</em></span>
        <input name="until" class="input" type="date" value="${esc(rule?.until ? rule.until.slice(0, 10) : "")}">
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

    ${rule ? `<p class="notice notice--info">${esc(t("rec.seriesNote"))}</p>` : ""}
    <p class="form__error" data-error hidden></p>`;

  const footer = document.createElement("div");
  footer.className = "modal__actions";
  footer.innerHTML = `
    <button class="btn" data-close type="button">${esc(t("common.cancel"))}</button>
    <span class="spacer"></span>
    <button class="btn btn--primary" data-save type="button">${esc(t("common.save"))}</button>`;

  const m = modal({ title: isNew ? t("event.new") : t("event.edit"), body: form, footer });

  const recFields = [...form.querySelectorAll("[data-rec]")];
  const syncRec = () => {
    const on = Boolean(form.elements.freq.value);
    recFields.forEach(f => { f.hidden = !on; });
  };
  form.elements.freq.onchange = syncRec;
  syncRec();

  el("[data-save]", footer).onclick = async () => {
    const errBox = el("[data-error]", form);
    const btn = el("[data-save]", footer);
    errBox.hidden = true;

    const freq = form.elements.freq.value;
    const untilRaw = form.elements.until.value;

    const draft = {
      id: event?.id,
      title: form.elements.title.value.trim(),
      description: form.elements.description.value,
      location: form.elements.location.value,
      category: form.elements.category.value,
      start_at: fromLocalInput(form.elements.start_at.value),
      end_at: fromLocalInput(form.elements.end_at.value),
      rrule: freq
        ? {
            freq,
            interval: Math.max(1, Number(form.elements.interval.value) || 1),
            until: untilRaw ? new Date(untilRaw + "T23:59:59").toISOString() : null,
          }
        : null,
    };

    const fail = msg => { errBox.textContent = msg; errBox.hidden = false; };
    if (!draft.title) return fail(t("event.errTitle"));
    if (!draft.start_at) return fail(t("event.errStart"));
    if (draft.end_at && new Date(draft.end_at) <= new Date(draft.start_at))
      return fail(t("event.errOrder"));
    if (draft.rrule?.until && new Date(draft.rrule.until) <= new Date(draft.start_at))
      return fail(t("rec.errUntil"));

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

/** Har bir sanaga o'sha kuni davom etayotgan tadbirlarni biriktiradi */
function occurrencesByDay(occs) {
  const map = new Map();
  for (const occ of occs) {
    const days = occDays(occ);
    days.forEach((key, i) => {
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ occ, part: i === 0 ? "start" : "cont", index: i + 1, total: days.length });
    });
  }
  for (const list of map.values())
    list.sort((a, b) =>
      (b.total - a.total) || (new Date(a.occ.start_at) - new Date(b.occ.start_at)));
  return map;
}

function chipHTML({ occ, part, index, total }) {
  const cont = part === "cont";
  return `
    <button class="chip${cont ? " chip--cont" : ""}" style="--c:${esc(eventColor(occ))}"
            data-occ="${esc(occ.series_id)}|${esc(occ.occ_key)}"
            title="${esc(occ.title)}${total > 1 ? " · " + esc(t("multi.dayOf", { i: index, n: total })) : ""}">
      <span class="chip__time">${cont ? "›" : esc(fmtTime(occ.start_at))}</span>
      <span class="chip__title">${esc(occ.title)}</span>
      ${occ.repeating && !cont ? `<span class="chip__rep" aria-hidden="true">↻</span>` : ""}
    </button>`;
}

export function renderCalendar(host) {
  const cursor = store.cursor;
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(1 - weekIndex(first));
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 41);

  const occs = visibleOccurrences(gridStart, gridEnd);
  const byDay = occurrencesByDay(occs);
  const today = startOfDay(new Date());
  const cells = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = dateKey(d);
    const inMonth = d.getMonth() === cursor.getMonth();
    const isToday = sameDay(d, today);
    const weekend = weekIndex(d) >= 5;
    const list = byDay.get(key) ?? [];
    const shown = list.slice(0, 3);
    const rest = list.length - shown.length;

    cells.push(`
      <div class="cell${inMonth ? "" : " cell--out"}${weekend ? " cell--weekend" : ""}${isToday ? " cell--today" : ""}">
        <button class="cell__hit" data-add="${key}" aria-label="${esc(formatDayMonth(d))}"></button>
        <span class="cell__num">${d.getDate()}</span>
        <div class="cell__events">
          ${shown.map(chipHTML).join("")}
          ${rest > 0 ? `<button class="chip chip--more" data-more="${key}">${esc(t("calendar.more", { n: rest }))}</button>` : ""}
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

  host.querySelectorAll("[data-occ]").forEach(btn => {
    btn.onclick = () => {
      const [sid, key] = btn.dataset.occ.split("|");
      const occ = occs.find(o => o.series_id === sid && o.occ_key === key);
      if (occ) openEventDetail(occ);
    };
  });

  host.querySelectorAll("[data-more]").forEach(btn => {
    btn.onclick = () => openDay(new Date(btn.dataset.more + "T00:00:00"), byDay.get(btn.dataset.more) ?? []);
  });

  host.querySelectorAll("[data-add]").forEach(btn => {
    btn.onclick = () => {
      const d = new Date(btn.dataset.add + "T00:00:00");
      requireAuth(() => openEventForm(null, d));
    };
  });
}

function openDay(date, entries) {
  const body = document.createElement("div");
  body.className = "daylist";
  body.innerHTML = entries.map(({ occ, part }) => `
    <button class="dayrow" data-key="${esc(occ.series_id)}|${esc(occ.occ_key)}" style="--c:${esc(eventColor(occ))}">
      <span class="dayrow__time">${part === "cont" ? "›" : esc(fmtTime(occ.start_at))}</span>
      <span class="dayrow__body">
        <span class="dayrow__title">${esc(occ.title)}</span>
        ${occ.location ? `<span class="dayrow__place">${esc(occ.location)}</span>` : ""}
      </span>
    </button>`).join("");

  const m = modal({ title: formatDayMonth(date), body });
  body.querySelectorAll("[data-key]").forEach(btn => {
    btn.onclick = () => {
      const entry = entries.find(e => `${e.occ.series_id}|${e.occ.occ_key}` === btn.dataset.key);
      m.close();
      if (entry) openEventDetail(entry.occ);
    };
  });
}

/* ============================================================
   Ro'yxat ko'rinishi
   ============================================================ */

export function renderList(host) {
  const now = Date.now();
  const horizon = new Date(now + 1000 * 60 * 60 * 24 * 400);
  const occs = visibleOccurrences(new Date(2000, 0, 1), horizon);

  if (!occs.length) {
    const q = store.query.trim();
    host.innerHTML = `
      <div class="empty">
        <p class="empty__title">${esc(q ? t("search.none", { q }) : t("list.empty"))}</p>
        ${q ? "" : `<p class="empty__hint">${esc(t("list.emptyHint"))}</p>`}
      </div>`;
    return;
  }

  const upcoming = occs.filter(e => new Date(e.end_at ?? e.start_at).getTime() >= now);
  const past = occs.filter(e => new Date(e.end_at ?? e.start_at).getTime() < now).reverse();

  const rowHTML = occ => {
    const span = occSpan(occ);
    return `
      <button class="row" data-key="${esc(occ.series_id)}|${esc(occ.occ_key)}" style="--c:${esc(eventColor(occ))}">
        <span class="row__date">
          <span class="row__day">${esc(fmtDayMonth(occ.start_at))}</span>
          <span class="row__time">${esc(fmtTime(occ.start_at))}</span>
        </span>
        <span class="row__main">
          <span class="row__title">${esc(occ.title)}</span>
          <span class="row__sub">
            ${catBadge(occ)}
            ${span > 1 ? `<span class="badge badge--plain">${esc(t("multi.span", { n: span }))}</span>` : ""}
            ${occ.repeating ? `<span class="badge badge--plain">↻</span>` : ""}
            ${occ.location ? `<span class="row__place">${esc(occ.location)}</span>` : ""}
          </span>
        </span>
      </button>`;
  };

  const section = (label, items, dim) => items.length ? `
    <section class="agenda${dim ? " agenda--past" : ""}">
      <h2 class="agenda__label">${esc(label)}</h2>
      ${items.map(rowHTML).join("")}
    </section>` : "";

  host.innerHTML =
    section(t("list.upcoming"), upcoming.slice(0, 200), false) +
    section(t("list.past"), past.slice(0, 100), true);

  host.querySelectorAll("[data-key]").forEach(btn => {
    btn.onclick = () => {
      const occ = occs.find(o => `${o.series_id}|${o.occ_key}` === btn.dataset.key);
      if (occ) openEventDetail(occ);
    };
  });
}

/* ============================================================
   O'zgarishlar tarixi
   ============================================================ */

function shortVal(key, v) {
  if (v === null || v === undefined || v === "") return t("audit.empty_value");
  if (key === "start_at" || key === "end_at") return fmtDateTime(v);
  if (key === "category") return categoryLabel(CONFIG.CATEGORIES.find(c => c.id === v)) || String(v);
  if (key === "rrule") return typeof v === "object" ? describeRule(v) : String(v);
  return String(v).length > 40 ? String(v).slice(0, 40) + "…" : String(v);
}

export function auditItemHTML(entry) {
  const changes = Object.keys(entry.diff?.after ?? {});
  const detail = entry.action === "UPDATE" && changes.length
    ? `<ul class="log__changes">${changes.map(k => `
        <li><span class="log__field">${esc(fieldLabel(k))}</span>
          <s>${esc(shortVal(k, entry.diff.before[k]))}</s>
          <span class="log__arrow">${esc(t("audit.arrow"))}</span>
          <b>${esc(shortVal(k, entry.diff.after[k]))}</b></li>`).join("")}</ul>`
    : "";

  const canRestore = entry.action === "DELETE" && entry.snapshot
    && !store.events.some(e => e.id === entry.snapshot.id);

  return `
    <li class="log">
      <div class="log__line">
        <span class="log__who">${esc(entry.changed_by)}</span>
        <span class="log__verb log__verb--${entry.action.toLowerCase()}">${esc(t("audit." + entry.action))}</span>
        <span class="log__what">${esc(entry.event_title ?? "—")}</span>
        ${canRestore ? `<button class="btn btn--small log__restore" data-restore="${esc(entry.id)}">${esc(t("restore.btn"))}</button>` : ""}
      </div>
      ${detail}
      <time class="log__time" datetime="${esc(entry.changed_at)}">${esc(relTime(entry.changed_at))}</time>
    </li>`;
}

export function wireRestore(root, redraw) {
  root.querySelectorAll("[data-restore]").forEach(btn => {
    btn.onclick = () => requireAuth(async () => {
      const entry = store.audit.find(a => a.id === btn.dataset.restore);
      if (!entry || !confirm(t("restore.confirm", { title: entry.snapshot?.title ?? "" }))) return;
      btn.disabled = true;
      try {
        await restoreEvent(entry.id);
        toast(t("restore.done"), "ok");
        redraw?.();
      } catch (err) {
        toast(err.message, "err");
        btn.disabled = false;
      }
    });
  });
}

export function openAuditDrawer() {
  const body = document.createElement("div");
  body.className = "logwrap";

  const draw = () => {
    const entries = [...store.audit].reverse();
    body.innerHTML = entries.length
      ? `<ul class="logs">${entries.map(auditItemHTML).join("")}</ul>`
      : `<div class="empty"><p class="empty__title">${esc(t("audit.empty"))}</p></div>`;
    wireRestore(body, draw);
  };

  draw();
  modal({ title: t("audit.title"), body, wide: true });
}
