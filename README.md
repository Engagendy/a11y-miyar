# A11y Miyar 🔍

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/cccmjnbcpcphmijhfmpnnghbdjdjdkcg?label=Chrome%20Web%20Store&color=4285F4)](https://chromewebstore.google.com/detail/a11y-lens/cccmjnbcpcphmijhfmpnnghbdjdjdkcg)
[![Firefox Add-ons](https://img.shields.io/amo/v/a11y-lens?label=Firefox%20Add-ons&color=FF7139)](https://addons.mozilla.org/en-US/firefox/addon/a11y-lens/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Install:** [Chrome / Brave / Edge](https://chromewebstore.google.com/detail/a11y-lens/cccmjnbcpcphmijhfmpnnghbdjdjdkcg) · [Firefox](https://addons.mozilla.org/en-US/firefox/addon/a11y-lens/)

A browser extension (Manifest V3) that audits any web page for accessibility issues,
powered by [axe-core](https://github.com/dequelabs/axe-core) — the same open-source
engine behind axe DevTools.

![A11y Miyar demo — scan, fix suggestions with UAE DLS tokens, live preview, DLS audit, Arabic RTL](docs/demo.gif)

## Features

- **DevTools panel** — a new "A11y Miyar" tab inside Chrome DevTools
- **One-click scan** — runs `axe.run()` on the inspected page
- **Severity summary** — critical / serious / moderate / minor counts + passed checks
- **Click-to-highlight** — click any flagged HTML snippet to outline and scroll to
  that element on the page
- **Fix guidance** — axe failure summaries and "Learn more" links per rule
- **Rule-set picker** — scan against WCAG 2.0 A / 2.0 AA / 2.1 AA / 2.2 AA (or all
  rules), optionally including axe best-practice rules
- **Iframe scanning** — axe-core is injected into every frame, so violations inside
  iframes are reported too (clicking one highlights the containing iframe)
- **Export reports** — download results as JSON, CSV, or a standalone HTML report;
  exports are available as soon as any tab has data (DLS, screen reader, manual
  tests) — the automated scan is not a prerequisite
- **Highlight all** — outline every violating element at once, color-coded by severity
  (worst impact wins when an element breaks several rules)
- **Inspect** — jump straight from a finding to the element in the Elements panel
- **Scan history & diff** — each URL's last scan is stored locally; the next scan
  shows "N new · M fixed" and tags previously-unseen findings with a NEW badge
- **Stale-results banner** — a MutationObserver watches the page after a scan;
  if the DOM changes (or the page navigates), a warning suggests re-scanning
- **Contrast checker** — pick any two colors on screen with the EyeDropper and
  see the WCAG ratio plus AA/AAA pass/fail for normal and large text
- **Guided manual tests (IGT wizards)** — a Manual tests tab with 10 guided tests
  (keyboard, focus, headings, landmarks, alt quality, zoom, screen reader, motion,
  forms). Each runs as a step-by-step wizard: one yes/no question at a time, the
  verdict computed from your answers, and every "No" recorded as a specific finding
  with an optional note and an element picked directly on the page. Interactive
  helpers (numbered tab stops, heading outline, landmark overlay, alt-text overlay)
  auto-run so the evidence is on screen while you answer. Verdicts and findings
  persist per URL and appear in JSON/CSV/HTML exports
- **Options page** — default WCAG level, best-practice toggle, flow scan interval,
  and panel language: English or العربية with full RTL layout **and fully
  translated content** (manual tests, wizard questions, and help topics)
- **Scan-history trend chart** — per-URL violation counts over the last 30 scans,
  drawn per impact level with a fixed/regressed delta
- **PDF export** — print-ready report via the browser's Save-as-PDF dialog;
  HTML/CSV/JSON exports now embed the suggested fix for every finding
- **Shadow DOM support** — findings inside open shadow roots resolve, highlight,
  and auto-fix correctly (`host >>> selector`)
- **Firefox build** — `./build-firefox.sh` produces `dist/a11y-miyar-firefox.zip`
  (event-page background, gecko id; the contrast eyedropper is Chromium-only)
- **WCAG 3.0 readiness** — honest status in the Help tab: WCAG 3 is a W3C draft;
  the tool tracks WCAG 2.0/2.1/2.2 and will add WCAG 3 when axe-core does
- **🇦🇪 UAE Design System (DLS) check** — one-click heuristic audit against the
  AEGov design system (designsystem.gov.ae, mandated for UAE federal entities):
  `aegov-` component adoption, the DLS font set (Roboto/Inter · Noto Kufi
  Arabic/Alexandria), the 5-weight limit, color conformance against the real
  115-token `@aegov/design-system@3.0.7` palette (with nearest-token suggestions
  for off-palette colors), bilingual/RTL requirements, viewport, and the
  mandated WCAG 2.2 AA level — reported as PASS/WARN/FAIL with a score
- **🔊 Screen reader tab** — what a screen reader actually receives, as six
  numbered steps (steps 5–6 optional) with a state circle each (not run /
  running / clean / issue count); **Run all checks** in the tab toolbar (or the
  header Run button) builds the reading order, checks languages, auto-walks the
  focus order and leaves live monitoring on; the *issues only* toggle in the
  toolbar filters both the reading order and the browser tree; every finding
  row keeps its issue lines visible and folds selector + fixes behind a
  "Fix · n actions" disclosure:
  - *Score + Top 5 to fix* — a 0–100 strip above the steps (PASS/WARN/FAIL
    like the DLS report) that weighs every finding by severity (critical 8,
    serious 5, moderate 2, minor 1; silent live updates 6; page-level `lang`
    problems 8, capped for the language section; duplicate names/landmarks
    count once per group), shows per-section counts and the five heaviest
    groups ("Read more ×3 links") — click one to highlight it and jump to its
    row. The score is in the HTML/JSON exports and stored per URL so the
    History trend shows it
  - *Reading order & accessible names* — every node with the role, name and state
    axe-core computes, in announcement order. Flags unnamed controls, generic
    "click here"/"read more" links, placeholder-only and title-only names,
    aria-label that drops the visible text (WCAG 2.5.3), duplicate link/button
    names with different destinations, unlabelled landmarks, clickable `div`s
    with no role, and Tab-reachable elements inside `aria-hidden`. One click
    adds the issues to the "Screen reader pass" manual test
  - *Missing state on custom controls* — the reading order also flags
    `state-missing` (serious: a `role=tab` without `aria-selected`, or a
    button/option/checkbox/switch whose `active`/`selected`/`open` class token
    has no `aria-pressed`/`selected`/`checked`/`expanded` — Tailwind variants
    such as `active:bg-blue-800` and native `<summary>` are ignored),
    `required-not-exposed` (a single visible `*` or "required"/"مطلوب" before a
    field with neither `required` nor `aria-required`; password masks and
    footnotes after the form do not count), `readonly-misuse` (`readonly` on a
    real date/time/combobox picker — picker class, date input type or calendar
    button — the user is meant to change; a display-only `created_date` is
    fine) and `stepper-no-state` (a stepper/wizard list with tick icons, icons
    on some steps only or `done`/`active` classes but no `aria-current="step"`
    and no hidden "Step 2 of 4, completed" text; a "how it works" list with an
    icon on every item is not flagged); the live monitor logs
    `state-not-announced` (serious) when a click only toggles a state class —
    on the control or an ancestor card/tab — or shows/hides its
    `aria-controls` target (or, for disclosure-looking controls, the next
    sibling) while no `aria-*` state on the control changed, naming the
    missing attribute. Finding text follows the panel language. Each has a fix snippet (toggle the
    attribute with the class, `required`, drop `readonly`, `aria-current="step"`
    + hidden step text), a "How to verify" line and, for the static ones, an
    Apply-on-page quick fix
  - *Link behaviour* — the reading order flags `link-new-window` (moderate:
    `target="_blank"`, or `formtarget` on a button, with no "opens in a new
    tab"/"نافذة جديدة" in the name, title, `aria-describedby` or hidden text),
    `link-download-hint` (moderate: a `.pdf`/`.docx`/`.xlsx`/`.zip`/`.csv` or
    `download` link whose name gives neither the file type/size nor
    "download"), `link-external-hint` (minor: another registrable domain with
    no "external"/"خارجي" hint — same-site subdomains such as
    `eservices.mohre.gov.ae` never count) and `link-as-button` (serious:
    `<a href="#">`, `href=""` or `javascript:` — announced as "same page link"
    — with a click handler or toggle/framework attribute, inside a
    pagination/breadcrumb, or on the current breadcrumb/pagination item; a bare
    "Back to top" `href="#"` is fine). A link with malformed percent-encoding
    no longer aborts the scan. Fixes: a visually-hidden "(opens in a new
    tab)" / "(PDF, 2 MB)" / "(external link)" span (with React/Vue
    `NewTabLink` variants), `<button type="button">` or the real URL, and
    `aria-current="page"` without `href` for the current item; each has a
    "How to verify" line and an Apply-on-page quick fix (hidden span, retag,
    aria-current)
  - *Form group labelling* — the reading order flags `group-no-label`
    (serious: two or more checkbox/radio controls sharing a `name` or a
    wrapper with no `<fieldset>`/`<legend>` and no named
    `role="group"`/`"radiogroup"` — a `<fieldset>` named by `aria-label`/
    `aria-labelledby` counts, an "Other: [text]" field inside the fieldset does
    not un-name it, a shared `name` across two separately labelled fieldsets is
    two groups, and two unrelated checkboxes side by side are not a set; the row
    is the container and the visible heading such as "Emirate" is offered as
    the group name — groups inside tables, menus and listboxes are skipped), `question-not-associated`
    (moderate: text ending in "?" followed within two siblings by two or more
    visible, adjacent generic Yes/No/OK/Cancel/نعم/لا buttons with no
    `role="group"`/dialog `aria-labelledby`, `aria-describedby` or fieldset
    legend tying them to the question) and `label-not-associated` (serious: a `<label>` without `for`,
    or a span/div with a `label` class or ending in ":", next to a field that
    has no accessible name or a different one — placeholder-only counts as
    different; fields with their own `<label for>` are not re-flagged by a
    group heading). Fixes reuse the visible text: `<fieldset>`/`<legend>` or
    `role="group" aria-labelledby` on the existing wrapper, `role="group"`
    around the question and its buttons (or `aria-label="Yes — question"`),
    and `<label for>` / wrapping label / `aria-labelledby` (React `htmlFor`
    and Vue variants); Apply-on-page puts `role="group"` + the heading on the
    container, `role="group"` + the question on the buttons' parent (when it
    holds nothing else) or an `aria-label` on the field, each with a "How to
    verify" line
  - *Inline diff, persisted logs, tab badge* — every "Now → Change to" fix
    shows a token-level diff (added tokens green, removed tokens struck red;
    Copy still copies the plain snippet); the live-region log, focus log
    (last 200 entries each), reading-order summary and score are saved per
    URL and restored with a "restored from <time>" note when the tab is
    reopened on the same page (Clear/Reset also clear the saved copy); the
    🔊 tab label carries the current issue count across sections, with the
    per-section breakdown in its tooltip
  - *Component-level grouping* — findings with the same markup shape (tag,
    class list, role and issue codes; the name may differ) collapse into one
    row with a "×N identical" badge, the first instance's HTML, one fix and a
    collapsible list of the N selectors (each clickable to highlight). On UAE
    DLS pages the group is labelled with the nearest `aegov-*` component
    ("aegov-card · link"). Groups carry through to the Manual test findings
    (one per group, count in the note) and to exports (`instances`,
    `selectors`)
  - *Every finding ships a fix* — "Now" (the element's real HTML) and "Change to"
    (a corrected, copy-ready snippet: `<label for>`, `role="status"` region
    created empty on load, `<button>` instead of a clickable `div`,
    `<span lang="ar">` wrapper, focus-restore JS after a delete, `showModal()`
    or `inert` for modals, `:focus-visible` CSS…) with Copy, Inspect, and
    optional AI fix; the fixes are included in the HTML/JSON exports
  - *Framework-aware fix snippets* — the same fixes rewritten for the framework
    set in Options: React/JSX (`htmlFor`, `className`, `onKeyDown`, `tabIndex`,
    self-closing void tags, `{/* */}` comments, `useRef` + `useEffect` for
    focus restore and `showModal()`) or Vue (`@click`/`@keydown`, `ref="dlg"` +
    `this.$refs.dlg.showModal()`, `:aria-label` and `v-if` hints); the
    "Change to (React):" header shows the active framework
  - *Apply fix in place, then re-verify* — mechanical fixes (`aria-label`,
    `alt`, `tabindex="0"`, `inert`, `dir="rtl"`, `lang` on `<html>` or an
    element, `role="status"` on a silent region, clickable `div` → `<button>`,
    `<span lang>` around a mixed-language run) get an "Apply on page" button,
    with an inline text box for names you must choose. The page is changed
    live, the section's check re-runs and the row turns green with "✓ fixed"
    when the issue is gone; Undo restores the original element. Changes last
    until the page reloads — copy the snippet into your source
  - *Hear it — spoken announcement playback* — a 🔈 button on every reading
    order, browser tree and focus trace row speaks what a screen reader would
    say ("Read more, link"; "Your name, edit text, required") through the
    browser's speech synthesis, with an Arabic or English voice chosen from the
    element's `lang`; "▶ Play page" reads the listed rows top to bottom while
    highlighting each element on the page, with a 0.8–2× rate slider
    (remembered); live-log entries speak their text with the politeness prefix
  - *Playback scoping* — the filter box and "issues only" decide which rows
    play (the Play button's tooltip says "Play n rows"); every reading-order and
    browser-tree row has "Play from here" (this row to the end) and "Play this
    section" (the row plus everything nested under it — a card, a nav, a form);
    "Play from element" lets you click an element on the page and starts from
    its row; while playing, Space pauses/resumes and Esc stops
  - *Bilingual AR/EN page comparison* — enter the URL of the other-language
    version (guessed from `/ar/` ↔ `/en/`, `?lang=`, or an `ar.`/`en.` host
    prefix) and "🌐↔ Compare" loads it in a hidden background tab, runs the
    same reading-order and language checks there, closes it, and diffs the two
    accessibility trees by structure (role, tag, `aegov-*` component and DOM
    path): controls present in one language only, controls or landmarks named
    in one and unnamed in the other, live regions missing on one side, heading
    counts per level, and `html lang`/`dir` on each side. Differences render
    as rows with fixes, count 2 each (capped at 20) in the score, and export as
    `bilingual: {otherUrl, differences}`
  - *Findings in the ticket exports* — every screen reader finding (reading
    order groups, silent/risky live updates, focus and auto-walk issues,
    language, journey gaps, bilingual differences) becomes a `[SR] …` issue in
    the Issues (Markdown), Jira and Azure DevOps exports and a `sr:<code>` row
    in the CSV: problem, element (selector + HTML), fix snippet + note, priority
    from the finding level and a one-line "How to verify" step per finding
    (e.g. no-name: "Tab to the control; expected announcement: 'name, button'").
  - *Live regions & silent updates* — a monitor that classifies every DOM change
    as ANNOUNCED (inside an existing live region), VIA FOCUS, MAY BE MISSED (live
    region created together with its content) or SILENT (toast, validation error,
    list refresh nobody hears)
  - *SPA route-change check* — the same monitor wraps `pushState`/`replaceState`
    and listens for `popstate`, `hashchange` and `<title>` changes (plus a URL
    poll for calls it cannot intercept); 1.5 s after the URL changes it logs a
    NAVIGATION entry with what the screen reader got: `route-silent` (same
    title, focus did not move, nothing announced — critical), `route-title-stale`
    (`document.title` unchanged — serious), `route-h1-dup` (same H1 as the
    previous page — moderate), `route-focus-stuck` (focus stranded mid-page or
    on a removed element — moderate) or `route-ok`. In-page anchors (skip
    links, "Back to top", `#section` links to an existing element) are not
    route changes; a query-only change (`?page=2`, sort/filter) keeps its
    title and H1 and is only noted as a minor `route-silent` when content
    re-rendered without an announcement. Notes are translated in the Arabic
    panel. Each carries the
    title/H1/focus/announcement diff, a fix (set `document.title`, focus the H1
    with `tabindex="-1"`, a `role="status"` route announcer — React Router /
    Vue Router variants per the framework setting), counts in the score and the
    journey transcript, and exports with a "How to verify" line. After a flow
    recording, pages that all share one `document.title` add a single "title
    never changes" finding
  - *Journey transcript* — after ⏺ Record flow stops, a 🎞 section at the top
    of the tab merges the focus trace, the live-region log and the flow's page
    labels into one chronological transcript: time, page, what was announced
    ("Read more, link"; "[polite] Saved"), with gaps in red — silent updates,
    focus lost to `<body>`, focus escaping a modal, live regions that may be
    missed, and quiet stretches where the DOM changed for over 5 s with nothing
    announced. Click a step to highlight its element; "Copy transcript" gives
    one line per step like a real screen reader transcript; the transcript is
    a table in the HTML/PDF report and `journey: {steps, gaps}` in the JSON
  - *Focus trace* — every focus move with its announced role/name/state; flags
    focus lost to `<body>` after a delete, focus escaping an open modal, focus on
    unnamed, `aria-hidden`, invisible or off-screen targets, positive tabindex,
    and missing focus styles. Runs automatically during ⏺ Record flow
  - *Focus-ring contrast and clipping* — for every `:focus-visible` stop the
    trace works out the ring the sighted user sees (outline, else the most
    visible ring-shaped box-shadow layer — offset elevation shadows are not a
    ring — else a border-colour change versus the un-focused border) and
    flags `focus-ring-low-contrast` (serious: ring colour under 3:1 against the
    effective background, ratio in the message), `focus-ring-thin` (minor: under
    2px) and `focus-ring-clipped` (moderate: an `overflow` hidden/auto/scroll
    ancestor cuts the ring + `outline-offset` off — calendars, carousels, card
    grids), each with a `:focus-visible` / wrapper-padding fix snippet; a ring
    over a background image or gradient is shown as "contrast unknown" instead
    of being measured against white
  - *Non-text contrast (WCAG 1.4.11)* — axe has no rule for it, so the
    "Non-text contrast (borders, icons, toggles)" step measures every visible
    form control, icon-only button/link and custom toggle (`role="switch"`,
    `.toggle`/`.switch`): every boundary the sighted user could rely on — each
    visible border side, the control's own background where it differs from
    the surroundings, and the strongest SVG fill/stroke or icon-font colour —
    against the effective background behind it; the best of them decides, so a
    faint decorative border on an icon button with a dark glyph passes; under
    3:1 → `nontext-contrast` (serious)
    with both swatches and the ratio, disabled controls and children of a
    failed control skipped, and a `border-color` / `fill` / `background-color`
    fix at a passing colour (nearest UAE DLS token when "DLS colors" is on)
  - *Keyboard auto-walk* — "⌨ Auto-walk" in the Focus trace toolbar moves
    focus through every Tab stop in real Tab order (positive `tabindex` first,
    then DOM order, shadow roots flattened, hidden/inert/`aria-hidden` stops
    included on purpose, 60 ms apart, up to 400 stops) while the trace records
    each stop; the summary line reports how many stops were reached, and the
    log gains issues with fixes for *unreachable* stops (the browser refused
    `focus()`), *order jumps* (focus rewinds to an earlier element after a
    positive `tabindex`) and *possible traps* (a container with an `onkeydown`
    handler or `role="dialog"` without `aria-modal` — verify by hand, script
    cannot send a real Tab key)
  - *Custom widget keyboard probe* (part of the auto-walk, **hints only**) —
    on every Tab stop that is or sits inside `role="tablist"`, `radiogroup`,
    `listbox`, `menu`, `menubar`, `tree`, `grid` or `combobox`, an
    `aria-haspopup` trigger or a `div`/`span` with `role="button"`, the walk
    dispatches synthetic ArrowRight, ArrowDown, ArrowLeft, ArrowUp (until one
    moves), Enter, Space and Escape (on the element that holds focus, then on
    the popup) and
    watches 150 ms for a focus move, an `aria-selected/expanded/checked/
    activedescendant` change, a popup (listbox/menu/dialog/grid becoming
    visible) or any DOM change; reports `widget-no-arrow-nav` (serious: arrows
    changed nothing in a tablist/radiogroup/listbox/menu — roving `tabindex`
    + `keydown` fix, React/Vue variants), `widget-no-enter-space` (moderate:
    Enter and Space changed nothing on a `role="button"` div, combobox or
    `aria-haspopup` trigger — *verify manually, synthetic keys cannot trigger
    native activation*) and `widget-esc-no-close` (moderate: the popup opened
    by Enter stayed open after Escape). Native `<select>`, date inputs,
    `contenteditable`, submit buttons, Enter inside a `<form>`, native
    `<button>`/`<a href>`/`<input>` triggers (the browser turns Enter/Space into
    a click) and `div` buttons named Delete/Logout/Submit/Pay/Accept… (the probe
    runs real handlers) are skipped,
    each probe ends with Escape + blur + re-focus, at most 40 widgets are
    probed and the score penalty is capped at 15 (serious 5 / moderate 2)
  - *Language & voice switching* — Arabic text under `lang="en"` and Latin text
    under `lang="ar"` (the screen reader picks the wrong voice), missing or
    invalid `lang`, page-majority vs `<html lang>`, Arabic rendered LTR
  - *Browser accessibility tree* (Chromium, opt-in) — the tree the browser hands
    to NVDA/VoiceOver, read through the DevTools protocol; grant the `debugger`
    permission once in Options
- **Scan settings** popover (sliders button in the header, labelled with the
  active preset, e.g. "Recommended", or the combination when customised, e.g.
  "WCAG 2.1 AA + BP") — a **Preset** row (**Recommended** = WCAG 2.2 AA + best
  practices + SR rules, the default; **Strict WCAG only**; **Everything**), the
  rule set, best practices, DLS colors and the **SR rules** checkbox, which adds
  axe's experimental screen-reader rules (`label-content-name-mismatch`,
  `p-as-heading`, `table-fake-caption`, `td-has-header`, `focus-order-semantics`)
- **Best practices on by default** — heading order, page has one h1,
  landmarks/regions and empty table headers are graded out of the box; their
  cards in the Automated tab carry a small "best practice" pill so auditors can
  tell them from strict WCAG failures (existing installs are migrated once;
  turning the checkbox off afterwards is respected)
- **Export** menu (header) — Files: JSON, CSV, HTML, PDF; Tickets: Issues
  (markdown), Jira CSV, Azure DevOps CSV
- **Compact rows** toggle (header) — denser finding rows, remembered across sessions
- **Overview** tab (landing) — one **Run full audit** button (scoped by the mode
  select: accessibility scan + screen reader reading order and language checks,
  optionally the DLS check), four audit cards (Automated / DLS / Screen reader /
  Manual tests) with their headline numbers, and a merged **Top issues to fix**
  list that jumps to the finding in its tab; tabs carry numeric badges
- **Keyboard shortcuts** — in the panel: S or Ctrl/⌘+Enter runs the active tab's
  audit (Overview: full audit), R record/stop flow, H highlight all, X clear
  highlights, C contrast, E export menu, / focus the active tab's filter box, I toggle
  "issues only" on the Screen reader tab, Esc close menus, 1–6 switch tabs;
  while "Hear it" playback runs on the Screen reader tab, Space pauses/resumes
  and Esc stops
- **Automated tab** — a contextual toolbar (filter, Highlight all, Auto-fix,
  Clear), clickable severity pills that show/hide a severity, findings grouped
  under severity headers, and per-element fix suggestions collapsed behind
  **Show fix**
- **DLS tab** — toolbar with **Run DLS check**, the live `passed/total` score
  line, a filter box (check, verdict word, detail text or selector — "N of M"
  rows, covers the component rows too), **Highlight all gaps** and Clear
  highlights (shown once a report exists); a first-run empty state; report rows
  with a verdict edge and affected elements / suggested fix collapsed behind
  **Show fix**
- **Filter boxes on every results tab** — the Screen reader tab has one box
  that narrows every section at once (reading order, live log, focus trace,
  languages, bilingual diff, browser tree, journey steps) by role, name,
  message, selector or issue code; the Manual tests tab filters cards by title,
  WCAG ref, question or finding text; each shows "N of M" and `/` focuses the
  active tab's box
- **Manual tests tab** — **Start next test** (opens and starts the first test
  without a verdict), a `done/total` progress bar and verdict chips
  (untested / pass / fail / N/A) that show or hide cards
- **CI companion** (`ci/`) — Playwright + @axe-core/playwright script running the
  same rule sets headlessly; fails builds on new violations vs a baseline
  (see `ci/README.md`)
- **Fix suggestions** — every supported finding shows a corrected, copy-ready
  snippet built from the element's actual HTML (Plain HTML / React / Vue, set in
  Options); contrast failures include a computed nearest passing color — or,
  with the Options toggle, the nearest passing **UAE DLS palette token**
  (e.g. aegold-600 → aegold-700 with the `text-aegold-700` class), so fixes
  stay on the design system; CI companion: `--suggest --dls`
- **Preview fix / Undo** — apply the suggested change live in the page to verify
  it re-scans clean before touching source code
- **AI fix (opt-in)** — bring your own Anthropic API key (stored device-local
  only) for context-aware fixes of a single finding
- **Issues export** — download findings as GitHub-ready markdown, one issue
  section per rule with suggested fixes included; the CI companion prints the
  same suggestions via `--suggest`
- **Jira export** — one-click CSV formatted for Jira's bulk importer: one issue
  per violated rule (and per DLS gap) with priority mapped from impact, labels,
  affected elements, and the suggested fix in Jira {code} markup
- **Azure DevOps export** — CSV for Boards → Queries → Import Work Items: Bug
  work items with HTML Repro Steps, impact→Priority (1–4), and tags; works on
  every ADO process template
- **Identical-element grouping** — repeated markup (40 copies of the same card)
  collapses to one entry with an "×N identical" badge: one fix covers all
- **Built-in Help tab** — every feature explained inside the panel with what it
  does, why it helps, and a concrete example scenario
- **User flow analysis** — hit ⏺ Record flow, then navigate and interact
  (menus, modals, multi-page checkout…); every step and page state is scanned
  automatically and unique findings are aggregated and labeled with the page
  they came from

## Install

**From the stores (recommended):**
- Chrome / Brave / Edge: [Chrome Web Store](https://chromewebstore.google.com/detail/a11y-lens/cccmjnbcpcphmijhfmpnnghbdjdjdkcg)
- Firefox: [Firefox Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/a11y-lens/)

**From source (development):**
1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked** and select this folder (`a11y-miyar-extension`)
4. Firefox: `./build-firefox.sh`, then `about:debugging` → Load Temporary Add-on

## Use

1. Open any page — or the included `test-page.html` (drag it into Chrome),
   which is full of intentional violations
2. Open DevTools (`F12` / `⌥⌘I`) and select the **A11y Miyar** tab
   (it may be hidden behind the `»` overflow menu)
3. Click **Run full audit** on the Overview tab (or **Scan page** on the Automated tab)
4. Expand a violation and click an HTML snippet to highlight the element

> Note: Chrome blocks extensions on `chrome://` pages and the Chrome Web Store —
> test on regular websites or local files.

## Project structure

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest — permissions, background worker, DevTools page, options |
| `background.js` | Service worker owning all `chrome.scripting`/`chrome.storage` work |
| `devtools.html/js` | Registers the DevTools panel |
| `panel.html/css/js` | The panel UI: scans, wizards, flow recording, help, i18n |
| `options.html/js` | Options page (defaults, flow interval, language, SR rules, debugger permission) |
| `vendor/axe.min.js` | axe-core engine (MPL-2.0), injected into pages — update with `./update-axe.sh` |
| `popup.html` | Toolbar popup with usage hint |
| `test-page.html` | Page with intentional violations for testing (incl. screen reader fixtures) |
| `ci/` | Headless CI companion (Playwright + @axe-core/playwright) |

## How it works

DevTools panel pages cannot call `chrome.scripting` or `chrome.storage` directly,
so the panel sends `{op, tabId, …}` messages to the background service worker,
which injects `vendor/axe.min.js` into every frame, runs `axe.run(document)`,
executes page helpers/highlighting, and persists history and manual-test state.
The panel renders whatever comes back.

## License notes

`axe-core` is MPL-2.0 and free to use. "axe" and "axe DevTools" are Deque
trademarks — this project uses only the open-source engine, with its own name and UI.
