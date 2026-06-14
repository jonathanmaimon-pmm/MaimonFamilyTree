/*
 * store.js — data access layer
 * Merges the base genealogy data with locally-saved supplemental edits,
 * and derives relationships (children, siblings, couples) on demand.
 */
(function () {
  "use strict";

  const LS_KEY = "maimon-family-supplements-v1";
  const SUPPLEMENT_FIELDS = ["bio", "notes", "photos", "events", "links", "occupation", "burial", "alsoKnownAs"];

  function loadSupplements() {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || {};
    } catch (e) {
      console.warn("Could not parse saved supplements:", e);
      return {};
    }
  }

  function saveSupplements(supps) {
    localStorage.setItem(LS_KEY, JSON.stringify(supps));
  }

  const Store = {
    base: window.FAMILY_DATA,
    supplements: loadSupplements(),

    /** Returns a merged person record (base + supplemental edits). */
    get(id) {
      const b = this.base.people[id];
      if (!b) return null;
      const s = this.supplements[id] || {};
      return Object.assign({ id }, b, s, {
        // shallow merge of nested objects we care about
        birth: Object.assign({}, b.birth, s.birth),
        death: Object.assign({}, b.death, s.death)
      });
    },

    all() {
      return Object.keys(this.base.people).map((id) => this.get(id));
    },

    line(id) {
      return this.base.lines[id] || { label: id, color: "#888" };
    },

    colorFor(person) {
      return person && person.line ? this.line(person.line).color : "#888";
    },

    /** Children = anyone listing this id among their parents. */
    childrenOf(id) {
      return this.all()
        .filter((p) => (p.parents || []).includes(id))
        .map((p) => p.id);
    },

    /** Siblings = share at least one parent (excluding self). */
    siblingsOf(id) {
      const me = this.get(id);
      if (!me || !me.parents || !me.parents.length) return [];
      const parentSet = new Set(me.parents);
      return this.all()
        .filter((p) => p.id !== id && (p.parents || []).some((par) => parentSet.has(par)))
        .map((p) => p.id);
    },

    spousesOf(id) {
      const me = this.get(id);
      return me ? (me.spouses || []).slice() : [];
    },

    /** The (up to two) parents, ordered father-first when gender known. */
    parentsOf(id) {
      const me = this.get(id);
      if (!me) return [];
      return (me.parents || []).slice().sort((a, b) => {
        const ga = this.get(a)?.gender, gb = this.get(b)?.gender;
        if (ga === "M" && gb !== "M") return -1;
        if (gb === "M" && ga !== "M") return 1;
        return 0;
      });
    },

    /** A short life-span label, e.g. "1924–1944" or "b. 1885". */
    lifespan(person) {
      const by = person.birth && person.birth.date ? yearOf(person.birth.date) : "";
      const dy = person.death && person.death.date ? yearOf(person.death.date) : "";
      if (by && dy) return by + "–" + dy;
      if (by) return "b. " + by;
      if (dy) return "d. " + dy;
      if (person.death && person.death.deceased) return "Deceased";
      return "";
    },

    /** Saves supplemental fields for a person and persists to localStorage. */
    update(id, patch) {
      const current = this.supplements[id] || {};
      this.supplements[id] = Object.assign({}, current, patch);
      saveSupplements(this.supplements);
    },

    hasSupplements(id) {
      const s = this.supplements[id];
      if (!s) return false;
      return SUPPLEMENT_FIELDS.some((f) => {
        const v = s[f];
        return Array.isArray(v) ? v.length : !!v;
      });
    },

    /** Export merged data as a downloadable people.js for committing. */
    exportData() {
      const merged = { roots: this.base.roots, lines: this.base.lines, people: {} };
      Object.keys(this.base.people).forEach((id) => {
        const p = this.get(id);
        delete p.id;
        merged.people[id] = p;
      });
      return "window.FAMILY_DATA = " + JSON.stringify(merged, null, 2) + ";\n";
    },

    resetSupplements() {
      this.supplements = {};
      localStorage.removeItem(LS_KEY);
    }
  };

  function yearOf(dateStr) {
    const m = String(dateStr).match(/\b(1[5-9]\d\d|20\d\d)\b/);
    return m ? m[1] : String(dateStr);
  }

  Store.yearOf = yearOf;
  window.Store = Store;
})();
