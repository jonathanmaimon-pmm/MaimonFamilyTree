/*
 * app.js — interactive family-tree navigator
 * A person-centered view: parents above, the focus person with spouses and
 * siblings in the middle, and children below. Click any relative to recenter.
 */
(function () {
  "use strict";

  const S = window.Store;

  const state = {
    focusId: null,
    history: [],
    selectedId: null
  };

  const el = {
    stage: document.getElementById("stage"),
    connectors: document.getElementById("connectors"),
    detail: document.getElementById("detail"),
    search: document.getElementById("search"),
    results: document.getElementById("search-results"),
    backBtn: document.getElementById("back-btn"),
    breadcrumb: document.getElementById("breadcrumb")
  };

  /* ----------------------------- initials avatar ----------------------------- */
  function initials(name) {
    const parts = name.replace(/\(.*?\)/g, "").trim().split(/\s+/);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function avatarHTML(p, size) {
    const color = S.colorFor(p);
    const photo = (p.photos && p.photos[0]) || "";
    if (photo) {
      return `<span class="avatar" style="--c:${color};width:${size}px;height:${size}px">
        <img src="${escapeAttr(photo)}" alt="${escapeAttr(p.name)}"></span>`;
    }
    return `<span class="avatar" style="--c:${color};width:${size}px;height:${size}px">
      <span class="avatar-initials">${escapeHTML(initials(p.name))}</span></span>`;
  }

  /* ------------------------------- person card ------------------------------- */
  function card(id, opts) {
    opts = opts || {};
    const p = S.get(id);
    if (!p) return document.createComment("missing:" + id);
    const node = document.createElement("button");
    node.className = "person" + (opts.focus ? " is-focus" : "") +
      (opts.dim ? " is-dim" : "") + (S.hasSupplements(id) ? " has-supp" : "");
    node.dataset.id = id;
    node.style.setProperty("--c", S.colorFor(p));
    const size = opts.focus ? 64 : 46;
    node.innerHTML = `
      ${avatarHTML(p, size)}
      <span class="person-meta">
        <span class="person-name">${escapeHTML(p.name)}</span>
        <span class="person-life">${escapeHTML(S.lifespan(p))}</span>
        ${p.birth && p.birth.place ? `<span class="person-place">${escapeHTML(p.birth.place)}</span>` : ""}
      </span>`;
    node.addEventListener("click", function (e) {
      e.stopPropagation();
      if (opts.focus) { selectPerson(id); return; }
      focusOn(id);
    });
    return node;
  }

  function groupRow(ids, label, opts) {
    const wrap = document.createElement("div");
    wrap.className = "row " + (opts && opts.className || "");
    if (label) {
      const l = document.createElement("div");
      l.className = "row-label";
      l.textContent = label;
      wrap.appendChild(l);
    }
    const inner = document.createElement("div");
    inner.className = "row-cards";
    ids.forEach((id) => inner.appendChild(card(id, opts)));
    wrap.appendChild(inner);
    return wrap;
  }

  /* ------------------------------ main render ------------------------------ */
  function render() {
    const focus = S.get(state.focusId);
    if (!focus) return;
    el.stage.innerHTML = "";

    const parents = S.parentsOf(state.focusId);
    const spouses = S.spousesOf(state.focusId);
    const siblings = S.siblingsOf(state.focusId);
    // Children include those shared with any spouse.
    const childSet = new Set(S.childrenOf(state.focusId));
    spouses.forEach((sp) => S.childrenOf(sp).forEach((c) => childSet.add(c)));
    const children = Array.from(childSet);

    // --- Parents generation ---
    if (parents.length) {
      el.stage.appendChild(groupRow(parents, "Parents", { className: "gen-parents", id: "row-parents" }));
    }

    // --- Focus generation: siblings (left) | focus + spouses (center) ---
    const mid = document.createElement("div");
    mid.className = "row gen-focus";
    const midInner = document.createElement("div");
    midInner.className = "row-cards focus-cluster";

    siblings.forEach((id) => midInner.appendChild(card(id, { dim: true })));

    const couple = document.createElement("div");
    couple.className = "couple";
    couple.appendChild(card(state.focusId, { focus: true }));
    spouses.forEach((sp) => {
      const link = document.createElement("span");
      link.className = "couple-link";
      couple.appendChild(link);
      couple.appendChild(card(sp));
    });
    midInner.appendChild(couple);
    mid.appendChild(midInner);
    el.stage.appendChild(mid);

    // --- Children generation ---
    if (children.length) {
      el.stage.appendChild(groupRow(children, "Children", { className: "gen-children", id: "row-children" }));
    }

    drawConnectors(parents, spouses, children);
    updateChrome(focus);
    if (!state.selectedId) selectPerson(state.focusId, true);
  }

  /* --------------------------- SVG connector lines --------------------------- */
  function drawConnectors(parents, spouses, children) {
    const svg = el.connectors;
    svg.innerHTML = "";
    const stageRect = el.stage.getBoundingClientRect();
    svg.setAttribute("width", stageRect.width);
    svg.setAttribute("height", stageRect.height);

    const focusEl = el.stage.querySelector(".person.is-focus");
    if (!focusEl) return;
    const fc = centerOf(focusEl, stageRect);

    function line(x1, y1, x2, y2, cls) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const my = (y1 + y2) / 2;
      path.setAttribute("d", `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`);
      path.setAttribute("class", "link " + (cls || ""));
      svg.appendChild(path);
    }

    // focus -> parents (junction above focus)
    if (parents.length) {
      const pEls = parents.map((id) => el.stage.querySelector(`.gen-parents .person[data-id="${cssEsc(id)}"]`)).filter(Boolean);
      const pts = pEls.map((e) => centerOf(e, stageRect));
      pts.forEach((pt) => line(fc.x, fc.top, pt.x, pt.bottom, "link-parent"));
    }
    // focus -> children
    if (children.length) {
      children.forEach((id) => {
        const ce = el.stage.querySelector(`.gen-children .person[data-id="${cssEsc(id)}"]`);
        if (ce) { const pt = centerOf(ce, stageRect); line(fc.x, fc.bottom, pt.x, pt.top, "link-child"); }
      });
    }
  }

  function centerOf(node, stageRect) {
    const r = node.getBoundingClientRect();
    return {
      x: r.left - stageRect.left + r.width / 2,
      y: r.top - stageRect.top + r.height / 2,
      top: r.top - stageRect.top,
      bottom: r.bottom - stageRect.top
    };
  }

  /* ------------------------------- chrome/UI -------------------------------- */
  function updateChrome(focus) {
    el.backBtn.disabled = state.history.length === 0;
    el.breadcrumb.innerHTML = "";
    const line = S.line(focus.line);
    const chip = document.createElement("span");
    chip.className = "line-chip";
    chip.style.setProperty("--c", line.color);
    chip.textContent = line.label + " line";
    el.breadcrumb.appendChild(chip);
  }

  /* ------------------------------ navigation -------------------------------- */
  function focusOn(id, skipHistory) {
    if (!S.get(id)) return;
    if (state.focusId && !skipHistory) state.history.push(state.focusId);
    state.focusId = id;
    state.selectedId = null;
    render();
  }

  function goBack() {
    if (!state.history.length) return;
    state.focusId = state.history.pop();
    state.selectedId = null;
    render();
  }

  /* ----------------------------- detail panel ------------------------------- */
  function selectPerson(id, silent) {
    state.selectedId = id;
    el.stage.querySelectorAll(".person.is-selected").forEach((n) => n.classList.remove("is-selected"));
    const node = el.stage.querySelector(`.person[data-id="${cssEsc(id)}"]`);
    if (node) node.classList.add("is-selected");
    renderDetail(id);
  }

  function relationLinks(label, ids) {
    if (!ids.length) return "";
    const links = ids.map((id) => {
      const p = S.get(id);
      if (!p) return "";
      return `<button class="rel-link" data-goto="${escapeAttr(id)}" style="--c:${S.colorFor(p)}">${escapeHTML(p.name)}</button>`;
    }).join("");
    return `<div class="detail-rel"><h4>${label}</h4><div class="rel-links">${links}</div></div>`;
  }

  function renderDetail(id) {
    const p = S.get(id);
    if (!p) return;
    const line = S.line(p.line);
    const parents = S.parentsOf(id);
    const spouses = S.spousesOf(id);
    const siblings = S.siblingsOf(id);
    const children = S.childrenOf(id);

    const facts = [];
    if (p.birth && (p.birth.date || p.birth.place))
      facts.push(["Born", [p.birth.date, p.birth.place].filter(Boolean).join(" · ")]);
    if (p.death && (p.death.date || p.death.place))
      facts.push(["Died", [p.death.date, p.death.place].filter(Boolean).join(" · ")]);
    else if (p.death && p.death.deceased)
      facts.push(["Status", "Deceased"]);
    if (p.occupation) facts.push(["Occupation", p.occupation]);
    if (p.alsoKnownAs) facts.push(["Also known as", p.alsoKnownAs]);
    if (p.burial) facts.push(["Burial", p.burial]);

    const events = (p.events || []).map((ev) =>
      `<li><span class="ev-date">${escapeHTML(ev.date || "")}</span><span class="ev-text">${escapeHTML(ev.text || "")}</span></li>`
    ).join("");
    const linksList = (p.links || []).map((lk) =>
      `<li><a href="${escapeAttr(lk.url)}" target="_blank" rel="noopener">${escapeHTML(lk.label || lk.url)}</a></li>`
    ).join("");
    const gallery = (p.photos || []).map((src) =>
      `<img src="${escapeAttr(src)}" alt="${escapeAttr(p.name)}" class="gallery-img">`
    ).join("");

    el.detail.innerHTML = `
      <div class="detail-head" style="--c:${line.color}">
        ${avatarHTML(p, 92)}
        <h2>${escapeHTML(p.name)}</h2>
        <div class="detail-life">${escapeHTML(S.lifespan(p))}</div>
        <span class="line-chip" style="--c:${line.color}">${line.label} line</span>
      </div>
      <div class="detail-actions">
        <button class="btn" data-action="focus">Center tree here</button>
        <button class="btn btn-ghost" data-action="edit">✎ Add / edit info</button>
      </div>
      ${facts.length ? `<dl class="facts">${facts.map(([k, v]) =>
        `<div><dt>${k}</dt><dd>${escapeHTML(v)}</dd></div>`).join("")}</dl>` : ""}
      ${gallery ? `<div class="gallery">${gallery}</div>` : ""}
      ${p.bio ? `<div class="detail-section"><h4>Biography</h4><p>${escapeHTML(p.bio).replace(/\n/g, "<br>")}</p></div>` : ""}
      ${events ? `<div class="detail-section"><h4>Life events</h4><ul class="events">${events}</ul></div>` : ""}
      ${p.notes ? `<div class="detail-section"><h4>Notes</h4><p class="muted">${escapeHTML(p.notes).replace(/\n/g, "<br>")}</p></div>` : ""}
      ${linksList ? `<div class="detail-section"><h4>Links & sources</h4><ul class="links">${linksList}</ul></div>` : ""}
      ${relationLinks("Parents", parents)}
      ${relationLinks("Spouse" + (spouses.length > 1 ? "s" : ""), spouses)}
      ${relationLinks("Siblings", siblings)}
      ${relationLinks("Children", children)}
    `;

    el.detail.querySelector('[data-action="focus"]').addEventListener("click", () => focusOn(id));
    el.detail.querySelector('[data-action="edit"]').addEventListener("click", () => openEditor(id));
    el.detail.querySelectorAll("[data-goto]").forEach((b) =>
      b.addEventListener("click", () => { focusOn(b.dataset.goto); }));
    el.detail.classList.add("active");
  }

  /* ------------------------------- editor ---------------------------------- */
  function openEditor(id) {
    const p = S.get(id);
    const modal = document.getElementById("editor");
    const events = (p.events || []).map((e) => `${e.date || ""} | ${e.text || ""}`).join("\n");
    const photos = (p.photos || []).join("\n");
    const links = (p.links || []).map((l) => `${l.label || ""} | ${l.url || ""}`).join("\n");
    modal.querySelector(".editor-body").innerHTML = `
      <h3>Edit · ${escapeHTML(p.name)}</h3>
      <label>Occupation<input data-f="occupation" value="${escapeAttr(p.occupation || "")}"></label>
      <label>Also known as<input data-f="alsoKnownAs" value="${escapeAttr(p.alsoKnownAs || "")}"></label>
      <label>Burial place<input data-f="burial" value="${escapeAttr(p.burial || "")}"></label>
      <label>Biography<textarea data-f="bio" rows="5">${escapeHTML(p.bio || "")}</textarea></label>
      <label>Notes<textarea data-f="notes" rows="3">${escapeHTML(p.notes || "")}</textarea></label>
      <label>Photo URLs <span class="hint">(one per line)</span>
        <textarea data-f="photos" rows="3">${escapeHTML(photos)}</textarea></label>
      <label>Life events <span class="hint">(one per line: date | description)</span>
        <textarea data-f="events" rows="4">${escapeHTML(events)}</textarea></label>
      <label>Links & sources <span class="hint">(one per line: label | url)</span>
        <textarea data-f="links" rows="3">${escapeHTML(links)}</textarea></label>
    `;
    modal.classList.add("active");
    modal.dataset.editing = id;
  }

  function saveEditor() {
    const modal = document.getElementById("editor");
    const id = modal.dataset.editing;
    if (!id) return;
    const get = (f) => modal.querySelector(`[data-f="${f}"]`).value.trim();
    const patch = {
      occupation: get("occupation"),
      alsoKnownAs: get("alsoKnownAs"),
      burial: get("burial"),
      bio: get("bio"),
      notes: get("notes"),
      photos: get("photos").split("\n").map((s) => s.trim()).filter(Boolean),
      events: get("events").split("\n").map((l) => {
        const [date, ...rest] = l.split("|");
        const text = rest.join("|").trim();
        if (!date.trim() && !text) return null;
        return { date: date.trim(), text };
      }).filter(Boolean),
      links: get("links").split("\n").map((l) => {
        const [label, ...rest] = l.split("|");
        const url = rest.join("|").trim();
        if (!url) return null;
        return { label: label.trim(), url };
      }).filter(Boolean)
    };
    S.update(id, patch);
    modal.classList.remove("active");
    render();
    selectPerson(id);
  }

  /* ------------------------------- search ---------------------------------- */
  function runSearch(q) {
    q = q.trim().toLowerCase();
    el.results.innerHTML = "";
    if (!q) { el.results.classList.remove("active"); return; }
    const matches = S.all().filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.birth && p.birth.place && p.birth.place.toLowerCase().includes(q))
    ).slice(0, 12);
    matches.forEach((p) => {
      const b = document.createElement("button");
      b.className = "result";
      b.style.setProperty("--c", S.colorFor(p));
      b.innerHTML = `<span class="result-name">${escapeHTML(p.name)}</span>
        <span class="result-sub">${escapeHTML(S.lifespan(p))}${p.birth && p.birth.place ? " · " + escapeHTML(p.birth.place) : ""}</span>`;
      b.addEventListener("click", () => {
        el.search.value = "";
        el.results.classList.remove("active");
        focusOn(p.id);
      });
      el.results.appendChild(b);
    });
    el.results.classList.toggle("active", matches.length > 0);
  }

  /* ---------------------------- export / import ----------------------------- */
  function exportData() {
    const blob = new Blob([S.exportData()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "people.js";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------------ utilities -------------------------------- */
  function escapeHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHTML(s); }
  function cssEsc(s) { return String(s).replace(/"/g, '\\"'); }

  /* -------------------------------- wiring --------------------------------- */
  function init() {
    el.backBtn.addEventListener("click", goBack);
    el.search.addEventListener("input", (e) => runSearch(e.target.value));
    el.search.addEventListener("focus", (e) => runSearch(e.target.value));
    document.addEventListener("click", (e) => {
      if (!el.results.contains(e.target) && e.target !== el.search)
        el.results.classList.remove("active");
    });

    document.getElementById("export-btn").addEventListener("click", exportData);
    document.getElementById("home-btn").addEventListener("click", () => focusOn(S.base.roots[0]));

    const modal = document.getElementById("editor");
    modal.querySelector(".editor-save").addEventListener("click", saveEditor);
    modal.querySelectorAll(".editor-close, .editor-backdrop").forEach((n) =>
      n.addEventListener("click", () => modal.classList.remove("active")));

    // line legend filters -> jump to that line's apex ancestor
    document.querySelectorAll(".legend [data-line]").forEach((b) =>
      b.addEventListener("click", () => {
        const apex = { liberman: "icek-liberman", gelbard: "lewek-gelbard",
          thaller: "abram-chaim-thaller", waserman: "chaskel" }[b.dataset.line];
        if (apex) focusOn(apex);
      }));

    window.addEventListener("resize", () => {
      const focus = S.get(state.focusId);
      if (focus) drawConnectors(S.parentsOf(state.focusId), S.spousesOf(state.focusId),
        Array.from(new Set([].concat(S.childrenOf(state.focusId),
          ...S.spousesOf(state.focusId).map((sp) => S.childrenOf(sp))))));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.getElementById("editor").classList.remove("active");
        el.results.classList.remove("active");
      }
    });

    // Start on a grandparent.
    focusOn(S.base.roots[0], true);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
