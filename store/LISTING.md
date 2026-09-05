# Chrome Web Store listing — copy-paste material

## Basic info

- **Name:** A11y Miyar — Accessibility Checker
- **Category:** Developer Tools
- **Language:** English

## Short description (max 132 chars)

```
Scan any page for WCAG violations with axe-core. Guided manual tests, user flow
recording, contrast checker & exportable reports.
```
(129 characters)

## Detailed description

```
A11y Miyar is a complete accessibility auditing toolkit that lives inside your
browser's DevTools. It combines automated scanning (powered by axe-core, the
open-source engine behind Lighthouse) with guided manual testing — because
automated tools alone catch only 30–50% of WCAG issues.

AUTOMATED SCANNING
• One-click axe-core audit of the inspected page, including iframes
• Pick your target: WCAG 2.0 A/AA, 2.1 AA, 2.2 AA, or all rules (+ best practices)
• Findings sorted by severity with the offending HTML, fix guidance, and docs links
• Click any finding to highlight the element on the page, or jump straight to it
  in the Elements panel
• "Highlight all" paints every violation on the page, color-coded by severity

GUIDED MANUAL TESTS (WIZARDS)
• 10 step-by-step wizards for what machines can't judge: keyboard navigation,
  focus visibility & order, headings, landmarks, alt-text quality, zoom/reflow,
  screen readers, motion, and forms
• One yes/no question at a time — the verdict is computed from your answers
• Every "No" becomes a recorded finding; optionally attach a note and pick the
  offending element directly on the page
• Interactive helpers do the setup: numbered tab stops, heading outline,
  landmark overlay, alt-text overlay

USER FLOW RECORDING
• Press record, then use the site: menus, modals, multi-page checkouts
• Every page and UI state is scanned automatically; findings are de-duplicated
  and labeled with the page they came from

AND MORE
• Scan history per URL: "3 new · 5 fixed since last scan" with NEW badges
• Stale-results warning when the page changes after a scan
• Color-contrast eyedropper with WCAG AA/AAA verdicts — sample any pixel on screen
• Export reports as JSON, CSV, or a shareable standalone HTML file
• Options: default rule set, flow scan interval, English or Arabic (RTL) interface
• Keyboard shortcuts: S scan, R record flow, X clear, C contrast, 1–6 tabs, / filter

NEW IN v1.15
• 🔊 Screen reader tab — what a screen reader actually receives: the announced
  reading order with every name, role and state; a live-region monitor that
  classifies each page change as ANNOUNCED, VIA FOCUS, MAY BE MISSED or SILENT;
  a focus trace (focus lost after a delete, focus escaping a modal, hidden or
  unnamed targets) with a keyboard auto-walk; SPA route-change checks (stale
  title, duplicate H1, focus stuck); missing state on custom controls; link
  behaviour (new tab, download, external, href="#"); Arabic/English voice
  switching; a bilingual AR/EN page comparison; the real browser accessibility
  tree (Chromium, opt-in); a journey transcript for recorded flows
• Every screen reader finding ships a fix: current HTML → corrected snippet
  (HTML/React/Vue) with an inline diff, Apply-on-page with re-verify, Copy,
  Inspect, and a spoken preview of what the screen reader would say
• Screen reader score and Top 5 to fix; findings flow into Issues/Jira/Azure
  tickets with a "How to verify" step
• Redesigned panel: one Run button, an Overview tab with per-audit cards and
  Top issues, contextual toolbars with filters on every tab, scan presets
  (Recommended / Strict WCAG / Everything — best-practice rules on by default),
  dark mode and full RTL

NEW SINCE v1.0
• 🇦🇪 UAE Design System (DLS) audit — 13 checks against the official AEGov design
  system (mandated for UAE federal entities): component adoption, fonts, type
  scale, the real 115-token color palette with nearest-token suggestions,
  bilingual/RTL, button sizing — with gap highlighting on the page, per-element
  detail, fixes, and links to the standard
• Fix suggestions for every finding: copy-ready corrected snippets
  (HTML/React/Vue), computed passing contrast colors — optionally from the UAE
  DLS palette — live Preview fix with Undo, and one-click Auto-fix page
• Two-way navigation: click a finding to highlight it on the page, or click a
  highlighted element on the page to jump to its finding
• Reports with evidence: annotated screenshots embedded in HTML/PDF exports,
  rule summary, per-element selectors
• Ticketing exports: GitHub issues markdown, Jira bulk-import CSV, Azure DevOps
  work items
• Violation filter/search, scan-history trend charts, loading estimates for
  heavy pages
• Full Arabic interface and content, incl. all manual test wizards and help

PRIVACY
Everything runs locally in your browser. No data is collected, transmitted,
or sold — scan results and settings never leave your machine.

A11y Miyar uses the axe-core engine (© Deque Systems, MPL-2.0). This extension
is not affiliated with or endorsed by Deque Systems. "axe" is a trademark of
Deque Systems, Inc.
```

## Permission justifications (Privacy practices tab)

- **scripting:** Required to inject the bundled axe-core accessibility engine
  and highlighting/measurement helpers into the page the user is auditing from
  the DevTools panel. No remote code is executed; all injected code ships inside
  the extension package.
- **storage:** Stores the user's settings (rule set, language, scan interval)
  and per-URL scan history / manual test verdicts locally so users can compare
  scans over time. No data leaves the device.
- **Host permission `<all_urls>`:** The extension is a developer tool that must
  be able to audit whichever page the developer has open in DevTools. Scans run
  only when the user explicitly clicks Scan / Record in the panel.
- **Optional permission `debugger`:** Requested only when the user clicks
  "Grant" on the Options page and used for two opt-in checks in the Screen
  reader tab: reading the browser's real accessibility tree (what NVDA/VoiceOver
  receive) and the reflow test. The extension attaches to the inspected tab for
  about a second, runs the read-only DevTools-protocol commands, and detaches.
  Chrome shows its standard "is debugging this tab" bar during that time.
  Nothing is recorded or transmitted.
- **Remote code:** None. axe-core is bundled in the package (vendor/axe.min.js).
- **Data usage declaration:** does NOT collect any user data (tick "no" on all
  categories).

## Single purpose description

```
Audits the web page open in DevTools for accessibility (WCAG) issues and guides
the developer through fixing them.
```

## Assets checklist

- [x] Screenshots (1280×800): store/screenshots/1-automated-scan.png,
      2-dls-audit.png, 3-manual-wizard.png, 4-overview.png,
      5-screen-reader.png, 6-route-change.png (v1.15 UI)
- [x] Icon 128×128: icons/icon128.png (auto-pulled from the package)
- [ ] Optional small promo tile 440×280 (can skip at first)
- [ ] Privacy policy URL — host store/PRIVACY.md publicly (e.g. GitHub repo /
      gist / GitHub Pages) and paste the URL

## Reviewer notes — Chrome Web Store (privacy practices / review replies)

```
Single purpose: audit the page open in DevTools for accessibility (WCAG)
issues and guide the developer to fix them.

Permissions
- scripting: inject the bundled axe-core engine and helper scripts into the
  inspected tab when the user clicks Run/Scan. No remote code.
- storage: user settings and per-URL results, stored locally.
- Host <all_urls>: the developer chooses the page by opening DevTools on
  it; scans run only on explicit clicks.
- Optional debugger: requested only when the user clicks Grant in Options.
  Used for two opt-in checks: reading the browser's accessibility tree
  (Accessibility.getFullAXTree) and a 320 px reflow test
  (Emulation.setDeviceMetricsOverride). Attaches for about a second,
  read-only commands, detaches immediately. Chrome's "is debugging this
  tab" bar is shown during that time.

Remote code: none. axe-core 4.13.0 is bundled unmodified.
Data usage: the extension collects no user data. The optional AI fix
feature sends the selected finding's HTML to api.anthropic.com only when
the user has entered their own API key and clicks the button.
```
