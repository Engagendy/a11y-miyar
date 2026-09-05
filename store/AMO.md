# Firefox Add-ons (AMO) submission kit

Package: `store/a11y-miyar-firefox-v1.15.0.zip` (built by `./build-firefox.sh` from the
v1.15.0 commit; also at `dist/a11y-miyar-firefox.zip`,
gecko id `a11y-lens@engagendy.dev`, event-page background).

## Steps

1. Create/sign in at https://addons.mozilla.org → developer hub
   (https://addons.mozilla.org/developers/) → **Submit a New Add-on**
2. Choose **On this site** (listed) → upload `dist/a11y-miyar-firefox.zip`
3. Firefox validation runs automatically. Expected results:
   - 0 errors (the manifest declares
     `data_collection_permissions: {"required": ["none"]}` — Firefox's
     built-in data-consent requirement; this extension collects nothing)
   - ~10 warnings, all inside `vendor/axe.min.js` ("Function constructor is
     eval", "unsafe innerHTML") — these are part of the official axe-core
     build and are informational; they do not block review
4. **Source code step:** because `vendor/axe.min.js` is minified, AMO asks
   about source. Answer: the minified file is the unmodified official release
   of the public library axe-core v4.13.0 (MPL-2.0), byte-identical to
   https://cdn.jsdelivr.net/npm/axe-core@4.13.0/axe.min.js
   (https://github.com/dequelabs/axe-core/releases). Per AMO policy, known
   third-party libraries referenced to their official source do not require
   uploading source. All first-party code in the package is unminified.
   Paste that note into "Notes to Reviewer".
5. Listing fields: reuse `store/LISTING.md` (name, summary, description).
   Category: Developer Tools / Web Development. Privacy policy: the GitHub
   PRIVACY.md URL. Screenshots: the same three PNGs in `store/screenshots/`.
6. Submit. AMO review of new listed add-ons typically takes days to ~2 weeks.

## Firefox-specific notes (also add to the AMO description)

- The color-contrast eyedropper is unavailable in Firefox (no EyeDropper API);
  the panel shows a notice instead.
- The browser accessibility tree and reflow test in the Screen reader tab use
  chrome.debugger and are Chromium-only; the Firefox build strips the optional
  `debugger` permission and the buttons explain this. Everything else works
  identically, including spoken playback (speechSynthesis).
- Local testing: about:debugging → This Firefox → Load Temporary Add-on →
  pick dist/firefox/manifest.json.

## Release notes — 1.15.0 (paste into "Release notes" on upload)

```
New: Screen reader tab
• Reading order with every accessible name, role and state, and the issues a
  screen reader user hits: unnamed controls, generic "read more" links,
  placeholder-only names, duplicate names, clickable divs without a role
• Live-region monitor: every page change classified as ANNOUNCED, VIA FOCUS,
  MAY BE MISSED or SILENT (toasts, validation errors, filters, counters)
• Focus trace and keyboard auto-walk: focus lost after a delete, focus
  escaping a dialog, unreachable controls, order jumps
• Single-page-app navigation checks: unchanged title, duplicate H1, focus
  not moved, nothing announced
• Missing state on custom controls (aria-selected / expanded / pressed /
  current, required markers) and link behaviour (new tab, download, external,
  href="#")
• Arabic/English voice-switching check and a bilingual page comparison
• Journey transcript for recorded flows, a 0–100 score with Top 5 to fix
• Every finding comes with a corrected snippet (HTML, React or Vue), an inline
  diff, Apply-on-page with re-verify, and a spoken preview

New: redesigned panel
• One Run button, an Overview tab with per-audit cards and top issues,
  filters on every tab, scan presets (Recommended / Strict WCAG / Everything)
• Best-practice rules such as heading order and landmarks are now on by
  default
• Dark mode and full right-to-left layout
• Exports available as soon as any tab has results; screen reader findings
  included in Issues, Jira and Azure exports with a "how to verify" step

Firefox notes
• The browser accessibility tree and reflow test are Chromium-only and are
  marked as unavailable in Firefox. The contrast eyedropper is still
  unavailable in Firefox (no EyeDropper API). Everything else, including
  spoken playback, works identically.
```
