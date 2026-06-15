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

Open `index.html` in any browser — no build step or server required. There are
two ways to view the family:

### Map (overview)
A single chart of the whole family: the four ancestral lines fan up and
**converge** into the grandparents, Aviva & Leopold, with descendants growing
below. Drag to pan, scroll/pinch to zoom, and use **Fit** to frame everything.
Tap any person to open their profile.

- **Direct line** shows only direct ancestors and descendants (the clean
  convergence). **Everyone** shows all relatives recorded in the reports.

### Explore (person-centered)
Centers on one person — parents above, spouse beside, siblings around, children
below. Click any relative to recenter on them. Good for focused browsing of a
branch.

Both views share:
- **Search** — find anyone by name or birthplace from the top bar.
- **Lines** — the colored legend jumps to each ancestral line.
- **Details** — a side panel with each person's facts, relationships, and
  supplemental information.

## Growing the tree (a living document)

The records end with the grandparents, but the tree is meant to keep growing.
Open anyone's detail panel and use **+ Child**, **+ Spouse**, or **+ Parent** to
add new family members — their children, grandchildren, and so on. Added people
appear immediately in both views (drawn with a dashed outline) and can be
deleted or edited. Use **⬇ Export** to save your additions permanently (see
below).

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
js/store.js       — data layer: merges edits & additions, derives relationships
js/layout.js      — generational layout engine for the overview map
js/app.js         — map + explorer views, detail panel, search, editor, add
```

## Notes & caveats

A few relationships (some spouse pairings in the Thaller and Waserman reports)
were inferred from the layout adjacency in the original charts; those people
carry a note saying so. As more records surface, correct or expand any entry in
`data/people.js`.
