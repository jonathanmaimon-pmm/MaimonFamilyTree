/*
 * Maimon Family Tree — core genealogy data
 * ------------------------------------------------------------------
 * Transcribed from six MyHeritage genealogy reports covering the four
 * great-grandparent lineages of Aviva Liberman & Leopold Waserman:
 *
 *   • Descendants of Icek Liberman        (Liberman line — blue)
 *   • Descendants of Lewek Gelbard        (Gelbard line  — green)
 *   • Descendants of Abram Chaim Thaller  (Thaller line  — amber)
 *   • Family tree of Jozef Waserman       (Waserman line — purple)
 *
 * Relationships are stored on each person as `parents` (0–2 ids) and
 * `spouses` (ids). Children and siblings are derived in code, so the
 * graph stays consistent no matter how many supplemental edits are made.
 *
 * To add information about a person you can edit this file directly, OR
 * use the in-app editor (pencil icon) which saves to your browser and
 * lets you export an updated copy of this data.
 */

window.FAMILY_DATA = {
  // The two people the whole tree converges on (paternal grandparents).
  roots: ["aviva-liberman", "leopold-waserman"],

  // Color-coded ancestral lines.
  lines: {
    liberman: { label: "Liberman", color: "#3b6ea5" },
    gelbard:  { label: "Gelbard",  color: "#4f8a5b" },
    thaller:  { label: "Thaller",  color: "#c08a2e" },
    waserman: { label: "Waserman", color: "#8a5aa8" }
  },

  people: {
    /* ====================== LIBERMAN LINE ====================== */
    "icek-liberman": {
      name: "Icek Liberman", gender: "M", line: "liberman",
      birth: { date: "1844" }, death: { deceased: true },
      spouses: ["lea-goldberg"], parents: []
    },
    "lea-goldberg": {
      name: "Lea Goldberg", gender: "F", line: "liberman",
      birth: { date: "1844" }, death: { deceased: true },
      spouses: ["icek-liberman"], parents: []
    },
    "szlama-elijasz-liberman": {
      name: "Szlama Elijasz Liberman", gender: "M", line: "liberman",
      birth: { date: "Oct 28, 1873", place: "Przedbórz" }, death: { deceased: true },
      spouses: ["ester-maria-jakubowicz"], parents: ["icek-liberman", "lea-goldberg"]
    },
    "ester-maria-jakubowicz": {
      name: "Ester Maria Jakubowicz", gender: "F", line: "liberman",
      birth: { date: "Aug 22, 1873", place: "Piotrków Trybunalski" },
      death: { date: "1928", place: "Sosnowiec", deceased: true },
      spouses: ["szlama-elijasz-liberman"], parents: []
    },
    "gersz-lejb-liberman": {
      name: "Gersz Lejb (Hersh Leib) Liberman", gender: "M", line: "liberman",
      birth: { date: "Oct 22, 1879", place: "Radomsko" }, death: { deceased: true },
      spouses: ["blima-gelbard"], parents: ["icek-liberman", "lea-goldberg"]
    },
    "mordka-liberman": {
      name: "Mordka Liberman", gender: "M", line: "liberman",
      birth: {}, death: { deceased: true },
      spouses: [], parents: ["icek-liberman", "lea-goldberg"]
    },
    "sara-liberman": {
      name: "Sara Liberman", gender: "F", line: "liberman",
      birth: {}, death: { deceased: true },
      spouses: [], parents: ["icek-liberman", "lea-goldberg"]
    },
    // Children of Szlama Elijasz & Ester Maria
    "gersz-liberman": {
      name: "Gersz Liberman", gender: "M", line: "liberman",
      birth: { date: "Jun 24, 1897", place: "Radomsko" }, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },
    "chaja-rywka-liberman": {
      name: "Chaja Rywka Liberman", gender: "F", line: "liberman",
      birth: { date: "Oct 20, 1898", place: "Radomsko" }, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },
    "jakow-liberman": {
      name: "Jakow Liberman", gender: "M", line: "liberman",
      birth: { date: "May 6, 1901", place: "Sosnowiec" }, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },
    "abram-sucher-liberman": {
      name: "Abram Sucher Liberman", gender: "M", line: "liberman",
      birth: { date: "Sep 25, 1903", place: "Sosnowiec" }, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },
    "nn-liberman": {
      name: "NN Liberman", gender: "", line: "liberman",
      birth: { place: "Sosnowiec" }, death: { deceased: true },
      spouses: [], parents: ["abram-sucher-liberman"],
      notes: "Recorded only as \"NN\" (name unknown) in the source report."
    },
    "sura-lamper": {
      name: "Sura Lamper", gender: "F", line: "liberman",
      birth: {}, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"],
      notes: "Born Liberman; \"Lamper\" appears to be a married name."
    },
    "rubin-liberman": {
      name: "Rubin Liberman", gender: "M", line: "liberman",
      birth: { date: "Jun 12, 1905", place: "Sosnowiec" }, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },
    "michel-liberman": {
      name: "Michel Liberman", gender: "M", line: "liberman",
      birth: { date: "May 22, 1908", place: "Sosnowiec" },
      death: { date: "Feb 22, 1909", place: "Sosnowiec", deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },
    "eta-bronia-liberman": {
      name: "Eta Bronia Liberman", gender: "F", line: "liberman",
      birth: { date: "Sep 5, 1913", place: "Sosnowiec" }, death: { deceased: true },
      spouses: [], parents: ["szlama-elijasz-liberman", "ester-maria-jakubowicz"]
    },

    /* ====================== GELBARD LINE ====================== */
    "lewek-gelbard": {
      name: "Lewek Gelbard", gender: "M", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["fryma-kac"], parents: []
    },
    "fryma-kac": {
      name: "Fryma Kac", gender: "F", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["lewek-gelbard"], parents: [],
      notes: "Also recorded as \"Fryna Kac\" in one report."
    },
    "isak-majer-gelbard": {
      name: "Isak Majer Gelbard", gender: "M", line: "gelbard",
      birth: { date: "1870" }, death: { deceased: true },
      spouses: [], parents: ["lewek-gelbard", "fryma-kac"]
    },
    "josef-ber-gelbard": {
      name: "Josef Ber Gelbard", gender: "M", line: "gelbard",
      birth: { date: "1874" }, death: { deceased: true },
      spouses: ["chaja-nechama-stycka-zeltsyk"], parents: ["lewek-gelbard", "fryma-kac"]
    },
    "awram-gelbard": {
      name: "Awram Gelbard", gender: "M", line: "gelbard",
      birth: { date: "1891" }, death: { deceased: true },
      spouses: ["fajga-tyberg"], parents: ["lewek-gelbard", "fryma-kac"]
    },
    // Chaja Nechama's parents
    "moszek-stycka-zeltsyk": {
      name: "Moszek Stycka-Zeltsyk", gender: "M", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["ruchla-laja-haze"], parents: []
    },
    "ruchla-laja-haze": {
      name: "Ruchla Laja Haze", gender: "F", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["moszek-stycka-zeltsyk"], parents: []
    },
    "chaja-nechama-stycka-zeltsyk": {
      name: "Chaja Nechama Stycka-Zeltsyk", gender: "F", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["josef-ber-gelbard"], parents: ["moszek-stycka-zeltsyk", "ruchla-laja-haze"]
    },
    // Fajga's parents
    "awram-jakow-tyberg": {
      name: "Awram Jakow Tyberg", gender: "M", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["chaja-frymet-epsztein"], parents: []
    },
    "chaja-frymet-epsztein": {
      name: "Chaja Frymet Epsztein", gender: "F", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["awram-jakow-tyberg"], parents: []
    },
    "fajga-tyberg": {
      name: "Fajga Tyberg", gender: "F", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: ["awram-gelbard"], parents: ["awram-jakow-tyberg", "chaja-frymet-epsztein"]
    },
    // Children of Josef Ber & Chaja Nechama
    "ita-gelbard": {
      name: "Ita Gelbard", gender: "F", line: "gelbard",
      birth: { date: "1894", place: "Radomsko" }, death: { deceased: true },
      spouses: [], parents: ["josef-ber-gelbard", "chaja-nechama-stycka-zeltsyk"]
    },
    "blima-gelbard": {
      name: "Blima Gelbard", gender: "F", line: "gelbard",
      birth: { date: "Sep 18, 1897", place: "Radomsko" }, death: { deceased: true },
      spouses: ["gersz-lejb-liberman"], parents: ["josef-ber-gelbard", "chaja-nechama-stycka-zeltsyk"]
    },
    "ejdla-gelbard": {
      name: "Ejdla Gelbard", gender: "F", line: "gelbard",
      birth: { date: "1898", place: "Radomsko" }, death: { deceased: true },
      spouses: [], parents: ["josef-ber-gelbard", "chaja-nechama-stycka-zeltsyk"]
    },
    "gitla-gelbard": {
      name: "Gitla Gelbard", gender: "F", line: "gelbard",
      birth: { date: "1900", place: "Radomsko" }, death: { deceased: true },
      spouses: ["feliks-bugajski"], parents: ["josef-ber-gelbard", "chaja-nechama-stycka-zeltsyk"]
    },
    "szajndla-gelbard": {
      name: "Szajndla Gelbard", gender: "F", line: "gelbard",
      birth: { date: "1901", place: "Radomsko" }, death: { deceased: true },
      spouses: [], parents: ["josef-ber-gelbard", "chaja-nechama-stycka-zeltsyk"]
    },
    "chana-gelbard": {
      name: "Chana Gelbard", gender: "F", line: "gelbard",
      birth: { date: "1903", place: "Radomsko" }, death: { deceased: true },
      spouses: [], parents: ["josef-ber-gelbard", "chaja-nechama-stycka-zeltsyk"]
    },
    "feliks-bugajski": {
      name: "Feliks Bugajski", gender: "M", line: "gelbard",
      birth: { date: "1906", place: "Radomsko" }, death: { deceased: true },
      spouses: ["gitla-gelbard"], parents: []
    },
    "josef-bugajski": {
      name: "Josef Bugajski", gender: "M", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: [], parents: ["feliks-bugajski", "gitla-gelbard"]
    },
    "halina-bugajski": {
      name: "Halina Bugajski", gender: "F", line: "gelbard",
      birth: {}, death: { deceased: true },
      spouses: [], parents: ["feliks-bugajski", "gitla-gelbard"]
    },

    /* ============= LIBERMAN × GELBARD (next generation) ============= */
    "lea-lola-liberman": {
      name: "Lea Lola Liberman", gender: "F", line: "liberman",
      birth: { date: "Mar 23, 1920", place: "Sosnowiec" }, death: { deceased: true },
      spouses: [], parents: ["gersz-lejb-liberman", "blima-gelbard"]
    },
    "aviva-liberman": {
      name: "Aviva Liberman", gender: "F", line: "liberman",
      birth: { date: "Dec 13, 1924", place: "Sosnowiec" }, death: { deceased: true },
      spouses: ["leopold-waserman"], parents: ["gersz-lejb-liberman", "blima-gelbard"],
      alsoKnownAs: "Aviva Maimon",
      bio: "Known after the war as Aviva Maimon. Born in Sosnowiec, she survived the Holocaust and was connected to the wartime Zionist resistance. After the war she made her way to Italy via the Bricha escape route across the Alps, where she and Leopold (Yehuda) Waserman/Maimon were together at a hachshara (emigration training camp). In June 1946 they immigrated to Eretz Israel aboard the Aliyah Bet ship Josiah Wedgwood, marrying in August 1946; the couple were married for more than 65 years.",
      events: [
        { date: "Dec 13, 1924", text: "Born in Sosnowiec" },
        { date: "1945–1946", text: "Reached Italy via the Bricha route across the Alps after the war" },
        { date: "Jun 1946", text: "Immigrated to Eretz Israel aboard the ship Josiah Wedgwood" },
        { date: "Aug 1946", text: "Married Leopold (Yehuda) Maimon" }
      ],
      links: [
        { label: "haGalil — \"Wer in Auschwitz war, träumt jede Nacht davon\" (mentions Aviva)", url: "https://www.hagalil.com/2020/11/yehuda-maimon/" },
        { label: "Obituary of her husband — Davar", url: "https://en.davar1.co.il/266188/" }
      ],
      notes: "Wife of Yehuda \"Poldek\" Maimon. Biographical details are drawn largely from accounts of her husband; the fate of her own family in Sosnowiec is not yet documented here. Researched June 2026."
    },

    /* ====================== THALLER LINE ====================== */
    "abram-chaim-thaller": {
      name: "Abram Chaim Thaller", gender: "M", line: "thaller",
      birth: { date: "Nov 13, 1865", place: "Chrzanów" }, death: { deceased: true },
      spouses: ["malka-matylda-reich"], parents: []
    },
    "malka-matylda-reich": {
      name: "Malka Matylda Reich", gender: "F", line: "thaller",
      birth: { date: "May 9, 1870", place: "Trzebinia" }, death: { deceased: true },
      spouses: ["abram-chaim-thaller"], parents: ["mordko-reich", "sosha-reich"]
    },
    "mordko-reich": {
      name: "Mordko Reich", gender: "M", line: "thaller",
      birth: {}, death: { deceased: true },
      spouses: ["sosha-reich"], parents: []
    },
    "sosha-reich": {
      name: "Sosha Reich", gender: "F", line: "thaller",
      birth: {}, death: { deceased: true },
      spouses: ["mordko-reich"], parents: []
    },
    // Children of Abram Chaim & Malka
    "chaja-thaller": {
      name: "Chaja Thaller", gender: "F", line: "thaller",
      birth: { date: "1885" }, death: { deceased: true },
      spouses: ["majer-waserman"], parents: ["abram-chaim-thaller", "malka-matylda-reich"],
      notes: "Mother of Leopold (Yehuda \"Poldek\" Maimon). A Yad Vashem biography of her son names his mother \"Sara\"; the records here name her Chaja Thaller — possibly a second given name or a discrepancy to verify. Her fate in the Holocaust is not yet documented here."
    },
    "zofia-thaller": {
      name: "Zofia Thaller", gender: "F", line: "thaller",
      birth: { date: "1891", place: "Trzebinia" }, death: { deceased: true },
      spouses: [], parents: ["abram-chaim-thaller", "malka-matylda-reich"]
    },
    "mariam-thaller": {
      name: "Mariam Thaller", gender: "F", line: "thaller",
      birth: { date: "1892", place: "Trzebinia" }, death: { deceased: true },
      spouses: [], parents: ["abram-chaim-thaller", "malka-matylda-reich"]
    },
    "salomea-zalata-thaller": {
      name: "Salomea Zalata Thaller", gender: "F", line: "thaller",
      birth: { date: "Mar 23, 1894", place: "Trzebinia" }, death: { deceased: true },
      spouses: ["dani-dawid-windisch"], parents: ["abram-chaim-thaller", "malka-matylda-reich"]
    },
    "jozef-mejloch-thaller": {
      name: "Jozef Mejloch Thaller", gender: "M", line: "thaller",
      birth: { date: "Feb 11, 1898" }, death: { deceased: true },
      spouses: ["rejzel-ittel-aryan"], parents: ["abram-chaim-thaller", "malka-matylda-reich"]
    },
    "rywka-thaller": {
      name: "Rywka Thaller", gender: "F", line: "thaller",
      birth: { date: "1900", place: "Kraków" }, death: { deceased: true },
      spouses: ["mendel-riemer"], parents: ["abram-chaim-thaller", "malka-matylda-reich"]
    },
    "ester-erna-thaller": {
      name: "Ester Erna Thaller", gender: "F", line: "thaller",
      birth: { date: "1902", place: "Kraków" }, death: { deceased: true },
      spouses: [], parents: ["abram-chaim-thaller", "malka-matylda-reich"]
    },
    "dani-dawid-windisch": {
      name: "Dani Dawid Windisch", gender: "M", line: "thaller",
      birth: {}, death: { deceased: true },
      spouses: ["salomea-zalata-thaller"], parents: [],
      notes: "Spouse pairing inferred from adjacency in the source report."
    },
    "rejzel-ittel-aryan": {
      name: "Rejzel Ittel Aryan", gender: "F", line: "thaller",
      birth: {}, death: { deceased: true },
      spouses: ["jozef-mejloch-thaller"], parents: [],
      notes: "Spouse pairing inferred from adjacency in the source report."
    },
    "mendel-riemer": {
      name: "Mendel Riemer", gender: "M", line: "thaller",
      birth: {}, death: { deceased: true },
      spouses: ["rywka-thaller"], parents: [],
      notes: "Spouse pairing inferred from adjacency in the source report."
    },

    /* ====================== WASERMAN LINE ====================== */
    "chaskel": {
      name: "Chaskel", gender: "M", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["rachela"], parents: []
    },
    "rachela": {
      name: "Rachela", gender: "F", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["chaskel"], parents: []
    },
    "abram-lieber-waserman": {
      name: "Abram Lieber Waserman", gender: "M", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["malka-geurtz"], parents: ["chaskel", "rachela"]
    },
    "malka-geurtz": {
      name: "Malka Geurtz", gender: "F", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["abram-lieber-waserman"], parents: []
    },
    "jozef-waserman": {
      name: "Jozef Waserman", gender: "M", line: "waserman",
      birth: { date: "Apr 19, 1859", place: "Tarnów" }, death: { deceased: true },
      spouses: ["kendla-frost"], parents: ["abram-lieber-waserman", "malka-geurtz"]
    },
    "kendla-frost": {
      name: "Kendla Frost", gender: "F", line: "waserman",
      birth: { date: "1861", place: "Kraków" }, death: { deceased: true },
      spouses: ["jozef-waserman"], parents: []
    },
    // Children of Jozef & Kendla
    "majer-waserman": {
      name: "Majer Waserman", gender: "M", line: "waserman",
      birth: { date: "Nov 18, 1885" }, death: { deceased: true },
      spouses: ["chaja-thaller"], parents: ["jozef-waserman", "kendla-frost"],
      notes: "Father of Leopold (Yehuda \"Poldek\" Maimon). A Yad Vashem biography of his son records the father's name as \"Meir\" — the Hebrew form of Majer."
    },
    "izaak-waserman": {
      name: "Izaak Waserman", gender: "M", line: "waserman",
      birth: { date: "Feb 20, 1887", place: "Kraków" }, death: { deceased: true },
      spouses: [], parents: ["jozef-waserman", "kendla-frost"]
    },
    "markus-waserman": {
      name: "Markus Waserman", gender: "M", line: "waserman",
      birth: { date: "Jul 2, 1889", place: "Kraków" }, death: { deceased: true },
      spouses: ["malka-kland"], parents: ["jozef-waserman", "kendla-frost"]
    },
    "bluma-waserman": {
      name: "Bluma Waserman", gender: "F", line: "waserman",
      birth: { date: "Apr 2, 1892" }, death: { deceased: true },
      spouses: ["leib-sommer"], parents: ["jozef-waserman", "kendla-frost"]
    },
    "amelia-waserman": {
      name: "Amelia Waserman", gender: "F", line: "waserman",
      birth: { date: "1900" }, death: { deceased: true },
      spouses: ["izak-feller"], parents: ["jozef-waserman", "kendla-frost"]
    },
    "chaskel-waserman": {
      name: "Chaskel Waserman", gender: "M", line: "waserman",
      birth: { date: "1902" }, death: { deceased: true },
      spouses: [], parents: ["jozef-waserman", "kendla-frost"]
    },
    "malka-kland": {
      name: "Malka Kland", gender: "F", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["markus-waserman"], parents: [],
      notes: "Spouse pairing inferred from adjacency in the source report."
    },
    "leib-sommer": {
      name: "Leib Sommer", gender: "M", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["bluma-waserman"], parents: [],
      notes: "Spouse pairing inferred from adjacency in the source report."
    },
    "izak-feller": {
      name: "Izak Feller", gender: "M", line: "waserman",
      birth: {}, death: { deceased: true },
      spouses: ["amelia-waserman"], parents: [],
      notes: "Spouse pairing inferred from adjacency in the source report."
    },
    "leonia-feller": {
      name: "Leonia Feller", gender: "F", line: "waserman",
      birth: { date: "1922" }, death: { deceased: true },
      spouses: [], parents: ["izak-feller", "amelia-waserman"]
    },

    /* ============= WASERMAN × THALLER (next generation) ============= */
    "maurycy-waserman": {
      name: "Maurycy Waserman", gender: "M", line: "waserman",
      birth: { date: "May 26, 1920", place: "Kraków" }, death: { deceased: true },
      spouses: [], parents: ["majer-waserman", "chaja-thaller"],
      notes: "Older brother of Leopold (Yehuda \"Poldek\" Maimon). A Yad Vashem biography of his brother names an older son \"Moshe\", consistent with Maurycy (a Polish form of Moshe/Moses), born 1920. His fate is not yet documented here."
    },
    "leopold-waserman": {
      name: "Leopold Waserman", gender: "M", line: "waserman",
      birth: { date: "Feb 2, 1924", place: "Kraków" },
      death: { date: "Nov 19, 2020", place: "Israel", deceased: true },
      spouses: ["aviva-liberman"], parents: ["majer-waserman", "chaja-thaller"],
      alsoKnownAs: "Yehuda \"Poldek\" Maimon (Mimon)",
      occupation: "Jewish resistance fighter (Kraków underground)",
      bio: "Known after the war as Yehuda \"Poldek\" Maimon. Born Leopold Waserman in Kraków, he studied at the city's Hebrew Gymnasium and joined the religious-Zionist Akiva youth movement in March 1940. After the Kraków Ghetto was established he joined the Jewish underground HeChalutz HaLochem (\"The Fighting Pioneer\") in the summer of 1942, serving as a coordinator of its headquarters. He took part in the Kraków resistance during the December 1942 attacks on German targets (the Cyganeria café operation). He was captured, imprisoned and tortured at Kraków's Montelupich prison, and deported to Auschwitz, where he again joined the camp underground. On January 18, 1945 he escaped the Auschwitz death march with five comrades and hid until liberation. In June 1946 he sailed to Eretz Israel aboard the Aliyah Bet ship Josiah Wedgwood together with Aviva Liberman, whom he married in August 1946; while abroad he adopted the Hebrew surname Maimon (Mimon). In later years he spoke widely to Israeli youth about his experiences and published a personal Holocaust testimony. He died on November 19, 2020, aged 96.",
      events: [
        { date: "Feb 2, 1924", text: "Born in Kraków as Leopold Waserman" },
        { date: "Mar 1940", text: "Joined the Akiva religious-Zionist youth movement" },
        { date: "Summer 1942", text: "Joined the Kraków Jewish underground, HeChalutz HaLochem" },
        { date: "Dec 22, 1942", text: "Kraków resistance attacks on German targets (Cyganeria café operation)" },
        { date: "1943", text: "Captured; imprisoned and tortured at Montelupich prison, then deported to Auschwitz" },
        { date: "Jan 18, 1945", text: "Escaped the Auschwitz death march with five comrades; hid until liberation" },
        { date: "Jun 1946", text: "Immigrated to Eretz Israel aboard the ship Josiah Wedgwood with Aviva Liberman" },
        { date: "Aug 1946", text: "Married Aviva Liberman; adopted the surname Maimon" },
        { date: "2019", text: "Lit a torch at Yad Vashem's Holocaust Remembrance Day ceremony" },
        { date: "Nov 19, 2020", text: "Died in Israel, aged 96" }
      ],
      links: [
        { label: "Yad Vashem — Yehuda Mimon (torchlighter biography)", url: "https://www.yadvashem.org/remembrance/archive/torchlighters/mimon.html" },
        { label: "Obituary — Davar: \"Krakow Ghetto Fighter, Dies at 96\"", url: "https://en.davar1.co.il/266188/" },
        { label: "Ghetto Fighters' House — Yehuda Wasserman-Maymon (Poldek)", url: "https://www.infocenters.co.il/gfh/notebook_ext.asp?book=34558&lang=eng&site=gfh" },
        { label: "USHMM — Oral history interview with Poldek Wasserman", url: "https://collections.ushmm.org/search/catalog/irn511858" },
        { label: "Palyam — Maimon, Yehuda (Poldek)", url: "http://www.palyam.org/English/IS/Maimon_Yehuda.pdf" }
      ],
      notes: "Identification is high-confidence: the family-recorded name change (Waserman → Maimon), birth on Feb 2, 1924 in Kraków, and marriage to Aviva Liberman of Sosnowiec all match the documented biography of Yehuda \"Poldek\" Maimon. Researched from public Holocaust and genealogy sources, June 2026."
    }
  }
};
