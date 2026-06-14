# Maimon Family Tree

An interactive, browsable family tree assembled from six MyHeritage genealogy
reports. It stitches four ancestral lineages together through the two people
they all converge on — **Aviva Liberman** (b. 1924, Sosnowiec) and her husband
**Leopold Waserman** (b. 1924, Kraków):

| Line | Apex ancestor | Color |
| --- | --- | --- |
| **Liberman** | Icek Liberman (b. 1844) | blue |
| **Gelbard** | Lewek Gelbard | green |
| **Thaller** | Abram Chaim Thaller (b. 1865, Chrzanów) | amber |
| **Waserman** | Chaskel / Jozef Waserman (b. 1859, Tarnów) | purple |

70 family members are recorded across roughly five generations.

## Using it

Open `index.html` in any browser — no build step or server required.

- **Browse** — the view centers on one person, showing their parents above,
  spouse beside, siblings around, and children below. Click any relative to
  recenter the tree on them.
- **Search** — find anyone by name or birthplace from the top bar.
- **Lines** — the colored legend jumps to the top of each ancestral line.
- **Details** — every person has a side panel with their facts, relationships,
  and any supplemental information.

## Adding supplemental information

Click **✎ Add / edit info** on anyone's detail panel to record a biography,
notes, occupation, photo URLs, life events, and source links. A small ✦ marks
people who have supplemental info.

Edits save instantly in your browser (localStorage). To make them **permanent
and shareable**, click **⬇ Export data**, which downloads an updated
`people.js` — replace `data/people.js` with it and commit.

You can also edit `data/people.js` directly; it is plain, commented data.

## Files

```
index.html        — page shell
css/styles.css    — styling
data/people.js    — the genealogy data (edit this to add info permanently)
js/store.js       — data layer: merges edits, derives relationships
js/app.js         — the interactive navigator, detail panel, search, editor
```

## Notes & caveats

A few relationships (some spouse pairings in the Thaller and Waserman reports)
were inferred from the layout adjacency in the original charts; those people
carry a note saying so. As more records surface, correct or expand any entry in
`data/people.js`.
