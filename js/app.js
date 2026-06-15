/*
 * app.js — interactive family-tree navigator
 * A person-centered view: parents above, the focus person with spouses and
 * siblings in the middle, and children below. Click any relative to recenter.
 */
(function () {
  "use strict";

  const S = window.Store;

  const state = {
    view: "map",            // "map" (overview) | "explore" (person-centered)
    mapMode: "lineage",     // "lineage" (direct line) | "everyone"
    map: { scale: 1, tx: 0, ty: 0, fitted: false },
    focusId: null,
    history: [],
    selectedId: null
  };

  const el = {
    stage: document.getElementById("stage"),
    connectors: document.getElementById("connectors"),
    canvasWrap: document.getElementById("canvas-wrap"),
    mapWrap: document.getElementById("map-wrap"),
    mapInner: document.getElementById("map-inner"),
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
      if (opts.focus) { selectPerson(id); openDetail(); return; }
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
    // Keep the detail panel populated, but on mobile never auto-open it —
    // the tree stays primary until the user taps the centered person.
    selectPerson(state.focusId, true);
  }

  function isMobile() {
    return window.matchMedia("(max-width: 880px)").matches;
  }
  function openDetail() {
    el.detail.classList.add("active");
  }
  function closeDetail() {
    el.detail.classList.remove("active");
  }

  /* =============================== MAP VIEW =============================== */
  function setView(view) {
    state.view = view;
    document.body.dataset.view = view;
    el.mapWrap.style.display = view === "map" ? "block" : "none";
    el.canvasWrap.style.display = view === "explore" ? "block" : "none";
    document.querySelectorAll(".view-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.view === view));
    el.backBtn.style.display = view === "explore" ? "" : "none";
    document.getElementById("map-controls").style.display = view === "map" ? "" : "none";
    if (view === "map") renderMap(); else render();
  }

  function renderMap(keepTransform) {
    const data = window.Layout.compute(S, { mode: state.mapMode === "everyone" ? "full" : "lineage" });
    state._mapData = data;
    const W = data.nodeW, H = data.nodeH;

    const NS = "http://www.w3.org/2000/svg";
    let parts = [`<svg class="map-links" width="${data.width}" height="${data.height}">`];

    // Spouse links (horizontal bar between partners)
    const drawn = new Set();
    Object.keys(data.pos).forEach((id) => {
      S.spousesOf(id).forEach((sp) => {
        if (!data.pos[sp]) return;
        const key = [id, sp].sort().join("|");
        if (drawn.has(key)) return;
        drawn.add(key);
        const a = data.pos[id], b = data.pos[sp];
        const y = Math.min(a.y, b.y) + H / 2;
        parts.push(`<line class="map-link map-link-spouse" x1="${a.x}" y1="${y}" x2="${b.x}" y2="${y}"/>`);
      });
    });

    // Parent → child links (from the couple's midpoint down to each child)
    Object.keys(data.pos).forEach((id) => {
      const parents = S.parentsOf(id).filter((p) => data.pos[p]);
      if (!parents.length) return;
      const mx = parents.reduce((s, p) => s + data.pos[p].x, 0) / parents.length;
      const my = Math.max.apply(null, parents.map((p) => data.pos[p].y)) + H;
      const c = data.pos[id];
      const midY = (my + c.y) / 2;
      parts.push(`<path class="map-link" d="M${mx},${my} C${mx},${midY} ${c.x},${midY} ${c.x},${c.y}"/>`);
    });
    parts.push("</svg>");

    // Nodes
    Object.keys(data.pos).forEach((id) => {
      const p = S.get(id);
      const pos = data.pos[id];
      const supp = S.hasSupplements(id) || p.added;
      parts.push(`<button class="map-node${p.added ? " is-added" : ""}${supp ? " has-supp" : ""}"
        data-id="${escapeAttr(id)}" style="left:${pos.x}px;top:${pos.y}px;width:${W}px;height:${H}px;--c:${S.colorFor(p)}">
        ${avatarHTML(p, 38)}
        <span class="map-node-meta">
          <span class="map-node-name">${escapeHTML(p.name)}</span>
          <span class="map-node-life">${escapeHTML(S.lifespan(p))}</span>
        </span></button>`);
    });

    el.mapInner.innerHTML = parts.join("");
    el.mapInner.style.width = data.width + "px";
    el.mapInner.style.height = data.height + "px";

    el.mapInner.querySelectorAll(".map-node").forEach((n) =>
      n.addEventListener("click", (e) => {
        e.stopPropagation();
        selectMapNode(n.dataset.id);
      }));

    if (!keepTransform && !state.map.fitted) fitMap();
    else applyMapTransform();
    if (state.selectedId) highlightMapNode(state.selectedId);
  }

  function selectMapNode(id) {
    state.selectedId = id;
    highlightMapNode(id);
    renderDetail(id);
    openDetail();
  }

  function highlightMapNode(id) {
    el.mapInner.querySelectorAll(".map-node.is-selected").forEach((n) => n.classList.remove("is-selected"));
    const n = el.mapInner.querySelector(`.map-node[data-id="${cssEsc(id)}"]`);
    if (n) n.classList.add("is-selected");
  }

  function applyMapTransform() {
    const m = state.map;
    el.mapInner.style.transform = `translate(${m.tx}px, ${m.ty}px) scale(${m.scale})`;
  }

  function fitMap() {
    const data = state._mapData;
    if (!data) return;
    const vp = el.mapWrap.getBoundingClientRect();
    const scale = Math.min(vp.width / data.width, vp.height / data.height, 1) * 0.92;
    state.map.scale = Math.max(0.15, scale);
    state.map.tx = (vp.width - data.width * state.map.scale) / 2;
    state.map.ty = 24;
    state.map.fitted = true;
    applyMapTransform();
  }

  function zoomMap(factor, cx, cy) {
    const m = state.map;
    const vp = el.mapWrap.getBoundingClientRect();
    cx = cx == null ? vp.width / 2 : cx;
    cy = cy == null ? vp.height / 2 : cy;
    const newScale = Math.min(2.5, Math.max(0.12, m.scale * factor));
    // keep the point under the cursor stable
    m.tx = cx - (cx - m.tx) * (newScale / m.scale);
    m.ty = cy - (cy - m.ty) * (newScale / m.scale);
    m.scale = newScale;
    applyMapTransform();
  }

  function initMapInteractions() {
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    el.mapWrap.addEventListener("mousedown", (e) => {
      if (e.target.closest(".map-node")) return;
      dragging = true; sx = e.clientX; sy = e.clientY; ox = state.map.tx; oy = state.map.ty;
      el.mapWrap.classList.add("grabbing");
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      state.map.tx = ox + (e.clientX - sx);
      state.map.ty = oy + (e.clientY - sy);
      applyMapTransform();
    });
    window.addEventListener("mouseup", () => { dragging = false; el.mapWrap.classList.remove("grabbing"); });
    el.mapWrap.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = el.mapWrap.getBoundingClientRect();
      zoomMap(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // touch: one finger pan, two finger pinch
    let touchDist = 0, tox = 0, toy = 0, tsx = 0, tsy = 0;
    el.mapWrap.addEventListener("touchstart", (e) => {
      if (e.target.closest(".map-node")) return;
      if (e.touches.length === 1) { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; tox = state.map.tx; toy = state.map.ty; }
      else if (e.touches.length === 2) { touchDist = touchDistance(e); }
    }, { passive: true });
    el.mapWrap.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1 && touchDist === 0) {
        state.map.tx = tox + (e.touches[0].clientX - tsx);
        state.map.ty = toy + (e.touches[0].clientY - tsy);
        applyMapTransform();
      } else if (e.touches.length === 2) {
        const d = touchDistance(e);
        if (touchDist) {
          const r = el.mapWrap.getBoundingClientRect();
          const mid = touchMidpoint(e);
          zoomMap(d / touchDist, mid.x - r.left, mid.y - r.top);
        }
        touchDist = d;
      }
    }, { passive: true });
    el.mapWrap.addEventListener("touchend", (e) => { if (e.touches.length === 0) touchDist = 0; }, { passive: true });
    el.mapWrap.addEventListener("click", (e) => {
      if (isMobile() && !e.target.closest(".map-node")) closeDetail();
    });
  }
  function touchDistance(e) {
    const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  }
  function touchMidpoint(e) {
    return { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
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
      <button class="detail-close" data-action="close" aria-label="Back to tree">← Back to tree</button>
      <div class="detail-head" style="--c:${line.color}">
        ${avatarHTML(p, 92)}
        <h2>${escapeHTML(p.name)}</h2>
        <div class="detail-life">${escapeHTML(S.lifespan(p))}</div>
        <span class="line-chip" style="--c:${line.color}">${line.label} line</span>
      </div>
      <div class="detail-actions">
        <button class="btn" data-action="focus">Explore from here</button>
        <button class="btn btn-ghost" data-action="edit">✎ Edit info</button>
      </div>
      <div class="detail-add">
        <span class="detail-add-label">Add relative:</span>
        <button class="chip-btn" data-add="child">+ Child</button>
        <button class="chip-btn" data-add="spouse">+ Spouse</button>
        <button class="chip-btn" data-add="parent">+ Parent</button>
        ${p.added ? `<button class="chip-btn chip-danger" data-action="delete">Delete</button>` : ""}
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

    el.detail.querySelector('[data-action="focus"]').addEventListener("click", () => {
      setView("explore");
      focusOn(id);
      if (isMobile()) closeDetail();
    });
    el.detail.querySelector('[data-action="edit"]').addEventListener("click", () => openEditor(id));
    const closeBtn = el.detail.querySelector('[data-action="close"]');
    if (closeBtn) closeBtn.addEventListener("click", closeDetail);
    const delBtn = el.detail.querySelector('[data-action="delete"]');
    if (delBtn) delBtn.addEventListener("click", () => {
      if (confirm("Delete " + p.name + "? This removes the person you added.")) {
        S.deletePerson(id);
        state.selectedId = null;
        if (state.view === "map") renderMap(true); else { focusOn(S.base.roots[0]); }
        closeDetail();
      }
    });
    el.detail.querySelectorAll("[data-add]").forEach((b) =>
      b.addEventListener("click", () => openAddPerson(id, b.dataset.add)));
    el.detail.querySelectorAll("[data-goto]").forEach((b) =>
      b.addEventListener("click", () => {
        if (state.view === "map") selectMapNode(b.dataset.goto);
        else focusOn(b.dataset.goto);
      }));
  }

  /* ---------------------------- add a relative ----------------------------- */
  function openAddPerson(anchorId, relation) {
    const anchor = S.get(anchorId);
    const modal = document.getElementById("add-modal");
    const verb = { child: "child of", spouse: "spouse of", parent: "parent of" }[relation];
    let coParentNote = "";
    if (relation === "child") {
      const spouses = S.spousesOf(anchorId);
      if (spouses.length) coParentNote =
        `<p class="hint">Other parent: ${escapeHTML(spouses.map((s) => S.get(s).name).join(", "))}</p>`;
    }
    modal.querySelector(".add-body").innerHTML = `
      <h3>Add ${escapeHTML(relation)}</h3>
      <p class="add-context">${escapeHTML(verb)} <strong>${escapeHTML(anchor.name)}</strong></p>
      ${coParentNote}
      <label>Full name<input data-f="name" placeholder="e.g. David Maimon" autofocus></label>
      <div class="add-row">
        <label>Sex
          <select data-f="gender"><option value="">—</option><option value="M">Male</option><option value="F">Female</option></select>
        </label>
        <label>Born<input data-f="birth" placeholder="e.g. 1952 or May 3 1952"></label>
      </div>
      <label>Birthplace<input data-f="place" placeholder="e.g. Tel Aviv"></label>`;
    modal.classList.add("active");
    modal.dataset.anchor = anchorId;
    modal.dataset.relation = relation;
    setTimeout(() => { const i = modal.querySelector('[data-f="name"]'); if (i) i.focus(); }, 30);
  }

  function saveAddPerson() {
    const modal = document.getElementById("add-modal");
    const anchorId = modal.dataset.anchor, relation = modal.dataset.relation;
    const val = (f) => { const e = modal.querySelector(`[data-f="${f}"]`); return e ? e.value.trim() : ""; };
    const name = val("name");
    if (!name) { modal.querySelector('[data-f="name"]').focus(); return; }
    const data = { name: name, gender: val("gender"), birth: {} };
    if (val("birth")) data.birth.date = val("birth");
    if (val("place")) data.birth.place = val("place");
    let newId;
    if (relation === "child") newId = S.addChild([anchorId].concat(S.spousesOf(anchorId)), data);
    else if (relation === "spouse") newId = S.addSpouse(anchorId, data);
    else newId = S.addParent(anchorId, data);
    modal.classList.remove("active");
    if (state.view === "map") { renderMap(true); selectMapNode(newId); }
    else { render(); selectPerson(newId); openDetail(); }
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
    if (state.view === "map") { renderMap(true); selectMapNode(id); }
    else { render(); selectPerson(id); }
  }

  /** Navigate to a person in whichever view is active. */
  function goToPerson(id) {
    if (state.view === "map") { selectMapNode(id); centerMapOn(id); }
    else focusOn(id);
  }

  function centerMapOn(id) {
    const data = state._mapData;
    if (!data || !data.pos[id]) return;
    const vp = el.mapWrap.getBoundingClientRect();
    const m = state.map;
    m.tx = vp.width / 2 - data.pos[id].x * m.scale;
    m.ty = vp.height / 2 - data.pos[id].y * m.scale;
    applyMapTransform();
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
        goToPerson(p.id);
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
    document.getElementById("home-btn").addEventListener("click", () => {
      state.map.fitted = false;
      setView("map"); closeDetail();
    });

    // View toggle: Map vs Explore
    document.querySelectorAll(".view-btn").forEach((b) =>
      b.addEventListener("click", () => setView(b.dataset.view)));

    // Map controls
    document.getElementById("zoom-in").addEventListener("click", () => zoomMap(1.2));
    document.getElementById("zoom-out").addEventListener("click", () => zoomMap(0.83));
    document.getElementById("zoom-fit").addEventListener("click", fitMap);
    document.querySelectorAll(".map-mode-btn").forEach((b) =>
      b.addEventListener("click", () => {
        state.mapMode = b.dataset.mode;
        document.querySelectorAll(".map-mode-btn").forEach((x) => x.classList.toggle("active", x === b));
        state.map.fitted = false;
        renderMap();
      }));
    initMapInteractions();

    // On mobile the detail panel overlays the view; tapping it closes the panel.
    document.querySelector(".canvas").addEventListener("click", (e) => {
      if (isMobile() && !e.target.closest(".person")) closeDetail();
    });

    const modal = document.getElementById("editor");
    modal.querySelector(".editor-save").addEventListener("click", saveEditor);
    modal.querySelectorAll(".editor-close, .editor-backdrop").forEach((n) =>
      n.addEventListener("click", () => modal.classList.remove("active")));

    const addModal = document.getElementById("add-modal");
    addModal.querySelector(".add-save").addEventListener("click", saveAddPerson);
    addModal.querySelectorAll(".add-close, .add-backdrop").forEach((n) =>
      n.addEventListener("click", () => addModal.classList.remove("active")));
    addModal.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") saveAddPerson(); });

    // line legend -> jump to that line's apex ancestor
    document.querySelectorAll(".legend [data-line]").forEach((b) =>
      b.addEventListener("click", () => {
        const apex = { liberman: "icek-liberman", gelbard: "lewek-gelbard",
          thaller: "abram-chaim-thaller", waserman: "chaskel" }[b.dataset.line];
        if (apex) goToPerson(apex);
      }));

    window.addEventListener("resize", () => {
      if (state.view === "explore") {
        const focus = S.get(state.focusId);
        if (focus) drawConnectors(S.parentsOf(state.focusId), S.spousesOf(state.focusId),
          Array.from(new Set([].concat(S.childrenOf(state.focusId),
            ...S.spousesOf(state.focusId).map((sp) => S.childrenOf(sp))))));
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.getElementById("editor").classList.remove("active");
        document.getElementById("add-modal").classList.remove("active");
        el.results.classList.remove("active");
        if (isMobile()) closeDetail();
      }
    });

    // Prepare explore view (so it's ready) but land on the overview Map.
    state.focusId = S.base.roots[0];
    setView("map");
    if (!isMobile()) selectMapNode(S.base.roots[0]); // pre-fill the detail panel
  }

  document.addEventListener("DOMContentLoaded", init);
})();
