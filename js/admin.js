import { CONFIG } from "./config.js";
import { t } from "./i18n.js";
import {
  store, el, esc, uid, sha256, randomCode, readAll, writeAll,
  fmtDateTime, fmtDate, fmtTime, relTime, tokenStatus,
  toLocalInput, fromLocalInput, toast, refresh, emit,
  eventColor, categoryOf, categoryLabel, describeRule,
} from "./core.js";
import { modal, auditItemHTML, wireRestore, openEventForm } from "./views.js";

const KEY = "admin-ok";
export const isAdmin = () => sessionStorage.getItem(KEY) === "1";
export const adminLogout = () => sessionStorage.removeItem(KEY);

/* ============================================================
   Kirish
   ============================================================ */

function renderLogin(host) {
  if (!CONFIG.ADMIN_PASSWORD_HASH) {
    host.innerHTML = `<div class="panel panel--narrow">
      <p class="notice notice--warn">${esc(t("admin.notConfigured"))}</p>
    </div>`;
    return;
  }

  host.innerHTML = `
    <div class="panel panel--narrow">
      <form class="form" id="adminLogin">
        <h1 class="panel__title">${esc(t("admin.loginTitle"))}</h1>
        <label class="field">
          <span class="field__label">${esc(t("admin.passwordLabel"))}</span>
          <input name="pw" class="input" type="password" autocomplete="current-password" required>
        </label>
        <p class="form__error" data-error hidden></p>
        <button class="btn btn--primary btn--block" type="submit">${esc(t("admin.enter"))}</button>
      </form>
    </div>`;

  el("#adminLogin", host).addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    const errBox = el("[data-error]", form);
    const hash = await sha256(form.elements.pw.value);
    if (hash === CONFIG.ADMIN_PASSWORD_HASH.trim().toLowerCase()) {
      sessionStorage.setItem(KEY, "1");
      renderAdmin(host);
    } else {
      errBox.textContent = t("admin.wrongPassword");
      errBox.hidden = false;
      form.elements.pw.select();
    }
  });
}

/* ============================================================
   Panel
   ============================================================ */

export function renderAdmin(host) {
  if (!isAdmin()) return renderLogin(host);

  host.innerHTML = `
    <div class="panel">
      <div class="panel__bar">
        <h1 class="panel__title">${esc(t("admin.title"))}</h1>
        <div class="panel__bar-actions">
          <a class="btn btn--ghost" href="#/">${esc(t("admin.backToCalendar"))}</a>
          <button class="btn btn--ghost" data-logout>${esc(t("admin.logout"))}</button>
        </div>
      </div>

      <section class="block">
        <div class="block__head">
          <h2 class="block__title">${esc(t("admin.tokensTitle"))}</h2>
          <p class="block__desc">${esc(t("admin.tokensDesc"))}</p>
        </div>
        <form class="tokenform" id="tokenForm">
          <label class="field field--grow">
            <span class="field__label">${esc(t("admin.labelField"))}</span>
            <input name="label" class="input" required maxlength="80"
                   placeholder="${esc(t("admin.labelPlaceholder"))}">
          </label>
          <fieldset class="field">
            <legend class="field__label">${esc(t("admin.typeField"))}</legend>
            <div class="segmented">
              <label><input type="radio" name="type" value="single_use" checked><span>${esc(t("admin.typeSingle"))}</span></label>
              <label><input type="radio" name="type" value="timed"><span>${esc(t("admin.typeTimed"))}</span></label>
            </div>
          </fieldset>
          <label class="field" data-expires hidden>
            <span class="field__label">${esc(t("admin.expiresField"))}</span>
            <input name="expires_at" class="input" type="datetime-local">
          </label>
          <button class="btn btn--primary" type="submit">${esc(t("admin.generate"))}</button>
          <p class="form__error form__error--wide" data-error hidden></p>
        </form>
        <div id="tokenList"></div>
      </section>

      <section class="block">
        <div class="block__head">
          <h2 class="block__title">${esc(t("admin.eventsTitle"))}</h2>
        </div>
        <div id="eventList"></div>
      </section>

      <section class="block">
        <div class="block__head">
          <h2 class="block__title">${esc(t("admin.logTitle"))}</h2>
        </div>
        <div id="logList"></div>
      </section>
    </div>`;

  el("[data-logout]", host).onclick = () => { adminLogout(); renderLogin(host); };

  const form = el("#tokenForm", host);
  const expiresField = el("[data-expires]", form);
  form.querySelectorAll("input[name=type]").forEach(r => {
    r.onchange = () => { expiresField.hidden = form.elements.type.value !== "timed"; };
  });
  form.addEventListener("submit", e => { e.preventDefault(); createToken(form, host); });

  drawTokens(host);
  drawEvents(host);
  drawLog(host);
}

/* ============================================================
   Parol yaratish
   ============================================================ */

async function createToken(form, host) {
  const errBox = el("[data-error]", form);
  const btn = el("button[type=submit]", form);
  errBox.hidden = true;

  const label = form.elements.label.value.trim();
  const type = form.elements.type.value;
  const expiresRaw = form.elements.expires_at?.value;

  const fail = msg => { errBox.textContent = msg; errBox.hidden = false; };
  if (!label) return fail(t("admin.errLabel"));
  if (type === "timed") {
    if (!expiresRaw) return fail(t("admin.errExpires"));
    if (new Date(expiresRaw) <= new Date()) return fail(t("admin.errExpiresPast"));
  }

  const code = randomCode(6);
  btn.disabled = true;
  btn.textContent = t("common.loading");

  try {
    const fresh = await readAll();
    const token = {
      id: uid(),
      code_hash: await sha256(code),
      code_hint: code.slice(0, 2) + "••••",
      label,
      type,
      expires_at: type === "timed" ? fromLocalInput(expiresRaw) : null,
      used: false,
      used_by: null,
      used_at: null,
      use_count: 0,
      last_used_at: null,
      created_at: new Date().toISOString(),
    };
    const tokens = [...fresh.tokens, token];
    await writeAll({ tokens });
    store.tokens = tokens;
    store.events = fresh.events;
    store.audit = fresh.audit;

    form.reset();
    el("[data-expires]", form).hidden = true;
    drawTokens(host);
    showCode(code, label);
  } catch (err) {
    fail(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = t("admin.generate");
  }
}

function showCode(code, label) {
  const body = document.createElement("div");
  body.className = "codeshow";
  body.innerHTML = `
    <p class="notice notice--warn">${esc(t("admin.createdWarn"))}</p>
    <div class="codebox">
      <code class="codebox__code">${esc(code)}</code>
      <button class="btn btn--primary" data-copy>${esc(t("common.copy"))}</button>
    </div>
    <p class="codeshow__label">${esc(label)}</p>`;

  modal({ title: t("admin.createdTitle"), body });

  el("[data-copy]", body).onclick = async e => {
    try {
      await navigator.clipboard.writeText(code);
      e.target.textContent = t("common.copied");
    } catch {
      const r = document.createRange();
      r.selectNode(el(".codebox__code", body));
      getSelection().removeAllRanges();
      getSelection().addRange(r);
    }
  };
}

/* ============================================================
   Ro'yxatlar
   ============================================================ */

function drawTokens(host) {
  const wrap = el("#tokenList", host);
  const tokens = [...store.tokens].reverse();

  if (!tokens.length) {
    wrap.innerHTML = `<p class="muted">${esc(t("admin.noTokens"))}</p>`;
    return;
  }

  wrap.innerHTML = `<ul class="tlist">${tokens.map(tk => {
    const st = tokenStatus(tk);
    const meta = tk.type === "timed"
      ? `${t("admin.typeTimed")} · ${fmtDateTime(tk.expires_at)}`
      : t("admin.typeSingle");
    const usage = tk.used_by
      ? t("admin.usedBy", { name: tk.used_by, date: fmtDateTime(tk.used_at) })
      : t("admin.neverUsed");
    return `
      <li class="tcard tcard--${st}">
        <div class="tcard__main">
          <span class="tcard__label">${esc(tk.label)}</span>
          <span class="tcard__meta">${esc(meta)}</span>
          <span class="tcard__usage">${esc(usage)}</span>
        </div>
        <span class="tag tag--${st}">${esc(t("admin.status" + st[0].toUpperCase() + st.slice(1)))}</span>
        <button class="icon-btn icon-btn--danger" data-del="${esc(tk.id)}"
                title="${esc(t("admin.deleteToken"))}" aria-label="${esc(t("admin.deleteToken"))}">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor"
                  stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </li>`;
  }).join("")}</ul>`;

  wrap.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = async () => {
      const tk = store.tokens.find(x => x.id === btn.dataset.del);
      if (!confirm(t("admin.deleteTokenConfirm", { label: tk.label }))) return;
      try {
        const fresh = await readAll();
        const tokens = fresh.tokens.filter(x => x.id !== tk.id);
        await writeAll({ tokens });
        store.tokens = tokens;
        drawTokens(host);
        toast(t("admin.tokenDeleted"), "ok");
      } catch (err) { toast(err.message, "err"); }
    };
  });
}

function drawEvents(host) {
  const wrap = el("#eventList", host);
  const events = [...store.events].sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

  if (!events.length) {
    wrap.innerHTML = `<p class="muted">${esc(t("admin.noEvents"))}</p>`;
    return;
  }

  wrap.innerHTML = `<ul class="tlist">${events.map(e => {
    const cat = categoryOf(e);
    return `
    <li class="tcard" style="--c:${esc(eventColor(e))}">
      <span class="tcard__dot"></span>
      <div class="tcard__main">
        <span class="tcard__label">${esc(e.title)}</span>
        <span class="tcard__meta">${esc(fmtDate(e.start_at))} · ${esc(fmtTime(e.start_at))}${e.location ? " · " + esc(e.location) : ""}</span>
        <span class="tcard__usage">
          ${cat ? esc(categoryLabel(cat)) + " · " : ""}${e.rrule ? "↻ " + esc(describeRule(e.rrule)) + " · " : ""}${esc(t("event.by", { name: e.created_by ?? "—" }))}
        </span>
      </div>
      <button class="btn btn--small" data-edit="${esc(e.id)}">${esc(t("event.edit"))}</button>
    </li>`;
  }).join("")}</ul>`;

  wrap.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const ev = store.events.find(x => x.id === btn.dataset.edit);
      if (!store.session) {
        store.session = { username: "admin", label: "admin", code: null, tokenId: null };
        sessionStorage.setItem("session", JSON.stringify(store.session));
      }
      openEventForm(ev);
    };
  });
}

function drawLog(host) {
  const wrap = el("#logList", host);
  const entries = [...store.audit].reverse();
  wrap.innerHTML = entries.length
    ? `<ul class="logs">${entries.map(auditItemHTML).join("")}</ul>`
    : `<p class="muted">${esc(t("audit.empty"))}</p>`;
  wireRestore(wrap, () => { drawLog(host); drawEvents(host); });
}
