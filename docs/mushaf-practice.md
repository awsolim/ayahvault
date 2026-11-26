# MemoBuddy in the mushaf

Opening **Open in Mushaf** from a MemoBuddy ayah starts a practice session. Normal
mushaf navigation does not inherit concealed content. The compact bottom strip
provides **Reveal Prompt** (for a partial prompt), **Reveal Next**, and **New Ayah**.
It floats above the bottom edge in a faintly tinted pill, with reserved space
between it and the page so it cannot cover the final line of Quran text.
Tap **MemoBuddy** to open settings, configure the generator and visibility, or end practice.
The eye button beside **New Ayah** cycles immediately through Show All (blue eye),
Hide Following Ayahs (amber eye with a forward chevron), and Hide All Other Ayahs
(purple crossed-out eye). It does not open a menu or reset the reveal cursor.
Concealment also masks surah banners and unnumbered opening basmallahs, including
multiple chapter openings on one page. Show All restores them; a partial prompt
keeps headings concealed until the prompt is revealed. Numbered basmallahs follow
the visibility rules for their ayah.

## Visibility and reveals

- **Show All** displays surrounding ayahs normally. A partial starting prompt
  remains partial until explicitly revealed.
- **Hide Following Ayahs** displays the starting ayah and earlier ayahs.
- **Hide All Other Ayahs** initially displays only the starting ayah.
- **Reveal Next** cumulatively exposes one whole subsequent ayah in Quran order.
  It stops at the first gap in the generated selection. Selected disjoint ranges
  never cause a continuation to jump across omitted content.
- **Reveal All** temporarily exposes everything. **Hide Again** returns to the
  previous reveal position. **Reset Reveals** restores the original prompt.
- **New Ayah** uses the current generator configuration and resets reveals. With
  multiple candidates, a draw matching the existing question advances to the
  following candidate. Invalid configuration preserves the current question.
- Page turns, audio playback and translation browsing do not advance reveals.
  Revealing an ayah on another page moves to that page. All page fragments of an
  ayah follow the same visibility rule.

Settings in the sheet remain drafts until **Apply Settings**. Range changes apply
to the next generated question; current continuation boundaries retain their
original selection. The page frame remains fixed while controls, dialogs,
visibility, and reveal state change. Its bottom shelf stays reserved until
leaving that reader view, even after **End Practice**.

The standalone page and practice reader share a subscribed, tab-local session
store. Returning to MemoBuddy retains the generated question and configuration.
Reloading restores the reveal cursor and reader page. Visibility and tap-action
preferences persist in localStorage; session progress is not cloud Library data.

## Rendering and data generation

Page artwork is masked in native coordinates before applying existing line fits,
including the colored medallion overlays. Mask cells meet through the whitespace
between glyphs/ayahs and cover the outer line margins; simply covering the
publisher's approximate boxes leaves small ink fragments visible.

`scripts/import-mushaf.py` automatically runs `scripts/mushaf-practice-words.py`.
The latter uses the **bundled** coordinate database from the image archive and
adds `glyphs` arrays to all 604 page JSON files. It checks native position counts
against MemoBuddy's tokenization, accounts for leading rub markers and sajda
ornaments, and checks for missing positions. The unsupported references live in
`src/assets/mushaf-partial-unsupported.json`.

6,221 ayahs have matching word counts and contiguous native positions. For the
remaining 15, partial prompts stay concealed until **Reveal Prompt** is chosen;
the renderer never substitutes a full ayah implicitly. Missing word data also
fails closed. Whole-ayah practice remains available for all 6,236 ayahs.

Metadata uses the `?layout=3` request version so existing PWA caches fetch the new
glyph data. Runtime caching still applies; images are not added to the app-shell
precache. The practice UI/generator is lazy-loaded for MemoBuddy reader entry.

## Verification

`npm test` checks visibility rules, contiguous range boundaries, mask coverage,
and native word-position integrity across all pages. Browser practice tests cover
pixel-level blank-page concealment, partial prompts, cross-page reveals, temporary
Reveal All, reload and return navigation, shared generator state, fixed geometry,
disjoint ranges, and conservative unsupported prompts. Phone screenshots are
written to ignored `test-results/` during those tests.
