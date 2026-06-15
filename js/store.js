/*
 * store.js — data access layer
 * Merges the base genealogy data with locally-saved supplemental edits,
 * and derives relationships (children, siblings, couples) on demand.
 */
(function () {
  "use strict";

  const LS_KEY = "maimon-family-supplements-v1";
  const LS_ADD_KEY = "maimon-family-additions-v1";
  const SUPPLEMENT_FIELDS = ["bio", "notes", "photos", "events", "links", "occupation", "burial", "alsoKnownAs"];

  function loadJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch (e) {
      console.warn("Could not parse stored data for", key, e);
      return {};
    }
  }

  function loadSupplements() { return loadJSON(LS_KEY); }

  function saveSupplements(supps) {
    localStorage.setItem(LS_KEY, JSON.stringify(supps));
  }

  const Store = {
    base: window.FAMILY_DATA,
    supplements: loadSupplements(),
    // People added in the browser (descendants, spouses, etc.).
    additions: loadJSON(LS_ADD_KEY),

    /** The raw base record for an id, whether built-in or added. */
    _core(id) {
      return this.base.people[id] || this.additions[id] || null;
    },

    _persistAdditions() {
      localStorage.setItem(LS_ADD_KEY, JSON.stringify(this.additions));
    },

    /** Returns a merged person record (base/added + supplemental edits). */
    get(id) {
      const b = this._core(id);
      if (!b) return null;
      const s = this.supplements[id] || {};
      return Object.assign({ id }, b, s, {
        // shallow merge of nested objects we care about
        birth: Object.assign({}, b.birth, s.birth),
        death: Object.assign({}, b.death, s.death),
        added: !!this.additions[id]
      });
    },

    allIds() {
      return Object.keys(this.base.people).concat(Object.keys(this.additions));
    },

    all() {
      return this.allIds().map((id) => this.get(id));
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

    /** Saves fields for a person and persists. Added people are edited in place. */
    update(id, patch) {
      if (this.additions[id]) {
        Object.assign(this.additions[id], patch);
        this._persistAdditions();
      } else {
        const current = this.supplements[id] || {};
        this.supplements[id] = Object.assign({}, current, patch);
        saveSupplements(this.supplements);
      }
    },

    /** Writes a single field to the right store (additions vs supplement override). */
    _setField(id, field, value) {
      if (this.additions[id]) {
        this.additions[id][field] = value;
        this._persistAdditions();
      } else {
        this.supplements[id] = this.supplements[id] || {};
        this.supplements[id][field] = value;
        saveSupplements(this.supplements);
      }
    },

    /** Build a unique slug id from a name. */
    _uniqueId(name) {
      let base = String(name).toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "person";
      let id = base, n = 2;
      while (this._core(id)) { id = base + "-" + n++; }
      return id;
    },

    /** Create a brand-new person. Returns the new id. */
    addPerson(data) {
      const id = this._uniqueId(data.name || "person");
      this.additions[id] = Object.assign(
        { name: "", gender: "", line: "", birth: {}, death: {}, spouses: [], parents: [] },
        data
      );
      this._persistAdditions();
      return id;
    },

    /** Add a new child to a person (and their spouse, if given). Returns new id. */
    addChild(parentIds, data) {
      const parents = (Array.isArray(parentIds) ? parentIds : [parentIds]).filter(Boolean);
      const lineSeed = this.get(parents[0]);
      return this.addPerson(Object.assign({ line: lineSeed ? lineSeed.line : "", parents }, data));
    },

    /** Add a new spouse to a person, linking both directions. Returns new id. */
    addSpouse(personId, data) {
      const seed = this.get(personId);
      const sid = this.addPerson(Object.assign(
        { line: seed ? seed.line : "", spouses: [personId] }, data));
      this._setField(personId, "spouses", this.spousesOf(personId).concat(sid));
      return sid;
    },

    /** Add a new parent to a person. Returns new id. */
    addParent(childId, data) {
      const seed = this.get(childId);
      const pid = this.addPerson(Object.assign({ line: seed ? seed.line : "" }, data));
      this._setField(childId, "parents", (this.get(childId).parents || []).concat(pid));
      return pid;
    },

    /** Whether a person can be deleted (only browser-added people). */
    canDelete(id) { return !!this.additions[id]; },

    deletePerson(id) {
      if (!this.additions[id]) return false;
      delete this.additions[id];
      // Scrub references from other added people.
      Object.keys(this.additions).forEach((other) => {
        const p = this.additions[other];
        if (p.parents) p.parents = p.parents.filter((x) => x !== id);
        if (p.spouses) p.spouses = p.spouses.filter((x) => x !== id);
      });
      // Scrub references stored as supplement overrides on base people.
      Object.keys(this.supplements).forEach((other) => {
        const s = this.supplements[other];
        if (s.parents) s.parents = s.parents.filter((x) => x !== id);
        if (s.spouses) s.spouses = s.spouses.filter((x) => x !== id);
      });
      this._persistAdditions();
      saveSupplements(this.supplements);
      return true;
    },

    hasSupplements(id) {
      const s = this.supplements[id];
      if (!s) return false;
      return SUPPLEMENT_FIELDS.some((f) => {
        const v = s[f];
        return Array.isArray(v) ? v.length : !!v;
      });
    },

    /** Export merged data (base + edits + additions) as a people.js to commit. */
    exportData() {
      const merged = { roots: this.base.roots, lines: this.base.lines, people: {} };
      this.allIds().forEach((id) => {
        const p = this.get(id);
        delete p.id;
        delete p.added;
        merged.people[id] = p;
      });
      return "window.FAMILY_DATA = " + JSON.stringify(merged, null, 2) + ";\n";
    },

    resetSupplements() {
      this.supplements = {};
      this.additions = {};
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_ADD_KEY);
    }
  };

  function yearOf(dateStr) {
    const m = String(dateStr).match(/\b(1[5-9]\d\d|20\d\d)\b/);
    return m ? m[1] : String(dateStr);
  }

  Store.yearOf = yearOf;
  window.Store = Store;
})();
