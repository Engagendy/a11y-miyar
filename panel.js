// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
const tabId = EXT.devtools.inspectedWindow.tabId;

/* ---------------- background messaging ----------------
   DevTools pages cannot use EXT.scripting / EXT.storage.
   All page injection and storage goes through background.js. */

async function bg(op, extra = {}) {
  // Promise-form sendMessage works on Chromium MV3 and Firefox alike.
  const res = await EXT.runtime.sendMessage({ op, tabId, ...extra });
  if (res && res.error) throw new Error(res.error);
  return res ? res.result : undefined;
}

// inspectedWindow.eval is callback-based on Chromium, promise-based on Firefox.
function devEval(expr) {
  return new Promise((resolve) => {
    try {
      const maybe = EXT.devtools.inspectedWindow.eval(expr, (result) => resolve(result));
      if (maybe && typeof maybe.then === "function") {
        maybe.then((r) => resolve(Array.isArray(r) ? r[0] : r)).catch(() => resolve(null));
      }
    } catch (_) {
      resolve(null);
    }
  });
}

/* ---------------- i18n ---------------- */

const STR = {
  en: {
    scan: "Scan page", scanShort: "Scan",
    flow: "Record flow", stopFlow: "Stop flow",
    clear: "Clear highlights", contrast: "Contrast",
    highlightAll: "Highlight all",
    runTitle: "Run (S or Ctrl/⌘+Enter)", modeTitle: "What to audit",
    scanSettings: "Scan settings", ruleSet: "Rule set", alsoRun: "Also run", moreInOptions: "More in Options",
    presetLbl: "Preset", presetRecommended: "Recommended", presetStrict: "Strict WCAG only", presetAll: "Everything", presetCustom: "Custom",
    presetRecommendedTitle: "WCAG 2.2 AA + best practices + SR rules (default)", presetStrictTitle: "WCAG 2.2 AA only — no best practices, no SR rules",
    presetAllTitle: "All axe rules + best practices + SR rules",
    presetHint: { recommended: "WCAG 2.2 AA + best practices + SR rules — heading order, landmarks and table headers are graded.", strict: "Only rules that map to a WCAG 2.2 AA success criterion.",
      all: "Every axe rule, including AAA and best practices.", custom: "Custom combination — pick a preset to reset." },
    bpPill: "best practice", bpPillTitle: "axe best-practice rule — recommended, not a strict WCAG failure",
    exportFiles: "Files", exportTickets: "Tickets",
    exportHintJson: "report.json", exportHintCsv: "findings.csv", exportHintHtml: "report.html", exportHintPdf: "print dialog",
    exportHintIssues: "issues.md", exportHintJira: "Jira CSV", exportHintAzure: "Azure DevOps CSV",
    compactRows: "Compact rows", allRules: "All rules",
    autofix: (n) => `Auto-fix page (${n})`, undoAll: (n) => `Undo all (${n})`,
    tabOverview: "Overview", tabAuto: "Automated", tabDls: "DLS", tabManual: "Manual tests", tabHelp: "Help",
    runDls: "Run DLS check",
    runAll: "Run full audit", runAllProgress: (i, n) => `Full audit — step ${i} of ${n}…`, runAllDone: "Full audit done — summary on the Overview tab.",
    srRunAll: "Run all checks", manualNext: "Start next test", stepOptional: "optional",
    ovHeroTitle: "Audit this page",
    ovHeroText: (mode) => mode === "dls" ? "Full audit runs the UAE Design System check on the inspected page." :
      mode === "both" ? "Full audit runs the axe-core scan, the screen reader reading order and language checks, and the UAE Design System check." :
      "Full audit runs the axe-core scan plus the screen reader reading order and language checks on the inspected page.",
    ovNotRun: "not run", ovRunning: "running", ovRun: "Run", ovRerun: "Run again", ovView: "View details",
    ovLastRun: (time) => `last run ${time}`, ovTopTitle: "Top issues to fix", ovWeightTitle: (w) => `Priority weight ${w}`,
    ovTopEmpty: "Nothing has run yet — run the full audit or one card above.", ovTopClean: "Nothing to fix — every audit that has run is clean.",
    ovAutoHint: "axe-core rules: contrast, names, roles, structure — the provable failures.",
    ovDlsHint: "UAE Design System adoption, fonts, color tokens, bilingual/RTL and components.",
    ovSrHint: "What a screen reader receives: reading order, live regions, focus and language.",
    ovManualHint: "Guided walkthroughs for what machines cannot judge — Pass / Fail / N/A per test.",
    ovClean: "clean", ovFails: (n) => `${n} fail`, ovWarns: (n) => `${n} warn`, ovScoreOf: "/100",
    verdictPass: "PASS", verdictWarn: "WARN", verdictFail: "FAIL",
    hotkeys: "In the panel: S or Ctrl/⌘+Enter = run the active tab's audit (Overview: full audit), R = record/stop flow, H = highlight all, X = clear highlights, C = contrast, E = export menu, / = focus the active tab's filter box, I = toggle \"issues only\" on the Screen reader tab, Esc = close menus, 1–6 = switch tabs (Overview, Automated, DLS, Manual, Screen reader, Help). While 'Hear it' playback is running on the Screen reader tab: Space = pause/resume (the current row stays highlighted), Esc = stop.",
    modeA11y: "Accessibility", modeBoth: "Accessibility + DLS", modeDls: "DLS only",
    reset: "Reset", resetDone: "Cleared — ready for a fresh audit.",
    dlsInOtherTab: (p, t) => ` · DLS: ${p}/${t} — see the 🇦🇪 tab`,
    dlsIntro: "Audit this page against the UAE Design System (AEGov DLS v3 — mandated for federal government entities).",
    findings: "Findings", historySec: "History",
    filterPlaceholder: "Filter by rule, impact, or selector…",
    filterCount: (s, t) => `${s} of ${t} rule(s)`,
    dlsFilterPlaceholder: "Filter by check, verdict, detail or selector…",
    dlsFilterCount: (s, t) => `${s} of ${t} row(s)`,
    dlsHighlightAll: "Highlight all gaps", dlsHighlightAllTitle: "Outline every DLS gap on the page (gold dashed)",
    srFilterPlaceholder: "Filter by role, name, message, selector or code…",
    srFilterCount: (s, t) => `${s} of ${t} row(s)`,
    manualFilterPlaceholder: "Filter by title, WCAG ref, question or finding…",
    manualFilterCount: (s, t) => `${s} of ${t} test(s)`,
    emptyTitleAuto: "No scan yet",
    sevHead: (level, n) => `${level} · ${n} rule${n === 1 ? "" : "s"}`,
    learnMore: "Learn more ↗", inspect: "Inspect", inspectTitle: "Open this element in the Elements panel",
    elements: (n) => `${n} element(s)`, moreElements: (n) => `…and ${n} more element(s) not shown.`,
    newBadge: "NEW", newBadgeTitle: "Not present in the previous scan of this URL",
    identical: (n) => `×${n} identical`, identicalTitle: "Identical markup repeated — one fix covers all instances",
    noViolations: "🎉 No violations found by automated checks. Remember: automated tools catch only part of WCAG — run the Manual tests too.",
    iframeHint: "Element is inside an iframe — clicking highlights the iframe", clickToHighlight: "Click to highlight this element on the page",
    showFix: "Show fix", hideFix: "Hide fix",
    copyFix: "Copy fix", copied: "Copied ✓", previewFix: "Preview fix", undo: "Undo", previewFailed: "Preview failed: ",
    aiFix: "AI fix", aiNoKey: "Set an API key in Options (right-click the extension icon → Options) to enable AI fixes.", aiThinking: "Thinking…", aiFailed: "AI fix failed: ",
    autofixApplied: (n) => `Applied ${n} live fix(es) — re-scan to verify, then copy the snippets into your source. Reload discards them.`,
    autofixRestored: (n) => `Restored ${n} element(s) to their original state.`, autofixFailed: "Auto-fix failed: ",
    pillToggleTitle: "Show / hide this severity",
    scanningBig: "Scanning… large pages can take several seconds.",
    dlsColorsChk: "DLS colors",
    scanningHuge: (n, s) => `Scanning ${n.toLocaleString()} elements — this may take ~${s}s on a page this large…`,
    scanning: "Scanning…",
    exportLabel: "Export",
    bestPractices: "best practices",
    pickFg: "Pick text color", pickBg: "Pick background",
    emptyResults: "Click Scan page to run an axe-core audit on the inspected page.",
    stale: "⚠ The page has changed since the last scan — results may be stale. Re-scan to refresh.",
    recording: "⏺ Recording — interact with the page, navigate, open menus…",
    firstScan: "first scan of this URL",
    yes: "Yes", no: "No", skip: "Skip",
    startWizard: "Start guided test", question: "Question",
    pickElement: "Pick element on page", picking: "Click the element on the page…",
    manualIntro: "Automated checks cover only ~30–50% of WCAG. These guided walkthroughs cover what machines can't judge. Mark each one Pass / Fail / N/A — verdicts are saved per URL and included in exports.",
    manualDone: (d, t) => `${d}/${t} done`, manualAllDone: "Every manual test has a verdict.",
    mfUntested: "untested", mfPass: "pass", mfFail: "fail", mfNa: "N/A", mfToggleTitle: "Show / hide tests with this verdict",
    emptyTitleDls: "No DLS check yet", dlsFailed: "DLS check failed: ", highlightFailed: "Highlight failed: ", helperFailed: "Helper failed: ",
    wizardPass: (n) => `all ${n} checks passed.`, wizardFail: (n) => `${n} issue(s) recorded.`, wizardNa: "some questions were skipped and none failed.",
    helpWhy: "Why it helps: ", helpExample: "Example: ", helpIntro: "Every A11y Miyar feature, what it's for, and a concrete example of when it helps.",
    continueBtn: "Continue", done: "Done", noteHint: "Optional note about what failed…",
    pass: "Pass", fail: "Fail", na: "N/A",
    critical: "critical", serious: "serious", moderate: "moderate", minor: "minor", passed: "passed",
    tabSr: "Screen reader",
    srIntro: "What a screen reader actually receives: the announced reading order, live-region announcements, every focus move, and language/voice switching — the bug classes a static scan cannot see.",
    srSecOrder: "Reading order & accessible names", srSecLive: "Live regions & silent updates",
    srSecFocus: "Focus trace", srSecLang: "Language & voice switching (AR/EN)",
    srSecAx: "Browser accessibility tree (Chromium)",
    srBuild: "Build reading order", srIssuesOnly: "issues only", srAddFindings: "Add issues to Manual test",
    srPlay: "Play page", srStop: "Stop", srPlayTitle: "Read the rows below aloud, top to bottom, highlighting each element on the page",
    srSpeak: "Hear it — what a screen reader would say", srRate: "rate",
    srPlayFrom: "Play from here", srPlaySubtree: "Play this section", srPlayPick: "Play from element",
    srPlayPickTitle: "Click an element on the inspected page, then playback starts from its row (respecting the filter)",
    srPlayScope: (n) => `Play ${n} row(s) — Space pauses/resumes, Esc stops`,
    srPickNoRow: "No reading-order row matches the picked element — build the reading order or clear the filter.",
    srPicking: "Click an element on the page…", srPickCancelled: "Nothing picked.", srPickFailed: "Pick failed: ",
    srPaused: "Paused — press Space to resume, Esc to stop.",
    srPause: "Pause", srResume: "Resume",
    srPauseTitle: "Pause / resume (Space)", srStopTitle: "Stop reading (Esc)",
    srPlayingFrom: "from here", srPlayingSubtree: "this section", srPlayingPick: "from the picked element",
    srNoVoice: (l) => `No ${l === "ar" ? "Arabic" : l === "en" ? "English" : l} voice installed in this browser — speaking with the default voice`,
    srPlaying: (i, n, scope) => `Speaking row ${i} of ${n}${scope ? " (" + scope + ")" : ""}…`, srPlayDone: (n) => `Played ${n} row(s).`, srNothingToPlay: "Nothing to play — build the reading order first.",
    srBuilding: "Computing accessible names with axe-core…",
    srNoIssues: "No naming/role issues in the reading order. Untick 'issues only' to read the whole page as a screen reader would.",
    srNoRows: "Nothing announced — the page body is empty or entirely hidden from assistive technology.",
    srLiveStart: "Start monitoring", srLiveStop: "Stop monitoring", srClearLog: "Clear log",
    srLiveWaiting: "Monitoring… now trigger the things that change the page: submit a form empty, add to cart, open a toast, filter a list.",
    srLiveIdle: "Start monitoring, then interact with the page. Every DOM change is classified as ANNOUNCED (inside a live region), VIA FOCUS (focus moved into it), MAY BE MISSED (live region created together with its content), or SILENT.",
    srRegionsFound: (n) => `${n} live region(s) present on load:`,
    srRegionsNone: "No live regions on the page at monitor start — any toast, validation error or status text will be SILENT unless focus moves to it.",
    srFocusStart: "Start focus trace", srFocusStop: "Stop focus trace",
    srRingFmt: (kind, w, c) => `ring: ${kind} ${w}px` + (c == null ? " · contrast unknown (image behind)" : ` · ${Number(c).toFixed(1)}:1`), srRingTitle: (color, bg) => `Focus ring colour ${color} on background ${bg}`,
    srFocusWaiting: "Tracing… press Tab through the page, open and close a modal, delete an item, submit a form.",
    srFocusIdle: "Start the trace, then use the keyboard. Each focus move is logged with the role and name that would be announced; focus lost to <body>, focus escaping a modal, focus on unnamed or hidden elements are flagged.",
    srWalk: "Auto-walk", srWalkRunning: "Walking…", srWalkTitle: "Move focus through every Tab stop automatically and report unreachable stops, order jumps, trap candidates and custom widgets that ignore arrow keys / Enter / Space / Escape (synthetic keys — hints to verify by hand)",
    srWalkSummary: (r) => `Auto-walk: ${r.reached} of ${r.candidates} Tab stop(s) reached${r.truncated ? " (capped at " + r.steps + ")" : ""} · ${r.unreachable.length} unreachable · ${r.jumps.length} order jump(s) · ${r.traps.length} possible trap(s)${r.traps.length ? " — verify traps manually with a real Tab key" : ""}${r.probed ? ` · ${r.probed} custom widget(s) probed${r.probeCapped ? " (capped at 40)" : ""}, ${(r.widgets || []).filter((w) => !w.ok).length} keyboard hint(s) — synthetic keys, verify by hand` : ""}`,
    srWalkNone: "Auto-walk: no Tab stops found on the page.", srWalkFailed: "Auto-walk failed: ",
    srLang: "Check languages", srLangRunning: "Scanning text runs for script/lang mismatches…",
    srLangOk: "Declared languages match the text. Screen readers will switch voices correctly.",
    srSecNtc: "Non-text contrast (borders, icons, toggles)", srNtc: "Check non-text contrast", srNtcRunning: "Measuring control borders, toggles and icons against their background…",
    srNtcOk: "Every measurable control boundary, toggle and icon reaches 3:1 against its background.",
    srNtcNote: "WCAG 1.4.11 — axe has no rule for it. For every visible form control, icon-only button/link and custom toggle one boundary a sighted user can rely on (any visible border side, the control's own background, or the icon glyph — the best of them decides) must reach 3:1 against the background behind it. Disabled controls, native widgets the browser paints itself and controls over a photo or gradient (background unknown) are skipped.",
    srNtcStats: (r) => `${r.checked} control(s) measured · ` + (r.issues.length ? `⚠ ${r.issues.length} under 3:1` : "✓ all reach 3:1"),
    srNtcDone: (n) => n ? `Non-text contrast — ${n} control(s) under 3:1` : "Non-text contrast — all controls reach 3:1", srNtcFailed: "Non-text contrast check failed: ",
    srNtcKind: { border: "border", background: "background", icon: "icon" }, srNtcOn: "on",
    srSecReflow: "Reflow & zoom (320 px / 200 % text)", srReflow: "Run reflow test", srReflowRunning: "Rendering the page at a 320 px viewport, then at its own width with 200 % text, through the DevTools protocol…",
    srReflowOk: "No horizontal scrolling, cut-off text, overlapping controls or oversized fixed bars at 320 px, and nothing cut off or overlapping with 200 % text.",
    srReflowNote: "WCAG 1.4.10 Reflow / 1.4.4 Resize text — the page is rendered at 320 px wide (what 400 % zoom on a 1280 px screen gives) and then, back at its own width, with 200 % text (WCAG 1.4.4), through the DevTools protocol: horizontal scrolling (a scrolling wrapper, an off-canvas drawer or a data table that scrolls in its own box is fine), text cut off by overflow hidden/clip, controls that really cover each other (checked with a hit test — a search button on its input is fine) and fixed bars taller than a quarter of the screen (sticky ones only when stuck at the top; dialogs are skipped). Problems that already exist at the normal width are labelled and count as moderate. Needs the debugger permission (Options → Screen reader checks); Chrome shows a \"debugging\" bar for about a second and the page is restored afterwards.",
    srReflowStats: (s) => `page ${s.scrollWidth} px wide at 320 px · ${s.controls} control(s)` + (s.issues ? ` · ⚠ ${s.issues} issue(s)` : " · ✓ reflows"),
    srReflowDone: (n) => n ? `Reflow test — ${n} issue(s)` : "Reflow test — the page reflows", srReflowFailed: "Reflow test failed: ",
    srReflowShotBase: (w) => `Before (${w} px)`, srReflowShot320: "320 px viewport",
    srReflowPermission: "The debugger permission is not granted. Grant it once from the Options page (a user gesture there is required), then run again.",
    srReflowUnavailable: "Not available in this browser — the reflow test uses chrome.debugger (Chromium only).",
    srReflowSkipped: "Reflow test skipped by Run all checks — grant the debugger permission once in Options to include it.",
    srReflowCode: { "reflow-horizontal-scroll": "horizontal scroll · 320 px", "reflow-clipped-text": "cut-off text · 320 px", "reflow-clipped-text-200": "cut-off text · 200 % text", "reflow-overlap": "overlap · 320 px", "reflow-overlap-200": "overlap · 200 % text", "reflow-fixed-too-tall": "fixed bar too tall · 320 px" },
    srReflowMsg: (code, d) => code === "reflow-horizontal-scroll" ? `extends to ${d.right} px at a 320 px viewport (${d.width} px wide; the page scrolls to ${d.scrollWidth} px) — two-dimensional scrolling${d.row ? " — a row of children that does not wrap" : ""}`
      : code.startsWith("reflow-clipped-text") ? `text cut off ${d.zoom ? "with 200 % text" : "at 320 px"}: needs ${d.need} px, the box is ${d.box} px (${d.props})${d.base ? " — also at the normal viewport" : ""}`
      : code.startsWith("reflow-overlap") ? `overlaps ${d.sel2} by ${d.pct} % ${d.zoom ? "with 200 % text" : "at 320 px"} — one of the two controls is covered${d.base ? " (also at the normal viewport)" : ""}`
      : `${d.position} bar ${d.height} px tall covers ${d.pct} % of an ${d.innerHeight} px screen at 320 px`,
    srAx: "Fetch browser tree", srAxRunning: "Reading the accessibility tree through the DevTools protocol…",
    srAxNote: "Reads the tree the browser hands to NVDA/VoiceOver through the DevTools protocol — the ground truth when the reading order above and the real screen reader disagree. Needs the debugger permission (Options → Screen reader checks); Chrome shows a \"debugging\" bar for about a second.",
    srScoreTitle: "Screen reader score", srScoreOf: "of 100", srScoreTop: "Top 5 to fix", srScoreClean: "Nothing to fix — every section that has run is clean.",
    srScorePass: "✓ PASS", srScoreWarn: "△ WARN", srScoreFail: "✗ FAIL", srScoreIssues: (n) => `${n} issue(s)`, srScoreNotRun: "not run",
    srScoreSecOrder: "reading order", srScoreSecLive: "live regions", srScoreSecFocus: "focus trace", srScoreSecLang: "language", srScoreSecNtc: "non-text contrast", srScoreSecReflow: "reflow", srScoreSecAx: "browser tree", srScoreSecCmp: "bilingual",
    srSecCmp: "Bilingual comparison (AR/EN)", srCmp: "Compare", srCmpRunning: "Loading the other-language page in a hidden tab and comparing…",
    srCmpUrlPh: "https://…/ar/ — URL of the other-language version",
    srCmpNote: "Loads the other-language page in a hidden tab and diffs the two accessibility trees: controls, names, landmark labels, live regions and heading levels present on one side only, plus html lang/dir on each side.",
    srCmpNoUrl: "Enter the URL of the other-language version first.", srCmpOk: "No differences — both language versions expose the same controls, names, landmarks, live regions and heading structure.",
    srCmpStats: (n) => n ? `⚠ ${n} difference(s)` : "✓ 0 differences", srCmpDone: (n) => n ? `Bilingual comparison — ${n} difference(s)` : "Bilingual comparison — 0 differences",
    srCmpThis: "this page", srCmpOther: "other page", srCmpUrls: (a, b) => `Compared ${a} ↔ ${b}`,
    srCmpFailed: "Bilingual comparison failed: ", srCmpNavigated: "the inspected page navigated during the comparison — run it again",
    srScriptAr: "Arabic", srScriptLatin: "Latin", srPersistFailed: "Could not save screen reader results: ",
    srOrderStats: (s, truncated) => `${s.rows} nodes · ${s.interactive} interactive · ${s.headings} headings · ${s.landmarks} landmarks · ${s.images} images · ` +
      (s.issues ? `⚠ ${s.issues} issue(s)` : "✓ no issues") + (truncated ? " (truncated)" : ""),
    srCmpMissing: (side, role, n) => `${n > 1 ? n + " " : ""}${role}${n > 1 ? "s" : ""} present on ${side} only — the other language version has no matching control`,
    srCmpUnnamed: (side, role) => `${role} is named on ${side} but has no accessible name in the other version`,
    srCmpLandmark: (side, role) => `${role} landmark is labelled on ${side} only — the landmarks list differs between languages`,
    srCmpLive: (side) => `live region present on ${side} only — updates are silent in the other version`,
    srCmpHeadings: (lvl, a, b) => `heading level ${lvl}: ${a} on this page vs ${b} on the other — heading navigation differs between languages`,
    srCmpHtmlLang: (side, lang, det) => `html lang="${lang || "—"}" on ${side} but the text is mostly ${det}`,
    srCmpHtmlDir: (side, dir) => `html dir="${dir || "—"}" on ${side} but the text is Arabic — should be dir="rtl"`,
    srCmpSameLang: (lang) => `both versions declare html lang="${lang}" — one of them is wrong, the screen reader will use the same voice for both`,
    srNavigated: "navigated", srClickHighlight: "Click to highlight on the page",
    srKindAnnounced: "ANNOUNCED", srKindSilent: "SILENT", srKindRisky: "MAY BE MISSED", srKindFocused: "VIA FOCUS", srKindRerender: "RE-RENDER", srKindNav: "NAVIGATED", srKindFocus: "FOCUS", srKindFocusLost: "FOCUS LOST", srKindRoute: "NAVIGATION",
    srRouteTitleLbl: "title", srRouteH1Lbl: "H1", srRouteSame: "unchanged", srRouteFocusMoved: (to) => `focus moved to ${to}`, srRouteFocusStayed: "focus stayed put", srRouteAnnounced: "announced", srRouteNotAnnounced: "nothing announced",
    srRouteTitleNever: (n, title) => `title never changes — all ${n} pages/states of the flow share "${title || "(empty)"}"`,
    srRouteTitleNeverNote: "Every page or step of the journey must set its own document.title: it is the tab name, the first thing announced after a navigation and what history/bookmarks show.",
    srRouteNoteSilent: "URL changed but the title stayed the same, focus did not move and nothing was announced — a screen reader user does not know the page changed",
    srRouteNoteQuerySilent: "the query string changed and content was re-rendered, but nothing was announced — say what changed (e.g. \"Page 2 of 10\", \"12 results\") in a live region",
    srRouteNoteTitleStale: (title) => `document.title is still "${title || "(empty)"}" after the URL changed — the tab title and the first thing announced on a page change never update`,
    srRouteNoteFocusStale: "focus stayed on an element that is gone or hidden after the route change — the screen reader cursor is stranded",
    srRouteNoteFocusMid: "focus stayed mid-page on the control that triggered the navigation while the content above it was replaced — move focus to the new page's heading",
    srRouteNoteOk: (announced) => "title changed and focus moved — a screen reader user hears the new page" + (announced ? " (and a live announcement)" : ""),
    srRouteNoteH1: (h1) => `the H1 still reads "${h1}" on the new URL — every page/step needs its own H1`,
    srMsgStateMissingTab: "tab has no aria-selected — the screen reader cannot say which tab is open",
    srMsgStateMissingTabCls: (w) => `tab has no aria-selected (state is only in class "${w}") — the screen reader cannot say which tab is open`,
    srMsgStateMissing: (role, w, attr) => `${role} keeps its state in class "${w}" only — no ${attr}, so the screen reader announces it identically in both states`,
    srMsgRequired: (m) => `marked required visually ("${m}") but has neither required nor aria-required — announced as an optional field`,
    srMsgReadonly: "readonly on a picker field (date/time/combobox) — announced as \"read only\" although the user is expected to change its value; screen reader users skip it or think it is locked",
    srMsgStepper: (n) => `stepper with ${n} steps shows progress with icons/classes only — no aria-current="step" and no hidden "Step N of ${n}, completed" text, so the screen reader reads a plain list`,
    srMsgLinkNewWindow: (formBtn, name, role) => `opens in a new ${formBtn ? "window (formtarget)" : "tab"} without saying so — the screen reader announces "${name}, ${role}" and the user is stranded in a tab they did not expect (WCAG 3.2.5)`,
    srMsgLinkDownload: (type, name) => `downloads a ${type} file but the name does not say so — announced as "${name}, link" with no file type or size (WCAG 2.4.4)`,
    srMsgLinkExternal: (host) => `leaves the site for ${host} without a hint — nothing in the name says it is an external link`,
    srMsgLinkAsBtnCurrent: (what, crumb) => `${what} on the current ${crumb ? "breadcrumb" : "pagination"} item — announced as "same page link" though it goes nowhere; the screen reader never hears "current page"`,
    srMsgLinkAsBtnNav: (what, crumb) => `${what} inside a ${crumb ? "breadcrumb" : "pagination"} — announced as "same page link" and Enter jumps to the top of the page instead of navigating`,
    srMsgLinkAsBtnHandler: (what) => `${what} with a click handler — announced as "same page link", not a button, and Enter scrolls to the top before the script runs`,
    srMsgGroupNoLabel: (n, kind, hint) => `${n} ${kind} controls form a group with no group name — no <fieldset>/<legend> and no role="group" with a label${hint ? ` (the visible "${hint}" is not linked)` : ""}; the screen reader announces each ${kind} by its own text only, never what the choice is about`,
    srMsgNontextContrast: (ratio, kind, color, bg) => `Non-text contrast ${ratio}:1 — ${kind === "border" ? "border" : kind === "background" ? "control background" : "icon"} ${color} on ${bg}; a control's boundary, state indicator or icon needs 3:1 (WCAG 1.4.11)`,
    srMsgFocusRingLowContrast: (kind, color, ratio, bg) => `focus ring (${kind} ${color}) has ${ratio}:1 contrast against its background ${bg} — needs 3:1 (WCAG 2.4.11 / 1.4.11)`,
    srMsgFocusRingThin: (w, kind) => `focus ring is only ${w}px thick (${kind}) — use at least 2px so it is noticed`,
    srMsgFocusRingClipped: (overflow, sel, kind, extent) => `focus ring is cut off by an ancestor with overflow:${overflow} (${sel}) — the ${kind} extends ${extent}px outside the element`,
    srMsgWidgetNoArrow: (keys, widget, container) => `custom widget: ${keys} changed nothing inside role="${widget}" (${container}) — no focus move, aria state or DOM change within 150 ms; a keyboard user is stuck on the first item (hint from synthetic keys — verify with a real keyboard)`,
    srMsgWidgetNoEnterSpace: (keys, haspopup, widget) => `custom widget: ${keys} changed nothing on this ${haspopup ? "aria-haspopup=\"" + haspopup + "\" " : ""}${widget} — verify manually — synthetic keys cannot trigger native activation, but a div/span with a click-only handler never opens for keyboard users`,
    srMsgWidgetEscNoClose: (changed) => `custom widget: the popup opened by Enter did not close on Escape (${changed || "no change"} within 150 ms) — users end up pressing Escape twice or Tab-ing out (hint from synthetic keys — verify by hand)`,
    srMsgQuestionNotAssoc: (names, q) => `${names} buttons are not associated with the question "${q}" — in the buttons list (or when tabbing straight to them) the screen reader announces just ${names}, without what is being asked; wrap them in role="group" aria-labelledby pointing at the question`,
    srMsgLabelNotAssoc: (lbl, name) => `visible label "${lbl}" is not linked to the field — announced as ${name ? `"${name}"` : "an unnamed field"} instead; use <label for> so the text next to the field is what the screen reader (and voice control) gets`,
    srApplyGroupLabel: "Group label", srApplyFieldLabel: "Field label",
    presetComboBp: "BP", presetComboSr: "SR", srStateLbl: "STATE",
    srMoreRows: (n) => `…and ${n} more row(s).`, srOrderBuilt: (n) => n ? `Reading order built — ${n} screen reader issue(s)` : "Reading order built — no naming issues found",
    srFindingsAdded: (n, title) => `${n} finding(s) added to "${title}" — see the Manual tests tab.`,
    srLangStats: (r) => `html lang="${r.htmlLang || "—"}" dir="${r.htmlDir || "—"}" · ${r.totals.arabic.toLocaleString()} Arabic / ${r.totals.latin.toLocaleString()} Latin letters · ` + (r.issues.length ? `⚠ ${r.issues.length} issue(s)` : "✓ no issues"),
    srLangDone: (n) => n ? `Language check — ${n} issue(s)` : "Language check — no issues", srAxDone: "Browser accessibility tree fetched.",
    srFixApplied: "Fix applied on the page", srFixUndone: "Fix undone",
    srScoreNoName: "(no name)", srScoreHint: "Click an entry to highlight it on the page and jump to its row.",
    srSecJourney: "Journey transcript", srJourneyCopy: "Copy transcript", srJourneyCopied: "Copied", srJourneyTitle: "Screen reader transcript",
    srJourneyStats: (j) => `${j.steps.length} step(s) · ${j.pages.length} page/state(s) · ${(j.duration / 1000).toFixed(1)}s · ${j.gaps.length ? "✗ " + j.gaps.length + " gap(s)" : "✓ no gaps"}`,
    srJourneyEmpty: "No screen reader events were captured during the flow — Tab through the page or trigger updates while recording.",
    srJourneyHint: "Click a step to highlight its element on the page.", srJourneyNav: (l) => `navigated to ${l}`, srJourneyRerender: (n) => `re-render: ${n}`,
    srJourneyNoName: "(no name)", srJourneyStart: "recording started", srJourneyEnd: "recording stopped",
    srGapSilent: "SILENT — content changed, nothing announced", srGapRisky: "MAY BE MISSED — live region created together with its content",
    srGapFocusLost: "FOCUS LOST — focus fell back to <body>", srGapModalEscape: "MODAL ESCAPE — focus left the open dialog",
    srGapQuiet: (sec) => `QUIET — ${sec}s of DOM changes with no announcement`,
    srGapRouteSilent: "SILENT NAVIGATION — URL changed, same title, focus did not move, nothing announced", srGapRouteTitle: "STALE TITLE — document.title did not change with the URL",
    srGapRouteH1: "SAME H1 — the new page/step has the same H1 as the previous one", srGapRouteFocus: "FOCUS STUCK — focus stayed mid-page after the navigation",
    srGapState: (attr) => `STATE NOT ANNOUNCED — the control changed state (class/visibility) without ${attr}`,
    srJourneyRoute: (txt) => `navigation ${txt}`,
    srAxPermission: "The debugger permission is not granted. Grant it once from the Options page (a user gesture there is required), then fetch again.",
    srAxOpenOptions: "Open Options", srAxUnavailable: "Not available in this browser — the browser tree uses chrome.debugger (Chromium only).",
    srRulesChk: "SR rules",
    srNow: "Now:", srChangeTo: "Change to:",
    noScanRuleSet: "automated scan not run", noScanNote: "Automated axe-core scan was not run for this report — only the sections below were executed. Click Scan page to add automated findings.", srChangeToFw: "Change to ({fw}):",
    srDiffLegend: "green = added, red = removed",
    srRestored: (time) => `restored from ${time}`, srRestoredTitle: "Results saved for this URL by an earlier session; run the check again for fresh data.",
    srBadgeTitle: "Current screen reader issues", srBadgeNone: "no screen reader issues yet",
    srGroupBadge: (n) => `×${n} identical`, srGroupBadgeTitle: "Same tag, classes, role and issues — click to highlight every instance",
    srGroupSelectors: (n) => `${n} instances — click a selector to highlight it`, srGroupNote: (n) => `×${n} identical`,
    srApply: "Apply on page", srUndo: "Undo", srApplying: "Applying…", srApplyFailed: "Apply failed: ",
    srFixedBadge: "✓ fixed", srFixedMsg: "Fixed on the page — the issue no longer appears for this element.",
    srStillFlagged: "Applied, but the issue is still flagged — see the updated “Now” above.",
    srAppliedVerifyLive: "Applied — trigger the update again to verify it is announced.",
    srAppliedVerifyFocus: "Applied — Tab to the element again to verify.",
    srApplyTemp: "Live only in this page load (reload discards it) — copy the fix into your source.",
    srApplyName: "Accessible name", srApplyAlt: "Alt text (empty = decorative)", srApplyLang: "Language code", srApplyLandmark: "Landmark label",
    srRunAllDone: "All checks run — live monitoring is on; interact with the page.",
    srShowFix: (n) => `Fix · ${n} action${n === 1 ? "" : "s"}`, srShowDetails: "Details",
    stepIdle: "not run", stepRunning: "running…", stepIssues: (n) => `${n} issue${n === 1 ? "" : "s"}`, stepClean: "clean", stepError: "failed",
    srLiveStatsFmt: (ann, silent, risky) => `${ann} announced · ${silent} silent · ${risky} may be missed`, srLiveStatsRoute: (n, bad) => ` · ${n} navigation(s)${bad ? ", " + bad + " silent/stale" : ""}`,
    srFocusStatsFmt: (moves, issues) => `${moves} focus move(s) · ${issues ? "⚠ " + issues + " issue(s)" : "✓ no issues"}`,
    srAxStatsFmt: (s, truncated) => `${s.rows} exposed node(s) of ${s.total} (${s.ignored} ignored by the browser) · ` + (s.issues ? `⚠ ${s.issues} issue(s)` : "✓ no issues") + (truncated ? " (truncated)" : ""),
    srOrderFailed: "Reading order failed: ", srLiveFailed: "Live monitor failed: ", srFocusFailed: "Focus trace failed: ", srLangFailed: "Language check failed: ", srAxFailed: "Browser tree failed: ",
  },
  ar: {
    scan: "فحص الصفحة", scanShort: "فحص",
    flow: "تسجيل مسار", stopFlow: "إيقاف التسجيل",
    clear: "مسح التظليل", contrast: "التباين",
    highlightAll: "تظليل الكل",
    runTitle: "تشغيل (S أو Ctrl/⌘+Enter)", modeTitle: "ما الذي يُدقَّق",
    scanSettings: "إعدادات الفحص", ruleSet: "مجموعة القواعد", alsoRun: "شغّل أيضاً", moreInOptions: "المزيد في الإعدادات",
    presetLbl: "إعداد مسبق", presetRecommended: "الموصى به", presetStrict: "WCAG فقط (صارم)", presetAll: "كل القواعد", presetCustom: "مخصص",
    presetRecommendedTitle: "WCAG 2.2 AA + أفضل الممارسات + قواعد قارئ الشاشة (الافتراضي)", presetStrictTitle: "WCAG 2.2 AA فقط — بدون أفضل الممارسات ولا قواعد قارئ الشاشة",
    presetAllTitle: "كل قواعد axe + أفضل الممارسات + قواعد قارئ الشاشة",
    presetHint: { recommended: "WCAG 2.2 AA + أفضل الممارسات + قواعد قارئ الشاشة — يُقيَّم ترتيب العناوين والمعالم ورؤوس الجداول.", strict: "القواعد المرتبطة بمعيار نجاح في WCAG 2.2 AA فقط.",
      all: "كل قواعد axe بما فيها AAA وأفضل الممارسات.", custom: "تركيبة مخصصة — اختر إعداداً مسبقاً لإعادة الضبط." },
    bpPill: "أفضل الممارسات", bpPillTitle: "قاعدة axe استرشادية — موصى بها وليست إخفاقاً صارماً في WCAG",
    exportFiles: "ملفات", exportTickets: "تذاكر",
    exportHintJson: "report.json", exportHintCsv: "findings.csv", exportHintHtml: "report.html", exportHintPdf: "نافذة الطباعة",
    exportHintIssues: "issues.md", exportHintJira: "Jira CSV", exportHintAzure: "Azure DevOps CSV",
    compactRows: "صفوف مضغوطة", allRules: "كل القواعد",
    autofix: (n) => `إصلاح تلقائي للصفحة (${n})`, undoAll: (n) => `تراجع عن الكل (${n})`,
    tabOverview: "نظرة عامة", tabAuto: "الفحص الآلي", tabDls: "نظام التصميم", tabManual: "اختبارات يدوية", tabHelp: "مساعدة",
    runDls: "تشغيل فحص نظام التصميم",
    runAll: "تدقيق كامل", runAllProgress: (i, n) => `التدقيق الكامل — الخطوة ${i} من ${n}…`, runAllDone: "اكتمل التدقيق الكامل — الملخص في تبويب النظرة العامة.",
    srRunAll: "تشغيل الفحوص", manualNext: "بدء الاختبار التالي", stepOptional: "اختياري",
    ovHeroTitle: "دقّق هذه الصفحة",
    ovHeroText: (mode) => mode === "dls" ? "يشغّل التدقيق الكامل فحص نظام التصميم الإماراتي على الصفحة المفحوصة." :
      mode === "both" ? "يشغّل التدقيق الكامل فحص axe-core، وترتيب القراءة وفحص اللغة لقارئ الشاشة، وفحص نظام التصميم الإماراتي." :
      "يشغّل التدقيق الكامل فحص axe-core مع ترتيب القراءة وفحص اللغة لقارئ الشاشة على الصفحة المفحوصة.",
    ovNotRun: "لم يُشغَّل", ovRunning: "جارٍ التشغيل", ovRun: "تشغيل", ovRerun: "إعادة التشغيل", ovView: "عرض التفاصيل",
    ovLastRun: (time) => `آخر تشغيل ${time}`, ovTopTitle: "أهم المشاكل للإصلاح", ovWeightTitle: (w) => `وزن الأولوية ${w}`,
    ovTopEmpty: "لم يُشغَّل شيء بعد — شغّل التدقيق الكامل أو إحدى البطاقات أعلاه.", ovTopClean: "لا شيء للإصلاح — كل تدقيق شُغِّل نظيف.",
    ovAutoHint: "قواعد axe-core: التباين والأسماء والأدوار والبنية — الأخطاء المثبتة.",
    ovDlsHint: "اعتماد نظام التصميم الإماراتي والخطوط ورموز الألوان وثنائية اللغة/RTL والمكوّنات.",
    ovSrHint: "ما يصل إلى قارئ الشاشة: ترتيب القراءة والمناطق الحية والتركيز واللغة.",
    ovManualHint: "جولات موجّهة لما لا تستطيع الآلة الحكم عليه — ناجح / فاشل / لا ينطبق لكل اختبار.",
    ovClean: "نظيف", ovFails: (n) => `${n} فاشل`, ovWarns: (n) => `${n} تحذير`, ovScoreOf: "/100",
    verdictPass: "ناجح", verdictWarn: "تحذير", verdictFail: "راسب",
    hotkeys: "في اللوحة: S أو Ctrl/⌘+Enter لتشغيل تدقيق التبويب النشط (نظرة عامة: التدقيق الكامل)، R تسجيل/إيقاف المسار، H تظليل الكل، X مسح التظليل، C التباين، E قائمة التصدير، / التركيز على مربع التصفية في التبويب النشط، I تبديل «المشاكل فقط» في تبويب قارئ الشاشة، Esc إغلاق القوائم، 1–6 تبديل التبويبات (نظرة عامة، الفحص الآلي، نظام التصميم، اليدوية، قارئ الشاشة، مساعدة). أثناء تشغيل «اسمعه» في تبويب قارئ الشاشة: مسافة للإيقاف المؤقت/الاستئناف (يبقى الصف الحالي مُبرزاً)، وEsc للإيقاف.",
    modeA11y: "إمكانية الوصول", modeBoth: "إمكانية الوصول + نظام التصميم", modeDls: "نظام التصميم فقط",
    reset: "إعادة تعيين", resetDone: "تم المسح — جاهز لتدقيق جديد.",
    dlsInOtherTab: (p, t) => ` · نظام التصميم: ${p}/${t} — انظر تبويب 🇦🇪`,
    dlsIntro: "دقق هذه الصفحة وفق نظام التصميم الإماراتي (AEGov DLS v3 — الإلزامي للجهات الاتحادية).",
    findings: "النتائج", historySec: "السجل",
    filterPlaceholder: "رشّح حسب القاعدة أو الخطورة أو المحدد…",
    filterCount: (s, t) => `${s} من ${t} قاعدة`,
    dlsFilterPlaceholder: "تصفية حسب الفحص أو الحكم أو التفاصيل أو المحدد…",
    dlsFilterCount: (s, t) => `${s} من ${t} صفاً`,
    dlsHighlightAll: "تظليل كل الفجوات", dlsHighlightAllTitle: "تحديد كل فجوات نظام التصميم في الصفحة (إطار ذهبي متقطع)",
    srFilterPlaceholder: "تصفية حسب الدور أو الاسم أو الرسالة أو المحدد أو الرمز…",
    srFilterCount: (s, t) => `${s} من ${t} صفاً`,
    manualFilterPlaceholder: "تصفية حسب العنوان أو مرجع WCAG أو السؤال أو النتيجة…",
    manualFilterCount: (s, t) => `${s} من ${t} اختباراً`,
    emptyTitleAuto: "لم يُجرَ فحص بعد",
    sevHead: (level, n) => `${level} · ${n} قاعدة`,
    learnMore: "اقرأ المزيد ↗", inspect: "فحص العنصر", inspectTitle: "افتح هذا العنصر في لوحة Elements",
    elements: (n) => `${n} عنصر`, moreElements: (n) => `…و${n} عنصر آخر غير معروض.`,
    newBadge: "جديد", newBadgeTitle: "لم يكن موجوداً في الفحص السابق لهذا الرابط",
    identical: (n) => `×${n} متطابق`, identicalTitle: "ترميز متطابق متكرر — إصلاح واحد يغطي كل النسخ",
    noViolations: "🎉 لم تُعثر الفحوص الآلية على مخالفات. تذكّر: الأدوات الآلية تلتقط جزءاً من WCAG فقط — شغّل الاختبارات اليدوية أيضاً.",
    iframeHint: "العنصر داخل iframe — النقر يظلّل الـ iframe", clickToHighlight: "انقر لتظليل هذا العنصر في الصفحة",
    showFix: "عرض الإصلاح", hideFix: "إخفاء الإصلاح",
    copyFix: "نسخ الإصلاح", copied: "نُسخ ✓", previewFix: "معاينة الإصلاح", undo: "تراجع", previewFailed: "فشلت المعاينة: ",
    aiFix: "إصلاح بالذكاء الاصطناعي", aiNoKey: "أضف مفتاح API في الإعدادات (زر الفأرة الأيمن على أيقونة الإضافة ← Options) لتفعيل الإصلاح بالذكاء الاصطناعي.", aiThinking: "جارٍ التفكير…", aiFailed: "فشل الإصلاح بالذكاء الاصطناعي: ",
    autofixApplied: (n) => `طُبّق ${n} إصلاح مباشر — أعد الفحص للتحقق ثم انسخ المقتطفات إلى المصدر. إعادة التحميل تلغيها.`,
    autofixRestored: (n) => `أُعيد ${n} عنصر إلى حالته الأصلية.`, autofixFailed: "فشل الإصلاح التلقائي: ",
    pillToggleTitle: "إظهار / إخفاء هذه الخطورة",
    scanningBig: "جارٍ الفحص… الصفحات الكبيرة قد تستغرق عدة ثوانٍ.",
    dlsColorsChk: "ألوان النظام",
    scanningHuge: (n, s) => `جارٍ فحص ${n.toLocaleString()} عنصر — قد يستغرق نحو ${s} ثانية لصفحة بهذا الحجم…`,
    scanning: "جارٍ الفحص…",
    exportLabel: "تصدير",
    bestPractices: "أفضل الممارسات",
    pickFg: "اختر لون النص", pickBg: "اختر لون الخلفية",
    emptyResults: "اضغط \"فحص الصفحة\" لتشغيل تدقيق axe-core على الصفحة.",
    stale: "⚠ تغيّرت الصفحة منذ آخر فحص — قد تكون النتائج قديمة. أعد الفحص.",
    recording: "⏺ جارٍ التسجيل — تفاعل مع الصفحة وتنقّل وافتح القوائم…",
    firstScan: "أول فحص لهذا الرابط",
    yes: "نعم", no: "لا", skip: "تخطّي",
    startWizard: "بدء الاختبار الموجّه", question: "سؤال",
    pickElement: "اختر عنصراً من الصفحة", picking: "انقر على العنصر في الصفحة…",
    manualIntro: "تغطي الفحوص الآلية نحو 30–50% فقط من WCAG. هذه الجولات الموجّهة تغطي ما لا تستطيع الآلة الحكم عليه. حدّد لكل اختبار ناجح / فاشل / لا ينطبق — تُحفظ الأحكام لكل رابط وتُضمَّن في التصدير.",
    manualDone: (d, t) => `${d}/${t} مكتمل`, manualAllDone: "لكل اختبار يدوي حكم.",
    mfUntested: "غير مختبر", mfPass: "ناجح", mfFail: "فاشل", mfNa: "لا ينطبق", mfToggleTitle: "إظهار / إخفاء الاختبارات بهذا الحكم",
    emptyTitleDls: "لا فحص لنظام التصميم بعد", dlsFailed: "فشل فحص نظام التصميم: ", highlightFailed: "فشل التظليل: ", helperFailed: "فشل المساعد: ",
    wizardPass: (n) => `نجحت كل الفحوص الـ${n}.`, wizardFail: (n) => `سُجّلت ${n} مشكلة/مشكلات.`, wizardNa: "تم تخطّي بعض الأسئلة ولم يفشل أي منها.",
    helpWhy: "لماذا يفيد: ", helpExample: "مثال: ", helpIntro: "كل ميزة في A11y Miyar، والغرض منها، ومثال ملموس على متى تفيد.",
    continueBtn: "متابعة", done: "تم", noteHint: "ملاحظة اختيارية حول سبب الفشل…",
    pass: "ناجح", fail: "فاشل", na: "لا ينطبق",
    critical: "حرِج", serious: "خطير", moderate: "متوسط", minor: "بسيط", passed: "ناجح",
    tabSr: "قارئ الشاشة",
    srIntro: "ما يصل فعلاً إلى قارئ الشاشة: ترتيب القراءة المُعلَن، إعلانات المناطق الحية، كل انتقال للتركيز، وتبديل اللغة/الصوت — فئات الأخطاء التي لا يراها الفحص الثابت.",
    srSecOrder: "ترتيب القراءة والأسماء المتاحة", srSecLive: "المناطق الحية والتحديثات الصامتة",
    srSecFocus: "تتبّع التركيز", srSecLang: "اللغة وتبديل الصوت (عربي/إنجليزي)",
    srSecAx: "شجرة إمكانية الوصول في المتصفح (Chromium)",
    srBuild: "بناء ترتيب القراءة", srIssuesOnly: "المشاكل فقط", srAddFindings: "إضافة المشاكل إلى الاختبار اليدوي",
    srPlay: "تشغيل الصفحة", srStop: "إيقاف", srPlayTitle: "قراءة الصفوف أدناه بصوت عالٍ من الأعلى إلى الأسفل مع إبراز كل عنصر في الصفحة",
    srSpeak: "اسمعه — ما سيقوله قارئ الشاشة", srRate: "السرعة",
    srPlayFrom: "التشغيل من هنا", srPlaySubtree: "تشغيل هذا القسم", srPlayPick: "التشغيل من عنصر",
    srPlayPickTitle: "انقر عنصراً في الصفحة المفحوصة فيبدأ التشغيل من صفّه (مع مراعاة التصفية)",
    srPlayScope: (n) => `تشغيل ${n} صف/صفوف — مسافة للإيقاف المؤقت/الاستئناف، Esc للإيقاف`,
    srPickNoRow: "لا يوجد صف في ترتيب القراءة يطابق العنصر المختار — ابنِ ترتيب القراءة أو امسح التصفية.",
    srPicking: "انقر عنصراً في الصفحة…", srPickCancelled: "لم يُختر شيء.", srPickFailed: "فشل الاختيار: ",
    srPaused: "متوقف مؤقتاً — اضغط مسافة للاستئناف أو Esc للإيقاف.",
    srPause: "إيقاف مؤقت", srResume: "استئناف",
    srPauseTitle: "إيقاف مؤقت / استئناف (مسافة)", srStopTitle: "إيقاف القراءة (Esc)",
    srPlayingFrom: "من هنا", srPlayingSubtree: "هذا القسم", srPlayingPick: "من العنصر المختار",
    srNoVoice: (l) => `لا يوجد صوت ${l === "ar" ? "عربي" : l === "en" ? "إنجليزي" : l} مثبّت في هذا المتصفح — يُستخدم الصوت الافتراضي`,
    srPlaying: (i, n, scope) => `جارٍ نطق الصف ${i} من ${n}${scope ? " (" + scope + ")" : ""}…`, srPlayDone: (n) => `تم تشغيل ${n} صف/صفوف.`, srNothingToPlay: "لا شيء للتشغيل — ابنِ ترتيب القراءة أولاً.",
    srBuilding: "جارٍ حساب الأسماء المتاحة عبر axe-core…",
    srNoIssues: "لا مشاكل في الأسماء أو الأدوار ضمن ترتيب القراءة. ألغِ تحديد \"المشاكل فقط\" لقراءة الصفحة كاملة كما يسمعها قارئ الشاشة.",
    srNoRows: "لا شيء يُعلَن — جسم الصفحة فارغ أو مخفي بالكامل عن التقنيات المساعدة.",
    srLiveStart: "بدء المراقبة", srLiveStop: "إيقاف المراقبة", srClearLog: "مسح السجل",
    srLiveWaiting: "جارٍ المراقبة… الآن فعّل ما يغيّر الصفحة: أرسل نموذجاً فارغاً، أضف إلى السلة، افتح إشعاراً، رشّح قائمة.",
    srLiveIdle: "ابدأ المراقبة ثم تفاعل مع الصفحة. يُصنَّف كل تغيير في DOM إلى: مُعلَن (داخل منطقة حية)، عبر التركيز (انتقل التركيز إليه)، قد يُفوَّت (منطقة حية أُنشئت مع محتواها)، أو صامت.",
    srRegionsFound: (n) => `${n} منطقة حية موجودة عند التحميل:`,
    srRegionsNone: "لا مناطق حية في الصفحة عند بدء المراقبة — أي إشعار أو خطأ تحقق أو نص حالة سيكون صامتاً ما لم ينتقل التركيز إليه.",
    srFocusStart: "بدء تتبّع التركيز", srFocusStop: "إيقاف التتبّع",
    srRingFmt: (kind, w, c) => `حلقة التركيز: ${kind} ${w}px` + (c == null ? " · التباين مجهول (صورة خلفية)" : ` · ${Number(c).toFixed(1)}:1`), srRingTitle: (color, bg) => `لون حلقة التركيز ${color} على خلفية ${bg}`,
    srFocusWaiting: "جارٍ التتبّع… اضغط Tab عبر الصفحة، افتح وأغلق نافذة حوارية، احذف عنصراً، أرسل نموذجاً.",
    srFocusIdle: "ابدأ التتبّع ثم استخدم لوحة المفاتيح. يُسجَّل كل انتقال للتركيز مع الدور والاسم الذي سيُعلَن؛ ويُعلَّم فقدان التركيز إلى <body>، وهروبه من النافذة الحوارية، ووقوعه على عناصر بلا اسم أو مخفية.",
    srWalk: "جولة تلقائية", srWalkRunning: "جارٍ التنقّل…", srWalkTitle: "ينقل التركيز تلقائياً عبر كل محطات Tab ويبلّغ عن المحطات غير القابلة للوصول وقفزات الترتيب والمصائد المحتملة والعناصر المخصّصة التي تتجاهل الأسهم / Enter / Space / Escape (مفاتيح اصطناعية — تلميحات تُتحقّق يدوياً)",
    srWalkSummary: (r) => `الجولة التلقائية: وصل التركيز إلى ${r.reached} من ${r.candidates} محطة Tab${r.truncated ? " (بحد أقصى " + r.steps + ")" : ""} · ${r.unreachable.length} غير قابلة للوصول · ${r.jumps.length} قفزة ترتيب · ${r.traps.length} مصيدة محتملة${r.traps.length ? " — تحقّق من المصائد يدوياً بمفتاح Tab حقيقي" : ""}${r.probed ? ` · ${r.probed} عنصر مخصّص مفحوص${r.probeCapped ? " (بحد أقصى 40)" : ""}، ${(r.widgets || []).filter((w) => !w.ok).length} تلميح لوحة مفاتيح — مفاتيح اصطناعية، تحقّق يدوياً` : ""}`,
    srWalkNone: "الجولة التلقائية: لا محطات Tab في الصفحة.", srWalkFailed: "فشلت الجولة التلقائية: ",
    srLang: "فحص اللغات", srLangRunning: "جارٍ فحص النصوص بحثاً عن تعارض بين الخط واللغة المعلنة…",
    srLangOk: "اللغات المعلنة تطابق النصوص. سيبدّل قارئ الشاشة الأصوات بشكل صحيح.",
    srSecNtc: "تباين العناصر غير النصية (الحدود والأيقونات والمفاتيح)", srNtc: "فحص التباين غير النصي", srNtcRunning: "جارٍ قياس حدود عناصر التحكم والمفاتيح والأيقونات مقابل خلفيتها…",
    srNtcOk: "كل حدود عناصر التحكم والمفاتيح والأيقونات القابلة للقياس تبلغ 3:1 مقابل خلفيتها.",
    srNtcNote: "معيار WCAG 1.4.11 — لا توجد قاعدة له في axe. لكل حقل نموذج مرئي وزر/رابط أيقوني ومفتاح تبديل مخصص، يجب أن يبلغ حدّ واحد يعتمد عليه المبصر (أي جانب إطار ظاهر، أو خلفية العنصر نفسه، أو رمز الأيقونة — الأفضل بينها هو الحكم) نسبة 3:1 مقابل الخلفية خلفه. تُتجاهل العناصر المعطّلة والعناصر الأصلية التي يرسمها المتصفح بنفسه والعناصر فوق صورة أو تدرّج (خلفية مجهولة).",
    srNtcStats: (r) => `قيس ${r.checked} عنصر تحكم · ` + (r.issues.length ? `⚠ ${r.issues.length} دون 3:1` : "✓ الكل يبلغ 3:1"),
    srNtcDone: (n) => n ? `التباين غير النصي — ${n} عنصر تحكم دون 3:1` : "التباين غير النصي — كل العناصر تبلغ 3:1", srNtcFailed: "فشل فحص التباين غير النصي: ",
    srNtcKind: { border: "إطار", background: "خلفية", icon: "أيقونة" }, srNtcOn: "على",
    srSecReflow: "إعادة التدفق والتكبير (320 بكسل / نص 200٪)", srReflow: "تشغيل اختبار إعادة التدفق", srReflowRunning: "جارٍ عرض الصفحة بعرض 320 بكسل ثم بعرضها الأصلي مع نص 200٪ عبر بروتوكول DevTools…",
    srReflowOk: "لا تمرير أفقي ولا نص مقطوع ولا عناصر تحكم متداخلة ولا أشرطة ثابتة ضخمة عند 320 بكسل، ولا نص مقطوع أو تداخل مع نص 200٪.",
    srReflowNote: "معيار WCAG 1.4.10 إعادة التدفق / 1.4.4 تغيير حجم النص — تُعرض الصفحة بعرض 320 بكسل (ما يعطيه تكبير 400٪ على شاشة 1280 بكسل) ثم بعرضها الأصلي مع نص 200٪ (WCAG 1.4.4) عبر بروتوكول DevTools: التمرير الأفقي (لا بأس بحاوية تتمرر، أو درج خارج الشاشة، أو جدول بيانات يتمرر داخل صندوقه)، النص المقطوع بـ overflow hidden/clip، عناصر التحكم التي يغطي أحدها الآخر فعلاً (باختبار نقر — زر البحث فوق حقله لا بأس به)، والأشرطة الثابتة الأطول من ربع الشاشة (اللاصقة فقط عند التصاقها بالأعلى؛ تُتجاهل الحوارات). المشاكل الموجودة أصلاً بالعرض الطبيعي تُعلَّم وتُحسب متوسطة. يتطلب إذن debugger (الإعدادات ← فحوص قارئ الشاشة)؛ يعرض Chrome شريط \"debugging\" لنحو ثانية وتُستعاد الصفحة بعدها.",
    srReflowStats: (s) => `عرض الصفحة ${s.scrollWidth} بكسل عند 320 بكسل · ${s.controls} عنصر تحكم` + (s.issues ? ` · ⚠ ${s.issues} مشكلة/مشاكل` : " · ✓ تعيد التدفق"),
    srReflowDone: (n) => n ? `اختبار إعادة التدفق — ${n} مشكلة/مشاكل` : "اختبار إعادة التدفق — الصفحة تعيد التدفق", srReflowFailed: "فشل اختبار إعادة التدفق: ",
    srReflowShotBase: (w) => `قبل (${w} بكسل)`, srReflowShot320: "عرض 320 بكسل",
    srReflowPermission: "إذن debugger غير ممنوح. امنحه مرة واحدة من صفحة الإعدادات (يلزم تفاعل مستخدم هناك) ثم أعد التشغيل.",
    srReflowUnavailable: "غير متاح في هذا المتصفح — اختبار إعادة التدفق يعتمد على chrome.debugger (Chromium فقط).",
    srReflowSkipped: "تخطّى «تشغيل الفحوص» اختبار إعادة التدفق — امنح إذن debugger مرة واحدة من الإعدادات لتضمينه.",
    srReflowCode: { "reflow-horizontal-scroll": "تمرير أفقي · 320 بكسل", "reflow-clipped-text": "نص مقطوع · 320 بكسل", "reflow-clipped-text-200": "نص مقطوع · نص 200٪", "reflow-overlap": "تداخل · 320 بكسل", "reflow-overlap-200": "تداخل · نص 200٪", "reflow-fixed-too-tall": "شريط ثابت طويل جداً · 320 بكسل" },
    srReflowMsg: (code, d) => code === "reflow-horizontal-scroll" ? `يمتد حتى ${d.right} بكسل عند عرض 320 بكسل (عرضه ${d.width} بكسل؛ الصفحة تتمرر حتى ${d.scrollWidth} بكسل) — تمرير في اتجاهين${d.row ? " — صف من العناصر لا يلتف" : ""}`
      : code.startsWith("reflow-clipped-text") ? `النص مقطوع ${d.zoom ? "مع نص 200٪" : "عند 320 بكسل"}: يحتاج ${d.need} بكسل والصندوق ${d.box} بكسل (${d.props})${d.base ? " — وأيضاً بالعرض الطبيعي" : ""}`
      : code.startsWith("reflow-overlap") ? `يتداخل مع ${d.sel2} بنسبة ${d.pct}٪ ${d.zoom ? "مع نص 200٪" : "عند 320 بكسل"} — أحد العنصرين مغطّى${d.base ? " (وأيضاً بالعرض الطبيعي)" : ""}`
      : `شريط ${d.position} بارتفاع ${d.height} بكسل يغطي ${d.pct}٪ من شاشة ${d.innerHeight} بكسل عند 320 بكسل`,
    srAx: "جلب شجرة المتصفح", srAxRunning: "جارٍ قراءة شجرة إمكانية الوصول عبر بروتوكول DevTools…",
    srAxNote: "يقرأ الشجرة التي يسلّمها المتصفح فعلاً إلى NVDA/VoiceOver عبر بروتوكول DevTools — المرجع الحاسم عندما يختلف ترتيب القراءة أعلاه عن قارئ الشاشة الحقيقي. يتطلب إذن debugger (الإعدادات ← فحوص قارئ الشاشة)؛ يعرض Chrome شريط \"debugging\" لنحو ثانية.",
    srScoreTitle: "درجة قارئ الشاشة", srScoreOf: "من 100", srScoreTop: "أهم 5 إصلاحات", srScoreClean: "لا شيء لإصلاحه — كل قسم تم تشغيله سليم.",
    srScorePass: "✓ ناجح", srScoreWarn: "△ تحذير", srScoreFail: "✗ راسب", srScoreIssues: (n) => `${n} مشكلة`, srScoreNotRun: "لم يُشغَّل",
    srScoreSecOrder: "ترتيب القراءة", srScoreSecLive: "المناطق الحية", srScoreSecFocus: "تتبّع التركيز", srScoreSecLang: "اللغة", srScoreSecNtc: "التباين غير النصي", srScoreSecReflow: "إعادة التدفق", srScoreSecAx: "شجرة المتصفح", srScoreSecCmp: "ثنائي اللغة",
    srSecCmp: "مقارنة النسختين (عربي/إنجليزي)", srCmp: "قارن", srCmpRunning: "جارٍ تحميل صفحة اللغة الأخرى في تبويب مخفي ومقارنتها…",
    srCmpUrlPh: "https://…/en/ — رابط النسخة باللغة الأخرى",
    srCmpNote: "يحمّل صفحة اللغة الأخرى في تبويب مخفي ويقارن شجرتي إمكانية الوصول: عناصر التحكم، الأسماء، تسميات المعالم، المناطق الحية ومستويات العناوين الموجودة في جهة واحدة فقط، إضافة إلى lang/dir في كل جهة.",
    srCmpNoUrl: "أدخل رابط النسخة باللغة الأخرى أولاً.", srCmpOk: "لا فروق — النسختان تعرضان نفس عناصر التحكم والأسماء والمعالم والمناطق الحية وبنية العناوين.",
    srCmpStats: (n) => n ? `⚠ ${n} فرق/فروق` : "✓ 0 فروق", srCmpDone: (n) => n ? `مقارنة النسختين — ${n} فرق/فروق` : "مقارنة النسختين — 0 فروق",
    srCmpThis: "هذه الصفحة", srCmpOther: "الصفحة الأخرى", srCmpUrls: (a, b) => `تمت المقارنة بين ${a} ↔ ${b}`,
    srCmpFailed: "فشلت مقارنة النسختين: ", srCmpNavigated: "انتقلت الصفحة المفحوصة أثناء المقارنة — أعد تشغيلها",
    srScriptAr: "عربي", srScriptLatin: "لاتيني", srPersistFailed: "تعذّر حفظ نتائج قارئ الشاشة: ",
    srOrderStats: (s, truncated) => `${s.rows} عقدة · ${s.interactive} تفاعلي · ${s.headings} عناوين · ${s.landmarks} معالم · ${s.images} صور · ` +
      (s.issues ? `⚠ ${s.issues} مشكلة/مشاكل` : "✓ لا مشاكل") + (truncated ? " (مقتطع)" : ""),
    srCmpMissing: (side, role, n) => `${n > 1 ? n + " × " : ""}${role} موجود في ${side} فقط — لا يوجد عنصر تحكم مقابل في النسخة الأخرى`,
    srCmpUnnamed: (side, role) => `${role} له اسم في ${side} لكنه بلا اسم متاح في النسخة الأخرى`,
    srCmpLandmark: (side, role) => `معلم ${role} له تسمية في ${side} فقط — قائمة المعالم تختلف بين اللغتين`,
    srCmpLive: (side) => `منطقة حية موجودة في ${side} فقط — التحديثات صامتة في النسخة الأخرى`,
    srCmpHeadings: (lvl, a, b) => `عناوين المستوى ${lvl}: ${a} في هذه الصفحة مقابل ${b} في الأخرى — التنقل بالعناوين يختلف بين اللغتين`,
    srCmpHtmlLang: (side, lang, det) => `html lang="${lang || "—"}" في ${side} بينما النص غالباً ${det}`,
    srCmpHtmlDir: (side, dir) => `html dir="${dir || "—"}" في ${side} بينما النص عربي — يجب أن يكون dir="rtl"`,
    srCmpSameLang: (lang) => `النسختان تعلنان html lang="${lang}" — إحداهما خاطئة وسيستخدم قارئ الشاشة الصوت نفسه لكلتيهما`,
    srNavigated: "انتقال", srClickHighlight: "انقر للتظليل في الصفحة",
    srKindAnnounced: "مُعلَن", srKindSilent: "صامت", srKindRisky: "قد يُفوَّت", srKindFocused: "عبر التركيز", srKindRerender: "إعادة رسم", srKindNav: "انتقال", srKindFocus: "تركيز", srKindFocusLost: "فُقد التركيز", srKindRoute: "تنقّل",
    srRouteTitleLbl: "العنوان", srRouteH1Lbl: "H1", srRouteSame: "بلا تغيير", srRouteFocusMoved: (to) => `انتقل التركيز إلى ${to}`, srRouteFocusStayed: "بقي التركيز مكانه", srRouteAnnounced: "أُعلن", srRouteNotAnnounced: "لم يُعلَن شيء",
    srRouteTitleNever: (n, title) => `العنوان لا يتغير أبداً — كل ${n} صفحات/حالات المسار تتشارك "${title || "(فارغ)"}"`,
    srRouteTitleNeverNote: "على كل صفحة أو خطوة في الرحلة أن تضبط document.title الخاص بها: فهو اسم التبويب وأول ما يُعلَن بعد الانتقال وما يظهر في السجل والإشارات المرجعية.",
    srRouteNoteSilent: "تغيّر URL لكن العنوان بقي كما هو ولم ينتقل التركيز ولم يُعلَن شيء — مستخدم قارئ الشاشة لا يعرف أن الصفحة تغيّرت",
    srRouteNoteQuerySilent: "تغيّرت معاملات الاستعلام وأُعيد رسم المحتوى دون أي إعلان — أعلن ما تغيّر (مثل «الصفحة 2 من 10» أو «12 نتيجة») في منطقة حيّة",
    srRouteNoteTitleStale: (title) => `ما زال document.title «${title || "(فارغ)"}» بعد تغيّر URL — عنوان التبويب وأول ما يُعلَن عند تغيّر الصفحة لا يتحدّثان أبداً`,
    srRouteNoteFocusStale: "بقي التركيز على عنصر أُزيل أو أُخفي بعد تغيّر المسار — مؤشر قارئ الشاشة عالق",
    srRouteNoteFocusMid: "بقي التركيز في منتصف الصفحة على العنصر الذي أطلق الانتقال بينما استُبدل المحتوى فوقه — انقل التركيز إلى عنوان الصفحة الجديدة",
    srRouteNoteOk: (announced) => "تغيّر العنوان وانتقل التركيز — مستخدم قارئ الشاشة يسمع الصفحة الجديدة" + (announced ? " (مع إعلان حيّ)" : ""),
    srRouteNoteH1: (h1) => `ما زال H1 يقرأ «${h1}» على URL الجديد — كل صفحة/خطوة تحتاج H1 خاصاً بها`,
    srMsgStateMissingTab: "التبويب بلا aria-selected — لا يستطيع قارئ الشاشة قول أي تبويب مفتوح",
    srMsgStateMissingTabCls: (w) => `التبويب بلا aria-selected (الحالة في الصنف «${w}» فقط) — لا يستطيع قارئ الشاشة قول أي تبويب مفتوح`,
    srMsgStateMissing: (role, w, attr) => `${role} يحتفظ بحالته في الصنف «${w}» فقط — بلا ${attr}، فيعلنه قارئ الشاشة بالطريقة نفسها في الحالتين`,
    srMsgRequired: (m) => `مُعلَّم كإلزامي بصرياً («${m}») لكنه بلا required ولا aria-required — يُعلَن كحقل اختياري`,
    srMsgReadonly: "readonly على حقل منتقي (تاريخ/وقت/combobox) — يُعلَن «للقراءة فقط» مع أن المستخدم يُتوقّع منه تغيير قيمته؛ مستخدمو قارئ الشاشة يتجاوزونه أو يظنونه مقفلاً",
    srMsgStepper: (n) => `متتبّع خطوات من ${n} خطوات يعرض التقدّم بالأيقونات/الأصناف فقط — بلا aria-current="step" ولا نص مخفي «الخطوة N من ${n}، مكتملة»، فيقرأ قارئ الشاشة قائمة عادية`,
    srMsgLinkNewWindow: (formBtn, name, role) => `يفتح في ${formBtn ? "نافذة جديدة (formtarget)" : "تبويب جديد"} دون أن يقول ذلك — يعلن قارئ الشاشة «${name}، ${role}» ويجد المستخدم نفسه في تبويب لم يتوقعه (WCAG 3.2.5)`,
    srMsgLinkDownload: (type, name) => `يُنزّل ملف ${type} لكن الاسم لا يذكر ذلك — يُعلَن «${name}، رابط» بلا نوع الملف أو حجمه (WCAG 2.4.4)`,
    srMsgLinkExternal: (host) => `يغادر الموقع إلى ${host} دون تلميح — لا شيء في الاسم يقول إنه رابط خارجي`,
    srMsgLinkAsBtnCurrent: (what, crumb) => `${what} على عنصر ${crumb ? "مسار التنقل" : "ترقيم الصفحات"} الحالي — يُعلَن «رابط في الصفحة نفسها» مع أنه لا يذهب إلى أي مكان؛ لا يسمع قارئ الشاشة «الصفحة الحالية» أبداً`,
    srMsgLinkAsBtnNav: (what, crumb) => `${what} داخل ${crumb ? "مسار تنقل" : "ترقيم صفحات"} — يُعلَن «رابط في الصفحة نفسها» ويقفز Enter إلى أعلى الصفحة بدل التنقل`,
    srMsgLinkAsBtnHandler: (what) => `${what} مع معالج نقر — يُعلَن «رابط في الصفحة نفسها» لا زراً، ويمرّر Enter إلى أعلى الصفحة قبل تشغيل السكربت`,
    srMsgGroupNoLabel: (n, kind, hint) => `${n} عناصر ${kind === "radio" ? "اختيار مفرد" : "مربع اختيار"} تشكّل مجموعة بلا اسم — لا <fieldset>/<legend> ولا role="group" بتسمية${hint ? ` (النص الظاهر «${hint}» غير مرتبط)` : ""}؛ يعلن قارئ الشاشة كل عنصر بنصه فقط دون موضوع الاختيار`,
    srMsgNontextContrast: (ratio, kind, color, bg) => `تباين غير نصي ${ratio}:1 — ${kind === "border" ? "الحدود" : kind === "background" ? "خلفية العنصر" : "الأيقونة"} ${color} على ${bg}؛ حدود عنصر التحكم أو مؤشر حالته أو أيقونته تحتاج 3:1 (WCAG 1.4.11)`,
    srMsgFocusRingLowContrast: (kind, color, ratio, bg) => `حلقة التركيز (${kind} ${color}) تباينها ${ratio}:1 مع خلفيتها ${bg} — المطلوب 3:1 (WCAG 2.4.11 / 1.4.11)`,
    srMsgFocusRingThin: (w, kind) => `سماكة حلقة التركيز ${w}px فقط (${kind}) — استخدم 2px على الأقل لتُلاحظ`,
    srMsgFocusRingClipped: (overflow, sel, kind, extent) => `حلقة التركيز مقطوعة بعنصر أصل له overflow:${overflow} (${sel}) — تمتد ${kind} مسافة ${extent}px خارج العنصر`,
    srMsgWidgetNoArrow: (keys, widget, container) => `عنصر مخصّص: ${keys} لم تغيّر شيئاً داخل role="${widget}" (${container}) — لا انتقال للتركيز ولا تغيّر في حالة aria أو DOM خلال 150 مللي ثانية؛ مستخدم لوحة المفاتيح عالق عند العنصر الأول (تلميح من مفاتيح اصطناعية — تحقّق بلوحة مفاتيح حقيقية)`,
    srMsgWidgetNoEnterSpace: (keys, haspopup, widget) => `عنصر مخصّص: ${keys} لم تغيّر شيئاً في ${haspopup ? "aria-haspopup=\"" + haspopup + "\" " : ""}${widget} هذا — تحقّق يدوياً — المفاتيح الاصطناعية لا تشغّل التفعيل الأصلي، لكن div/span بمعالج نقر فقط لا يُفتح أبداً لمستخدمي لوحة المفاتيح`,
    srMsgWidgetEscNoClose: (changed) => `عنصر مخصّص: النافذة المنبثقة التي فتحها Enter لم تُغلق بـ Escape (${changed || "بلا تغيير"} خلال 150 مللي ثانية) — ينتهي المستخدم بضغط Escape مرتين أو الخروج بـ Tab (تلميح من مفاتيح اصطناعية — تحقّق يدوياً)`,
    srMsgQuestionNotAssoc: (names, q) => `أزرار ${names} غير مرتبطة بالسؤال «${q}» — في قائمة الأزرار (أو عند الوصول إليها بـ Tab مباشرة) يعلن قارئ الشاشة ${names} فقط دون ما يُسأل عنه؛ لفّها في role="group" مع aria-labelledby يشير إلى السؤال`,
    srMsgLabelNotAssoc: (lbl, name) => `التسمية الظاهرة «${lbl}» غير مرتبطة بالحقل — يُعلَن ${name ? `«${name}»` : "حقلاً بلا اسم"} بدلاً منها؛ استخدم <label for> ليكون النص المجاور للحقل هو ما يسمعه قارئ الشاشة (والتحكم الصوتي)`,
    srApplyGroupLabel: "تسمية المجموعة", srApplyFieldLabel: "تسمية الحقل",
    presetComboBp: "أفضل الممارسات", presetComboSr: "قارئ الشاشة", srStateLbl: "الحالة",
    srMoreRows: (n) => `…و${n} صف/صفوف أخرى.`, srOrderBuilt: (n) => n ? `بُني ترتيب القراءة — ${n} مشكلة/مشاكل لقارئ الشاشة` : "بُني ترتيب القراءة — لا مشاكل تسمية",
    srFindingsAdded: (n, title) => `أُضيفت ${n} نتيجة/نتائج إلى «${title}» — راجع تبويب الاختبارات اليدوية.`,
    srLangStats: (r) => `html lang="${r.htmlLang || "—"}" dir="${r.htmlDir || "—"}" · ${r.totals.arabic.toLocaleString()} حرف عربي / ${r.totals.latin.toLocaleString()} حرف لاتيني · ` + (r.issues.length ? `⚠ ${r.issues.length} مشكلة/مشاكل` : "✓ لا مشاكل"),
    srLangDone: (n) => n ? `فحص اللغة — ${n} مشكلة/مشاكل` : "فحص اللغة — لا مشاكل", srAxDone: "تم جلب شجرة إمكانية الوصول في المتصفح.",
    srFixApplied: "طُبّق الإصلاح في الصفحة", srFixUndone: "تم التراجع عن الإصلاح",
    srScoreNoName: "(بلا اسم)", srScoreHint: "انقر أي بند لتظليله في الصفحة والانتقال إلى صفّه.",
    srSecJourney: "نص الرحلة (Transcript)", srJourneyCopy: "نسخ النص", srJourneyCopied: "نُسخ", srJourneyTitle: "نص قارئ الشاشة للرحلة",
    srJourneyStats: (j) => `${j.steps.length} خطوة · ${j.pages.length} صفحة/حالة · ${(j.duration / 1000).toFixed(1)} ث · ${j.gaps.length ? "✗ " + j.gaps.length + " فجوة" : "✓ لا فجوات"}`,
    srJourneyEmpty: "لم تُلتقط أحداث قارئ شاشة أثناء المسار — تنقّل بمفتاح Tab أو فعّل تحديثات أثناء التسجيل.",
    srJourneyHint: "انقر أي خطوة لتظليل عنصرها في الصفحة.", srJourneyNav: (l) => `انتقال إلى ${l}`, srJourneyRerender: (n) => `إعادة رسم: ${n}`,
    srJourneyNoName: "(بلا اسم)", srJourneyStart: "بدأ التسجيل", srJourneyEnd: "توقف التسجيل",
    srGapSilent: "صامت — تغيّر المحتوى ولم يُعلَن شيء", srGapRisky: "قد يُفوَّت — أُنشئت المنطقة الحية مع محتواها",
    srGapFocusLost: "فقدان التركيز — عاد التركيز إلى <body>", srGapModalEscape: "هروب من النافذة — خرج التركيز من مربع الحوار المفتوح",
    srGapQuiet: (sec) => `صمت — ${sec} ث من تغييرات DOM بلا أي إعلان`,
    srGapRouteSilent: "تنقّل صامت — تغيّر العنوان URL دون تغيير العنوان أو انتقال التركيز أو أي إعلان", srGapRouteTitle: "عنوان قديم — لم يتغير document.title مع تغيّر URL",
    srGapRouteH1: "نفس H1 — الصفحة/الخطوة الجديدة تحمل نفس H1 السابق", srGapRouteFocus: "تركيز عالق — بقي التركيز في منتصف الصفحة بعد الانتقال",
    srGapState: (attr) => `حالة غير مُعلَنة — تغيّرت حالة عنصر التحكم (صنف/إظهار) دون ${attr}`,
    srJourneyRoute: (txt) => `تنقّل ${txt}`,
    srAxPermission: "إذن debugger غير ممنوح. امنحه مرة واحدة من صفحة الإعدادات (يلزم تفاعل مستخدم هناك) ثم أعد الجلب.",
    srAxOpenOptions: "فتح الإعدادات", srAxUnavailable: "غير متاح في هذا المتصفح — شجرة المتصفح تعتمد على chrome.debugger (Chromium فقط).",
    srRulesChk: "قواعد قارئ الشاشة",
    srNow: "الحالي:", srChangeTo: "غيّره إلى:",
    noScanRuleSet: "لم يُجرَ الفحص الآلي", noScanNote: "لم يُشغَّل فحص axe-core الآلي لهذا التقرير — نُفِّذت الأقسام أدناه فقط. اضغط «فحص الصفحة» لإضافة النتائج الآلية.", srChangeToFw: "غيّره إلى ({fw}):",
    srDiffLegend: "أخضر = مضاف، أحمر = محذوف",
    srRestored: (time) => `مُستعاد من ${time}`, srRestoredTitle: "نتائج محفوظة لهذا العنوان من جلسة سابقة؛ أعد تشغيل الفحص للحصول على بيانات جديدة.",
    srBadgeTitle: "مشاكل قارئ الشاشة الحالية", srBadgeNone: "لا مشاكل لقارئ الشاشة بعد",
    srGroupBadge: (n) => `×${n} متطابقة`, srGroupBadgeTitle: "نفس الوسم والأصناف والدور والمشاكل — انقر لتظليل كل النسخ",
    srGroupSelectors: (n) => `${n} نسخ — انقر أي محدد لتظليله`, srGroupNote: (n) => `×${n} متطابقة`,
    srApply: "طبّق على الصفحة", srUndo: "تراجع", srApplying: "جارٍ التطبيق…", srApplyFailed: "فشل التطبيق: ",
    srFixedBadge: "✓ أُصلح", srFixedMsg: "أُصلح في الصفحة — لم تعد المشكلة تظهر لهذا العنصر.",
    srStillFlagged: "طُبّق، لكن المشكلة ما زالت مُعلَّمة — راجع «الحالي» المحدَّث أعلاه.",
    srAppliedVerifyLive: "طُبّق — أعد تشغيل التحديث للتحقق من إعلانه.",
    srAppliedVerifyFocus: "طُبّق — انتقل بـ Tab إلى العنصر مجدداً للتحقق.",
    srApplyTemp: "يعيش في تحميل الصفحة الحالي فقط (إعادة التحميل تلغيه) — انسخ الإصلاح إلى الشيفرة المصدرية.",
    srApplyName: "الاسم المتاح", srApplyAlt: "النص البديل (فارغ = زخرفي)", srApplyLang: "رمز اللغة", srApplyLandmark: "تسمية المَعلَم",
    srRunAllDone: "شُغِّلت كل الفحوص — المراقبة الحية تعمل؛ تفاعل مع الصفحة.",
    srShowFix: (n) => `الإصلاح · ${n} ${n === 1 ? "إجراء" : "إجراءات"}`, srShowDetails: "التفاصيل",
    stepIdle: "لم يُشغَّل", stepRunning: "جارٍ التشغيل…", stepIssues: (n) => `${n} ${n === 1 ? "مشكلة" : "مشاكل"}`, stepClean: "سليم", stepError: "فشل",
    srLiveStatsFmt: (ann, silent, risky) => `${ann} مُعلَن · ${silent} صامت · ${risky} قد يُفوَّت`, srLiveStatsRoute: (n, bad) => ` · ${n} تنقّل${bad ? "، " + bad + " صامت/قديم" : ""}`,
    srFocusStatsFmt: (moves, issues) => `${moves} انتقال تركيز · ${issues ? "⚠ " + issues + " مشكلة/مشاكل" : "✓ لا مشاكل"}`,
    srAxStatsFmt: (s, truncated) => `${s.rows} عقدة معروضة من ${s.total} (${s.ignored} تجاهلها المتصفح) · ` + (s.issues ? `⚠ ${s.issues} مشكلة/مشاكل` : "✓ لا مشاكل") + (truncated ? " (مقتطع)" : ""),
    srOrderFailed: "فشل بناء ترتيب القراءة: ", srLiveFailed: "فشلت المراقبة الحية: ", srFocusFailed: "فشل تتبّع التركيز: ", srLangFailed: "فشل فحص اللغة: ", srAxFailed: "فشل جلب شجرة المتصفح: ",
  },
};

let lang = "en";
const t = (key, ...args) => {
  const v = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  return typeof v === "function" ? v(...args) : v;
};

/* ---------------- icons + labels ----------------
   Controls carry a 14px inline SVG from the sprite in panel.html instead of emoji. */
const SVG_NS = "http://www.w3.org/2000/svg";
function svgIcon(id, cls = "") {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "ic " + id + (cls ? " " + cls : ""));
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", "#" + id);
  svg.appendChild(use);
  return svg;
}
// icon + label; no whitespace nodes, so el.textContent === text. iconId null = text only.
function setLabel(el, iconId, text, { narrowHide = false, trailing = null } = {}) {
  if (!el) return;
  const parts = [];
  if (iconId) parts.push(svgIcon(iconId));
  if (text != null) {
    const span = document.createElement("span");
    span.className = "lbl" + (narrowHide ? " narrow-hide" : "");
    span.textContent = text;
    parts.push(span);
  }
  if (trailing) parts.push(trailing);
  el.replaceChildren(...parts);
}

const tabBtn = (view) => document.querySelector(`#tabs button[data-view="${view}"]`);
// Tab = icon + .lbl + .tab-badge; relabelling writes only .lbl so badges survive.
function setTabLabel(view, iconId, text) {
  const btn = tabBtn(view);
  if (!btn) return;
  if (iconId && !btn.querySelector(":scope > svg")) btn.prepend(svgIcon(iconId));
  let lbl = btn.querySelector(":scope > .lbl");
  if (!lbl) {
    lbl = document.createElement("span");
    lbl.className = "lbl";
    btn.appendChild(lbl);
  }
  lbl.textContent = text;
}
// Digits-only badge; text null/"" hides it. tone = ok | neutral | critical | serious | moderate | minor.
function setTabBadge(view, text, tone) {
  const btn = tabBtn(view);
  if (!btn) return null;
  let badge = btn.querySelector(":scope > .tab-badge");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "tab-badge";
    btn.appendChild(badge);
  }
  const show = text != null && text !== "";
  badge.hidden = !show;
  badge.textContent = show ? String(text) : "";
  if (tone) badge.dataset.tone = tone; else delete badge.dataset.tone;
  return badge;
}
// Centred first-run block: 24px icon, title, one sentence, one button.
function emptyState({ icon, titleKey, textKey, btnId, btnKey, onClick, btnClass = "btn primary" }) {
  const wrap = document.createElement("div");
  wrap.className = "empty-state";
  wrap.appendChild(svgIcon(icon, "lg"));
  if (titleKey) {
    const h = document.createElement("h2");
    h.className = "empty-title";
    h.textContent = t(titleKey);
    wrap.appendChild(h);
  }
  if (textKey) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = t(textKey);
    wrap.appendChild(p);
  }
  if (btnKey) {
    const b = document.createElement("button");
    b.className = btnClass;
    if (btnId) b.id = btnId;
    setLabel(b, "i-play", t(btnKey));
    if (onClick) b.addEventListener("click", onClick);
    wrap.appendChild(b);
  }
  return wrap;
}

/* ---------------- element refs ---------------- */

const scanBtn = document.getElementById("scanBtn");
const flowBtn = document.getElementById("flowBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const resultsEl = document.getElementById("results");
const levelSelect = document.getElementById("levelSelect");
const bestPractice = document.getElementById("bestPractice");
const exportGroup = document.getElementById("exportGroup");
const highlightAllBtn = document.getElementById("highlightAllBtn");
const autofixBtn = document.getElementById("autofixBtn");
const diffEl = document.getElementById("diff");
const staleEl = document.getElementById("stale");
const contrastToggle = document.getElementById("contrastToggle");
const contrastBar = document.getElementById("contrastBar");
const statusBar = document.getElementById("statusBar");
const scanSettings = document.getElementById("scanSettings");
const settingsBtn = document.getElementById("settingsBtn");
const exportBtn = document.getElementById("exportBtn");
const densityBtn = document.getElementById("densityBtn");
const optionsBtn = document.getElementById("optionsBtn");
const helpBtn = document.getElementById("helpBtn");
const tabsNav = document.getElementById("tabs");
const manualView = document.getElementById("manual");
const manualListEl = document.getElementById("manualList");
const manualProgressEl = document.getElementById("manualProgress");
const manualNextBtn = document.getElementById("manualNextBtn");
const manualBar = document.getElementById("manualBar");
const manualIntro = document.getElementById("manualIntro");
const manualFilters = document.getElementById("manualFilters");
const dlsEmpty = document.getElementById("dlsEmpty");
const dlsEmptyRun = document.getElementById("dlsEmptyRun");
const dlsScoreLine = document.getElementById("dlsScoreLine");
const dlsClearBtn = document.getElementById("dlsClearBtn");
const helpView = document.getElementById("help");
const autoView = document.getElementById("auto");
const modeSelect = document.getElementById("modeSelect");
const filterRow = document.getElementById("filterRow");
const dlsContrastChk = document.getElementById("dlsContrastChk");
const filterInput = document.getElementById("filterInput");
const filterCount = document.getElementById("filterCount");
const dlsFilterRow = document.getElementById("dlsFilterRow");
const dlsFilterInput = document.getElementById("dlsFilterInput");
const dlsFilterCount = document.getElementById("dlsFilterCount");
const dlsHighlightAllBtn = document.getElementById("dlsHighlightAllBtn");
const srFilterInput = document.getElementById("srFilterInput");
const srFilterCount = document.getElementById("srFilterCount");
const manualFilterInput = document.getElementById("manualFilterInput");
const manualFilterCount = document.getElementById("manualFilterCount");
const resetBtn = document.getElementById("resetBtn");
const dlsView = document.getElementById("dlsView");
const helpListEl = document.getElementById("helpList");
const srRulesChk = document.getElementById("srRulesChk"); // referenced by top-level wiring below
const overviewView = document.getElementById("overview");
const ovHero = document.getElementById("ovHero");
const ovCards = document.getElementById("ovCards");
const ovTop = document.getElementById("ovTop");
const ovUrl = document.getElementById("ovUrl");
const ovTime = document.getElementById("ovTime");
const runAllBtn = document.getElementById("runAllBtn");
const ovRunAuto = document.getElementById("ovRunAuto");
const ovRunDls = document.getElementById("ovRunDls");
const ovRunSr = document.getElementById("ovRunSr");
const ovRunManual = document.getElementById("ovRunManual");
const srRunAllBtn = document.getElementById("srRunAllBtn"); // stage 4
const srSteps = document.getElementById("srSteps"); // stage 4

const LEVEL_TAGS = {
  wcag2a: ["wcag2a"],
  wcag2aa: ["wcag2a", "wcag2aa"],
  wcag21aa: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  wcag22aa: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
};

let settings = { level: "wcag22aa", bestPractice: true, srRules: true, flowInterval: 4, lang: "en" };
let lastReport = null;

// Contrast fixes can prefer UAE DLS palette tokens (Options → dlsContrast).
function fixOpts() {
  return settings.dlsContrast ? { dlsPalette: A11yFixes.DLS_COLORS } : undefined;
}

/* ---------------- init ---------------- */

async function init() {
  try {
    settings = await bg("settingsGet");
  } catch (_) { /* fall back to defaults */ }
  lang = settings.lang || "en";
  if (lang === "ar") {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }
  levelSelect.value = settings.level || "wcag22aa";
  modeSelect.value = settings.mode || "a11y";
  dlsContrastChk.checked = !!settings.dlsContrast;
  bestPractice.checked = !!settings.bestPractice;
  srRulesChk.checked = !!settings.srRules;
  setCompact(!!settings.compact, false);
  applyStrings();
  showView("overview");
}

// Scan presets: the three rule controls as one choice. "recommended" is the shipped default.
const SCAN_PRESETS = {
  recommended: { level: "wcag22aa", bestPractice: true, srRules: true },
  strict: { level: "wcag22aa", bestPractice: false, srRules: false },
  all: { level: "all", bestPractice: true, srRules: true },
};
const PRESET_STR = { recommended: "presetRecommended", strict: "presetStrict", all: "presetAll" };

// Which preset the current controls match, or null for a custom combination.
function currentPreset() {
  for (const [key, p] of Object.entries(SCAN_PRESETS)) {
    if (levelSelect.value === p.level && bestPractice.checked === p.bestPractice && srRulesChk.checked === p.srRules) return key;
  }
  return null;
}

function applyPreset(key) {
  const p = SCAN_PRESETS[key];
  if (!p) return;
  levelSelect.value = p.level;
  bestPractice.checked = p.bestPractice;
  srRulesChk.checked = p.srRules;
  Object.assign(settings, p);
  updateSettingsLabel();
  bg("settingsSet", { value: { ...p } }).catch(() => {});
}

// Short live label on the Scan settings button: the preset name ("Recommended") when one
// matches, otherwise the combination ("WCAG 2.1 AA + BP + SR"). Also syncs the preset buttons.
function updateSettingsLabel() {
  const preset = currentPreset();
  const level = levelSelect.value === "all" ? t("allRules") : levelSelect.selectedOptions[0].textContent;
  const combo = level + (bestPractice.checked ? " + " + t("presetComboBp") : "") + (srRulesChk.checked ? " + " + t("presetComboSr") : "");
  const lbl = document.createElement("span");
  lbl.className = "lbl narrow-hide";
  lbl.id = "scanSettingsLabel";
  lbl.dir = preset ? (lang === "ar" ? "rtl" : "ltr") : "ltr";
  lbl.textContent = preset ? t(PRESET_STR[preset]) : combo;
  settingsBtn.replaceChildren(svgIcon("i-sliders"), lbl, svgIcon("i-chevron"));
  settingsBtn.title = t("scanSettings") + " — " + level + (bestPractice.checked ? " + " + t("bestPractices") : "") + (srRulesChk.checked ? " + " + t("srRulesChk") : "");
  for (const b of document.querySelectorAll("#presetRow .btn.preset")) b.setAttribute("aria-pressed", String(b.dataset.preset === preset));
  document.getElementById("presetHint").textContent = t("presetHint")[preset || "custom"];
}

function setCompact(on, persist = true) {
  document.body.classList.toggle("compact", on);
  densityBtn.setAttribute("aria-pressed", String(on));
  if (persist) bg("settingsSet", { value: { compact: on } }).catch(() => {});
}

function applyStrings() {
  updateRunButton();
  setLabel(flowBtn, flowRecording ? "i-stop" : "i-record", flowRecording ? t("stopFlow") : t("flow"), { narrowHide: true });
  setLabel(clearBtn, "i-eraser", t("clear"));
  setLabel(contrastToggle, "i-contrast", null);
  contrastToggle.title = t("contrast");
  setLabel(highlightAllBtn, "i-target", t("highlightAll"));
  setLabel(exportBtn, "i-export", t("exportLabel"), { narrowHide: true, trailing: svgIcon("i-chevron") });
  document.getElementById("exportFilesHead").textContent = t("exportFiles");
  document.getElementById("exportTicketsHead").textContent = t("exportTickets");
  const EXPORT_META = { json: ["i-file", "JSON", "exportHintJson"], csv: ["i-file", "CSV", "exportHintCsv"], html: ["i-file", "HTML", "exportHintHtml"], pdf: ["i-file", "PDF", "exportHintPdf"],
    issues: ["i-ticket", "Issues", "exportHintIssues"], jira: ["i-ticket", "Jira", "exportHintJira"], azure: ["i-ticket", "Azure", "exportHintAzure"] };
  for (const b of document.querySelectorAll("#exportGroup button.export")) {
    const [icon, label, hintKey] = EXPORT_META[b.dataset.format] || ["i-file", b.dataset.format, null];
    const hint = document.createElement("span");
    hint.className = "menu-hint";
    hint.textContent = hintKey ? t(hintKey) : "";
    setLabel(b, icon, label, { trailing: hint });
  }
  document.getElementById("ruleSetLbl").textContent = t("ruleSet");
  document.getElementById("presetLbl").textContent = t("presetLbl");
  for (const b of document.querySelectorAll("#presetRow .btn.preset")) { b.textContent = t(PRESET_STR[b.dataset.preset]); b.title = t(PRESET_STR[b.dataset.preset] + "Title"); }
  document.getElementById("alsoRunLbl").textContent = t("alsoRun");
  document.querySelector("#bestPracticeLbl > .lbl").textContent = t("bestPractices");
  document.querySelector("#srRulesLbl > .lbl").textContent = t("srRulesChk");
  document.querySelector("#dlsContrastLbl > .lbl").textContent = t("dlsColorsChk");
  setLabel(document.getElementById("openOptionsLink"), "i-external", t("moreInOptions"));
  levelSelect.querySelector("option[value='all']").textContent = t("allRules");
  updateSettingsLabel();
  setLabel(densityBtn, "i-rows", null);
  densityBtn.title = t("compactRows");
  setLabel(resetBtn, "i-reset", null);
  resetBtn.title = t("reset");
  setLabel(optionsBtn, "i-gear", null);
  setLabel(helpBtn, "i-help", null);
  setTabLabel("overview", "i-grid", t("tabOverview"));
  setTabLabel("auto", "i-list", t("tabAuto"));
  setTabLabel("dls", "i-layout", t("tabDls"));
  setTabLabel("manual", "i-clipboard", t("tabManual"));
  setTabLabel("help", "i-help", t("tabHelp"));
  setLabel(document.getElementById("dlsBtn"), "i-layout", t("runDls"));
  setLabel(dlsEmptyRun, "i-play", t("runDls"));
  document.getElementById("dlsEmptyTitle").textContent = t("emptyTitleDls");
  document.getElementById("dlsIntro").textContent = t("dlsIntro");
  setLabel(dlsClearBtn, "i-eraser", t("clear"));
  dlsClearBtn.title = t("clear");
  setLabel(dlsHighlightAllBtn, "i-target", t("dlsHighlightAll"));
  dlsHighlightAllBtn.title = t("dlsHighlightAllTitle");
  dlsFilterInput.placeholder = t("dlsFilterPlaceholder");
  if (!dlsFilterRow.hidden) applyDlsFilter();
  manualFilterInput.placeholder = t("manualFilterPlaceholder");
  setLabel(manualNextBtn, "i-clipboard", t("manualNext"));
  manualIntro.textContent = t("manualIntro");
  document.getElementById("helpIntro").textContent = t("helpIntro");
  for (const b of manualFilters.querySelectorAll("button.pill")) {
    b.textContent = t({ untested: "mfUntested", pass: "mfPass", fail: "mfFail", na: "mfNa" }[b.dataset.verdict]);
    b.title = t("mfToggleTitle");
  }
  updateManualBar();
  setLabel(document.querySelector("#historySection > .section-summary"), "i-history", t("historySec"), { trailing: svgIcon("i-chevron") });
  const emptyP = document.querySelector("#results .empty");
  if (emptyP) emptyP.textContent = t("emptyResults");
  const emptyTitle = document.querySelector("#results .empty-title");
  if (emptyTitle) emptyTitle.textContent = t("emptyTitleAuto");
  setLabel(document.getElementById("emptyScanBtn"), "i-play", t("scan"));
  filterInput.placeholder = t("filterPlaceholder");
  for (const b of summaryEl.querySelectorAll("button.pill")) b.title = t("pillToggleTitle");
  staleEl.textContent = t("stale");
  setLabel(document.getElementById("pickFg"), "i-pipette", t("pickFg"));
  setLabel(document.getElementById("pickBg"), "i-pipette", t("pickBg"));
  const modeOpts = modeSelect.querySelectorAll("option");
  modeOpts[0].textContent = t("modeA11y");
  modeOpts[1].textContent = t("modeBoth");
  modeOpts[2].textContent = t("modeDls");
  updateModeTitle();
  applySrStrings();
}

init();

/* ---------------- event wiring ---------------- */

scanBtn.addEventListener("click", runActive);
runAllBtn.addEventListener("click", runAll);
ovRunAuto.addEventListener("click", runScan);
ovRunDls.addEventListener("click", runDlsCheck);
ovRunSr.addEventListener("click", srRunAll);
ovRunManual.addEventListener("click", manualNext);
manualNextBtn.addEventListener("click", manualNext);
dlsEmptyRun.addEventListener("click", runDlsCheck);
dlsClearBtn.addEventListener("click", clearHighlights);
dlsHighlightAllBtn.addEventListener("click", dlsHighlightAll);
dlsFilterInput.addEventListener("input", applyDlsFilter);
manualFilterInput.addEventListener("input", applyManualFilter);
// Manual verdict chips show/hide cards by verdict; the filter box narrows by title / WCAG ref / question / finding text.
const activeVerdicts = new Set(["untested", "pass", "fail", "na"]);
for (const pill of manualFilters.querySelectorAll("button.pill")) {
  pill.addEventListener("click", () => {
    const v = pill.dataset.verdict;
    if (activeVerdicts.has(v)) activeVerdicts.delete(v); else activeVerdicts.add(v);
    pill.classList.toggle("off", !activeVerdicts.has(v));
    pill.setAttribute("aria-pressed", String(activeVerdicts.has(v)));
    applyManualFilter();
  });
}
function applyManualFilter() {
  const q = manualFilterInput.value.trim().toLowerCase();
  const cards = manualListEl.querySelectorAll(".mtest");
  let shown = 0;
  for (const card of cards) {
    const match = activeVerdicts.has(card.dataset.verdict || "untested") &&
      (!q || ((card.dataset.search || "") + " " + card.textContent).toLowerCase().includes(q));
    card.hidden = !match;
    if (match) shown++;
  }
  manualFilterCount.textContent = cards.length ? t("manualFilterCount", shown, cards.length) : "";
}

/* ---- DLS tab: filter + Highlight all gaps ---- */

// Narrows the DLS check rows and the component rows by label, verdict (pass/warn/fail), detail text or selector.
function applyDlsFilter() {
  const q = dlsFilterInput.value.trim().toLowerCase();
  let shown = 0, total = 0;
  for (const row of dlsReportEl.querySelectorAll(".dls-row")) {
    if (!row.dataset.verdict) { row.hidden = !!q; continue; } // "N components not present" note
    total++;
    const match = !q || (row.dataset.verdict + " " + row.textContent).toLowerCase().includes(q);
    row.hidden = !match;
    if (match) shown++;
  }
  if (q) for (const det of dlsReportEl.querySelectorAll("details.dls-comp")) if (det.querySelector(".dls-row:not([hidden])")) det.open = true;
  dlsFilterCount.textContent = total ? t("dlsFilterCount", shown, total) : "";
}

async function dlsHighlightAll() {
  try {
    const n = await bg("dlsHighlight");
    startClickWatch();
    statusEl.textContent = dt("gapsShown", n);
  } catch (err) {
    statusEl.textContent = t("highlightFailed") + (err?.message || err);
  }
}

// Contextual DLS controls only make sense while a report is on screen.
function dlsToolsVisible(on) {
  dlsFilterRow.hidden = !on;
  dlsHighlightAllBtn.hidden = !on;
  dlsClearBtn.hidden = !on;
  if (!on) { dlsFilterInput.value = ""; dlsFilterCount.textContent = ""; }
}
for (const card of ovCards.querySelectorAll(".ov-card")) {
  card.addEventListener("click", () => showView(card.dataset.audit));
  card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showView(card.dataset.audit); } });
  for (const el of card.querySelectorAll("button, a")) el.addEventListener("click", (e) => { e.stopPropagation(); if (el.tagName === "A") { e.preventDefault(); showView(card.dataset.audit); } });
}
const updateModeTitle = () => { modeSelect.title = t("modeTitle") + ": " + (modeSelect.selectedOptions[0]?.textContent || ""); };
modeSelect.addEventListener("change", () => { updateModeTitle(); bg("settingsSet", { value: { mode: modeSelect.value } }).catch(() => {}); });
resetBtn.addEventListener("click", resetAll);
filterInput.addEventListener("input", applyFilter);
// the empty state's Scan button is rebuilt by resetAll(), so delegate
resultsEl.addEventListener("click", (e) => { if (e.target.closest("#emptyScanBtn")) runScan(); });

// Severity pills toggle their impact in/out of the findings list.
const activeImpacts = new Set(["critical", "serious", "moderate", "minor"]);
for (const pill of summaryEl.querySelectorAll("button.pill")) {
  pill.addEventListener("click", () => {
    const imp = pill.dataset.impact;
    if (activeImpacts.has(imp)) activeImpacts.delete(imp); else activeImpacts.add(imp);
    pill.classList.toggle("off", !activeImpacts.has(imp));
    pill.setAttribute("aria-pressed", String(activeImpacts.has(imp)));
    applyFilter();
  });
}

function applyFilter() {
  const q = filterInput.value.trim().toLowerCase();
  const cards = resultsEl.querySelectorAll("details.violation");
  let shown = 0;
  for (const card of cards) {
    const match = (!q || card.dataset.search.includes(q)) && activeImpacts.has(card.dataset.impact);
    card.hidden = !match;
    if (match) shown++;
  }
  for (const head of resultsEl.querySelectorAll(".sev-head")) {
    head.hidden = !resultsEl.querySelector(`details.violation[data-impact="${head.dataset.impact}"]:not([hidden])`);
  }
  filterCount.textContent = t("filterCount", shown, cards.length);
}

// Spinner + message while a long operation runs.
function statusBusy(msg) {
  statusEl.textContent = "";
  const sp = document.createElement("span");
  sp.className = "spin";
  statusEl.append(sp, " " + msg);
}

/* ---------------- Run / Run all ---------------- */

let runBusy = 0; // nested audits in flight (Run button disabled while > 0)
let scanInFlight = false;
function setRunBusy(on) {
  runBusy = Math.max(0, runBusy + (on ? 1 : -1));
  scanBtn.disabled = runBusy > 0 || flowRecording;
  updateRunButton();
}

// The header Run button follows the active view.
function updateRunButton() {
  const view = document.body.dataset.view || "overview";
  const key = { overview: "runAll", auto: "scan", dls: "runDls", sr: "srRunAll", manual: "manualNext" }[view];
  scanBtn.hidden = !key;
  if (!key) return;
  setLabel(scanBtn, runBusy > 0 ? null : "i-play", t(key));
  if (runBusy > 0) scanBtn.prepend(Object.assign(document.createElement("span"), { className: "spin" }));
  scanBtn.title = t("runTitle");
}

function runActive() {
  const view = document.body.dataset.view || "overview";
  if (view === "overview") return runAll();
  if (view === "auto") return runScan();
  if (view === "dls") return runDlsCheck();
  if (view === "sr") return srRunAll();
  if (view === "manual") return manualNext();
}

// Full audit, scoped by the mode select: a11y = scan + reading order + languages; both = + DLS; dls = DLS only.
async function runAll() {
  if (runBusy || flowRecording) return;
  const mode = modeSelect.value;
  const steps = mode === "dls" ? [["dls", runDlsCheck]] : [["auto", runScan], ["sr", buildReadingOrder], ["sr", runLangCheck]];
  if (mode === "both") steps.push(["dls", runDlsCheck]);
  setRunBusy(true);
  try {
    for (let i = 0; i < steps.length; i++) {
      const [audit, fn] = steps[i];
      statusBusy(t("runAllProgress", i + 1, steps.length));
      ovRunning.add(audit);
      renderOverview();
      try { await fn(); } catch (err) { console.error(err); }
      ovRunning.delete(audit);
    }
    lastRunAt = Date.now();
    statusEl.textContent = t("runAllDone");
  } finally {
    setRunBusy(false);
    renderOverview();
  }
}

// Open the first manual test without a verdict, scroll to it and start its wizard.
async function manualNext() {
  showView("manual");
  await loadManual();
  const card = [...manualListEl.querySelectorAll(".mtest")].find((c) => !c.dataset.verdict);
  if (!card) { statusEl.textContent = t("manualAllDone"); return; }
  if (!activeVerdicts.has("untested")) { activeVerdicts.add("untested"); manualFilters.querySelector("#mfUntested")?.classList.remove("off"); applyManualFilter(); }
  card.open = true;
  card.scrollIntoView({ block: "start", behavior: "smooth" });
  flash(card);
  const start = card.querySelector(".wizard-start");
  if (start) start.click();
}

function resetAll() {
  stopClickWatch();
  clearHighlights();
  lastReport = null;
  lastDlsExport = null;
  summaryEl.hidden = true;
  document.getElementById("historySection").hidden = true;
  staleEl.hidden = true;
  clearInterval(stalePoll);
  exportGroup.hidden = true;
  highlightAllBtn.hidden = true;
  clearBtn.hidden = true;
  autofixBtn.hidden = true;
  dlsReportEl.hidden = true;
  dlsReportEl.textContent = "";
  dlsEmpty.hidden = false;
  dlsScoreLine.textContent = "";
  dlsScoreLine.className = "score-line";
  dlsToolsVisible(false);
  diffEl.textContent = "";
  filterRow.hidden = true;
  filterInput.value = "";
  resultsEl.replaceChildren(emptyState({ icon: "i-search", titleKey: "emptyTitleAuto", textKey: "emptyResults", btnId: "emptyScanBtn", btnKey: "scan" }));
  srReset();
  setTabBadge("auto", null);
  setTabBadge("dls", null);
  ovRunning.clear();
  lastRunAt = 0;
  showView("overview");
  statusEl.textContent = t("resetDone");
}
clearBtn.addEventListener("click", clearHighlights);
highlightAllBtn.addEventListener("click", highlightAll);
flowBtn.addEventListener("click", () => (flowRecording ? stopFlow() : startFlow()));
for (const btn of document.querySelectorAll("button.export")) {
  btn.addEventListener("click", () => { exportGroup.open = false; exportReport(btn.dataset.format); });
}
helpBtn.addEventListener("click", () => showView("help"));
for (const b of document.querySelectorAll("#presetRow .btn.preset")) b.addEventListener("click", () => applyPreset(b.dataset.preset));
levelSelect.addEventListener("change", () => { updateSettingsLabel(); bg("settingsSet", { value: { level: levelSelect.value } }).catch(() => {}); });
bestPractice.addEventListener("change", () => { updateSettingsLabel(); bg("settingsSet", { value: { bestPractice: bestPractice.checked } }).catch(() => {}); });
srRulesChk.addEventListener("change", () => { updateSettingsLabel(); bg("settingsSet", { value: { srRules: srRulesChk.checked } }).catch(() => {}); });
dlsContrastChk.addEventListener("change", () => {
  settings.dlsContrast = dlsContrastChk.checked;
  bg("settingsSet", { value: { dlsContrast: dlsContrastChk.checked } }).catch(() => {});
  if (lastReport) render(lastReport); // refresh suggestions with the new palette mode
});
function openOptions() {
  try { EXT.runtime.openOptionsPage(); }
  catch (_) { window.open(EXT.runtime.getURL("options.html")); }
}
optionsBtn.addEventListener("click", openOptions);
document.getElementById("openOptionsLink").addEventListener("click", (e) => { e.preventDefault(); scanSettings.open = false; openOptions(); });
densityBtn.addEventListener("click", () => setCompact(!document.body.classList.contains("compact")));
// the one-line status mirrors its text into a tooltip (it is ellipsised)
new MutationObserver(() => { statusEl.title = statusEl.textContent.trim(); }).observe(statusEl, { childList: true, characterData: true, subtree: true });

// Header menus/popovers are native <details>: one open at a time, outside click / Escape close them.
function initMenus() {
  const all = () => [...document.querySelectorAll("details.menu, details.popover")];
  for (const d of all()) {
    d.addEventListener("toggle", () => {
      if (d.open) for (const o of all()) if (o !== d) o.open = false;
    });
  }
  document.addEventListener("pointerdown", (e) => {
    for (const d of all()) if (d.open && !d.contains(e.target)) d.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const d of all()) {
      if (!d.open) continue;
      d.open = false;
      d.querySelector("summary")?.focus();
    }
  });
}
initMenus();

// Panel-local keyboard shortcuts (documented in Help)
const HOTKEY_VIEWS = ["overview", "auto", "dls", "manual", "sr", "help"];
document.addEventListener("keydown", function onHotkey(e) {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runActive(); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === "s") runActive();
  else if (k === "r") flowRecording ? stopFlow() : startFlow();
  else if (k === "x") clearHighlights();
  else if (k === "c") contrastToggle.click();
  else if (k === "h") { if (!highlightAllBtn.hidden) highlightAll(); }
  else if (k === "e") { if (!exportGroup.hidden) { exportGroup.open = !exportGroup.open; if (exportGroup.open) exportBtn.focus(); } }
  else if (k === "/") {
    const view = document.body.dataset.view;
    const box = view === "dls" && !dlsFilterRow.hidden ? dlsFilterInput : view === "sr" ? srFilterInput : view === "manual" ? manualFilterInput : !filterRow.hidden ? filterInput : null;
    if (box) { e.preventDefault(); if (box === filterInput) showView("auto"); box.focus(); box.select(); }
  }
  else if (k === "i") { if (document.body.dataset.view === "sr") srIssuesOnly.click(); }
  else if (/^[1-6]$/.test(k)) showView(HOTKEY_VIEWS[Number(k) - 1]);
});

/* ---------------- tabs ---------------- */

tabsNav.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-view]");
  if (btn) showView(btn.dataset.view);
});

function showView(view) {
  for (const b of tabsNav.querySelectorAll("button[data-view]")) {
    b.classList.toggle("active", b.dataset.view === view);
  }
  document.body.dataset.view = view;
  overviewView.hidden = view !== "overview";
  autoView.hidden = view !== "auto";
  dlsView.hidden = view !== "dls";
  manualView.hidden = view !== "manual";
  srView.hidden = view !== "sr";
  helpView.hidden = view !== "help";
  updateRunButton();
  if (view === "overview") renderOverview();
  if (view === "manual") loadManual();
  if (view === "sr") loadSr().catch(() => {});
  if (view === "help") renderHelp();
}

/* ---------------- overview tab ---------------- */

let lastRunAt = 0;
const ovRunning = new Set(); // audits in flight: auto | dls | sr
const OV_AUDITS = ["auto", "dls", "sr", "manual"];
const OV_TAB = { auto: "tabAuto", dls: "tabDls", sr: "tabSr", manual: "tabManual" };
const OV_HINT = { auto: "ovAutoHint", dls: "ovDlsHint", sr: "ovSrHint", manual: "ovManualHint" };
const OV_RUN_BTN = { auto: "ovRunAuto", dls: "ovRunDls", sr: "ovRunSr", manual: "ovRunManual" };
const OV_W = { critical: 10, serious: 8, moderate: 5, minor: 2 };

const fmtClock = (ms) => new Date(ms).toLocaleTimeString(lang === "ar" ? "ar-AE" : "en-GB", { hour: "2-digit", minute: "2-digit" });
const dlsVerdictOf = (passed, total) => { const r = total ? passed / total : 0; return r >= 0.9 ? "pass" : r >= 0.7 ? "warn" : "fail"; };
const verdictText = (v) => t(v === "pass" ? "verdictPass" : v === "warn" ? "verdictWarn" : "verdictFail");
// glyph + translated verdict word for DLS rows ("✓ PASS" / "✓ ناجح")
const dlsVerdictMark = (v) => (v === "pass" ? "✓ " : v === "warn" ? "△ " : "✗ ") + verdictText(v);
function manualCounts() {
  const c = { pass: 0, fail: 0, na: 0 };
  for (const v of Object.values(manualState.verdicts)) if (c[v] !== undefined) c[v]++;
  return { ...c, done: Object.keys(manualState.verdicts).length, total: MANUAL_TESTS.length };
}
function anythingRan() {
  return !!(lastReport || lastDlsExport || srHasData() || (srState.restored && srState.restored.score) || Object.keys(manualState.verdicts).length);
}
function chip(cls, text) {
  const c = document.createElement("span");
  c.className = "chip" + (cls ? " " + cls : "");
  c.textContent = text;
  return c;
}
function ovNum(cls, text, small) {
  const n = document.createElement("div");
  n.className = "ov-num " + cls;
  n.textContent = text;
  if (small) {
    const s = document.createElement("small");
    s.textContent = small;
    n.appendChild(s);
  }
  return n;
}
function ovStatePill(el, cls, text, spin) {
  el.className = "ov-state" + (cls ? " " + cls : "");
  el.replaceChildren();
  if (spin) el.appendChild(Object.assign(document.createElement("span"), { className: "spin" }));
  el.append(text);
}

function renderOverview() {
  const ran = anythingRan();
  ovHero.dataset.state = ran ? "done" : "idle";
  document.getElementById("ovHeroTitle").textContent = t("ovHeroTitle");
  document.getElementById("ovHeroText").textContent = t("ovHeroText", modeSelect.value);
  setLabel(runAllBtn, "i-play", t("runAll"));
  runAllBtn.title = t("runTitle");
  runAllBtn.classList.toggle("primary", !ran);
  runAllBtn.disabled = runBusy > 0 || flowRecording;
  const url = (lastReport && !/^user flow/.test(lastReport.url || "") && lastReport.url) || srState.url || manualUrl || "";
  ovUrl.textContent = url;
  ovUrl.title = url;
  ovTime.textContent = lastRunAt ? t("ovLastRun", fmtClock(lastRunAt)) : "";
  // one Run-full-audit button: inside the hero when idle, at the end of the bar once anything ran
  const host = ran ? ovHero.querySelector(".ov-bar") : ovHero.querySelector(".empty-state");
  if (runAllBtn.parentElement !== host) host.appendChild(runAllBtn);
  for (const audit of OV_AUDITS) renderOvCard(audit);
  renderOvTop(ran);
}

function renderOvCard(audit) {
  const card = ovCards.querySelector(`.ov-card[data-audit="${audit}"]`);
  if (!card) return;
  card.querySelector(".ov-title").textContent = t(OV_TAB[audit]);
  const state = card.querySelector(".ov-state");
  const body = card.querySelector(".ov-body");
  const btn = document.getElementById(OV_RUN_BTN[audit]);
  card.querySelector(".ov-view").textContent = t("ovView");
  body.replaceChildren();
  let done = false;
  const counts = document.createElement("div");
  counts.className = "ov-counts";
  if (audit === "auto" && lastReport) {
    done = true;
    const c = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    let total = 0, worst = null;
    for (const v of lastReport.violations) { c[v.impact] = (c[v.impact] || 0) + v.nodeTotal; total += v.nodeTotal; if (!worst || LEVEL_RANK[v.impact] < LEVEL_RANK[worst]) worst = v.impact; }
    for (const k of ["critical", "serious", "moderate", "minor"]) if (c[k]) counts.appendChild(chip(k, `${c[k]} ${t(k)}`));
    if (!total) counts.appendChild(chip("ok", t("ovClean")));
    body.append(ovNum(worst || "ok", String(total)), counts);
    ovStatePill(state, worst || "ok", worst ? t(worst) : t("ovClean"));
  } else if (audit === "dls" && lastDlsExport) {
    done = true;
    const { passed, total } = lastDlsExport.score;
    const v = dlsVerdictOf(passed, total);
    const fails = lastDlsExport.rows.filter((r) => r.verdict === "fail").length;
    const warns = lastDlsExport.rows.filter((r) => r.verdict === "warn").length;
    if (fails) counts.appendChild(chip("fail", t("ovFails", fails)));
    if (warns) counts.appendChild(chip("warn", t("ovWarns", warns)));
    if (!fails && !warns) counts.appendChild(chip("ok", t("ovClean")));
    body.append(ovNum(v, `${passed}/${total}`), counts);
    ovStatePill(state, v, verdictText(v));
  } else if (audit === "sr" && srScoreCurrent()) {
    done = true;
    const sc = srScoreCurrent();
    for (const key of Object.keys(SR_SECTIONS)) {
      const n = sc.breakdown[key];
      if (n === undefined) continue;
      counts.appendChild(chip(n ? "fail" : "ok", `${t(SR_SECTIONS[key].label)} ${n}`));
    }
    body.append(ovNum(sc.verdict, String(sc.score), t("ovScoreOf")), counts);
    ovStatePill(state, sc.verdict, verdictText(sc.verdict));
  } else if (audit === "manual" && manualCounts().done) {
    done = true;
    const c = manualCounts();
    if (c.pass) counts.appendChild(chip("pass", `${c.pass} ${t("pass")}`));
    if (c.fail) counts.appendChild(chip("fail", `${c.fail} ${t("fail")}`));
    if (c.na) counts.appendChild(chip("na", `${c.na} ${t("na")}`));
    body.append(ovNum(c.fail ? "fail" : "ok", `${c.done}/${c.total}`), counts);
    ovStatePill(state, c.fail ? "critical" : "ok", c.fail ? t("ovFails", c.fail) : t("ovClean"));
  }
  if (!done) {
    const p = document.createElement("p");
    p.className = "ov-hint";
    p.textContent = t(OV_HINT[audit]);
    body.appendChild(p);
    ovStatePill(state, "", t("ovNotRun"));
  }
  const running = ovRunning.has(audit);
  if (running) ovStatePill(state, "accent", t("ovRunning"), true);
  card.dataset.state = running ? "running" : done ? "done" : "idle";
  setLabel(btn, "i-play", done ? t("ovRerun") : t("ovRun"));
  btn.disabled = running;
}

// Merge every audit's findings into one weighted list (≤ 6): the tabs hold the full lists.
function overviewTop() {
  const items = [];
  if (lastReport) for (const v of lastReport.violations) {
    items.push({ src: "auto", level: v.impact, weight: (OV_W[v.impact] || 2) * Math.min(v.nodeTotal, 3), title: v.help, detail: v.description, sel: v.nodes[0] && v.nodes[0].target[0] });
  }
  const sc = srScoreCurrent();
  if (sc) for (const e of sc.top) items.push({ src: "sr", level: e.level, weight: e.weight, title: e.title, detail: e.detail, sel: e.sels[0], section: e.section });
  if (lastDlsExport) for (const r of lastDlsExport.rows) if (r.verdict === "fail") items.push({ src: "dls", level: "serious", weight: 6, title: r.label, detail: r.detail, label: r.label });
  for (const test of MANUAL_TESTS.map(localizeTest)) if (manualState.verdicts[test.id] === "fail") {
    const f = (manualState.findings[test.id] || [])[0];
    items.push({ src: "manual", level: "serious", weight: 8, title: test.title, detail: f ? f.finding : test.wcag, testId: test.id });
  }
  return items.sort((a, b) => b.weight - a.weight || LEVEL_RANK[a.level] - LEVEL_RANK[b.level]).slice(0, 6);
}

function renderOvTop(ran) {
  document.getElementById("ovTopTitle").textContent = t("ovTopTitle");
  const list = document.getElementById("ovTopList");
  list.replaceChildren();
  const old = ovTop.querySelector(":scope > p.empty");
  if (old) old.remove();
  const items = ran ? overviewTop() : [];
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = t(ran ? "ovTopClean" : "ovTopEmpty");
    ovTop.appendChild(p);
    return;
  }
  items.forEach((it, i) => {
    const li = document.createElement("li");
    li.dataset.src = it.src;
    if (it.sel) li.dataset.sel = it.sel;
    if (it.section) li.dataset.section = it.section;
    if (it.label) li.dataset.label = it.label;
    if (it.testId) li.dataset.testId = it.testId;
    const rank = document.createElement("span");
    rank.className = "sr-rank";
    rank.textContent = String(i + 1);
    const w = document.createElement("span");
    w.className = "sr-weight " + it.level;
    w.textContent = t(it.level);
    w.title = t("ovWeightTitle", it.weight);
    const main = document.createElement("span");
    main.className = "top-main";
    const b = document.createElement("b");
    b.textContent = it.title;
    b.title = it.title;
    const src = document.createElement("span");
    src.className = "top-src";
    src.textContent = t(OV_TAB[it.src]);
    main.append(b, src);
    const d = document.createElement("div");
    d.className = "top-detail";
    d.textContent = it.detail || "";
    d.title = it.detail || "";
    li.append(rank, w, main, d);
    li.addEventListener("click", () => ovJump(it));
    list.appendChild(li);
  });
}

function ovJump(it) {
  if (it.src === "auto") { if (it.sel) jumpToFinding(it.sel); else showView("auto"); return; }
  showView(it.src);
  if (it.src === "sr") srJumpTo(it.section, it.sel);
  else if (it.src === "dls") {
    const row = [...dlsReportEl.querySelectorAll(".dls-row")].find((r) => r.dataset.label === it.label);
    if (row) flash(row);
  } else if (it.src === "manual") {
    loadManual().then(() => {
      const card = manualListEl.querySelector(`.mtest[data-test-id="${it.testId}"]`);
      if (card) { card.open = true; flash(card); }
    });
  }
}

/* ---------------- scanning ---------------- */

function currentRunOnly() {
  if (levelSelect.value === "all") return null;
  const tags = [...LEVEL_TAGS[levelSelect.value]];
  if (bestPractice.checked) tags.push("best-practice");
  return { type: "tag", values: tags };
}

function currentRuleSetLabel() {
  return levelSelect.value === "all"
    ? "all rules" + (srRulesChk.checked ? " + SR rules" : "")
    : levelSelect.selectedOptions[0].textContent + (bestPractice.checked ? " + best practices" : "") + (srRulesChk.checked ? " + SR rules" : "");
}

async function performAxeScan() {
  await bg("injectAxe");
  return bg("runAxe", { runOnly: currentRunOnly(), rules: srRulesOption() });
}

async function runScan() {
  if (scanInFlight || flowRecording) return;
  scanInFlight = true;
  setRunBusy(true);
  ovRunning.add("auto");
  renderOverview();
  statusBusy(t("scanningBig"));
  try {
    // Pre-count the DOM so heavy pages (e.g. large storefronts) get an honest estimate.
    try {
      const n = await bg("domCount");
      if (n > 4000) statusBusy(t("scanningHuge", n, Math.max(5, Math.round(n / 450))));
    } catch (_) {}
    const result = await performAxeScan();
    lastReport = {
      ...result,
      scannedAt: new Date().toISOString(),
      ruleSet: currentRuleSetLabel(),
    };
    await applyHistoryDiff(lastReport);
    lastRunAt = Date.now();
    ovRunning.delete("auto");
    render(lastReport);
    exportGroup.hidden = false;
    highlightAllBtn.hidden = false;
    clearBtn.hidden = false;
    updateAutofixButton();
    const frameNote = result.frames ? ` (incl. ${result.frames} iframe(s))` : "";
    statusEl.textContent = `Done — ${result.violations.length} rule(s) violated${frameNote}`;
    startStaleWatch();
  } catch (err) {
    statusEl.textContent = "Scan failed: " + (err?.message || err);
    console.error(err);
  } finally {
    scanInFlight = false;
    ovRunning.delete("auto");
    setRunBusy(false);
    renderOverview();
  }
}

/* ---------------- rendering ---------------- */

function render(report) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;

  document.getElementById("countCritical").textContent = `${counts.critical} ${t("critical")}`;
  document.getElementById("countSerious").textContent = `${counts.serious} ${t("serious")}`;
  document.getElementById("countModerate").textContent = `${counts.moderate} ${t("moderate")}`;
  document.getElementById("countMinor").textContent = `${counts.minor} ${t("minor")}`;
  document.getElementById("countPasses").textContent = `${report.passes} ${t("passed")}`;
  summaryEl.hidden = false;
  {
    let total = 0, worst = null;
    for (const v of report.violations) { total += v.nodeTotal; if (!worst || LEVEL_RANK[v.impact] < LEVEL_RANK[worst]) worst = v.impact; }
    setTabBadge("auto", String(total), worst || "ok");
  }
  renderOverview();

  resultsEl.textContent = "";
  if (!report.violations.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = t("noViolations");
    resultsEl.appendChild(p);
    return;
  }

  const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const sorted = [...report.violations].sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);

  let lastImpact = null;
  for (const v of sorted) {
    if (v.impact !== lastImpact) {
      lastImpact = v.impact;
      const head = document.createElement("div");
      head.className = "sev-head";
      head.dataset.impact = v.impact;
      head.textContent = t("sevHead", t(v.impact), sorted.filter((x) => x.impact === v.impact).length);
      resultsEl.appendChild(head);
    }
    const det = document.createElement("details");
    det.className = "violation";
    det.dataset.impact = v.impact;

    const sum = document.createElement("summary");
    sum.innerHTML = `<span class="impact-tag"></span><span class="rule-title"></span><span class="node-count"></span>`;
    sum.querySelector(".impact-tag").textContent = t(v.impact);
    sum.querySelector(".rule-title").textContent = v.help;
    const isBp = (v.tags || []).includes("best-practice");
    if (isBp) {
      const bp = document.createElement("span");
      bp.className = "pill bp";
      bp.textContent = t("bpPill");
      bp.title = t("bpPillTitle");
      sum.querySelector(".rule-title").after(bp);
    }
    sum.querySelector(".node-count").textContent = t("elements", v.nodeTotal);
    sum.appendChild(svgIcon("i-chevron"));
    det.appendChild(sum);

    const body = document.createElement("div");
    body.className = "violation-body";

    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = v.description + " ";
    const link = document.createElement("a");
    link.href = v.helpUrl;
    link.target = "_blank";
    link.textContent = t("learnMore");
    desc.appendChild(link);
    body.appendChild(desc);

    // Collapse identical repeated markup (e.g. 40 copies of the same product card)
    const groups = new Map();
    for (const node of v.nodes) {
      const key = node.html;
      if (!groups.has(key)) groups.set(key, { node, count: 0 });
      groups.get(key).count++;
    }
    for (const { node, count } of groups.values()) {
      const nodeEl = document.createElement("div");
      nodeEl.className = "node";
      nodeEl.dataset.sel = node.target[0];

      // code line: snippet + inline-end actions (×N / NEW badges, Inspect)
      const line = document.createElement("div");
      line.className = "node-line";
      const code = document.createElement("code");
      const inIframe = node.target.length > 1;
      code.title = inIframe ? t("iframeHint") : t("clickToHighlight");
      code.textContent = (node.pageLabel ? `[${node.pageLabel}] ` : "") +
        (inIframe ? "[iframe] " : "") + node.html;
      code.addEventListener("click", () => highlight(node.target));
      line.appendChild(code);

      const actions = document.createElement("div");
      actions.className = "actions";
      if (count > 1) {
        const dup = document.createElement("span");
        dup.className = "badge-dup";
        dup.textContent = t("identical", count);
        dup.title = t("identicalTitle");
        actions.appendChild(dup);
      }
      if (node.isNew) {
        const badge = document.createElement("span");
        badge.className = "badge-new";
        badge.textContent = t("newBadge");
        badge.title = t("newBadgeTitle");
        actions.appendChild(badge);
      }
      if (!inIframe) {
        const inspectBtn = document.createElement("button");
        inspectBtn.className = "icon-btn";
        setLabel(inspectBtn, "i-inspect", null);
        inspectBtn.title = t("inspect") + " — " + t("inspectTitle");
        inspectBtn.setAttribute("aria-label", t("inspect"));
        inspectBtn.addEventListener("click", () => inspectElement(node.target[0]));
        actions.appendChild(inspectBtn);
      }
      if (actions.childElementCount) line.appendChild(actions);
      nodeEl.appendChild(line);

      if (node.failureSummary) {
        const fix = document.createElement("div");
        fix.className = "fix";
        fix.textContent = node.failureSummary;
        nodeEl.appendChild(fix);
      }
      const fixSuggestion = A11yFixes.suggestFix(v.id, node, settings.framework || "html", fixOpts());
      if (fixSuggestion) {
        const more = document.createElement("details");
        more.className = "fix-more";
        const ms = document.createElement("summary");
        setLabel(ms, "i-wand", t("showFix"), { trailing: svgIcon("i-chevron") });
        more.appendChild(ms);
        more.appendChild(buildFixSuggestion(v, node, fixSuggestion));
        nodeEl.appendChild(more);
      }
      body.appendChild(nodeEl);
    }

    if (v.nodeTotal > v.nodes.length) {
      const more = document.createElement("p");
      more.className = "empty";
      more.textContent = t("moreElements", v.nodeTotal - v.nodes.length);
      body.appendChild(more);
    }

    det.appendChild(body);
    det.dataset.search = (v.id + " " + v.help + " " + v.impact + (isBp ? " best-practice " + t("bpPill") : "") + " " +
      v.nodes.map((n) => n.target.join(" ") + " " + n.html).join(" ")).toLowerCase();
    resultsEl.appendChild(det);
  }
  filterRow.hidden = false;
  filterInput.value = "";
  filterInput.placeholder = t("filterPlaceholder");
  applyFilter();
}

/* ---------------- fix suggestions ---------------- */

function buildFixSuggestion(v, node, fix) {
  const wrap = document.createElement("div");
  wrap.className = "fix-suggestion";

  const snippet = document.createElement("code");
  snippet.className = "fix-snippet";
  snippet.textContent = fix.snippet;
  wrap.appendChild(snippet);

  const note = document.createElement("div");
  note.className = "fix-note";
  note.textContent = fix.note;
  wrap.appendChild(note);

  const actions = document.createElement("div");
  actions.className = "actions";

  const copyBtn = document.createElement("button");
  copyBtn.className = "ghost";
  setLabel(copyBtn, "i-copy", t("copyFix"));
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(fix.snippet);
    setLabel(copyBtn, "i-check", t("copied"));
    setTimeout(() => setLabel(copyBtn, "i-copy", t("copyFix")), 1200);
  });
  actions.appendChild(copyBtn);

  const patch = A11yFixes.previewPatch(v.id, node, fixOpts());
  if (patch && node.target.length === 1) {
    const previewBtn = document.createElement("button");
    previewBtn.className = "ghost";
    setLabel(previewBtn, "i-play", t("previewFix"));
    previewBtn.addEventListener("click", async () => {
      try {
        if (previewBtn.classList.contains("on")) {
          await bg("undoFix", { selector: node.target[0] });
          previewBtn.classList.remove("on");
          setLabel(previewBtn, "i-play", t("previewFix"));
        } else {
          await bg("applyFix", { selector: node.target[0], patch });
          previewBtn.classList.add("on");
          setLabel(previewBtn, "i-undo", t("undo"));
        }
      } catch (err) {
        statusEl.textContent = t("previewFailed") + (err?.message || err);
      }
    });
    actions.appendChild(previewBtn);
  }

  const aiBtn = document.createElement("button");
  aiBtn.className = "ghost";
  setLabel(aiBtn, "i-sparkle", t("aiFix"));
  aiBtn.addEventListener("click", async () => {
    let out = wrap.querySelector(".ai-output");
    if (!out) {
      out = document.createElement("div");
      out.className = "ai-output";
      wrap.appendChild(out);
    }
    try {
      const key = await bg("storeGet", { key: "aiKey" });
      if (!key) {
        out.textContent = t("aiNoKey");
        return;
      }
      aiBtn.disabled = true;
      out.textContent = t("aiThinking");
      const prompt =
        "You are an accessibility expert. Fix this specific WCAG violation.\n" +
        "Rule: " + v.id + " — " + v.help + "\n" +
        "Failure: " + node.failureSummary + "\n" +
        "HTML: " + node.html + "\n" +
        "Framework: " + (settings.framework || "html") + "\n" +
        "Reply with ONLY the corrected code snippet followed by one short explanation line.";
      out.textContent = await bg("aiFix", { prompt });
    } catch (err) {
      out.textContent = t("aiFailed") + (err?.message || err);
    } finally {
      aiBtn.disabled = false;
    }
  });
  actions.appendChild(aiBtn);

  wrap.appendChild(actions);
  return wrap;
}

/* ---------------- history / diff ---------------- */

async function applyHistoryDiff(report) {
  const storageKey = "history:" + report.url;
  const nodeKey = (v, n) => v.id + "|" + n.target.join(" ");
  const currentKeys = [];
  for (const v of report.violations) for (const n of v.nodes) currentKeys.push(nodeKey(v, n));

  try {
    const prev = await bg("storeGet", { key: storageKey });
    if (prev && Array.isArray(prev.keys)) {
      const prevSet = new Set(prev.keys);
      const curSet = new Set(currentKeys);
      let added = 0;
      for (const v of report.violations) {
        for (const n of v.nodes) {
          n.isNew = !prevSet.has(nodeKey(v, n));
          if (n.isNew) added++;
        }
      }
      const fixed = prev.keys.filter((k) => !curSet.has(k)).length;
      const when = new Date(prev.scannedAt).toLocaleString();
      diffEl.textContent = "";
      if (added || fixed) {
        const worse = document.createElement("span");
        worse.className = "worse";
        worse.textContent = `${added} new`;
        const better = document.createElement("span");
        better.className = "better";
        better.textContent = `${fixed} fixed`;
        diffEl.append("vs last scan: ", worse, " · ", better, ` (${when})`);
      } else {
        diffEl.textContent = `no change since last scan (${when})`;
      }
    } else {
      diffEl.textContent = t("firstScan");
    }
    // Append this run to the per-URL trend series (kept to the last 30 scans).
    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;
    const prevStored = await bg("storeGet", { key: storageKey }).catch(() => null);
    const sr = srScoreCompute();
    const runs = [...((prevStored && prevStored.runs) || []),
      { at: report.scannedAt, ...counts, ...(sr ? { srScore: sr.score } : {}) }].slice(-30);
    await bg("storeSet", { key: storageKey, value: { keys: currentKeys, scannedAt: report.scannedAt, runs } });
    drawHistoryChart(runs);
  } catch (err) {
    console.error("history diff failed", err);
    diffEl.textContent = "";
  }
}

const IMPACT_COLORS = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#9e9e9e" };

function drawHistoryChart(runs) {
  const wrap = document.getElementById("historySection");
  if (!runs || runs.length < 2) { wrap.hidden = true; return; }
  wrap.hidden = false;
  const canvas = document.getElementById("historyChart");
  const W = (canvas.width = Math.max(320, (autoView.clientWidth || 620) - 40));
  const H = canvas.height;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  const max = Math.max(1, ...runs.map((r) => r.critical + r.serious + r.moderate + r.minor));
  const x = (i) => 6 + (i * (W - 12)) / (runs.length - 1);
  const y = (v) => H - 8 - (v / max) * (H - 16);
  for (const impact of ["minor", "moderate", "serious", "critical"]) {
    ctx.beginPath();
    ctx.strokeStyle = IMPACT_COLORS[impact];
    ctx.lineWidth = impact === "critical" ? 2 : 1.25;
    runs.forEach((r, i) => (i ? ctx.lineTo(x(i), y(r[impact])) : ctx.moveTo(x(0), y(r[impact]))));
    ctx.stroke();
    runs.forEach((r, i) => {
      ctx.beginPath();
      ctx.fillStyle = IMPACT_COLORS[impact];
      ctx.arc(x(i), y(r[impact]), 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  const legend = document.getElementById("historyLegend");
  legend.textContent = "";
  const first = runs[0], last = runs[runs.length - 1];
  const total = (r) => r.critical + r.serious + r.moderate + r.minor;
  const delta = total(last) - total(first);
  const span = document.createElement("span");
  span.textContent = `${runs.length} scans · ${total(first)} → ${total(last)} violations ` +
    (delta < 0 ? `(▼ ${-delta} fixed)` : delta > 0 ? `(▲ ${delta} more)` : "(no change)");
  span.style.color = delta < 0 ? "var(--passes)" : delta > 0 ? "var(--critical)" : "";
  legend.appendChild(span);
  // 🔊 screen reader score, when the SR tab had data at scan time
  const scored = runs.filter((r) => typeof r.srScore === "number");
  if (scored.length) {
    const cur = scored[scored.length - 1].srScore, prev = scored.length > 1 ? scored[scored.length - 2].srScore : null;
    const d = prev === null ? 0 : cur - prev;
    const srSpan = document.createElement("span");
    srSpan.textContent = ` · 🔊 ${t("srScoreTitle")} ${cur}/100` + (prev === null ? "" : d > 0 ? ` (▲ +${d})` : d < 0 ? ` (▼ ${d})` : " (=)");
    srSpan.style.color = d > 0 ? "var(--passes)" : d < 0 ? "var(--critical)" : "";
    legend.appendChild(srSpan);
  }
}

/* ---------------- highlight / inspect ---------------- */

function highlight(target) {
  bg("highlight", { selector: target[0] }).catch(() => {});
}

function highlightMany(sels, impact) {
  bg("highlightAll", { items: sels.map((sel) => ({ sel, impact: impact || "moderate" })) }).catch(() => {});
}

async function highlightAll() {
  if (!lastReport) return;
  const items = [];
  for (const v of lastReport.violations) {
    for (const n of v.nodes) items.push({ sel: n.target[0], impact: v.impact });
  }
  try {
    await bg("highlightAll", { items });
    // In a DLS-inclusive mode, layer the gold DLS gap outlines on top.
    if (modeSelect.value !== "a11y" && lastDlsExport) await bg("dlsHighlight");
    startClickWatch();
  } catch (_) {}
}

/* Reverse navigation: clicking a highlighted element on the page jumps the
   panel to the matching finding. */
let clickWatch = null;

function startClickWatch() {
  clearInterval(clickWatch);
  clickWatch = setInterval(async () => {
    try {
      const sel = await bg("clickedCheck");
      if (sel) jumpToFinding(sel);
    } catch (_) {
      clearInterval(clickWatch);
    }
  }, 400);
}

function stopClickWatch() {
  clearInterval(clickWatch);
}

function flash(el) {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("finding-flash");
  void el.offsetWidth; // restart the animation
  el.classList.add("finding-flash");
}

function jumpToFinding(sel) {
  if (sel.startsWith("dls:")) {
    // DLS gap → open the DLS tab and flash the matching affected-element entry
    showView("dls");
    const plain = sel.slice(4);
    for (const code of dlsReportEl.querySelectorAll(".dls-els code")) {
      if (code.textContent === plain) {
        const row = code.closest(".dls-row") || code;
        row.open = true;
        flash(row);
        return;
      }
    }
    flash(dlsReportEl);
    return;
  }
  showView("auto");
  for (const nodeEl of resultsEl.querySelectorAll(".node")) {
    if (nodeEl.dataset.sel === sel) {
      const card = nodeEl.closest("details.violation");
      if (card) { card.hidden = false; card.open = true; }
      flash(nodeEl);
      return;
    }
  }
}

function clearHighlights() {
  stopClickWatch();
  bg("clearHighlights").catch(() => {});
}

function inspectElement(selector) {
  devEval(`inspect(document.querySelector(${JSON.stringify(selector)}))`);
}

/* ---------------- auto-fix page ---------------- */

let autofixApplied = false;

function fixableItems() {
  if (!lastReport) return [];
  const items = [];
  for (const v of lastReport.violations) {
    for (const n of v.nodes) {
      if (n.target.length !== 1) continue;
      const patch = A11yFixes.previewPatch(v.id, n, fixOpts());
      if (patch) items.push({ selector: n.target[0], patch });
    }
  }
  return items;
}

function updateAutofixButton() {
  autofixApplied = false;
  autofixBtn.classList.remove("on");
  const n = fixableItems().length;
  autofixBtn.hidden = n === 0;
  setLabel(autofixBtn, "i-bolt", t("autofix", n));
}

autofixBtn.addEventListener("click", async () => {
  try {
    if (!autofixApplied) {
      const items = fixableItems();
      const applied = await bg("applyFixAll", { items });
      autofixApplied = true;
      autofixBtn.classList.add("on");
      setLabel(autofixBtn, "i-undo", t("undoAll", applied));
      statusEl.textContent = t("autofixApplied", applied);
    } else {
      const restored = await bg("undoAll");
      updateAutofixButton();
      statusEl.textContent = t("autofixRestored", restored);
    }
  } catch (err) {
    statusEl.textContent = t("autofixFailed") + (err?.message || err);
  }
});

/* ---------------- stale watch ---------------- */

let stalePoll = null;

async function startStaleWatch() {
  staleEl.hidden = true;
  clearInterval(stalePoll);
  try {
    await bg("staleInstall");
  } catch (_) {
    return;
  }
  stalePoll = setInterval(async () => {
    try {
      if (await bg("staleCheck")) {
        staleEl.hidden = false;
        clearInterval(stalePoll);
      }
    } catch (_) {
      clearInterval(stalePoll);
    }
  }, 2000);
}

EXT.devtools.network.onNavigated.addListener(() => {
  clearInterval(stalePoll);
  // A DLS report always belongs to one page — drop it on navigation so a stale
  // report can't be read or exported against the new page.
  dlsReportEl.hidden = true;
  dlsReportEl.textContent = "";
  dlsToolsVisible(false);
  lastDlsExport = null;
  srOnNavigated();
  if (flowRecording) {
    setTimeout(flowScanOnce, 1200);
    return;
  }
  if (lastReport) staleEl.hidden = false;
});

/* ---------------- user flow analysis ---------------- */

let flowRecording = false;
let flowTimer = null;
let flowSteps = 0;
const flowMap = new Map();
// Page markers for the 🎞 Journey transcript: { at (wall clock), label }. A marker with an empty
// label is a navigation the next scan has not labelled yet.
const flowJourney = { startAt: 0, stopAt: 0, pages: [] };

function startFlow() {
  flowRecording = true;
  flowSteps = 0;
  flowMap.clear();
  flowJourney.startAt = Date.now();
  flowJourney.stopAt = 0;
  flowJourney.pages = [{ at: flowJourney.startAt, label: "" }];
  srState.journey = null;
  renderJourney();
  setLabel(flowBtn, "i-stop", t("stopFlow"), { narrowHide: true });
  flowBtn.classList.add("recording");
  scanBtn.disabled = true;
  staleEl.hidden = true;
  statusEl.textContent = t("recording");
  // Screen-reader instrumentation rides along: focus moves and silent updates are
  // state sequences that the periodic axe scans cannot see.
  if (!srState.focus.running) startFocus(true);
  if (!srState.live.running) startLive(true);
  flowScanOnce();
  const intervalSec = Math.min(Math.max(settings.flowInterval || 4, 2), 30);
  flowTimer = setInterval(flowScanOnce, intervalSec * 1000);
}

async function flowScanOnce() {
  if (!flowRecording) return;
  try {
    const result = await performAxeScan();
    flowSteps++;
    let pageLabel;
    try {
      const u = new URL(result.url);
      const full = u.pathname + u.search + u.hash; // hash included: hash routers are SPA pages too
      pageLabel = full.length > 60 ? "…" + full.slice(-59) : full || "/"; // keep the tail — that is where routes differ
    } catch (_) {
      pageLabel = result.url.slice(0, 60);
    }
    const lastPage = flowJourney.pages[flowJourney.pages.length - 1];
    if (lastPage && !lastPage.label) { lastPage.label = pageLabel; lastPage.title = result.title || ""; }
    else if (!lastPage || lastPage.label !== pageLabel) flowJourney.pages.push({ at: Date.now(), label: pageLabel, title: result.title || "" });
    for (const v of result.violations) {
      for (const n of v.nodes) {
        const key = v.id + "|" + n.target.join(" ") + "|" + result.url;
        if (!flowMap.has(key)) flowMap.set(key, { rule: v, node: { ...n, pageLabel } });
      }
    }
    const srIssues = srState.focus.log.reduce((a, e) => a + (e.issues ? e.issues.length : 0), 0) +
      srState.live.log.filter((e) => e.kind === "silent" || e.kind === "risky" || srRouteIssue(e)).length;
    statusEl.textContent = `⏺ ${flowSteps} scan(s), ${flowMap.size} unique finding(s)` + (srIssues ? ` · 🔊 ${srIssues} screen reader issue(s)` : "");
  } catch (_) {
    // mid-navigation — retry next tick
  }
}

function stopFlow() {
  flowRecording = false;
  clearInterval(flowTimer);
  flowJourney.stopAt = Date.now();
  setLabel(flowBtn, "i-record", t("flow"), { narrowHide: true });
  flowBtn.classList.remove("recording");
  scanBtn.disabled = false;

  const byRule = new Map();
  for (const { rule, node } of flowMap.values()) {
    if (!byRule.has(rule.id)) {
      byRule.set(rule.id, { ...rule, nodes: [], nodeTotal: 0 });
    }
    const agg = byRule.get(rule.id);
    agg.nodeTotal++;
    if (agg.nodes.length < 50) agg.nodes.push(node);
  }
  const pages = new Set([...flowMap.values()].map(({ node }) => node.pageLabel));
  lastReport = {
    url: `user flow — ${pages.size} page/state(s), ${flowSteps} scan(s)`,
    frames: 0,
    passes: 0,
    violations: [...byRule.values()],
    scannedAt: new Date().toISOString(),
    ruleSet: currentRuleSetLabel() + " (flow recording)",
  };
  diffEl.textContent = "flow recording — history diff not applied";
  lastRunAt = Date.now();
  render(lastReport);
  exportGroup.hidden = false;
  highlightAllBtn.hidden = true;
  clearBtn.hidden = false;
  autofixBtn.hidden = true;
  const srIssues = srState.focus.log.reduce((a, e) => a + (e.issues ? e.issues.length : 0), 0) +
    srState.live.log.filter((e) => e.kind === "silent" || e.kind === "risky" || srRouteIssue(e)).length;
  const stops = [];
  if (srState.focus.startedByFlow) stops.push(stopFocus());
  if (srState.live.startedByFlow) stops.push(stopLive());
  statusEl.textContent = `Flow done — ${flowMap.size} unique finding(s) across ${pages.size} page/state(s)` +
    (srIssues ? ` · 🔊 ${srIssues} screen reader issue(s) — see the Screen reader tab` : "");
  // The transcript needs the final drain of both logs, so build it once the stops settle.
  Promise.allSettled(stops).then(() => {
    const titleFinding = flowTitleFinding(flowJourney.pages, flowJourney.stopAt);
    if (titleFinding) { srState.live.log.push(titleFinding); renderLiveLog(); }
    srState.journey = srJourneyBuild();
    renderJourney();
  });
}

// Title parity across the recorded flow: several distinct pages/states that all carry one
// document.title is one finding ("title never changes") — the per-route checks in the live
// monitor catch each stale transition, this catches the site-wide pattern.
function flowTitleFinding(pages, at) {
  const labelled = pages.filter((p) => p.label && p.title !== undefined);
  const labels = new Set(labelled.map((p) => p.label));
  if (labels.size < 2) return null;
  const titles = new Set(labelled.map((p) => (p.title || "").trim()));
  if (titles.size !== 1) return null;
  const title = [...titles][0];
  return { kind: "route", code: "route-title-stale", flow: true, t: Math.max(0, at - (flowJourney.startAt || at)), at, url: "", urlBefore: "",
    text: t("srRouteTitleNever", labels.size, title), titleBefore: title, titleAfter: title, note: t("srRouteTitleNeverNote"), sel: "", html: "", tag: "", pages: [...labels] };
}

/* ---------------- contrast checker ---------------- */

const fgSwatch = document.getElementById("fgSwatch");
const bgSwatch = document.getElementById("bgSwatch");
const fgHexEl = document.getElementById("fgHex");
const bgHexEl = document.getElementById("bgHex");
const ratioEl = document.getElementById("ratio");
const verdictsEl = document.getElementById("contrastVerdicts");

let fgColor = "#000000";
let bgColor = "#ffffff";

contrastToggle.addEventListener("click", () => {
  contrastBar.hidden = !contrastBar.hidden;
  if (!contrastBar.hidden) {
    document.getElementById("contrastUnsupported").hidden = "EyeDropper" in window;
    updateContrast();
  }
});
document.getElementById("pickFg").addEventListener("click", () => pickColor("fg"));
document.getElementById("pickBg").addEventListener("click", () => pickColor("bg"));

async function pickColor(which) {
  if (!("EyeDropper" in window)) return;
  try {
    const { sRGBHex } = await new EyeDropper().open();
    if (which === "fg") fgColor = sRGBHex;
    else bgColor = sRGBHex;
    updateContrast();
  } catch (_) { /* user pressed Esc */ }
}

function updateContrast() {
  fgSwatch.style.background = fgColor;
  bgSwatch.style.background = bgColor;
  fgHexEl.textContent = fgColor;
  bgHexEl.textContent = bgColor;
  const ratio = contrastRatio(fgColor, bgColor);
  ratioEl.textContent = ratio.toFixed(2) + " : 1";
  const checks = [["AA normal", 4.5], ["AA large", 3], ["AAA normal", 7], ["AAA large", 4.5]];
  verdictsEl.textContent = "";
  for (const [label, min] of checks) {
    const s = document.createElement("span");
    const ok = ratio >= min;
    s.className = "verdict " + (ok ? "pass" : "fail");
    s.textContent = `${label} ${ok ? "✓" : "✗"}`;
    s.title = `Requires ≥ ${min}:1`;
    verdictsEl.appendChild(s);
    verdictsEl.appendChild(document.createTextNode(" "));
  }
}

function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      let c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [l1, l2] = [lum(hexA), lum(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ---------------- guided manual tests (IGT wizards) ---------------- */

const MANUAL_TESTS = [
  {
    id: "keyboard", title: "Keyboard-only navigation", wcag: "WCAG 2.1.1 / 2.1.2",
    why: "Many users never touch a mouse. Everything must be reachable and operable with the keyboard alone, with no traps.",
    helper: { label: "Number the tab stops", fn: "tabStops" },
    questions: [
      { q: "Could you reach every interactive element using only Tab (and arrow keys inside widgets)?", finding: "Some controls are unreachable by keyboard" },
      { q: "Could you activate every control with Enter or Space?", finding: "Control(s) cannot be activated by keyboard" },
      { q: "Could you always Tab OUT of every widget — no keyboard traps (modals, players, embeds)?", finding: "Keyboard trap detected" },
      { q: "Is every mouse/hover-only interaction also achievable with the keyboard?", finding: "Mouse-only interaction with no keyboard equivalent" },
    ],
  },
  {
    id: "focus-visible", title: "Visible focus indicator", wcag: "WCAG 2.4.7",
    why: "Sighted keyboard users must always be able to see which element has focus.",
    helper: { label: "Number the tab stops", fn: "tabStops" },
    questions: [
      { q: "Did every tab stop show a clearly visible focus indicator (outline, ring, underline…)?", finding: "Element(s) receive focus with no visible indicator" },
      { q: "Was the indicator clearly visible against the background in every section of the page?", finding: "Focus indicator has insufficient contrast in some areas" },
    ],
  },
  {
    id: "focus-order", title: "Logical focus & reading order", wcag: "WCAG 2.4.3 / 1.3.2",
    why: "Focus should follow the visual/reading flow, or keyboard and screen-reader users get disoriented.",
    helper: { label: "Number the tab stops", fn: "tabStops" },
    questions: [
      { q: "Do the numbered tab stops follow the visual reading order of the page?", finding: "Focus order does not match visual order" },
      { q: "Are there no surprising jumps (into footers, off-screen regions, or CSS-reordered content)?", finding: "Unexpected focus jump" },
    ],
  },
  {
    id: "headings", title: "Heading structure", wcag: "WCAG 1.3.1 / 2.4.6",
    why: "Screen-reader users navigate by headings. The outline must describe the page like a table of contents.",
    helper: { label: "Show heading outline", fn: "headings" },
    questions: [
      { q: "Is there exactly one h1, and does it describe the page's purpose?", finding: "Missing, multiple, or unclear h1" },
      { q: "Do heading levels nest without skipping (h2 → h3, never h2 → h4)?", finding: "Heading levels skip" },
      { q: "Does every heading accurately describe its section (no vague or fake bold-text headings)?", finding: "Unclear or fake heading(s)" },
    ],
  },
  {
    id: "landmarks", title: "Landmarks & skip link", wcag: "WCAG 2.4.1 / 1.3.1",
    why: "Landmarks and a skip link let assistive-tech users jump past repeated content.",
    helper: { label: "Outline landmarks", fn: "landmarks" },
    questions: [
      { q: "Is the primary content inside exactly one main landmark?", finding: "Content not inside a single main landmark" },
      { q: "Is the first Tab stop a working 'skip to content' link?", finding: "No working skip link" },
      { q: "Do repeated landmarks (e.g. two navs) have distinguishing labels?", finding: "Duplicate landmarks lack labels" },
    ],
  },
  {
    id: "alt-quality", title: "Image alt text quality", wcag: "WCAG 1.1.1",
    why: "Automation detects a MISSING alt attribute, but not whether the text is actually meaningful.",
    helper: { label: "Overlay alt text", fn: "altOverlay" },
    questions: [
      { q: "Does every informative image's alt text convey the same information as the image?", finding: "Alt text does not convey the image's information" },
      { q: "Are purely decorative images marked with empty alt (shown as 'decorative')?", finding: "Decorative image announced to screen readers" },
      { q: "Do functional images (in links/buttons) describe the action rather than the picture?", finding: "Functional image alt describes appearance, not action" },
    ],
  },
  {
    id: "zoom", title: "200% zoom & reflow", wcag: "WCAG 1.4.4 / 1.4.10",
    why: "Low-vision users zoom. Content must remain usable without horizontal scrolling or overlap.",
    questions: [
      { q: "At 200% zoom (⌘+ / Ctrl+), is all text and functionality still available — nothing clipped or overlapped?", finding: "Content breaks at 200% zoom" },
      { q: "At ~400% in a normal window (equivalent to 320px width), does content reflow into one column with no horizontal scrolling?", finding: "No reflow at 320px equivalent width" },
    ],
  },
  {
    id: "screen-reader", title: "Screen reader pass", wcag: "WCAG 4.1.2 / 1.3.1",
    why: "The ultimate test: does the page make sense when heard instead of seen? (macOS: ⌘F5 for VoiceOver. Windows: NVDA/Narrator.)",
    questions: [
      { q: "Reading from the top, did everything announced make sense in order?", finding: "Announced content is confusing or out of order" },
      { q: "Did all controls announce a correct role, name, and state ('button', 'checkbox, checked')?", finding: "Control(s) announce wrong or missing role/name/state" },
      { q: "Were dynamic updates (toasts, validation errors, live content) announced?", finding: "Dynamic update is silent to screen readers" },
    ],
  },
  {
    id: "motion", title: "Motion, animation & flashing", wcag: "WCAG 2.2.2 / 2.3.1",
    why: "Auto-playing motion distracts; flashing above 3 Hz can trigger seizures.",
    questions: [
      { q: "Does all auto-playing motion longer than 5 seconds have a pause/stop control?", finding: "Auto-playing motion without pause control" },
      { q: "Is there no content flashing more than 3 times per second?", finding: "Content flashes above 3 Hz" },
      { q: "Is the OS 'reduce motion' preference respected (prefers-reduced-motion)?", finding: "Reduce-motion preference ignored" },
    ],
  },
  {
    id: "forms", title: "Form labels & error handling", wcag: "WCAG 3.3.1 / 3.3.2 / 3.3.3",
    why: "Automation checks that labels exist; only a human can judge whether errors are understandable and recoverable.",
    questions: [
      { q: "When you submit invalid data, are errors described in text (not color alone), saying what is wrong and how to fix it?", finding: "Errors unclear or conveyed by color alone" },
      { q: "Does focus move to (or an announcement happen for) the first invalid field?", finding: "Errors not brought to the user's attention" },
      { q: "Are required fields indicated before submission, not only after failing?", finding: "Required fields not indicated upfront" },
    ],
  },
];

let manualState = { verdicts: {}, findings: {} }; // findings: testId -> [{q, selector, note}]
let manualUrl = null;

async function getPageUrl() {
  return devEval("location.href").then((res) => res || "unknown");
}

async function loadManual() {
  manualUrl = await getPageUrl();
  try {
    const stored = await bg("storeGet", { key: "manual:" + manualUrl });
    manualState = { verdicts: stored?.verdicts || {}, findings: stored?.findings || {} };
  } catch (_) {
    manualState = { verdicts: {}, findings: {} };
  }
  renderManual();
}

async function saveManual() {
  if (!manualUrl) return;
  await bg("storeSet", {
    key: "manual:" + manualUrl,
    value: { ...manualState, updatedAt: new Date().toISOString() },
  }).catch(() => {});
}

// text version kept for exports; the card summary uses the SVG version
function verdictIcon(v) {
  return v === "pass" ? "✅" : v === "fail" ? "❌" : v === "na" ? "➖" : "◻";
}
function verdictIconSvg(v) {
  return svgIcon(v === "pass" ? "i-check" : v === "fail" ? "i-x" : v === "na" ? "i-minus" : "i-square");
}
function setVerdictIcon(el, v) {
  el.className = "verdict-icon" + (v ? " " + v : "");
  el.replaceChildren(verdictIconSvg(v));
}

function renderManual() {
  manualListEl.textContent = "";
  for (const test of MANUAL_TESTS.map(localizeTest)) {
    manualListEl.appendChild(buildManualCard(test));
  }
  applyManualFilter();
  updateManualProgress();
}

function buildManualCard(test) {
  const det = document.createElement("details");
  det.className = "mtest";
  det.dataset.testId = test.id;
  const v = manualState.verdicts[test.id];
  if (v) det.dataset.verdict = v;
  det.dataset.search = [test.title, test.wcag, test.why, ...(test.questions || []).flatMap((x) => [x.q, x.finding])].filter(Boolean).join(" ").toLowerCase();

  const sum = document.createElement("summary");
  const icon = document.createElement("span");
  setVerdictIcon(icon, v);
  const title = document.createElement("span");
  title.className = "rule-title";
  title.textContent = test.title;
  const wcag = document.createElement("span");
  wcag.className = "wcag";
  wcag.textContent = test.wcag;
  sum.append(icon, title, wcag);
  det.appendChild(sum);

  const body = document.createElement("div");
  body.className = "mtest-body";
  renderCardIntro(test, det, body);
  det.appendChild(body);
  return det;
}

// Default (non-wizard) card content: why + helper + start button + recorded findings.
function renderCardIntro(test, card, body) {
  body.textContent = "";

  const why = document.createElement("p");
  why.className = "why";
  why.textContent = test.why;
  body.appendChild(why);

  const actions = document.createElement("div");
  actions.className = "mtest-actions";

  if (test.helper) {
    const helperBtn = document.createElement("button");
    setLabel(helperBtn, "i-play", test.helper.label);
    helperBtn.addEventListener("click", () => runManualHelper(test, card));
    actions.appendChild(helperBtn);
  }

  const startBtn = document.createElement("button");
  startBtn.className = "wizard-start";
  setLabel(startBtn, "i-wand", t("startWizard"));
  startBtn.addEventListener("click", () => startWizard(test, card, body));
  actions.appendChild(startBtn);

  body.appendChild(actions);

  const findings = manualState.findings[test.id] || [];
  if (findings.length) {
    const list = document.createElement("div");
    list.className = "wizard-findings";
    for (const f of findings) {
      const item = document.createElement("div");
      item.className = "wizard-finding";
      item.textContent = "❌ " + f.finding + (f.note ? ` — ${f.note}` : "");
      if (f.selector) {
        const codeEl = document.createElement("code");
        codeEl.textContent = f.selector;
        codeEl.title = t("clickToHighlight");
        codeEl.addEventListener("click", () => highlight([f.selector]));
        item.appendChild(document.createElement("br"));
        item.appendChild(codeEl);
      }
      list.appendChild(item);
    }
    body.appendChild(list);
  }
}

async function runManualHelper(test, card) {
  try {
    const result = await bg("helper", { name: test.helper.fn });
    let out = card.querySelector(".mtest-output");
    if (!out) {
      out = document.createElement("div");
      out.className = "mtest-output";
      card.querySelector(".mtest-body").appendChild(out);
    }
    out.textContent = result;
  } catch (err) {
    statusEl.textContent = t("helperFailed") + (err?.message || err);
  }
}

/* ---- wizard engine: one question at a time, verdict computed from answers ---- */

function startWizard(test, card, body) {
  card.open = true;
  const state = { idx: 0, answers: [], findings: [] };
  // Auto-run the helper so the evidence is on screen while answering.
  if (test.helper) runManualHelper(test, card);
  renderWizardStep(test, card, body, state);
}

function renderWizardStep(test, card, body, state) {
  body.textContent = "";

  if (state.idx >= test.questions.length) {
    finishWizard(test, card, body, state);
    return;
  }

  const q = test.questions[state.idx];

  const progress = document.createElement("div");
  progress.className = "wizard-progress";
  progress.textContent = `${t("question")} ${state.idx + 1} / ${test.questions.length}`;
  body.appendChild(progress);

  const question = document.createElement("p");
  question.className = "wizard-question";
  question.textContent = q.q;
  body.appendChild(question);

  const actions = document.createElement("div");
  actions.className = "mtest-actions";

  const yesBtn = document.createElement("button");
  yesBtn.className = "wiz-yes";
  setLabel(yesBtn, "i-check", t("yes"));
  yesBtn.addEventListener("click", () => {
    state.answers.push("yes");
    state.idx++;
    renderWizardStep(test, card, body, state);
  });

  const noBtn = document.createElement("button");
  noBtn.className = "wiz-no";
  setLabel(noBtn, "i-x", t("no"));
  noBtn.addEventListener("click", () => renderFindingForm(test, card, body, state, q));

  const skipBtn = document.createElement("button");
  skipBtn.textContent = t("skip");
  skipBtn.addEventListener("click", () => {
    state.answers.push("skip");
    state.idx++;
    renderWizardStep(test, card, body, state);
  });

  actions.append(yesBtn, noBtn, skipBtn);
  body.appendChild(actions);
}

// After a "No": capture an optional note and an optional element from the page.
function renderFindingForm(test, card, body, state, q) {
  body.textContent = "";

  const heading = document.createElement("p");
  heading.className = "wizard-question";
  heading.textContent = "❌ " + q.finding;
  body.appendChild(heading);

  const note = document.createElement("input");
  note.type = "text";
  note.className = "wizard-note";
  note.placeholder = t("noteHint");
  body.appendChild(note);

  const pickedEl = document.createElement("div");
  pickedEl.className = "wizard-picked";
  body.appendChild(pickedEl);

  let pickedSelector = null;
  let pickPoll = null;

  const actions = document.createElement("div");
  actions.className = "mtest-actions";

  const pickBtn = document.createElement("button");
  setLabel(pickBtn, "i-pin", t("pickElement"));
  pickBtn.addEventListener("click", async () => {
    try {
      await bg("pickStart");
      pickedEl.textContent = t("picking");
      clearInterval(pickPoll);
      let tries = 0;
      pickPoll = setInterval(async () => {
        tries++;
        try {
          const sel = await bg("pickCheck");
          if (sel) {
            clearInterval(pickPoll);
            pickedSelector = sel;
            pickedEl.textContent = "";
            const codeEl = document.createElement("code");
            codeEl.textContent = sel;
            pickedEl.append(svgIcon("i-pin"), codeEl);
          } else if (tries > 60) {
            clearInterval(pickPoll);
            pickedEl.textContent = "";
          }
        } catch (_) {
          clearInterval(pickPoll);
        }
      }, 500);
    } catch (err) {
      pickedEl.textContent = t("srPickFailed") + (err?.message || err);
    }
  });

  const contBtn = document.createElement("button");
  contBtn.className = "wiz-no";
  contBtn.textContent = t("continueBtn");
  contBtn.addEventListener("click", () => {
    clearInterval(pickPoll);
    state.answers.push("no");
    state.findings.push({
      q: q.q,
      finding: q.finding,
      note: note.value.trim(),
      selector: pickedSelector,
    });
    state.idx++;
    renderWizardStep(test, card, body, state);
  });

  actions.append(pickBtn, contBtn);
  body.appendChild(actions);
  note.focus();
}

async function finishWizard(test, card, body, state) {
  const fails = state.answers.filter((a) => a === "no").length;
  const yeses = state.answers.filter((a) => a === "yes").length;
  const verdict = fails ? "fail" : yeses === test.questions.length ? "pass" : "na";

  manualState.verdicts[test.id] = verdict;
  manualState.findings[test.id] = state.findings;
  await saveManual();

  card.dataset.verdict = verdict;
  setVerdictIcon(card.querySelector(".verdict-icon"), verdict);
  lastRunAt = Date.now();
  updateManualProgress();

  body.textContent = "";
  const summary = document.createElement("p");
  summary.className = "wizard-question";
  summary.textContent =
    verdict === "pass" ? `✅ ${t("pass")} — ${t("wizardPass", yeses)}` :
    verdict === "fail" ? `❌ ${t("fail")} — ${t("wizardFail", fails)}` :
    `➖ ${t("na")} — ${t("wizardNa")}`;
  body.appendChild(summary);

  const doneBtn = document.createElement("button");
  doneBtn.textContent = t("done");
  doneBtn.addEventListener("click", () => renderCardIntro(test, card, body));
  body.appendChild(doneBtn);

  // Show recorded findings immediately below the summary.
  if (state.findings.length) {
    const list = document.createElement("div");
    list.className = "wizard-findings";
    for (const f of state.findings) {
      const item = document.createElement("div");
      item.className = "wizard-finding";
      item.textContent = "❌ " + f.finding + (f.note ? ` — ${f.note}` : "");
      if (f.selector) {
        const codeEl = document.createElement("code");
        codeEl.textContent = f.selector;
        codeEl.addEventListener("click", () => highlight([f.selector]));
        item.appendChild(document.createElement("br"));
        item.appendChild(codeEl);
      }
      list.appendChild(item);
    }
    body.appendChild(list);
  }
}

function updateManualBar() {
  const c = manualCounts();
  const prog = manualBar.querySelector("progress");
  prog.max = c.total;
  prog.value = c.done;
  manualBar.querySelector(".lbl").textContent = t("manualDone", c.done, c.total);
}
function updateManualProgress() {
  const c = manualCounts();
  setTabBadge("manual", c.done ? `${c.done}/${c.total}` : null, c.fail ? "critical" : "neutral");
  updateManualBar();
  updateExportVisibility();
  renderOverview();
}

function manualResultsForExport() {
  if (!Object.keys(manualState.verdicts).length) return null;
  return MANUAL_TESTS.map((test) => ({
    id: test.id,
    title: test.title,
    wcag: test.wcag,
    verdict: manualState.verdicts[test.id] || "not tested",
    findings: manualState.findings[test.id] || [],
  }));
}

/* ---------------- export ---------------- */

// Exports are available as soon as ANY section has data (automated scan, DLS,
// screen reader, manual tests) — the automated scan is not a prerequisite.
function hasExportableData() {
  return !!(lastReport || lastDlsExport || srHasData() || Object.keys(manualState.verdicts).length);
}

function updateExportVisibility() {
  exportGroup.hidden = !hasExportableData();
}

// The scan report, or a placeholder when only other sections were run.
async function reportForExport() {
  if (lastReport) return lastReport;
  return {
    url: await getPageUrl(),
    frames: 0,
    passes: 0,
    violations: [],
    scannedAt: new Date().toISOString(),
    ruleSet: t("noScanRuleSet"),
    noScan: true,
  };
}

async function exportReport(format) {
  if (!hasExportableData()) return;
  const report = await reportForExport();
  const base = "a11y-miyar-" + safeName(report.url) + "-" +
    report.scannedAt.slice(0, 19).replace(/[:T]/g, "-");
  if (format === "json") {
    const payload = { ...withSuggestions(report), manualTests: manualResultsForExport(), dls: lastDlsExport, screenReader: srExportWithoutShots(srResultsForExport()) };
    download(base + ".json", "application/json", JSON.stringify(payload, null, 2));
  } else if (format === "csv") {
    download(base + ".csv", "text/csv", toCsv(report));
  } else if (format === "html" || format === "pdf") {
    const shot = await captureScanShot();
    const dlsShot = await captureDlsShot();
    await bg("clearHighlights").catch(() => {});
    let html = toHtml(report, shot, dlsShot);
    if (format === "pdf") {
      // Print-ready report in a new tab; the user saves as PDF from the print dialog.
      html = html.replace(
        "</body>",
        "<script>addEventListener('load',()=>setTimeout(()=>print(),400))<\/script></body>"
      );
      window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })));
      statusEl.textContent = "Report opened in a new tab — choose 'Save as PDF' in the print dialog.";
    } else {
      download(base + ".html", "text/html", html);
    }
  } else if (format === "issues") {
    download(base + "-issues.md", "text/markdown", A11yFixes.issuesMarkdown(report, manualResultsForExport(), fixOpts(), srResultsForExport()));
  } else if (format === "jira") {
    download(base + "-jira.csv", "text/csv", toJiraCsv(report));
  } else if (format === "azure") {
    download(base + "-azure.csv", "text/csv", toAzureCsv(report));
  }
}

// Azure DevOps work-item CSV: Boards → Queries → Import Work Items.
// Bug + Title + Repro Steps + Priority + Tags imports on every process template.
function toAzureCsv(report) {
  const prio = { critical: 1, serious: 2, moderate: 3, minor: 4 };
  const fw = settings.framework || "html";
  const esc = (s) => escHtml(s);
  const rows = [["Work Item Type", "Title", "Repro Steps", "Priority", "Tags"]];
  for (const v of report.violations) {
    const els = v.nodes.slice(0, 10).map((n) =>
      `<li><code>${esc(n.target.join(" "))}</code><br><pre>${esc(n.html)}</pre></li>`).join("");
    const fix = A11yFixes.suggestFix(v.id, v.nodes[0], fw, fixOpts());
    const repro =
      `<p>${esc(v.description)}</p>` +
      `<p>WCAG reference: <a href="${esc(v.helpUrl)}">${esc(v.helpUrl)}</a></p>` +
      `<p>Affected elements (${v.nodeTotal} total, first ${Math.min(10, v.nodes.length)} shown):</p><ul>${els}</ul>` +
      (fix ? `<p><b>Suggested fix:</b></p><pre>${esc(fix.snippet)}</pre><p>${esc(fix.note)}</p>` : "");
    rows.push([
      "Bug",
      "[A11y] " + v.help + " — " + v.nodeTotal + " element(s)",
      repro,
      String(prio[v.impact] || 3),
      "accessibility; a11y-lens; " + v.id,
    ]);
  }
  if (lastDlsExport) {
    for (const r of lastDlsExport.rows) {
      if (r.verdict === "pass") continue;
      const els = (r.elements || []).map((e) =>
        `<li><code>${esc(e.sel)}</code> — ${esc(e.info)}</li>`).join("");
      rows.push([
        "Bug",
        "[UAE DLS] " + r.label.replace(" ↗", "") + " — " + r.verdict.toUpperCase(),
        `<p>${esc(r.detail)}</p>` + (els ? `<ul>${els}</ul>` : "") +
          (r.fix ? `<p><b>Suggested fix:</b></p><pre>${esc(r.fix)}</pre>` : "") +
          (r.doc ? `<p>Standard: <a href="${esc(r.doc)}">${esc(r.doc)}</a></p>` : ""),
        r.verdict === "fail" ? "2" : "3",
        "accessibility; a11y-lens; uae-dls",
      ]);
    }
  }
  for (const f of A11yFixes.srFindings(srResultsForExport())) {
    const els = (f.selectors.length ? f.selectors : [f.sel]).filter(Boolean).slice(0, 10).map((s) => `<li><code>${esc(s)}</code></li>`).join("");
    rows.push([
      "Bug",
      f.title,
      `<p>${esc(f.msg)}</p><p>Source: Screen reader tab — ${esc(f.sectionLabel)}</p>` +
        (els ? `<p>Affected element(s)${f.instances > 1 ? ` (${f.instances} identical)` : ""}:</p><ul>${els}</ul>` : "") +
        (f.html ? `<pre>${esc(f.html)}</pre>` : "") +
        (f.fix ? `<p><b>Suggested fix${f.fix.framework && f.fix.framework !== "html" ? " (" + esc(SR_FW_LABEL[f.fix.framework] || f.fix.framework) + ")" : ""}:</b></p><pre>${esc(f.fix.snippet)}</pre><p>${esc(f.fix.note)}</p>` : "") +
        `<p><b>How to verify:</b> ${esc(f.verify)}</p>`,
      String(prio[f.level] || 3),
      "accessibility; a11y-lens; screen-reader; sr-" + f.code,
    ]);
  }
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

// Jira bulk-import CSV: one issue per violated rule (plus DLS gaps when present).
// Import via Jira → System → External System Import → CSV.
function toJiraCsv(report) {
  const prio = { critical: "Highest", serious: "High", moderate: "Medium", minor: "Low" };
  const fw = settings.framework || "html";
  const rows = [["Summary", "Issue Type", "Priority", "Labels", "Description"]];
  for (const v of report.violations) {
    const els = v.nodes.slice(0, 10).map((n) =>
      "* {{" + n.target.join(" ") + "}}\n{code:html}" + jiraCode(n.html) + "{code}").join("\n");
    const fix = A11yFixes.suggestFix(v.id, v.nodes[0], fw, fixOpts());
    const desc =
      v.description + "\n\nWCAG reference: " + v.helpUrl +
      "\n\nAffected elements (" + v.nodeTotal + " total, first " + Math.min(10, v.nodes.length) + " shown):\n" + els +
      (fix ? "\n\nSuggested fix:\n{code}" + fix.snippet + "{code}\n" + fix.note : "");
    rows.push([
      "[A11y] " + v.help + " — " + v.nodeTotal + " element(s)",
      "Bug",
      prio[v.impact] || "Medium",
      "accessibility a11y-lens " + v.id,
      desc,
    ]);
  }
  if (lastDlsExport) {
    for (const r of lastDlsExport.rows) {
      if (r.verdict === "pass") continue;
      const els = (r.elements || []).map((e) => "* {{" + e.sel + "}} — " + e.info).join("\n");
      rows.push([
        "[UAE DLS] " + r.label.replace(" ↗", "") + " — " + r.verdict.toUpperCase(),
        "Bug",
        r.verdict === "fail" ? "High" : "Medium",
        "accessibility a11y-lens uae-dls",
        r.detail + (els ? "\n\nAffected elements:\n" + els : "") +
          (r.fix ? "\n\nSuggested fix:\n{code}" + r.fix + "{code}" : "") +
          (r.doc ? "\n\nStandard: " + r.doc : ""),
      ]);
    }
  }
  for (const f of A11yFixes.srFindings(srResultsForExport())) {
    const els = (f.selectors.length ? f.selectors : [f.sel]).filter(Boolean).slice(0, 10).map((s) => "* {{" + s + "}}").join("\n");
    rows.push([
      f.title,
      "Bug",
      prio[f.level] || "Medium",
      "accessibility a11y-lens screen-reader sr-" + f.code,
      f.msg + "\n\nSource: Screen reader tab — " + f.sectionLabel +
        (els ? "\n\nAffected element(s)" + (f.instances > 1 ? " (" + f.instances + " identical)" : "") + ":\n" + els : "") +
        (f.html ? "\n{code:html}" + jiraCode(f.html) + "{code}" : "") +
        (f.fix ? "\n\nSuggested fix" + (f.fix.framework && f.fix.framework !== "html" ? " (" + (SR_FW_LABEL[f.fix.framework] || f.fix.framework) + ")" : "") + ":\n{code}" + jiraCode(f.fix.snippet) + "{code}\n" + f.fix.note : "") +
        "\n\nHow to verify: " + f.verify,
    ]);
  }
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

// When a DLS report exists, outline its gaps and capture a second screenshot
// so combined-mode exports carry visual evidence for both audits.
async function captureDlsShot() {
  if (!lastDlsExport) return null;
  try {
    await bg("clearHighlights");
    await bg("dlsHighlight");
    await new Promise((r) => setTimeout(r, 400));
    return await bg("captureTab");
  } catch (_) {
    return null;
  }
}

// Outline all violations on the page, then capture the visible tab so the
// report carries visual evidence. Returns null when unavailable.
async function captureScanShot() {
  if (!lastReport || !lastReport.violations.length) return null;
  if (lastReport.url.startsWith("user flow")) return null;
  try {
    const items = [];
    for (const v of lastReport.violations) {
      for (const n of v.nodes) items.push({ sel: n.target[0], impact: v.impact });
    }
    await bg("highlightAll", { items });
    await new Promise((r) => setTimeout(r, 400));
    return await bg("captureTab");
  } catch (_) {
    return null;
  }
}

function safeName(url) {
  try {
    return new URL(url).hostname.replace(/[^a-z0-9.-]/gi, "_") || "page";
  } catch (_) {
    return "page";
  }
}

function download(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Attach the suggested fix (per current framework setting) to every node.
function withSuggestions(report) {
  const fw = settings.framework || "html";
  return {
    ...report,
    violations: report.violations.map((v) => ({
      ...v,
      nodes: v.nodes.map((n) => {
        const fix = A11yFixes.suggestFix(v.id, n, fw, fixOpts());
        return fix ? { ...n, suggestedFix: fix.snippet, fixNote: fix.note } : n;
      }),
    })),
  };
}

function csvEscape(s) {
  let v = String(s ?? "");
  // neutralise spreadsheet formula injection from page-controlled text (=, +, -, @, tab, CR)
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replace(/"/g, '""') + '"';
}
// Jira wiki: a literal {code}/{noformat} inside embedded markup would close the block early.
function jiraCode(s) {
  return String(s ?? "").replace(/\{(code|noformat)(:[^}]*)?\}/gi, "{ $1$2}");
}

function toCsv(report) {
  const fw = settings.framework || "html";
  const rows = [["rule", "impact", "help", "helpUrl", "selector", "html", "failureSummary", "suggestedFix"]];
  for (const v of report.violations) {
    for (const n of v.nodes) {
      const fix = A11yFixes.suggestFix(v.id, n, fw, fixOpts());
      rows.push([v.id, v.impact, v.help, v.helpUrl, n.target.join(" "), n.html, n.failureSummary, fix ? fix.snippet : ""]);
    }
  }
  for (const f of A11yFixes.srFindings(srResultsForExport())) {
    rows.push(["sr:" + f.code, f.level, f.title.replace(/^\[SR\] /, ""), "", f.selectors.length ? f.selectors.join(" | ") : f.sel, f.html, f.msg + " — How to verify: " + f.verify, f.fix ? f.fix.snippet : ""]);
  }
  const manual = manualResultsForExport();
  if (manual) {
    rows.push([]);
    rows.push(["manual test", "verdict", "wcag", "finding", "selector", "note", ""]);
    for (const m of manual) {
      if (!m.findings.length) {
        rows.push([m.title, m.verdict, m.wcag, "", "", "", ""]);
      } else {
        for (const f of m.findings) {
          rows.push([m.title, m.verdict, m.wcag, f.finding, f.selector || "", f.note || "", ""]);
        }
      }
    }
  }
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function toHtml(report, shot, dlsShot) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of report.violations) counts[v.impact] = (counts[v.impact] || 0) + v.nodeTotal;
  const impactColor = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#616161" };

  const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const sortedRules = [...report.violations].sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]);
  const ruleIndex = sortedRules.length < 2 ? "" : `
  <h2 style="font-size:16px;margin-top:20px">Rule summary</h2>
  <table style="border-collapse:collapse;width:100%;font-size:13px">
    <tr><th style="text-align:left;padding:3px 10px">Rule</th><th style="text-align:left;padding:3px 10px">Impact</th><th style="text-align:left;padding:3px 10px">Elements</th></tr>
    ${sortedRules.map((v) => `
    <tr>
      <td style="padding:3px 10px;border-bottom:1px solid #eee"><a href="#rule-${escHtml(v.id)}">${escHtml(v.help)}</a></td>
      <td style="padding:3px 10px;border-bottom:1px solid #eee;font-weight:700;color:${impactColor[v.impact]}">${v.impact}</td>
      <td style="padding:3px 10px;border-bottom:1px solid #eee">${v.nodeTotal}</td>
    </tr>`).join("")}
  </table>`;
  const shotHtml = shot ? `
  <h2 style="font-size:16px;margin-top:20px">${escHtml(dt("scanShotNote"))}</h2>
  <img src="${shot}" style="max-width:100%;border:1px solid #ddd;border-radius:6px">` : "";

  const sections = sortedRules.map((v) => `
    <section id="rule-${escHtml(v.id)}" style="border:1px solid #ddd;border-left:5px solid ${impactColor[v.impact]};border-radius:6px;margin:14px 0;padding:12px 16px">
      <h2 style="margin:0 0 4px;font-size:16px">${escHtml(v.help)}
        <small style="color:${impactColor[v.impact]};text-transform:uppercase">${v.impact}</small>
        <small style="color:#888">— ${v.nodeTotal} element(s)</small></h2>
      <p style="margin:4px 0 10px;color:#555">${escHtml(v.description)}
        <a href="${escHtml(v.helpUrl)}">Learn more</a></p>
      ${v.nodes.map((n) => {
        const fix = A11yFixes.suggestFix(v.id, n, settings.framework || "html", fixOpts());
        return `
        <div style="border-top:1px solid #eee;padding:8px 0">
          <div style="font-size:12px;color:#555;margin-bottom:3px">Selector: <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(n.target.join(" "))}</code></div>
          <code style="display:block;background:#f6f6f6;padding:6px 8px;border-radius:4px;white-space:pre-wrap;word-break:break-all">${escHtml((n.pageLabel ? "[" + n.pageLabel + "] " : "") + n.html)}</code>
          <div style="color:#777;font-size:13px;white-space:pre-wrap;margin-top:4px">${escHtml(n.failureSummary)}</div>
          ${fix ? `
          <div style="border-left:4px solid #2e7d32;background:#f2f8f2;border-radius:4px;padding:6px 10px;margin-top:6px">
            <div style="color:#2e7d32;font-weight:700;font-size:12px">Suggested fix</div>
            <code style="display:block;white-space:pre-wrap;word-break:break-all;font-size:12px">${escHtml(fix.snippet)}</code>
            <div style="color:#557755;font-size:12px;margin-top:2px">${escHtml(fix.note)}</div>
          </div>` : ""}
        </div>`;
      }).join("")}
    </section>`).join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><base target="_blank"><title>A11y Miyar report — ${escHtml(report.url)}</title></head>
<body style="font:14px/1.5 system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 16px;background:#fff;color:#1a1a1a">
  <h1 style="font-size:22px">🔍 A11y Miyar report</h1>
  <p><b>Page:</b> ${escHtml(report.url)}<br>
     <b>Scanned:</b> ${escHtml(report.scannedAt)}<br>
     <b>Rule set:</b> ${escHtml(report.ruleSet)}</p>
  <p>
    <b style="color:#d32f2f">${counts.critical} critical</b> ·
    <b style="color:#e65100">${counts.serious} serious</b> ·
    <b style="color:#f9a825">${counts.moderate} moderate</b> ·
    <b style="color:#616161">${counts.minor} minor</b> ·
    <b style="color:#2e7d32">${report.passes} checks passed</b>
  </p>
  ${shotHtml}
  ${ruleIndex}
  ${report.noScan ? `<p style="color:#777">${escHtml(t("noScanNote"))}</p>` : sections || "<p>🎉 No violations found by automated checks.</p>"}
  ${manualSectionHtml()}
  ${srSectionHtml()}
  ${dlsSectionHtml(dlsShot)}
  <hr><p style="color:#999;font-size:12px">Generated by A11y Miyar (axe-core). Automated checks cover only part of WCAG — manual testing still required.</p>
</body></html>`;
}

function manualSectionHtml() {
  const results = manualResultsForExport();
  if (!results) return "";
  const color = { pass: "#2e7d32", fail: "#d32f2f", na: "#616161", "not tested": "#999" };
  const label = { pass: "PASS", fail: "FAIL", na: "N/A", "not tested": "not tested" };
  const rows = results.map((r) => `
    <tr>
      <td style="padding:4px 10px;border-bottom:1px solid #eee;vertical-align:top">${escHtml(r.title)}</td>
      <td style="padding:4px 10px;border-bottom:1px solid #eee;color:#888;vertical-align:top">${escHtml(r.wcag)}</td>
      <td style="padding:4px 10px;border-bottom:1px solid #eee;font-weight:700;color:${color[r.verdict]};vertical-align:top">${label[r.verdict]}</td>
      <td style="padding:4px 10px;border-bottom:1px solid #eee">${r.findings.map((f) =>
        `❌ ${escHtml(f.finding)}${f.note ? " — " + escHtml(f.note) : ""}${f.selector ? `<br><code>${escHtml(f.selector)}</code>` : ""}`
      ).join("<br>") || "—"}</td>
    </tr>`).join("");
  return `
  <h2 style="font-size:18px;margin-top:30px">🧭 Guided manual tests</h2>
  <table style="border-collapse:collapse;width:100%">
    <tr><th style="text-align:left;padding:4px 10px">Test</th>
        <th style="text-align:left;padding:4px 10px">WCAG</th>
        <th style="text-align:left;padding:4px 10px">Verdict</th>
        <th style="text-align:left;padding:4px 10px">Findings</th></tr>
    ${rows}
  </table>`;
}

/* ---------------- help ---------------- */

const HELP_TOPICS = [
  {
    icon: "▶", title: "Scan this page",
    what: "Injects axe-core (the open-source engine behind axe DevTools and Lighthouse) into the inspected page and runs an automated WCAG audit.",
    benefit: "In seconds you get every machine-detectable violation, sorted by severity, each with the offending HTML, an explanation, and a link to the fix.",
    example: "You inherit a legacy page. One scan tells you it has 3 critical issues (missing form labels, no alt text), so you know exactly where to start.",
  },
  {
    icon: "🎚", title: "Rule set picker & best practices",
    what: "Scan settings starts with a Preset row: Recommended (WCAG 2.2 AA + best practices + SR rules — the default), Strict WCAG only (2.2 AA, nothing extra) or Everything (all axe rules). Below it the dropdown limits the scan to a WCAG conformance level (2.0 A up to 2.2 AA) or runs every rule, and the checkboxes add axe's best-practice rules (heading order, page has one h1, landmarks/regions, empty table headers — on by default and tagged 'best practice' on the finding card) and the experimental screen-reader rules. The header button shows the preset name, or the combination when you customise. Your choice is saved as the default.",
    benefit: "Match the scan to your actual legal/contract target — no noise from rules you're not accountable for.",
    example: "A government client requires WCAG 2.1 AA. Pick '2.1 AA', scan, and the report maps 1-to-1 to what the auditor will check.",
  },
  {
    icon: "⏺", title: "Record flow (user flow analysis)",
    what: "While recording, the page is re-scanned on an interval and after every navigation. All findings are merged into one de-duplicated report, each labeled with the page it came from, like [/cart]. The Screen reader tab's focus trace and live monitor run alongside, and when you stop, a 🎞 Journey transcript appears at the top of that tab: every step in order (time, page, what was announced), with gaps in red — silent updates, focus lost, modal escapes, silent or stale SPA navigations, and quiet stretches where the DOM changed for over 5 s with nothing announced. If every page/state of the flow carries the same document.title, one 'title never changes' finding is added. Copy it as a plain-text screen reader transcript; it is also in the HTML/PDF/JSON exports.",
    benefit: "A single scan only sees the page as it looks right now. Flows catch what hides in temporary states: open menus, modals, form errors, and later pages of a journey.",
    example: "Auditing a checkout: press ⏺ on the product page → open the size dropdown, add to cart → cart → checkout → submit the form empty → press ■ Stop. One report covers all five states.",
  },
  {
    icon: "◉", title: "Highlighting & Inspect",
    what: "Click any HTML snippet in a finding to outline that element on the page. 'Highlight all' outlines every violating element at once, color-coded by severity; on the DLS tab 'Highlight all gaps' does the same for design-system deviations (gold dashed). 'Inspect' jumps to the element in the Elements panel. Every results tab has a filter box in its toolbar (press /): Automated narrows by rule, impact or selector; DLS by check, verdict, detail or selector; Screen reader by role, name, message, selector or issue code across every section; Manual tests by title, WCAG ref, question or finding — each shows 'N of M'.",
    benefit: "Turns an abstract report row into a thing you can see and fix.",
    example: "A finding says 'links must have discernible text' — clicking it reveals an invisible icon-link in the footer you'd never find by reading the report alone.",
  },
  {
    icon: "◐", title: "Contrast checker",
    what: "An eyedropper that samples any pixel on your screen — pick a text color and background, get the WCAG ratio with AA/AAA pass/fail badges.",
    benefit: "Automated scans can't measure text over images or gradients. The eyedropper works anywhere — even on a Figma mockup in another window.",
    example: "A designer proposes gray #999 on white. Two clicks show 2.85:1 — fails AA (needs 4.5:1). Caught before it ships.",
  },
  {
    icon: "⬇", title: "Export (JSON / CSV / HTML)",
    what: "Downloads the last scan plus your manual test verdicts and findings as JSON, CSV (one row per element), or a styled standalone HTML report.",
    benefit: "Findings become shareable artifacts: attach the HTML to a ticket, import the CSV into a sheet, diff the JSON in CI.",
    example: "Your PM asks 'how bad is it?'. You send the HTML report — totals up top, every violation explained — no extension needed.",
  },
  {
    icon: "🕘", title: "Scan history & NEW badges",
    what: "Each URL's last scan is stored locally. The next scan shows 'N new · M fixed' versus last time, and previously-unseen findings get a NEW badge.",
    benefit: "Answers the two questions that matter while fixing: did my change fix it, and did I break anything else?",
    example: "You fix 5 alt-text issues and rescan: '0 new · 5 fixed'. Next week a teammate's banner shows '3 new' — a regression caught same-day.",
  },
  {
    icon: "⚠", title: "Stale results banner",
    what: "After a scan, a watcher observes the page. If the DOM changes or the page navigates, a banner warns that results may be stale.",
    benefit: "Prevents debugging against an outdated report after the page re-rendered.",
    example: "You scan, then log in. The banner reminds you the logged-in view needs its own scan.",
  },
  {
    icon: "🧙", title: "Guided manual tests (wizards)",
    what: "Ten guided tests for what automation can't judge. Each runs as a wizard: one yes/no question at a time, the verdict computed from your answers. Every 'No' is recorded as a specific finding — optionally with a note and an element you pick directly on the page.",
    benefit: "Automated tools catch only ~30–50% of WCAG. The wizards structure the rest so a non-expert can do a credible audit, and the findings land in your exports next to the automated ones.",
    example: "In the keyboard wizard you answer 'No' to 'Could you Tab out of every widget?', click 📌, click the trapped modal on the page — the report now contains 'Keyboard trap detected' with that element's selector.",
  },
  {
    icon: "🔧", title: "Fix suggestions, Preview fix & AI fix",
    what: "Findings now include a ready-to-paste corrected snippet built from the element's actual HTML (Plain HTML, React/JSX, or Vue — set the framework in Options). Contrast failures get a computed nearest passing color. 'Preview fix' applies the change live on the page (with Undo) so you can re-scan and confirm before touching source. Optional '🤖 AI fix' sends the single offending snippet to the Claude API using your own key from Options. The 'Issues' export produces GitHub-ready markdown, and the CI companion prints the same suggestions with --suggest.",
    benefit: "The tool stops at 'here's what's broken' for most scanners — this closes the loop to 'here's the fix, see it working, paste it'.",
    example: "A contrast finding says #9e9e9e fails on white. The suggestion shows 'color: #757575' (4.61:1 ✓, same hue). Preview fix recolors the live page, a re-scan passes, you copy the one-line CSS change into your stylesheet.",
  },
  {
    icon: "🔊", title: "Screen reader tab",
    what: "Eight checks for what a screen reader (and a low-vision keyboard user) actually receives. Reading order: every node with the role, accessible name and state axe-core computes, flagging unnamed controls, generic 'click here' links, placeholder-only fields, duplicate names, unlabelled clickable divs, aria-hidden focusables and missing state on custom controls — state-missing (a tab without aria-selected, a button/option/checkbox/switch whose 'active'/'selected'/'open' class token has no aria-pressed/selected/checked/expanded — Tailwind variants like active:bg-blue-800 and native <summary> are ignored), required-not-exposed (a single visible '*' or 'required'/'مطلوب' before a field with neither required nor aria-required — password masks and footnotes after the form do not count), readonly-misuse (readonly on a real date/time/combobox picker — a picker class, date input type or calendar button — the user is meant to change; a display-only created_date is fine) and stepper-no-state (a stepper/wizard list with tick icons, icons on some steps only or 'done'/'active' classes but no aria-current=\"step\" and no hidden 'Step 2 of 4, completed' text; a 'how it works' list with an icon on every item is not flagged). Form group labelling: group-no-label (serious: two or more checkbox/radio controls sharing a name or a wrapper with no <fieldset>/<legend> and no named role=\"group\"/\"radiogroup\" — a fieldset named by aria-label/aria-labelledby counts, an 'Other: [text]' field inside the fieldset does not un-name it, a shared name across two labelled fieldsets is two groups, two unrelated checkboxes side by side are not a set; the visible heading is offered as the group name; groups inside tables, menus and listboxes are skipped), question-not-associated (moderate: text ending in '?' followed by two or more visible, adjacent generic Yes/No/OK/Cancel/نعم/لا buttons with no role=\"group\" or dialog aria-labelledby, aria-describedby or a fieldset legend tying them together) and label-not-associated (serious: a <label> without for, or a span/div with a 'label' class or ending in ':', next to a field that has no accessible name or a different one — a placeholder-only name counts as different), with fieldset/legend, role=\"group\" aria-labelledby and <label for> fixes that reuse the visible text. Link behaviour: link-new-window (target=\"_blank\" — also formtarget on a button — with no 'opens in a new tab' in the name, title, aria-describedby or hidden text), link-download-hint (a .pdf/.docx/.xlsx/.zip/.csv or download link whose name gives neither the file type/size nor 'download'), link-external-hint (a link to another host with no 'external' hint) and link-as-button (serious: <a href=\"#\">, href=\"\" or javascript: — announced as 'same page link' — with a click handler or toggle/framework attribute, inside a pagination/breadcrumb, or on the current breadcrumb/pagination item; a bare 'Back to top' href=\"#\" is fine, and same-site subdomains such as eservices.mohre.gov.ae never count as external), each with a hidden-span / <button type=\"button\"> / aria-current=\"page\" fix and an Apply-on-page quick fix. Live regions: a monitor that classifies every DOM change as ANNOUNCED, VIA FOCUS, MAY BE MISSED or SILENT, logs state-not-announced when a click only toggles a state class (or shows/hides the aria-controls / next-sibling target) without any aria-* state change on the control (naming the missing aria-expanded/selected/pressed/checked/current), and watches SPA route changes (pushState/replaceState, popstate, hashchange, title changes): 1.5 s after the URL changes it logs a NAVIGATION entry — route-silent (same title, focus did not move, nothing announced), route-title-stale (document.title unchanged), route-h1-dup (same H1 as the previous page), route-focus-stuck (focus stranded mid-page or on a removed element) or route-ok — with React Router / Vue Router fix snippets (set document.title, focus the H1 with tabindex=-1, a role=\"status\" route announcer). In-page anchors (skip links, 'Back to top', #section links to an existing element) are not route changes; a query-only change (?page=2, sort/filter) keeps its title and H1 and is only noted as a minor route-silent when content re-rendered without an announcement. Focus trace: every focus move with its announced role/name, flagging focus lost to <body>, focus escaping a modal, hidden or unnamed targets, and — for every :focus-visible stop — the focus ring the sighted user sees (outline, else the most visible ring-shaped box-shadow layer, else a border-colour change against the un-focused border; over a background image the contrast is 'unknown', not measured against white): focus-ring-low-contrast (serious: ring colour under 3:1 against the effective background, ratio shown), focus-ring-thin (minor: under 2px) and focus-ring-clipped (moderate: an overflow hidden/auto/scroll ancestor cuts off the ring + outline-offset — calendar grids, carousels, scrollable tables), with a 'ring: outline 1px · 1.4:1' badge on the row and :focus-visible / wrapper-padding fixes; ⌨ Auto-walk moves focus through every Tab stop in real Tab order (positive tabindex first, then DOM order, shadow roots included, up to 400 stops) and reports stops the keyboard cannot reach, order jumps caused by positive tabindex, and trap candidates to verify by hand; on every stop that is (or is inside) a custom widget — role=\"tablist\"/\"radiogroup\"/\"listbox\"/\"menu\"/\"menubar\"/\"tree\"/\"grid\"/\"combobox\", an aria-haspopup trigger or a div/span with role=\"button\" — it also presses synthetic ArrowRight, ArrowDown, ArrowLeft, ArrowUp (until one moves), Enter, Space and Escape (on whatever holds focus, then on the popup) and watches 150 ms for a focus move, an aria-selected/expanded/checked/activedescendant change, a popup (listbox/menu/dialog/grid becoming visible) or any DOM change: widget-no-arrow-nav (serious: arrows changed nothing in a tablist/radiogroup/listbox/menu — roving tabindex + keydown fix, React/Vue variants), widget-no-enter-space (moderate: Enter and Space changed nothing on a role=\"button\" div, combobox or aria-haspopup trigger — verify manually, synthetic keys cannot trigger native activation) and widget-esc-no-close (moderate: the popup Enter opened stayed open after Escape). These are hints, not proof: native <select>, date inputs, contenteditable, submit buttons, Enter inside a <form>, native <button>/<a href>/<input> triggers (the browser turns Enter/Space into a click) and div buttons named Delete/Logout/Submit/Pay/Accept (the probe runs real handlers) are skipped, the page is restored after each probe (Escape, blur, re-focus) and at most 40 widgets are probed. Language: Arabic text under lang=\"en\" (and vice versa), missing/invalid lang and dir. Non-text contrast (WCAG 1.4.11, no axe rule): every visible form control, icon-only button/link and custom toggle (role=\"switch\", .toggle/.switch) is measured — every visible border side, the control's own background where it differs from its surroundings, and the strongest SVG fill/stroke or icon-font colour; the best of them decides, so a faint decorative border on an icon button with a dark glyph passes — against the effective background behind it (a photo or gradient behind the control is skipped as unknown); under 3:1 is nontext-contrast (serious) with both swatches, the ratio and a border-color / fill / background-color fix at a passing colour (nearest DLS token with 'DLS colors' on); disabled controls, native widgets the browser paints and children of a failed control are skipped. Reflow & zoom (WCAG 1.4.10 / 1.4.4, Chromium, opt-in): through the DevTools protocol the page is rendered at a 320 px viewport (400 % zoom on a 1280 px screen) and then, at its own width, with 200 % text — reflow-horizontal-scroll (serious: the page scrolls sideways; the top-most boxes sticking out, with their width), reflow-clipped-text / -200 (moderate: text cut off by overflow hidden, nowrap or ellipsis), reflow-overlap / -200 (serious: two controls whose boxes overlap by more than 20 % and really cover each other — hit-tested; moderate when they already overlap at the normal width) and reflow-fixed-too-tall (moderate: a fixed bar, or a sticky one stuck at the top, taller than a quarter of the screen), each with a CSS fix (flex-wrap, min-width: 0, max-width: 100%, overflow-wrap, white-space: normal, a stacking media query, sticky + max-height) and before/320 px screenshots in the section and the HTML report; needs the same debugger permission as the browser tree, and Run all checks includes it only once that permission is granted. Browser tree: the real accessibility tree via the DevTools protocol (Chromium, opt-in). Every fix snippet follows the framework chosen in Options — plain HTML, React/JSX (htmlFor, className, onKeyDown, self-closing tags, useRef + useEffect for focus and showModal) or Vue (@click/@keydown, ref + $refs.dlg.showModal(), v-if hints) — and the 'Change to' header names the active framework. Repeated findings with the same markup shape (tag, classes, role, issue codes) collapse into one row with a '×N identical' badge, one fix and a collapsible list of the N selectors; on UAE DLS pages the group is labelled with the aegov-* component ('aegov-card · link'). Groups carry through to the Manual test findings and the exports (instances + selectors). A score card at the top (0–100, PASS/WARN/FAIL like the DLS report) weighs every finding by severity — duplicate names count once per group, silent live updates weigh most — lists the Top 5 things to fix, and is stored per URL so the History section shows the trend. Mechanical fixes (aria-label / alt / tabindex / inert / dir / lang attributes, role=\"status\" on a silent region, div→button retag, a <span lang> wrapper) have an 'Apply on page' button — with an inline text box for names you must choose — that changes the live page, re-runs the check and marks the row ✓ fixed when the issue is gone; Undo restores the original element. Changes live only until the page reloads. 'Hear it': every reading-order, browser-tree and focus-trace row has a 🔈 button that speaks what a screen reader would say (\"Your name, edit text, required\") through the browser's speech synthesis, using an Arabic or English voice per the element's lang; Play page reads the listed rows top to bottom while highlighting each element on the page, with a 0.8–2× rate slider. Playback is scoped: the filter box and 'issues only' decide which rows play (the Play button's tooltip says 'Play n rows'), every row has 'Play from here' (this row to the end) and 'Play this section' (this row and the rows nested under it — a card, a navigation, a form), 'Play from element' lets you click an element on the page and starts from its row, and while playing Space pauses/resumes and Esc stops; live-log entries speak their announced text with the politeness prefix. Bilingual comparison: enter the URL of the other-language version (guessed from /ar/ ↔ /en/, ?lang= or an ar./en. host prefix) and Compare loads it in a hidden tab, then lists what differs between the two accessibility trees — controls present in one language only, controls or landmarks named in one and unnamed in the other, live regions missing on one side, heading counts per level, and html lang/dir on each side — with fixes, a difference count in the score and the exports.",
    benefit: "Most screen reader bugs are naming and state-sequence problems that a DOM snapshot cannot reveal. These turn 'did it announce?' from a memory test into evidence you can click, and drop straight into the Manual test findings and exports.",
    example: "You start the live monitor, submit a form empty, and the log shows the red error text as SILENT. The fix is one role=\"alert\" on the container — verified by re-submitting and seeing ANNOUNCED [assertive].",
  },
  {
    icon: "⌨", title: "Keyboard shortcuts & options",
    what: "In the panel: S or Ctrl/⌘+Enter = run the active tab's audit (Overview: full audit), R = record/stop flow, H = highlight all, X = clear highlights, C = contrast, E = export menu, / = focus the active tab's filter box, I = toggle \"issues only\" on the Screen reader tab, Esc = close menus, 1–6 = switch tabs (Overview, Automated, DLS, Manual, Screen reader, Help). While 'Hear it' playback is running on the Screen reader tab: Space = pause/resume (the current row stays highlighted), Esc = stop. The 'SR rules' checkbox adds axe's experimental screen-reader rules (label-content-name-mismatch, p-as-heading, table-fake-caption, td-has-header, focus-order-semantics). The extension options page (right-click the toolbar icon → Options) sets the default WCAG level, flow scan interval, language (English/العربية with RTL layout) and the debugger permission for the browser accessibility tree.",
    benefit: "Faster daily use, and defaults that match how your team works.",
    example: "Set Arabic in Options and the panel chrome flips to RTL for colleagues who prefer it.",
  },
  {
    icon: "🇦🇪", title: "UAE Design System (DLS) check",
    what: "One click audits the page against the UAE Design System (AEGov DLS v3, designsystem.gov.ae — mandated for federal government entities): aegov- component adoption, the DLS font set (Roboto/Inter for English, Noto Kufi Arabic/Alexandria for Arabic), the 5-weight limit, color-token conformance against the real @aegov/design-system palette (115 tokens), bilingual/RTL requirements, responsive viewport, and the mandated WCAG 2.2 AA level via the scanner. The tab's toolbar has a filter box (check, verdict, detail or selector — 'N of M' rows), 'Highlight all gaps' to outline every deviation on the page, and Clear highlights.",
    benefit: "FGE teams get an instant answer to 'is this page on the design system, and where does it deviate?' — including which non-token colors are in use and their nearest official token.",
    example: "A ministry microsite scores 3/8: fonts are Open Sans instead of Roboto/Inter, buttons use #1a73e8 (nearest token: techblue-600), and there is no Arabic switcher. The report is the punch list for the vendor.",
  },
  {
    icon: "🔭", title: "WCAG 3.0 readiness",
    what: "WCAG 3.0 ('Silver') is still a W3C draft — no tool can legitimately test against it yet, and axe-core has no WCAG 3 rules because the success criteria aren't final. A11y Miyar tracks the stable standards (WCAG 2.0/2.1/2.2, which remain the legal basis worldwide) and will add WCAG 3 scoring when the standard and axe-core support land.",
    benefit: "You can't be caught out: everything this tool reports maps to the standards auditors and regulations actually use today. WCAG 2.2 AA conformance is also the expected on-ramp to WCAG 3 — nothing you fix now is wasted.",
    example: "A client asks 'are we WCAG 3 ready?'. The honest answer this tool supports: 'WCAG 3 is a draft; we conform to WCAG 2.2 AA, which is the current requirement and the foundation WCAG 3 builds on.'",
  },
  {
    icon: "⚖", title: "What automation can't do",
    what: "axe-core's rules are conservative by design: they only report what is provably wrong, so there are near-zero false positives.",
    benefit: "You can trust every automated finding — but a clean scan is NOT proof of accessibility. Roughly half of WCAG needs human judgment.",
    example: "alt=\"image123.jpg\" passes the automated check but fails a real user. That's what the wizards are for — run both before calling a page accessible.",
  },
];

let helpRendered = false;
// help topic glyph → sprite icon (the summary is a control, so no emoji there)
const HELP_ICON = { "▶": "i-play", "🎚": "i-sliders", "⏺": "i-record", "◉": "i-target", "◐": "i-contrast", "⬇": "i-export", "🕘": "i-history",
  "⚠": "i-warn", "🧙": "i-wand", "🔧": "i-sparkle", "🔊": "i-speaker", "⌨": "i-keyboard", "🇦🇪": "i-layout", "🔭": "i-globe", "⚖": "i-clipboard" };
function renderHelp() {
  if (helpRendered) return;
  helpRendered = true;
  for (const topic of HELP_TOPICS.map(localizeTopic)) {
    const det = document.createElement("details");
    det.className = "help-card";
    const sum = document.createElement("summary");
    setLabel(sum, HELP_ICON[topic.icon] || "i-help", topic.title, { trailing: svgIcon("i-chevron") });
    det.appendChild(sum);
    const body = document.createElement("div");
    body.className = "help-card-body";
    const what = document.createElement("p");
    what.textContent = topic.what;
    const benefit = document.createElement("p");
    benefit.className = "benefit";
    const bb = document.createElement("b");
    bb.textContent = t("helpWhy");
    benefit.append(bb, topic.benefit);
    const example = document.createElement("p");
    example.className = "example";
    const eb = document.createElement("b");
    eb.textContent = t("helpExample");
    example.append(eb, topic.example);
    body.append(what, benefit, example);
    det.appendChild(body);
    helpListEl.appendChild(det);
  }
}

/* ---------------- Arabic content (manual tests + help) ---------------- */

const MANUAL_AR = {
  keyboard: {
    title: "التنقّل بلوحة المفاتيح فقط",
    why: "كثير من المستخدمين لا يستخدمون الفأرة إطلاقاً. يجب أن يكون كل شيء قابلاً للوصول والتشغيل بلوحة المفاتيح وحدها، دون أي فخاخ.",
    helperLabel: "ترقيم مواضع التنقل",
    questions: [
      ["هل استطعت الوصول إلى كل عنصر تفاعلي باستخدام Tab فقط (والأسهم داخل المكوّنات)؟", "بعض العناصر لا يمكن الوصول إليها بلوحة المفاتيح"],
      ["هل استطعت تفعيل كل عنصر بمفتاح Enter أو المسافة؟", "عناصر لا يمكن تفعيلها بلوحة المفاتيح"],
      ["هل استطعت دائماً الخروج بـ Tab من كل مكوّن — دون فخ لوحة مفاتيح (نوافذ منبثقة، مشغّلات)؟", "تم رصد فخ لوحة مفاتيح"],
      ["هل كل تفاعل يعتمد على الفأرة أو التمرير متاح أيضاً بلوحة المفاتيح؟", "تفاعل يعمل بالفأرة فقط دون بديل للوحة المفاتيح"],
    ],
  },
  "focus-visible": {
    title: "مؤشر تركيز مرئي",
    why: "مستخدمو لوحة المفاتيح المبصرون يجب أن يروا دائماً أي عنصر عليه التركيز.",
    helperLabel: "ترقيم مواضع التنقل",
    questions: [
      ["هل أظهر كل موضع تنقل مؤشر تركيز واضحاً (إطار، حلقة، خط سفلي…)؟", "عناصر تستقبل التركيز دون مؤشر مرئي"],
      ["هل كان المؤشر واضحاً على الخلفية في كل أقسام الصفحة؟", "تباين مؤشر التركيز غير كافٍ في بعض المناطق"],
    ],
  },
  "focus-order": {
    title: "ترتيب تركيز وقراءة منطقي",
    why: "يجب أن يتبع التركيز التدفق البصري للقراءة، وإلا ارتبك مستخدمو لوحة المفاتيح وقارئات الشاشة.",
    helperLabel: "ترقيم مواضع التنقل",
    questions: [
      ["هل تتبع أرقام مواضع التنقل الترتيب البصري لقراءة الصفحة؟", "ترتيب التركيز لا يطابق الترتيب البصري"],
      ["هل لا توجد قفزات مفاجئة (إلى التذييل أو مناطق خارج الشاشة أو محتوى أعيد ترتيبه بـ CSS)؟", "قفزة تركيز غير متوقعة"],
    ],
  },
  headings: {
    title: "بنية العناوين",
    why: "مستخدمو قارئات الشاشة يتنقلون عبر العناوين. يجب أن تصف البنية الصفحة كفهرس محتويات.",
    helperLabel: "عرض مخطط العناوين",
    questions: [
      ["هل يوجد h1 واحد بالضبط يصف غرض الصفحة؟", "h1 مفقود أو متعدد أو غير واضح"],
      ["هل تتداخل مستويات العناوين دون تخطٍّ (h2 ثم h3، وليس h2 ثم h4)؟", "تخطٍّ في مستويات العناوين"],
      ["هل يصف كل عنوان قسمه بدقة (لا عناوين غامضة أو نص عريض يتظاهر بأنه عنوان)؟", "عناوين غير واضحة أو زائفة"],
    ],
  },
  landmarks: {
    title: "المعالم ورابط التخطي",
    why: "المعالم (header, nav, main, footer) ورابط التخطي يتيحان لمستخدمي التقنيات المساعدة تجاوز المحتوى المتكرر.",
    helperLabel: "تحديد المعالم",
    questions: [
      ["هل المحتوى الرئيسي داخل معلم main واحد بالضبط؟", "المحتوى ليس داخل معلم main واحد"],
      ["هل أول موضع Tab هو رابط «تخطّ إلى المحتوى» يعمل فعلاً؟", "لا يوجد رابط تخطٍّ يعمل"],
      ["هل تحمل المعالم المتكررة (مثل قائمتي تنقل) تسميات مميِّزة؟", "معالم مكررة دون تسميات"],
    ],
  },
  "alt-quality": {
    title: "جودة النص البديل للصور",
    why: "الفحص الآلي يكتشف غياب سمة alt، لكنه لا يحكم على جودة النص نفسه.",
    helperLabel: "عرض النصوص البديلة",
    questions: [
      ["هل ينقل النص البديل لكل صورة معلوماتية المعلومات نفسها التي تنقلها الصورة؟", "النص البديل لا ينقل معلومات الصورة"],
      ["هل الصور الزخرفية البحتة معلَّمة بـ alt فارغ (تظهر كـ decorative)؟", "صورة زخرفية تُقرأ على قارئ الشاشة"],
      ["هل تصف الصور الوظيفية (داخل روابط/أزرار) الإجراء لا الشكل؟", "النص البديل لصورة وظيفية يصف الشكل لا الإجراء"],
    ],
  },
  zoom: {
    title: "التكبير 200% وإعادة التدفق",
    why: "ضعاف البصر يكبّرون الصفحة. يجب أن يبقى المحتوى صالحاً للاستخدام دون تمرير أفقي أو تداخل.",
    questions: [
      ["عند تكبير 200% (⌘+ / Ctrl+)، هل بقي كل النص والوظائف متاحاً — دون اقتصاص أو تداخل؟", "المحتوى يتعطل عند تكبير 200%"],
      ["عند ~400% في نافذة عادية (يعادل عرض 320 بكسل)، هل يعاد تدفق المحتوى في عمود واحد دون تمرير أفقي؟", "لا إعادة تدفق عند عرض يعادل 320 بكسل"],
    ],
  },
  "screen-reader": {
    title: "اختبار قارئ الشاشة",
    why: "الاختبار الحاسم: هل تكون الصفحة مفهومة عند سماعها بدل رؤيتها؟ (ماك: ⌘F5 لتشغيل VoiceOver. ويندوز: NVDA أو Narrator.)",
    questions: [
      ["بالقراءة من الأعلى، هل كان كل ما يُنطق مفهوماً وبترتيب سليم؟", "المحتوى المنطوق مربك أو خارج الترتيب"],
      ["هل أعلنت كل عناصر التحكم دورها واسمها وحالتها بشكل صحيح («زر»، «خانة اختيار، محددة»)؟", "عناصر تعلن دوراً/اسماً/حالة خاطئة أو ناقصة"],
      ["هل أُعلنت التحديثات الديناميكية (تنبيهات، أخطاء تحقق، محتوى مباشر)؟", "تحديث ديناميكي صامت على قارئات الشاشة"],
    ],
  },
  motion: {
    title: "الحركة والرسوم والوميض",
    why: "الحركة التلقائية تشتت؛ والوميض فوق 3 هرتز قد يسبب نوبات صرع.",
    questions: [
      ["هل كل حركة تلقائية تتجاوز 5 ثوانٍ لها زر إيقاف/إيقاف مؤقت؟", "حركة تلقائية دون زر إيقاف"],
      ["هل لا يومض أي محتوى أكثر من 3 مرات في الثانية؟", "محتوى يومض فوق 3 هرتز"],
      ["هل تُحترم تفضيلات «تقليل الحركة» في نظام التشغيل (prefers-reduced-motion)؟", "تجاهل تفضيل تقليل الحركة"],
    ],
  },
  forms: {
    title: "تسميات النماذج ومعالجة الأخطاء",
    why: "الفحص الآلي يتأكد من وجود التسميات؛ الإنسان وحده يحكم إن كانت الأخطاء مفهومة وقابلة للتصحيح.",
    questions: [
      ["عند إرسال بيانات خاطئة، هل توصف الأخطاء نصاً (لا لوناً فقط) موضحةً ما الخطأ وكيف يُصحح؟", "أخطاء غير واضحة أو تُنقل باللون فقط"],
      ["هل ينتقل التركيز إلى أول حقل خاطئ (أو يُعلن عنه)؟", "الأخطاء لا تُلفت انتباه المستخدم"],
      ["هل تُحدد الحقول الإلزامية قبل الإرسال لا بعد الفشل فقط؟", "الحقول الإلزامية غير محددة مسبقاً"],
    ],
  },
};

const HELP_AR = {
  "Scan this page": {
    title: "فحص هذه الصفحة",
    what: "يحقن محرك axe-core (المحرك مفتوح المصدر خلف axe DevTools وLighthouse) في الصفحة ويجري تدقيق WCAG آلياً.",
    benefit: "خلال ثوانٍ تحصل على كل مخالفة قابلة للاكتشاف آلياً، مرتبةً حسب الخطورة، مع الكود المخالف والشرح ورابط الإصلاح.",
    example: "ورثت صفحة قديمة. فحص واحد يخبرك أن فيها 3 مشاكل حرجة (تسميات نماذج مفقودة، صور بلا نص بديل) فتعرف من أين تبدأ بالضبط.",
  },
  "Rule set picker & best practices": {
    title: "اختيار مجموعة القواعد وأفضل الممارسات",
    what: "تبدأ إعدادات الفحص بصف «إعداد مسبق»: الموصى به (WCAG 2.2 AA + أفضل الممارسات + قواعد قارئ الشاشة — الافتراضي)، أو WCAG فقط (2.2 AA بلا إضافات)، أو كل القواعد. تحته تحصر القائمة الفحص في مستوى مطابقة WCAG (من 2.0 A حتى 2.2 AA) أو تشغّل كل القواعد، وتضيف مربعات الاختيار قواعد axe الاسترشادية (ترتيب العناوين، عنوان h1 واحد، المعالم والمناطق، رؤوس الجداول الفارغة — مفعّلة افتراضياً وموسومة «أفضل الممارسات» على بطاقة النتيجة) والقواعد التجريبية لقارئ الشاشة. يعرض زر الرأس اسم الإعداد المسبق أو التركيبة عند التخصيص. اختيارك يُحفظ كافتراضي.",
    benefit: "طابق الفحص مع متطلبك القانوني أو التعاقدي الفعلي — دون ضجيج من قواعد لست مساءلاً عنها.",
    example: "جهة حكومية تشترط WCAG 2.1 AA. اختر «2.1 AA» وافحص، فيطابق التقرير ما سيدققه المراجع واحداً لواحد.",
  },
  "Record flow (user flow analysis)": {
    title: "تسجيل مسار الاستخدام (تحليل الرحلة)",
    what: "أثناء التسجيل يعاد فحص الصفحة دورياً وبعد كل انتقال، وتُدمج النتائج في تقرير واحد بلا تكرار، مع وسم كل نتيجة بالصفحة التي جاءت منها مثل [/cart]. يعمل تتبّع التركيز ومراقب المناطق الحية في تبويب قارئ الشاشة بالتوازي، وعند الإيقاف يظهر «🎞 نص الرحلة» أعلى ذلك التبويب: كل خطوة بترتيبها (الوقت، الصفحة، ما أُعلن)، والفجوات بالأحمر — تحديثات صامتة، فقدان التركيز، هروب من النافذة، تنقّلات SPA صامتة أو بعنوان قديم، وفترات صمت تغيّر فيها DOM لأكثر من 5 ثوانٍ بلا إعلان. وإذا حملت كل صفحات/حالات المسار نفس document.title تُضاف نتيجة واحدة «العنوان لا يتغير أبداً». انسخه كنص قارئ شاشة، وهو مضمّن أيضاً في تصدير HTML/PDF/JSON.",
    benefit: "الفحص الواحد لا يرى إلا الصفحة كما تبدو الآن. المسارات تلتقط ما يختبئ في الحالات المؤقتة: القوائم المفتوحة، النوافذ المنبثقة، رسائل أخطاء النماذج، وصفحات لاحقة في الرحلة.",
    example: "تدقيق صفحة دفع: اضغط ⏺ في صفحة المنتج → افتح قائمة المقاسات وأضف للسلة → السلة → الدفع → أرسل النموذج فارغاً → اضغط ■. تقرير واحد يغطي الحالات الخمس.",
  },
  "Highlighting & Inspect": {
    title: "التظليل والفحص في Elements",
    what: "انقر أي مقتطف HTML في نتيجة لتحديد العنصر في الصفحة. «تظليل الكل» يحدد كل العناصر المخالفة دفعة واحدة بألوان حسب الخطورة، وفي تبويب نظام التصميم يفعل «تظليل كل الفجوات» الشيء نفسه لانحرافات نظام التصميم (إطار ذهبي متقطع). «Inspect» ينتقل للعنصر في لوحة Elements. لكل تبويب نتائج مربع تصفية في شريط أدواته (اضغط /): الفحص الآلي حسب القاعدة أو الخطورة أو المحدد؛ نظام التصميم حسب الفحص أو الحكم أو التفاصيل أو المحدد؛ قارئ الشاشة حسب الدور أو الاسم أو الرسالة أو المحدد أو رمز المشكلة عبر كل الأقسام؛ الاختبارات اليدوية حسب العنوان أو مرجع WCAG أو السؤال أو النتيجة — ويعرض كل منها «N من M».",
    benefit: "يحوّل سطراً مجرداً في تقرير إلى شيء تراه وتصلحه.",
    example: "نتيجة تقول «الروابط تحتاج نصاً مميِّزاً» — النقر يكشف أن السبب رابط أيقونة خفي في التذييل ما كنت لتجده بقراءة التقرير.",
  },
  "Contrast checker": {
    title: "فاحص التباين",
    what: "قطّارة تلتقط أي بكسل على شاشتك — اختر لون النص ولون الخلفية لتحصل على نسبة تباين WCAG مع شارات نجاح/فشل لمستويي AA وAAA.",
    benefit: "الفحص الآلي لا يقيس النص فوق الصور أو التدرجات. القطّارة تعمل في أي مكان — حتى على تصميم Figma في نافذة أخرى.",
    example: "مصمم يقترح رمادياً #999 على أبيض. نقرتان تظهران 2.85:1 — يفشل في AA (المطلوب 4.5:1). اكتُشف قبل الإطلاق.",
  },
  "Export (JSON / CSV / HTML)": {
    title: "التصدير (JSON / CSV / HTML / PDF)",
    what: "ينزّل آخر فحص — مع أحكام الاختبارات اليدوية ونتائجها ومقترحات الإصلاح لكل عنصر — بصيغة JSON خام أو CSV جدولي أو تقرير HTML مستقل أو PDF عبر نافذة الطباعة.",
    benefit: "تصبح النتائج ملفات قابلة للمشاركة: أرفق التقرير بتذكرة، أو استورد CSV في جدول، أو قارن JSON في CI.",
    example: "يسأل مدير المنتج «ما مدى سوء الوضع؟». ترسل تقرير HTML — الإجماليات أعلاه وكل مخالفة مشروحة مع إصلاحها المقترح — دون حاجته للإضافة.",
  },
  "Scan history & NEW badges": {
    title: "سجل الفحوصات وشارات NEW",
    what: "يُحفظ آخر فحص لكل رابط محلياً. الفحص التالي يعرض «س جديدة · ص أُصلحت» مقارنةً بالسابق مع مخطط اتجاه عبر الزمن، والنتائج غير المرصودة سابقاً تحمل شارة NEW.",
    benefit: "يجيب عن السؤالين المهمين أثناء الإصلاح: هل أصلح تعديلي المشكلة فعلاً؟ وهل كسرت شيئاً آخر؟",
    example: "أصلحت 5 مشاكل نص بديل وأعدت الفحص: «0 جديدة · 5 أُصلحت». بعد أسبوع يُظهر مكوّن زميلك «3 جديدة» — انحدار اكتُشف يوم حدوثه.",
  },
  "Stale results banner": {
    title: "تنبيه النتائج القديمة",
    what: "بعد الفحص يراقب مراقبٌ الصفحة. إذا تغيّر DOM أو انتقلت الصفحة، يظهر تنبيه بأن النتائج قد تكون قديمة.",
    benefit: "يمنع الخطأ الكلاسيكي: تصحيح مشكلة بالاستناد إلى تقرير قديم بعد أن أعادت الصفحة الرسم.",
    example: "تفحص ثم تسجّل الدخول في الصفحة. يظهر التنبيه مذكّراً أن واجهة ما بعد الدخول تحتاج فحصها الخاص.",
  },
  "Guided manual tests (wizards)": {
    title: "الاختبارات اليدوية الموجّهة (المعالج التفاعلي)",
    what: "عشرة اختبارات موجّهة لما لا تستطيع الآلة الحكم عليه. كلٌّ يعمل كمعالج: سؤال نعم/لا واحد في كل خطوة، والحكم يُحسب من إجاباتك. كل «لا» تُسجَّل كنتيجة محددة — مع ملاحظة اختيارية وعنصر تختاره من الصفحة مباشرة.",
    benefit: "الأدوات الآلية تلتقط 30–50% من WCAG فقط. المعالجات تنظّم الباقي بحيث يجري غيرُ الخبير تدقيقاً موثوقاً، وتظهر النتائج في التصدير بجانب النتائج الآلية.",
    example: "في معالج لوحة المفاتيح تجيب «لا» على «هل خرجت بـ Tab من كل مكوّن؟»، تنقر 📌 ثم تنقر النافذة المنبثقة العالقة — فيتضمن التقرير «فخ لوحة مفاتيح» مع محدد ذلك العنصر.",
  },
  "Fix suggestions, Preview fix & AI fix": {
    title: "مقترحات الإصلاح والمعاينة الحية وإصلاح الذكاء الاصطناعي",
    what: "تعرض النتائج مقتطفاً مصححاً جاهزاً للصق مبنياً من HTML الفعلي للعنصر (HTML أو React أو Vue — من الإعدادات). فشل التباين يحصل على أقرب لون ناجح محسوب. «معاينة الإصلاح» تطبّق التغيير حياً في الصفحة (مع تراجع)، و«⚡ إصلاح تلقائي» يطبّق كل الإصلاحات الآلية دفعة واحدة. «🤖 إصلاح AI» الاختياري يرسل المقتطف المخالف وحده إلى Claude API بمفتاحك الخاص.",
    benefit: "معظم الفاحصات تتوقف عند «هذا ما انكسر» — هنا تكتمل الحلقة إلى «هذا هو الإصلاح، شاهده يعمل، ثم الصقه».",
    example: "نتيجة تباين تقول إن #9e9e9e يفشل على الأبيض. المقترح يعرض color: #757575 (نجاح 4.61:1 بنفس الدرجة اللونية). المعاينة تلوّن الصفحة الحية، وإعادة الفحص تنجح، فتنسخ سطر CSS الواحد إلى ملفك.",
  },
  "Screen reader tab": {
    title: "تبويب قارئ الشاشة",
    what: "ثمانية فحوص لما يصل فعلاً إلى قارئ الشاشة (ومستخدم لوحة المفاتيح ضعيف البصر). ترتيب القراءة: كل عقدة مع الدور والاسم المتاح والحالة كما يحسبها axe-core، مع تعليم عناصر التحكم بلا اسم، وروابط \"اضغط هنا\" العامة، والحقول المسمّاة بالـ placeholder فقط، والأسماء المكررة، وعناصر div القابلة للنقر بلا دور، والعناصر القابلة للتركيز داخل aria-hidden، والحالة المفقودة في عناصر التحكم المخصصة — state-missing (تبويب بلا aria-selected، أو زر/خيار/مربع اختيار/مفتاح يحمل صنفاً كاملاً active/selected/open بلا aria-pressed/selected/checked/expanded — تُتجاهل متغيرات Tailwind مثل active:bg-blue-800 وعنصر summary الأصلي)، وrequired-not-exposed (نجمة \"*\" واحدة أو كلمة \"مطلوب\"/\"required\" ظاهرة قبل حقل بلا required ولا aria-required — لا تُحتسب أقنعة كلمة المرور ولا الحواشي بعد النموذج)، وreadonly-misuse (readonly على منتقي تاريخ/وقت/combobox حقيقي — صنف منتقي أو نوع إدخال تاريخ أو زر تقويم — يُفترض أن يغيّره المستخدم؛ حقل created_date للعرض فقط لا يُعلَّم)، وstepper-no-state (قائمة خطوات/معالج بأيقونات صح أو أيقونات على بعض الخطوات فقط أو أصناف done/active بلا aria-current=\"step\" ولا نص مخفي \"الخطوة 2 من 4، مكتملة\"؛ قائمة «كيف يعمل» بأيقونة على كل عنصر لا تُعلَّم). تسمية مجموعات النماذج: group-no-label (خطير: عنصرا اختيار أو أكثر — مربعات اختيار أو اختيار مفرد — يتشاركان الاسم أو الحاوية بلا <fieldset>/<legend> ولا role=\"group\"/\"radiogroup\" مسمّى — fieldset المسمّى بـ aria-label/aria-labelledby يُحتسب، وحقل «أخرى: [نص]» داخل fieldset لا يلغي اسمه، والاسم المشترك بين fieldset مسمّيين يعني مجموعتين، ومربّعا اختيار غير مرتبطين متجاوران ليسا مجموعة — يُقترح العنوان الظاهر اسماً للمجموعة؛ وتُتجاهل المجموعات داخل الجداول والقوائم وlistbox)، وquestion-not-associated (متوسط: نص ينتهي بـ«؟» يليه زران عامّان أو أكثر نعم/لا/موافق/إلغاء/Yes/No بلا role=\"group\" مع aria-labelledby أو aria-describedby أو legend يربطهما به)، وlabel-not-associated (خطير: <label> بلا for، أو span/div بصنف label أو ينتهي بنقطتين، بجوار حقل بلا اسم متاح أو باسم مختلف — الاسم من placeholder فقط يُعدّ مختلفاً)، مع إصلاحات fieldset/legend وrole=\"group\" aria-labelledby و<label for> تعيد استخدام النص الظاهر. سلوك الروابط: link-new-window (target=\"_blank\" — أو formtarget على زر — دون عبارة «يُفتح في تبويب جديد» في الاسم أو title أو aria-describedby أو نص مخفي)، وlink-download-hint (رابط ‎.pdf/.docx/.xlsx/.zip/.csv أو download لا يذكر اسمه نوع الملف/حجمه ولا كلمة «تحميل»)، وlink-external-hint (رابط إلى مضيف آخر بلا تلميح «خارجي»)، وlink-as-button (خطير: ‎<a href=\"#\"> أو href=\"\" أو javascript: — يُعلَن «رابط في نفس الصفحة» — مع معالج نقر أو سمة تبديل/إطار عمل، أو داخل ترقيم صفحات/مسار تنقّل، أو على العنصر الحالي فيهما؛ رابط «العودة للأعلى» بـ href=\"#\" فقط سليم، والنطاقات الفرعية للموقع نفسه مثل eservices.mohre.gov.ae لا تُعدّ خارجية)، لكلٍّ منها إصلاح بنص مخفي أو ‎<button type=\"button\"> أو aria-current=\"page\" وزر «طبّق على الصفحة». المناطق الحية: مراقب يصنّف كل تغيير في DOM إلى مُعلَن أو عبر التركيز أو قد يُفوَّت أو صامت، ويسجّل state-not-announced عندما تبدّل نقرةٌ صنفَ الحالة فقط (أو تُظهر/تُخفي هدف aria-controls أو العنصر التالي) دون أي تغيير في سمات aria-* على عنصر التحكم (مع تسمية السمة الناقصة aria-expanded/selected/pressed/checked/current)، ويراقب تنقّلات تطبيقات الصفحة الواحدة (pushState/replaceState وpopstate وhashchange وتغيّر العنوان): بعد 1.5 ث من تغيّر URL يسجّل مدخل «تنقّل» — route-silent (نفس العنوان، لم ينتقل التركيز، لم يُعلَن شيء) أو route-title-stale (لم يتغير document.title) أو route-h1-dup (نفس H1 للصفحة السابقة) أو route-focus-stuck (تركيز عالق في منتصف الصفحة أو على عنصر أُزيل) أو route-ok — مع مقتطفات إصلاح لـ React Router / Vue Router (ضبط document.title، تركيز H1 بـ tabindex=-1، ومُعلِن مسار role=\"status\"). روابط داخل الصفحة (روابط التخطي و«العودة للأعلى» و#قسم يشير إلى عنصر موجود) ليست تغييرات مسار؛ وتغيير معاملات الاستعلام فقط (?page=2 أو الفرز/التصفية) يحتفظ بعنوانه وH1 ويُسجَّل فقط كـ route-silent طفيف عند إعادة رسم المحتوى دون إعلان. تتبّع التركيز: كل انتقال للتركيز مع الدور/الاسم المُعلَن، مع تعليم فقدان التركيز إلى body، وهروبه من النافذة الحوارية، ووقوعه على عناصر مخفية أو بلا اسم، ولكل محطة :focus-visible حلقةَ التركيز التي يراها المستخدم المبصر (outline، وإلا أوضح طبقة box-shadow على شكل حلقة — ظلال الارتفاع المزاحة ليست حلقة — وإلا تغيّر لون الحد مقارنةً بالحد قبل التركيز؛ فوق صورة خلفية يُعرض التباين «مجهولاً» بدل قياسه على الأبيض): focus-ring-low-contrast (خطير: تباين لون الحلقة مع الخلفية الفعلية أقل من 3:1 مع عرض النسبة)، وfocus-ring-thin (طفيف: أقل من 2px)، وfocus-ring-clipped (متوسط: سلف بـ overflow hidden/auto/scroll يقصّ الحلقة مع outline-offset — شبكات التقويم والعارضات الدوّارة والجداول القابلة للتمرير) مع شارة «حلقة التركيز: outline 1px · 1.4:1» على الصف وإصلاحات :focus-visible / حشو الحاوية؛ و«⌨ جولة تلقائية» تنقل التركيز عبر كل محطات Tab بترتيب Tab الحقيقي (tabindex الموجب أولاً ثم ترتيب DOM، مع shadow roots، حتى 400 محطة) وتبلّغ عن المحطات التي لا تصلها لوحة المفاتيح، وقفزات الترتيب الناتجة عن tabindex الموجب، والمصائد المحتملة للتحقق منها يدوياً؛ وعند كل محطة تكون (أو تقع داخل) عنصراً مخصّصاً — role=\"tablist\"/\"radiogroup\"/\"listbox\"/\"menu\"/\"menubar\"/\"tree\"/\"grid\"/\"combobox\"، أو زر aria-haspopup، أو div/span بدور role=\"button\" — تضغط أيضاً مفاتيح اصطناعية ArrowRight وArrowDown وArrowLeft وArrowUp (حتى يحرّك أحدها التركيز) وEnter وSpace وEscape (على العنصر الذي يحمل التركيز ثم على القائمة المنبثقة) وتراقب 150 ملّي ثانية أي انتقال للتركيز أو تغيّر aria-selected/expanded/checked/activedescendant أو ظهور قائمة منبثقة (listbox/menu/dialog/grid) أو أي تغيّر في DOM: widget-no-arrow-nav (خطير: الأسهم لم تغيّر شيئاً داخل tablist/radiogroup/listbox/menu — إصلاح roving tabindex مع معالج keydown وبدائل React/Vue)، وwidget-no-enter-space (متوسط: Enter وSpace لم يغيّرا شيئاً في div بدور button أو combobox أو زر aria-haspopup — تحقّق يدوياً؛ المفاتيح الاصطناعية لا تُطلق التفعيل الأصلي)، وwidget-esc-no-close (متوسط: القائمة التي فتحها Enter لم تُغلق بـEscape). هذه تلميحات لا إثبات: تُتجاوز <select> الأصلية وحقول التاريخ وcontenteditable وأزرار الإرسال وEnter داخل <form> والمشغّلات الأصلية <button>/<a href>/<input> (المتصفح يحوّل Enter/Space إلى نقرة) وأزرار div المسمّاة حذف/خروج/إرسال/دفع/موافق (الفحص يشغّل المعالجات فعلاً)، وتُستعاد الصفحة بعد كل فحص (Escape ثم blur ثم إعادة التركيز)، وبحد أقصى 40 عنصراً. اللغة: نص عربي تحت lang=\"en\" (والعكس)، وغياب/عدم صحة lang وdir. التباين غير النصي (WCAG 1.4.11، لا قاعدة له في axe): يُقاس كل حقل نموذج مرئي وزر/رابط أيقوني ومفتاح تبديل مخصص (role=\"switch\" أو .toggle/.switch) — كل جانب حدود ظاهر، وخلفية العنصر نفسه حيث تختلف عن محيطها، وأقوى لون fill/stroke في SVG أو لون خط الأيقونة؛ الأفضل بينها هو الحكم، فإطار زخرفي باهت على زر أيقونة داكنة يجتاز — مقابل الخلفية الفعلية خلفه (صورة أو تدرّج خلف العنصر يُتجاوز كمجهول)؛ ما دون 3:1 يُعلَّم nontext-contrast (خطير) مع عيّنتي اللون والنسبة وإصلاح border-color / fill / background-color بلون ناجح (أقرب رمز DLS عند تفعيل «ألوان DLS»)؛ وتُتجاهل العناصر المعطّلة والعناصر الأصلية التي يرسمها المتصفح وأبناء عنصر فشل بالفعل. إعادة التدفق والتكبير (WCAG 1.4.10 / 1.4.4، Chromium، اختياري): عبر بروتوكول DevTools تُعرض الصفحة بعرض 320 بكسل (تكبير 400٪ على شاشة 1280 بكسل) ثم بعرضها الأصلي مع نص 200٪ — reflow-horizontal-scroll (خطير: الصفحة تتمرر أفقياً؛ الصناديق العليا البارزة مع عرضها)، reflow-clipped-text / -200 (متوسط: نص مقطوع بـ overflow hidden أو nowrap أو ellipsis)، reflow-overlap / -200 (خطير: عنصرا تحكم يتداخل صندوقاهما بأكثر من 20٪ ويغطي أحدهما الآخر فعلاً — باختبار نقر؛ متوسط إن كانا متداخلين بالعرض الطبيعي أصلاً) وreflow-fixed-too-tall (متوسط: شريط ثابت، أو لاصق ملتصق بالأعلى، أطول من ربع الشاشة)، لكل منها إصلاح CSS (flex-wrap، min-width: 0، max-width: 100%، overflow-wrap، white-space: normal، استعلام وسائط للتكديس، sticky + max-height) ولقطتا شاشة قبل/320 بكسل في القسم وفي تقرير HTML؛ يتطلب إذن debugger نفسه الذي تتطلبه شجرة المتصفح، ولا يضمّه «تشغيل الفحوص» إلا بعد منح الإذن. شجرة المتصفح: شجرة إمكانية الوصول الحقيقية عبر بروتوكول DevTools (Chromium، اختياري). كل مقتطف إصلاح يتبع إطار العمل المختار في الإعدادات — HTML عادي، أو React/JSX (htmlFor وclassName وonKeyDown ووسوم ذاتية الإغلاق وuseRef + useEffect للتركيز وshowModal) أو Vue (@click/@keydown وref + $refs.dlg.showModal() وتلميحات v-if) — ويُظهر عنوان \"غيّره إلى\" إطار العمل النشط. النتائج المكررة ذات الشكل نفسه (الوسم والأصناف والدور ورموز المشاكل) تُدمج في صف واحد بشارة \"×N متطابقة\" وإصلاح واحد وقائمة قابلة للطي بالمحددات الـN؛ وفي صفحات نظام التصميم الإماراتي تُسمّى المجموعة بمكوّن aegov-* (\"aegov-card · link\"). تنتقل المجموعات إلى نتائج الاختبار اليدوي والتصدير (عدد النسخ والمحددات). بطاقة الدرجة في الأعلى (0–100، ناجح/تحذير/راسب كتقرير نظام التصميم) تزن كل نتيجة حسب خطورتها — الأسماء المكررة تُحسب مرة لكل مجموعة، والتحديثات الحية الصامتة الأثقل — وتعرض أهم 5 إصلاحات، وتُحفظ لكل رابط ليعرض قسم السجل اتجاهها. الإصلاحات الميكانيكية (سمات aria-label / alt / tabindex / inert / dir / lang، وrole=\"status\" على منطقة صامتة، وتحويل div إلى button، وغلاف <span lang>) لها زر «طبّق على الصفحة» — مع حقل نصي للأسماء التي عليك اختيارها — يغيّر الصفحة الحية ويعيد الفحص ويعلّم الصف بـ✓ أُصلح عند اختفاء المشكلة؛ و«تراجع» يعيد العنصر الأصلي. التغييرات تبقى حتى إعادة تحميل الصفحة فقط. «اسمعه»: لكل صف في ترتيب القراءة وشجرة المتصفح وتتبّع التركيز زر 🔈 ينطق ما سيقوله قارئ الشاشة (\"الاسم، حقل نص، مطلوب\") عبر تركيب الكلام في المتصفح بصوت عربي أو إنجليزي حسب lang العنصر؛ زر تشغيل الصفحة يقرأ الصفوف المعروضة من الأعلى إلى الأسفل مع إبراز كل عنصر في الصفحة، مع شريط سرعة من 0.8 إلى 2×. التشغيل محدود النطاق: مربع التصفية و«المشاكل فقط» يحددان الصفوف التي تُنطق (تلميح زر التشغيل يقول «تشغيل n صف»)، ولكل صف زرا «التشغيل من هنا» (من هذا الصف إلى النهاية) و«تشغيل هذا القسم» (هذا الصف والصفوف المتداخلة تحته — بطاقة أو تنقّل أو نموذج)، وزر «التشغيل من عنصر» يتيح النقر على عنصر في الصفحة ليبدأ التشغيل من صفّه، وأثناء التشغيل تُوقف المسافة مؤقتاً/تستأنف وEsc يوقف؛ وإدخالات سجل المناطق الحية تُنطق مع بادئة الأولوية. مقارنة النسختين: أدخل رابط النسخة باللغة الأخرى (يُخمَّن من /ar/ ↔ /en/ أو ?lang= أو بادئة المضيف ar./en.) واضغط «قارن» فتُحمَّل في تبويب مخفي وتُعرض الفروق بين شجرتي إمكانية الوصول — عناصر تحكم موجودة في لغة واحدة فقط، عناصر أو معالم مسمّاة في جهة وبلا اسم في الأخرى، مناطق حية غائبة في جهة، عدد العناوين لكل مستوى، وlang/dir في كل جهة — مع الإصلاحات، وعدد الفروق في الدرجة والتصدير.",
    benefit: "معظم أخطاء قارئ الشاشة مشاكل تسمية وتسلسل حالات لا تكشفها لقطة DOM. تحوّل هذه الفحوص سؤال \"هل أُعلن؟\" من اختبار ذاكرة إلى دليل قابل للنقر، يُضاف مباشرة إلى نتائج الاختبار اليدوي والتصدير.",
    example: "تبدأ مراقبة المناطق الحية، ترسل نموذجاً فارغاً، فيُظهر السجل نص الخطأ الأحمر كـ\"صامت\". الإصلاح إضافة role=\"alert\" واحد على الحاوية — تتحقق بإعادة الإرسال ورؤية \"مُعلَن [assertive]\".",
  },
  "Keyboard shortcuts & options": {
    title: "اختصارات لوحة المفاتيح والإعدادات",
    what: "في اللوحة: S أو Ctrl/⌘+Enter لتشغيل تدقيق التبويب النشط (نظرة عامة: التدقيق الكامل)، R تسجيل/إيقاف المسار، H تظليل الكل، X مسح التظليل، C التباين، E قائمة التصدير، / التركيز على مربع التصفية في التبويب النشط، I تبديل «المشاكل فقط» في تبويب قارئ الشاشة، Esc إغلاق القوائم، 1–6 تبديل التبويبات (نظرة عامة، الفحص الآلي، نظام التصميم، اليدوية، قارئ الشاشة، مساعدة). أثناء تشغيل «اسمعه» في تبويب قارئ الشاشة: مسافة للإيقاف المؤقت/الاستئناف (يبقى الصف الحالي مُبرزاً)، وEsc للإيقاف. خانة \"قواعد قارئ الشاشة\" تضيف قواعد axe التجريبية الخاصة بقارئ الشاشة. صفحة الإعدادات (زر الفأرة الأيمن على أيقونة الإضافة ← Options) تضبط مستوى WCAG الافتراضي وإطار عمل المقتطفات وفاصل فحص المسار واللغة.",
    benefit: "استخدام يومي أسرع، وافتراضيات تناسب طريقة عمل فريقك.",
    example: "اختر العربية في الإعدادات فتنقلب اللوحة إلى RTL بمحتوى مترجم بالكامل.",
  },
  "WCAG 3.0 readiness": {
    title: "الجاهزية لـ WCAG 3.0",
    what: "لا يزال WCAG 3.0 («سيلفر») مسودة لدى W3C — لا أداة تستطيع الفحص وفقه شرعياً بعد، وليس في axe-core قواعد WCAG 3 لأن معايير النجاح لم تُعتمد. تتبع A11y Miyar المعايير المستقرة (WCAG 2.0/2.1/2.2 وهي الأساس القانوني عالمياً) وستضيف WCAG 3 عند اعتماده ودعمه في axe-core.",
    benefit: "لن تُفاجأ: كل ما تبلغ عنه الأداة يطابق المعايير التي يعتمدها المدققون والأنظمة اليوم، ومطابقة WCAG 2.2 AA هي الممر المتوقع نحو WCAG 3 — لا شيء تصلحه الآن يضيع.",
    example: "يسأل عميل «هل نحن جاهزون لـ WCAG 3؟». الإجابة الأمينة التي تدعمها الأداة: «WCAG 3 مسودة؛ نطابق WCAG 2.2 AA وهو المطلوب حالياً والأساس الذي يبني عليه WCAG 3».",
  },
  "UAE Design System (DLS) check": {
    title: "فحص نظام التصميم الإماراتي (DLS)",
    what: "نقرة واحدة تدقق الصفحة وفق نظام التصميم الإماراتي (AEGov DLS v3 على designsystem.gov.ae — الإلزامي للجهات الاتحادية): اعتماد مكوّنات aegov-، مجموعة الخطوط (Roboto/Inter للإنجليزية وNoto Kufi Arabic/Alexandria للعربية)، حد الأوزان الخمسة، مطابقة الألوان لرموز حزمة @aegov/design-system الفعلية (115 رمزاً)، متطلبات ثنائية اللغة وRTL، وسم العرض المتجاوب، ومستوى WCAG 2.2 AA الإلزامي عبر الفاحص. يضم شريط أدوات التبويب مربع تصفية (الفحص أو الحكم أو التفاصيل أو المحدد — «N من M» صفاً)، و«تظليل كل الفجوات» لتحديد كل انحراف في الصفحة، ومسح التظليل.",
    benefit: "تحصل فرق الجهات الاتحادية على إجابة فورية: هل الصفحة على نظام التصميم؟ وأين تنحرف؟ — بما فيها الألوان غير الرمزية المستخدمة وأقرب رمز رسمي لكل منها.",
    example: "موقع فرعي لوزارة يسجل 3/8: الخطوط Open Sans بدل Roboto/Inter، والأزرار بلون #1a73e8 (أقرب رمز: techblue-600)، ولا يوجد مبدّل للعربية. التقرير هو قائمة التصحيح للمورّد.",
  },
  "What automation can't do": {
    title: "ما لا تستطيعه الأتمتة",
    what: "قواعد axe-core متحفظة عمداً: لا تبلغ إلا عما يمكن إثبات خطئه، فالإنذارات الكاذبة شبه معدومة.",
    benefit: "يمكنك الوثوق بكل نتيجة آلية — لكن الفحص الآلي النظيف ليس دليلاً على إتاحة الصفحة؛ نحو نصف WCAG يحتاج حكماً بشرياً.",
    example: "alt=\"image123.jpg\" يجتاز الفحص الآلي (السمة موجودة) لكنه يفشل مع مستخدم حقيقي. لهذا وُجد تبويب الاختبارات اليدوية — شغّل الاثنين قبل وصف صفحة بأنها متاحة.",
  },
};

function localizeTest(test) {
  if (lang !== "ar") return test;
  const ar = MANUAL_AR[test.id];
  if (!ar) return test;
  return {
    ...test,
    title: ar.title || test.title,
    why: ar.why || test.why,
    helper: test.helper ? { ...test.helper, label: ar.helperLabel || test.helper.label } : undefined,
    questions: test.questions.map((q, i) =>
      ar.questions && ar.questions[i]
        ? { q: ar.questions[i][0], finding: ar.questions[i][1] }
        : q
    ),
  };
}

function localizeTopic(topic) {
  if (lang !== "ar") return topic;
  const ar = HELP_AR[topic.title];
  if (!ar) return topic;
  return { ...topic, title: ar.title, what: ar.what, benefit: ar.benefit, example: ar.example };
}

/* ---------------- UAE Design System (DLS) check ---------------- */

const DLS_STR = {
  en: {
    title: "UAE Design System check (heuristic — based on @aegov/design-system v3 conventions)",
    running: "Running DLS check…",
    adoption: "DLS adoption", typography: "Typography", weights: "Font weights",
    colors: "Color tokens", bilingual: "Language & RTL", viewport: "Viewport meta",
    components: "DLS components", wcag: "WCAG 2.2 AA",
    notAdopted: "No aegov- classes found — this page does not appear to use the UAE Design System.",
    adopted: (n, d) => `${n} aegov- class usages (${d} distinct), e.g. `,
    fontsOk: "Body and headings use the DLS font set.",
    fontsBad: (exp) => `Expected ${exp} — found: `,
    weightsOk: (n) => `${n} distinct weights (DLS limit: 5).`,
    weightsBad: (n) => `${n} distinct font weights in use — DLS limits to 5.`,
    colorsOk: (p) => `${p}% of sampled colors match DLS tokens.`,
    colorsBad: (p) => `Only ${p}% of sampled colors match DLS tokens. Top non-token colors: `,
    langMissing: "html has no lang attribute — required for FGE sites (bilingual EN/AR).",
    rtlBad: "Page language is Arabic but dir is not rtl.",
    noSwitcher: "No language switcher detected (EN ⇄ AR is expected on FGE sites).",
    bilingualOk: (l) => `lang="${l}", direction correct` ,
    switcherFound: ", language switcher present.",
    viewportOk: "Responsive viewport meta present.",
    viewportBad: "Missing <meta name=\"viewport\"> — DLS layouts are responsive-first.",
    componentsInfo: (w, t) => `${w}/${t} form controls are inside DLS components.`,
    wcagHint: "DLS mandates WCAG 2.2 AA — run ▶ Scan with the WCAG 2.2 AA rule set for this part.",
    wcagDone: (n) => `Last scan (WCAG 2.2 AA): ${n} violating element(s).`,
    score: (p, t) => `Result: ${p}/${t} checks passed`,
    catalog: "Component catalog", buttons: "Button sizing",
    bodyText: "Body text", headingScale: "Heading scale", displayH1: "Display heading",
    bodyOk: (n) => `${n} text blocks sampled — all ≥16px with line-height ≥1.5.`,
    bodyBad: (s, t) => (s.length ? `${s.length} block(s) below the 16px minimum. ` : "") + (t.length ? `${t.length} block(s) with line-height below 1.5.` : ""),
    scaleOk: "All headings sit on the DLS type scale (76/62/48/40/32/26/20px).",
    scaleBad: (n) => `${n} heading(s) off the DLS type scale (76/62/48/40/32/26/20px).`,
    displayBad: (n) => `${n} display-size heading(s) not using the mandatory extra-light (200) weight.`,
    catalogFound: (found, known) => `${found.length} of ${known} DLS components in use: ${found.map((c) => c.replace("aegov-", "")).join(", ")}`,
    catalogNone: "No DLS components detected.",
    btnOk: (n) => `All ${n} aegov-btn elements match the DLS height spec (32/40/48/52px).`,
    btnBad: (n, off) => `${off.length} of ${n} buttons are off-spec (expected 32/40/48/52px): ` + off.map((o) => o.height + "px").join(", "),
    exportHtml: "HTML", exportPdf: "PDF",
    compChecks: (p, w, f) => `Component checks — ${p} pass · ${w} warn · ${f} fail`,
    compNA: (n) => `${n} component(s) not present on this page (hidden)`,
    affected: "Affected elements:",
    fixLabel: "Suggested fix:",
    screenshotNote: "Viewport screenshot with DLS gaps outlined (gold dashed):",
    scanShotNote: "Viewport screenshot with violations outlined (color-coded by severity):",
    gapsShown: (n) => `${n} DLS gap(s) outlined on the page (gold dashed) — ✕ Clear highlights removes them.`,
    reportTitle: "UAE Design System conformance report",
  },
  ar: {
    title: "فحص نظام التصميم الإماراتي (استدلالي — وفق اصطلاحات \u2066@aegov/design-system v3\u2069)",
    running: "جارٍ فحص نظام التصميم…",
    adoption: "اعتماد النظام", typography: "الخطوط", weights: "أوزان الخط",
    colors: "ألوان الرموز", bilingual: "اللغة والاتجاه", viewport: "وسم العرض",
    components: "مكوّنات النظام", wcag: "WCAG 2.2 AA",
    notAdopted: "لم يُعثر على أصناف \u2066aegov-\u2069 — لا يبدو أن الصفحة تستخدم نظام التصميم الإماراتي.",
    adopted: (n, d) => `${n} استخداماً لأصناف \u2066aegov-\u2069 (${d} صنفاً مميزاً)، مثل `,
    fontsOk: "النص والعناوين يستخدمان خطوط النظام.",
    fontsBad: (exp) => `المتوقع ${exp} — وُجد: `,
    weightsOk: (n) => `${n} أوزان مميزة (حد النظام: 5).`,
    weightsBad: (n) => `${n} وزن خط مستخدم — يحدّ النظام بخمسة.`,
    colorsOk: (p) => `${p}% من الألوان المفحوصة تطابق رموز النظام.`,
    colorsBad: (p) => `فقط ${p}% من الألوان تطابق رموز النظام. أبرز الألوان غير الرمزية: `,
    langMissing: "لا توجد سمة lang على html — مطلوبة لمواقع الجهات الاتحادية (ثنائية اللغة).",
    rtlBad: "لغة الصفحة عربية لكن الاتجاه ليس rtl.",
    noSwitcher: "لم يُرصد مبدّل لغة (يُتوقع EN ⇄ AR في مواقع الجهات الاتحادية).",
    bilingualOk: (l) => `lang="${l}" والاتجاه صحيح`,
    switcherFound: "، ومبدّل اللغة موجود.",
    viewportOk: "وسم العرض المتجاوب موجود.",
    viewportBad: "وسم \u2066<meta name=\"viewport\">\u2069 مفقود — تخطيطات النظام متجاوبة أولاً.",
    componentsInfo: (w, t) => `${w}/${t} من عناصر النماذج داخل مكوّنات النظام.`,
    wcagHint: "يلزم النظام بمطابقة WCAG 2.2 AA — شغّل ▶ الفحص بمجموعة قواعد WCAG 2.2 AA لهذا الجزء.",
    wcagDone: (n) => `آخر فحص (WCAG 2.2 AA): ${n} عنصراً مخالفاً.`,
    score: (p, t) => `النتيجة: نجاح ${p} من ${t} فحوصات`,
    catalog: "كتالوج المكوّنات", buttons: "مقاسات الأزرار",
    bodyText: "نص المحتوى", headingScale: "مقياس العناوين", displayH1: "عنوان العرض",
    bodyOk: (n) => `تم فحص ${n} فقرة — كلها ≥16 بكسل وتباعد أسطر ≥1.5.`,
    bodyBad: (s, t) => (s.length ? `${s.length} فقرة دون الحد الأدنى 16 بكسل. ` : "") + (t.length ? `${t.length} فقرة بتباعد أسطر أقل من 1.5.` : ""),
    scaleOk: "جميع العناوين على مقياس النظام (76/62/48/40/32/26/20 بكسل).",
    scaleBad: (n) => `${n} عنواناً خارج مقياس النظام (76/62/48/40/32/26/20 بكسل).`,
    displayBad: (n) => `${n} عنوان عرض لا يستخدم الوزن الإلزامي فائق الخفة (200).`,
    catalogFound: (found, known) => `${found.length} من ${known} مكوّناً مستخدماً: ${found.map((c) => c.replace("aegov-", "")).join("، ")}`,
    catalogNone: "لم تُرصد مكوّنات النظام.",
    btnOk: (n) => `جميع أزرار aegov-btn (${n}) تطابق مواصفة الارتفاع (32/40/48/52 بكسل).`,
    btnBad: (n, off) => `${off.length} من ${n} زراً خارج المواصفة (المتوقع 32/40/48/52 بكسل): ` + off.map((o) => o.height + "px").join("، "),
    exportHtml: "HTML", exportPdf: "PDF",
    compChecks: (p, w, f) => `فحوصات المكوّنات — ${p} ناجح · ${w} تحذير · ${f} فاشل`,
    compNA: (n) => `${n} مكوّناً غير موجود في هذه الصفحة (مخفي)`,
    affected: "العناصر المتأثرة:",
    fixLabel: "الإصلاح المقترح:",
    screenshotNote: "لقطة شاشة لمنطقة العرض مع تحديد الفجوات (إطار ذهبي متقطع):",
    scanShotNote: "لقطة شاشة لمنطقة العرض مع تحديد المخالفات (ملونة حسب الخطورة):",
    gapsShown: (n) => `تم تحديد ${n} فجوة على الصفحة (إطار ذهبي متقطع) — «✕ مسح التظليل» يزيلها.`,
    reportTitle: "تقرير مطابقة نظام التصميم الإماراتي",
  },
};
const dt = (key, ...args) => {
  const v = (DLS_STR[lang] || DLS_STR.en)[key] ?? DLS_STR.en[key];
  return typeof v === "function" ? v(...args) : v;
};

const dlsBtn = document.getElementById("dlsBtn");
const dlsReportEl = document.getElementById("dlsReport");
dlsBtn.addEventListener("click", runDlsCheck);

let dlsInFlight = false;
async function runDlsCheck() {
  if (dlsInFlight) return;
  dlsInFlight = true;
  statusBusy(dt("running"));
  dlsBtn.disabled = true;
  setRunBusy(true);
  ovRunning.add("dls");
  renderOverview();
  try {
    const r = await bg("dlsCheck");
    lastRunAt = Date.now();
    ovRunning.delete("dls");
    renderDlsReport(r);
    updateExportVisibility();
    try {
      renderDlsComponents(await bg("dlsComponents"));
    } catch (_) {}
    statusEl.textContent = dlsScoreLine.textContent; // keep the status bar populated (no layout jump)
  } catch (err) {
    statusEl.textContent = t("dlsFailed") + (err?.message || err);
  } finally {
    dlsInFlight = false;
    dlsBtn.disabled = false;
    ovRunning.delete("dls");
    setRunBusy(false);
    renderOverview();
  }
}

function dlsRow(verdict, label, detailNodes, elements, fix, doc) {
  const row = document.createElement("div");
  row.className = "dls-row";
  row.dataset.label = label;
  row.dataset.verdict = verdict;
  const v = document.createElement("span");
  v.className = "dls-verdict " + verdict;
  v.textContent = dlsVerdictMark(verdict);
  const l = document.createElement("span");
  l.className = "dls-label";
  l.textContent = label;
  if (doc) {
    const a = document.createElement("a");
    a.href = doc;
    a.target = "_blank";
    a.textContent = " ↗";
    a.title = doc;
    a.style.textDecoration = "none";
    l.appendChild(a);
  }
  const d = document.createElement("span");
  d.className = "dls-detail";
  for (const n of detailNodes) d.append(n);
  const more = [];
  if (elements && elements.length) {
    const list = document.createElement("div");
    list.className = "dls-els";
    const cap = document.createElement("div");
    cap.textContent = dt("affected");
    cap.style.fontWeight = "600";
    list.appendChild(cap);
    for (const e of elements) {
      const item = document.createElement("div");
      const code = document.createElement("code");
      code.textContent = e.sel;
      code.title = t("clickToHighlight");
      code.style.cursor = "pointer";
      code.addEventListener("click", () => highlight([e.sel]));
      item.append(code, " — " + e.info);
      list.appendChild(item);
    }
    more.push(list);
  }
  if (fix) {
    const fx = document.createElement("div");
    fx.className = "dls-fix";
    const cap = document.createElement("span");
    cap.textContent = dt("fixLabel");
    cap.style.fontWeight = "600";
    const code = document.createElement("code");
    code.textContent = fix;
    fx.append(cap, code);
    more.push(fx);
  }
  if (more.length) d.appendChild(fixMore(more));
  row.append(v, l, d);
  return row;
}

// Affected elements + suggested fix collapsed behind a "Show fix" summary.
function fixMore(children, open = false) {
  const det = document.createElement("details");
  det.className = "fix-more";
  det.open = open;
  const sum = document.createElement("summary");
  setLabel(sum, "i-wand", t("showFix"), { trailing: svgIcon("i-chevron") });
  det.append(sum, ...children);
  return det;
}

function swatch(hex) {
  const s = document.createElement("span");
  s.className = "dls-swatch";
  s.style.background = hex;
  return s;
}

const DLS_DOCS = {
  adoption: "https://designsystem.gov.ae/docs/installation",
  typography: "https://designsystem.gov.ae/guidelines/typography",
  weights: "https://designsystem.gov.ae/guidelines/typography",
  colors: "https://designsystem.gov.ae/insights/how-to-use-design-tokens-with-the-uae-design-system",
  bilingual: "https://designsystem.gov.ae/guidelines",
  viewport: "https://designsystem.gov.ae/guidelines",
  components: "https://designsystem.gov.ae/docs/components",
  catalog: "https://designsystem.gov.ae/docs/components",
  buttons: "https://designsystem.gov.ae/docs/components/button",
  bodyText: "https://designsystem.gov.ae/guidelines/typography",
  headingScale: "https://designsystem.gov.ae/guidelines/typography",
  displayH1: "https://designsystem.gov.ae/guidelines/typography",
  wcag: "https://www.w3.org/WAI/WCAG22/quickref/",
};

function dlsDocFor(label) {
  for (const key of Object.keys(DLS_DOCS)) {
    if (dt(key) === label) return DLS_DOCS[key];
  }
  return null;
}

function renderDlsReport(r) {
  dlsReportEl.hidden = false;
  dlsReportEl.textContent = "";
  lastDlsComponents = null;
  const h = document.createElement("h2");
  setLabel(h, "i-layout", dt("title"));
  dlsReportEl.appendChild(h);

  const rows = [];

  // 1. adoption
  if (r.aegovCount > 0) {
    const code = document.createElement("code");
    code.textContent = r.aegovClasses.slice(0, 4).map(([c]) => c).join(", ");
    rows.push(["pass", dt("adoption"), [dt("adopted", r.aegovCount, r.aegovClasses.length), code]]);
  } else {
    rows.push(["fail", dt("adoption"), [dt("notAdopted")], null,
      'npm i @aegov/design-system\n\n/* app.css */\n@import "tailwindcss";\n@plugin "@aegov/design-system";']);
  }

  // 2. typography
  const expStr = `${r.expectedFonts.body[0]} / ${r.expectedFonts.heading[0]}`;
  if (r.bodyFontOk && r.headingFontOk) {
    rows.push(["pass", dt("typography"), [dt("fontsOk")]]);
  } else {
    const code = document.createElement("code");
    code.textContent = [r.bodyFont.split(",")[0], ...r.headingFonts].slice(0, 3).join(", ");
    const fontFix = r.expectedFonts.body[0] === "roboto"
      ? 'body { font-family: "Roboto", sans-serif; }\nh1, h2, h3, h4 { font-family: "Inter", sans-serif; }'
      : 'body { font-family: "Noto Kufi Arabic", sans-serif; }\nh1, h2, h3, h4 { font-family: "Alexandria", sans-serif; }';
    rows.push(["fail", dt("typography"), [dt("fontsBad", expStr), code],
      (r.fontOffenders || []).map((o) => ({ sel: o.sel, info: `<${o.tag}> "${o.text}" — ${o.font}` })),
      fontFix + "\n/* Fonts are on Google Fonts — or use the DLS utilities font-body / font-heading */"]);
  }

  // 3. weights
  const wN = r.fontWeights.length;
  rows.push([wN <= 5 ? "pass" : "warn", dt("weights"),
    [wN <= 5 ? dt("weightsOk", wN) : dt("weightsBad", wN)], null,
    wN <= 5 ? null : "/* Consolidate to the 5 DLS weights, e.g. 300 / 400 / 500 / 700 / 800.\n   Found: " + r.fontWeights.join(", ") + " */"]);

  // 3b. guideline typography: body min size + line-height
  if (r.bodySampled > 0) {
    const s = r.smallBody || [], tl = r.tightLines || [];
    if (!s.length && !tl.length) {
      rows.push(["pass", dt("bodyText"), [dt("bodyOk", r.bodySampled)]]);
    } else {
      rows.push(["warn", dt("bodyText"), [dt("bodyBad", s, tl)],
        [...s.map((o) => ({ sel: o.sel, info: o.px + "px" })),
         ...tl.map((o) => ({ sel: o.sel, info: "line-height " + o.ratio }))],
        "font-size: 1rem; /* ≥16px */\nline-height: 1.5;"]);
    }
  }

  // 3c. heading scale + display weight (desktop viewports only)
  if (r.headingOffScale && r.headingOffScale.length) {
    rows.push(["warn", dt("headingScale"), [dt("scaleBad", r.headingOffScale.length)],
      r.headingOffScale.map((o) => ({ sel: o.sel, info: `<${o.tag}> ${o.px}px` })),
      "/* Use the DLS type scale classes */\n<h2 class=\"text-h2\">…  /* 76/62/48/40/32/26/20px */"]);
  } else if (r.headingOffScale) {
    rows.push(["pass", dt("headingScale"), [dt("scaleOk")]]);
  }
  if (r.displayWeightBad && r.displayWeightBad.length) {
    rows.push(["fail", dt("displayH1"), [dt("displayBad", r.displayWeightBad.length)],
      r.displayWeightBad.map((o) => ({ sel: o.sel, info: `${o.px}px, weight ${o.weight}` })),
      "font-weight: 200; /* Display size must be extra light, and only in banners covering ≥60% of the viewport */"]);
  }

  // 4. colors
  if (r.colorsSampled > 0) {
    const pct = Math.round((r.colorsInPalette / r.colorsSampled) * 100);
    if (pct >= 70) {
      rows.push(["pass", dt("colors"), [dt("colorsOk", pct)]]);
    } else {
      const detail = [dt("colorsBad", pct)];
      for (const o of r.offenders.slice(0, 4)) {
        detail.push(swatch(o.hex));
        const code = document.createElement("code");
        code.textContent = `${o.hex} (→ ${o.nearestToken})`;
        detail.push(code, " ");
      }
      rows.push([pct >= 40 ? "warn" : "fail", dt("colors"), detail,
        r.offenders.flatMap((o) => (o.sels || []).slice(0, 2).map((sel) => ({ sel, info: `${o.hex} → ${o.nearestToken}` }))),
        r.offenders.slice(0, 3).map((o) =>
          `color: var(--color-${o.nearestToken}); /* was ${o.hex} — token ${o.nearestHex} */`).join("\n")]);
    }
  }

  // 5. bilingual / RTL
  const switcherFix = '<a href="/ar" hreflang="ar" lang="ar">العربية</a> / <a href="/en" hreflang="en">English</a>';
  if (!r.lang) {
    rows.push(["fail", dt("bilingual"), [dt("langMissing")], null,
      '<html lang="en">  <!-- or: -->  <html lang="ar" dir="rtl">']);
  } else if (r.lang.toLowerCase().startsWith("ar") && r.dir !== "rtl") {
    rows.push(["fail", dt("bilingual"), [dt("rtlBad")], null, '<html lang="ar" dir="rtl">']);
  } else if (!r.langSwitcher) {
    rows.push(["warn", dt("bilingual"), [dt("bilingualOk", r.lang) + ". " + dt("noSwitcher")], null, switcherFix]);
  } else {
    rows.push(["pass", dt("bilingual"), [dt("bilingualOk", r.lang) + dt("switcherFound")]]);
  }

  // 6. viewport
  rows.push([r.viewport ? "pass" : "fail", dt("viewport"),
    [r.viewport ? dt("viewportOk") : dt("viewportBad")], null,
    r.viewport ? null : '<meta name="viewport" content="width=device-width, initial-scale=1">']);

  // 7. components (informational when adopted)
  if (r.aegovCount > 0 && r.controls > 0) {
    const ratio = r.controlsWithAegov / r.controls;
    rows.push([ratio >= 0.8 ? "pass" : "warn", dt("components"),
      [dt("componentsInfo", r.controlsWithAegov, r.controls)],
      (r.rawControls || []).map((o) => ({ sel: o.sel, info: o.tag })),
      ratio >= 0.8 ? null : '<button class="aegov-btn">…</button>\n<div class="aegov-form-control"><label for="x">…</label><input id="x"></div>']);
  }

  // 7b. component catalog + button sizing (when adopted)
  if (r.aegovCount > 0) {
    if (r.componentsFound && r.componentsFound.length) {
      rows.push(["pass", dt("catalog"), [dt("catalogFound", r.componentsFound, r.componentsKnown)]]);
    } else {
      rows.push(["warn", dt("catalog"), [dt("catalogNone")]]);
    }
    if (r.buttons > 0) {
      rows.push([r.buttonsOffSpec.length === 0 ? "pass" : "warn", dt("buttons"),
        [r.buttonsOffSpec.length === 0 ? dt("btnOk", r.buttons) : dt("btnBad", r.buttons, r.buttonsOffSpec)],
        r.buttonsOffSpec.map((o) => ({ sel: o.sel, info: `"${o.text}" — ${o.height}px` })),
        r.buttonsOffSpec.length === 0 ? null :
          '/* Remove custom heights; use the size variants */\n<button class="aegov-btn btn-xs|btn-sm|btn-base|btn-lg">…</button>']);
    }
  }

  // 8. WCAG tie-in
  if (lastReport && (settings.level === "wcag22aa" || lastReport.ruleSet.includes("2.2"))) {
    const total = lastReport.violations.reduce((a, v) => a + v.nodeTotal, 0);
    rows.push([total === 0 ? "pass" : "fail", dt("wcag"), [dt("wcagDone", total)]]);
  } else {
    rows.push(["warn", dt("wcag"), [dt("wcagHint")]]);
  }

  let passed = 0;
  for (const [verdict, label, detail, elements, fix] of rows) {
    if (verdict === "pass") passed++;
    dlsReportEl.appendChild(dlsRow(verdict, label, detail, elements, fix, dlsDocFor(label)));
  }
  dlsEmpty.hidden = true;
  dlsToolsVisible(true);
  dlsScoreLine.textContent = dt("score", passed, rows.length);
  dlsScoreLine.className = "score-line " + dlsVerdictOf(passed, rows.length);

  // keep a plain-text copy for exports
  lastDlsExport = {
    scannedAt: new Date().toISOString(),
    score: { passed, total: rows.length },
    rows: rows.map((rw, i) => {
      const rowEl = dlsReportEl.querySelectorAll(".dls-row")[i];
      const detailEl = rowEl && rowEl.querySelector(".dls-detail");
      let detailText = "";
      if (detailEl) {
        const clone = detailEl.cloneNode(true);
        for (const m of clone.querySelectorAll("details.fix-more")) m.remove();
        detailText = clone.textContent;
      }
      return { verdict: rw[0], label: rw[1], detail: detailText, elements: rw[3] || [], fix: rw[4] || null, doc: dlsDocFor(rw[1]) };
    }),
  };

  const actions = document.createElement("div");
  actions.className = "btn-row";
  const htmlBtn = document.createElement("button");
  htmlBtn.className = "btn";
  setLabel(htmlBtn, "i-file", dt("exportHtml"));
  htmlBtn.addEventListener("click", () => exportDls("html"));
  const pdfBtn = document.createElement("button");
  pdfBtn.className = "btn";
  setLabel(pdfBtn, "i-file", dt("exportPdf"));
  pdfBtn.addEventListener("click", () => exportDls("pdf"));
  actions.append(htmlBtn, pdfBtn);
  dlsReportEl.appendChild(actions);
  applyDlsFilter();
  const fails = rows.filter((rw) => rw[0] === "fail").length;
  setTabBadge("dls", String(fails), fails ? "critical" : "ok");
  renderOverview();
}

let lastDlsExport = null;
let lastDlsComponents = null;

function renderDlsComponents(rows) {
  lastDlsComponents = rows;
  const active = rows.filter((r) => r.status !== "na");
  const na = rows.length - active.length;
  const p = active.filter((r) => r.status === "pass").length;
  const w = active.filter((r) => r.status === "warn").length;
  const f = active.filter((r) => r.status === "fail").length;

  const det = document.createElement("details");
  det.className = "dls-comp";
  det.open = f + w > 0;
  const sum = document.createElement("summary");
  sum.className = "section-summary";
  setLabel(sum, "i-layout", dt("compChecks", p, w, f), { trailing: svgIcon("i-chevron") });
  det.appendChild(sum);

  const order = { fail: 0, warn: 1, pass: 2 };
  for (const r of active.sort((a, b) => order[a.status] - order[b.status])) {
    const row = document.createElement("div");
    row.className = "dls-row";
    row.dataset.verdict = r.status === "pass" ? "pass" : r.status === "warn" ? "warn" : "fail";
    row.dataset.label = r.component;
    const v = document.createElement("span");
    v.className = "dls-verdict " + row.dataset.verdict;
    v.textContent = dlsVerdictMark(row.dataset.verdict);
    const l = document.createElement("span");
    l.className = "dls-label";
    l.textContent = r.component;
    const d = document.createElement("span");
    d.className = "dls-detail";
    d.append(r.check + (r.count ? ` (${r.count})` : "") + " — " + r.issue);
    if (r.sels && r.sels.length) {
      const list = document.createElement("div");
      list.className = "dls-els";
      for (const sel of r.sels) {
        const item = document.createElement("div");
        const code = document.createElement("code");
        code.textContent = sel;
        code.title = t("clickToHighlight");
        code.style.cursor = "pointer";
        code.addEventListener("click", () => highlight([sel]));
        item.appendChild(code);
        list.appendChild(item);
      }
      d.appendChild(fixMore([list]));
    }
    row.append(v, l, d);
    det.appendChild(row);
  }
  if (na > 0) {
    const note = document.createElement("div");
    note.className = "dls-row";
    note.style.opacity = "0.6";
    note.textContent = dt("compNA", na);
    det.appendChild(note);
  }
  dlsReportEl.appendChild(det);
  applyDlsFilter();
}

function dlsSectionHtml(dlsShot) {
  if (!lastDlsExport) return "";
  const dlsShotHtml = dlsShot ? `
  <h3 style="margin-top:16px">${escHtml(dt("screenshotNote"))}</h3>
  <img src="${dlsShot}" style="max-width:100%;border:1px solid #ddd;border-radius:6px">` : "";
  const color = { pass: "#2e7d32", warn: "#b68a35", fail: "#d32f2f" };
  const mark = { pass: "✓ PASS", warn: "△ WARN", fail: "✗ FAIL" };
  const rows = lastDlsExport.rows.map((r) => `
    <tr>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-weight:700;white-space:nowrap;vertical-align:top;color:${color[r.verdict]}">${mark[r.verdict]}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee;font-weight:600;white-space:nowrap;vertical-align:top">${
        r.doc ? `<a href="${escHtml(r.doc)}" style="color:inherit">${escHtml(r.label)} ↗</a>` : escHtml(r.label)}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #eee">${escHtml(r.detail)}${
        r.elements && r.elements.length ? `<div style="margin-top:4px">${r.elements.map((e) =>
          `<div><code style="background:#f4f0e8;border-radius:3px;padding:0 4px;font-size:12px">${escHtml(e.sel)}</code> <span style="color:#777">${escHtml(e.info)}</span></div>`).join("")}</div>` : ""
      }${r.fix ? `<div style="border-left:4px solid #2e7d32;background:#f2f8f2;border-radius:4px;padding:5px 8px;margin-top:5px">
          <div style="color:#2e7d32;font-weight:700;font-size:11px">${escHtml(dt("fixLabel"))}</div>
          <code style="display:block;white-space:pre-wrap;word-break:break-all;font-size:12px">${escHtml(r.fix)}</code></div>` : ""}</td>
    </tr>`).join("");
  const compRows = (lastDlsComponents || []).filter((r) => r.status !== "na");
  const compHtml = !compRows.length ? "" : `
  <h3 style="margin-top:18px">Component checks</h3>
  <table style="border-collapse:collapse;width:100%;font-size:13px">
    ${compRows.map((r) => `
    <tr>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:700;white-space:nowrap;color:${
        r.status === "pass" ? "#2e7d32" : r.status === "warn" ? "#b68a35" : "#d32f2f"}">${
        r.status === "pass" ? "✓ PASS" : r.status === "warn" ? "△ WARN" : "✗ FAIL"}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee;font-weight:600;white-space:nowrap">${escHtml(r.component)}</td>
      <td style="padding:4px 8px;border-bottom:1px solid #eee">${escHtml(r.check)}${r.count ? " (" + r.count + ")" : ""} — ${escHtml(r.issue)}${
        r.sels && r.sels.length ? `<div>${r.sels.map((s) => `<code style="background:#f4f0e8;border-radius:3px;padding:0 4px;font-size:11px">${escHtml(s)}</code>`).join(" ")}</div>` : ""}</td>
    </tr>`).join("")}
  </table>`;
  return `
  <h2 style="font-size:18px;margin-top:30px;border-top:4px solid #b68a35;padding-top:12px">🇦🇪 ${escHtml(dt("reportTitle"))}
    <small style="color:#888">— ${lastDlsExport.score.passed}/${lastDlsExport.score.total}</small></h2>
  <table style="border-collapse:collapse;width:100%">${rows}</table>
  ${compHtml}
  ${dlsShotHtml}
  <p style="color:#999;font-size:12px">Heuristic check based on @aegov/design-system v3 conventions (designsystem.gov.ae). Not an official TDRA certification.</p>`;
}

async function exportDls(format) {
  if (!lastDlsExport) return;
  const url = await getPageUrl();
  let shot = null;
  try {
    await bg("dlsHighlight");
    await new Promise((r) => setTimeout(r, 400));
    shot = await bg("captureTab");
  } catch (_) { /* capture unavailable (e.g. Firefox permission) — export without it */ }
  const shotHtml = shot
    ? `<h3 style="margin-top:24px">${escHtml(dt("screenshotNote"))}</h3>
       <img src="${shot}" style="max-width:100%;border:1px solid #ddd;border-radius:6px">`
    : "";
  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="color-scheme" content="light"><base target="_blank"><title>${escHtml(dt("reportTitle"))}</title></head>
<body style="font:14px/1.6 system-ui,sans-serif;max-width:900px;margin:30px auto;padding:0 16px;background:#fff;color:#1a1a1a">
  <p><b>${escHtml(url)}</b><br>${escHtml(lastDlsExport.scannedAt)}</p>
  ${dlsSectionHtml()}
  ${shotHtml}
  ${format === "pdf" ? "<script>addEventListener('load',()=>setTimeout(()=>print(),400))<\/script>" : ""}
</body></html>`;
  if (format === "pdf") {
    window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })));
  } else {
    download("a11y-miyar-dls-" + safeName(url) + ".html", "text/html", html);
  }
}

/* ---------------- screen reader tab ---------------- */

const srView = document.getElementById("srView");
const srOrderList = document.getElementById("srOrderList");
const srLiveLog = document.getElementById("srLiveLog");
const srLiveRegions = document.getElementById("srLiveRegions");
const srFocusLog = document.getElementById("srFocusLog");
const srLangList = document.getElementById("srLangList");
const srAxList = document.getElementById("srAxList");
const srBuildBtn = document.getElementById("srBuildBtn");
const srIssuesOnly = document.getElementById("srIssuesOnly");
const srAddFindingsBtn = document.getElementById("srAddFindingsBtn");
const srLiveBtn = document.getElementById("srLiveBtn");
const srFocusBtn = document.getElementById("srFocusBtn");
const srFocusIssuesOnly = document.getElementById("srFocusIssuesOnly");
const srWalkBtn = document.getElementById("srWalkBtn");
const srWalkSummary = document.getElementById("srWalkSummary");
const srLangBtn = document.getElementById("srLangBtn");
const srNtcBtn = document.getElementById("srNtcBtn");
const srNtcList = document.getElementById("srNtcList");
const srReflowBtn = document.getElementById("srReflowBtn");
const srReflowList = document.getElementById("srReflowList");
const srReflowStats = document.getElementById("srReflowStats");
const srReflowShots = document.getElementById("srReflowShots");
let srDebuggerAvailable = true; // Chromium: chrome.debugger exists (the permission itself may still need granting); false on Firefox
const srCmpUrl = document.getElementById("srCmpUrl");
const srCmpBtn = document.getElementById("srCmpBtn");
const srCmpList = document.getElementById("srCmpList");
const srCmpStats = document.getElementById("srCmpStats");
const srAxBtn = document.getElementById("srAxBtn");
const srScoreCard = document.getElementById("srScoreCard");
const srPlayBtn = document.getElementById("srPlayBtn");
const srPlayPickBtn = document.getElementById("srPlayPickBtn");
const srPlayBar = document.getElementById("srPlayBar");
const srBarPause = document.getElementById("srBarPause");
const srBarStop = document.getElementById("srBarStop");
const srBarText = document.getElementById("srBarText");
const srBarCount = document.getElementById("srBarCount");
const srRateInput = document.getElementById("srRate");
const srRateVal = document.getElementById("srRateVal");
const srJourneySection = document.getElementById("srJourneySection");
const srJourneyList = document.getElementById("srJourneyList");
const srJourneyCopyBtn = document.getElementById("srJourneyCopyBtn");
const srJourneyStats = document.getElementById("srJourneyStats");

/* ---- step list (eight numbered sections) ----
   srSetStep(key, state, n) drives the li[data-state] + circle + state text; a step opens when it
   starts running or ends with issues/error, and closes again after a clean auto-opened run. */
const SR_STEP_KEYS = { order: 1, live: 2, focus: 3, lang: 4, ntc: 5, reflow: 6, cmp: 7, ax: 8 };
const SR_STEP_ICONS = { order: "i-list", live: "i-bell", focus: "i-keyboard", lang: "i-globe", ntc: "i-contrast", reflow: "i-reflow", cmp: "i-compare", ax: "i-tree" };
const srStepStates = {}; // key -> { state, n } (re-applied by applySrStrings)
function srStepEl(key) { return srSteps ? srSteps.querySelector(`.step[data-step="${SR_STEP_KEYS[key]}"]`) : null; }
function srSetStep(key, state, n = 0, force = false) {
  const li = srStepEl(key);
  if (!li) return;
  const cur = srStepStates[key];
  if (!force && cur && cur.state === state && cur.n === n && li.dataset.state === state) return; // polled re-renders
  srStepStates[key] = { state, n };
  const prev = li.dataset.state;
  li.dataset.state = state;
  const num = li.querySelector(".step-num");
  const txt = li.querySelector(".step-state");
  if (state === "running") num.replaceChildren(Object.assign(document.createElement("span"), { className: "spin" }));
  else if (state === "done") num.replaceChildren(svgIcon("i-check"));
  else if (state === "issues") num.textContent = String(n);
  else if (state === "error") num.replaceChildren(svgIcon("i-warn"));
  else num.textContent = String(SR_STEP_KEYS[key]);
  txt.textContent = state === "running" ? t("stepRunning") : state === "done" ? t("stepClean") : state === "issues" ? t("stepIssues", n) : state === "error" ? t("stepError") : t("stepIdle");
  const details = li.querySelector("details.sr-section");
  if (state === "running" && prev !== "running") { if (!details.open) { details.open = true; li.dataset.autoOpen = "1"; } }
  else if (state === "issues" || state === "error") { details.open = true; delete li.dataset.autoOpen; }
  else if (state === "done" && li.dataset.autoOpen) { details.open = false; delete li.dataset.autoOpen; }
  else if (state === "idle") delete li.dataset.autoOpen;
}
// Everything after a row's issue lines (selector, grouped selectors, fix blocks) lives in one
// collapsed <details class="sr-more"> per row; its summary counts the fix blocks inside.
function srMore(row, column) {
  let det = row.querySelector(":scope > details.sr-more");
  if (!det) {
    det = document.createElement("details");
    det.className = "sr-more";
    det.style.gridColumn = column || "2";
    det.appendChild(document.createElement("summary"));
    row.appendChild(det);
  }
  return det;
}
function srMoreAdd(row, el, column) {
  const det = srMore(row, column);
  det.appendChild(el);
  const n = det.querySelectorAll(":scope > .sr-fix").length;
  setLabel(det.firstChild, "i-chevron", n ? t("srShowFix", n) : t("srShowDetails"));
  if (row.classList.contains("fixed")) det.open = true;
  return det;
}

// axe ships these disabled (experimental); they target screen-reader / voice-control mismatches.
const SR_EXPERIMENTAL_RULES = ["label-content-name-mismatch", "p-as-heading", "table-fake-caption", "td-has-header", "focus-order-semantics"];

function srRulesOption() {
  if (!srRulesChk.checked) return null;
  const rules = {};
  for (const id of SR_EXPERIMENTAL_RULES) rules[id] = { enabled: true };
  return rules;
}

const srState = {
  order: null,          // { rows, summary, url }
  live: { running: false, poll: null, regions: [], log: [], startedByFlow: false },
  focus: { running: false, poll: null, log: [], startedByFlow: false, walking: false, walk: null },
  lang: null,
  ntc: null,            // non-text contrast: { url, checked, issues }
  reflow: null,         // reflow / zoom test (debugger): { findings, summary, shots: { base, narrow } }
  ax: null,
  cmp: null,            // 🌐↔ bilingual comparison: { url, otherUrl, differences, other: { order, lang } }
  applied: [],          // fixes applied in place: { section, key (selector used), cur (selector now), code }
  journey: null,        // 🎞 transcript of the last flow recording: { steps, gaps, pages, duration }
  url: null,            // page URL the current results belong to (storage key "sr:<url>"); null while unknown / mid-navigation
  restored: null,       // snapshot loaded from storage for this URL: { at, order: summary, score }
};

// Page-side entries carry `at` (wall clock); stamp anything that arrives without it (older
// injected code, stubs) so the journey timeline can still order it.
function srStamp(entries) {
  const now = Date.now();
  for (const e of entries) if (!e.at) e.at = now;
  return entries;
}

const LEVEL_RANK = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const worstLevel = (issues) => issues.reduce((w, i) => (LEVEL_RANK[i.level] < LEVEL_RANK[w] ? i.level : w), "minor");

function srEmpty(container, msg) {
  container.textContent = "";
  const p = document.createElement("p");
  p.className = "sr-empty";
  p.textContent = msg;
  container.appendChild(p);
}

function srCode(sel) {
  const code = document.createElement("code");
  code.textContent = sel;
  code.title = t("srClickHighlight");
  code.addEventListener("click", () => highlight([sel]));
  return code;
}

/* ---- 1. reading order / accessible names ---- */

// Component-level grouping: rows with issues whose markup shape matches (same tag, sorted class
// list, role and set of issue codes — the name may differ) collapse into one finding. Returns
// [{ row, count, sels, component }] in first-occurrence order; rows without issues are excluded.
function srGroupKey(r) {
  return [r.tag || "", r.cls || "", r.role || "", r.issues.map((i) => i.code || i.msg).sort().join(",")].join("|");
}
function srGroupRows(rows) {
  const groups = new Map();
  for (const r of rows) {
    if (!r.issues || !r.issues.length) continue;
    const key = srGroupKey(r);
    let g = groups.get(key);
    if (!g) { g = { row: r, count: 0, sels: [], component: r.component || "" }; groups.set(key, g); }
    g.count++;
    if (r.sel && !g.sels.includes(r.sel)) g.sels.push(r.sel);
  }
  return [...groups.values()];
}
function srGroupLabel(g) {
  return g.component ? `${g.component} · ${g.row.role}` : g.row.role;
}

function renderSrRows(rows, container, issuesOnly) {
  container.textContent = "";
  const section = container === srAxList ? "ax" : "order";
  const groups = srGroupRows(rows);
  const groupOf = new Map();
  for (const g of groups) if (g.count > 1) groupOf.set(g.row, g);
  const byKey = new Map(groups.filter((g) => g.count > 1).map((g) => [srGroupKey(g.row), g]));
  // issues-only: one row per group (first instance) plus rows fixed in place; full reading order: every row, badge on each member
  const firstOf = new Set(groups.map((g) => g.row));
  const shown = issuesOnly ? rows.filter((r) => firstOf.has(r) || srFixedEntries(section, r.sel).length) : rows;
  if (!shown.length) {
    srEmpty(container, issuesOnly ? t("srNoIssues") : t("srNoRows"));
    return;
  }
  const frag = document.createDocumentFragment();
  for (const r of shown.slice(0, 700)) {
    const g = r.issues.length ? (issuesOnly ? groupOf.get(r) : byKey.get(srGroupKey(r))) : null;
    const fixed = srFixedEntries(section, r.sel);
    const row = document.createElement("div");
    row.className = "sr-row" + (r.issues.length ? " has-issue level-" + worstLevel(r.issues) : "") + (g ? " sr-grouped" : "") + (fixed.length ? " fixed" : "");
    row.style.paddingInlineStart = (6 + Math.min(r.depth || 0, 12) * 6) + "px";
    const role = document.createElement("span");
    role.className = "sr-role" + (r.role === "text" ? " text" : "");
    role.textContent = g && g.component ? srGroupLabel(g) : r.role;
    role.title = r.tag ? `<${r.tag}>` : "";
    if (r.sel) role.addEventListener("click", () => highlight([r.sel]));
    if (fixed.length) {
      const ok = document.createElement("span");
      ok.className = "badge-fixed";
      ok.textContent = t("srFixedBadge");
      role.appendChild(ok);
    }
    if (g) {
      const badge = document.createElement("span");
      badge.className = "badge-dup";
      badge.textContent = t("srGroupBadge", g.count);
      badge.title = t("srGroupBadgeTitle");
      badge.addEventListener("click", (ev) => { ev.stopPropagation(); if (g.sels.length) highlightMany(g.sels, worstLevel(g.row.issues)); });
      role.appendChild(badge);
    }
    const name = document.createElement("span");
    name.className = "sr-name" + (r.name ? "" : " empty");
    name.textContent = r.name ? `"${r.name}"` : t("srScoreNoName");
    if (r.states && r.states.length) {
      const st = document.createElement("span");
      st.className = "sr-states";
      for (const s of r.states) { const x = document.createElement("span"); x.textContent = s; st.appendChild(x); }
      name.append(" ", st);
    }
    if (r.description) {
      const d = document.createElement("span");
      d.className = "sr-states";
      d.textContent = " — " + r.description;
      name.appendChild(d);
    }
    if (r.sel) name.addEventListener("click", () => highlight([r.sel]));
    row.__srSpeech = { text: srAnnouncement(r), lang: srLangOf(r), sel: r.sel };
    row.__srDepth = r.depth || 0;
    const spk = srSpeakBtn(row.__srSpeech);
    if (spk) name.append(spk, srPlayFromBtn(row, container), srPlaySubtreeBtn(row, container));
    row.append(role, name);
    for (const i of r.issues) {
      const e = document.createElement("div");
      e.className = "sr-issue " + i.level;
      e.textContent = srIssueMsg(i);
      row.appendChild(e);
    }
    if (r.issues.length && r.sel) {
      const c = document.createElement("div");
      c.className = "sr-sel";
      c.appendChild(srCode(r.sel));
      srMoreAdd(row, c, "2");
    }
    if (g && issuesOnly && g.sels.length > 1) {
      const det = document.createElement("details");
      det.className = "sr-group";
      const sum = document.createElement("summary");
      sum.textContent = t("srGroupSelectors", g.sels.length);
      det.appendChild(sum);
      const ul = document.createElement("ul");
      for (const sel of g.sels) { const li = document.createElement("li"); li.appendChild(srCode(sel)); ul.appendChild(li); }
      det.appendChild(ul);
      srMoreAdd(row, det, "2");
    }
    if (r.issues.length) srAppendFixes(row, r.issues, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag, section }, "2");
    for (const e of fixed) if (!r.issues.some((i) => i.code === e.code)) srMoreAdd(row, srFixedBlock(e), "2");
    if ((r.issues.length || fixed.length) && r.sel) row.dataset.srSel = r.sel;
    if (g && issuesOnly) row.dataset.srSels = g.sels.join("\n");
    frag.appendChild(row);
  }
  container.appendChild(frag);
  if (shown.length > 700) {
    const more = document.createElement("p");
    more.className = "sr-empty";
    more.textContent = t("srMoreRows", shown.length - 700);
    container.appendChild(more);
  }
  if (container === srOrderList) srUpdatePlayScope();
}

async function buildReadingOrder() {
  srBuildBtn.disabled = true;
  srSetStep("order", "running");
  statusBusy(t("srBuilding"));
  try {
    await bg("injectAxe");
    const r = await bg("srTree");
    if (!r || r.error) throw new Error(r?.error || "no result");
    srState.order = r;
    renderSrRows(r.rows, srOrderList, srIssuesOnly.checked);
    renderSrScore();
    const s = r.summary;
    document.getElementById("srOrderStats").textContent = t("srOrderStats", s, r.truncated);
    srAddFindingsBtn.hidden = !s.issues;
    srState.restored = null;
    srSetStep("order", s.issues ? "issues" : "done", s.issues);
    srPersist();
    statusEl.textContent = t("srOrderBuilt", s.issues);
  } catch (err) {
    srSetStep("order", "error");
    statusEl.textContent = t("srOrderFailed") + (err?.message || err);
  } finally {
    srBuildBtn.disabled = false;
  }
}

srBuildBtn.addEventListener("click", buildReadingOrder);
// One filter box for every Screen reader section: role, name, message, selector or issue code.
function applySrFilter() {
  const q = srFilterInput.value.trim().toLowerCase();
  const rows = srView.querySelectorAll(".sr-row, .sr-log-row, .sr-journey-step");
  let shown = 0;
  for (const row of rows) {
    const match = !q || (row.textContent + " " + (row.dataset.srSel || "") + " " + (row.dataset.srCodes || "")).toLowerCase().includes(q);
    row.hidden = !match;
    if (match) shown++;
  }
  const txt = rows.length ? t("srFilterCount", shown, rows.length) : "";
  if (srFilterCount.textContent !== txt) srFilterCount.textContent = txt;
  srUpdatePlayScope();
}
srFilterInput.addEventListener("input", applySrFilter);
// Sections re-render on their own schedule (polling logs, issues-only toggles) — re-apply the filter whenever a list changes.
let srFilterPending = false;
{
  const mo = new MutationObserver(() => {
    if (srFilterPending) return;
    srFilterPending = true;
    requestAnimationFrame(() => { srFilterPending = false; applySrFilter(); });
  });
  for (const el of [srOrderList, srLiveLog, srFocusLog, srLangList, srNtcList, srReflowList, srCmpList, srAxList, srJourneyList]) mo.observe(el, { childList: true, subtree: true });
}
srIssuesOnly.addEventListener("change", () => {
  if (srState.order) renderSrRows(srState.order.rows, srOrderList, srIssuesOnly.checked);
  if (srState.ax) renderSrRows(srState.ax.rows, srAxList, srIssuesOnly.checked);
});

// Push the automated naming issues into the "Screen reader pass" manual test so they
// land in the same exports and verdict as a human pass would.
srAddFindingsBtn.addEventListener("click", async () => {
  if (!srState.order) return;
  await loadManual();
  const test = MANUAL_TESTS.find((x) => x.id === "screen-reader");
  const existing = manualState.findings["screen-reader"] || [];
  const seen = new Set(existing.map((f) => f.selector + "|" + f.finding));
  let added = 0;
  for (const g of srGroupRows(srState.order.rows)) {
    const r = g.row;
    for (const i of r.issues) {
      const finding = i.msg.length > 120 ? i.msg.slice(0, 117) + "…" : i.msg;
      const key = r.sel + "|" + finding;
      if (seen.has(key)) continue;
      seen.add(key);
      const note = [r.name ? `name: "${r.name}"` : "", g.count > 1 ? t("srGroupNote", g.count) + (g.component ? " (" + srGroupLabel(g) + ")" : "") : "",
        g.count > 1 ? g.sels.slice(1).join(", ") : ""].filter(Boolean).join(" · ");
      existing.push({ finding, selector: r.sel, note, auto: true });
      added++;
    }
  }
  manualState.findings["screen-reader"] = existing;
  if (existing.length) manualState.verdicts["screen-reader"] = "fail";
  await saveManual();
  updateManualProgress();
  statusEl.textContent = t("srFindingsAdded", added, test.title);
});

/* ---- 2. live regions ---- */

const SR_KIND_KEYS = { announced: "srKindAnnounced", silent: "srKindSilent", risky: "srKindRisky", focused: "srKindFocused", rerender: "srKindRerender", nav: "srKindNav", focus: "srKindFocus", "focus-lost": "srKindFocusLost", route: "srKindRoute" };
function srKindLabel(kind) { return SR_KIND_KEYS[kind] ? t(SR_KIND_KEYS[kind]) : String(kind || "").toUpperCase(); }
// SPA route-change findings from the live monitor (kind "route"): code -> score weight / level. "route-ok" is informational.
const SR_ROUTE_W = { "route-silent": 8, "route-title-stale": 5, "route-h1-dup": 3, "route-focus-stuck": 3 };
const SR_ROUTE_LEVEL = { "route-silent": "critical", "route-title-stale": "serious", "route-h1-dup": "moderate", "route-focus-stuck": "moderate" };
const SR_ROUTE_GAP = { "route-silent": "srGapRouteSilent", "route-title-stale": "srGapRouteTitle", "route-h1-dup": "srGapRouteH1", "route-focus-stuck": "srGapRouteFocus" };
const srRouteIssue = (e) => e && e.kind === "route" && !!SR_ROUTE_W[e.code];
// Query-only route changes (soft) are graded minor / weight 1 by the page monitor; pathname changes keep the fixed grades.
const srRouteLevel = (e) => (e.soft && e.level) || SR_ROUTE_LEVEL[e.code];
const srRouteWeight = (e) => (e.soft ? 1 : SR_ROUTE_W[e.code]);
// Notes and finding messages come from the page as English text plus a STR key (+ args) so the panel language applies;
// `en` forces English for exports.
const srLiveNote = (e, en) => { const tt = en ? (k, ...a) => { const v = STR.en[k]; return typeof v === "function" ? v(...a) : v ?? k; } : t; return e.noteKey && STR.en[e.noteKey] ? tt(e.noteKey, ...(e.noteArgs || [])) : e.note || ""; };
const srIssueMsg = (i) => (i.msgKey && STR.en[i.msgKey] ? t(i.msgKey, ...(i.msgArgs || [])) : i.msg);
// A live-log entry that counts as a finding (silent/risky/rerender updates or a route-change issue).
const srLiveIssue = (e) => !!SR_LIVE_W[e.kind] || srRouteIssue(e);
// One line summarising what a route change gave the screen reader: title, H1, focus, announcement.
function srRouteDetail(e) {
  const q = (x) => `"${(x || "").slice(0, 50)}"`;
  const parts = [];
  parts.push(`${t("srRouteTitleLbl")}: ` + (e.titleBefore === e.titleAfter ? `${q(e.titleAfter)} (${t("srRouteSame")})` : `${q(e.titleBefore)} → ${q(e.titleAfter)}`));
  if (e.h1Before || e.h1After) parts.push(`${t("srRouteH1Lbl")}: ` + (e.h1Before === e.h1After ? `${q(e.h1After)} (${t("srRouteSame")})` : `${q(e.h1Before)} → ${q(e.h1After)}`));
  parts.push(e.focusMoved ? t("srRouteFocusMoved", e.focusTo || "?") : t("srRouteFocusStayed"));
  parts.push(e.announced ? t("srRouteAnnounced") : t("srRouteNotAnnounced"));
  return parts.join(" · ");
}

function renderLiveRegions() {
  srLiveRegions.textContent = "";
  const regs = srState.live.regions;
  if (!srState.live.running && !regs.length) return;
  const cap = document.createElement("div");
  cap.style.fontWeight = "600";
  cap.textContent = regs.length ? t("srRegionsFound", regs.length) : t("srRegionsNone");
  srLiveRegions.appendChild(cap);
  for (const r of regs.slice(0, 20)) {
    const d = document.createElement("div");
    d.append(`aria-live=${r.politeness}${r.atomic ? " atomic" : ""}${r.relevant ? " relevant=" + r.relevant : ""} `);
    d.appendChild(srCode(r.sel));
    if (r.text) d.append(` — "${r.text.slice(0, 60)}"`);
    if (r.hidden) d.append(" ⚠ display:none — hidden live regions are not announced");
    srLiveRegions.appendChild(d);
  }
}

function renderLiveLog() {
  const log = srState.live.log;
  srLiveLog.textContent = "";
  if (!log.length) {
    srEmpty(srLiveLog, srState.live.running ? t("srLiveWaiting") : t("srLiveIdle"));
  }
  const frag = document.createDocumentFragment();
  for (const e of log.slice(-200)) {
    const row = document.createElement("div");
    row.className = "sr-log-row";
    const time = document.createElement("span");
    time.className = "sr-time";
    time.textContent = e.kind === "nav" ? "" : (e.t / 1000).toFixed(1) + "s";
    const kind = document.createElement("span");
    kind.className = "sr-kind " + e.kind;
    kind.textContent = srKindLabel(e.kind);
    const body = document.createElement("span");
    if (e.kind === "nav") body.textContent = e.text;
    else if (e.kind === "route") {
      const lvl = srRouteLevel(e) || "info";
      row.classList.add("level-" + lvl);
      const code = document.createElement("span");
      code.className = "pill route-code " + lvl;
      code.textContent = e.code;
      body.append(code, " ");
      const u = document.createElement("code");
      u.dir = "ltr";
      u.textContent = e.text;
      body.appendChild(u);
      if (!e.flow) {
        const d = document.createElement("div");
        d.className = "sr-route-detail";
        d.textContent = srRouteDetail(e);
        body.appendChild(d);
      }
    } else {
      body.append((e.politeness ? `[${e.politeness}] ` : "") + `"${e.text}" `);
      if (e.sel) body.appendChild(srCode(e.sel));
      const spk = srSpeakBtn({ text: srLiveAnnouncement(e), lang: srLangOf(e), sel: e.sel });
      if (spk) body.appendChild(spk);
    }
    row.append(time, kind, body);
    if (e.note) {
      const n = document.createElement("div");
      n.className = "sr-note";
      n.textContent = srLiveNote(e);
      row.appendChild(n);
    }
    if (e.kind === "silent" || e.kind === "risky" || e.kind === "rerender") {
      row.dataset.srCodes = e.code || e.kind;
      const fix = srFixFor(e.code || e.kind, { html: e.html, sel: e.sel, text: e.text, tag: e.tag, attr: e.attr, target: e.target });
      if (fix) srMoreAdd(row, srFixBlock(fix, { html: e.html, sel: e.sel, code: e.code || e.kind, section: "live", attr: e.attr }, (e.kind + ": " + (srLiveNote(e) || "content changed without being announced"))), "3");
      if (e.sel) row.dataset.srSel = e.sel;
    } else if (e.kind === "route") {
      row.dataset.srCodes = e.code;
      if (srRouteIssue(e)) {
        const fix = srFixFor(e.code, { html: e.html, sel: e.sel, text: e.text, tag: e.tag, titleAfter: e.titleAfter, h1After: e.h1After, url: e.url });
        if (fix) srMoreAdd(row, srFixBlock(fix, { html: e.html, sel: e.sel, code: e.code, section: "live" }, (e.code + ": " + srLiveNote(e))), "3");
      }
      if (e.sel) row.dataset.srSel = e.sel;
    }
    frag.appendChild(row);
  }
  srLiveLog.appendChild(frag);
  const silent = log.filter((e) => e.kind === "silent").length;
  const ann = log.filter((e) => e.kind === "announced").length;
  const risky = log.filter((e) => e.kind === "risky").length;
  const routes = log.filter((e) => e.kind === "route" && !e.flow).length;
  const routeBad = log.filter(srRouteIssue).length;
  document.getElementById("srLiveStats").textContent = log.length ? t("srLiveStatsFmt", ann, silent, risky) + (routes || routeBad ? t("srLiveStatsRoute", routes, routeBad) : "") : "";
  const liveIssues = log.filter(srLiveIssue).length;
  srSetStep("live", srState.live.running ? "running" : !log.length ? "idle" : liveIssues ? "issues" : "done", liveIssues);
  renderSrScore();
  srPersist();
}

async function liveInstall() {
  const r = await bg("liveStart");
  srState.live.regions = r?.regions || [];
  renderLiveRegions();
}

async function startLive(byFlow) {
  if (srState.live.running) return;
  try {
    await liveInstall();
  } catch (err) {
    srSetStep("live", "error");
    statusEl.textContent = t("srLiveFailed") + (err?.message || err);
    return;
  }
  srState.live.running = true;
  srState.live.startedByFlow = !!byFlow;
  setLabel(srLiveBtn, "i-stop", t("srLiveStop"));
  srLiveBtn.classList.add("recording");
  renderLiveLog();
  srState.live.poll = setInterval(async () => {
    try {
      const entries = await bg("liveDrain");
      if (entries === null) { await liveInstall(); return; } // page navigated — reinstall, keep the log
      if (entries.length) {
        srState.live.log.push(...srStamp(entries));
        if (srState.live.log.length > 400) srState.live.log.splice(0, srState.live.log.length - 400);
        renderLiveLog();
      }
    } catch (_) { /* mid-navigation */ }
  }, 1000);
}

async function stopLive() {
  if (!srState.live.running) return;
  clearInterval(srState.live.poll);
  srState.live.running = false;
  setLabel(srLiveBtn, "i-bell", t("srLiveStart"));
  srLiveBtn.classList.remove("recording");
  try {
    const rest = await bg("liveDrain");
    if (rest && rest.length) srState.live.log.push(...srStamp(rest));
    await bg("liveStop");
  } catch (_) {}
  renderLiveLog();
}

srLiveBtn.addEventListener("click", () => (srState.live.running ? stopLive() : startLive(false)));
document.getElementById("srLiveClearBtn").addEventListener("click", () => { srState.live.log = []; renderLiveLog(); });

/* ---- 3. focus trace ---- */

// fix-snippet context for the focus-ring codes (colour / contrast / width measured on the page)
const srRingCtx = (e) => e.ring ? { ringBg: e.ring.bg, ringColor: e.ring.color, ringContrast: e.ring.contrast, ringWidth: e.ring.width } : {};
function renderFocusLog() {
  const log = srState.focus.log;
  srFocusLog.textContent = "";
  const shown = srFocusIssuesOnly.checked ? log.filter((e) => e.kind === "nav" || e.issues.length) : log;
  if (!shown.length) srEmpty(srFocusLog, srState.focus.running ? t("srFocusWaiting") : t("srFocusIdle"));
  const frag = document.createDocumentFragment();
  for (const e of shown.slice(-250)) {
    const row = document.createElement("div");
    row.className = "sr-row" + (e.issues.length ? " has-issue level-" + worstLevel(e.issues) : "");
    row.style.gridTemplateColumns = "auto auto 1fr";
    const time = document.createElement("span");
    time.className = "sr-time";
    time.textContent = e.kind === "nav" ? "" : (e.t / 1000).toFixed(1) + "s";
    const role = document.createElement("span");
    role.className = "sr-role";
    role.textContent = e.kind === "nav" ? t("srNavigated") : e.role;
    role.title = e.tag ? `<${e.tag}>` : "";
    const name = document.createElement("span");
    name.className = "sr-name" + (e.name ? "" : " empty");
    name.textContent = e.kind === "nav" ? e.text : e.name ? `"${e.name}"` : t("srScoreNoName");
    if ((e.states && e.states.length) || e.ring) {
      const st = document.createElement("span");
      st.className = "sr-states";
      for (const s of e.states || []) { const x = document.createElement("span"); x.textContent = s; st.appendChild(x); }
      if (e.ring) { // what the sighted keyboard user sees: "outline 1px · 1.4:1"
        const x = document.createElement("span");
        x.className = "sr-ring";
        x.textContent = t("srRingFmt", e.ring.kind, e.ring.width, e.ring.contrast);
        x.title = t("srRingTitle", e.ring.color, e.ring.bg);
        st.appendChild(x);
      }
      name.append(" ", st);
    }
    if (e.sel && e.kind !== "nav") {
      name.addEventListener("click", () => highlight([e.sel]));
      role.addEventListener("click", () => highlight([e.sel]));
      const spk = srSpeakBtn({ text: srAnnouncement(e), lang: srLangOf(e), sel: e.sel });
      if (spk) name.appendChild(spk);
    }
    row.append(time, role, name);
    for (const i of e.issues || []) {
      const d = document.createElement("div");
      d.className = "sr-issue " + i.level;
      d.style.gridColumn = "3";
      d.textContent = srIssueMsg(i);
      row.appendChild(d);
    }
    if (e.issues && e.issues.length && e.sel && e.sel !== "body") {
      const c = document.createElement("div");
      c.className = "sr-sel";
      c.appendChild(srCode(e.sel));
      srMoreAdd(row, c, "3");
    }
    if (e.issues && e.issues.length) srAppendFixes(row, e.issues, { html: e.html, sel: e.sel, role: e.role, name: e.name, tag: e.tag, section: "focus", info: e.issues[0].info, container: e.issues[0].container, ...srRingCtx(e) }, "3");
    if (e.issues && e.issues.length && e.sel) row.dataset.srSel = e.sel;
    frag.appendChild(row);
  }
  srFocusLog.appendChild(frag);
  const issues = log.reduce((a, e) => a + (e.issues ? e.issues.length : 0), 0);
  document.getElementById("srFocusStats").textContent = log.length ? t("srFocusStatsFmt", log.filter((e) => e.kind !== "nav" && e.kind !== "walk").length, issues) : "";
  srSetStep("focus", srState.focus.running || srState.focus.walking ? "running" : !log.length ? "idle" : issues ? "issues" : "done", issues);
  renderSrScore();
  srPersist();
}

async function startFocus(byFlow) {
  if (srState.focus.running) return;
  try {
    await bg("focusStart");
  } catch (err) {
    srSetStep("focus", "error");
    statusEl.textContent = t("srFocusFailed") + (err?.message || err);
    return;
  }
  srState.focus.running = true;
  srState.focus.startedByFlow = !!byFlow;
  setLabel(srFocusBtn, "i-stop", t("srFocusStop"));
  srFocusBtn.classList.add("recording");
  renderFocusLog();
  srState.focus.poll = setInterval(async () => {
    try {
      const entries = await bg("focusDrain");
      if (entries === null) { await bg("focusStart"); return; } // navigated — reinstall
      if (entries.length) {
        srState.focus.log.push(...srStamp(entries));
        if (srState.focus.log.length > 400) srState.focus.log.splice(0, srState.focus.log.length - 400);
        renderFocusLog();
      }
    } catch (_) {}
  }, 700);
}

async function stopFocus() {
  if (!srState.focus.running) return;
  clearInterval(srState.focus.poll);
  srState.focus.running = false;
  setLabel(srFocusBtn, "i-keyboard", t("srFocusStart"));
  srFocusBtn.classList.remove("recording");
  try {
    const rest = await bg("focusDrain");
    if (rest && rest.length) srState.focus.log.push(...srStamp(rest));
    await bg("focusStop");
  } catch (_) {}
  renderFocusLog();
}

srFocusBtn.addEventListener("click", () => (srState.focus.running ? stopFocus() : startFocus(false)));
srFocusIssuesOnly.addEventListener("change", renderFocusLog);

// Keyboard auto-walk: focus every Tab stop in real Tab order (page-side), then turn the structural
// findings (unreachable / order jump / possible trap) into focus-log entries with fixes.
function srWalkEntries(r) {
  const seqBase = 100000 + Date.now() % 100000;
  const mk = (x, issue) => ({ kind: "walk", t: x.t || 0, seq: seqBase + Math.random(), sel: x.sel, tag: x.tag, role: x.role, name: x.name, via: "walk", html: x.html, states: [], issues: [issue] });
  const out = [];
  for (const x of r.unreachable) out.push(mk(x, { level: /inert|display:none|not rendered|visibility/.test(x.reason) ? "minor" : "serious", code: "unreachable",
    msg: `unreachable by keyboard: focus() did not land on it (${x.reason}) — ${/inert|display|rendered|visibility/.test(x.reason) ? "fine if it is meant to be hidden, otherwise it must be removed from the Tab sequence explicitly" : "keyboard users can never operate it"}` }));
  for (const x of r.jumps) out.push(mk(x, { level: "moderate", code: "order-jump",
    msg: `order jump: Tab arrived here from a later element (tabindex="${x.afterTabindex}" on ${x.after}) — the focus order no longer follows the page` }));
  for (const x of r.traps) out.push(mk(x, { level: "moderate", code: "possible-trap",
    msg: `possible trap: verify manually — focus is ${x.reason} (${x.container}); Tab/Shift+Tab and Escape must still leave it` }));
  // custom widget keyboard probe (synthetic keys — hints, not proof)
  for (const x of r.widgets || []) {
    if (x.ok) continue;
    const keys = (x.keys || []).map((k) => (k === " " ? "Space" : k)).join(" / ");
    if (x.check === "arrow") out.push(mk(x, { level: "serious", code: "widget-no-arrow-nav", info: x.widget, container: x.container, msgKey: "srMsgWidgetNoArrow", msgArgs: [keys, x.widget, x.container],
      msg: `custom widget: ${keys} changed nothing inside role="${x.widget}" (${x.container}) — no focus move, aria state or DOM change within 150 ms; a keyboard user is stuck on the first item (hint from synthetic keys — verify with a real keyboard)` }));
    else if (x.check === "activate") out.push(mk(x, { level: "moderate", code: "widget-no-enter-space", info: x.widget, msgKey: "srMsgWidgetNoEnterSpace", msgArgs: [keys, x.haspopup, x.widget],
      msg: `custom widget: ${keys} changed nothing on this ${x.haspopup ? "aria-haspopup=\"" + x.haspopup + "\" " : ""}${x.widget} — verify manually — synthetic keys cannot trigger native activation, but a div/span with a click-only handler never opens for keyboard users` }));
    else if (x.check === "escape") out.push(mk(x, { level: "moderate", code: "widget-esc-no-close", info: x.widget, msgKey: "srMsgWidgetEscNoClose", msgArgs: [x.changed],
      msg: `custom widget: the popup opened by Enter did not close on Escape (${x.changed || "no change"} within 150 ms) — users end up pressing Escape twice or Tab-ing out (hint from synthetic keys — verify by hand)` }));
  }
  return out;
}

async function focusWalk() {
  if (srState.focus.walking) return;
  srState.focus.walking = true;
  srWalkBtn.disabled = true;
  setLabel(srWalkBtn, null, t("srWalkRunning"));
  srWalkBtn.prepend(Object.assign(document.createElement("span"), { className: "spin" }));
  srWalkSummary.hidden = true;
  try {
    if (!srState.focus.running) await startFocus(false);
    if (!srState.focus.running) throw new Error(statusEl.textContent || "focus trace not running");
    const r = await bg("focusWalk", { maxSteps: 400 });
    if (!r || r.error) throw new Error((r && r.error) || "no result");
    const rest = await bg("focusDrain");
    if (rest && rest.length) srState.focus.log.push(...srStamp(rest));
    srState.focus.walk = r;
    srState.focus.log.push(...srWalkEntries(r));
    if (srState.focus.log.length > 400) srState.focus.log.splice(0, srState.focus.log.length - 400);
    const bad = r.unreachable.length + r.jumps.length + r.traps.length + (r.widgets || []).filter((w) => !w.ok).length;
    srWalkSummary.textContent = r.candidates ? t("srWalkSummary", r) : t("srWalkNone");
    srWalkSummary.classList.toggle("bad", bad > 0);
    srWalkSummary.hidden = false;
    statusEl.textContent = srWalkSummary.textContent;
    renderFocusLog();
  } catch (err) {
    srState.focus.walk = null;
    srWalkSummary.textContent = t("srWalkFailed") + (err?.message || err);
    srWalkSummary.classList.add("bad");
    srWalkSummary.hidden = false;
  } finally {
    srState.focus.walking = false;
    srWalkBtn.disabled = false;
    setLabel(srWalkBtn, "i-keyboard", t("srWalk"));
    renderFocusLog();
  }
}
srWalkBtn.addEventListener("click", focusWalk);
document.getElementById("srFocusClearBtn").addEventListener("click", () => { srState.focus.log = []; srState.focus.walk = null; srWalkSummary.hidden = true; renderFocusLog(); });

/* ---- 4. language / voice switching ---- */

function renderLang(r) {
  srLangList.textContent = "";
  const stats = document.getElementById("srLangStats");
  stats.textContent = t("srLangStats", r);
  const fixedRows = srState.applied.filter((e) => e.section === "lang" && srEntryFixed(e) === true);
  if (!r.issues.length && !fixedRows.length) { srEmpty(srLangList, t("srLangOk")); renderSrScore(); return; }
  const frag = document.createDocumentFragment();
  for (const e of fixedRows) {
    const row = document.createElement("div");
    row.className = "sr-row fixed";
    row.dataset.srSel = e.cur;
    row.dataset.srCodes = e.code;
    const tag = document.createElement("span");
    tag.className = "sr-role";
    tag.textContent = e.code;
    const ok = document.createElement("span");
    ok.className = "badge-fixed";
    ok.textContent = t("srFixedBadge");
    tag.appendChild(ok);
    const body = document.createElement("span");
    body.className = "sr-name";
    body.appendChild(srCode(e.cur));
    row.append(tag, body);
    srMoreAdd(row, srFixedBlock(e), "2");
    frag.appendChild(row);
  }
  for (const i of r.issues) {
    const row = document.createElement("div");
    row.className = "sr-row has-issue level-" + i.level;
    row.dataset.srSel = i.sel;
    row.dataset.srCodes = i.type;
    const tag = document.createElement("span");
    tag.className = "sr-role";
    tag.textContent = i.type;
    const body = document.createElement("span");
    body.className = "sr-name";
    if (i.snippet) {
      const sn = document.createElement("span");
      sn.className = "sr-lang-snippet";
      sn.textContent = `“${i.snippet}”`;
      body.appendChild(sn);
      body.append(" ");
    }
    body.appendChild(srCode(i.sel));
    const msg = document.createElement("div");
    msg.className = "sr-issue " + i.level;
    msg.textContent = i.msg;
    row.append(tag, body, msg);
    const fctx = { html: i.html, sel: i.sel, snippet: i.snippet, declared: i.declared, detected: i.type.startsWith("html-lang") ? r.majority : i.detected, code: i.type, section: "lang" };
    const fix = srFixFor(i.type, fctx);
    if (fix) srMoreAdd(row, srFixBlock(fix, fctx, i.msg), "2");
    frag.appendChild(row);
  }
  srLangList.appendChild(frag);
  renderSrScore();
}

async function runLangCheck() {
  srLangBtn.disabled = true;
  srSetStep("lang", "running");
  statusBusy(t("srLangRunning"));
  try {
    const r = await bg("langCheck");
    srState.lang = r;
    srState.restored = null;
    renderLang(r);
    srSetStep("lang", r.issues.length ? "issues" : "done", r.issues.length);
    srPersist();
    statusEl.textContent = t("srLangDone", r.issues.length);
  } catch (err) {
    srSetStep("lang", "error");
    statusEl.textContent = t("srLangFailed") + (err?.message || err);
  } finally {
    srLangBtn.disabled = false;
  }
}
srLangBtn.addEventListener("click", runLangCheck);

/* ---- 5. non-text contrast (WCAG 1.4.11): control borders, toggles, icons ---- */

const srNtcFixCtx = (i) => ({ html: i.html, sel: i.sel, role: i.role, name: i.name, tag: i.tag, code: i.code, section: "ntc", ntcKind: i.kind, ntcProp: i.prop, ntcColor: i.color, ntcBg: i.bg, ntcRatio: i.ratio });

function renderNtc(r) {
  srNtcList.textContent = "";
  document.getElementById("srNtcStats").textContent = t("srNtcStats", r);
  if (!r.issues.length) { srEmpty(srNtcList, t("srNtcOk")); renderSrScore(); return; }
  const frag = document.createDocumentFragment();
  for (const i of r.issues) {
    const row = document.createElement("div");
    row.className = "sr-row has-issue level-" + i.level;
    row.dataset.srSel = i.sel;
    row.dataset.srCodes = i.code + " " + i.kind;
    const tag = document.createElement("span");
    tag.className = "sr-role";
    tag.textContent = i.role || i.tag;
    tag.title = i.code;
    const body = document.createElement("span");
    body.className = "sr-name";
    const colors = document.createElement("span");
    colors.className = "sr-ntc-colors";
    colors.dir = "ltr";
    const kind = document.createElement("span");
    kind.className = "sr-ntc-kind";
    kind.textContent = t("srNtcKind")[i.kind] || i.kind;
    const c1 = document.createElement("code");
    c1.textContent = i.color;
    const c2 = document.createElement("code");
    c2.textContent = i.bg;
    const ratio = document.createElement("b");
    ratio.className = "sr-ntc-ratio";
    ratio.textContent = Number(i.ratio).toFixed(2) + ":1";
    colors.append(kind, " ", swatch(i.color), c1, " " + t("srNtcOn") + " ", swatch(i.bg), c2, " · ", ratio);
    body.append(colors, " ");
    if (i.name) { const nm = document.createElement("span"); nm.className = "sr-lang-snippet"; nm.textContent = `“${i.name}”`; body.append(nm, " "); }
    body.appendChild(srCode(i.sel));
    const msg = document.createElement("div");
    msg.className = "sr-issue " + i.level;
    msg.textContent = srIssueMsg(i);
    row.append(tag, body, msg);
    const fctx = srNtcFixCtx(i);
    const fix = srFixFor(i.code, fctx);
    if (fix) srMoreAdd(row, srFixBlock(fix, fctx, i.msg), "2");
    frag.appendChild(row);
  }
  srNtcList.appendChild(frag);
  renderSrScore();
}

async function runNtcCheck() {
  srNtcBtn.disabled = true;
  srSetStep("ntc", "running");
  statusBusy(t("srNtcRunning"));
  try {
    const r = await bg("nonTextContrast");
    if (!r || r.error) throw new Error(r?.error || "no result");
    srState.ntc = r;
    srState.restored = null;
    renderNtc(r);
    srSetStep("ntc", r.issues.length ? "issues" : "done", r.issues.length);
    srPersist();
    statusEl.textContent = t("srNtcDone", r.issues.length);
  } catch (err) {
    srSetStep("ntc", "error");
    statusEl.textContent = t("srNtcFailed") + (err?.message || err);
  } finally {
    srNtcBtn.disabled = false;
  }
}
srNtcBtn.addEventListener("click", runNtcCheck);

/* ---- 4c. reflow / zoom test (chrome.debugger: 320 px viewport + 200 % text) ---- */

const srReflowFixCtx = (i) => ({ html: i.html, sel: i.sel, sel2: i.sel2, html2: i.html2, tag: i.tag, name: i.name, code: i.code, section: "reflow", info: i.info, reflow: i });

// "Grant the debugger permission in Options" note with a button, shared by the reflow test and the browser tree.
function srGrantNote(container, msg) {
  srEmpty(container, msg);
  const b = document.createElement("button");
  b.className = "btn";
  setLabel(b, "i-gear", t("srAxOpenOptions"));
  b.addEventListener("click", () => { try { EXT.runtime.openOptionsPage(); } catch (_) { window.open(EXT.runtime.getURL("options.html")); } });
  container.appendChild(b);
}

function renderReflow(r) {
  srReflowList.textContent = "";
  srReflowShots.textContent = "";
  srReflowStats.textContent = t("srReflowStats", r.summary);
  const sh = r.shots || {};
  srReflowShots.hidden = !(sh.base || sh.narrow);
  const fig = (src, caption) => {
    const f = document.createElement("figure");
    f.className = "sr-reflow-shot";
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption;
    const c = document.createElement("figcaption");
    c.textContent = caption;
    f.append(img, c);
    return f;
  };
  if (sh.base) srReflowShots.appendChild(fig(sh.base, t("srReflowShotBase", r.summary.baseWidth)));
  if (sh.narrow) srReflowShots.appendChild(fig(sh.narrow, t("srReflowShot320")));
  if (!r.findings.length) { srEmpty(srReflowList, t("srReflowOk")); renderSrScore(); return; }
  const frag = document.createDocumentFragment();
  for (const i of r.findings) {
    const row = document.createElement("div");
    row.className = "sr-row has-issue level-" + i.level;
    row.dataset.srSel = i.sel;
    row.dataset.srCodes = i.code + (i.code.endsWith("-200") ? " zoom-200" : " width-320");
    const tag = document.createElement("span");
    tag.className = "sr-role";
    tag.textContent = i.tag;
    tag.title = i.code;
    tag.addEventListener("click", () => highlight([i.sel]));
    const body = document.createElement("span");
    body.className = "sr-name";
    const kind = document.createElement("span");
    kind.className = "sr-reflow-code";
    kind.textContent = t("srReflowCode")[i.code] || i.code;
    body.append(kind, " ");
    if (i.name) { const nm = document.createElement("span"); nm.className = "sr-lang-snippet"; nm.textContent = `“${i.name}”`; body.append(nm, " "); }
    body.appendChild(srCode(i.sel));
    if (i.sel2) body.append(" ↔ ", srCode(i.sel2));
    const msg = document.createElement("div");
    msg.className = "sr-issue " + i.level;
    msg.textContent = srIssueMsg(i);
    row.append(tag, body, msg);
    const fctx = srReflowFixCtx(i);
    const fix = srFixFor(i.code, fctx);
    if (fix) srMoreAdd(row, srFixBlock(fix, fctx, srIssueMsg(i)), "2");
    frag.appendChild(row);
  }
  srReflowList.appendChild(frag);
  renderSrScore();
}

async function runReflowTest() {
  srReflowBtn.disabled = true;
  srSetStep("reflow", "running");
  statusBusy(t("srReflowRunning"));
  try {
    const r = await bg("reflowTest");
    if (!r || !Array.isArray(r.findings)) throw new Error("no result");
    srState.reflow = r;
    srState.restored = null;
    renderReflow(r);
    srSetStep("reflow", r.findings.length ? "issues" : "done", r.findings.length);
    srPersist();
    statusEl.textContent = t("srReflowDone", r.findings.length);
  } catch (err) {
    const m = err?.message || String(err);
    srSetStep("reflow", "error");
    if (m === "permission-needed") {
      statusEl.textContent = "";
      srGrantNote(srReflowList, t("srReflowPermission"));
    } else {
      statusEl.textContent = t("srReflowFailed") + m;
      srEmpty(srReflowList, m);
    }
  } finally {
    srReflowBtn.disabled = false;
  }
}
srReflowBtn.addEventListener("click", runReflowTest);

/* ---- 4b. bilingual AR/EN page comparison ----
   The other-language URL is loaded in a hidden tab by the background (op srCompare) and the two
   reading orders are paired by a structural key (role + tag + component + DOM path without
   :nth-child numbers) so content-only differences (different text, more list items) are ignored. */

const SR_CMP_INTERACTIVE = new Set(["link", "button", "checkbox", "radio", "textbox", "combobox", "listbox", "menuitem", "menuitemcheckbox",
  "menuitemradio", "option", "slider", "spinbutton", "switch", "tab", "searchbox", "treeitem"]);
const SR_CMP_LANDMARK = new Set(["banner", "navigation", "main", "complementary", "contentinfo", "search", "region", "form"]);

// Guess the other-language URL from the current one: /ar/ ↔ /en/, ?lang=ar ↔ en, ar. ↔ en. host prefix.
function srCmpGuess(url) {
  if (!url) return "";
  try {
    const u = new URL(url);
    const swap = (x) => (x === "ar" ? "en" : "ar");
    if (/(^|\/)(ar|en)(\/|$)/i.test(u.pathname)) { u.pathname = u.pathname.replace(/(^|\/)(ar|en)(?=\/|$)/i, (m, pre, l) => pre + swap(l.toLowerCase())); return u.href; }
    for (const k of ["lang", "locale", "language", "lng"]) {
      const v = (u.searchParams.get(k) || "").toLowerCase();
      if (v === "ar" || v === "en") { u.searchParams.set(k, swap(v)); return u.href; }
    }
    if (/^(ar|en)\./i.test(u.hostname)) { u.hostname = u.hostname.replace(/^(ar|en)\./i, (m, l) => swap(l.toLowerCase()) + "."); return u.href; }
  } catch (_) {}
  return "";
}

async function srCmpCurrentUrl() {
  const u = await devEval("location.href");
  return (typeof u === "string" && u) || (srState.order && srState.order.url) || "";
}

async function srCmpPrefill() {
  if (srCmpUrl.value) return;
  const guess = srCmpGuess(await srCmpCurrentUrl());
  if (guess && !srCmpUrl.value) srCmpUrl.value = guess;
}

function srCmpKey(r) {
  return [r.role, r.tag || "", r.component || "", (r.sel || "").replace(/:nth-child\(\d+\)/g, "")].join("|");
}
function srCmpIsLive(r) { return !!r.live || /^(status|alert|log)$/.test(r.role); }
function srCmpIndex(rows) {
  const m = new Map();
  for (const r of rows) {
    if (r.role === "text" || r.role === "aria-hidden") continue;
    if (!SR_CMP_INTERACTIVE.has(r.role) && !SR_CMP_LANDMARK.has(r.role) && !srCmpIsLive(r) && r.role !== "heading") continue;
    const k = srCmpKey(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}
function srCmpHeadingLevel(r) {
  const st = (r.states || []).find((x) => /^level \d/.test(x));
  return st ? parseInt(st.slice(6), 10) : 2;
}

// Message text for a diff, built on demand so it follows the panel language (and can be
// forced to English for exports). Side / script args are stored symbolically in msgArgs.
function srCmpMsg(d, en) {
  const tt = en ? (k, ...a) => { const v = STR.en[k]; return typeof v === "function" ? v(...a) : v ?? k; } : t;
  const args = (d.msgArgs || []).map((a) => a && typeof a === "object"
    ? (a.side ? tt(a.side === "this" ? "srCmpThis" : "srCmpOther") : a.script ? tt(a.script === "Arabic" ? "srScriptAr" : "srScriptLatin") : "")
    : a);
  return d.msgKey ? tt(d.msgKey, ...args) : d.msg || d.kind;
}

// Returns [{ kind, code, fixCode, level, side ("this"|"other"), msgKey, msgArgs, msg, row, count, sels }]
function srCmpDiff(thisOrder, thisLang, otherOrder, otherLang) {
  const diffs = [];
  const A = srCmpIndex(thisOrder.rows), B = srCmpIndex(otherOrder.rows);
  const sideLabel = (side) => ({ side });
  const roleLabel = (r) => (r.component ? r.component + " · " + r.role : r.role);
  const oneWay = (X, Y, side) => {
    for (const [k, rows] of X) {
      const r = rows[0];
      const other = Y.get(k) || [];
      const isCtrl = SR_CMP_INTERACTIVE.has(r.role), isLm = SR_CMP_LANDMARK.has(r.role), isLive = srCmpIsLive(r);
      if (!other.length) {
        if (isCtrl) diffs.push({ kind: "missing", code: "cmp-missing", level: "serious", side, row: r, count: rows.length, sels: rows.map((x) => x.sel), msgKey: "srCmpMissing", msgArgs: [sideLabel(side), roleLabel(r), rows.length] });
        else if (isLive) diffs.push({ kind: "live", code: "cmp-live", level: "serious", side, row: r, count: rows.length, sels: rows.map((x) => x.sel), msgKey: "srCmpLive", msgArgs: [sideLabel(side)] });
        continue;
      }
      if (side !== "this") continue; // paired keys are handled once, from this page's side
      const named = rows.some((x) => x.name), otherNamed = other.some((x) => x.name);
      if (isCtrl && named !== otherNamed) {
        const un = named ? other[0] : r;
        diffs.push({ kind: "unnamed", code: "cmp-unnamed", fixCode: "no-name", level: "serious", side: named ? "this" : "other", row: un, count: 1, sels: [un.sel],
          msgKey: "srCmpUnnamed", msgArgs: [sideLabel(named ? "this" : "other"), roleLabel(r)] });
      }
      if (isLm && named !== otherNamed) {
        const un = named ? other[0] : r;
        diffs.push({ kind: "landmark", code: "cmp-landmark", fixCode: "dup-landmark", level: "moderate", side: named ? "this" : "other", row: un, count: 1, sels: [un.sel],
          msgKey: "srCmpLandmark", msgArgs: [sideLabel(named ? "this" : "other"), r.role] });
      }
    }
  };
  oneWay(A, B, "this");
  oneWay(B, A, "other");
  // heading counts per level
  const levels = (rows) => { const c = {}; for (const r of rows) if (r.role === "heading") { const l = srCmpHeadingLevel(r); c[l] = (c[l] || 0) + 1; } return c; };
  const la = levels(thisOrder.rows), lb = levels(otherOrder.rows);
  for (const l of [1, 2, 3, 4, 5, 6]) if ((la[l] || 0) !== (lb[l] || 0)) {
    diffs.push({ kind: "headings", code: "cmp-headings", level: "moderate", side: "this", row: { role: "heading", sel: "", name: "h" + l }, count: 1, sels: [], msgKey: "srCmpHeadings", msgArgs: [l, la[l] || 0, lb[l] || 0] });
  }
  // html lang / dir on each side (from the language checks)
  const langSide = (g, side) => {
    if (!g) return;
    const lang = (g.htmlLang || "").toLowerCase().split("-")[0];
    const det = g.majority === "ar" ? "Arabic" : g.majority === "latin" ? "Latin" : "";
    if ((g.majority === "ar" && lang !== "ar") || (g.majority === "latin" && lang === "ar")) {
      diffs.push({ kind: "html-lang", code: "cmp-html-lang", fixCode: "html-lang-mismatch", level: "serious", side, row: { role: "html", sel: "html", name: "", html: "" }, count: 1, sels: ["html"], msgKey: "srCmpHtmlLang", msgArgs: [sideLabel(side), g.htmlLang, det ? { script: det } : ""], declared: g.htmlLang, detected: det });
    }
    if (g.majority === "ar" && (g.htmlDir || "").toLowerCase() !== "rtl") {
      diffs.push({ kind: "html-dir", code: "cmp-html-dir", fixCode: "html-dir", level: "serious", side, row: { role: "html", sel: "html", name: "", html: "" }, count: 1, sels: ["html"], msgKey: "srCmpHtmlDir", msgArgs: [sideLabel(side), g.htmlDir], declared: g.htmlDir || "", detected: "Arabic" });
    }
  };
  langSide(thisLang, "this");
  langSide(otherLang, "other");
  for (const d of diffs) d.msg = srCmpMsg(d);
  if (thisLang && otherLang && thisLang.htmlLang && otherLang.htmlLang && thisOrder.url !== otherOrder.url &&
      thisLang.htmlLang.toLowerCase().split("-")[0] === otherLang.htmlLang.toLowerCase().split("-")[0]) {
    diffs.push({ kind: "same-lang", code: "cmp-same-lang", level: "serious", side: "other", row: { role: "html", sel: "html", name: "", html: "" }, count: 1, sels: ["html"], msgKey: "srCmpSameLang", msgArgs: [thisLang.htmlLang] });
  }
  return diffs;
}

function renderCmp() {
  const c = srState.cmp;
  srCmpList.textContent = "";
  srCmpStats.textContent = c ? t("srCmpStats", c.differences.length) : "";
  if (!c) { renderSrScore(); return; }
  const urls = document.createElement("p");
  urls.className = "sr-cmp-urls";
  const a = document.createElement("code"); a.textContent = c.url;
  const b = document.createElement("code"); b.textContent = c.otherUrl;
  const txt = t("srCmpUrls", "\u0000", "\u0001").split(/[\u0000\u0001]/);
  urls.append(txt[0] || "", a, txt[1] || " ↔ ", b, txt[2] || "");
  srCmpList.appendChild(urls);
  if (!c.differences.length) { const p = document.createElement("p"); p.className = "sr-empty"; p.textContent = t("srCmpOk"); srCmpList.appendChild(p); renderSrScore(); return; }
  const frag = document.createDocumentFragment();
  for (const d of c.differences) {
    const r = d.row;
    const row = document.createElement("div");
    row.className = "sr-row has-issue level-" + d.level;
    if (d.side === "this" && r.sel) row.dataset.srSel = r.sel;
    const role = document.createElement("span");
    role.className = "sr-role";
    const side = document.createElement("span");
    side.className = "sr-cmp-side " + d.side;
    side.textContent = t(d.side === "this" ? "srCmpThis" : "srCmpOther");
    role.appendChild(side);
    role.append(r.component ? r.component + " · " + r.role : r.role);
    if (d.count > 1) {
      const badge = document.createElement("span");
      badge.className = "badge-dup";
      badge.textContent = t("srGroupBadge", d.count);
      if (d.side === "this") badge.addEventListener("click", (ev) => { ev.stopPropagation(); highlightMany(d.sels, d.level); });
      role.appendChild(badge);
    }
    const name = document.createElement("span");
    name.className = "sr-name" + (r.name ? "" : " empty");
    name.textContent = r.name ? `"${r.name}"` : t("srScoreNoName");
    if (d.side === "this" && r.sel) { role.addEventListener("click", () => highlight([r.sel])); name.addEventListener("click", () => highlight([r.sel])); }
    const msg = document.createElement("div");
    msg.className = "sr-issue " + d.level;
    msg.textContent = srCmpMsg(d);
    row.append(role, name, msg);
    if (r.sel) {
      const cs = document.createElement("div");
      cs.className = "sr-sel";
      if (d.side === "this") cs.appendChild(srCode(r.sel));
      else { const code = document.createElement("code"); code.textContent = r.sel; cs.appendChild(code); }
      srMoreAdd(row, cs, "2");
    }
    if (d.fixCode) {
      // Apply on page only makes sense for elements of the inspected page; other-side rows get copy-only fixes.
      const fctx = { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag, code: d.fixCode, declared: d.declared, detected: d.detected,
        section: d.side === "this" ? (d.kind.startsWith("html-") ? "lang" : "order") : undefined };
      const fix = srFixFor(d.fixCode, fctx);
      if (fix) srMoreAdd(row, srFixBlock(fix, fctx, srCmpMsg(d)), "2");
    }
    frag.appendChild(row);
  }
  srCmpList.appendChild(frag);
  renderSrScore();
}

async function runCompare() {
  const otherUrl = srCmpUrl.value.trim() || srCmpGuess(await srCmpCurrentUrl());
  if (!otherUrl) { document.getElementById("srCmpSection").open = true; statusEl.textContent = t("srCmpNoUrl"); srCmpUrl.focus(); return; }
  srCmpUrl.value = otherUrl;
  srCmpBtn.disabled = true;
  srSetStep("cmp", "running");
  statusBusy(t("srCmpRunning"));
  try {
    if (!srState.order) {
      await bg("injectAxe");
      const r = await bg("srTree");
      if (!r || r.error) throw new Error(r?.error || "no result");
      srState.order = r;
      renderSrRows(r.rows, srOrderList, srIssuesOnly.checked);
    }
    if (!srState.lang) { srState.lang = await bg("langCheck"); renderLang(srState.lang); }
    const other = await bg("srCompare", { url: otherUrl });
    if (!other || !other.order || other.order.error) throw new Error(other?.order?.error || "no result from the other page");
    if (!srState.order) throw new Error(t("srCmpNavigated")); // srOnNavigated() cleared the results while the hidden tab loaded
    const differences = srCmpDiff(srState.order, srState.lang, other.order, other.lang);
    srState.cmp = { url: srState.order.url, otherUrl: other.url || otherUrl, differences, other: { order: other.order, lang: other.lang } };
    renderCmp();
    srSetStep("cmp", differences.length ? "issues" : "done", differences.length);
    srPersist();
    statusEl.textContent = t("srCmpDone", differences.length);
  } catch (err) {
    srSetStep("cmp", "error");
    statusEl.textContent = t("srCmpFailed") + (err?.message || err);
  } finally {
    srCmpBtn.disabled = false;
  }
}
srCmpBtn.addEventListener("click", runCompare);
srCmpUrl.addEventListener("keydown", (e) => { if (e.key === "Enter") runCompare(); });
srCmpPrefill().catch(() => {});

/* ---- 5. browser accessibility tree (chrome.debugger) ---- */

async function fetchAxTree() {
  srAxBtn.disabled = true;
  srSetStep("ax", "running");
  statusBusy(t("srAxRunning"));
  try {
    const r = await bg("axTree");
    srState.ax = r;
    srState.restored = null;
    renderSrRows(r.rows, srAxList, srIssuesOnly.checked);
    renderSrScore();
    document.getElementById("srAxStats").textContent = t("srAxStatsFmt", r.summary, r.truncated);
    srSetStep("ax", r.summary.issues ? "issues" : "done", r.summary.issues);
    srPersist();
    statusEl.textContent = t("srAxDone");
  } catch (err) {
    const m = err?.message || String(err);
    srSetStep("ax", "error");
    if (m === "permission-needed") {
      statusEl.textContent = "";
      srGrantNote(srAxList, t("srAxPermission"));
    } else {
      statusEl.textContent = t("srAxFailed") + m;
      srEmpty(srAxList, m);
    }
  } finally {
    srAxBtn.disabled = false;
  }
}
srAxBtn.addEventListener("click", fetchAxTree);
bg("axTreeAvailable").then((ok) => {
  srDebuggerAvailable = !!ok;
  if (!ok) {
    srAxBtn.disabled = true;
    document.getElementById("srAxNote").textContent = t("srAxUnavailable");
    srReflowBtn.disabled = true;
    document.getElementById("srReflowNote").textContent = t("srReflowUnavailable");
  }
}).catch(() => {});

/* ---- score + "Top 5 to fix" card ----
   100 minus weighted issues across every section that has run. Duplicate-name
   and duplicate-landmark findings are penalised once per group (they are one
   fix), the language section is capped so a long bilingual page cannot zero
   the score on its own. */

const SR_W = { critical: 8, serious: 5, moderate: 2, minor: 1 };
const SR_LIVE_W = { silent: 6, risky: 3, rerender: 2 };
const SR_LIVE_LEVEL = { silent: "critical", risky: "serious", rerender: "moderate" };
// Coded live findings override the per-kind weight: a click that toggled a class with no aria state change is serious (5).
const SR_LIVE_CODE_W = { "state-not-announced": 5 };
const SR_LIVE_CODE_LEVEL = { "state-not-announced": "serious" };
const srLiveWeight = (e) => SR_LIVE_CODE_W[e.code] || SR_LIVE_W[e.kind];
const srLiveLevel = (e) => SR_LIVE_CODE_LEVEL[e.code] || SR_LIVE_LEVEL[e.kind];
const SR_LANG_CAP = 30;
const SR_NTC_W = 5, SR_NTC_CAP = 20; // one serious per control, capped so a long form cannot zero the score
const SR_REFLOW_W = { serious: 5, moderate: 2 }, SR_REFLOW_CAP = 25; // reflow / zoom: one broken layout produces many rows; the 320 px and 200 % rows of one element count once
const SR_WIDGET_CAP = 15; // custom widget keyboard probe: serious 5 / moderate 2 (SR_W), capped — synthetic keys are hints, not proof
const SR_SECTIONS = {
  order: { details: "srOrderSection", list: "srOrderList", label: "srScoreSecOrder" },
  live: { details: "srLiveSection", list: "srLiveLog", label: "srScoreSecLive" },
  focus: { details: "srFocusSection", list: "srFocusLog", label: "srScoreSecFocus" },
  lang: { details: "srLangSection", list: "srLangList", label: "srScoreSecLang" },
  ntc: { details: "srNtcSection", list: "srNtcList", label: "srScoreSecNtc" },
  reflow: { details: "srReflowSection", list: "srReflowList", label: "srScoreSecReflow" },
  cmp: { details: "srCmpSection", list: "srCmpList", label: "srScoreSecCmp" },
  ax: { details: "srAxSection", list: "srAxList", label: "srScoreSecAx" },
};
const SR_CMP_W = 2, SR_CMP_CAP = 20;

function srScoreCompute() {
  const o = srState.order, l = srState.live, f = srState.focus, g = srState.lang, a = srState.ax, c = srState.cmp, x = srState.ntc, rf = srState.reflow;
  if (!o && !l.log.length && !f.log.length && !g && !a && !c && !x && !rf) return null;
  const groups = new Map(); // key -> { section, level, weight, count, sels, title, detail, once }
  const add = (key, section, level, weight, sel, title, detail, once) => {
    let grp = groups.get(key);
    if (!grp) { grp = { section, level, weight: 0, count: 0, sels: [], title, detail, once: !!once }; groups.set(key, grp); }
    grp.count++;
    if (sel && !grp.sels.includes(sel)) grp.sels.push(sel);
    if (!once || grp.weight === 0) grp.weight += weight;
    if (LEVEL_RANK[level] < LEVEL_RANK[grp.level]) grp.level = level;
  };
  const noName = t("srScoreNoName");
  const treeRows = (rows, section, seen) => {
    let n = 0;
    for (const r of rows) {
      for (const i of r.issues) {
        const k = section + "|" + i.code + "|" + (r.sel || "");
        if (seen.has(k)) continue; // same element already counted in the reading order
        seen.add(k);
        n++;
        const nm = (r.name || "").toLowerCase();
        const key = i.code === "dup-landmark" ? `${section}|dup-landmark|${r.role}` : `${section}|${i.code}|${r.role}|${nm}`;
        add(key, section, i.level, SR_W[i.level] || 1, r.sel, r.name ? `"${r.name}"` : noName, i.msg, i.code === "dup-name" || i.code === "dup-landmark");
        const grp = groups.get(key);
        grp.role = r.role;
      }
    }
    return n;
  };
  const breakdown = {};
  const seen = new Set();
  if (o) breakdown.order = treeRows(o.rows, "order", seen);
  if (a) {
    // count the browser tree only for elements the reading order did not already flag
    const seenAx = new Set([...seen].map((k) => k.replace(/^order\|/, "ax|")));
    breakdown.ax = treeRows(a.rows, "ax", seenAx);
  }
  if (l.log.length) {
    let n = 0;
    for (const e of l.log) {
      if (srRouteIssue(e)) {
        n++;
        add("live|" + e.code, "live", srRouteLevel(e), srRouteWeight(e), e.sel, srKindLabel("route") + " " + e.code.replace(/^route-/, ""), e.text + (e.note ? " — " + srLiveNote(e) : ""));
        continue;
      }
      if (!SR_LIVE_W[e.kind]) continue;
      n++;
      if (e.code === "state-not-announced") { add("live|state-not-announced|" + (e.attr || ""), "live", srLiveLevel(e), srLiveWeight(e), e.sel, t("srStateLbl") + " " + (e.attr || "missing"), `"${e.text}"` + (e.note ? " — " + e.note : "")); continue; }
      add("live|" + e.kind, "live", srLiveLevel(e), srLiveWeight(e), e.sel,
        srKindLabel(e.kind), `"${e.text}"` + (e.note ? " — " + e.note : ""));
    }
    breakdown.live = n;
  }
  if (f.log.length) {
    let n = 0;
    for (const e of f.log) {
      for (const i of e.issues || []) {
        n++;
        add("focus|" + i.code + "|" + (e.role || ""), "focus", i.level, SR_W[i.level] || 1, e.sel && e.sel !== "body" ? e.sel : "", `${e.role || ""} ${e.name ? '"' + e.name + '"' : noName}`.trim(), i.msg);
      }
    }
    breakdown.focus = n;
  }
  if (g) {
    for (const i of g.issues) {
      const w = i.type.startsWith("html-") ? 8 : i.type === "text-mismatch" ? 3 : SR_W[i.level] || 1;
      add("lang|" + i.type, "lang", i.level, w, i.sel, i.type, (i.snippet ? `“${i.snippet}” — ` : "") + i.msg);
    }
    breakdown.lang = g.issues.length;
  }
  if (x) {
    for (const i of x.issues) add("ntc|" + i.kind + "|" + (i.role || ""), "ntc", i.level, SR_NTC_W, i.sel, `${i.role || ""} ${i.name ? '"' + i.name + '"' : noName}`.trim(), i.msg);
    for (const grp of groups.values()) if (grp.section === "ntc") grp.role = undefined;
    breakdown.ntc = x.issues.length;
  }
  if (rf) {
    for (const i of rf.findings) add("reflow|" + i.code.replace(/-200$/, "") + "|" + (i.sel || i.tag || "") + "|" + (i.sel2 || ""), "reflow", i.level, SR_REFLOW_W[i.level] || 2, i.sel, t("srReflowCode")[i.code] || i.code, srIssueMsg(i), true);
    breakdown.reflow = rf.findings.length;
  }
  if (c) {
    for (const d of c.differences) {
      add("cmp|" + d.code + "|" + (d.row.role || ""), "cmp", d.level, SR_CMP_W, d.side === "this" ? d.row.sel : "", `${d.row.role || ""} ${d.row.name ? '"' + d.row.name + '"' : ""}`.trim(), srCmpMsg(d));
    }
    breakdown.cmp = c.differences.length;
  }
  let penalty = 0, langPenalty = 0, cmpPenalty = 0, ntcPenalty = 0, widgetPenalty = 0, reflowPenalty = 0;
  for (const [key, grp] of groups) {
    if (grp.section === "lang") langPenalty += grp.weight; else if (grp.section === "cmp") cmpPenalty += grp.weight; else if (grp.section === "ntc") ntcPenalty += grp.weight;
    else if (grp.section === "reflow") reflowPenalty += grp.weight;
    else if (key.startsWith("focus|widget-")) widgetPenalty += grp.weight; else penalty += grp.weight;
  }
  penalty += Math.min(langPenalty, SR_LANG_CAP) + Math.min(cmpPenalty, SR_CMP_CAP) + Math.min(ntcPenalty, SR_NTC_CAP) + Math.min(widgetPenalty, SR_WIDGET_CAP) + Math.min(reflowPenalty, SR_REFLOW_CAP);
  const score = Math.max(0, Math.round(100 - penalty));
  const verdict = score >= 90 ? "pass" : score >= 70 ? "warn" : "fail";
  const top = [...groups.values()].sort((x, y) => y.weight - x.weight || LEVEL_RANK[x.level] - LEVEL_RANK[y.level]).slice(0, 5)
    .map((grp) => ({ section: grp.section, level: grp.level, weight: grp.weight, count: grp.count, sels: grp.sels, detail: grp.detail,
      title: grp.role ? `${grp.title} ${grp.count > 1 ? "×" + grp.count + " " + grp.role + "s" : grp.role}` : grp.count > 1 ? `${grp.title} ×${grp.count}` : grp.title }));
  return { score, verdict, penalty: Math.round(penalty), breakdown, top };
}

// While a stored snapshot is shown (no fresh reading order yet) keep its numbers — the
// live computation only sees the restored logs, not the sections that produced the score.
function srScoreCurrent() {
  const live = srScoreCompute();
  return srState.restored && srState.restored.score ? { ...srState.restored.score, top: live ? live.top : [], restored: true } : live;
}

function srJumpTo(section, sel) {
  const cfg = SR_SECTIONS[section];
  const details = document.getElementById(cfg.details);
  if (details) details.open = true;
  const list = document.getElementById(cfg.list);
  let row = null;
  if (list && sel) for (const el of list.querySelectorAll("[data-sr-sel]")) if (el.dataset.srSel === sel) { row = el; break; }
  if (list && sel && !row) for (const el of list.querySelectorAll("[data-sr-sels]")) if (el.dataset.srSels.split("\n").includes(sel)) { row = el; break; }
  const target = row || details;
  if (!target) return;
  const more = row && row.querySelector(":scope > details.sr-more");
  if (more) more.open = true;
  target.scrollIntoView({ block: row ? "center" : "start", behavior: "smooth" });
  if (row) { row.classList.remove("sr-flash"); void row.offsetWidth; row.classList.add("sr-flash"); }
}

function renderSrScore() {
  updateExportVisibility();
  const sc = srScoreCurrent();
  srUpdateBadge(sc);
  renderOverview();
  srScoreCard.textContent = "";
  srScoreCard.hidden = !sc;
  if (sc) document.getElementById("srIntro").hidden = true;
  if (!sc) return;
  const num = document.createElement("div");
  num.className = "sr-score-num " + sc.verdict;
  num.textContent = String(sc.score);
  const small = document.createElement("small");
  small.textContent = t("srScoreOf");
  num.appendChild(small);
  const head = document.createElement("div");
  head.className = "sr-score-title";
  head.textContent = t("srScoreTitle");
  const v = document.createElement("span");
  v.className = "dls-verdict " + sc.verdict;
  v.textContent = sc.verdict === "pass" ? t("srScorePass") : sc.verdict === "warn" ? t("srScoreWarn") : t("srScoreFail");
  head.appendChild(v);
  const counts = document.createElement("div");
  counts.className = "sr-score-counts";
  for (const key of Object.keys(SR_SECTIONS)) {
    const n = sc.breakdown[key];
    const has = n !== undefined;
    const c = document.createElement("span");
    c.className = "chip " + (!has ? "" : n ? "fail" : "ok");
    c.textContent = t(SR_SECTIONS[key].label) + ": " + (!has ? t("srScoreNotRun") : n ? t("srScoreIssues", n) : "✓");
    if (has && n) c.classList.add("worse");
    counts.appendChild(c);
  }
  const more = document.createElement("details");
  more.className = "sr-score-more";
  const sum = document.createElement("summary");
  setLabel(sum, "i-chevron", t("srScoreTop") + (sc.top.length ? ` (${sc.top.length})` : ""));
  more.appendChild(sum);
  const ul = document.createElement("ul");
  ul.className = "sr-score-top";
  if (!sc.top.length) {
    const li = document.createElement("li");
    li.className = "sr-no-issues";
    li.textContent = t("srScoreClean");
    ul.appendChild(li);
  }
  sc.top.forEach((e, i) => {
    const li = document.createElement("li");
    li.title = t("srScoreHint");
    const rank = document.createElement("span");
    rank.className = "sr-rank";
    rank.textContent = String(i + 1);
    const w = document.createElement("span");
    w.className = "sr-weight " + e.level;
    w.textContent = "−" + e.weight;
    const body = document.createElement("span");
    const b = document.createElement("b");
    b.textContent = e.title;
    body.appendChild(b);
    const where = document.createElement("span");
    where.className = "sr-where";
    where.textContent = "· " + t(SR_SECTIONS[e.section].label);
    body.append(" ", where);
    const d = document.createElement("div");
    d.className = "sr-issue " + e.level;
    d.textContent = e.detail;
    body.appendChild(d);
    li.append(rank, w, body);
    li.addEventListener("click", () => {
      if (e.sels.length) highlight([e.sels[0]]);
      srJumpTo(e.section, e.sels[0]);
    });
    ul.appendChild(li);
  });
  more.appendChild(ul);
  const main = document.createElement("div");
  main.className = "sr-score-main";
  main.append(head, counts);
  if (sc.restored && srState.restored) {
    const r = document.createElement("div");
    r.className = "sr-restored";
    r.textContent = t("srRestored", srFmtTime(srState.restored.at));
    r.title = t("srRestoredTitle");
    main.appendChild(r);
  }
  srScoreCard.append(num, main, more);
}

/* ---- 🎞 journey transcript ----
   After a flow recording, merge the focus trace and live log (both stamped with wall-clock `at`)
   with the flow's page markers into one chronological transcript: what a screen reader user
   heard, step by step, and where they heard nothing they should have. */

const SR_QUIET_MS = 5000;

function srJourneyBuild() {
  const startAt = flowJourney.startAt, stopAt = flowJourney.stopAt || Date.now();
  if (!startAt) return null;
  const inWindow = (e) => e.at && e.at >= startAt - 50 && e.at <= stopAt + 50;
  const events = [];
  for (const e of srState.focus.log) if (e.kind !== "nav" && e.kind !== "walk" && inWindow(e)) events.push({ src: "focus", e });
  for (const e of srState.live.log) if (e.kind !== "nav" && inWindow(e)) events.push({ src: "live", e });
  events.sort((x, y) => x.e.at - y.e.at || (x.src === "focus" ? -1 : 1));
  const pages = flowJourney.pages.filter((p) => p.label).map((p) => ({ at: p.at, label: p.label }));
  if (!pages.length) pages.push({ at: startAt, label: (srState.order && srState.order.url) || "/" });
  const pageAt = (at) => { let cur = pages[0]; for (const p of pages) if (p.at <= at) cur = p; return cur.label; };
  const noName = t("srJourneyNoName");
  const steps = [], gaps = [];
  const push = (step) => { step.i = steps.length; step.gaps = step.gaps || []; steps.push(step); return step; };
  const addGap = (step, kind, level, msg) => { step.gaps.push({ kind, level, msg }); gaps.push({ step: step.i, t: step.t, page: step.page, kind, level, msg, sel: step.sel || "" }); };
  let lastAnnouncedAt = startAt;
  let pi = 0;
  const flushPages = (upTo) => {
    while (pi < pages.length && pages[pi].at <= upTo) {
      push({ type: "nav", kind: "nav", t: Math.max(0, pages[pi].at - startAt), page: pages[pi].label, text: t("srJourneyNav", pages[pi].label), sel: "" });
      pi++;
    }
  };
  for (const { src, e } of events) {
    flushPages(e.at);
    const base = { t: e.at - startAt, page: pageAt(e.at), sel: e.sel || "", html: e.html };
    if (src === "focus") {
      const codes = (e.issues || []).map((i) => i.code);
      const lost = codes.includes("focus-lost");
      const step = push({ ...base, type: "focus", kind: lost ? "focus-lost" : "focus",
        text: lost ? t("srGapFocusLost").split(" — ")[0].toLowerCase() : (srAnnouncement(e) || noName), lang: srLangOf(e),
        issues: (e.issues || []).map((i) => i.level + ": " + i.msg) });
      if (lost) addGap(step, "focus-lost", "serious", t("srGapFocusLost"));
      else lastAnnouncedAt = e.at;
      if (codes.includes("modal-escape")) addGap(step, "modal-escape", "critical", t("srGapModalEscape"));
    } else {
      const quietSec = Math.round((e.at - lastAnnouncedAt) / 100) / 10;
      if (e.kind === "announced" || e.kind === "focused") {
        push({ ...base, type: "live", kind: "announced", text: `[${e.politeness || "polite"}] ${e.text}` });
        lastAnnouncedAt = e.at;
      } else if (e.kind === "risky") {
        const step = push({ ...base, type: "live", kind: "risky", text: `[${e.politeness || "polite"}] ${e.text}` });
        addGap(step, "risky", "serious", t("srGapRisky"));
        lastAnnouncedAt = e.at;
      } else if (e.kind === "silent" && e.code === "state-not-announced") {
        const step = push({ ...base, type: "live", kind: "silent", code: e.code, text: e.text });
        addGap(step, "state-not-announced", "serious", t("srGapState", e.attr || "aria-pressed"));
      } else if (e.kind === "silent") {
        const step = push({ ...base, type: "live", kind: "silent", text: e.text });
        addGap(step, "silent", "critical", t("srGapSilent"));
        if (e.at - lastAnnouncedAt > SR_QUIET_MS) addGap(step, "quiet", "serious", t("srGapQuiet", quietSec));
      } else if (e.kind === "rerender") {
        const step = push({ ...base, type: "live", kind: "rerender", text: t("srJourneyRerender", e.text) });
        if (e.at - lastAnnouncedAt > SR_QUIET_MS) addGap(step, "quiet", "serious", t("srGapQuiet", quietSec));
      } else if (e.kind === "route") {
        const step = push({ ...base, type: "live", kind: "route", code: e.code, text: e.flow ? e.text : t("srJourneyRoute", e.text) + " — " + srRouteDetail(e) });
        if (SR_ROUTE_GAP[e.code]) addGap(step, e.code, srRouteLevel(e), t(SR_ROUTE_GAP[e.code]));
        else if (e.code === "route-ok") lastAnnouncedAt = e.at;
      }
    }
  }
  flushPages(stopAt);
  return { steps, gaps, pages: pages.map((p) => p.label), duration: stopAt - startAt, startAt, stopAt };
}

const srJourneyTime = (ms) => (ms / 1000).toFixed(1).padStart(5) + "s";

// Plain text, one line per step, the way a screen reader transcript reads: "[  3.2s] /cart  Read more, link".
function srJourneyText(j) {
  const lines = [`${t("srJourneyTitle")} — ${j.pages.join(" → ")} — ${(j.duration / 1000).toFixed(1)}s, ${j.steps.length} step(s), ${j.gaps.length} gap(s)`, `[  0.0s] ── ${t("srJourneyStart")} ──`];
  for (const s of j.steps) {
    if (s.type === "nav") { lines.push(`[${srJourneyTime(s.t)}] ── ${s.text} ──`); continue; }
    lines.push(`[${srJourneyTime(s.t)}] ${s.page}  ${s.text}` + (s.gaps.length ? "  ✗ " + s.gaps.map((g) => g.msg).join(" ✗ ") : ""));
  }
  lines.push(`[${srJourneyTime(j.duration)}] ── ${t("srJourneyEnd")} ──`);
  return lines.join("\n");
}

function renderJourney() {
  const j = srState.journey;
  srJourneySection.hidden = !j;
  srJourneyList.textContent = "";
  srJourneyStats.textContent = "";
  if (!j) return;
  srJourneyStats.textContent = t("srJourneyStats", j);
  if (!j.steps.some((s) => s.type !== "nav")) { srEmpty(srJourneyList, t("srJourneyEmpty")); return; }
  const frag = document.createDocumentFragment();
  const hint = document.createElement("p");
  hint.className = "sr-empty";
  hint.textContent = t("srJourneyHint");
  frag.appendChild(hint);
  for (const s of j.steps) {
    const row = document.createElement("div");
    const worst = s.gaps.map((g) => g.level).sort((a, b) => (LEVEL_RANK[a] ?? 9) - (LEVEL_RANK[b] ?? 9))[0];
    row.className = "sr-journey-step" + (s.type === "nav" ? " nav" : "") + (s.gaps.length ? " gap level-" + worst : "");
    const num = document.createElement("span");
    num.className = "sr-journey-num";
    num.textContent = s.type === "nav" ? "" : String(s.i + 1);
    const time = document.createElement("span");
    time.className = "sr-time";
    time.textContent = (s.t / 1000).toFixed(1) + "s";
    const page = document.createElement("code");
    page.className = "sr-journey-page";
    page.textContent = s.page;
    const body = document.createElement("span");
    body.className = "sr-journey-text";
    if (s.type !== "nav") {
      const k = document.createElement("span");
      k.className = "sr-kind " + (s.kind === "focus-lost" ? "silent" : s.kind === "focus" ? "focused" : s.kind);
      k.textContent = srKindLabel(s.kind);
      body.appendChild(k);
      body.append(" ");
    }
    body.append(s.text);
    if (s.sel && s.type !== "nav") body.append(" ", srCode(s.sel));
    row.append(num, time, page, body);
    if (s.gaps.length) row.dataset.srCodes = s.gaps.map((g) => g.code || g.kind || "").join(" ");
    for (const g of s.gaps) {
      const d = document.createElement("div");
      d.className = "sr-journey-gap " + g.level;
      d.textContent = g.msg;
      row.appendChild(d);
    }
    if (s.sel && s.type !== "nav") {
      row.dataset.srSel = s.sel;
      row.title = t("srJourneyHint");
      row.addEventListener("click", (ev) => { if (ev.target.closest("code")) return; highlight([s.sel]); });
    }
    frag.appendChild(row);
  }
  srJourneyList.appendChild(frag);
}

srJourneyCopyBtn.addEventListener("click", async () => {
  if (!srState.journey) return;
  const text = srJourneyText(srState.journey);
  try { await navigator.clipboard.writeText(text); } catch (_) {
    // clipboard blocked (no user gesture / permission) — fall back to a selectable block
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (__) {} ta.remove();
  }
  setLabel(srJourneyCopyBtn, "i-check", t("srJourneyCopied"));
  setTimeout(() => { setLabel(srJourneyCopyBtn, "i-copy", t("srJourneyCopy")); }, 1200);
});

/* ---- export / reset glue ---- */

// JSON export: the same results without the reflow screenshots (two data URLs would dwarf the report).
function srExportWithoutShots(sr) {
  return sr && sr.reflow ? { ...sr, reflow: { ...sr.reflow, shots: undefined } } : sr;
}

function srResultsForExport() {
  const o = srState.order, l = srState.live, f = srState.focus, g = srState.lang, a = srState.ax, j = srState.journey, c = srState.cmp, x = srState.ntc, rf = srState.reflow;
  if (!o && !l.log.length && !f.log.length && !g && !a && !j && !c && !x && !rf) return null;
  const sc = srScoreCompute();
  return {
    journey: j ? { duration: j.duration, pages: j.pages, transcript: srJourneyText(j),
      steps: j.steps.map((s) => ({ i: s.i, t: s.t, page: s.page, type: s.type, text: s.text, sel: s.sel, kind: s.kind, gaps: s.gaps.map((g) => g.msg) })),
      gaps: j.gaps.map((g) => ({ step: g.step, t: g.t, page: g.page, kind: g.kind, level: g.level, msg: g.msg, sel: g.sel })) } : null,
    score: sc ? { score: sc.score, verdict: sc.verdict, penalty: sc.penalty, breakdown: sc.breakdown, top: sc.top.map((e) => ({ title: e.title, section: e.section, level: e.level, weight: e.weight, count: e.count, sels: e.sels, detail: e.detail })) } : null,
    readingOrder: o ? { url: o.url, summary: o.summary, issues: srGroupRows(o.rows).map((g) => { const r = g.row; return { sel: r.sel, role: r.role, name: r.name, html: r.html, component: g.component, instances: g.count, selectors: g.sels, code: r.issues[0].code, issues: r.issues.map((i) => i.level + ": " + i.msg), attr: r.issues[0].attr, info: r.issues[0].info, hint: r.issues[0].hint, fix: srFixFor(r.issues[0].code, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag, attr: r.issues[0].attr, info: r.issues[0].info, hint: r.issues[0].hint }) }; }) } : null,
    liveRegions: l.log.length || l.regions.length ? { regions: l.regions, log: l.log.map((e) => e.kind === "silent" || e.kind === "risky" || e.kind === "rerender" || srRouteIssue(e) ? { ...e, fix: srFixFor(e.code || e.kind, { html: e.html, sel: e.sel, text: e.text, tag: e.tag, attr: e.attr, target: e.target, titleAfter: e.titleAfter, h1After: e.h1After, url: e.url }) } : e) } : null,
    focusTrace: f.log.length ? { moves: f.log.length, issues: f.log.filter((e) => e.issues && e.issues.length).map((e) => ({ t: e.t, sel: e.sel, role: e.role, name: e.name, html: e.html, code: e.issues[0].code, issues: e.issues.map((i) => i.level + ": " + i.msg), fix: srFixFor(e.issues[0].code, { html: e.html, sel: e.sel, role: e.role, name: e.name, tag: e.tag, info: e.issues[0].info, container: e.issues[0].container, ...srRingCtx(e) }) })) } : null,
    language: g ? { htmlLang: g.htmlLang, htmlDir: g.htmlDir, majority: g.majority, issues: g.issues.map((i) => ({ ...i, fix: srFixFor(i.type, { html: i.html, sel: i.sel, snippet: i.snippet, declared: i.declared, detected: i.type.startsWith("html-lang") ? g.majority : i.detected }) })) } : null,
    nonTextContrast: x ? { checked: x.checked, issues: x.issues.map((i) => ({ ...i, fix: srFixFor(i.code, srNtcFixCtx(i)) })) } : null,
    reflow: rf ? { summary: rf.summary, findings: rf.findings.map((i) => ({ ...i, msg: srIssueMsg(i), fix: srFixFor(i.code, srReflowFixCtx(i)) })), shots: { base: (rf.shots && rf.shots.base) || "", narrow: (rf.shots && rf.shots.narrow) || "" } } : null,
    bilingual: c ? { url: c.url, otherUrl: c.otherUrl, differences: c.differences.map((d) => { const other = (sel) => d.side === "this" || !sel ? sel : c.otherUrl + " " + sel; return { kind: d.kind, code: d.code, level: d.level, side: d.side, msg: srCmpMsg(d, true), role: d.row.role, name: d.row.name || "", sel: other(d.row.sel || ""), html: d.row.html || "", instances: d.count, selectors: (d.sels || []).map(other),
      fix: d.fixCode ? srFixFor(d.fixCode, { html: d.row.html, sel: d.row.sel, role: d.row.role, name: d.row.name, tag: d.row.tag, declared: d.declared, detected: d.detected }) : null }; }) } : null,
    browserTree: a ? { summary: a.summary, issues: srGroupRows(a.rows).map((g) => { const r = g.row; return { sel: r.sel, role: r.role, name: r.name, component: g.component, instances: g.count, selectors: g.sels, code: r.issues[0].code, issues: r.issues.map((i) => i.level + ": " + i.msg), fix: srFixFor(r.issues[0].code, { sel: r.sel, role: r.role, name: r.name }) }; }) } : null,
  };
}

function srSectionHtml() {
  const r = srResultsForExport();
  if (!r) return "";
  const color = { critical: "#d32f2f", serious: "#e65100", moderate: "#b68a35", minor: "#616161" };
  const li = (issues) => issues.map((s) => { const lvl = s.split(":")[0]; return `<li style="color:${color[lvl] || "#333"}">${escHtml(s)}</li>`; }).join("");
  const block = (title, items, fmt) => items && items.length ? `
  <h3 style="font-size:14px;margin:16px 0 6px">${title} — ${items.length}</h3>
  ${items.slice(0, 150).map(fmt).join("")}` : "";
  const fixHtml = (x) => x.fix ? `<div style="border-left:4px solid #2e7d32;background:#f2f8f2;border-radius:4px;padding:6px 10px;margin-top:6px"><div style="color:#2e7d32;font-weight:700;font-size:12px">Suggested fix${x.fix.framework && x.fix.framework !== "html" ? " (" + SR_FW_LABEL[x.fix.framework] + ")" : ""}</div><code style="display:block;white-space:pre-wrap;word-break:break-all;font-size:12px">${escHtml(x.fix.snippet)}</code><div style="color:#557755;font-size:12px;margin-top:2px">${escHtml(x.fix.note)}</div></div>` : "";
  const grp = (x) => x.instances > 1 ? ` <span style="font-size:10px;font-weight:700;color:#fff;background:#616161;border-radius:3px;padding:1px 5px">×${x.instances} identical</span>` : "";
  const grpSels = (x) => x.instances > 1 && x.selectors && x.selectors.length > 1 ? `<div style="font-size:11px;color:#555;margin-top:4px">${x.instances} instances: ${x.selectors.map((s) => `<code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(s)}</code>`).join(" ")}</div>` : "";
  const nodeFmt = (x) => `<div style="border-top:1px solid #eee;padding:6px 0"><b>${escHtml(x.component ? x.component + " · " + x.role : x.role)}</b>${grp(x)} ${x.name ? "“" + escHtml(x.name) + "”" : "<i>(no name)</i>"} <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(x.sel || "")}</code>${grpSels(x)}${x.html ? `<code style="display:block;background:#f6f6f6;padding:4px 8px;border-radius:4px;white-space:pre-wrap;word-break:break-all;margin-top:4px">${escHtml(x.html)}</code>` : ""}<ul style="margin:2px 0 0 18px">${li(x.issues)}</ul>${fixHtml(x)}</div>`;
  const parts = [];
  if (r.journey) {
    const j = r.journey;
    const gapColor = { critical: "#d32f2f", serious: "#e65100", moderate: "#b68a35" };
    parts.push(`<h3 style="font-size:14px;margin:16px 0 6px">🎞 Journey transcript — ${j.steps.length} step(s), ${j.pages.length} page/state(s), ${(j.duration / 1000).toFixed(1)}s, ${j.gaps.length} gap(s)</h3>
  <table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr style="background:#f3f5f7"><th style="text-align:start;padding:4px 6px">#</th><th style="text-align:start;padding:4px 6px">Time</th><th style="text-align:start;padding:4px 6px">Page</th><th style="text-align:start;padding:4px 6px">Announced</th><th style="text-align:start;padding:4px 6px">Gap</th></tr></thead><tbody>${
      j.steps.slice(0, 400).map((s) => {
        const worst = s.gaps.length ? (j.gaps.filter((g) => g.step === s.i).map((g) => g.level).sort((a, b) => (LEVEL_RANK[a] ?? 9) - (LEVEL_RANK[b] ?? 9))[0] || "serious") : "";
        const bg = s.gaps.length ? "background:#fdecea;" : s.type === "nav" ? "background:#f3f5f7;font-weight:600;" : "";
        return `<tr style="border-top:1px solid #eee;${bg}"><td style="padding:3px 6px;color:#777">${s.i + 1}</td><td style="padding:3px 6px;font-family:ui-monospace,Menlo,monospace;white-space:nowrap">${(s.t / 1000).toFixed(1)}s</td><td style="padding:3px 6px"><code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(s.page)}</code></td><td style="padding:3px 6px">${escHtml(s.text)}${s.sel && s.type !== "nav" ? ` <code style="background:#eef2f6;border-radius:3px;padding:0 4px;font-size:11px">${escHtml(s.sel)}</code>` : ""}</td><td style="padding:3px 6px;color:${gapColor[worst] || "#d32f2f"};font-weight:600">${s.gaps.map(escHtml).join("<br>")}</td></tr>`;
      }).join("")}</tbody></table>
  <details style="margin:6px 0"><summary style="cursor:pointer;font-size:12px">Plain-text transcript</summary><pre style="white-space:pre-wrap;font-size:11px;background:#f6f6f6;padding:8px;border-radius:4px">${escHtml(j.transcript)}</pre></details>`);
  }
  if (r.readingOrder) {
    const s = r.readingOrder.summary;
    parts.push(`<p>Reading order: ${s.rows} nodes · ${s.interactive} interactive · ${s.headings} headings · ${s.landmarks} landmarks · ${s.images} images · ${s.issues} issue(s)</p>` +
      block("Accessible-name issues", r.readingOrder.issues, nodeFmt));
  }
  if (r.liveRegions) {
    const log = r.liveRegions.log.filter((e) => e.kind !== "nav");
    const routes = log.filter((e) => e.kind === "route");
    parts.push(`<p>Live regions on load: ${r.liveRegions.regions.length}. Monitored updates: ${log.length} (${log.filter((e) => e.kind === "announced").length} announced, ${log.filter((e) => e.kind === "silent").length} silent, ${log.filter((e) => e.kind === "risky").length} may be missed${routes.length ? `, ${routes.length} navigation(s) — ${routes.filter(srRouteIssue).length} silent/stale` : ""})</p>` +
      block("Silent or risky updates", log.filter((e) => e.kind === "silent" || e.kind === "risky" || e.kind === "rerender" || srRouteIssue(e)),
        (e) => `<div style="border-top:1px solid #eee;padding:6px 0"><b style="color:${e.kind === "silent" || e.code === "route-silent" ? "#d32f2f" : "#e65100"}">${escHtml(e.kind === "route" ? "NAVIGATION · " + e.code : e.kind.toUpperCase())}</b> ${(e.t / 1000).toFixed(1)}s “${escHtml(e.text)}” <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(e.sel || "")}</code>${e.kind === "route" && !e.flow ? `<div style="color:#555;font-size:12px">${escHtml(srRouteDetail(e))}</div>` : ""}${e.note ? `<div style="color:#777;font-size:12px">${escHtml(srLiveNote(e))}</div>` : ""}${fixHtml({ fix: srFixFor(e.code || e.kind, { html: e.html, sel: e.sel, text: e.text, tag: e.tag, attr: e.attr, target: e.target, titleAfter: e.titleAfter, h1After: e.h1After, url: e.url }) })}</div>`));
  }
  if (r.focusTrace) {
    parts.push(`<p>Focus trace: ${r.focusTrace.moves} focus move(s), ${r.focusTrace.issues.length} with issues</p>` +
      block("Focus issues", r.focusTrace.issues, (x) => `<div style="border-top:1px solid #eee;padding:6px 0">${(x.t / 1000).toFixed(1)}s <b>${escHtml(x.role)}</b> ${x.name ? "“" + escHtml(x.name) + "”" : "<i>(no name)</i>"} <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(x.sel || "")}</code><ul style="margin:2px 0 0 18px">${li(x.issues)}</ul>${fixHtml(x)}</div>`));
  }
  if (r.language) {
    parts.push(`<p>Language: html lang="${escHtml(r.language.htmlLang || "")}" dir="${escHtml(r.language.htmlDir || "")}" — page is mostly ${escHtml(r.language.majority)}</p>` +
      block("Language / voice-switching issues", r.language.issues, (i) => `<div style="border-top:1px solid #eee;padding:6px 0"><b style="color:${color[i.level]}">${escHtml(i.type)}</b> ${i.snippet ? "“" + escHtml(i.snippet) + "” " : ""}<code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(i.sel)}</code><div style="font-size:13px">${escHtml(i.msg)}</div>${fixHtml(i)}</div>`));
  }
  if (r.nonTextContrast) {
    const sw = (h) => `<span style="display:inline-block;width:11px;height:11px;border:1px solid #999;border-radius:2px;vertical-align:middle;background:${escHtml(h)}"></span>`;
    parts.push(`<p>Non-text contrast (WCAG 1.4.11): ${r.nonTextContrast.checked} control(s) measured, ${r.nonTextContrast.issues.length} under 3:1</p>` +
      block("Control borders, toggles and icons under 3:1", r.nonTextContrast.issues, (i) => `<div style="border-top:1px solid #eee;padding:6px 0"><b style="color:${color[i.level]}">${escHtml(i.role || i.tag)}</b> ${i.name ? "“" + escHtml(i.name) + "” " : ""}<span dir="ltr">${escHtml(i.kind)} ${sw(i.color)} <code>${escHtml(i.color)}</code> on ${sw(i.bg)} <code>${escHtml(i.bg)}</code> · <b>${Number(i.ratio).toFixed(2)}:1</b></span> <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(i.sel)}</code><div style="font-size:13px">${escHtml(i.msg)}</div>${fixHtml(i)}</div>`));
  }
  if (r.reflow) {
    const s = r.reflow.summary || {}, sh = r.reflow.shots || {};
    const fig = (src, cap) => src ? `<figure style="margin:0;font-size:11px;color:#666"><img src="${src}" alt="${escHtml(cap)}" style="display:block;max-height:260px;max-width:100%;border:1px solid #ddd;border-radius:4px;background:#fff"><figcaption>${escHtml(cap)}</figcaption></figure>` : "";
    parts.push(`<p>Reflow &amp; zoom (WCAG 1.4.10 / 1.4.4): page ${escHtml(String(s.scrollWidth || ""))} px wide at a 320 px viewport — ${r.reflow.findings.length} issue(s)</p>` +
      (sh.base || sh.narrow ? `<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start;margin:6px 0">${fig(sh.base, "Before (" + (s.baseWidth || "") + " px)")}${fig(sh.narrow, "320 px viewport")}</div>` : "") +
      block("Reflow / zoom issues", r.reflow.findings, (i) => `<div style="border-top:1px solid #eee;padding:6px 0"><b style="color:${color[i.level]}">${escHtml(i.code)}</b> ${i.name ? "“" + escHtml(i.name) + "” " : ""}<code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(i.sel)}</code>${i.sel2 ? " ↔ <code style=\"background:#eef2f6;border-radius:3px;padding:0 4px\">" + escHtml(i.sel2) + "</code>" : ""}<div style="font-size:13px">${escHtml(i.msg)}</div>${fixHtml(i)}</div>`));
  }
  if (r.bilingual) {
    const b = r.bilingual;
    parts.push(`<p>Bilingual comparison: <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(b.url)}</code> ↔ <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(b.otherUrl)}</code> — ${b.differences.length} difference(s)</p>` +
      block("Differences between the language versions", b.differences, (d) => `<div style="border-top:1px solid #eee;padding:6px 0"><span style="font-size:10px;font-weight:700;color:#fff;background:${d.side === "this" ? "#2e7d32" : "#b68a35"};border-radius:3px;padding:1px 5px">${d.side === "this" ? "THIS PAGE" : "OTHER PAGE"}</span> <b>${escHtml(d.role)}</b>${grp(d)} ${d.name ? "“" + escHtml(d.name) + "”" : "<i>(no name)</i>"} <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(d.sel)}</code><div style="color:${color[d.level] || "#333"};font-size:13px">${escHtml(d.msg)}</div>${fixHtml(d)}</div>`));
  }
  if (r.browserTree) {
    const s = r.browserTree.summary;
    parts.push(`<p>Browser accessibility tree: ${s.rows} exposed of ${s.total} nodes (${s.ignored} ignored)</p>` + block("Browser-tree issues", r.browserTree.issues, nodeFmt));
  }
  let scoreHtml = "";
  if (r.score) {
    const vc = { pass: "#2e7d32", warn: "#b68a35", fail: "#d32f2f" }[r.score.verdict];
    const vl = { pass: "PASS", warn: "WARN", fail: "FAIL" }[r.score.verdict];
    const secLabel = { order: "reading order", live: "live regions", focus: "focus trace", lang: "language", ntc: "non-text contrast", reflow: "reflow", cmp: "bilingual", ax: "browser tree" };
    const counts = Object.keys(secLabel).map((k) => `${secLabel[k]}: ${r.score.breakdown[k] === undefined ? "not run" : r.score.breakdown[k] || "✓"}`).join(" · ");
    scoreHtml = `<div style="display:flex;gap:16px;align-items:flex-start;border:1px solid #ddd;border-radius:6px;padding:10px 14px;margin:8px 0">
    <div style="font-size:32px;font-weight:700;color:${vc};min-width:64px;text-align:center">${r.score.score}<div style="font-size:11px;font-weight:400;color:#666">of 100</div></div>
    <div><b>Screen reader score</b> <span style="color:${vc};font-weight:700">${vl}</span><div style="font-size:12px;color:#555">${escHtml(counts)}</div>
    <div style="font-weight:600;margin-top:6px">Top 5 to fix</div>
    <ol style="margin:2px 0 0 18px;padding:0;font-size:13px">${r.score.top.length ? r.score.top.map((e) => `<li><b>${escHtml(e.title)}</b> <span style="color:#777;font-size:11px">−${e.weight} · ${secLabel[e.section]}</span> <code style="background:#eef2f6;border-radius:3px;padding:0 4px">${escHtml(e.sels[0] || "")}</code><div style="color:${color[e.level] || "#333"};font-size:12px">${escHtml(e.detail)}</div></li>`).join("") : "<li>Nothing to fix.</li>"}</ol></div></div>`;
  }
  return `
  <h2 style="font-size:18px;margin-top:30px">🔊 Screen reader checks</h2>
  ${scoreHtml}${parts.join("")}`;
}

/* ---- "Hear it": spoken announcement playback via window.speechSynthesis ----
   Turns a row (name, role, states) into the phrase a screen reader would say and speaks it
   with a voice matching the row's language (ar-* / en-*). ▶ Play page reads the rendered
   reading-order rows top to bottom, highlighting each element on the page as it goes. */

const srSpeech = {
  ok: !!(window.speechSynthesis && window.SpeechSynthesisUtterance),
  playing: false, paused: false, seq: 0, warned: new Set(), current: null,
};
if (!srSpeech.ok) document.body.classList.add("no-speech");

const SR_ROLE_WORDS = {
  en: { link: "link", button: "button", heading: "heading", textbox: "edit text", searchbox: "search edit text", checkbox: "checkbox",
    radio: "radio button", combobox: "combo box", listbox: "list box", img: "image", image: "image", navigation: "navigation region",
    main: "main region", banner: "banner region", contentinfo: "content information region", complementary: "complementary region",
    search: "search region", region: "region", form: "form region", list: "list", listitem: "list item", table: "table", grid: "grid",
    row: "row", cell: "cell", columnheader: "column header", rowheader: "row header", dialog: "dialog", alertdialog: "alert dialog",
    tab: "tab", tablist: "tab list", tabpanel: "tab panel", menu: "menu", menubar: "menu bar", menuitem: "menu item",
    menuitemcheckbox: "menu item checkbox", menuitemradio: "menu item radio", switch: "switch", slider: "slider", spinbutton: "spin button",
    progressbar: "progress bar", meter: "meter", separator: "separator", article: "article", figure: "figure", group: "group",
    radiogroup: "radio group", alert: "alert", status: "status", log: "log", timer: "timer", tree: "tree", treeitem: "tree item",
    option: "option", toolbar: "tool bar", tooltip: "tooltip", document: "document", scrollbar: "scroll bar", generic: "", text: "", "aria-hidden": "" },
  ar: { link: "رابط", button: "زر", heading: "عنوان", textbox: "حقل نص", searchbox: "حقل بحث", checkbox: "خانة اختيار", radio: "زر اختيار",
    combobox: "قائمة منسدلة", listbox: "قائمة", img: "صورة", image: "صورة", navigation: "منطقة تنقل", main: "المنطقة الرئيسية",
    banner: "منطقة الترويسة", contentinfo: "منطقة معلومات المحتوى", complementary: "منطقة تكميلية", search: "منطقة بحث", region: "منطقة",
    form: "نموذج", list: "قائمة", listitem: "عنصر قائمة", table: "جدول", grid: "شبكة", row: "صف", cell: "خلية", columnheader: "رأس عمود",
    rowheader: "رأس صف", dialog: "مربع حوار", alertdialog: "مربع تنبيه", tab: "تبويب", tablist: "قائمة تبويبات", tabpanel: "لوحة تبويب",
    menu: "قائمة", menubar: "شريط قوائم", menuitem: "عنصر قائمة", switch: "مفتاح", slider: "شريط تمرير", spinbutton: "زر تدوير",
    progressbar: "شريط تقدم", meter: "مقياس", separator: "فاصل", article: "مقالة", figure: "شكل", group: "مجموعة", radiogroup: "مجموعة اختيار",
    alert: "تنبيه", status: "حالة", log: "سجل", tree: "شجرة", treeitem: "عنصر شجرة", option: "خيار", toolbar: "شريط أدوات", tooltip: "تلميح",
    document: "مستند", generic: "", text: "", "aria-hidden": "" },
};
const SR_STATE_WORDS = {
  en: { checked: "checked", "not checked": "not checked", "checked=true": "checked", "checked=false": "not checked", "checked=mixed": "partially checked",
    "expanded=true": "expanded", "expanded=false": "collapsed", "pressed=true": "pressed", "pressed=false": "not pressed", "pressed=mixed": "partially pressed",
    "selected=true": "selected", "selected=false": "not selected", "current=page": "current page", "current=step": "current step", "current=true": "current",
    "haspopup=true": "has popup", "haspopup=menu": "menu", "haspopup=listbox": "has list", "haspopup=dialog": "has dialog", "haspopup=tree": "has tree", "haspopup=grid": "has grid",
    disabled: "unavailable", required: "required", invalid: "invalid entry", readonly: "read only" },
  ar: { checked: "محدد", "not checked": "غير محدد", "checked=true": "محدد", "checked=false": "غير محدد", "checked=mixed": "محدد جزئياً",
    "expanded=true": "موسّع", "expanded=false": "مطوي", "pressed=true": "مضغوط", "pressed=false": "غير مضغوط", "pressed=mixed": "مضغوط جزئياً",
    "selected=true": "محدد", "selected=false": "غير محدد", "current=page": "الصفحة الحالية", "current=step": "الخطوة الحالية", "current=true": "الحالي",
    "haspopup=true": "يحتوي قائمة منبثقة", "haspopup=menu": "قائمة", "haspopup=listbox": "يحتوي قائمة", "haspopup=dialog": "يحتوي مربع حوار",
    disabled: "غير متاح", required: "مطلوب", invalid: "إدخال غير صالح", readonly: "للقراءة فقط" },
};

// Language of a row: its own lang field, else the page language, else guessed from the script of the text.
function srLangOf(r) {
  if (r && r.lang) return r.lang;
  if (/[\u0600-\u06FF]/.test((r && (r.name || r.text)) || "")) return "ar";
  return (srState.order && srState.order.pageLang) || "en";
}

// "<name>, <role>, <states>" the way NVDA/VoiceOver phrase it; text rows are just the text.
function srAnnouncement(r) {
  const lng = srLangOf(r) === "ar" ? "ar" : "en";
  const R = SR_ROLE_WORDS[lng], S = SR_STATE_WORDS[lng];
  const parts = [];
  if (r.name) parts.push(r.name);
  const role = r.role || "";
  const states = r.states || [];
  let roleWord = role in R ? R[role] : role.replace(/[-_]/g, " ");
  if (role === "heading") {
    const lvl = (states.find((x) => /^level \d/.test(x)) || "").replace("level ", "");
    roleWord = lng === "ar" ? `عنوان${lvl ? " مستوى " + lvl : ""}` : `heading${lvl ? " level " + lvl : ""}`;
  }
  if (roleWord) parts.push(roleWord);
  for (const st of states) {
    if (/^level \d/.test(st) || st === "has description") continue;
    const w = st in S ? S[st] : st.replace(/=/, " ");
    if (w) parts.push(w);
  }
  if (r.description) parts.push(r.description);
  if (!parts.length && role === "aria-hidden") return "";
  return parts.join(", ");
}

// Live-log entries: politeness prefix + the announced text. Entries a screen reader would NOT
// announce (silent / may be missed / re-render) are prefixed with their kind instead, so the
// button still tells you what the user missed.
function srLiveAnnouncement(e) {
  const kind = { silent: "silent", risky: "may be missed", focused: "via focus", rerender: "re-render" }[e.kind] || "";
  const pre = e.politeness ? e.politeness + ", " : kind ? kind + ", " : "";
  return pre + (e.text || "");
}

function srVoices() {
  try { return window.speechSynthesis.getVoices() || []; } catch (_) { return []; }
}
function srVoiceFor(lng) {
  const voices = srVoices();
  const want = (lng || "en").toLowerCase();
  const match = voices.filter((v) => (v.lang || "").toLowerCase().replace("_", "-").split("-")[0] === want);
  if (!match.length) {
    if (voices.length && !srSpeech.warned.has(want)) { srSpeech.warned.add(want); statusEl.textContent = t("srNoVoice", want); }
    return null;
  }
  return match.find((v) => v.default) || match.find((v) => v.localService) || match[0];
}
const srRate = () => Math.min(Math.max(parseFloat(settings.srRate) || 1, 0.8), 2);

// Speak one phrase; resolves when it ends (or fails). Cancels anything already speaking.
function srSpeak(text, lng) {
  if (!srSpeech.ok || !text) return Promise.resolve(false);
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch (_) {}
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = srVoiceFor(lng);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : (lng === "ar" ? "ar" : "en");
    u.rate = srRate();
    let done = false;
    const finish = (ok) => { if (done) return; done = true; if (srSpeech.current === u) srSpeech.current = null; resolve(ok); };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    srSpeech.current = u;
    try { synth.speak(u); } catch (_) { finish(false); }
    // Some engines never fire onend for cancelled utterances — poll as a safety net.
    let ticks = 0;
    const tick = setInterval(() => {
      if (done) { clearInterval(tick); return; }
      if (srSpeech.paused) return; // a paused engine reports speaking=false on some platforms — never time out while paused
      if (srSpeech.current !== u || (++ticks > 2 && !synth.speaking && !synth.pending)) { clearInterval(tick); finish(false); }
    }, 500);
  });
}

// The pinned playback bar: the section toolbar scrolls out of view while rows are
// read (each row calls scrollIntoView), so Stop/Pause live here while speech runs.
function srPlayBarShow(on) {
  srPlayBar.hidden = !on;
  document.body.classList.toggle("sr-playing", !!on);
  if (!on) { srBarText.textContent = ""; srBarCount.textContent = ""; }
  srPlayBarSync();
}

function srPlayBarSync() {
  setLabel(srBarPause, srSpeech.paused ? "i-play" : "i-pause", srSpeech.paused ? t("srResume") : t("srPause"));
  setLabel(srBarStop, "i-stop", t("srStop"));
  srBarPause.title = t("srPauseTitle");
  srBarStop.title = t("srStopTitle");
}

function srPlayBarRow(text, i, n) {
  srBarText.textContent = text || "";
  srBarCount.textContent = n ? `${i}/${n}` : "";
}

function srStopSpeech() {
  srSpeech.seq++;
  srSpeech.playing = false;
  srSpeech.current = null;
  if (srSpeech.ok) { try { if (srSpeech.paused) window.speechSynthesis.resume(); window.speechSynthesis.cancel(); } catch (_) {} }
  srSpeech.paused = false;
  for (const el of document.querySelectorAll(".sr-speaking")) el.classList.remove("sr-speaking");
  for (const el of document.querySelectorAll(".sr-speak.speaking")) el.classList.remove("speaking");
  setLabel(srPlayBtn, "i-play", t("srPlay"));
  srPlayBtn.classList.remove("playing", "paused");
  srPlayBarShow(false);
}

// Space while playing: pause/resume (the current row stays highlighted); Esc: stop. Only while the SR tab is visible.
function srTogglePause() {
  if (!srSpeech.playing || !srSpeech.ok) return false;
  const synth = window.speechSynthesis;
  try {
    if (srSpeech.paused) { synth.resume(); srSpeech.paused = false; srPlayBtn.classList.remove("paused"); statusEl.textContent = srSpeech.status || ""; }
    else { synth.pause(); srSpeech.paused = true; srPlayBtn.classList.add("paused"); statusEl.textContent = t("srPaused"); }
    srPlayBarSync();
  } catch (_) { return false; }
  return true;
}
document.addEventListener("keydown", (e) => {
  if (!srSpeech.playing || document.body.dataset.view !== "sr") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable) return;
  if (e.key === "Escape") { e.preventDefault(); srStopSpeech(); statusEl.textContent = t("srPlayDone", srSpeech.played || 0); }
  else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); srTogglePause(); }
});
// Space activates a focused button on keyup — swallow it so the Play button is not re-triggered by the pause key.
document.addEventListener("keyup", (e) => {
  if ((e.key === " " || e.key === "Spacebar") && srSpeech.playing && document.body.dataset.view === "sr" && e.target.tagName === "BUTTON") e.preventDefault();
});

// Speaker button for a row; `speech` is { text, lang, sel }. Hidden (not created) without speechSynthesis.
function srSpeakBtn(speech) {
  if (!srSpeech.ok || !speech.text) return null;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "sr-speak sr-speech";
  b.appendChild(svgIcon("i-speaker"));
  b.title = t("srSpeak") + ": " + speech.text;
  b.setAttribute("aria-label", t("srSpeak"));
  b.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    srStopSpeech();
    const my = ++srSpeech.seq;
    b.classList.add("speaking");
    if (speech.sel) highlight([speech.sel]);
    await srSpeak(speech.text, speech.lang);
    if (srSpeech.seq === my) b.classList.remove("speaking");
  });
  return b;
}

// Rows that playback can reach: rendered ("issues only" is a render-time filter), not hidden by the SR filter box, and speakable.
function srPlayableRows(container) {
  return [...container.querySelectorAll(".sr-row")].filter((el) => !el.hidden && el.__srSpeech && el.__srSpeech.text);
}
function srUpdatePlayScope() {
  const n = srPlayableRows(srOrderList).length;
  srPlayBtn.title = n ? t("srPlayScope", n) : t("srPlayTitle");
}

// Read a list of row elements aloud, top to bottom, highlighting each element on the page. `label` names the scope in the status line.
async function srPlayRows(rows, label) {
  rows = (rows || []).filter((el) => el.__srSpeech && el.__srSpeech.text);
  if (!rows.length) { statusEl.textContent = t("srNothingToPlay"); return; }
  srStopSpeech();
  const my = ++srSpeech.seq;
  srSpeech.playing = true;
  srSpeech.played = 0;
  setLabel(srPlayBtn, "i-stop", t("srStop"));
  srPlayBtn.classList.add("playing");
  srPlayBarShow(true);
  let i = 0;
  for (const el of rows) {
    if (srSpeech.seq !== my) return;
    i++;
    el.classList.add("sr-speaking");
    try { el.scrollIntoView({ block: "nearest" }); } catch (_) {}
    if (el.__srSpeech.sel) highlight([el.__srSpeech.sel]);
    srSpeech.status = t("srPlaying", i, rows.length, label);
    statusEl.textContent = srSpeech.status;
    srPlayBarRow(el.__srSpeech.text, i, rows.length);
    await srSpeak(el.__srSpeech.text, el.__srSpeech.lang);
    srSpeech.played = i;
    el.classList.remove("sr-speaking");
  }
  if (srSpeech.seq !== my) return;
  srSpeech.playing = false;
  srSpeech.paused = false;
  setLabel(srPlayBtn, "i-play", t("srPlay"));
  srPlayBtn.classList.remove("playing", "paused");
  srPlayBarShow(false);
  statusEl.textContent = t("srPlayDone", rows.length);
}

// Play page: every reachable reading-order row (the filter box and "issues only" scope the playback).
async function srPlayPage() {
  if (srSpeech.playing) { srStopSpeech(); return; }
  await srPlayRows(srPlayableRows(srOrderList), "");
}
// "From here": this row and every following reachable row in the same list.
function srRowsFrom(row, container) {
  const all = [...container.querySelectorAll(".sr-row")];
  const i = all.indexOf(row);
  return i < 0 ? [] : all.slice(i).filter((el) => !el.hidden && el.__srSpeech && el.__srSpeech.text);
}
// "This section": this row plus the rows nested under it (depth greater than its own); grouped rows are one row already.
function srRowsSubtree(row, container) {
  const all = [...container.querySelectorAll(".sr-row")];
  const i = all.indexOf(row);
  if (i < 0) return [];
  const out = [row];
  const d = row.__srDepth || 0;
  for (let j = i + 1; j < all.length; j++) {
    if ((all[j].__srDepth || 0) <= d) break;
    out.push(all[j]);
  }
  return out.filter((el) => !el.hidden && el.__srSpeech && el.__srSpeech.text);
}
function srRowBtn(cls, icon, key, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "sr-rowbtn sr-speech " + cls;
  b.appendChild(svgIcon(icon));
  b.title = t(key);
  b.setAttribute("aria-label", t(key));
  b.addEventListener("click", (ev) => { ev.stopPropagation(); onClick(); });
  return b;
}
function srPlayFromBtn(row, container) {
  return srRowBtn("sr-play-from", "i-play-from", "srPlayFrom", () => srPlayRows(srRowsFrom(row, container), t("srPlayingFrom")));
}
function srPlaySubtreeBtn(row, container) {
  return srRowBtn("sr-play-subtree", "i-play-subtree", "srPlaySubtree", () => srPlayRows(srRowsSubtree(row, container), t("srPlayingSubtree")));
}

// "Play from element": pick on the page, then play from the row whose selector equals the picked one or is its closest ancestor.
function srRowForSelector(sel, container) {
  if (!sel) return null;
  let best = null, bestLen = -1;
  for (const el of container.querySelectorAll(".sr-row")) {
    const s = el.__srSpeech && el.__srSpeech.sel;
    if (!s) continue;
    if (s === sel) return el;
    if (sel.startsWith(s + " > ") && s.length > bestLen) { best = el; bestLen = s.length; }
  }
  return best;
}
let srPickPoll = null;
async function srPlayFromPick() {
  if (srSpeech.playing) srStopSpeech();
  clearInterval(srPickPoll);
  if (!srOrderList.querySelector(".sr-row")) { statusEl.textContent = t("srNothingToPlay"); return; }
  try {
    await bg("pickStart");
  } catch (err) {
    statusEl.textContent = t("srPickFailed") + (err?.message || err);
    return;
  }
  statusEl.textContent = t("srPicking");
  srPlayPickBtn.disabled = true;
  let tries = 0;
  srPickPoll = setInterval(async () => {
    tries++;
    try {
      const sel = await bg("pickCheck");
      if (sel) {
        clearInterval(srPickPoll);
        srPlayPickBtn.disabled = false;
        const row = srRowForSelector(sel, srOrderList);
        if (!row) { statusEl.textContent = t("srPickNoRow"); return; }
        try { row.scrollIntoView({ block: "center" }); } catch (_) {}
        row.classList.add("sr-flash");
        setTimeout(() => row.classList.remove("sr-flash"), 1500);
        const rows = srRowsFrom(row, srOrderList);
        if (!rows.length) { statusEl.textContent = t("srPickNoRow"); return; }
        srPlayRows(rows, t("srPlayingPick"));
      } else if (tries > 60) {
        clearInterval(srPickPoll);
        srPlayPickBtn.disabled = false;
        statusEl.textContent = t("srPickCancelled");
      }
    } catch (_) {
      clearInterval(srPickPoll);
      srPlayPickBtn.disabled = false;
    }
  }, 500);
}

function srApplyRate() {
  const v = srRate();
  srRateInput.value = String(v);
  srRateVal.textContent = v.toFixed(1) + "×";
}
srPlayBtn.addEventListener("click", srPlayPage);
srBarStop.addEventListener("click", () => { srStopSpeech(); statusEl.textContent = t("srPlayDone", srSpeech.played || 0); });
srBarPause.addEventListener("click", srTogglePause);
srPlayPickBtn.addEventListener("click", srPlayFromPick);
srRateInput.addEventListener("input", () => {
  settings.srRate = Math.min(Math.max(parseFloat(srRateInput.value) || 1, 0.8), 2);
  srRateVal.textContent = settings.srRate.toFixed(1) + "×";
});
srRateInput.addEventListener("change", () => bg("settingsSet", { value: { srRate: settings.srRate } }).catch(() => {}));
if (srSpeech.ok) { try { window.speechSynthesis.addEventListener("voiceschanged", () => { srSpeech.warned.clear(); }); } catch (_) {} }

async function srReset() {
  srStopSpeech();
  // stopLive/stopFocus drain the page-side queues asynchronously; wait so the
  // drained entries don't land in (and re-render) the log we are about to clear.
  await Promise.allSettled([stopLive(), stopFocus()]);
  srState.order = null;
  srState.lang = null;
  srState.ntc = null;
  srState.reflow = null;
  srState.ax = null;
  srState.cmp = null;
  srState.live.log = [];
  srState.live.regions = [];
  srState.focus.log = [];
  srState.focus.walk = null;
  srWalkSummary.hidden = true;
  srState.applied = [];
  srState.journey = null;
  renderJourney();
  srOrderList.textContent = "";
  srLiveLog.textContent = "";
  srLiveRegions.textContent = "";
  srFocusLog.textContent = "";
  srLangList.textContent = "";
  srNtcList.textContent = "";
  srReflowList.textContent = "";
  srReflowShots.textContent = "";
  srReflowShots.hidden = true;
  srCmpList.textContent = "";
  srAxList.textContent = "";
  for (const id of ["srOrderStats", "srLiveStats", "srFocusStats", "srLangStats", "srNtcStats", "srReflowStats", "srCmpStats", "srAxStats"]) document.getElementById(id).textContent = "";
  srAddFindingsBtn.hidden = true;
  srState.restored = null;
  for (const key of Object.keys(SR_STEP_KEYS)) srSetStep(key, "idle");
  document.getElementById("srIntro").hidden = false;
  renderSrScore();
  srPersistClear();
}

function srOnNavigated() {
  const url = "→ page navigated";
  const at = Date.now();
  // Flush what we have under the OLD url before anything is cleared, then forget the
  // url: nothing is written until loadSr()/srResolveUrl re-resolves it for the new page.
  srPersist(true);
  srState.url = null;
  srState.restored = null;
  srState.applied = []; // the page-side undo stack died with the old document
  if (srSpeech.playing) srStopSpeech();
  // Reading order, language and browser-tree results belong to the old document —
  // drop them so a stale score can't be shown or stored against the new URL.
  srState.order = null;
  srState.lang = null;
  srState.ntc = null;
  srState.reflow = null;
  srState.ax = null;
  srState.cmp = null;
  srState.focus.walk = null;
  srWalkSummary.hidden = true;
  srOrderList.textContent = "";
  srLangList.textContent = "";
  srNtcList.textContent = "";
  srReflowList.textContent = "";
  srReflowShots.textContent = "";
  srReflowShots.hidden = true;
  srCmpList.textContent = "";
  srCmpUrl.value = "";
  srCmpPrefill().catch(() => {});
  srAxList.textContent = "";
  for (const id of ["srOrderStats", "srLangStats", "srNtcStats", "srReflowStats", "srCmpStats", "srAxStats"]) document.getElementById(id).textContent = "";
  srAddFindingsBtn.hidden = true;
  renderSrScore();
  if (flowRecording) flowJourney.pages.push({ at, label: "" }); // labelled by the next flow scan
  // Running monitors keep their log with a nav marker; idle ones belonged to the old document,
  // so drop them — otherwise they'd be scored and stored against the new URL.
  if (srState.live.running) { srState.live.log.push({ kind: "nav", t: 0, at, text: url }); renderLiveLog(); }
  else if (srState.live.log.length) { srState.live.log = []; renderLiveLog(); }
  if (srState.focus.running) { srState.focus.log.push({ kind: "nav", t: 0, at, text: url, issues: [] }); renderFocusLog(); }
  else if (srState.focus.log.length) { srState.focus.log = []; renderFocusLog(); }
  // The page-side observers died with the old document; the pollers reinstall on the next tick.
  if (!srView.hidden) srResolveUrl().catch(() => {});
}

/* ---- persistence: one snapshot per URL under storage key "sr:<url>" ----
   Live/focus logs (last 200 entries each), the reading-order summary and the score
   survive a DevTools close/reopen; loadSr() restores them when the tab is shown. */

const SR_PERSIST_CAP = 200;
let srPersistTimer = null;

function srFmtTime(at) {
  const d = new Date(at);
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay ? d.toLocaleTimeString() : d.toLocaleString();
}

function srSnapshot() {
  const o = srState.order, r = srState.restored;
  const sc = r && r.score ? r.score : srScoreCompute();
  const snap = {
    at: r ? r.at : Date.now(),
    live: srState.live.log.slice(-SR_PERSIST_CAP),
    focus: srState.focus.log.slice(-SR_PERSIST_CAP),
    order: o ? { summary: o.summary, truncated: !!o.truncated, url: o.url || null } : r ? r.order : null,
    score: sc ? { score: sc.score, verdict: sc.verdict, penalty: sc.penalty, breakdown: sc.breakdown } : null,
  };
  return snap.live.length || snap.focus.length || snap.order || snap.score ? snap : null;
}

// Debounced write of the current snapshot under srState.url. `now` flushes synchronously
// (used right before navigation, when the url is about to become stale).
function srPersist(now) {
  if (srState.restoring) return;
  clearTimeout(srPersistTimer);
  const write = () => {
    srPersistTimer = null;
    const url = srState.url;
    if (!url) return; // unknown / mid-navigation: never guess the key
    const snap = srSnapshot();
    (snap ? bg("storeSet", { key: "sr:" + url, value: snap }) : bg("storeRemove", { key: "sr:" + url }))
      .catch((err) => { statusEl.textContent = t("srPersistFailed") + (err?.message || err); });
  };
  if (now) write(); else srPersistTimer = setTimeout(write, 300);
}

function srPersistClear() {
  clearTimeout(srPersistTimer);
  srPersistTimer = null;
  const url = srState.url;
  if (url) bg("storeRemove", { key: "sr:" + url }).catch(() => {});
}

async function srResolveUrl() {
  const raw = await getPageUrl();
  // "unknown" (eval failed, mid-navigation) or non-page URLs must never share a storage key
  const url = /^(https?|file):/i.test(raw || "") ? raw : null;
  srState.url = url;
  return url;
}

function srHasData() {
  return !!(srState.order || srState.lang || srState.ntc || srState.reflow || srState.ax || srState.cmp || srState.live.log.length || srState.focus.log.length);
}

// Called when the 🔊 tab is shown: restore the snapshot saved for this URL unless the
// panel already holds results for it.
async function loadSr() {
  const url = await srResolveUrl();
  if (!url || srHasData()) return;
  let saved = null;
  try { saved = await bg("storeGet", { key: "sr:" + url }); } catch (_) { return; }
  if (!saved || !saved.at || srState.url !== url || srHasData()) return;
  srState.restoring = true;
  try {
    srState.restored = { at: saved.at, order: saved.order, score: saved.score };
    if (Array.isArray(saved.live) && saved.live.length) { srState.live.log = saved.live.slice(-SR_PERSIST_CAP); renderLiveLog(); }
    if (Array.isArray(saved.focus) && saved.focus.length) { srState.focus.log = saved.focus.slice(-SR_PERSIST_CAP); renderFocusLog(); }
    const stats = document.getElementById("srOrderStats");
    if (saved.order && saved.order.summary) {
      stats.textContent = t("srOrderStats", saved.order.summary, saved.order.truncated);
    } else stats.textContent = "";
    const note = document.createElement("span");
    note.className = "sr-restored";
    note.textContent = t("srRestored", srFmtTime(saved.at));
    note.title = t("srRestoredTitle");
    stats.append(stats.textContent ? " · " : "", note);
    const bd = saved.score && saved.score.breakdown ? saved.score.breakdown : {};
    for (const key of Object.keys(SR_STEP_KEYS)) {
      if (bd[key] === undefined || (srStepStates[key] && srStepStates[key].state !== "idle")) continue;
      srSetStep(key, bd[key] ? "issues" : "done", bd[key]);
    }
    renderSrScore();
  } finally {
    srState.restoring = false;
  }
}

/* ---- 🔊 tab badge: total current issues across sections ---- */

function srUpdateBadge(sc) {
  const btn = tabsNav.querySelector("[data-view='sr']");
  if (!btn) return;
  let badge = btn.querySelector(".sr-tab-badge");
  const breakdown = sc && sc.breakdown ? sc.breakdown : null;
  const parts = [];
  let total = 0;
  if (breakdown) for (const key of Object.keys(SR_SECTIONS)) {
    const n = breakdown[key];
    if (n === undefined) continue;
    total += n;
    parts.push(t(SR_SECTIONS[key].label) + ": " + n);
  }
  if (!badge) badge = setTabBadge("sr", null);
  badge.classList.add("sr-tab-badge");
  // hidden until a section has data; "0" (green) once one has run clean
  setTabBadge("sr", breakdown && Object.keys(breakdown).length ? String(total) : null, total ? "critical" : "ok");
  btn.title = breakdown ? t("srBadgeTitle") + " — " + parts.join(" · ") : t("srBadgeNone");
}

function applySrStrings() {
  srPlayBarSync();
  setTabLabel("sr", "i-speaker", t("tabSr"));
  document.getElementById("srIntro").textContent = t("srIntro");
  const secKey = { order: "srSecOrder", live: "srSecLive", focus: "srSecFocus", lang: "srSecLang", ntc: "srSecNtc", reflow: "srSecReflow", cmp: "srSecCmp", ax: "srSecAx" };
  for (const key of Object.keys(SR_STEP_KEYS)) {
    const li = srStepEl(key);
    if (!li) continue;
    li.querySelector(".step-title").textContent = t(secKey[key]);
    const opt = li.querySelector(".step-opt");
    if (opt) opt.textContent = t("stepOptional");
    const st = srStepStates[key] || { state: "idle", n: 0 };
    srSetStep(key, st.state, st.n, true);
  }
  setLabel(srRunAllBtn, "i-speaker", t("srRunAll"));
  setLabel(srBuildBtn, "i-list", t("srBuild"));
  setLabel(srCmpBtn, "i-compare", t("srCmp"));
  srCmpUrl.placeholder = t("srCmpUrlPh");
  document.getElementById("srCmpNote").textContent = t("srCmpNote");
  if (srState.cmp) renderCmp();
  setLabel(document.querySelector("#srJourneySection > summary"), "i-film", t("srSecJourney"), { trailing: svgIcon("i-chevron") });
  setLabel(srJourneyCopyBtn, "i-copy", t("srJourneyCopy"));
  renderJourney();
  srIssuesOnly.nextElementSibling.textContent = t("srIssuesOnly");
  srFocusIssuesOnly.nextElementSibling.textContent = t("srIssuesOnly");
  srFilterInput.placeholder = t("srFilterPlaceholder");
  applySrFilter();
  setLabel(srAddFindingsBtn, "i-plus", t("srAddFindings"));
  if (srState.live.running) setLabel(srLiveBtn, "i-stop", t("srLiveStop")); else setLabel(srLiveBtn, "i-bell", t("srLiveStart"));
  if (srState.focus.running) setLabel(srFocusBtn, "i-stop", t("srFocusStop")); else setLabel(srFocusBtn, "i-keyboard", t("srFocusStart"));
  if (srState.focus.walking) { setLabel(srWalkBtn, null, t("srWalkRunning")); srWalkBtn.prepend(Object.assign(document.createElement("span"), { className: "spin" })); }
  else setLabel(srWalkBtn, "i-keyboard", t("srWalk"));
  srWalkBtn.title = t("srWalkTitle");
  if (srState.focus.walk && !srWalkSummary.hidden) srWalkSummary.textContent = srState.focus.walk.candidates ? t("srWalkSummary", srState.focus.walk) : t("srWalkNone");
  setLabel(srLangBtn, "i-globe", t("srLang"));
  setLabel(srNtcBtn, "i-contrast", t("srNtc"));
  document.getElementById("srNtcNote").textContent = t("srNtcNote");
  if (srState.ntc) renderNtc(srState.ntc);
  setLabel(srReflowBtn, "i-reflow", t("srReflow"));
  document.getElementById("srReflowNote").textContent = srDebuggerAvailable ? t("srReflowNote") : t("srReflowUnavailable");
  if (srState.reflow) renderReflow(srState.reflow);
  setLabel(srAxBtn, "i-tree", t("srAx"));
  document.getElementById("srAxNote").textContent = t("srAxNote");
  setLabel(document.getElementById("srLiveClearBtn"), "i-eraser", t("srClearLog"));
  setLabel(document.getElementById("srFocusClearBtn"), "i-eraser", t("srClearLog"));
  document.querySelector("#srRulesLbl > .lbl").textContent = t("srRulesChk");
  if (srSpeech.playing) setLabel(srPlayBtn, "i-stop", t("srStop")); else setLabel(srPlayBtn, "i-play", t("srPlay"));
  srUpdatePlayScope();
  setLabel(srPlayPickBtn, "i-pick", t("srPlayPick"));
  srPlayPickBtn.title = t("srPlayPickTitle");
  document.getElementById("srRateLabel").textContent = t("srRate");
  srApplyRate();
  renderSrScore();
}

/* ---- developer fixes for screen reader findings ----
   Each finding carries a `code`; this turns it into a copy-ready before/after
   built from the element's real HTML, the same way the Automated tab does. */

const SR_ATTR = (html, attr) => {
  // insert attr into the opening tag of html
  const m = html.match(/^<([a-zA-Z0-9-]+)/);
  if (!m) return html;
  return html.replace(/^<([a-zA-Z0-9-]+)/, `<$1 ${attr}`);
};
const SR_OPEN = (html) => (html.match(/^<[^>]*>/) || [html])[0];
const SR_TAG = (html) => ((html.match(/^<([a-zA-Z0-9-]+)/) || [])[1] || "div").toLowerCase();
const SR_INNER = (html) => html.replace(/^<[^>]*>/, "").replace(/<\/[a-zA-Z0-9-]+>\s*$/, "");
const SR_VISIBLE = (html) => SR_INNER(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const SR_ATTRV = (html, name) => { const m = SR_OPEN(html).match(new RegExp(name + '="([^"]*)"')); return m ? m[1] : ""; };
const SR_RETAG = (html, newTag, extra) => {
  const tag = SR_TAG(html);
  let open = SR_OPEN(html).replace(new RegExp("^<" + tag), "<" + newTag + (extra ? " " + extra : ""));
  open = open.replace(/\s(tabindex|role)="[^"]*"/g, "");
  return open + SR_INNER(html) + `</${newTag}>`;
};
const SR_ID = (html) => SR_ATTRV(html, "id") || "FIELD_ID";

// Framework the fix snippets are written for ("html" | "react" | "vue") and its display label.
const srFramework = () => (settings.framework === "react" || settings.framework === "vue") ? settings.framework : "html";
const SR_FW_LABEL = { html: "HTML", react: "React", vue: "Vue" };
function srChangeToLabel() {
  const fw = srFramework();
  return fw === "html" ? t("srChangeTo") : t("srChangeToFw").replace("{fw}", SR_FW_LABEL[fw]);
}

function srFixFor(code, ctx) {
  const html = (ctx.html || "").trim();
  const role = ctx.role || "";
  const tag = SR_TAG(html);
  const vis = SR_VISIBLE(html);
  const hasIcon = /<(svg|img|i |span class="[^"]*(icon|fa-)|use )/i.test(html);
  // Snippets are authored as plain HTML; rewritten for React/Vue per the framework setting.
  const F = (snippet, note) => ({ snippet: A11yFixes.frameworkizeSnippet(snippet, srFramework(), code, { text: ctx.text, name: ctx.name, info: ctx.info, html }), note, framework: srFramework() });
  switch (code) {
    case "no-name":
      if (/^(textbox|searchbox|combobox|spinbutton|listbox|slider|checkbox|radio|switch)$/.test(role) || /^(input|select|textarea)$/.test(tag)) {
        const id = SR_ID(html);
        return F(`<label for="${id}">FIELD_LABEL</label>\n${SR_ATTRV(html, "id") ? html : SR_ATTR(html, `id="${id}"`)}`,
          "A visible <label for> is the fix screen readers, voice control AND sighted users benefit from. If the design has no room, use aria-label=\"FIELD_LABEL\" instead.");
      }
      if (hasIcon || !vis) {
        return F(SR_ATTR(html, 'aria-label="ACTION_NAME"'),
          `Name the ${role || tag} by what it DOES ("Close dialog", "Search", "Add to cart"), not what it looks like ("X", "magnifier"). Alternative: put the text inside the element in a visually-hidden span.`);
      }
      return F(SR_ATTR(html, 'aria-label="ACTION_NAME"'), "The content inside is not readable as text (empty, aria-hidden, or an image with no alt). Add real text, alt, or aria-label.");
    case "img-no-name":
      return F(`${SR_ATTR(html.replace(/\salt="[^"]*"/, ""), 'alt="DESCRIBE_IMAGE"')}\n\n<!-- or, if purely decorative: -->\n${SR_ATTR(html.replace(/\salt="[^"]*"/, ""), 'alt=""')}`,
        "Informative image: alt says what the image conveys. Decorative: alt=\"\" so it is skipped entirely. Never leave alt out.");
    case "empty-heading":
      return F(`<!-- give it text… -->\n${SR_OPEN(html)}SECTION_TITLE</${tag}>\n<!-- …or remove the heading element entirely -->`,
        "Screen reader users navigate by headings (H key). An empty one is a dead stop.");
    case "generic-name":
      return F(`${SR_OPEN(html)}${vis || ctx.name}<span class="visually-hidden"> about TOPIC</span></${tag}>\n\n/* once, in your CSS */\n.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
        `Keep the visible "${vis || ctx.name}" for the design; the hidden span makes every link unique when listed. aria-label="${vis || ctx.name} about TOPIC" works too (it must START with the visible text).`);
    case "placeholder-only": {
      const id = SR_ID(html);
      const ph = SR_ATTRV(html, "placeholder") || ctx.name || "FIELD_LABEL";
      return F(`<label for="${id}">${ph}</label>\n${SR_ATTRV(html, "id") ? html : SR_ATTR(html, `id="${id}"`)}`,
        "Placeholder vanishes on typing and is low-contrast; it is not a label. Add a real <label for>. Floating-label designs: keep the label element, animate it with CSS.");
    }
    case "title-only":
      return F(SR_ATTR(html, `aria-label="${SR_ATTRV(html, "title") || "ACTION_NAME"}"`),
        "title is a tooltip: no touch, no keyboard, unreliable in screen readers. aria-label (or visible text) is the accessible name.");
    case "label-in-name": {
      const stripped = html.replace(/\saria-label="[^"]*"/, "");
      return F(`<!-- best: let the visible text be the name -->\n${stripped}\n<!-- if extra context is needed, it must come AFTER the visible text -->\n${SR_ATTR(stripped, `aria-label="${vis} CONTEXT"`)}`,
        `Voice-control users say the text they see ("click ${vis}"). The accessible name must contain it — put the visible text first, then any extra context. Best: drop aria-label and let the visible text be the name.`);
    }
    case "long-name":
      return F(SR_ATTR(html, 'aria-label="SHORT_ACTION_NAME"'), "Announced in full on every focus. Keep names under ~60 characters; move the rest to aria-describedby.");
    case "not-focusable":
      return F(tag === "div" || tag === "span" ? SR_RETAG(html, "button", 'type="button"') : SR_ATTR(html, 'tabindex="0"'),
        "A native <button>/<a href> is focusable, announced correctly, and handles Enter/Space for free. tabindex=\"0\" only makes it reachable — you still need keydown handling.");
    case "tabindex-neg":
      return F(html.replace(/\stabindex="-1"/, ' tabindex="0"'), "tabindex=\"-1\" removes it from the Tab sequence. Use 0 (or remove the attribute on native controls) unless focus is moved by script on purpose.");
    case "a-no-href":
      return F(/onclick|@click|v-on/i.test(html) ? SR_RETAG(html, "button", 'type="button"') : SR_ATTR(html, 'href="DESTINATION_URL"'),
        "Without href an <a> is not a link and not focusable. Real navigation → add href. JavaScript action → it is a <button>.");
    case "clickable-no-role":
      return F(`${SR_RETAG(html, "button", 'type="button"')}\n\n<!-- if you cannot change the element: -->\n${SR_ATTR(html.replace(/\stabindex="[^"]*"/, ""), 'role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}"')}`,
        "Screen readers announce a clickable <div> as plain text, so users never know it is actionable. A native <button> fixes role, focus, and keyboard in one change.");
    case "dup-name":
      return F(`${SR_OPEN(html)}${vis || ctx.name}<span class="visually-hidden"> — CONTEXT</span></${tag}>`,
        `Several ${role}s are all called "${ctx.name}". Add the distinguishing context (product name, row, section) as hidden text or aria-label.`);
    case "dup-landmark":
      return F(SR_ATTR(html, 'aria-label="LANDMARK_PURPOSE"'), "e.g. aria-label=\"Main\" / \"Footer\" / \"Breadcrumb\" on each <nav>. Screen readers list landmarks by name.");
    case "hidden-focusable":
      return F(`<!-- either drop aria-hidden… -->\n${html.replace(/\saria-hidden="true"/, "")}\n<!-- …or make the hidden content unreachable too: -->\n${html.replace(/^<([a-zA-Z0-9-]+)/, "<$1 inert")}`,
        "aria-hidden hides from screen readers but NOT from the keyboard. `inert` (or tabindex=\"-1\" on each focusable child) removes it from Tab as well. Most often the right fix is simply not hiding it.");
    case "in-aria-hidden":
      return F(`<!-- on the ancestor that has aria-hidden="true": -->\n<div aria-hidden="true" inert>…</div>\n<!-- or remove aria-hidden if the content is meant to be used -->`,
        "The focused element sits inside an aria-hidden container — keyboard users can reach it, screen readers say nothing. Add inert to the container (or stop hiding it).");
    case "focus-lost":
      return F(`// before removing/hiding the element that has focus, decide where focus goes:\nconst next = item.nextElementSibling?.querySelector("button, a, input")\n          ?? item.previousElementSibling?.querySelector("button, a, input")\n          ?? document.querySelector("#list-heading");   // fallback: the list's heading (give it tabindex="-1")\nitem.remove();\nnext.focus();\n\n// closing a dialog/menu: return focus to the element that opened it\nopener.focus();`,
        "When the focused element disappears the browser silently drops focus to <body>; the screen reader jumps to the top of the page. Always move focus deliberately: next item, the container heading, or the control that opened the thing you closed.");
    case "modal-escape":
      return F(`<!-- native dialog traps focus and makes the page inert for you -->\n<dialog id="dlg">…</dialog>\n<script>dlg.showModal();  // not dlg.show(), not display:block</script>\n\n<!-- custom modal: make everything else inert while it is open -->\n<div role="dialog" aria-modal="true" aria-labelledby="dlg-title">…</div>\n<script>document.querySelector("main").inert = true; // undo on close, then opener.focus()</script>`,
        "Tab left the open dialog, so keyboard users end up on page content they cannot see. <dialog>.showModal() or `inert` on the rest of the page fixes the trap; restore focus to the opener on close.");
    case "no-focus-style":
      return F(`/* replace outline:none with a visible focus ring */\n${tag === "a" ? "a" : tag === "button" ? "button" : "." + (SR_ATTRV(html, "class").split(" ")[0] || tag)}:focus-visible {\n  outline: 3px solid #1a73e8;\n  outline-offset: 2px;\n}`,
        "outline:none without a replacement hides focus from sighted keyboard users (WCAG 2.4.7). :focus-visible shows the ring only for keyboard, not mouse clicks.");
    case "focus-ring-low-contrast": {
      const sel = tag === "a" ? "a" : tag === "button" ? "button" : "." + (SR_ATTRV(html, "class").split(" ")[0] || tag);
      return F(`/* ring colour must reach 3:1 against the surrounding background (${ctx.ringBg || "#fff"}) */\n${sel}:focus-visible {\n  outline: 3px solid ${ctx.ringBg && /^#(f|e)/i.test(ctx.ringBg) ? "#1a4480" : "#ffbf47"};\n  outline-offset: 2px;\n  box-shadow: none;\n}`,
        `The ring is ${ctx.ringContrast ? ctx.ringContrast + ":1" : "below 3:1"} against the background — sighted keyboard users cannot find where they are (WCAG 2.4.11 Focus Appearance / 1.4.11). Dark blue on light surfaces, a light yellow ring on dark ones; a 2-colour ring (outline + white box-shadow) works on any background.`);
    }
    case "focus-ring-thin": {
      const sel = tag === "a" ? "a" : tag === "button" ? "button" : "." + (SR_ATTRV(html, "class").split(" ")[0] || tag);
      return F(`${sel}:focus-visible {\n  outline: 3px solid #1a4480;   /* was ${ctx.ringWidth || 1}px */\n  outline-offset: 2px;\n}`,
        "A 1px ring disappears on high-DPI screens and next to borders. WCAG 2.4.11 asks for a ring at least 2px thick around the whole control (or the same area); 3px with a 2px offset is the safe default.");
    }
    case "focus-ring-clipped":
      return F(`/* on the wrapper that clips (${ctx.info || "overflow:hidden container"}) */\n.wrapper {\n  overflow: visible;           /* or keep overflow and add room: */\n  padding: 6px;                /* ≥ outline-width + outline-offset */\n}\n\n/* or draw the ring inside the box so nothing needs to overflow */\n${tag === "a" ? "a" : tag === "button" ? "button" : "." + (SR_ATTRV(html, "class").split(" ")[0] || tag)}:focus-visible {\n  outline: 3px solid #1a4480;\n  outline-offset: -3px;\n}`,
        "The ring is drawn outside the element and an ancestor with overflow hidden/auto/scroll cuts it off — the user sees a partial or missing indicator (calendars, carousels, scrollable tables, card grids). Either let the wrapper overflow, give it padding for the ring, or use a negative outline-offset / inset box-shadow so the ring stays inside the box.");
    case "invisible":
      return F(`// only focus things the user can see — hide AND remove from Tab together\nel.hidden = true;          // display:none ⇒ not focusable\n// or, if it must stay in the DOM:\nel.setAttribute("inert", "");`,
        "An invisible element received focus: the user's Tab press appears to do nothing. Hidden controls must be display:none, hidden, or inert.");
    case "offscreen":
      return F(`el.focus();\nel.scrollIntoView({ block: "nearest" });\n\n/* or avoid the off-screen state: don't position:absolute; left:-9999px focusable controls */`,
        "Focus landed on something outside the viewport. Scroll it into view when focusing, or make sure focusable content is never pushed off-screen.");
    case "skip-offscreen":
      return F(`.skip-link { position:absolute; left:-9999px; }\n.skip-link:focus { left: 8px; top: 8px; z-index: 1000; background:#fff; padding:8px; }`,
        "A skip link may be hidden until focused — but on focus it MUST become visible, otherwise sighted keyboard users are confused by an invisible first Tab stop.");
    case "positive-tabindex":
      return F(html.replace(/\stabindex="\d+"/, ' tabindex="0"'), "Positive tabindex pulls this element ahead of everything else on the page. Use 0 and fix the DOM order instead.");
    case "unreachable":
      return F(`<!-- meant to be usable: make it visible and focusable -->\n${html.replace(/\s(hidden|inert)(="[^"]*")?/g, "")}\n\n<!-- meant to be hidden: hide AND remove it from the Tab sequence together -->\n${SR_ATTR(html.replace(/\stabindex="[^"]*"/, ""), "hidden")}\n<!-- or on the hidden container: -->\n<div hidden>…</div>  <!-- display:none / hidden / inert also stops Tab -->`,
        "The auto-walk called focus() on this Tab stop and the browser refused — it is display:none, visibility:hidden, inert or otherwise not focusable, so a real Tab press skips it too. If users are supposed to reach it, unhide it; if not, keep it hidden with `hidden`/`inert` rather than leaving a dead stop in the sequence.");
    case "order-jump":
      return F(`<!-- remove the positive tabindex that pulled focus ahead of this element -->\n<${tag || "button"} tabindex="0">…</${tag || "button"}>\n<!-- then fix the order in the DOM (move the markup), not with tabindex -->`,
        "Tab arrived here from an element that is later in the page: a positive tabindex jumped the queue and focus then rewinds to the start of the document. Screen reader and keyboard users lose their place. Use tabindex=\"0\" everywhere and order the markup itself.");
    case "possible-trap":
      return F(`<!-- a container that handles keys must still let Tab, Shift+Tab and Escape leave it -->\n<div role="dialog" aria-modal="true" aria-labelledby="dlg-title">\n  …\n</div>\n<script>\ncontainer.addEventListener("keydown", (e) => {\n  if (e.key === "Escape") { close(); opener.focus(); }\n  // never preventDefault() on Tab unless you move focus yourself (and only inside a modal)\n});\n</script>`,
        "Focus stopped inside a container with its own keydown handler or a role=\"dialog\" without aria-modal. Script cannot send a real Tab key, so check by hand: press Tab and Shift+Tab at both ends and Escape — focus must leave (or, for a modal, cycle within the dialog and close on Escape). WCAG 2.1.2 No Keyboard Trap.");
    case "widget-no-arrow-nav": {
      const w = ctx.info || "tablist";
      const item = { tablist: "tab", radiogroup: "radio", listbox: "option", menu: "menuitem", menubar: "menuitem", tree: "treeitem", grid: "gridcell" }[w] || "tab";
      const st = item === "tab" || item === "option" ? "aria-selected" : item === "radio" ? "aria-checked" : "";
      const gid = (SR_ATTRV(html, "role") === w && SR_ATTRV(html, "id")) || (ctx.container || "").replace(/^#(?=[\w-]+$)/, "") || `${w}-1`; // the row's markup is usually the focused item, not the group
      return F(`<!-- roving tabindex: ONE Tab stop, arrow keys move between the items -->\n<div role="${w}" id="${gid}">\n  <button role="${item}"${st ? ` ${st}="true"` : ""} tabindex="0">Item 1</button>\n  <button role="${item}"${st ? ` ${st}="false"` : ""} tabindex="-1">Item 2</button>\n</div>\n<script>\nconst group = document.getElementById("${gid}");\ngroup.addEventListener("keydown", (e) => {\n  const items = [...group.querySelectorAll('[role="${item}"]')];\n  const i = items.indexOf(document.activeElement);\n  const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];\n  if (next === undefined || i < 0) return;\n  e.preventDefault();\n  const to = items[(next + items.length) % items.length];\n  items.forEach((it) => { it.tabIndex = it === to ? 0 : -1;${st ? ` it.setAttribute("${st}", it === to ? "true" : "false");` : ""} });\n  to.focus();\n});\n</script>`,
        `role="${w}" promises the screen reader user that arrow keys move between the ${item}s (WCAG 2.1.1 Keyboard; ARIA APG ${w} pattern) — the probe pressed ArrowRight and ArrowDown and nothing happened, so NVDA/VoiceOver users hear "${item} 1 of N" and cannot reach the others. Give the group one Tab stop (roving tabindex) and a keydown handler that moves focus and the ${st || "state"}. Synthetic keys cannot prove a failure: confirm with a real keyboard.`);
    }
    case "widget-no-enter-space": {
      const isDiv = /^(div|span)$/.test(tag);
      const label = ctx.name || vis || "LABEL";
      return F(isDiv
        ? `<!-- a real <button> gets Enter AND Space for free — no key handler needed -->\n<button type="button" class="${SR_ATTRV(html, "class") || "picker-trigger"}"${ctx.info === "combobox" || SR_ATTRV(html, "aria-haspopup") ? ` aria-haspopup="${SR_ATTRV(html, "aria-haspopup") || "listbox"}" aria-expanded="false"` : ""}>${label}</button>\n\n<!-- if the div must stay: handle the keys yourself -->\n${SR_ATTR(html, 'onkeydown="if (event.key === \'Enter\' || event.key === \' \') { event.preventDefault(); this.click(); }"')}`
        : `<!-- Enter and Space (and ArrowDown for a picker) must do what the click does -->\n${SR_ATTR(html, 'onkeydown="if (event.key === \'Enter\' || event.key === \' \' || event.key === \'ArrowDown\') { event.preventDefault(); openPicker(this); }"')}\n<!-- and expose the state: aria-expanded="true" while the popup is open -->`,
        `Verify manually — synthetic keys cannot trigger native activation. The probe pressed Enter and Space on this ${ctx.info || role} and saw no focus move, aria change, popup or DOM change within 150 ms. A native <button> activates on both keys by itself; a div/span with role="button", a combobox or an aria-haspopup trigger only responds if a keydown handler calls the same code as the click (WCAG 2.1.1). Use Enter and Space, not keyCode 13 only, and prevent the page from scrolling on Space.`);
    }
    case "widget-esc-no-close":
      return F(`<!-- one Escape closes the popup and returns focus to the control that opened it -->\n${SR_ATTR(html, 'aria-expanded="true"')}\n<div role="listbox" id="picker-popup">…</div>\n<script>\nfunction openPicker(trigger) {\n  popup.hidden = false;\n  trigger.setAttribute("aria-expanded", "true");\n  const onKey = (e) => {\n    if (e.key !== "Escape") return;\n    e.stopPropagation();                 // the page's own Escape handler must not need a second press\n    popup.hidden = true;\n    trigger.setAttribute("aria-expanded", "false");\n    document.removeEventListener("keydown", onKey, true);\n    trigger.focus();\n  };\n  document.addEventListener("keydown", onKey, true);   // capture: works while focus is inside the popup\n}\n</script>`,
        "Enter opened a popup but Escape did not close it (hint from synthetic keys — verify by hand). Keyboard users press Escape twice, or Tab out and leave the popup open on top of the page. Listen for Escape on document (capture) while the popup is open, close it, reset aria-expanded and move focus back to the trigger — WCAG 2.1.1 / ARIA APG combobox, menu and dialog patterns.");
    case "state-missing": {
      const attr = ctx.attr || "aria-pressed";
      const cls = SR_ATTRV(html, "class");
      const word = (cls.match(/\b(active|selected|checked|on|current|expanded|open)\b/i) || [])[0] || "active";
      const on = attr === "aria-current" && role === "link" ? "page" : "true";
      const roving = role === "tab" ? `\n<!-- tabs: the selected tab is tabindex="0", the others tabindex="-1"; arrow keys move between them -->` : "";
      return F(`<!-- set the ARIA state together with the class, in both directions -->\n${SR_ATTR(html, `${attr}="${on}"`)}${roving}\n\n<script>\nfunction setState(el, isOn) {\n  el.classList.toggle("${word}", isOn);\n  el.setAttribute("${attr}", isOn ? "${on}" : "false");   // never one without the other\n}\n</script>`,
        `The class "${word}" changes the look, not the announcement: a screen reader says "${ctx.name || vis || role}, ${role}" whether it is on or off. ${attr} is what NVDA/VoiceOver read as "${attr === "aria-expanded" ? "expanded/collapsed" : attr === "aria-checked" ? "checked/not checked" : attr === "aria-selected" ? "selected" : attr === "aria-current" ? "current" : "pressed/not pressed"}" — update it in the same place you toggle the class.`);
    }
    case "state-not-announced": {
      const attr = ctx.attr || "aria-pressed";
      const cls = SR_ATTRV(html, "class");
      const word = (cls.match(/\b(active|selected|checked|on|current|expanded|open|collapsed)\b/i) || [])[0] || "active";
      const targetId = (ctx.target || "").startsWith("#") && !/[\s>]/.test(ctx.target) ? ctx.target.slice(1) : "";
      const ctrl = attr === "aria-expanded" && targetId && !SR_ATTRV(html, "aria-controls") ? ` aria-controls="${targetId}"` : "";
      return F(`<!-- initial state in the markup… -->\n${SR_ATTR(html, `${attr}="false"${ctrl}`)}\n\n<script>\n// …and update it in the SAME click handler that toggles the class / shows the panel\nel.addEventListener("click", () => {\n  const isOn = el.classList.toggle("${word}");${attr === "aria-expanded" ? `\n  panel.hidden = !isOn;` : ""}\n  el.setAttribute("${attr}", isOn ? "true" : "false");\n});\n</script>`,
        `The click changed what sighted users see but nothing a screen reader reads: "${(ctx.text || vis || "").slice(0, 40)}" is announced exactly the same before and after. ${attr} makes the browser announce "${attr === "aria-expanded" ? "expanded / collapsed" : attr === "aria-checked" ? "checked / not checked" : attr === "aria-selected" ? "selected" : attr === "aria-current" ? "current" : "pressed / not pressed"}" on the control itself, without a live region.`);
    }
    case "required-not-exposed": {
      const native = /^(input|select|textarea)$/.test(tag);
      return F(native ? `${SR_ATTR(html, "required")}\n\n<!-- custom validation without the browser's own popup: -->\n${SR_ATTR(html, 'aria-required="true"')}` : SR_ATTR(html, 'aria-required="true"'),
        'The asterisk / "required" text is visual only. A screen reader announces this field as optional until the element itself carries required (native validation, aria-required implied) or aria-required="true" (your own validation). Also explain the asterisk once above the form ("* required").');
    }
    case "readonly-misuse": {
      const stripped = html.replace(/\s(readonly|aria-readonly)(="[^"]*")?/gi, "");
      return F(`<!-- the user is meant to change this value: let them type it and describe the format -->\n<span id="date-hint" class="visually-hidden">Format: DD/MM/YYYY</span>\n${SR_ATTR(stripped, 'aria-describedby="date-hint"')}\n<!-- the calendar/clock button opens the picker; the field stays editable -->`,
        'readonly makes NVDA/VoiceOver say "read only" and many users skip the field or think it is locked — yet the whole point of the picker is to change its value. Remove readonly (handle typed input, keep the picker button as an alternative). Reserve aria-readonly="true" for values that really cannot change.');
    }
    case "stepper-no-state":
      return F(`<ol class="${SR_ATTRV(html, "class") || "stepper"}">\n  <li class="done"><span class="visually-hidden">Step 1 of 4, completed: </span>Details<svg aria-hidden="true">…</svg></li>\n  <li class="active" aria-current="step"><span class="visually-hidden">Step 2 of 4, current: </span>Documents</li>\n  <li><span class="visually-hidden">Step 3 of 4: </span>Review</li>\n  <li><span class="visually-hidden">Step 4 of 4: </span>Submit</li>\n</ol>\n\n/* once, in your CSS */\n.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
        'Tick icons and "active"/"done" classes are invisible to a screen reader: the stepper is read as a plain list of names. aria-current="step" on the current item ("current step") plus a hidden "Step 2 of 4, completed" prefix on each item tells the user where they are; mark the icons aria-hidden="true" so they are not read as "image".');
    case "group-no-label": {
      const kind = ctx.info === "radio" ? "radio" : "checkbox";
      const label = ctx.hint || "GROUP_LABEL";
      const id = SR_ATTRV(html, "id") || "group-label";
      const item = (v, txt) => `  <label><input type="${kind}" name="${kind === "radio" ? "plan" : "options"}" value="${v}" /> ${txt}</label>`;
      return F(`<!-- native: fieldset + legend name the group for every screen reader -->\n<fieldset>\n  <legend>${label}</legend>\n${item("1", "OPTION 1")}\n${item("2", "OPTION 2")}\n</fieldset>\n\n<!-- cannot change the markup: role="${kind === "radio" ? "radiogroup" : "group"}" + aria-labelledby on the existing container, pointing at the visible heading -->\n${SR_ATTR(SR_OPEN(html).replace(/\srole="[^"]*"/, ""), `role="${kind === "radio" ? "radiogroup" : "group"}" aria-labelledby="${id}-label"`)}\n  <p id="${id}-label">${label}</p>   <!-- the existing visible heading, given an id -->\n  …\n</${tag}>`,
        `Each ${kind} is announced by its own text ("Dubai, checkbox, not checked") — the user never hears what the set of choices is about${ctx.hint ? ` ("${ctx.hint}" is sighted-only)` : ""}. <fieldset>/<legend> is the native answer (the legend is read when entering the group); role="${kind === "radio" ? "radiogroup" : "group"}" with aria-labelledby (or aria-label) on the wrapper does the same without changing the layout. Keep the visible heading — do not duplicate it in each option's label.`);
    }
    case "question-not-associated": {
      const q = ctx.hint || vis || "QUESTION?";
      const id = SR_ATTRV(html, "id") || "question";
      const qEl = SR_ATTRV(html, "id") ? html : SR_ATTR(html, `id="${id}"`);
      return F(`<!-- group the question with its answers: the screen reader says "${q}, group" before "Yes, button" -->\n<div role="group" aria-labelledby="${id}">\n  ${qEl}\n  <button type="button">Yes</button>\n  <button type="button">No</button>\n</div>\n\n<!-- or make each answer self-describing (also fixes the buttons list) -->\n<button type="button" aria-label="Yes — ${q}">Yes</button>\n<button type="button" aria-label="No — ${q}">No</button>`,
        `"Yes" and "No" mean nothing without the question: in the buttons list, with voice control, or when the user tabs straight to them, nothing says what they are answering. A role="group" named by the question (aria-labelledby on the wrapper) is announced on entering the group; aria-label / aria-describedby on each button works when the layout cannot change. A <fieldset> with the question as its <legend> and two radio buttons is the fully native form.`);
    }
    case "label-not-associated": {
      const label = (ctx.hint || ctx.info || "FIELD_LABEL").replace(/[:：*]+\s*$/, "").trim();
      const id = SR_ID(html);
      const field = SR_ATTRV(html, "id") ? html : SR_ATTR(html, `id="${id}"`);
      return F(`<label for="${id}">${label}</label>\n${field}\n\n<!-- or wrap the field in the label (no id needed) -->\n<label>${label} ${field}</label>\n\n<!-- text that must stay a plain element: -->\n<span id="${id}-label" class="form-label">${label}</span>\n${SR_ATTR(html, `aria-labelledby="${id}-label"`)}`,
        `The text "${label}" sits next to the field but nothing links them, so the screen reader announces ${ctx.name ? `"${ctx.name}"` : "an unnamed field"} and a voice-control user cannot say "click ${label}". <label for> (or wrapping the field) reuses the visible text as the accessible name and makes the label clickable too; aria-labelledby is the fallback when the text cannot become a <label>. Prefer this over aria-label — one text for everyone.`);
    }
    case "link-new-window": {
      const label = vis || ctx.name || "LINK_TEXT";
      const stripped = SR_OPEN(html).replace(/\saria-label="[^"]*"/, "");
      const hidden = `${stripped}${SR_INNER(html) || label}<span class="visually-hidden"> (opens in a new tab)</span></${tag}>`;
      return F(`<!-- best: say it in the visible text -->\n${stripped}${SR_INNER(html) || label} (opens in a new tab)</${tag}>\n\n<!-- or keep the design and add hidden text (aria-label="${label} (opens in a new tab)" also works) -->\n${hidden}\n\n/* once, in your CSS */\n.visually-hidden{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}`,
        `target="_blank" is silent: NVDA/VoiceOver announce "${label}, link" and the user lands in a new tab where Back no longer works. Say "(opens in a new tab)" in the name — visible text is best; a hidden span or aria-label is acceptable. Better still: do not open new tabs unless the user asked for it (WCAG 3.2.5). Add rel="noopener" too.`);
    }
    case "link-download-hint": {
      const type = ctx.info || "PDF";
      const label = vis || ctx.name || "LINK_TEXT";
      const stripped = SR_OPEN(html).replace(/\saria-label="[^"]*"/, "");
      return F(`<!-- put the file type and size in the link text — everyone benefits -->\n${stripped}${SR_INNER(html) || label} (${type}, 2 MB)</${tag}>\n\n<!-- design has no room for it: hidden text -->\n${stripped}${SR_INNER(html) || label}<span class="visually-hidden"> (${type}, 2 MB)</span></${tag}>`,
        `The link downloads a ${type} but is announced as "${label}, link" — the user expects a page and gets a file dialog (or a document opened in another app). Name the type and size: "(${type}, 2 MB)". If the file is meant to be saved, add the download attribute as well so the browser says "download" instead of navigating.`);
    }
    case "link-external-hint": {
      const label = vis || ctx.name || "LINK_TEXT";
      const stripped = SR_OPEN(html).replace(/\saria-label="[^"]*"/, "");
      return F(`${stripped}${SR_INNER(html) || label}<span class="visually-hidden"> (external link${ctx.info ? " to " + ctx.info : ""})</span><svg class="icon-external" aria-hidden="true" focusable="false">…</svg></${tag}>\n\n<!-- or, once, for every external link: -->\n<script>\nfor (const a of document.querySelectorAll('a[href^="http"]:not([href*="' + location.host + '"])')) {\n  const hint = document.createElement("span"); hint.className = "visually-hidden"; hint.textContent = " (external link)"; a.appendChild(hint);\n}\n</script>`,
        `Sighted users see the external-link icon (or recognise the domain); a screen reader user hears only "${label}, link" and is suddenly on ${ctx.info || "another site"}. Add "(external link)" to the name — hidden text, or visible text — and keep any icon aria-hidden so it is not read as "image".`);
    }
    case "link-as-button": {
      const kind = ctx.info || "handler";
      const label = vis || ctx.name || "LINK_TEXT";
      const noHref = html.replace(/\s(href|target)="[^"]*"/g, "");
      if (kind === "current") {
        return F(`<!-- the current page is not a link: no href, aria-current says "current page" -->\n${SR_ATTR(noHref, 'aria-current="page"')}\n<!-- or a plain span -->\n<span aria-current="page">${label}</span>`,
          `href="#" makes NVDA/JAWS announce "same page link" and Enter scrolls to the top. The current breadcrumb/pagination item should not be a link at all: drop the href and add aria-current="page" so the screen reader says "current page, ${label}".`);
      }
      if (kind === "nav") {
        return F(`<!-- point the link at the real destination -->\n${SR_ATTR(noHref, 'href="/REAL_PATH"')}\n\n<!-- if it is script-driven (no URL for this page/state), it is a button -->\n${SR_RETAG(noHref, "button", 'type="button"')}`,
          `"${label}" is announced as "same page link" because href="#" points at the current document; Enter jumps to the top and, in a breadcrumb or pagination, the user never gets where the label promises. Give it the real URL (server-rendered pages / router links) — or, when only JavaScript reacts, make it a <button type="button">.`);
      }
      return F(`${SR_RETAG(noHref, "button", 'type="button"')}\n\n<!-- if it really navigates somewhere, keep <a> and give it the real URL -->\n${SR_ATTR(noHref, 'href="/REAL_PATH"')}`,
        `A link that runs script is a button: screen readers announce "${label}, same page link" (users expect navigation), Enter scrolls to the top before your handler runs, and the links list fills with dead entries. <button type="button"> gives the right role, Space/Enter activation and no default navigation — remove the href/preventDefault workaround.`);
    }
    case "silent":
      return F(`<!-- the region must exist (empty) before the message is written into it -->\n${SR_ATTR(html.replace(/>[\s\S]*$/, ">"), 'role="status"')}</${tag}>\n<!-- errors that need immediate attention: role="alert" (assertive) -->\n\n<script>\n// later, when the change happens:\ndocument.querySelector("${(ctx.sel || "").replace(/"/g, '\\"')}").textContent = "${(ctx.text || "").slice(0, 60).replace(/"/g, "'")}";\n</script>`,
        `"${(ctx.text || "").slice(0, 50)}" appeared on screen but a screen reader user heard nothing. role="status" (polite) or role="alert" (assertive) makes text changes inside the element announced. If the change is a whole new view (dialog, page section), move focus into it instead.`);
    case "dialog-no-focus":
      return F(`dlg.showModal();                    // native <dialog>: focus moves inside automatically\n\n// custom dialog:\ndialog.querySelector("h2").tabIndex = -1;\ndialog.querySelector("h2").focus();   // announces the title, then the content`,
        "A dialog opened but focus stayed behind it, so the screen reader user does not know anything happened. Move focus to the dialog's title or first control.");
    case "risky":
    case "live-late":
      return F(`<!-- 1. render the region EMPTY with the page -->\n<div id="status" role="status" aria-live="polite"></div>\n\n<!-- 2. later, only change its text -->\n<script>document.getElementById("status").textContent = "${(ctx.text || "MESSAGE").slice(0, 60).replace(/"/g, "'")}";</script>`,
        "Screen readers only watch live regions that already existed. A region injected together with its text (or aria-live added after the text) is skipped by NVDA/VoiceOver more often than not. Keep one permanent status element and update it.");
    case "rerender":
      return F(`// after a route change or list refresh:\ndocument.getElementById("status").textContent = "RESULTS_COUNT results for QUERY";\n// SPA navigation: also move focus to the new page's heading\nconst h1 = document.querySelector("main h1"); h1.tabIndex = -1; h1.focus();`,
        "A large part of the page was replaced but nothing told the screen reader. Announce a short summary in a permanent role=\"status\" region and, for navigation, move focus to the new heading.");
    case "transient":
      return F(`<div role="status" aria-live="polite">${(ctx.text || "MESSAGE").slice(0, 60)}</div>\n<!-- keep toasts on screen ≥ 5 s and let the user dismiss them (WCAG 2.2.1) -->`,
        "The content disappeared again within a second — a toast or spinner. If it carries information, it needs role=\"status\" and enough time to be read.");
    case "route-silent":
      return F(`<!-- 1. one permanent route announcer, rendered EMPTY with the app shell (never re-created per page) -->\n<div id="route-announcer" role="status" aria-live="polite" class="visually-hidden"></div>\n\n<script>\n// 2. run after EVERY route change (pushState / popstate / your router's after-navigation hook)\nfunction announceRoute(pageTitle) {\n  document.title = pageTitle + " — SITE_NAME";                 // new tab title = first thing announced\n  const h1 = document.querySelector("main h1");\n  if (h1) { h1.tabIndex = -1; h1.focus(); }                    // focus lands on the new page's heading\n  document.getElementById("route-announcer").textContent = "Navigated to " + pageTitle;\n}\n</script>`,
        `The URL changed to ${(ctx.url || "the new route").slice(0, 60)} but the title stayed the same, focus did not move and no live region spoke — for a screen reader user nothing happened. A page change needs at least two of the three: a new document.title, focus on the new page's H1 (tabindex="-1"), and/or a route announcer (role="status") that says where the user landed.`);
    case "route-title-stale":
      return F(`// on every route change, before or right after rendering the new view:\ndocument.title = "${(ctx.h1After || "PAGE_TITLE").slice(0, 50)} — SITE_NAME";\n\n// history / hash routers: run it in the same place you call pushState or handle popstate`,
        `document.title is still "${(ctx.titleAfter || "").slice(0, 50) || "(empty)"}" on the new URL. Screen readers announce the title first after a page change (and it names the tab, history and bookmarks) — give every page/step its own, "Page — Site" order (WCAG 2.4.2).`);
    case "route-h1-dup":
      return F(`<!-- one H1 per page/step, naming THIS page — not the site or the wizard -->\n<h1 tabindex="-1">PAGE_SPECIFIC_TITLE</h1>\n<!-- the same text should go into document.title -->`,
        `The H1 "${(ctx.h1After || "").slice(0, 50)}" is identical on the previous and the new URL. Screen reader users press H / 1 to learn where they are; a shared H1 (site name, wizard title) tells them nothing. Put the page or step name in the H1 and keep the site name in the title suffix.`);
    case "route-focus-stuck":
      return F(`// after rendering the new route, move focus to its heading (or to <main>)\nconst h1 = document.querySelector("main h1");\nh1.tabIndex = -1;            // focusable by script only, not in the Tab order\nh1.focus();\n// alternative: document.querySelector("main").tabIndex = -1; main.focus();`,
        "Focus stayed where it was (the link/button that triggered the navigation, or an element that is gone) while the content above changed — the next Tab press continues mid-page and the screen reader never reads the new heading. Move focus to the new page's H1 or its main landmark.");
    case "nontext-contrast": {
      const cf = A11yFixes.contrastFix(`foreground color: ${ctx.ntcColor || "#cccccc"}, background color: ${ctx.ntcBg || "#ffffff"}, expected contrast ratio of 3:1`, settings.dlsContrast ? A11yFixes.DLS_COLORS : undefined) || { to: "#767676", ratio: 4.54 };
      const sel = SR_ATTRV(html, "id") ? "#" + SR_ATTRV(html, "id") : SR_ATTRV(html, "class") ? "." + SR_ATTRV(html, "class").split(" ")[0] : tag;
      const tok = cf.token ? `   /* DLS ${cf.token} */` : "";
      const kind = ctx.ntcKind || "border";
      const css = kind === "icon"
        ? (ctx.ntcProp === "color" ? `${sel} {\n  color: ${cf.to};${tok}\n}` : `${sel} svg {\n  ${ctx.ntcProp === "stroke" ? "stroke" : "fill"}: ${cf.to};${tok}\n}\n/* or set color: ${cf.to} on the button and use fill="currentColor" in the svg */`)
        : kind === "background"
          ? `${sel} {\n  background-color: ${cf.to};${tok}\n  /* or keep the fill and add a visible edge: */\n  border: 1px solid ${cf.to};\n}`
          : `${sel} {\n  border: 1px solid ${cf.to};${tok}\n}`;
      return F(css, `${kind === "icon" ? "The icon glyph" : kind === "background" ? "The control's fill (the only thing marking its edge)" : "The border"} is ${ctx.ntcRatio ? Number(ctx.ntcRatio).toFixed(2) + ":1" : "below 3:1"} against ${ctx.ntcBg || "the background"} — low-vision users cannot see where the control is or what state it is in (WCAG 1.4.11 Non-text Contrast). ${cf.to} reaches ${cf.ratio}:1${cf.token ? " and is the nearest UAE DLS token (" + cf.token + ")" : ""}; check hover, focus and checked states too.`);
    }
    case "reflow-horizontal-scroll": {
      const sel = SR_ATTRV(html, "id") ? "#" + SR_ATTRV(html, "id") : SR_ATTRV(html, "class") ? "." + SR_ATTRV(html, "class").split(" ")[0] : tag;
      const w = ctx.reflow && ctx.reflow.width;
      const css = tag === "table"
        ? `/* wrap the table: <div class="table-scroll"> … </div> — the wrapper scrolls, the page does not */\n.table-scroll {\n  overflow-x: auto;\n  max-width: 100%;\n}\n${sel} {\n  width: 100%;\n  max-width: 100%;\n}`
        : /^(img|video|iframe|svg|canvas|picture)$/.test(tag)
          ? `${sel} {\n  max-width: 100%;\n  height: auto;\n}\n/* iframes / embeds: */\n.embed { position: relative; aspect-ratio: 16 / 9; }\n.embed > iframe { position: absolute; inset: 0; width: 100%; height: 100%; }`
          : `${sel} {\n  max-width: 100%;\n  min-width: 0;          /* let flex / grid children shrink */\n  box-sizing: border-box;\n}\n/* a row of cards or columns: */\n${sel} {\n  display: flex;\n  flex-wrap: wrap;\n}\n@media (max-width: 480px) {\n  ${sel} > * { flex: 1 1 100%; }\n}`;
      return F(css, `${w ? w + " px wide" : "Wider than the viewport"} at 320 px${ctx.reflow && ctx.reflow.row ? " (a row of children that does not wrap)" : ""} — the page scrolls in two directions, so a user at 400 % zoom (or on a phone) has to pan sideways for every line of text (WCAG 1.4.10 Reflow). Fixed widths, min-width, oversized media and non-wrapping flex rows are the usual causes; only data tables, maps and diagrams may scroll sideways, and then inside their own box.`);
    }
    case "reflow-clipped-text":
    case "reflow-clipped-text-200": {
      const sel = SR_ATTRV(html, "id") ? "#" + SR_ATTRV(html, "id") : SR_ATTRV(html, "class") ? "." + SR_ATTRV(html, "class").split(" ")[0] : tag;
      const d = ctx.reflow || {};
      return F(`${sel} {\n  white-space: normal;        /* let the text wrap */\n  overflow-wrap: anywhere;    /* break long words and reference numbers */\n  min-width: 0;\n  max-width: 100%;\n}\n/* if one line is a must (a table cell, a tab label), keep the whole text reachable: */\n${sel} { text-overflow: ellipsis; }   /* + title="FULL_TEXT" or a "show more" toggle */`,
        `${d.need ? "The text needs " + d.need + " px but the box is " + d.box + " px" : "The text is wider than its box"}${d.props ? " (" + d.props + ")" : ""} — ${code.endsWith("-200") ? "with 200 % text at the page's own width" : "at a 320 px viewport"} the rest is cut off and there is no way to read it${d.base ? "; it is already cut off at the normal width" : ""} (WCAG 1.4.4 Resize text / 1.4.10 Reflow). Let it wrap; keep nowrap only for things that must stay on one line and make sure the box grows with the text.`);
    }
    case "reflow-overlap":
    case "reflow-overlap-200": {
      const sel = SR_ATTRV(html, "id") ? "#" + SR_ATTRV(html, "id") : SR_ATTRV(html, "class") ? "." + SR_ATTRV(html, "class").split(" ")[0] : tag;
      const sel2 = ctx.sel2 || "OTHER_CONTROL";
      const d = ctx.reflow || {};
      return F(`/* stack the two controls instead of positioning them on top of each other */\n@media (max-width: 480px) {\n  ${sel},\n  ${sel2} {\n    position: static;\n    display: block;\n    width: 100%;\n    margin-block: 4px;\n  }\n}\n/* or a wrapping row: */\n.actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n.actions > * { min-width: 0; }`,
        `${sel} overlaps ${sel2}${d.pct ? " by " + d.pct + " %" : ""} ${code.endsWith("-200") ? "with 200 % text at the page's own width" : "at a 320 px viewport"}${d.base ? " (and already at the normal width, so this is a layout bug rather than a zoom regression)" : ""} — the covered control cannot be clicked or seen, and a keyboard user has no idea where focus went (WCAG 1.4.10 Reflow / 1.4.4 Resize text). Absolute positioning and fixed widths do not reflow; let the row wrap or stack the controls below 480 px.`);
    }
    case "reflow-fixed-too-tall": {
      const sel = SR_ATTRV(html, "id") ? "#" + SR_ATTRV(html, "id") : SR_ATTRV(html, "class") ? "." + SR_ATTRV(html, "class").split(" ")[0] : tag;
      const d = ctx.reflow || {};
      return F(`${sel} {\n  position: sticky;      /* scrolls with the content instead of covering it */\n  top: 0;\n  max-height: 40vh;\n  overflow: auto;\n}\n@media (max-width: 480px) {\n  ${sel} { position: static; }   /* or collapse the bar into a menu button */\n}`,
        `The ${d.position || "fixed"} bar is ${d.height ? d.height + " px tall (" + d.pct + " % of the screen)" : "taller than a quarter of the screen"} at 320 px — at 400 % zoom it hides most of the page and the content underneath can never be scrolled into view (WCAG 1.4.10 Reflow). Cap its height, let it scroll, or make it static on narrow viewports.`);
    }
    case "html-lang-missing":
      return F(ctx.detected === "ar" ? '<html lang="ar" dir="rtl">' : ctx.detected === "latin" ? '<html lang="en">' : '<html lang="LANGUAGE_CODE">',
        "The screen reader picks its voice/pronunciation rules from <html lang>. Without it Arabic pages are read with an English voice (or vice versa).");
    case "html-lang-invalid":
    case "lang-invalid":
      return F(`lang="ar"      <!-- Arabic -->\nlang="en"      <!-- English -->\nlang="ar-AE"   <!-- region subtag optional -->`,
        `"${ctx.declared}" is not a BCP 47 tag, so it is ignored. Use the 2-letter ISO code, optionally with a region.`);
    case "html-lang-mismatch":
      return F(ctx.detected === "Arabic" ? '<html lang="ar" dir="rtl">' : '<html lang="en">',
        "Set <html lang> to the language most of the page is written in; mark the exceptions inline with lang on a span/p.");
    case "html-dir":
      return F('<html lang="ar" dir="rtl">', "dir=\"rtl\" on <html> fixes punctuation and mixed-number order for the whole page (and flips the layout in CSS logical properties).");
    case "text-mismatch": {
      const code = ctx.detected === "Arabic" ? "ar" : "en";
      const snip = ctx.snippet || "TEXT";
      const fixed = html.includes(snip) ? html.replace(snip, `<span lang="${code}"${code === "ar" ? ' dir="rtl"' : ""}>${snip}</span>`) : `<span lang="${code}">${snip}</span>`;
      return F(fixed, `Wrap the ${ctx.detected} fragment in an element with lang="${code}" — the screen reader switches voice for that span only. Bilingual UAE pages: every embedded English name/term inside Arabic copy (and the reverse) needs this.`);
    }
    case "dir":
      return F(SR_ATTR(html.replace(/\sdir="[^"]*"/, ""), 'dir="rtl"') + '\n<!-- mixed/unknown content: dir="auto" -->',
        "Arabic laid out LTR mis-orders numbers, brackets and punctuation. dir=\"rtl\" on the block (or dir=\"auto\" for user content) fixes rendering order.");
    default:
      return null;
  }
}

// Token-level diff of two markup strings for the "Now → Change to" blocks. Tokens split on
// whitespace and on tag boundaries (`<`, `>`, `/>`); whitespace runs are never marked.
// Returns [{ type: "same" | "add" | "del", text }] in output order (dels before adds at a
// change point). LCS on the token arrays; very long inputs fall back to a set diff.
function srDiffTokens(a, b) {
  const tok = (s) => (String(s || "").match(/\s+|<\/?[^\s<>]*|\/?>|[^\s<>]+/g) || []);
  const isWs = (x) => /^\s+$/.test(x);
  const A = tok(a), B = tok(b);
  const out = [];
  if (A.length * B.length > 250000) {
    const inA = new Set(A.filter((x) => !isWs(x))), inB = new Set(B.filter((x) => !isWs(x)));
    for (const x of A) if (!isWs(x) && !inB.has(x)) out.push({ type: "del", text: x });
    for (const x of B) out.push({ type: isWs(x) || inA.has(x) ? "same" : "add", text: x });
    return out;
  }
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: "same", text: A[i] }); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) { out.push({ type: isWs(A[i]) ? "same-del" : "del", text: A[i] }); i++; }
    else { out.push({ type: isWs(B[j]) ? "same-add" : "add", text: B[j] }); j++; }
  }
  while (i < n) { out.push({ type: isWs(A[i]) ? "same-del" : "del", text: A[i] }); i++; }
  while (j < m) { out.push({ type: isWs(B[j]) ? "same-add" : "add", text: B[j] }); j++; }
  return out;
}

// Fill `code` with spans built from the diff: the "now" side shows same + del tokens, the
// "change to" side shows same + add tokens. textContent only — never innerHTML with page markup.
function srDiffFill(code, diff, side) {
  code.textContent = "";
  const frag = document.createDocumentFragment();
  for (const d of diff) {
    const mark = d.type === "add" || d.type === "del";
    const keep = side === "del" ? d.type === "same" || d.type === "del" || d.type === "same-del" : d.type === "same" || d.type === "add" || d.type === "same-add";
    if (!keep) continue;
    if (mark) {
      const span = document.createElement("span");
      span.className = d.type === "add" ? "sr-diff-add" : "sr-diff-del";
      span.textContent = d.text;
      frag.appendChild(span);
    } else frag.appendChild(document.createTextNode(d.text));
  }
  code.appendChild(frag);
}

function srFixBlock(fix, ctx, prompt) {
  const wrap = document.createElement("div");
  wrap.className = "fix-suggestion sr-fix";
  const diff = ctx.html ? srDiffTokens(ctx.html, fix.snippet) : null;
  if (ctx.html) {
    const now = document.createElement("div");
    now.className = "fix-note";
    now.textContent = t("srNow");
    const cur = document.createElement("code");
    cur.className = "fix-snippet sr-current";
    srDiffFill(cur, diff, "del");
    wrap.append(now, cur);
  }
  const lbl = document.createElement("div");
  lbl.className = "fix-note";
  lbl.textContent = srChangeToLabel();
  if (diff) lbl.title = t("srDiffLegend");
  const snippet = document.createElement("code");
  snippet.className = "fix-snippet";
  if (diff) srDiffFill(snippet, diff, "add"); else snippet.textContent = fix.snippet;
  const note = document.createElement("div");
  note.className = "fix-note";
  note.textContent = fix.note;
  wrap.append(lbl, snippet, note);

  const actions = document.createElement("div");
  actions.className = "actions";
  const copyBtn = document.createElement("button");
  copyBtn.className = "ghost";
  setLabel(copyBtn, "i-copy", t("copyFix"));
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(fix.snippet);
    setLabel(copyBtn, "i-check", t("copied"));
    setTimeout(() => { setLabel(copyBtn, "i-copy", t("copyFix")); }, 1200);
  });
  actions.appendChild(copyBtn);
  if (ctx.sel && ctx.sel !== "body" && ctx.sel !== "html" && !ctx.sel.includes(" >>> ")) {
    const inspectBtn = document.createElement("button");
    inspectBtn.className = "ghost";
    setLabel(inspectBtn, "i-inspect", t("inspect"));
    inspectBtn.title = t("inspectTitle");
    inspectBtn.addEventListener("click", () => inspectElement(ctx.sel));
    actions.appendChild(inspectBtn);
  }
  const aiBtn = document.createElement("button");
  aiBtn.className = "ghost";
  setLabel(aiBtn, "i-sparkle", t("aiFix"));
  aiBtn.addEventListener("click", async () => {
    let out = wrap.querySelector(".ai-output");
    if (!out) { out = document.createElement("div"); out.className = "ai-output"; wrap.appendChild(out); }
    try {
      const key = await bg("storeGet", { key: "aiKey" });
      if (!key) { out.textContent = t("aiNoKey"); return; }
      aiBtn.disabled = true;
      out.textContent = t("aiThinking");
      out.textContent = await bg("aiFix", { prompt:
        "You are an accessibility expert. Fix this screen reader problem.\n" +
        "Problem: " + prompt + "\n" +
        "HTML: " + (ctx.html || "(see selector " + ctx.sel + ")") + "\n" +
        "Framework: " + (settings.framework || "html") + "\n" +
        "Reply with ONLY the corrected code snippet followed by one short explanation line." });
    } catch (err) {
      out.textContent = t("aiFailed") + (err?.message || err);
    } finally {
      aiBtn.disabled = false;
    }
  });
  actions.appendChild(aiBtn);
  wrap.appendChild(actions);
  const apply = srApplyControls(ctx);
  if (apply) wrap.appendChild(apply);
  return wrap;
}

/* ---- apply a fix in place, then re-verify ----
   Mechanical fixes (attributes, a live-region role, a div→button retag, a lang wrapper)
   can be applied to the inspected page from the fix block. background.js keeps an undo
   stack per selector; the panel re-runs the section's check and marks the row ✓ when the
   issue is gone. Changes live only in the current page load. */

const SR_HUMANIZE = (s) => (s || "").replace(/\.[a-z0-9]+$/i, "").replace(/[-_.]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
const SR_LANG_OF = (detected) => (/^(ar|arabic)$/i.test(detected || "") ? "ar" : /^(latin|en)$/i.test(detected || "") ? "en" : "");

// -> { build(value) -> patch, input: { label, value } | null, note } or null when the fix is not mechanical.
function srPatchFor(code, ctx) {
  const html = (ctx.html || "").trim();
  const tag = SR_TAG(html);
  const cls = SR_ATTRV(html, "class");
  const attr = (name, value) => ({ setAttr: { [name]: value } });
  const guessName = () => {
    const explicit = SR_ATTRV(html, "title") || SR_ATTRV(html, "placeholder") || SR_ATTRV(html, "aria-placeholder");
    if (explicit) return explicit;
    const hint = [["close|dismiss", "Close"], ["search", "Search"], ["menu|burger|hamburger", "Menu"], ["next|forward", "Next"], ["prev|back", "Previous"],
      ["cart|basket", "Add to cart"], ["delete|remove|trash", "Delete"], ["edit|pencil", "Edit"], ["play", "Play"], ["pause", "Pause"], ["share", "Share"], ["download", "Download"]]
      .find(([re]) => new RegExp(re, "i").test(cls + " " + SR_ATTRV(html, "id") + " " + SR_ATTRV(html, "name")));
    if (hint) return hint[1];
    return SR_HUMANIZE(SR_ATTRV(html, "name") || SR_ATTRV(html, "id")) || SR_HUMANIZE(ctx.role || tag);
  };
  switch (code) {
    case "no-name":
      return { input: { label: t("srApplyName"), value: guessName() }, build: (v) => attr("aria-label", v) };
    case "img-no-name": {
      const src = SR_ATTRV(html, "src").split(/[?#]/)[0].split("/").pop();
      return { input: { label: t("srApplyAlt"), value: SR_HUMANIZE(decodeURIComponent(src)) }, build: (v) => attr("alt", v) };
    }
    case "placeholder-only":
      return { build: () => attr("aria-label", SR_ATTRV(html, "placeholder") || ctx.name || "FIELD_LABEL"), note: "Quick fix only — the real fix is a visible <label for>." };
    case "title-only":
      return { build: () => attr("aria-label", SR_ATTRV(html, "title") || ctx.name || "ACTION_NAME") };
    case "label-in-name":
      return { build: () => ({ removeAttr: ["aria-label"] }) };
    case "clickable-no-role":
      return { build: () => ({ retag: "button" }), note: "Listeners added with addEventListener are lost on retag — inline onclick is kept." };
    case "hidden-focusable":
      return { build: () => attr("inert", "") };
    case "in-aria-hidden":
      return { build: () => ({ setAttr: { inert: "" }, closest: "[aria-hidden='true']" }) };
    case "tabindex-neg":
    case "positive-tabindex":
      return { build: () => attr("tabindex", "0") };
    case "silent":
    case "transient":
      return { build: () => ({ liveRegion: "status" }) };
    case "state-missing": {
      const name = ctx.attr || "aria-pressed";
      const on = /\b(active|selected|checked|on|current|expanded|open)\b/i.test(cls);
      return { build: () => attr(name, on ? "true" : "false"), note: "Quick fix reflects the current state only — the script that toggles the class must update the attribute too." };
    }
    case "required-not-exposed":
      return { build: () => attr("aria-required", "true") };
    case "readonly-misuse":
      return { build: () => ({ removeAttr: ["readonly", "aria-readonly"] }), note: "Removes readonly only — make sure the picker script accepts typed input." };
    case "group-no-label": {
      const roleName = ctx.info === "radio" ? "radiogroup" : "group";
      return { input: { label: t("srApplyGroupLabel"), value: (ctx.hint || "").trim() }, build: (v) => ({ setAttr: { role: roleName, "aria-label": v } }), note: "Quick fix only — the real fix is <fieldset> + <legend> (or aria-labelledby pointing at the visible heading)." };
    }
    case "question-not-associated":
      if (ctx.info !== "tight") return null; // the parent holds more than the question and its buttons — nothing mechanical to apply
      return { input: { label: t("srApplyGroupLabel"), value: (ctx.hint || "").trim() }, build: (v) => ({ parent: true, setAttr: { role: "group", "aria-label": v } }), note: "Applies role=\"group\" with the question as its name to the parent element." };
    case "label-not-associated":
      return { input: { label: t("srApplyFieldLabel"), value: (ctx.hint || ctx.info || "").replace(/[:：*]+\s*$/, "").trim() }, build: (v) => attr("aria-label", v), note: "Quick fix only — the real fix is <label for> so the visible text is the name." };
    case "link-new-window":
      return { build: () => ({ appendHidden: "(opens in a new tab)" }), note: "Adds hidden hint text inside the link — visible text is the better long-term fix." };
    case "link-download-hint":
      return { build: () => ({ appendHidden: `(${ctx.info || "PDF"})` }), note: "Adds the file type as hidden text — add the size, and prefer showing it visibly." };
    case "link-external-hint":
      return { build: () => ({ appendHidden: "(external link)" }) };
    case "link-as-button":
      if (ctx.info === "current") return { build: () => ({ setAttr: { "aria-current": "page" }, removeAttr: ["href"] }) };
      if (ctx.info === "nav") return null; // needs the real URL — nothing mechanical to apply
      return { build: () => ({ retag: "button" }), note: "Drops href/target and retags as <button type=\"button\">; listeners added with addEventListener are lost — inline onclick is kept." };
    case "dup-landmark":
      return { input: { label: t("srApplyLandmark"), value: SR_HUMANIZE(SR_ATTRV(html, "id") || cls.split(" ")[0]) || SR_HUMANIZE(ctx.role || tag) }, build: (v) => attr("aria-label", v) };
    case "text-mismatch": {
      const lang = SR_LANG_OF(ctx.detected) || "en";
      return { build: () => ({ wrapText: { text: ctx.snippet || "", lang, dir: lang === "ar" ? "rtl" : "" } }) };
    }
    case "dir":
    case "html-dir":
      return { build: () => attr("dir", "rtl") };
    case "html-lang-missing":
    case "html-lang-mismatch":
    case "html-lang-invalid":
    case "lang-invalid": {
      const declared = (ctx.declared || "").trim().toLowerCase().split(/[-_]/)[0];
      const value = SR_LANG_OF(ctx.detected) || (/^[a-z]{2,3}$/.test(declared) ? declared : "");
      return { input: { label: t("srApplyLang"), value }, build: (v) => {
        const p = { setAttr: { lang: v } };
        if (code.startsWith("html-") && /^ar\b/i.test(v)) p.setAttr.dir = "rtl";
        return p;
      } };
    }
    default:
      return null;
  }
}

const srSelMatch = (e, sel) => !!sel && (e.cur === sel || e.key === sel);
// true = the issue no longer appears for that element, false = still flagged, null = cannot tell (live/focus, or the section has not re-run)
function srEntryFixed(e) {
  const rows = e.section === "order" ? srState.order?.rows : e.section === "ax" ? srState.ax?.rows : null;
  if (rows) return !rows.some((r) => srSelMatch(e, r.sel) && r.issues.some((i) => i.code === e.code));
  if (e.section === "lang" && srState.lang) return !srState.lang.issues.some((i) => srSelMatch(e, i.sel) && i.type === e.code);
  return null;
}
function srFixedEntries(section, sel) {
  return srState.applied.filter((e) => e.section === section && srSelMatch(e, sel) && srEntryFixed(e) === true);
}
function srAppliedEntries(section, sel, code) {
  return srState.applied.filter((e) => e.section === section && srSelMatch(e, sel) && e.code === code);
}

async function srVerifyApplied(e) {
  if (e.section === "order") await buildReadingOrder();
  else if (e.section === "ax") await fetchAxTree();
  else if (e.section === "lang") await runLangCheck();
  else if (e.section === "live") renderLiveLog();
  else renderFocusLog();
  renderSrScore();
  srJumpTo(e.section, e.cur);
}

async function srApplyFix(ctx, patch, ui) {
  ui.applyBtn.disabled = true;
  ui.status.textContent = t("srApplying");
  try {
    const r = await bg("srApply", { selector: ctx.sel, patch });
    if (!r || r.error) throw new Error(r?.error || "no result");
    const e = { section: ctx.section, key: ctx.sel, cur: r.sel || ctx.sel, code: ctx.code, warning: r.warning || "", html: r.html || "" };
    srState.applied.push(e);
    statusEl.textContent = t("srFixApplied") + (e.warning ? " — " + e.warning : "");
    await srVerifyApplied(e);
  } catch (err) {
    ui.status.textContent = t("srApplyFailed") + (err?.message || err);
    ui.applyBtn.disabled = false;
  }
}

async function srUndoFix(e, btn) {
  if (btn) btn.disabled = true;
  try {
    const r = await bg("srUndo", { selector: e.key });
    if (!r || r.error) throw new Error(r?.error || "no result");
    const idx = srState.applied.lastIndexOf(e);
    if (idx >= 0) srState.applied.splice(idx, 1);
    statusEl.textContent = t("srFixUndone");
    await srVerifyApplied({ ...e, cur: e.key });
  } catch (err) {
    statusEl.textContent = t("srApplyFailed") + (err?.message || err);
    if (btn) btn.disabled = false;
  }
}

// Compact block for a row whose applied fix no longer shows the issue: ✓ message + Undo.
function srFixedBlock(e) {
  const wrap = document.createElement("div");
  wrap.className = "fix-suggestion sr-fix sr-fixed-block";
  const msg = document.createElement("div");
  msg.className = "fix-note";
  msg.textContent = t("srFixedMsg") + (e.warning ? " " + e.warning + "." : "") + " " + t("srApplyTemp");
  const actions = document.createElement("div");
  actions.className = "actions";
  const undoBtn = document.createElement("button");
  undoBtn.className = "sr-undo ghost";
  setLabel(undoBtn, "i-undo", t("srUndo"));
  undoBtn.addEventListener("click", () => srUndoFix(e, undoBtn));
  actions.appendChild(undoBtn);
  wrap.append(msg, actions);
  return wrap;
}

// Apply / Undo controls appended to a fix block (only for codes with a mechanical patch).
function srApplyControls(ctx) {
  if (!ctx.sel || !ctx.code || !ctx.section) return null;
  const p = srPatchFor(ctx.code, ctx);
  if (!p) return null;
  const wrap = document.createElement("div");
  wrap.className = "sr-apply";
  let input = null;
  if (p.input) {
    input = document.createElement("input");
    input.type = "text";
    input.className = "sr-apply-input";
    input.value = p.input.value;
    input.placeholder = p.input.label;
    input.setAttribute("aria-label", p.input.label);
    wrap.appendChild(input);
  }
  const applyBtn = document.createElement("button");
  applyBtn.className = "sr-apply-btn ghost";
  setLabel(applyBtn, "i-play", t("srApply"));
  applyBtn.title = (p.note ? p.note + " " : "") + t("srApplyTemp");
  const status = document.createElement("span");
  status.className = "sr-apply-status";
  wrap.append(applyBtn, status);
  const applied = srAppliedEntries(ctx.section, ctx.sel, ctx.code);
  if (applied.length) {
    const e = applied[applied.length - 1];
    const fixed = srEntryFixed(e);
    status.textContent = fixed === true ? t("srFixedMsg") : fixed === false ? t("srStillFlagged") : ctx.section === "live" ? t("srAppliedVerifyLive") : t("srAppliedVerifyFocus");
    if (fixed !== false) status.classList.add("ok");
    const undoBtn = document.createElement("button");
    undoBtn.className = "sr-undo ghost";
    setLabel(undoBtn, "i-undo", t("srUndo"));
    undoBtn.addEventListener("click", () => srUndoFix(e, undoBtn));
    wrap.insertBefore(undoBtn, status);
  }
  applyBtn.addEventListener("click", () => {
    if (input && p.input && !input.value.trim() && ctx.code !== "img-no-name") { input.focus(); return; }
    srApplyFix(ctx, p.build(input ? input.value.trim() : undefined), { applyBtn, status });
  });
  if (p.note) {
    const n = document.createElement("div");
    n.className = "fix-note sr-apply-note";
    n.textContent = p.note;
    wrap.appendChild(n);
  }
  return wrap;
}

// Attach fixes for a list of issues to a row (grid column 2).
function srAppendFixes(row, issues, ctx, column) {
  row.dataset.srCodes = issues.map((i) => i.code).filter(Boolean).join(" ");
  const seen = new Set();
  for (const i of issues) {
    if (!i.code || seen.has(i.code)) continue;
    seen.add(i.code);
    const fix = srFixFor(i.code, { ...ctx, attr: i.attr, info: i.info, hint: i.hint });
    if (!fix) continue;
    srMoreAdd(row, srFixBlock(fix, { ...ctx, code: i.code, attr: i.attr, info: i.info, hint: i.hint }, srIssueMsg(i)), column || "2");
  }
}

/* ---- Run all checks + step summary wiring ---- */

// Reading order -> languages -> focus trace + auto-walk -> live monitoring (left running).
async function srRunAll() {
  if (ovRunning.has("sr")) return;
  setRunBusy(true);
  srRunAllBtn.disabled = true;
  ovRunning.add("sr");
  renderOverview();
  try {
    try { await buildReadingOrder(); } catch (err) { console.error(err); }
    try { await runLangCheck(); } catch (err) { console.error(err); }
    try { await runNtcCheck(); } catch (err) { console.error(err); }
    // Reflow needs chrome.debugger: only when the permission is already granted (requesting it would need a user gesture)
    try {
      const available = await bg("axTreeAvailable").catch(() => false);
      const granted = available && (await bg("debuggerGranted").catch(() => false));
      if (granted) await runReflowTest();
      else if (!srState.reflow) { if (available) { srSetStep("reflow", "error"); srGrantNote(srReflowList, t("srReflowSkipped")); } else srEmpty(srReflowList, t("srReflowUnavailable")); }
    } catch (err) { console.error(err); }
    try { await focusWalk(); } catch (err) { console.error(err); }
    try { await startLive(false); } catch (err) { console.error(err); }
    lastRunAt = Date.now();
    statusEl.textContent = t("srRunAllDone");
  } finally {
    ovRunning.delete("sr");
    srRunAllBtn.disabled = false;
    setRunBusy(false);
    renderOverview();
  }
}
srRunAllBtn.addEventListener("click", srRunAll);
// The start button sits inside the step's <summary>: let its own listener run (bubble phase on
// the button), then stop the click here so the summary never toggles.
for (const sa of srSteps.querySelectorAll(".step-actions")) {
  sa.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); });
}
