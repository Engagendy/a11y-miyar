const { suggestFix, contrastFix, previewPatch, issuesMarkdown, frameworkizeSnippet, srVerifyStep, srFindings } = require("./fixes.js");

let failed = 0;
function assert(cond, msg) {
  console.assert(cond, msg);
  if (!cond) failed++;
}

// suggestFix across frameworks
const frameworks = ["html", "react", "vue"];
const imgNode = { html: '<img src="a.png">', target: ["img"], failureSummary: "" };
const inputNode = { html: '<input type="text" id="email">', target: ["#email"], failureSummary: "" };
const btnNode = { html: '<button class="icon"></button>', target: ["button"], failureSummary: "" };

frameworks.forEach(function (fw) {
  const img = suggestFix("image-alt", imgNode, fw);
  assert(img && img.snippet.indexOf('alt="DESCRIBE_IMAGE"') !== -1, "image-alt snippet " + fw);
  assert(img && img.note.length > 0, "image-alt note " + fw);

  const lbl = suggestFix("label", inputNode, fw);
  assert(lbl && lbl.snippet.indexOf("<label") !== -1, "label snippet " + fw);
  if (fw === "react") assert(lbl.snippet.indexOf('htmlFor="email"') !== -1, "label react htmlFor");
  else assert(lbl.snippet.indexOf('for="email"') !== -1, "label " + fw + " for=");

  const btn = suggestFix("button-name", btnNode, fw);
  assert(btn && btn.snippet.indexOf("BUTTON_TEXT") !== -1, "button-name snippet " + fw);
});

// React self-closing img
assert(suggestFix("image-alt", imgNode, "react").snippet.indexOf("/>") !== -1, "react self-closing img");

// unknown rule
assert(suggestFix("nope", imgNode, "html") === null, "unknown ruleId null");

// contrastFix
const summary = "Element has insufficient color contrast of 2.85 (foreground color: #9e9e9e, background color: #ffffff, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1";
const cf = contrastFix(summary);
assert(cf !== null, "contrastFix parses sample");
assert(cf.from === "#9e9e9e", "contrastFix from");
assert(cf.bg === "#ffffff", "contrastFix bg");
assert(cf.required === 4.5, "contrastFix required");
assert(cf.ratio >= 4.5, "contrastFix ratio >= 4.5, got " + (cf && cf.ratio));
assert(/^#[0-9a-f]{6}$/.test(cf.to), "contrastFix to is 6-digit hex");
assert(cf.to !== "#9e9e9e", "contrastFix color changed");

// liberal parsing: short hex, alternate labels, 3:1
const cf2 = contrastFix("foreground: #999, background: #fff. Expected contrast ratio of 3:1");
assert(cf2 && cf2.required === 3 && cf2.ratio >= 3, "contrastFix liberal parse");
assert(contrastFix("no colors here") === null, "contrastFix null on garbage");

// previewPatch shapes
const p1 = previewPatch("image-alt", imgNode);
assert(p1 && p1.attrs.alt === "Description placeholder", "previewPatch image-alt");
const p2 = previewPatch("button-name", btnNode);
assert(p2 && p2.attrs["aria-label"] === "Description placeholder", "previewPatch button-name");
const p3 = previewPatch("color-contrast", { html: "<p>x</p>", target: ["p"], failureSummary: summary });
assert(p3 && p3.styles.color === cf.to, "previewPatch color-contrast");
assert(previewPatch("color-contrast", { failureSummary: "junk" }) === null, "previewPatch contrast null");
const p4 = previewPatch("aria-hidden-focus", {});
assert(p4 && p4.attrs.tabindex === "-1", "previewPatch aria-hidden-focus");
const p5 = previewPatch("html-has-lang", {});
assert(p5 && p5.attrs.lang === "en", "previewPatch html-has-lang");
assert(previewPatch("heading-order", {}) === null, "previewPatch others null");

// issuesMarkdown
const report = {
  url: "https://example.com",
  scannedAt: "2026-08-12T10:00:00Z",
  ruleSet: "wcag21aa",
  violations: [
    {
      id: "image-alt",
      impact: "critical",
      help: "Images must have alternate text",
      description: "Ensures <img> elements have alternate text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.8/image-alt",
      nodes: [imgNode],
      nodeTotal: 1
    },
    {
      id: "color-contrast",
      impact: "serious",
      help: "Elements must meet minimum color contrast",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
      nodes: [{ html: "<p>low</p>", target: ["p.low"], failureSummary: summary }],
      nodeTotal: 1
    }
  ]
};
const manual = [
  { title: "Keyboard trap", wcag: "2.1.2", verdict: "fail", findings: [{ finding: "Focus trapped in modal", note: "Esc does not close", selector: ".modal" }] },
  { title: "Zoom", wcag: "1.4.4", verdict: "pass", findings: [] }
];
const md = issuesMarkdown(report, manual);
assert(md.indexOf("# Accessibility Report") !== -1, "md H1");
assert(md.indexOf("https://example.com") !== -1, "md url");
assert(md.indexOf("## image-alt: Images must have alternate text") !== -1, "md violation heading");
assert(md.indexOf("## color-contrast:") !== -1, "md contrast heading");
assert(md.indexOf("```html") !== -1, "md fenced code");
assert(md.indexOf("- [ ] Fix `img`") !== -1, "md checklist");
assert(md.indexOf("### Suggested fix") !== -1, "md suggested fix");
assert(md.indexOf("## Manual check failures") !== -1, "md manual section");
assert(md.indexOf("Keyboard trap") !== -1, "md manual fail included");
assert(md.indexOf("Zoom") === -1, "md manual pass excluded");
assert(issuesMarkdown({ url: "x", violations: [] }, null).indexOf("# Accessibility Report") !== -1, "md null manual ok");

// srVerifyStep + screen reader findings in issuesMarkdown
assert(srVerifyStep("no-name", { name: "Search", role: "button" }) === "Tab to the control; expected announcement: 'Search', button.", "verify no-name");
assert(/Trigger the update with a screen reader running; expect 'Saved' announced/.test(srVerifyStep("silent", { text: "Saved" })), "verify silent");
assert(/Read the sentence with VoiceOver\/NVDA; the voice must switch for 'Dubai'/.test(srVerifyStep("text-mismatch", { snippet: "Dubai" })), "verify text-mismatch");
assert(/Tab into the tablist and press the arrow keys/.test(srVerifyStep("widget-no-arrow-nav", { info: "tablist" })), "verify widget-no-arrow-nav");
assert(/press Enter, then Space/.test(srVerifyStep("widget-no-enter-space", {})) && /press Escape once/.test(srVerifyStep("widget-esc-no-close", {})), "verify widget enter/escape");
assert(/onKeyDown=\{onKeyDown\}[\s\S]*aria-selected=\{i === active\}[\s\S]*tabIndex=\{i === active \? 0 : -1\}/.test(frameworkizeSnippet("<div role=\"tablist\">", "react", "widget-no-arrow-nav", { info: "tablist" })), "react roving tabindex snippet");
assert(/@keydown="onKeyDown"[\s\S]*:aria-checked="i === active"/.test(frameworkizeSnippet("<div role=\"radiogroup\">", "vue", "widget-no-arrow-nav", { info: "radiogroup" })), "vue roving tabindex snippet");
assert(/@keydown\.enter\.prevent="open"/.test(frameworkizeSnippet("x", "vue", "widget-no-enter-space", { name: "Pick" })) && /openerRef\.current\?\.focus\(\)/.test(frameworkizeSnippet("x", "react", "widget-esc-no-close", {})), "widget activate/escape framework snippets");
assert(/expect 'selected' announced on the control itself/.test(srVerifyStep("state-missing", { attr: "aria-selected" })), "verify state-missing");
assert(/'expanded' \/ 'collapsed'/.test(srVerifyStep("state-not-announced", { attr: "aria-expanded" })), "verify state-not-announced");
assert(/pressed \/ selected \/ expanded/.test(srVerifyStep("state-not-announced", {})), "verify state fallback");
assert(/end with 'required'/.test(srVerifyStep("required-not-exposed", {})), "verify required-not-exposed");
assert(/not be announced as 'read only'/.test(srVerifyStep("readonly-misuse", {})), "verify readonly-misuse");
assert(/current step/.test(srVerifyStep("stepper-no-state", {})), "verify stepper-no-state");
assert(/group name/.test(srVerifyStep("group-no-label", {})), "verify group-no-label");
assert(/question must be announced/.test(srVerifyStep("question-not-associated", {})), "verify question-not-associated");
assert(/'Company name'/.test(srVerifyStep("label-not-associated", { info: "Company name:" })), "verify label-not-associated uses the visible text");
assert(/htmlFor="tradeNo"/.test(frameworkizeSnippet('<label for="tradeNo">Trade licence number</label>\n<input type="text" id="tradeNo" />', "react", "label-not-associated", {})), "label fix in React uses htmlFor");
assert(/opens in a new tab/.test(srVerifyStep("link-new-window", {})), "verify link-new-window");
assert(/\('PDF'\) and size/.test(srVerifyStep("link-download-hint", { info: "PDF" })), "verify link-download-hint");
assert(/'external'/.test(srVerifyStep("link-external-hint", {})), "verify link-external-hint");
assert(/'button'/.test(srVerifyStep("link-as-button", { info: "handler" })) && /current page/.test(srVerifyStep("link-as-button", { info: "current" })), "verify link-as-button");
{
  const lf = srFindings({ readingOrder: { issues: [{ sel: "#reportPdf", role: "link", name: "Annual report", code: "link-download-hint", info: "PDF", issues: ["moderate: downloads a PDF"] }] } });
  assert(lf.length === 1 && lf[0].level === "moderate" && /'PDF'/.test(lf[0].verify), "link-download-hint finding carries info into verify");
  const r = frameworkizeSnippet("<a href=\"#\">Show</a>", "react", "link-as-button", { name: "Show", info: "handler" });
  assert(/<button type="button" className="link-style" onClick=\{handleClick\}>Show<\/button>/.test(r), "react link-as-button");
  const v = frameworkizeSnippet("<a href=\"#\">Home</a>", "vue", "link-as-button", { name: "Home", info: "current" });
  assert(/<span aria-current="page">Home<\/span>/.test(v) && /router-link/.test(v), "vue link-as-button current");
  const nw = frameworkizeSnippet("<a>x</a>", "react", "link-new-window", { name: "Feedback" });
  assert(/NewTabLink/.test(nw) && /className="visually-hidden"> \(opens in a new tab\)/.test(nw) && /rel="noopener/.test(nw), "react link-new-window");
  assert(/<slot \/>/.test(frameworkizeSnippet("<a>x</a>", "vue", "link-new-window", {})), "vue link-new-window");
}
{
  const sf = srFindings({ liveRegions: { regions: [], log: [{ kind: "silent", code: "state-not-announced", attr: "aria-pressed", text: "Team Alpha", sel: "#teamCard", html: "<div>", note: "n" }] } });
  assert(sf.length === 1 && sf[0].level === "serious" && /aria-pressed missing/.test(sf[0].msg) && /'pressed' \/ 'not pressed'/.test(sf[0].verify), "state-not-announced finding level/verify");
}
assert(/Delete the item; focus must land on the next item or heading/.test(srVerifyStep("focus-lost")), "verify focus-lost");
assert(/Tab from the last control in the dialog; focus must wrap inside/.test(srVerifyStep("modal-escape")), "verify modal-escape");
assert(typeof srVerifyStep("something-unknown") === "string" && srVerifyStep("something-unknown").length > 20, "verify default");
const srRes = {
  journey: { duration: 4000, pages: ["/"], transcript: "", steps: [],
    gaps: [{ step: 2, t: 1500, page: "/", kind: "silent", level: "critical", msg: "silent update", sel: "div.toast" }, { step: 3, t: 3900, page: "/", kind: "quiet", level: "serious", msg: "nothing announced for 3.2 s", sel: "" }] },
  score: null,
  readingOrder: { url: "https://example.com", summary: {}, issues: [
    { sel: "button.icon", role: "button", name: "", html: '<button class="icon"><svg></svg></button>', component: "aegov-card", instances: 2, selectors: ["button.icon", "div > button.icon"], code: "no-name",
      issues: ["serious: no accessible name — announced as just \"button\""], fix: { snippet: '<button class="icon" aria-label="ACTION_NAME"><svg></svg></button>', note: "Name the button by what it DOES.", framework: "html" } } ] },
  liveRegions: { regions: [], log: [
    { t: 1500, kind: "silent", sel: "div.toast", text: "Saved", html: '<div class="toast">Saved</div>', tag: "div", fix: { snippet: '<div class="toast" role="status">Saved</div>', note: "role=status", framework: "html" } },
    { t: 200, kind: "announced", sel: "div.status", text: "Loading" } ] },
  focusTrace: { moves: 3, issues: [{ t: 2000, sel: "body", role: "", name: "", html: "", code: "focus-lost", issues: ["serious: focus lost — landed on body"], fix: { snippet: "next.focus();", note: "Move focus deliberately.", framework: "react" } }] },
  language: { htmlLang: "ar", htmlDir: "rtl", majority: "Arabic", issues: [{ level: "serious", type: "text-mismatch", sel: "p.lead", snippet: "Dubai", declared: "ar", detected: "Latin", html: "<p class=\"lead\">مرحبا Dubai</p>", msg: "Latin text inside lang=ar", fix: { snippet: '<span lang="en">Dubai</span>', note: "Wrap it.", framework: "html" } }] },
  bilingual: { url: "/ar", otherUrl: "/en", differences: [{ kind: "missing", code: "cmp-missing", level: "serious", side: "other", msg: "1 button missing on the other page", role: "button", name: "Apply", sel: "button.apply", html: "", instances: 1, selectors: ["button.apply"], fix: null }] },
  browserTree: null,
};
const srList = srFindings(srRes);
assert(srList.length === 6, "srFindings count: " + srList.length);
assert(srList.every((f) => f.title.indexOf("[SR] ") === 0 && f.verify.length > 10 && f.level), "srFindings shape");
assert(srList.filter((f) => f.section === "journey").length === 1 && srList.find((f) => f.section === "journey").code === "quiet", "journey gap deduped against live log");
assert(srList[0].title.indexOf("(×2)") !== -1 && srList[0].selectors.length === 2, "srFindings keeps instance grouping");
assert(srFindings(null).length === 0 && srFindings({}).length === 0, "srFindings null-safe");
const srMd = issuesMarkdown(report, null, undefined, srRes);
assert(srMd.indexOf("## Screen reader findings") !== -1, "md SR section");
assert(srMd.indexOf("### [SR] no accessible name — button (×2)") !== -1, "md SR title");
assert((srMd.match(/\*\*How to verify:\*\*/g) || []).length === 6, "md How to verify per finding");
assert(srMd.indexOf("**Problem:** Latin text inside lang=ar") !== -1 && srMd.indexOf("`p.lead`") !== -1, "md SR problem + element");
assert(srMd.indexOf('aria-label="ACTION_NAME"') !== -1 && srMd.indexOf("```jsx") !== -1, "md SR fix snippet + framework fence");
// page markup containing ``` must not close the Markdown code block
const srFence = issuesMarkdown(report, null, undefined, { readingOrder: { url: "x", summary: {}, issues: [
  { sel: "pre.x", role: "button", name: "", html: "<button>```</button>", instances: 1, selectors: ["pre.x"], code: "no-name", issues: ["serious: no accessible name"], fix: null } ] } });
assert(srFence.indexOf("````html\n<button>```</button>\n````") !== -1, "md fence longer than backtick run in content");
assert(issuesMarkdown(report, manual, undefined, null).indexOf("[SR]") === -1 && issuesMarkdown(report, manual) === issuesMarkdown(report, manual, undefined, null), "md backwards compatible without srResults");

// frameworkizeSnippet (screen reader fix snippets per framework)
const lbl = '<label for="email">FIELD_LABEL</label>\n<input type="text" id="email">';
assert(frameworkizeSnippet(lbl, "html", "no-name") === lbl, "fw html unchanged");
assert(frameworkizeSnippet(lbl, undefined, "no-name") === lbl, "fw undefined unchanged");
const jsxLbl = frameworkizeSnippet(lbl, "react", "no-name");
assert(jsxLbl.indexOf('htmlFor="email"') !== -1 && jsxLbl.indexOf(' for="') === -1, "fw react htmlFor");
assert(jsxLbl.indexOf('<input type="text" id="email" />') !== -1, "fw react self-closing input");
const clickable = '<div class="card" onclick="go()">Buy</div>\n\n<!-- if you cannot change the element: -->\n<div role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();this.click()}">Buy</div>';
const jsxClick = frameworkizeSnippet(clickable, "react", "clickable-no-role");
assert(jsxClick.indexOf('className="card"') !== -1, "fw react className");
assert(jsxClick.indexOf("onClick={(e) => { go() }}") !== -1, "fw react onClick");
assert(jsxClick.indexOf('onKeyDown={(e) => { if(e.key==="Enter"||e.key===" "){e.preventDefault();e.currentTarget.click()} }}') !== -1, "fw react onKeyDown");
assert(jsxClick.indexOf("tabIndex={0}") !== -1, "fw react tabIndex");
assert(jsxClick.indexOf("{/* if you cannot change the element: */}") !== -1 && jsxClick.indexOf("<!--") === -1, "fw react jsx comment");
const vueClick = frameworkizeSnippet(clickable, "vue", "clickable-no-role");
assert(vueClick.indexOf('@click="go()"') !== -1, "fw vue @click");
assert(vueClick.indexOf("@keydown=\"if($event.key==='Enter'||$event.key===' '){$event.preventDefault();$event.currentTarget.click()}\"") !== -1, "fw vue @keydown");
assert(vueClick.indexOf('class="card"') !== -1 && vueClick.indexOf("<!-- if you cannot") !== -1, "fw vue keeps html attrs/comments");
const vueLabel = frameworkizeSnippet('<button aria-label="ACTION_NAME"></button>', "vue", "no-name");
assert(vueLabel.indexOf(':aria-label="labelText"') !== -1, "fw vue :aria-label hint");
assert(frameworkizeSnippet('<div aria-hidden="true" inert>…</div>', "vue", "in-aria-hidden").indexOf("v-if") !== -1, "fw vue v-if hint");
assert(frameworkizeSnippet('<div aria-hidden="true" inert>…</div>', "react", "in-aria-hidden") === '<div aria-hidden="true" inert>…</div>', "fw react leaves aria attrs");
const jsFix = "el.hidden = true;\nel.setAttribute(\"inert\", \"\");";
assert(frameworkizeSnippet(jsFix, "react", "invisible") === jsFix && frameworkizeSnippet(jsFix, "vue", "invisible") === jsFix, "fw pure JS untouched");
const reactFocus = frameworkizeSnippet("item.remove();", "react", "focus-lost");
assert(reactFocus.indexOf("useRef(") !== -1 && reactFocus.indexOf("useEffect(") !== -1, "fw react focus-lost useRef/useEffect");
const reactModal = frameworkizeSnippet("<dialog></dialog>", "react", "modal-escape");
assert(reactModal.indexOf("ref={dlgRef}") !== -1 && reactModal.indexOf("showModal()") !== -1 && reactModal.indexOf("useEffect(") !== -1, "fw react modal ref + showModal in useEffect");
const vueModal = frameworkizeSnippet("<dialog></dialog>", "vue", "modal-escape");
assert(vueModal.indexOf('ref="dlg"') !== -1 && vueModal.indexOf("this.$refs.dlg.showModal()") !== -1, "fw vue modal $refs");
assert(frameworkizeSnippet("<dialog></dialog>", "vue", "dialog-no-focus").indexOf("$nextTick") !== -1, "fw vue dialog-no-focus nextTick");
const reactSilent = frameworkizeSnippet("x", "react", "silent", { text: 'Saved "ok"' });
assert(reactSilent.indexOf("useState(") !== -1 && reactSilent.indexOf("setStatus(\"Saved 'ok'\")") !== -1, "fw react silent setStatus with text");
assert(frameworkizeSnippet("x", "vue", "live-late").indexOf("this.status = \"MESSAGE\"") !== -1, "fw vue live-late default text");
assert(frameworkizeSnippet(null, "react").length === 0, "fw null snippet safe");

if (failed) {
  console.error(failed + " assertion(s) failed");
  process.exit(1);
}
console.log("All tests passed");

// non-text contrast (WCAG 1.4.11): contrastFix at 3:1, verify step, findings section
const ntcFix = contrastFix("foreground color: #dddddd, background color: #ffffff, expected contrast ratio of 3:1");
assert(ntcFix && ntcFix.required === 3 && ntcFix.ratio >= 3 && ntcFix.to !== "#dddddd", "contrastFix 3:1 non-text target");
assert(/3:1/.test(srVerifyStep("nontext-contrast", { info: "border #dddddd" })) && /border #dddddd/.test(srVerifyStep("nontext-contrast", { info: "border #dddddd" })), "nontext-contrast verify step");
const ntcF = srFindings({ nonTextContrast: { checked: 3, issues: [{ code: "nontext-contrast", level: "serious", kind: "icon", color: "#bbbbbb", bg: "#ffffff", ratio: 1.92, sel: "#ntcIcon", role: "button", name: "Search", msg: "Non-text contrast 1.92:1 — icon #bbbbbb on #ffffff" }] } });
assert(ntcF.length === 1 && ntcF[0].section === "ntc" && ntcF[0].sectionLabel === "Non-text contrast" && ntcF[0].level === "serious" && /icon #bbbbbb/.test(ntcF[0].verify), "srFindings nonTextContrast section");
