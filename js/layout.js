/*
 * layout.js — computes a generational layout for the whole family.
 * Assigns each person a generation (vertical band) by walking out from the
 * root couple, then orders and positions people horizontally with a few
 * barycenter passes to keep parents above their children and reduce crossings.
 */
(function () {
  "use strict";

  const NODE_W = 158;
  const NODE_H = 60;
  const GAP_X = 26;
  const GAP_Y = 96;
  const MIN_DX = NODE_W + GAP_X;

  function computeGenerations(S) {
    const gen = {};
    const queue = [];
    (S.base.roots || []).forEach((id) => { if (S.get(id)) { gen[id] = 0; queue.push(id); } });
    if (!queue.length) {
      const first = S.allIds()[0];
      if (first) { gen[first] = 0; queue.push(first); }
    }
    while (queue.length) {
      const id = queue.shift();
      const g = gen[id];
      const relate = (other, og) => {
        if (other && gen[other] === undefined) { gen[other] = og; queue.push(other); }
      };
      S.spousesOf(id).forEach((s) => relate(s, g));
      S.parentsOf(id).forEach((p) => relate(p, g - 1));
      S.childrenOf(id).forEach((c) => relate(c, g + 1));
    }
    // Anyone unreachable (e.g. an added person with no links yet) lands at gen 0.
    S.allIds().forEach((id) => { if (gen[id] === undefined) gen[id] = 0; });
    return gen;
  }

  /** The set of direct ancestors of the roots, the roots, and all descendants
   *  (plus the spouses of everyone in that set). This is the "convergence" view. */
  function lineageSet(S) {
    const keep = new Set();
    const roots = (S.base.roots || []).slice();
    // ancestors (walk up through parents)
    const up = roots.slice();
    while (up.length) {
      const id = up.shift();
      if (keep.has(id)) continue;
      keep.add(id);
      S.parentsOf(id).forEach((p) => up.push(p));
    }
    // descendants (walk down through children)
    const down = roots.slice();
    while (down.length) {
      const id = down.shift();
      if (keep.has(id) && id !== roots[0] && id !== roots[1] && !roots.includes(id)) { /* still descend */ }
      keep.add(id);
      S.childrenOf(id).forEach((c) => { if (!keep.has(c)) down.push(c); });
    }
    // include spouses of everyone kept (so couples show together)
    Array.from(keep).forEach((id) => S.spousesOf(id).forEach((s) => keep.add(s)));
    return keep;
  }

  function compute(S, opts) {
    opts = opts || {};
    const gen = computeGenerations(S);
    let ids = S.allIds().filter((id) => S.get(id));
    if (opts.mode === "lineage") {
      const keep = lineageSet(S);
      ids = ids.filter((id) => keep.has(id));
    }
    const idSet = new Set(ids);
    // Relationship accessors restricted to the visible set.
    const parentsOf = (id) => S.parentsOf(id).filter((p) => idSet.has(p));
    const childrenOf = (id) => S.childrenOf(id).filter((c) => idSet.has(c));
    const spousesOf = (id) => S.spousesOf(id).filter((s) => idSet.has(s));

    // Group into layers, normalized so the topmost generation is 0.
    let minG = Infinity, maxG = -Infinity;
    ids.forEach((id) => { minG = Math.min(minG, gen[id]); maxG = Math.max(maxG, gen[id]); });
    const layers = [];
    for (let g = minG; g <= maxG; g++) layers.push([]);
    ids.forEach((id) => layers[gen[id] - minG].push(id));

    // Initial ordering: top layer by line then name; lower layers by parent order.
    const order = {}; // id -> index within layer
    const lineRank = Object.keys(S.base.lines);
    function lineIdx(id) { const p = S.get(id); return Math.max(0, lineRank.indexOf(p.line)); }

    layers[0].sort((a, b) => lineIdx(a) - lineIdx(b) || S.get(a).name.localeCompare(S.get(b).name));
    layers[0].forEach((id, i) => order[id] = i);

    for (let li = 1; li < layers.length; li++) {
      layers[li].sort((a, b) => key(a) - key(b) || lineIdx(a) - lineIdx(b));
      layers[li].forEach((id, i) => order[id] = i);
    }
    function key(id) {
      const ps = parentsOf(id).filter((p) => order[p] !== undefined);
      if (!ps.length) return 1e6;
      return ps.reduce((s, p) => s + order[p], 0) / ps.length;
    }

    // Barycenter passes (down then up) to settle ordering.
    for (let pass = 0; pass < 6; pass++) {
      const downward = pass % 2 === 0;
      const range = downward ? rangeAsc(layers.length) : rangeDesc(layers.length);
      range.forEach((li) => {
        const bary = {};
        layers[li].forEach((id) => {
          const rel = downward
            ? parentsOf(id).concat(spousesOf(id))
            : childrenOf(id).concat(spousesOf(id));
          const vals = rel.map((r) => order[r]).filter((v) => v !== undefined);
          bary[id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : order[id];
        });
        layers[li].sort((a, b) => bary[a] - bary[b]);
        layers[li].forEach((id, i) => order[id] = i);
      });
    }

    // Group each layer into "blocks": a couple is one block so spouses stay
    // adjacent; everyone else is a block of one. Blocks are positioned as units.
    const COUPLE_DX = NODE_W + 8; // tight spacing inside a couple
    const x = {}, y = {};
    const blockLayers = layers.map((layer, li) => {
      const yy = li * (NODE_H + GAP_Y);
      const seen = new Set();
      const blocks = [];
      layer.forEach((id) => {
        if (seen.has(id)) return;
        const members = [id];
        seen.add(id);
        const spouse = spousesOf(id).find((s) => !seen.has(s) && layer.includes(s));
        if (spouse) { members.push(spouse); seen.add(spouse); }
        members.forEach((m) => { y[m] = yy; });
        blocks.push({ members: members, width: (members.length - 1) * COUPLE_DX, x: 0 });
      });
      blocks.forEach((b, i) => { b.x = i * (MIN_DX + 40); place(b); });
      return blocks;
    });

    function place(b) { // assign member x from block center
      const start = b.x - b.width / 2;
      b.members.forEach((m, i) => { x[m] = start + i * COUPLE_DX; });
    }

    // Barycenter passes on blocks, with overlap resolution.
    for (let pass = 0; pass < 16; pass++) {
      blockLayers.forEach((blocks) => {
        blocks.forEach((b) => {
          const rel = [];
          b.members.forEach((m) => {
            parentsOf(m).forEach((r) => rel.push(r));
            childrenOf(m).forEach((r) => rel.push(r));
          });
          const vals = rel.map((r) => x[r]).filter((v) => v !== undefined);
          if (vals.length) b.x = vals.reduce((a, c) => a + c, 0) / vals.length;
        });
        blocks.sort((a, b) => a.x - b.x);
        for (let i = 1; i < blocks.length; i++) {
          const minStart = blocks[i - 1].x + blocks[i - 1].width / 2 + MIN_DX + blocks[i].width / 2;
          if (blocks[i].x < minStart) blocks[i].x = minStart;
        }
        blocks.forEach(place);
      });
    }

    // Normalize to positive coordinates with padding.
    let minX = Infinity, maxX = -Infinity, maxY = -Infinity;
    ids.forEach((id) => { minX = Math.min(minX, x[id]); maxX = Math.max(maxX, x[id]); maxY = Math.max(maxY, y[id]); });
    const padX = 60, padY = 50;
    const pos = {};
    ids.forEach((id) => { pos[id] = { x: x[id] - minX + padX, y: y[id] + padY }; });

    return {
      pos: pos,
      gen: gen,
      nodeW: NODE_W, nodeH: NODE_H,
      width: (maxX - minX) + NODE_W + padX * 2,
      height: maxY + NODE_H + padY * 2,
      rootGen: -minG
    };
  }

  function rangeAsc(n) { return Array.from({ length: n }, (_, i) => i); }
  function rangeDesc(n) { return rangeAsc(n).reverse(); }

  window.Layout = { compute: compute };
})();
