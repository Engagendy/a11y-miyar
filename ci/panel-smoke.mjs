// Headless smoke test for the 🔊 Screen reader tab: drives panel.html against
// test-page.html with a stubbed background (no extension install needed).
//   cd ci && npm install && node panel-smoke.mjs [en|ar]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bg = fs.readFileSync(root + "/background.js", "utf8") + "\nglobalThis.__axTreeTest = axTreeViaDebugger;\n";
const axe = fs.readFileSync(root + "/vendor/axe.min.js", "utf8");
const stub = "globalThis.chrome = globalThis.chrome || { runtime: { onMessage: { addListener(){} } } };\n";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const target = await ctx.newPage();
await target.goto("file://" + root + "/test-page.html");
const cdp = await ctx.newCDPSession(target);
globalThis.chrome = { runtime: { onMessage: { addListener() {} } }, permissions: { contains: async () => true },
  debugger: { attach: async () => {}, detach: async () => {}, sendCommand: (t, m, p) => cdp.send(m, p) } };
new Function(bg)();

// shipped defaults ("Recommended" preset): best practices + SR rules on
let settings = { level: "wcag22aa", bestPractice: true, flowInterval: 4, lang: process.argv[2] || "en", framework: "html", mode: "a11y", dlsContrast: false, srRules: true };
const store = {};
const highlightAllCalls = []; // item counts sent by the ×N badge (must cover every instance)
let dlsHighlightCalls = 0; // "Highlight all gaps" in the DLS toolbar
const inPage = (fn) => target.evaluate(fn);
const ops = {
  settingsGet: async () => settings, settingsSet: async (m) => { Object.assign(settings, m.value); return true; },
  storeGet: async (m) => store[m.key] ?? null, storeSet: async (m) => { store[m.key] = m.value; return true; }, storeRemove: async (m) => { delete store[m.key]; return true; },
  injectAxe: async () => { await target.addScriptTag({ content: axe }); await target.addScriptTag({ content: stub + bg }); return true; },
  runAxe: async (m) => target.evaluate(([r, rules]) => runAxeInPage(r, rules), [m.runOnly, m.rules]),
  srTree: () => inPage(() => srTreeInPage()), langCheck: () => inPage(() => langCheckInPage()), nonTextContrast: () => inPage(() => nonTextContrastInPage()),
  srCompare: async (m) => ({ url: m.url, order: await inPage(() => srTreeInPage()), lang: await inPage(() => langCheckInPage()) }),
  liveStart: () => inPage(() => liveInstallInPage()), liveDrain: () => inPage(() => liveDrainInPage()), liveStop: () => inPage(() => liveStopInPage()),
  focusStart: () => inPage(() => focusInstallInPage()), focusDrain: () => inPage(() => focusDrainInPage()), focusStop: () => inPage(() => focusStopInPage()),
  focusWalk: (m) => target.evaluate((n) => focusWalkInPage(n), m.maxSteps),
  axTreeAvailable: async () => true, axTree: () => globalThis.__axTreeTest(1),
  dlsCheck: () => inPage(() => dlsCheckInPage(DLS_DATA)), dlsComponents: () => inPage(() => dlsComponentAuditInPage(DLS_DATA)), dlsHighlight: async () => { dlsHighlightCalls++; return 0; },
  srApply: (m) => target.evaluate(([s, p]) => srApplyInPage(s, p), [m.selector, m.patch]), srUndo: (m) => target.evaluate((s) => srUndoInPage(s), m.selector),
  pickStart: () => inPage(() => pickStartInPage()), pickCheck: () => inPage(() => pickCheckInPage()),
  highlight: async () => true, highlightAll: async (m) => { highlightAllCalls.push((m.items || []).length); return true; }, clearHighlights: async () => true, clickedCheck: async () => null, staleInstall: async () => true, staleCheck: async () => false, domCount: async () => 50,
};
const panel = await ctx.newPage();
const errors = [];
panel.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
panel.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });
await panel.exposeFunction("__bgCall", async (msg) => {
  if (!ops[msg.op]) { errors.push("unknown op " + msg.op); return { error: "unknown op " + msg.op }; }
  try { return { result: await ops[msg.op](msg) }; } catch (e) { return { error: e.message }; }
});
await panel.addInitScript((targetUrl) => {
  // inspectedWindow.eval answers location.href with the real page URL (per-URL persistence keys on it); everything else is null
  globalThis.chrome = {
    devtools: { inspectedWindow: { tabId: 1, eval: (x, cb) => cb && cb(x === "location.href" ? targetUrl : null) }, network: { onNavigated: { addListener() {} } }, panels: {} },
    runtime: { sendMessage: (m) => window.__bgCall(m), openOptionsPage() {}, getURL: (x) => x },
  };
  // fake speech synthesis: records utterances and "finishes" them asynchronously so ▶ Play page advances
  window.__utts = [];
  const fakeSynth = {
    speaking: false, pending: false,
    speak(u) { window.__utts.push({ text: u.text, lang: u.lang, rate: u.rate, voice: u.voice && u.voice.name }); fakeSynth.speaking = true;
      const end = () => { if (fakeSynth.paused) { setTimeout(end, 10); return; } fakeSynth.speaking = false; u.onend && u.onend({}); };
      setTimeout(end, 20); },
    cancel() { fakeSynth.speaking = false; },
    pause() { fakeSynth.paused = true; }, resume() { fakeSynth.paused = false; },
    getVoices() { return [{ name: "Fake EN", lang: "en-US", default: true, localService: true }, { name: "Fake AR", lang: "ar-SA", default: false, localService: true }]; },
    addEventListener() {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: fakeSynth, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; this.voice = null; } };
}, target.url());
await panel.goto("file://" + root + "/panel.html");
await panel.waitForTimeout(400);
await panel.click("#tabs button[data-view='sr']");
console.log("tab label:", await panel.textContent("#tabs button[data-view='sr']"), "| visible:", await panel.isVisible("#srView"));
await panel.click("#srBuildBtn");
await panel.waitForTimeout(1500);
console.log("order stats:", await panel.textContent("#srOrderStats"));
{
  const exp = await panel.evaluate(async () => {
    const visible = !document.getElementById("exportGroup").hidden;
    const rep = await reportForExport();
    const html = toHtml(rep, null, null);
    let jsonOk = false;
    try { await exportReport("json"); jsonOk = true; } catch (e) { jsonOk = "ERR " + e.message; }
    return { visible, noScan: !!rep.noScan, htmlHasNote: html.includes(t("noScanNote")), htmlHasSr: html.includes("Screen reader"), jsonOk, issuesHasSr: A11yFixes.issuesMarkdown(rep, null, undefined, srResultsForExport()).includes("[SR]") };
  });
  console.log("exports before scan:", exp);
  if (!exp.visible || !exp.noScan || !exp.htmlHasNote || exp.jsonOk !== true || !exp.issuesHasSr) errors.push("exports not available before scan: " + JSON.stringify(exp));
}
console.log("order issue rows:", await panel.locator("#srOrderList .sr-row.has-issue").count(), "| status:", await panel.textContent("#status"));
// missing state on custom controls (static pass): fake tab strip → state-missing/aria-selected, "Select all" → aria-pressed,
// required asterisk → required-not-exposed, readonly date picker → readonly-misuse, stepper → stepper-no-state; each with a fix + verify step
const stateStatic = await panel.evaluate(() => {
  const rows = srState.order.rows;
  const find = (code, sel) => rows.find((r) => r.sel === sel && r.issues.some((i) => i.code === code));
  const issue = (code, sel) => find(code, sel) && find(code, sel).issues.find((i) => i.code === code);
  const fix = (code, sel) => { const r = find(code, sel); const i = issue(code, sel); return r && srFixFor(code, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag, attr: i.attr }); };
  const rowEl = (sel) => [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === sel);
  const tabRow = rowEl("#tabB");
  const box = document.getElementById("srFilterInput"); box.value = "state-missing"; box.dispatchEvent(new Event("input"));
  const filtered = document.querySelectorAll("#srOrderList .sr-row:not([hidden])").length;
  box.value = ""; box.dispatchEvent(new Event("input"));
  const exp = srResultsForExport().readingOrder.issues.filter((x) => /^(state-missing|required-not-exposed|readonly-misuse|stepper-no-state)$/.test(x.code));
  const findings = A11yFixes.srFindings(srResultsForExport()).filter((f) => /^(state-missing|required-not-exposed|readonly-misuse|stepper-no-state)$/.test(f.code));
  return { tabA: issue("state-missing", "#tabA")?.attr, tabB: issue("state-missing", "#tabB")?.attr, tabLevel: issue("state-missing", "#tabB")?.level, selectAll: issue("state-missing", "#selectAll")?.attr,
    cardClean: !find("state-missing", "#teamCard"), required: issue("required-not-exposed", "#emiratesId")?.level, readonly: issue("readonly-misuse", "#dob")?.level, stepper: issue("stepper-no-state", "#wizardSteps")?.level,
    dobNoRequired: !find("required-not-exposed", "#dob"), twClean: !find("state-missing", "#twBtn"), sumClean: !find("state-missing", "#sumTw"), pwClean: !find("required-not-exposed", "#pwMask"),
    nlClean: !find("required-not-exposed", "#nlEmail"), createdClean: !find("readonly-misuse", "#createdDate"), howClean: !find("stepper-no-state", "#howSteps"), fixTab: fix("state-missing", "#tabB")?.snippet, fixSel: fix("state-missing", "#selectAll")?.snippet, fixReq: fix("required-not-exposed", "#emiratesId")?.snippet,
    fixRo: fix("readonly-misuse", "#dob")?.snippet, fixStep: fix("stepper-no-state", "#wizardSteps")?.snippet, tabRowCodes: tabRow && tabRow.dataset.srCodes, tabRowFix: !!(tabRow && tabRow.querySelector(".sr-fix")),
    applyBtns: ["#tabB", "#emiratesId", "#dob"].map((sel) => !!(rowEl(sel) && rowEl(sel).querySelector(".sr-apply-btn"))), filtered, exp: exp.map((x) => x.code + ":" + (x.attr || "")).sort(),
    verify: findings.map((f) => f.code + ":" + f.level + ":" + (f.verify || "").slice(0, 30)).sort(), weight: srScoreCompute().breakdown.order };
});
console.log("state static:", JSON.stringify(stateStatic));
if (stateStatic.tabA !== "aria-selected" || stateStatic.tabB !== "aria-selected" || stateStatic.tabLevel !== "serious" || stateStatic.selectAll !== "aria-pressed" || !stateStatic.cardClean ||
    stateStatic.required !== "moderate" || stateStatic.readonly !== "moderate" || stateStatic.stepper !== "moderate" || !stateStatic.dobNoRequired ||
    !/aria-selected="true"/.test(stateStatic.fixTab || "") || !/tabindex="-1"/.test(stateStatic.fixTab || "") || !/aria-pressed="true"/.test(stateStatic.fixSel || "") || !/classList\.toggle\("active"/.test(stateStatic.fixSel || "") ||
    !/ required/.test(stateStatic.fixReq || "") || !/aria-required="true"/.test(stateStatic.fixReq || "") || /readonly/.test((stateStatic.fixRo || "").split("<!-- the calendar")[0].replace(/<!--[^>]*-->/g, "")) || !/aria-describedby/.test(stateStatic.fixRo || "") ||
    !/aria-current="step"/.test(stateStatic.fixStep || "") || !/Step 2 of 4, current/.test(stateStatic.fixStep || "") || !/state-missing/.test(stateStatic.tabRowCodes || "") || !stateStatic.tabRowFix ||
    stateStatic.applyBtns.join() !== "true,true,true" || stateStatic.filtered !== 3 || !stateStatic.exp.includes("state-missing:aria-selected") || !stateStatic.exp.includes("required-not-exposed:") || !stateStatic.exp.includes("readonly-misuse:") || !stateStatic.exp.includes("stepper-no-state:") ||
    !stateStatic.twClean || !stateStatic.sumClean || !stateStatic.pwClean || !stateStatic.nlClean || !stateStatic.createdClean || !stateStatic.howClean ||
    stateStatic.verify.length !== stateStatic.exp.length || !stateStatic.verify.some((v) => /^state-missing:serious:Activate/.test(v)) || !stateStatic.verify.some((v) => /^required-not-exposed:moderate:Tab to/.test(v)))
  errors.push("missing-state static checks mismatch: " + JSON.stringify(stateStatic));
// Apply on page for required-not-exposed: aria-required lands on the input, the row turns fixed; Undo removes it again
const reqApply = await (async () => {
  await panel.evaluate(() => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === "#emiratesId"); row.querySelector(".sr-apply-btn").click(); });
  await panel.waitForTimeout(2500);
  const attr = await target.evaluate(() => document.getElementById("emiratesId").getAttribute("aria-required"));
  const fixed = await panel.evaluate(() => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === "#emiratesId"); const ok = row.classList.contains("fixed"); row.querySelector(".sr-undo")?.click(); return ok; });
  await panel.waitForTimeout(2500);
  const after = await target.evaluate(() => document.getElementById("emiratesId").getAttribute("aria-required"));
  return { attr, fixed, after, back: await panel.evaluate(() => srState.order.rows.some((r) => r.sel === "#emiratesId" && r.issues.some((i) => i.code === "required-not-exposed"))) };
})();
console.log("required apply:", JSON.stringify(reqApply));
if (reqApply.attr !== "true" || !reqApply.fixed || reqApply.after !== null || !reqApply.back) errors.push("required-not-exposed apply/undo mismatch: " + JSON.stringify(reqApply));
// form group labelling: checkbox filter group and radio pair with no group name (group-no-label, container row), "Did you find this content useful?" + Yes/No
// (question-not-associated on the question row), <label> without for / .form-label span next to an unnamed or placeholder-named field (label-not-associated);
// fieldset+legend, named radiogroup, role=group aria-labelledby question, <label for> and a wrapped single checkbox stay clean
const grouping = await panel.evaluate(() => {
  const rows = srState.order.rows;
  const find = (code, sel) => rows.find((r) => r.sel === sel && r.issues.some((i) => i.code === code));
  const issue = (code, sel) => find(code, sel) && find(code, sel).issues.find((i) => i.code === code);
  const fix = (code, sel) => { const r = find(code, sel); const i = issue(code, sel); return r && srFixFor(code, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag, attr: i.attr, info: i.info, hint: i.hint }); };
  const rowEl = (sel) => [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === sel);
  const codes = /^(group-no-label|question-not-associated|label-not-associated)$/;
  const exp = srResultsForExport().readingOrder.issues.filter((x) => codes.test(x.code));
  const findings = A11yFixes.srFindings(srResultsForExport()).filter((f) => codes.test(f.code));
  const anyClean = (sel) => !rows.some((r) => r.sel === sel && r.issues.some((i) => codes.test(i.code)));
  const expAll = srResultsForExport().readingOrder.issues;
  return { expTrade: expAll.find((x) => x.sel === "#tradeNo")?.issues.join(" | "), expCo: expAll.find((x) => x.sel === "#coName")?.issues.join(" | "), filter: issue("group-no-label", "#filterGroup"), plan: issue("group-no-label", "#planRadios"), question: issue("question-not-associated", "#usefulQ"), trade: issue("label-not-associated", "#tradeNo"), co: issue("label-not-associated", "#coName"),
    clean: ["#okGroup", "#okRadios", "#okQ", "#okLabelled", "#agree", "#planA", "#planB", "#emiratesId", "#dob", "#fsOther", "#fsAria", "#sharedNameForm", "#pairBox", "#qDlgQ", "#hiddenQ", "#otpCode", "#otpSection", "#emailAddr"].map(anyClean),
    // no group-no-label may land on a big container either (the old common-ancestor bucket put it on <form>/<main>)
    noBigGroup: !rows.some((r) => /^(body|main|form|section)/.test(r.sel) && r.issues.some((i) => i.code === "group-no-label")),
    roleGrp: issue("group-no-label", "#roleGrp"),
    fixFilter: fix("group-no-label", "#filterGroup")?.snippet, fixQ: fix("question-not-associated", "#usefulQ")?.snippet, fixTrade: fix("label-not-associated", "#tradeNo")?.snippet, fixCo: fix("label-not-associated", "#coName")?.snippet,
    rowCodes: ["#filterGroup", "#usefulQ", "#tradeNo"].map((sel) => rowEl(sel) && rowEl(sel).dataset.srCodes), fixBlocks: ["#filterGroup", "#usefulQ", "#tradeNo"].map((sel) => !!(rowEl(sel) && rowEl(sel).querySelector(".sr-fix"))),
    applyInputs: ["#filterGroup", "#usefulQ", "#coName"].map((sel) => rowEl(sel) && rowEl(sel).querySelector(".sr-apply-input")?.value),
    exp: exp.map((x) => x.code + ":" + x.sel).sort(), verify: findings.map((f) => f.code + ":" + f.level + ":" + (f.verify || "").slice(0, 40)).sort() };
});
console.log("form grouping:", JSON.stringify(grouping));
if (grouping.filter?.level !== "serious" || grouping.filter?.info !== "checkbox" || grouping.filter?.hint !== "Emirate" || !grouping.noBigGroup || grouping.roleGrp?.info !== "checkbox" || grouping.roleGrp?.hint !== "Interests" || grouping.roleGrp?.msgArgs?.[0] !== 2 || grouping.plan?.info !== "radio" || grouping.plan?.hint !== "Billing plan" ||
    grouping.question?.level !== "moderate" || grouping.question?.info !== "tight" || grouping.trade?.level !== "serious" || grouping.trade?.msgArgs?.[1] !== "Licence" || grouping.co?.info !== "Company name:" || grouping.co?.msgArgs?.[1] !== "Company" || grouping.clean.some((c) => !c) ||
    !/<legend>Emirate<\/legend>/.test(grouping.fixFilter || "") || !/role="group" aria-labelledby="filterGroup-label"/.test(grouping.fixFilter || "") || !/role="group" aria-labelledby="usefulQ"/.test(grouping.fixQ || "") || !/aria-label="Yes — Did you find this content useful\?"/.test(grouping.fixQ || "") ||
    !/<label for="tradeNo">Trade licence number<\/label>/.test(grouping.fixTrade || "") || !/<label for="coName">Company name<\/label>/.test(grouping.fixCo || "") || !/aria-labelledby="coName-label"/.test(grouping.fixCo || "") ||
    !/group-no-label/.test(grouping.rowCodes[0] || "") || !/question-not-associated/.test(grouping.rowCodes[1] || "") || !/label-not-associated/.test(grouping.rowCodes[2] || "") || grouping.fixBlocks.some((b) => !b) ||
    grouping.applyInputs.join("|") !== "Emirate|Did you find this content useful?|Company name" || grouping.exp.length !== 5 || !grouping.exp.includes("group-no-label:#roleGrp") || !grouping.exp.includes("question-not-associated:#usefulQ") || !grouping.exp.includes("group-no-label:#planRadios") || !grouping.exp.includes("label-not-associated:#tradeNo") ||
    !/serious: visible label "Trade licence number"/.test(grouping.expTrade || "") || !/placeholder only/.test(grouping.expCo || "") || !/serious: visible label "Company name:"/.test(grouping.expCo || "") ||
    grouping.verify.length !== 5 || !grouping.verify.some((v) => /^group-no-label:serious:Tab into the first option; the screen/.test(v)) || !grouping.verify.some((v) => /^label-not-associated:serious:Tab to the field; the announcement/.test(v)))
  errors.push("form group labelling mismatch: " + JSON.stringify(grouping));
// Apply on page for question-not-associated: role="group" + aria-label (the question) land on the PARENT (#usefulBox), the row turns fixed; Undo removes them
const qApply = await (async () => {
  await panel.evaluate(() => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === "#usefulQ"); row.querySelector(".sr-apply-btn").click(); });
  await panel.waitForTimeout(2500);
  const box = await target.evaluate(() => { const b = document.getElementById("usefulBox"); return { role: b.getAttribute("role"), label: b.getAttribute("aria-label"), qRole: document.getElementById("usefulQ").getAttribute("role") }; });
  const fixed = await panel.evaluate(() => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === "#usefulQ"); const ok = row.classList.contains("fixed"); row.querySelector(".sr-undo")?.click(); return ok; });
  await panel.waitForTimeout(2500);
  const after = await target.evaluate(() => document.getElementById("usefulBox").getAttribute("role"));
  return { ...box, fixed, after, back: await panel.evaluate(() => srState.order.rows.some((r) => r.sel === "#usefulQ" && r.issues.some((i) => i.code === "question-not-associated"))) };
})();
console.log("question apply:", JSON.stringify(qApply));
if (qApply.role !== "group" || qApply.label !== "Did you find this content useful?" || qApply.qRole !== null || !qApply.fixed || qApply.after !== null || !qApply.back) errors.push("question-not-associated apply/undo mismatch: " + JSON.stringify(qApply));
// link behaviour: target=_blank / formtarget without "opens in a new tab", PDF / download link without the file type, external host without "external",
// href="#" / javascript: links acting as buttons (breadcrumb Home, current breadcrumb/pagination item, click handler) — hint fixtures and #top / role=button stay clean
const links = await panel.evaluate(() => {
  const rows = srState.order.rows;
  const find = (code, sel) => rows.find((r) => r.sel === sel && r.issues.some((i) => i.code === code));
  const issue = (code, sel) => find(code, sel) && find(code, sel).issues.find((i) => i.code === code);
  const fix = (code, sel) => { const r = find(code, sel); const i = issue(code, sel); return r && srFixFor(code, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag, info: i.info }); };
  const rowEl = (sel) => [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === sel);
  const box = document.getElementById("srFilterInput"); box.value = "link-as-button"; box.dispatchEvent(new Event("input"));
  const filtered = document.querySelectorAll("#srOrderList .sr-row:not([hidden])").length;
  box.value = ""; box.dispatchEvent(new Event("input"));
  const exp = srResultsForExport().readingOrder.issues.filter((x) => /^link-/.test(x.code));
  const findings = A11yFixes.srFindings(srResultsForExport()).filter((f) => /^link-/.test(f.code));
  return { newWin: issue("link-new-window", "#feedbackLink")?.level, newWinOk: !find("link-new-window", "#feedbackOk"), formBtn: issue("link-new-window", "#printBtn")?.level,
    dl: issue("link-download-hint", "#reportPdf")?.info, dlOk: !find("link-download-hint", "#reportOk"), dlAttr: issue("link-download-hint", "#csvDl")?.info,
    ext: issue("link-external-hint", "#extLink")?.level, extOk: !find("link-external-hint", "#extOk"),
    crumbHome: issue("link-as-button", "#crumbHome")?.info, crumbCur: issue("link-as-button", "#crumbCurrent")?.info, page1: issue("link-as-button", "#page1")?.info, page2: issue("link-as-button", "#page2")?.info,
    pageNext: issue("link-as-button", "#pageNext")?.info, toggle: issue("link-as-button", "#toggleLink")?.info, toggleLevel: issue("link-as-button", "#toggleLink")?.level,
    anchorOk: !find("link-as-button", "#anchorTop"), backTopOk: !find("link-as-button", "#backTop"), badHrefRow: rows.some((r) => r.sel === "#badHref"), subLink: issue("link-external-hint", "#subLink")?.info, roleBtnOk: !find("link-as-button", "#roleBtnLink"), extNoBtn: !find("link-as-button", "#extLink"),
    fixNew: fix("link-new-window", "#feedbackLink")?.snippet, fixDl: fix("link-download-hint", "#reportPdf")?.snippet, fixExt: fix("link-external-hint", "#extLink")?.snippet,
    fixCur: fix("link-as-button", "#crumbCurrent")?.snippet, fixTog: fix("link-as-button", "#toggleLink")?.snippet, fixNav: fix("link-as-button", "#crumbHome")?.snippet,
    applyBtns: ["#feedbackLink", "#reportPdf", "#extLink", "#crumbCurrent", "#toggleLink"].map((sel) => !!(rowEl(sel) && rowEl(sel).querySelector(".sr-apply-btn"))), navApply: !!(rowEl("#crumbHome") && rowEl("#crumbHome").querySelector(".sr-apply-btn")),
    filtered, rowCodes: rowEl("#feedbackLink")?.dataset.srCodes, exp: exp.map((x) => x.code + ":" + (x.info || "")).sort(), verify: findings.map((f) => f.code + ":" + f.level + ":" + (f.verify || "").slice(0, 16)).sort() };
});
console.log("link behaviour:", JSON.stringify(links));
if (links.newWin !== "moderate" || !links.newWinOk || links.formBtn !== "moderate" || links.dl !== "PDF" || !links.dlOk || links.dlAttr !== "CSV" || links.ext !== "minor" || !links.extOk ||
    links.crumbHome !== "nav" || links.crumbCur !== "current" || links.page1 !== "current" || links.page2 !== "nav" || links.pageNext !== "nav" || links.toggle !== "handler" || links.toggleLevel !== "serious" ||
    !links.anchorOk || !links.backTopOk || !links.badHrefRow || links.subLink !== "eservices.wam.ae" || !links.roleBtnOk || !links.extNoBtn || !/\(opens in a new tab\)/.test(links.fixNew || "") || !/\(PDF, 2 MB\)/.test(links.fixDl || "") || !/\(external link to www\.wam\.ae\)/.test(links.fixExt || "") ||
    !/aria-current="page"/.test(links.fixCur || "") || /href=/.test(links.fixCur || "") || !/<button type="button"/.test(links.fixTog || "") || /href="#"/.test(links.fixTog || "") || !/href="\/REAL_PATH"/.test(links.fixNav || "") ||
    links.applyBtns.join() !== "true,true,true,true,true" || links.navApply || links.filtered !== 6 || !/link-new-window/.test(links.rowCodes || "") ||
    !links.exp.includes("link-new-window:") || !links.exp.includes("link-download-hint:PDF") || !links.exp.includes("link-external-hint:www.wam.ae") || !links.exp.includes("link-as-button:current") ||
    links.verify.length !== links.exp.length || !links.verify.some((v) => /^link-as-button:serious:Tab to the con/.test(v)) || !links.verify.some((v) => /^link-download-hint:moderate:Tab to/.test(v)))
  errors.push("link behaviour checks mismatch: " + JSON.stringify(links));
// Apply on page for link-new-window: a hidden "(opens in a new tab)" span lands inside the link, the row turns fixed; Undo removes it again
const linkApply = await (async () => {
  await panel.evaluate(() => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === "#feedbackLink"); row.querySelector(".sr-apply-btn").click(); });
  await panel.waitForTimeout(2500);
  const hint = await target.evaluate(() => { const s = document.querySelector("#feedbackLink .__a11y_lens_vh"); return s && s.textContent.trim(); });
  const fixed = await panel.evaluate(() => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === "#feedbackLink"); const ok = row.classList.contains("fixed"); row.querySelector(".sr-undo")?.click(); return ok; });
  await panel.waitForTimeout(2500);
  const after = await target.evaluate(() => document.querySelectorAll("#feedbackLink .__a11y_lens_vh").length);
  return { hint, fixed, after, back: await panel.evaluate(() => srState.order.rows.some((r) => r.sel === "#feedbackLink" && r.issues.some((i) => i.code === "link-new-window"))) };
})();
console.log("link apply:", JSON.stringify(linkApply));
if (linkApply.hint !== "(opens in a new tab)" || !linkApply.fixed || linkApply.after !== 0 || !linkApply.back) errors.push("link-new-window apply/undo mismatch: " + JSON.stringify(linkApply));
// one filter box for every Screen reader section: "link" keeps the link rows, hides the rest, "N of M" in the toolbar; clearing restores every row
const srFilter = await panel.evaluate(async () => {
  const box = document.getElementById("srFilterInput");
  const all = document.querySelectorAll("#srView .sr-row").length;
  box.value = "link"; box.dispatchEvent(new Event("input"));
  const shown = document.querySelectorAll("#srView .sr-row:not([hidden])").length;
  const hiddenHasLink = [...document.querySelectorAll("#srView .sr-row[hidden]")].some((r) => r.textContent.toLowerCase().includes("link"));
  const count = document.getElementById("srFilterCount").textContent;
  box.value = "no-name"; box.dispatchEvent(new Event("input"));
  const byCode = document.querySelectorAll("#srView .sr-row:not([hidden])").length;
  const codeRowsOk = [...document.querySelectorAll("#srView .sr-row:not([hidden])")].every((r) => (r.dataset.srCodes || "").includes("no-name"));
  box.value = ""; box.dispatchEvent(new Event("input"));
  await new Promise((r) => requestAnimationFrame(r));
  return { all, shown, hiddenHasLink, count, byCode, codeRowsOk, restored: document.querySelectorAll("#srView .sr-row:not([hidden])").length, placeholder: box.placeholder };
});
console.log("sr filter:", JSON.stringify(srFilter));
if (!srFilter.all || !srFilter.shown || srFilter.shown >= srFilter.all || srFilter.hiddenHasLink || !new RegExp("\\b" + srFilter.shown + "\\b.*\\b" + srFilter.all + "\\b").test(srFilter.count) ||
    !srFilter.byCode || !srFilter.codeRowsOk || srFilter.restored !== srFilter.all || !srFilter.placeholder) errors.push("screen reader filter mismatch: " + JSON.stringify(srFilter));
// 🔊 tab badge = total current issues; inline token diff inside the fix blocks (Copy still copies the plain snippet)
const polish = await panel.evaluate(() => {
  const btn = document.querySelector("#tabs button[data-view='sr']");
  const sc = srScoreCompute();
  const total = Object.values(sc.breakdown).reduce((a, n) => a + n, 0);
  const block = [...document.querySelectorAll("#srOrderList .sr-fix")].find((b) => b.querySelector(".sr-diff-add"));
  const d = srDiffTokens('<input type="text" placeholder="Name">', '<input type="text" aria-label="Name" placeholder="Name">');
  const same = srDiffTokens("<a href=\"#\">x</a>", "<a href=\"#\">x</a>");
  return { label: btn.textContent, badgeText: btn.querySelector(".sr-tab-badge")?.textContent, title: btn.title, total, badges: btn.querySelectorAll(".sr-tab-badge").length,
    addSpans: document.querySelectorAll("#srOrderList .sr-fix .sr-diff-add").length, delSpans: document.querySelectorAll("#srOrderList .sr-fix .sr-diff-del").length,
    snippetHasHtml: !!block && block.querySelector(".fix-snippet:not(.sr-current) .sr-diff-add") !== null && !/<span/.test(block.querySelector(".fix-snippet:not(.sr-current)").textContent),
    diff: d.filter((x) => x.type === "add").map((x) => x.text), diffDel: d.filter((x) => x.type === "del").length, sameOnly: same.every((x) => x.type === "same"),
    joinB: d.filter((x) => x.type !== "del" && x.type !== "same-del").map((x) => x.text).join("") };
});
console.log("badge/diff:", JSON.stringify(polish));
if (!/\d+/.test(polish.label) || polish.badgeText !== String(polish.total) || polish.badges !== 1 || !polish.title.includes(": " + polish.total) ||
    !polish.addSpans || !polish.snippetHasHtml || polish.diff.join(" ") !== 'aria-label="Name"' || polish.diffDel !== 0 || !polish.sameOnly ||
    polish.joinB !== '<input type="text" aria-label="Name" placeholder="Name">') errors.push("badge / inline diff mismatch: " + JSON.stringify(polish));
// Arabic + English: the badge survives a language switch (applySrStrings)
const badgeAfterLang = await panel.evaluate(() => { applySrStrings(); const b = document.querySelector("#tabs button[data-view='sr']"); return { label: b.textContent, n: b.querySelectorAll(".sr-tab-badge").length }; });
if (!/\d+/.test(badgeAfterLang.label) || badgeAfterLang.n !== 1) errors.push("badge lost after applySrStrings: " + JSON.stringify(badgeAfterLang));
// score card: visible after the first section has data, numeric score, verdict class, Top 5 entries that jump to a row
const card = await panel.evaluate(() => {
  const num = document.querySelector("#srScoreCard .sr-score-num");
  const sc = srScoreCompute();
  const first = document.querySelector("#srScoreCard .sr-score-top li:not(.sr-no-issues)");
  if (first) first.click();
  const flashed = document.querySelector("#srOrderList .sr-row.sr-flash");
  return { hidden: document.getElementById("srScoreCard").hidden, num: num && parseInt(num.firstChild.textContent, 10), cls: num && num.className,
    verdict: document.querySelector("#srScoreCard .sr-score-title .dls-verdict")?.textContent, top: sc.top.map((e) => `${e.title} (-${e.weight})`),
    counts: document.querySelector("#srScoreCard .sr-score-counts")?.textContent, topN: sc.top.length, flashed: !!flashed, breakdown: sc.breakdown,
    exportScore: srResultsForExport().score?.score, htmlHas: srSectionHtml().includes("Screen reader score") };
});
console.log("score card:", card);
if (card.hidden || !Number.isInteger(card.num) || card.num < 0 || card.num > 100 || !/\b(pass|warn|fail)\b/.test(card.cls || "") || !card.verdict ||
    !card.topN || !card.flashed || card.exportScore !== card.num || !card.htmlHas) errors.push("score card mismatch");
// component-level grouping: the two identical "Read more" links (same tag/class/role/codes, inside .aegov-card) collapse into one row
const grp = await panel.evaluate(() => {
  const row = document.querySelector("#srOrderList .sr-row.sr-grouped");
  const badge = row && row.querySelector(".badge-dup");
  const det = row && row.querySelector("details.sr-group");
  if (det) { det.open = true; det.querySelector("li code").click(); }
  if (badge) badge.click();
  const groups = srGroupRows(srState.order.rows).filter((g) => g.count > 1);
  const exp = srResultsForExport().readingOrder.issues.filter((x) => x.instances > 1);
  return { rows: document.querySelectorAll("#srOrderList .sr-grouped").length, badge: badge && badge.textContent, role: row && row.querySelector(".sr-role").firstChild.textContent,
    sels: det ? det.querySelectorAll("li code").length : 0, fixes: row ? row.querySelectorAll(".sr-fix").length : 0, groups: groups.map((g) => `${srGroupLabel(g)} ×${g.count}`),
    exp: exp.map((x) => `${x.component}|${x.instances}|${x.selectors.length}`), htmlHas: srSectionHtml().includes("×2 identical"),
    jump: (() => { srJumpTo("order", groups[0] && groups[0].sels[1]); return !!document.querySelector("#srOrderList .sr-grouped.sr-flash"); })() };
});
console.log("grouping:", grp);
if (grp.badge && !highlightAllCalls.some((n) => n >= 2)) errors.push("×N badge did not highlight every instance: " + JSON.stringify(highlightAllCalls));
if (!grp.rows || !/×2/.test(grp.badge || "") || grp.role !== "aegov-card · link" || grp.sels !== 2 || grp.fixes < 1 || !grp.exp.includes("aegov-card|2|2") || !grp.htmlHas || !grp.jump) errors.push("grouping mismatch");
// ticket exports carry the screen reader findings (issues.md / Jira / Azure / CSV) — with or without an axe report
const tickets = await panel.evaluate(() => {
  const empty = { url: location.href, scannedAt: new Date().toISOString(), ruleSet: "wcag21aa", violations: [] };
  const md = A11yFixes.issuesMarkdown(lastReport || empty, null, undefined, srResultsForExport());
  const jira = toJiraCsv(lastReport || empty), azure = toAzureCsv(lastReport || empty), csv = toCsv(lastReport || empty);
  const n = A11yFixes.srFindings(srResultsForExport()).length;
  return { n, md: md.includes("[SR]") && md.includes("How to verify"), mdTitles: (md.match(/^### \[SR\] /gm) || []).length,
    jira: jira.includes("[SR]") && jira.includes("How to verify:") && jira.includes("sr-no-name"), jiraRows: (jira.match(/\[SR\]/g) || []).length,
    azure: azure.includes("[SR]") && azure.includes("How to verify"), csv: csv.includes('"sr:no-name"') && csv.includes("How to verify"),
    mdNoSr: !A11yFixes.issuesMarkdown(lastReport || empty, null, undefined, null).includes("[SR]") };
});
console.log("ticket exports:", tickets);
if (!tickets.n || !tickets.md || tickets.mdTitles !== tickets.n || !tickets.jira || tickets.jiraRows !== tickets.n || !tickets.azure || !tickets.csv || !tickets.mdNoSr) errors.push("screen reader ticket export mismatch");
// export hardening: formula-injection prefix, Jira {code} breakout, bilingual rows export English text + other-page selectors tagged with the URL
const hardening = await panel.evaluate(() => {
  const o = srState.order, b = { ...o, url: o.url + "?other", rows: o.rows.filter((r) => r.role !== "button") };
  const saved = srState.cmp;
  srState.cmp = { url: o.url, otherUrl: "https://other.example/en/", differences: srCmpDiff(b, srState.lang, o, srState.lang), other: { order: o, lang: srState.lang } };
  renderCmp();
  const d = srState.cmp.differences[0];
  const exp = srResultsForExport().bilingual.differences[0];
  const rowMsg = document.querySelector("#srCmpList .sr-issue")?.textContent || "";
  const r = { csv: csvEscape("=1+1") + csvEscape("-x") + csvEscape("plain"), jira: jiraCode("<b>{code}</b>{noformat:x}"), side: d.side, uiMsg: srCmpMsg(d), enMsg: srCmpMsg(d, true), rowMsg,
    expMsg: exp.msg, expSel: exp.sel, expSels: exp.selectors, top: srScoreCompute().top.map((e) => e.detail).join(" | "), lang };
  srState.cmp = saved; renderCmp();
  return r;
});
console.log("export hardening:", JSON.stringify(hardening));
if (hardening.csv !== "\"'=1+1\"\"'-x\"\"plain\"" || hardening.jira !== "<b>{ code}</b>{ noformat:x}" || hardening.side !== "other" || !/other page/.test(hardening.enMsg) ||
    hardening.expMsg !== hardening.enMsg || hardening.rowMsg !== hardening.uiMsg || !hardening.top.includes(hardening.uiMsg) ||
    !hardening.expSel.startsWith("https://other.example/en/ ") || !hardening.expSels.every((x) => x.startsWith("https://other.example/en/ ")) ||
    (hardening.lang === "ar") !== (hardening.uiMsg !== hardening.enMsg)) errors.push("export hardening mismatch: " + JSON.stringify(hardening));
// "Hear it": 🔈 buttons render, speak "<name>, <role>, <states>" with a voice matching the row language; ▶ Play page reads every rendered row
const hear = await panel.evaluate(async () => {
  const btns = document.querySelectorAll("#srOrderList .sr-row .sr-speak");
  const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.__srSpeech && /required/.test(r.__srSpeech.text)) || document.querySelector("#srOrderList .sr-row");
  window.__utts.length = 0;
  row.querySelector(".sr-speak").click();
  await new Promise((r) => setTimeout(r, 80));
  const single = window.__utts[0];
  const arRow = srState.order.rows.find((r) => r.lang === "ar" && r.name);
  const arText = arRow ? srAnnouncement(arRow) : null;
  const arLang = arRow ? srLangOf(arRow) : null;
  window.__utts.length = 0;
  document.getElementById("srPlayBtn").click();
  await new Promise((r) => setTimeout(r, 30));
  const labelWhilePlaying = document.getElementById("srPlayBtn").textContent;
  const speakingRow = !!document.querySelector("#srOrderList .sr-row.sr-speaking");
  await new Promise((r) => setTimeout(r, 40 * (btns.length + 2)));
  const rendered = [...document.querySelectorAll("#srOrderList .sr-row")].filter((r) => r.__srSpeech && r.__srSpeech.text).length;
  srRateInput.value = "1.5"; srRateInput.dispatchEvent(new Event("input")); srRateInput.dispatchEvent(new Event("change"));
  await new Promise((r) => setTimeout(r, 50));
  const sample = srAnnouncement({ name: "Your name", role: "textbox", states: ["required"], lang: "en" });
  const sampleAr = srAnnouncement({ name: "اقرأ المزيد", role: "link", states: [], lang: "ar" });
  const heading = srAnnouncement({ name: "Title", role: "heading", states: ["level 2"], lang: "en" });
  const chk = srAnnouncement({ name: "Agree", role: "checkbox", states: ["not checked"], lang: "en" });
  const nav = srAnnouncement({ name: "", role: "navigation", states: [], lang: "en" });
  return { btns: btns.length, rowText: row.__srSpeech.text, single, arText, arLang, labelWhilePlaying, speakingRow, played: window.__utts.length, rendered,
    labelAfter: document.getElementById("srPlayBtn").textContent, status: document.getElementById("status").textContent, rateVal: srRateVal.textContent,
    firstPlayed: window.__utts[0] && window.__utts[0].text, sample, sampleAr, heading, chk, nav, noSpeechClass: document.body.classList.contains("no-speech") };
});
console.log("hear it:", JSON.stringify(hear));
if (!hear.btns || hear.noSpeechClass || !hear.single || hear.single.text !== hear.rowText || hear.single.voice !== "Fake EN" || hear.single.rate !== 1 ||
    !/^(Stop|إيقاف)/.test(hear.labelWhilePlaying) || hear.labelWhilePlaying === hear.labelAfter || !hear.speakingRow || hear.played !== hear.rendered || !/^(Play page|تشغيل الصفحة)/.test(hear.labelAfter) ||
    hear.sample !== "Your name, edit text, required" || hear.sampleAr !== "اقرأ المزيد, رابط" || hear.heading !== "Title, heading level 2" || hear.chk !== "Agree, checkbox, not checked" ||
    hear.nav !== "navigation region" || hear.rateVal !== "1.5×" || settings.srRate !== 1.5) errors.push("hear-it mismatch");
if (hear.arText !== null && hear.arLang !== "ar") errors.push("hear-it: Arabic row lang not detected");
await panel.click("#srIssuesOnly");
console.log("all rows:", await panel.locator("#srOrderList .sr-row").count(), "| fix blocks:", await panel.locator("#srOrderList .sr-fix").count(), "| member badges:", await panel.locator("#srOrderList .badge-dup").count());
console.log("SAMPLE FIXES:\n" + (await panel.evaluate(() => srState.order.rows.filter((r) => r.issues.length).slice(0, 12).map((r) => {
  const f = srFixFor(r.issues[0].code, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag });
  return `--- [${r.issues[0].code}] ${r.html}\n${f ? f.snippet : "(no fix)"}`; }).join("\n"))));
// Playback scoping (all rows shown): per-row "play from here" / "play this section" buttons, the filter as a scope, Space/Esc keys, play from a picked element
const scoped = await panel.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const list = document.getElementById("srOrderList");
  const rows = () => [...list.querySelectorAll(".sr-row")];
  const playable = () => rows().filter((r) => !r.hidden && r.__srSpeech && r.__srSpeech.text);
  const out = { rows: rows().length, speak: list.querySelectorAll(".sr-speak").length, from: list.querySelectorAll(".sr-play-from").length, sub: list.querySelectorAll(".sr-play-subtree").length,
    speakerIcon: !!list.querySelector(".sr-speak svg use[href='#i-speaker']"), fromTitle: list.querySelector(".sr-play-from")?.title, scopeTitle: srPlayBtn.title, scopeN: playable().length };
  const finish = async (n) => { await wait(40 * (n + 2)); };
  // play from here: 3rd row records rows 3..N only
  window.__utts.length = 0;
  rows()[2].querySelector(".sr-play-from").click();
  await wait(30);
  out.fromPlayingLabel = srPlayBtn.textContent;
  await finish(playable().length);
  const expectFrom = playable().slice(playable().indexOf(rows()[2])).map((r) => r.__srSpeech.text);
  out.fromOk = window.__utts.length === expectFrom.length && window.__utts.every((u, i) => u.text === expectFrom[i]) && expectFrom.length < playable().length;
  out.fromCount = window.__utts.length;
  // subtree: the aegov-card group row reads only its descendants (the three links)
  const card = rows().find((r) => r.__srSpeech && /Offers card/.test(r.__srSpeech.text));
  window.__utts.length = 0;
  card.querySelector(".sr-play-subtree").click();
  await finish(8);
  const cardSel = card.__srSpeech.sel;
  const after = rows()[rows().indexOf(card) + 5];
  out.subTexts = window.__utts.map((u) => u.text);
  const inCard = (txt) => rows().some((r) => r.__srSpeech && r.__srSpeech.text === txt && (r.__srSpeech.sel === cardSel || r.__srSpeech.sel.startsWith(cardSel + " > ")));
  out.subOk = window.__utts[0].text === card.__srSpeech.text && window.__utts.every((u) => inCard(u.text)) &&
    out.subTexts.filter((x) => /^Read more, (link|رابط)/.test(x)).length === 2 && out.subTexts.some((x) => /^click here, (link|رابط)/.test(x)) && !out.subTexts.includes(after.__srSpeech.text);
  // filter as scope: "button" then Play page records only the visible rows
  const box = document.getElementById("srFilterInput");
  box.value = "button"; box.dispatchEvent(new Event("input"));
  await wait(50);
  out.filterScope = srPlayBtn.title;
  const vis = playable();
  window.__utts.length = 0;
  srPlayBtn.click();
  await finish(vis.length);
  out.filterOk = vis.length && vis.length < rows().length && window.__utts.length === vis.length && window.__utts.every((u, i) => u.text === vis[i].__srSpeech.text);
  out.filterCount = window.__utts.length + "/" + vis.length + "/" + rows().length;
  box.value = ""; box.dispatchEvent(new Event("input"));
  await wait(50);
  // Space pauses/resumes (row stays highlighted), Escape stops
  window.__utts.length = 0;
  srPlayBtn.click();
  await wait(30);
  document.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
  await wait(30);
  out.paused = srSpeech.paused && speechSynthesis.paused === true && !!list.querySelector(".sr-row.sr-speaking") && srPlayBtn.classList.contains("paused");
  out.pausedStatus = document.getElementById("status").textContent;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
  await wait(30);
  out.resumed = !srSpeech.paused && speechSynthesis.paused === false && srSpeech.playing;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await wait(30);
  const n = window.__utts.length;
  await wait(200);
  out.escOk = !srSpeech.playing && window.__utts.length === n && n < playable().length && !list.querySelector(".sr-row.sr-speaking") && /^(Play page|تشغيل الصفحة)/.test(srPlayBtn.textContent);
  // Space does nothing when nothing is playing
  document.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
  out.idleSpace = !srSpeech.playing && !srSpeech.paused;
  return out;
});
console.log("scoped playback:", JSON.stringify(scoped));
if (!scoped.rows || scoped.from !== scoped.speak || scoped.sub !== scoped.speak || !scoped.speakerIcon || !scoped.fromTitle || !new RegExp("\\b" + scoped.scopeN + "\\b").test(scoped.scopeTitle) ||
    !/^(Stop|إيقاف)/.test(scoped.fromPlayingLabel) || !scoped.fromOk || !scoped.subOk || !scoped.filterOk || !/\b\d+\b/.test(scoped.filterScope) || scoped.filterScope === scoped.scopeTitle ||
    !scoped.paused || !/^(Paused|متوقف مؤقتاً)/.test(scoped.pausedStatus) || !scoped.resumed || !scoped.escOk || !scoped.idleSpace) errors.push("scoped playback mismatch: " + JSON.stringify(scoped));
// Play from element: the page picker returns a selector; playback starts at the matching row (click on the "click here" link)
await panel.evaluate(() => { window.__utts.length = 0; document.getElementById("srPlayPickBtn").click(); });
await panel.waitForTimeout(300);
await target.click("a[href='/c']");
await panel.waitForTimeout(1500);
const picked = await panel.evaluate(() => ({ first: window.__utts[0] && window.__utts[0].text, n: window.__utts.length, status: document.getElementById("status").textContent, btnEnabled: !document.getElementById("srPlayPickBtn").disabled,
  noRow: (() => { srStopSpeech(); return srRowForSelector("#no-such-element > span:nth-child(1)", srOrderList) === null; })(),
  ancestor: (() => { const a = [...srOrderList.querySelectorAll(".sr-row")].find((r) => r.__srSpeech && /^click here/.test(r.__srSpeech.text)); return srRowForSelector(a.__srSpeech.sel + " > span:nth-child(1)", srOrderList) === a; })() }));
console.log("play from element:", JSON.stringify(picked));
if (!/^click here, (link|رابط)/.test(picked.first || "") || picked.n < 2 || !picked.btnEnabled || !picked.noRow || !picked.ancestor) errors.push("play from element mismatch: " + JSON.stringify(picked));
// framework-aware fix snippets: switch the framework setting and re-render the order rows
for (const fw of ["react", "vue", "html"]) {
  const r = await panel.evaluate((fw) => {
    settings.framework = fw;
    renderSrRows(srState.order.rows, srOrderList, true);
    const headers = [...document.querySelectorAll("#srOrderList .sr-fix .fix-note")].map((n) => n.textContent).filter((x) => /^(Change to|غيّره إلى)/.test(x));
    const snippets = [...document.querySelectorAll("#srOrderList .sr-fix .fix-snippet:not(.sr-current)")].map((c) => c.textContent);
    const fixes = srState.order.rows.filter((r) => r.issues.length).map((r) => srFixFor(r.issues[0].code, { html: r.html, sel: r.sel, role: r.role, name: r.name, tag: r.tag })).filter(Boolean);
    return { headers: [...new Set(headers)], n: snippets.length, joined: snippets.join("\n"), fwTag: [...new Set(fixes.map((f) => f.framework))],
      first: snippets[0], reportHas: srSectionHtml().includes(fw === "html" ? "Suggested fix</div>" : "Suggested fix (" + (fw === "react" ? "React" : "Vue") + ")") };
  }, fw);
  const label = fw === "html" ? "" : "(" + (fw === "react" ? "React" : "Vue") + ")";
  const ok = r.n > 0 && r.headers.length === 1 && r.headers[0].includes(label) && r.fwTag.join() === fw &&
    (fw === "react" ? /htmlFor=|className=|tabIndex=\{| \/>|\{\/\*/.test(r.joined) && !/<!--/.test(r.joined) :
     fw === "vue" ? /:aria-label=|@click=|@keydown=|v-if/.test(r.joined) && !/className=|htmlFor=/.test(r.joined) :
     !/className=|htmlFor=|:aria-label=|v-if/.test(r.joined));
  console.log("framework " + fw + ":", ok ? "OK" : "MISMATCH", "| header:", r.headers.join(" / "), "| snippets:", r.n, "| report label:", r.reportHas, "\n  first:", (r.first || "").split("\n")[0].slice(0, 100));
  if (!ok || !r.reportHas) errors.push("framework " + fw + " fix snippets mismatch");
}
// apply fix in place: the placeholder-only input gets aria-label, the reading order rebuilds and the row turns ✓ fixed; Undo brings the issue back
const applied = await (async () => {
  const before = await panel.evaluate(() => {
    const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.textContent.includes("placeholder only") || r.textContent.includes("placeholder-only"));
    const btn = row && row.querySelector(".sr-apply-btn");
    const inputs = [...document.querySelectorAll("#srOrderList .sr-apply-input")].map((i) => i.value);
    if (btn) btn.click();
    return { sel: row && row.dataset.srSel, hasBtn: !!btn, applyBtns: document.querySelectorAll("#srOrderList .sr-apply-btn").length, inputs: inputs.slice(0, 4) };
  });
  await panel.waitForTimeout(2500);
  const after = await panel.evaluate((sel) => {
    const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === sel);
    const issue = srState.order.rows.find((r) => r.sel === sel && r.issues.some((i) => i.code === "placeholder-only"));
    const undo = row && row.querySelector(".sr-undo");
    return { fixed: !!row && row.classList.contains("fixed"), badge: row && row.querySelector(".badge-fixed")?.textContent, stillFlagged: !!issue,
      applied: srState.applied.map((e) => `${e.section}:${e.code}`), hasUndo: !!undo, status: document.getElementById("status").textContent };
  }, before.sel);
  const pageAttr = await target.evaluate(() => document.querySelector("input[placeholder='Your name']").getAttribute("aria-label"));
  await panel.evaluate((sel) => { const row = [...document.querySelectorAll("#srOrderList .sr-row")].find((r) => r.dataset.srSel === sel); row?.querySelector(".sr-undo")?.click(); }, before.sel);
  await panel.waitForTimeout(2500);
  const undone = await panel.evaluate((sel) => ({
    fixedRows: document.querySelectorAll("#srOrderList .sr-row.fixed").length, applied: srState.applied.length,
    back: srState.order.rows.some((r) => r.sel === sel && r.issues.some((i) => i.code === "placeholder-only")) }), before.sel);
  const pageAttrAfterUndo = await target.evaluate(() => document.querySelector("input[placeholder='Your name']").getAttribute("aria-label"));
  return { before, after, pageAttr, undone, pageAttrAfterUndo };
})();
console.log("apply in place:", JSON.stringify(applied));
if (!applied.before.hasBtn || !applied.after.fixed || !/✓/.test(applied.after.badge || "") || applied.after.stillFlagged || !applied.after.hasUndo ||
    applied.pageAttr !== "Your name" || applied.pageAttrAfterUndo !== null || applied.undone.fixedRows !== 0 || applied.undone.applied !== 0 || !applied.undone.back) errors.push("apply-in-place mismatch");
await panel.click("#srAddFindingsBtn");
await panel.waitForTimeout(300);
console.log("add findings status:", await panel.textContent("#status"), "| stored keys:", Object.keys(store));
const grouped = (Object.keys(store).filter((k) => k.startsWith("manual:")).flatMap((k) => store[k]?.findings?.["screen-reader"] || [])).filter((f) => /×2/.test(f.note));
console.log("grouped manual findings:", grouped.map((f) => f.note));
if (!grouped.length) errors.push("manual findings lack the ×2 group note");
await panel.click("#srLangBtn"); await panel.waitForTimeout(500);
console.log("lang stats:", await panel.textContent("#srLangStats"), "| rows:", await panel.locator("#srLangList .sr-row").count(), "| fixes:", await panel.locator("#srLangList .sr-fix").count());
console.log("LANG FIX:", await panel.evaluate(() => [...document.querySelectorAll("#srLangList .sr-fix .fix-snippet:not(.sr-current)")].map((c) => c.textContent).join("\n---\n")));
// non-text contrast (WCAG 1.4.11): #ddd input border, #bbb icon-only button, #ccc toggle fail at 3:1; the #767676 border, dark icon, disabled field stay clean
await panel.evaluate(() => { document.getElementById("srNtcSection").open = true; });
await panel.click("#srNtcBtn"); await panel.waitForTimeout(800);
const ntc = await panel.evaluate(() => {
  const r = srState.ntc;
  const rows = [...document.querySelectorAll("#srNtcList .sr-row")];
  const exp = srResultsForExport().nonTextContrast;
  const fixOf = (sel) => { const i = r.issues.find((x) => x.sel === sel); return i && srFixFor(i.code, srNtcFixCtx(i)); };
  const dlsBefore = settings.dlsContrast; settings.dlsContrast = true; const dlsFix = fixOf("#ntcInput"); settings.dlsContrast = dlsBefore;
  return { sels: r.issues.map((i) => i.sel).sort(), kinds: r.issues.map((i) => i.kind).sort(), ratios: r.issues.every((i) => i.ratio > 0 && i.ratio < 3), levels: r.issues.every((i) => i.level === "serious" && i.code === "nontext-contrast"),
    rows: rows.length, swatches: document.querySelectorAll("#srNtcList .dls-swatch").length, fixes: document.querySelectorAll("#srNtcList .sr-fix").length, stats: document.getElementById("srNtcStats").textContent,
    step: document.querySelector('#srSteps .step[data-step="5"]').dataset.state, stepState: document.querySelector('#srSteps .step[data-step="5"] .step-state').textContent, title: document.querySelector("#srNtcSection .step-title").textContent,
    fixBorder: fixOf("#ntcInput").snippet, fixIcon: fixOf("#ntcIcon").snippet, fixBg: fixOf("#ntcToggle").snippet, dlsFix: dlsFix.snippet + " " + dlsFix.note,
    exported: exp && exp.issues.length, expChecked: exp && exp.checked, expFix: exp && exp.issues.every((i) => i.fix && i.fix.snippet), score: srScoreCompute().breakdown.ntc, penalty: srScoreCompute().penalty,
    html: /Non-text contrast \(WCAG 1\.4\.11\)/.test(srSectionHtml()), findings: A11yFixes.srFindings(srResultsForExport()).filter((f) => f.section === "ntc").map((f) => f.verify),
    status: document.getElementById("status").textContent, badge: document.querySelector("#tabs button[data-view='sr']").title,
    // best-candidate rule + unknown backgrounds: hamburger (faint border, dark glyph), Material filled field (border-bottom), light submit input, white-rect logo, control over a gradient stay clean
    cleanNew: ["#ntcHamburger", "#ntcFilled", "#ntcSubmitLight", "#ntcLogo", "#ntcOnImage"].filter((sel) => r.issues.some((i) => i.sel === sel)),
    msgLocalised: rows[0] && rows[0].querySelector(".sr-issue").textContent };
});
console.log("non-text contrast:", JSON.stringify(ntc));
if (ntc.cleanNew.length || !/(3:1|WCAG 1\.4\.11)/.test(ntc.msgLocalised || "")) errors.push("non-text contrast false positives / message: " + JSON.stringify(ntc.cleanNew) + " " + ntc.msgLocalised);
if (ntc.sels.join() !== "#ntcIcon,#ntcInput,#ntcToggle" || ntc.kinds.join() !== "background,border,icon" || !ntc.ratios || !ntc.levels || ntc.rows !== 3 || ntc.swatches !== 6 || ntc.fixes !== 3 ||
    !/\b3\b/.test(ntc.stats) || ntc.step !== "issues" || !/3/.test(ntc.stepState) || !ntc.title || !/border: 1px solid #[0-9a-f]{6}/.test(ntc.fixBorder) || !/svg \{\n  fill: #[0-9a-f]{6}/.test(ntc.fixIcon) || !/background-color: #[0-9a-f]{6}/.test(ntc.fixBg) ||
    !/DLS [a-z]+-\d+/.test(ntc.dlsFix) || ntc.exported !== 3 || !(ntc.expChecked >= 3) || !ntc.expFix || ntc.score !== 3 || !ntc.html || ntc.findings.length !== 3 || !ntc.findings.every((v) => /3:1/.test(v)) || !/3/.test(ntc.status) || !/3/.test(ntc.badge))
  errors.push("non-text contrast mismatch: " + JSON.stringify(ntc));
// bilingual comparison: compare the page against itself → 0 differences
await panel.evaluate(() => { document.getElementById("srCmpSection").open = true; }); // step 5 is collapsed by default
await panel.fill("#srCmpUrl", await target.url()); await panel.click("#srCmpBtn"); await panel.waitForTimeout(1500);
const cmp = await panel.evaluate(() => ({ stats: document.getElementById("srCmpStats").textContent, rows: document.querySelectorAll("#srCmpList .sr-row").length,
  urls: document.querySelector("#srCmpList .sr-cmp-urls")?.textContent || "", n: srState.cmp && srState.cmp.differences.length, exp: srResultsForExport().bilingual?.differences.length,
  html: /Bilingual comparison/.test(srSectionHtml()), score: srScoreCompute().breakdown.cmp, guess: srCmpGuess("https://u.ae/ar/about?x=1") + " " + srCmpGuess("https://ar.example.com/") + " " + srCmpGuess("https://x.gov.ae/page?lang=en"),
  diff: (() => { const o = srState.order; const b = { ...o, rows: o.rows.filter((r) => r.role !== "button") }; return srCmpDiff(o, srState.lang, b, srState.lang).map((d) => d.kind + ":" + d.side); })() }));
console.log("bilingual:", cmp);
if (!/\b0\b/.test(cmp.stats) || cmp.rows !== 0 || cmp.n !== 0 || cmp.exp !== 0 || !cmp.html || cmp.score !== 0 || !cmp.urls ||
    cmp.guess !== "https://u.ae/en/about?x=1 https://en.example.com/ https://x.gov.ae/page?lang=ar" || !cmp.diff.length || !cmp.diff.every((d) => d === "missing:this")) errors.push("bilingual comparison mismatch: " + JSON.stringify(cmp));
await panel.click("#srLiveBtn"); await panel.waitForTimeout(2000);
await target.click("#silentBtn"); await target.click("#liveBtn"); await panel.waitForTimeout(2500);
console.log("live stats:", await panel.textContent("#srLiveStats"), "| regions:", (await panel.textContent("#srLiveRegions")).slice(0, 80));
console.log("live kinds:", await panel.locator("#srLiveLog .sr-kind").allTextContents(), "| fixes:", await panel.locator("#srLiveLog .sr-fix").count());
console.log("LIVE FIX:", await panel.evaluate(() => document.querySelector("#srLiveLog .sr-fix .fix-snippet:not(.sr-current)")?.textContent));
const liveHear = await panel.evaluate(async () => {
  const rows = [...document.querySelectorAll("#srLiveLog .sr-log-row")];
  const ann = rows.find((r) => r.querySelector(".sr-kind.announced"));
  const silent = rows.find((r) => r.querySelector(".sr-kind.silent"));
  window.__utts.length = 0;
  if (ann) ann.querySelector(".sr-speak").click();
  await new Promise((r) => setTimeout(r, 60));
  if (silent) silent.querySelector(".sr-speak").click();
  await new Promise((r) => setTimeout(r, 60));
  return { btns: document.querySelectorAll("#srLiveLog .sr-speak").length, announced: window.__utts[0] && window.__utts[0].text, silent: window.__utts[1] && window.__utts[1].text, rate: window.__utts[0] && window.__utts[0].rate };
});
console.log("live hear it:", JSON.stringify(liveHear));
if (!liveHear.btns || !/^(polite|assertive), .+/.test(liveHear.announced || "") || !/^silent, .+/.test(liveHear.silent || "") || liveHear.rate !== 1.5) errors.push("live hear-it mismatch");
// missing state (dynamic): clicking the team card toggles .selected, the tab strip moves "active", the expander shows its next sibling —
// none of them changes an aria-* state → three "state-not-announced" entries naming aria-pressed / aria-selected / aria-expanded
await target.click("#teamCard"); await target.click("#tabB"); await target.click("#expander"); await target.click("#searchBtn"); await panel.waitForTimeout(2500);
const stateLive = await panel.evaluate(() => {
  const log = srState.live.log.filter((e) => e.code === "state-not-announced");
  const rows = [...document.querySelectorAll("#srLiveLog .sr-log-row")].filter((r) => (r.dataset.srCodes || "") === "state-not-announced");
  const exp = srResultsForExport().liveRegions.log.filter((e) => e.code === "state-not-announced");
  const sc = srScoreCompute();
  const fixExp = srFixFor("state-not-announced", { html: '<button id="expander">More filters</button>', attr: "aria-expanded", target: "#expBody", text: "More filters" });
  return { attrs: log.map((e) => e.attr + "@" + e.sel).sort(), kinds: [...new Set(log.map((e) => e.kind))], notes: log.every((e) => /no aria state changed/.test(e.note) && /add aria-/.test(e.note)),
    rows: rows.length, fixes: rows.filter((r) => r.querySelector(".sr-fix")).length, badge: rows[0] && rows[0].querySelector(".sr-kind").textContent, expFixes: exp.filter((e) => e.fix && /aria-/.test(e.fix.snippet)).length,
    penalty: (() => { const p1 = sc.penalty; const keep = srState.live.log; srState.live.log = keep.filter((e) => e.code !== "state-not-announced"); const p0 = srScoreCompute().penalty; srState.live.log = keep; return p1 - p0; })(),
    fixExp: fixExp.snippet, findings: A11yFixes.srFindings(srResultsForExport()).filter((f) => f.code === "state-not-announced").map((f) => f.level + ":" + (f.verify || "").slice(0, 20)),
    speak: (() => { const r = rows[0]; return r && r.querySelector(".sr-speak") ? "yes" : "no"; })() };
});
console.log("state live:", JSON.stringify(stateLive));
if (stateLive.attrs.join() !== "aria-expanded@#expander,aria-pressed@#teamCard,aria-selected@#tabB" || stateLive.kinds.join() !== "silent" || !stateLive.notes || stateLive.rows !== 3 || stateLive.fixes !== 3 ||
    !/^(SILENT|صامت)$/.test(stateLive.badge || "") || stateLive.expFixes !== 3 || stateLive.penalty !== 15 || !/aria-expanded="false" aria-controls="expBody"/.test(stateLive.fixExp) || !/panel\.hidden = !isOn/.test(stateLive.fixExp) ||
    stateLive.findings.length !== 3 || !stateLive.findings.every((f) => /^serious:Activate/.test(f)) || stateLive.speak !== "yes") errors.push("missing-state live watch mismatch: " + JSON.stringify(stateLive));
// SPA route-change check: the fake router's "Services" re-renders silently (same title, same H1, focus stays on the button) → route-silent + route-h1-dup;
// "Contact" sets document.title, focuses its new H1 and fills the announcer → route-ok. Rows carry a NAVIGATION badge, the code, the title/H1/focus diff and a fix.
await target.click("#inPageLink"); await panel.waitForTimeout(2000); // in-page anchor: no route entry
await target.click("#spaBad"); await panel.waitForTimeout(2600);
await target.click("#spaGood"); await panel.waitForTimeout(2600);
const route = await panel.evaluate(() => {
  const log = srState.live.log.filter((e) => e.kind === "route");
  const rows = [...document.querySelectorAll("#srLiveLog .sr-log-row")].filter((r) => r.querySelector(".sr-kind.route"));
  const bad = log.find((e) => e.code === "route-silent"), dup = log.find((e) => e.code === "route-h1-dup"), ok = log.find((e) => e.code === "route-ok");
  const sc = srScoreCompute();
  const fix = bad && srFixFor("route-silent", { html: bad.html, sel: bad.sel, text: bad.text, url: bad.url });
  settings.framework = "react"; const fixReact = srFixFor("route-title-stale", { titleAfter: "", h1After: "Home" }).snippet;
  settings.framework = "vue"; const fixVue = srFixFor("route-focus-stuck", { html: "<h1>Home</h1>", sel: "#app > h1" }).snippet; settings.framework = "html";
  const exp = srResultsForExport().liveRegions.log.filter((e) => e.kind === "route");
  return { codes: log.map((e) => e.code), rows: rows.length, badges: [...new Set(rows.map((r) => r.querySelector(".sr-kind").textContent))], rowCodes: rows.map((r) => r.dataset.srCodes),
    fixes: rows.filter((r) => r.querySelector(".sr-fix")).length, detail: rows[0] && rows[0].querySelector(".sr-route-detail")?.textContent, pill: rows[0] && rows[0].querySelector(".pill.route-code")?.textContent,
    badTitleSame: !!bad && bad.titleBefore === bad.titleAfter && !bad.focusMoved && !bad.announced, dupH1: dup && dup.h1Before === "Home" && dup.h1After === "Home",
    okGood: !!ok && ok.focusMoved && ok.announced && ok.titleAfter === "Contact — SPA demo" && ok.titleBefore !== ok.titleAfter,
    top: sc.top.map((e) => e.title), breakdownLive: sc.breakdown.live, stats: document.getElementById("srLiveStats").textContent, stepState: srStepEl("live").dataset.state,
    inPage: log.filter((e) => /#spaNav$/.test(e.url)).length, notesLocal: log.every((e) => !!e.noteKey && !/^[A-Za-z]/.test(srLiveNote(e)) === (document.documentElement.lang === "ar")),
    fixOk: !!fix && /route-announcer|role="status"/.test(fix.snippet) && /document\.title/.test(fix.snippet), fixReact, fixVue, verify: A11yFixes.srVerifyStep("route-silent", {}),
    expFixes: exp.filter((e) => e.fix).length, expNoFixOk: exp.filter((e) => e.code === "route-ok" && !e.fix).length, html: srSectionHtml().includes("NAVIGATION · route-silent"),
    findings: A11yFixes.srFindings(srResultsForExport()).filter((f) => /^route-/.test(f.code)).map((f) => f.code + ":" + f.level + ":" + (f.verify ? "v" : "")),
    filtered: (() => { const box = document.getElementById("srFilterInput"); box.value = "route-silent"; box.dispatchEvent(new Event("input"));
      const n = document.querySelectorAll("#srLiveLog .sr-log-row:not([hidden])").length; box.value = ""; box.dispatchEvent(new Event("input")); return n; })() };
});
console.log("spa route check:", JSON.stringify(route));
if (!route.codes.includes("route-silent") || !route.codes.includes("route-h1-dup") || !route.codes.includes("route-ok") || route.codes.includes("route-title-stale") || route.codes.includes("route-focus-stuck") ||
    route.rows !== route.codes.length || route.badges.length !== 1 || !/^(NAVIGATION|تنقّل)$/.test(route.badges[0]) || route.rowCodes.join() !== route.codes.join() || route.fixes !== 2 || !route.detail || !/(title|العنوان): /.test(route.detail) || !/H1: /.test(route.detail) ||
    route.pill !== "route-silent" || !route.badTitleSame || !route.dupH1 || !route.okGood || !route.top.some((x) => /(NAVIGATION|تنقّل) silent/.test(x)) || route.inPage !== 0 || !route.notesLocal || !(route.breakdownLive >= 2) || !/\d/.test(route.stats) || route.stepState !== "running" ||
    !route.fixOk || !/useLocation|react-router/.test(route.fixReact) || !/document\.title/.test(route.fixReact) || !/router\.afterEach/.test(route.fixVue) || !/h1\.focus\(\)/.test(route.fixVue) || !route.verify ||
    route.expFixes !== 2 || route.expNoFixOk !== 1 || !route.html || route.findings.join() !== "route-silent:critical:v,route-h1-dup:moderate:v" || route.filtered !== 1) errors.push("spa route check mismatch: " + JSON.stringify(route));
// query-only change (replaceState ?sort=name + re-render, same title/H1): one minor route-silent, no route-h1-dup / route-title-stale for it
await target.click("#sortBtn"); await panel.waitForTimeout(2600);
const softRoute = await panel.evaluate(() => {
  const qs = srState.live.log.filter((e) => e.kind === "route" && /\?sort=name/.test(e.url));
  const e = qs.find((x) => x.code === "route-silent");
  const row = [...document.querySelectorAll("#srLiveLog .sr-log-row")].find((r) => r.dataset.srCodes === "route-silent" && /sort=name/.test(r.textContent));
  return { codes: qs.map((x) => x.code), soft: !!(e && e.soft), level: e && e.level, lvlUi: e && srRouteLevel(e), w: e && srRouteWeight(e), rowLevel: row && row.querySelector(".pill.route-code") ? row.className : "",
    finding: A11yFixes.srFindings(srResultsForExport()).filter((f) => f.code === "route-silent").map((f) => f.level).join() };
});
console.log("query route check:", JSON.stringify(softRoute));
if (softRoute.codes.join() !== "route-silent" || !softRoute.soft || softRoute.level !== "minor" || softRoute.lvlUi !== "minor" || softRoute.w !== 1 || softRoute.finding !== "critical,minor") errors.push("query route check mismatch: " + JSON.stringify(softRoute));
await panel.click("#srFocusBtn"); await panel.waitForTimeout(300);
await target.focus("text=Delete me"); await target.keyboard.press("Enter"); await panel.waitForTimeout(1500);
console.log("focus stats:", await panel.textContent("#srFocusStats"));
console.log("focus roles:", await panel.locator("#srFocusLog .sr-role").allTextContents(), "| fixes:", await panel.locator("#srFocusLog .sr-fix").count());
const focusHear = await panel.evaluate(async () => {
  const b = document.querySelector("#srFocusLog .sr-row .sr-speak");
  window.__utts.length = 0;
  if (b) b.click();
  await new Promise((r) => setTimeout(r, 60));
  return { btns: document.querySelectorAll("#srFocusLog .sr-speak").length, text: window.__utts[0] && window.__utts[0].text, langs: srState.focus.log.map((e) => e.lang) };
});
console.log("focus hear it:", JSON.stringify(focusHear));
if (!focusHear.btns || !focusHear.text) errors.push("focus hear-it mismatch");
// focus-ring contrast / thickness / clipping: the trace measures the ring on every :focus-visible stop (keyboard interaction first so script focus counts as focus-visible)
await target.keyboard.press("Shift");
for (const id of ["ringFaint", "ringClipped", "ringBorder", "ringShadow", "ringOnImage"]) { await target.evaluate((i) => document.getElementById(i).focus(), id); await target.waitForTimeout(150); }
await panel.waitForTimeout(1200);
const ringTrace = await panel.evaluate(() => {
  const by = (id) => srState.focus.log.filter((e) => e.sel === "#" + id).pop();
  const faint = by("ringFaint"), clipped = by("ringClipped"), border = by("ringBorder"), shadow = by("ringShadow"), onImage = by("ringOnImage");
  const codes = (e) => (e && e.issues || []).map((i) => i.code);
  const row = (id) => [...document.querySelectorAll("#srFocusLog .sr-row")].find((r) => r.dataset.srSel === "#" + id);
  const fixes = { low: srFixFor("focus-ring-low-contrast", { html: faint && faint.html, tag: "button", ringBg: "#ffffff", ringContrast: 1.6 }), thin: srFixFor("focus-ring-thin", { html: "<button>x</button>", tag: "button", ringWidth: 1 }),
    clip: srFixFor("focus-ring-clipped", { html: clipped && clipped.html, tag: "button", info: "#ringClipBox" }) };
  return { faint: codes(faint), faintRing: faint && faint.ring, clipped: codes(clipped), clippedRing: clipped && clipped.ring, border: codes(border), borderRing: border && border.ring,
    faintRow: !!row("ringFaint"), badge: row("ringFaint") ? row("ringFaint").querySelector(".sr-ring")?.textContent : "", fixCount: row("ringFaint") ? row("ringFaint").querySelectorAll(".sr-fix").length : 0,
    fixLow: fixes.low.snippet, fixClip: fixes.clip.snippet, fixThin: fixes.thin.snippet,
    verify: A11yFixes.srVerifyStep("focus-ring-clipped", {}), exported: srResultsForExport().focusTrace.issues.filter((x) => /focus-ring/.test(x.code)).length,
    msg: faint && faint.issues.map((i) => i.msg).join(" | "),
    // the 3px ring layer wins over the persistent offset inset shadow; a ring over a gradient has an unknown contrast and no low-contrast finding
    shadow: codes(shadow), shadowRing: shadow && shadow.ring, onImage: codes(onImage), onImageRing: onImage && onImage.ring, onImageBadge: onImage && onImage.ring ? t("srRingFmt", onImage.ring.kind, onImage.ring.width, onImage.ring.contrast) : "" };
});
console.log("focus ring:", JSON.stringify(ringTrace));
if (!ringTrace.shadowRing || ringTrace.shadowRing.kind !== "box-shadow" || !(ringTrace.shadowRing.contrast >= 3) || ringTrace.shadowRing.width !== 3 || ringTrace.shadow.length ||
    !ringTrace.onImageRing || ringTrace.onImageRing.contrast !== null || ringTrace.onImage.some((c) => c === "focus-ring-low-contrast") || !/unknown|مجهول/.test(ringTrace.onImageBadge))
  errors.push("focus ring shadow/image mismatch: " + JSON.stringify({ shadow: ringTrace.shadow, shadowRing: ringTrace.shadowRing, onImage: ringTrace.onImage, onImageRing: ringTrace.onImageRing, badge: ringTrace.onImageBadge }));
if (!ringTrace.faint.includes("focus-ring-low-contrast") || !ringTrace.faint.includes("focus-ring-thin") || !ringTrace.faintRing || ringTrace.faintRing.kind !== "outline" || !(ringTrace.faintRing.contrast < 3) || !/\d\.\d:1/.test(ringTrace.msg) ||
    !ringTrace.clipped.includes("focus-ring-clipped") || ringTrace.clipped.includes("focus-ring-low-contrast") || ringTrace.clipped.includes("focus-ring-thin") ||
    !ringTrace.borderRing || ringTrace.borderRing.kind !== "border" || ringTrace.border.length ||
    !ringTrace.faintRow || !/outline 1px/.test(ringTrace.badge) || ringTrace.fixCount < 2 || ringTrace.exported < 2 ||
    !/:focus-visible[\s\S]*outline: 3px solid #1a4480/.test(ringTrace.fixLow) || !/overflow: visible/.test(ringTrace.fixClip) || !/#ringClipBox/.test(ringTrace.fixClip) || !/3px/.test(ringTrace.fixThin) || !/four sides/.test(ringTrace.verify))
  errors.push("focus ring mismatch: " + JSON.stringify(ringTrace));
// keyboard auto-walk: focus every Tab stop in Tab order, summary line + structural findings in the focus log
const walk = await (async () => {
  const movesBefore = await panel.evaluate(() => srState.focus.log.filter((e) => e.kind !== "nav" && e.kind !== "walk").length);
  await panel.click("#srWalkBtn");
  await panel.waitForTimeout(4000);
  // the walk visits every Tab stop on the (growing) test page — wait for the button to come back rather than guessing a duration
  for (let i = 0; i < 100 && await panel.evaluate(() => document.getElementById("srWalkBtn").disabled); i++) await panel.waitForTimeout(250);
  const r = await panel.evaluate(() => {
    const w = srState.focus.walk;
    const entries = srState.focus.log.filter((e) => e.kind === "walk");
    const codes = [...new Set(entries.map((e) => e.issues[0].code))];
    const fixes = entries.map((e) => srFixFor(e.issues[0].code, { html: e.html, sel: e.sel, role: e.role, name: e.name, tag: e.tag, info: e.issues[0].info })).filter(Boolean).length;
    // custom widget keyboard probe: click-only tablists + click-only div role=button flagged, roving-tabindex tablist + keyboard-aware div clean
    const widgetEntries = entries.filter((e) => /^widget-/.test(e.issues[0].code));
    const widgetFlag = (...sels) => widgetEntries.filter((e) => sels.some((sel) => e.sel === sel || (e.sel || "").startsWith(sel + " ") || e.issues[0].msg.includes("(" + sel + ")"))).map((e) => e.issues[0].code);
    const badTabs = widgetFlag("#kbdBadTabs", "#kbdBadTab1", "#kbdBadTab2");
    const badFix = badTabs.length ? srFixFor("widget-no-arrow-nav", { html: "<div role=\"tablist\" id=\"kbdBadTabs\">", sel: "#kbdBadTabs", role: "tablist", tag: "div", info: "tablist" }) : null;
    const widgets = { probed: w && w.probed, results: w && w.widgets.length, flagged: widgetEntries.length, badTabs, fakeTabs: widgetFlag("#fakeTabs", "#tabA", "#tabB"),
      goodTabs: widgetFlag("#kbdGoodTabs", "#kbdGoodTab1", "#kbdGoodTab2"), goodBtn: widgetFlag("#kbdGoodBtn"), teamCard: widgetFlag("#teamCard"),
      okRadios: widgetFlag("#okRadios"), nativePopup: widgetFlag("#kbdNativePopup"), risky: widgetFlag("#kbdRisky"), lastTabs: widgetFlag("#kbdLastTabs", "#kbdLastTab1", "#kbdLastTab2"), escOnPopup: widgetFlag("#kbdEscOnPopup"),
      riskyFired: null, badFix: badFix && badFix.snippet, badNote: badFix && badFix.note, verify: A11yFixes.srVerifyStep("widget-no-arrow-nav", { info: "tablist" }),
      levels: [...new Set(widgetEntries.map((e) => e.issues[0].code + ":" + e.issues[0].level))].sort(), summaryHint: /custom widget|عنصر مخصّص/.test(document.getElementById("srWalkSummary").textContent) };
    return { summary: document.getElementById("srWalkSummary").textContent, hidden: document.getElementById("srWalkSummary").hidden, reached: w && w.reached, candidates: w && w.candidates,
      unreachable: w && w.unreachable.map((x) => `${x.sel} (${x.reason})`), jumps: w && w.jumps.length, traps: w && w.traps.length, entries: entries.length, codes, fixes, widgets,
      walkMoves: srState.focus.log.filter((e) => e.via === "walk").length, moves: srState.focus.log.filter((e) => e.kind !== "nav" && e.kind !== "walk").length,
      btn: document.getElementById("srWalkBtn").textContent, disabled: document.getElementById("srWalkBtn").disabled, rows: document.querySelectorAll("#srFocusLog .sr-row").length,
      stats: document.getElementById("srFocusStats").textContent, running: srState.focus.running, exported: srResultsForExport().focusTrace.issues.filter((x) => /unreachable|order jump|possible trap|custom widget/.test(x.issues.join(" "))).length };
  });
  const active = await target.evaluate(() => document.activeElement && document.activeElement.tagName);
  r.widgets.riskyFired = await target.evaluate(() => document.getElementById("kbdRisky").dataset.fired || null);
  return { movesBefore, ...r, active };
})();
console.log("auto-walk:", JSON.stringify(walk));
if (walk.hidden || !(walk.reached > 5) || walk.reached > walk.candidates || !/\d+/.test(walk.summary) || walk.disabled || !/Auto-walk|جولة/.test(walk.btn) || !walk.running ||
    walk.walkMoves < 5 || walk.moves <= walk.movesBefore || walk.entries !== (walk.unreachable.length + walk.jumps + walk.traps + walk.widgets.flagged) || walk.fixes !== walk.entries || walk.exported !== walk.entries) errors.push("auto-walk mismatch");
if (walk.entries && !walk.codes.every((c) => /^(unreachable|order-jump|possible-trap|widget-no-arrow-nav|widget-no-enter-space|widget-esc-no-close)$/.test(c))) errors.push("auto-walk codes mismatch");
// widget probe: the two click-only tablists and the click-only team card are hinted; the roving-tabindex tablist, the keyboard-aware picker and the native radiogroup are not
const wp = walk.widgets;
if (!(wp.probed >= 4) || !(wp.results >= 4) || !wp.summaryHint ||
    JSON.stringify(wp.badTabs) !== '["widget-no-arrow-nav"]' || JSON.stringify(wp.fakeTabs) !== '["widget-no-arrow-nav"]' || JSON.stringify(wp.teamCard) !== '["widget-no-enter-space"]' ||
    wp.goodTabs.length || wp.goodBtn.length || wp.okRadios.length || wp.nativePopup.length || wp.risky.length || wp.riskyFired || wp.lastTabs.length || wp.escOnPopup.length ||
    !wp.levels.includes("widget-no-arrow-nav:serious") || !wp.levels.includes("widget-no-enter-space:moderate") ||
    !/roving tabindex/.test(wp.badFix) || !/ArrowRight: i \+ 1/.test(wp.badFix) || !/aria-selected/.test(wp.badFix) || !/verify|real keyboard/.test(wp.badNote) || !/arrow keys/.test(wp.verify))
  errors.push("widget probe mismatch: " + JSON.stringify(wp));
await panel.click("#srFocusBtn"); await panel.click("#srLiveBtn"); await panel.waitForTimeout(500);
console.log("buttons after stop:", await panel.textContent("#srFocusBtn"), "/", await panel.textContent("#srLiveBtn"));
// the SPA clicks left a hash route and a title on the page; put the URL back so the per-URL storage keys below match target.url()
await target.evaluate(() => { history.replaceState(null, "", location.pathname); });
const liveStopped = await target.evaluate(() => ({ live: !!window.__a11yLive, pushWrapped: /onRoute|origPush/.test(String(history.pushState)) }));
if (liveStopped.live || liveStopped.pushWrapped) errors.push("live stop did not restore history.pushState: " + JSON.stringify(liveStopped));
// navigation with idle monitors drops the old page's live/focus logs (they must not be scored or stored under the new URL);
// "unknown" / non-page URLs never get a storage key; storeRemove is used to clear a snapshot
const navReset = await panel.evaluate(async () => {
  const before = { live: srState.live.log.length, focus: srState.focus.log.length, running: srState.live.running || srState.focus.running };
  const keptLive = srState.live.log.slice(), keptFocus = srState.focus.log.slice();
  srOnNavigated();
  await new Promise((r) => setTimeout(r, 400));
  const after = { live: srState.live.log.length, focus: srState.focus.log.length, liveRows: document.querySelectorAll("#srLiveLog .sr-log-row").length, focusRows: document.querySelectorAll("#srFocusLog .sr-log-row").length, url: srState.url };
  const hasData = srHasData();
  srState.live.log = keptLive; srState.focus.log = keptFocus; renderLiveLog(); renderFocusLog(); // put the logs back for the persistence checks below
  return { before, after, hasData };
});
console.log("nav reset:", JSON.stringify(navReset));
if (navReset.before.running || !navReset.before.live || !navReset.before.focus || navReset.after.live !== 0 || navReset.after.focus !== 0 || navReset.after.liveRows !== 0 || navReset.after.focusRows !== 0 || navReset.hasData || !navReset.after.url)
  errors.push("navigation log reset mismatch: " + JSON.stringify(navReset));
// rebuild the sections the rest of the run relies on
await panel.click("#srBuildBtn"); await panel.waitForTimeout(1500);
await panel.click("#srLangBtn"); await panel.waitForTimeout(800);
// 🎞 journey transcript: record a flow, focus something and fire a silent update on the page, stop → transcript at the top of the tab
const journey = await (async () => {
  const hiddenBefore = await panel.evaluate(() => { startFlow(); return document.getElementById("srJourneySection").hidden; });
  await panel.waitForTimeout(2500);
  await target.focus("button[aria-label='Submit form']"); await panel.waitForTimeout(300);
  await target.evaluate(() => { document.getElementById("silentOut").textContent = "Saved again (silently)"; }); await panel.waitForTimeout(1800);
  await panel.evaluate(() => stopFlow());
  await panel.waitForTimeout(1500);
  const r = await panel.evaluate(async () => {
    const j = srState.journey;
    const rows = [...document.querySelectorAll("#srJourneyList .sr-journey-step")];
    const clickable = rows.find((r) => r.dataset.srSel);
    if (clickable) clickable.click();
    document.getElementById("srJourneyCopyBtn").click();
    await new Promise((r) => setTimeout(r, 50));
    const exp = srResultsForExport().journey;
    return { hidden: document.getElementById("srJourneySection").hidden, steps: j ? j.steps.length : -1, gaps: j ? j.gaps.map((g) => g.kind) : null, pages: j && j.pages,
      rows: rows.length, navRows: rows.filter((r) => r.classList.contains("nav")).length, gapRows: rows.filter((r) => r.classList.contains("gap")).length,
      kinds: j ? [...new Set(j.steps.map((s) => s.kind))] : [], stats: document.getElementById("srJourneyStats").textContent, copyLabel: document.getElementById("srJourneyCopyBtn").textContent,
      text: srJourneyText(j), expSteps: exp && exp.steps.length, expGaps: exp && exp.gaps.length, htmlHas: srSectionHtml().includes("Journey transcript"),
      fullHtmlHas: toHtml(lastReport, null, null).includes("Journey transcript"), summary: document.querySelector("#srJourneySection > summary").textContent,
      flowStatus: document.getElementById("status").textContent, inOrder: j ? j.steps.every((s, i) => !i || s.t >= j.steps[i - 1].t) : false };
  });
  return { hiddenBefore, ...r };
})();
console.log("journey:", JSON.stringify({ ...journey, text: undefined }), "\nTRANSCRIPT:\n" + journey.text);
if (journey.hidden || journey.steps < 1 || journey.rows !== journey.steps || journey.navRows < 1 || !journey.kinds.includes("focus") || !journey.kinds.includes("silent") ||
    !journey.gaps.includes("silent") || journey.gapRows < 1 || !/\d/.test(journey.stats) || !/Copied|نُسخ/.test(journey.copyLabel) || journey.text.split("\n").length < journey.steps + 2 ||
    journey.expSteps !== journey.steps || journey.expGaps !== journey.gaps.length || !journey.htmlHas || !journey.fullHtmlHas || !/Journey transcript|نص الرحلة/.test(journey.summary) || !journey.inOrder ||
    !/Flow done/.test(journey.flowStatus)) errors.push("journey transcript mismatch");
// flow title parity: two hash routes recorded in one flow that share document.title → one "title never changes" finding in the live log, the journey and the score
const flowTitle = await (async () => {
  await target.evaluate(() => { document.title = "Same title on every page"; history.replaceState(null, "", "#/one"); });
  await panel.evaluate(() => startFlow());
  await panel.waitForTimeout(2500); // first scan labels #/one
  await target.evaluate(() => { history.pushState(null, "", "#/two"); document.getElementById("app").innerHTML = "<h1>Home</h1><p>Second state, same title.</p>"; });
  await panel.evaluate(() => flowScanOnce()); await panel.waitForTimeout(2500);
  await panel.evaluate(() => stopFlow()); await panel.waitForTimeout(1500);
  const r = await panel.evaluate(() => {
    const e = srState.live.log.find((x) => x.kind === "route" && x.flow); const j = srState.journey;
    const row = [...document.querySelectorAll("#srLiveLog .sr-log-row")].find((r) => r.dataset.srCodes === "route-title-stale" && !r.querySelector(".sr-route-detail"));
    return { found: !!e, text: e && e.text, pages: e && e.pages, jPages: j.pages, gap: j.gaps.filter((g) => g.kind === "route-title-stale").length, step: j.steps.some((s) => s.kind === "route" && /title never|العنوان لا يتغير/.test(s.text)),
      row: !!row, rowFix: !!(row && row.querySelector(".sr-fix")),
      scored: (() => { const p1 = srScoreCompute().penalty; const i = srState.live.log.indexOf(e); srState.live.log.splice(i, 1); const p0 = srScoreCompute().penalty; srState.live.log.splice(i, 0, e); return p1 - p0; })(), none: flowTitleFinding([{ label: "/a", title: "A" }, { label: "/b", title: "B" }], Date.now()),
      one: flowTitleFinding([{ label: "/a", title: "X" }], Date.now()), transcript: srJourneyText(j).includes(e ? e.text : "@@") };
  });
  await target.evaluate(() => { history.replaceState(null, "", location.pathname); });
  return r;
})();
console.log("flow title parity:", JSON.stringify(flowTitle));
if (!flowTitle.found || !/Same title on every page/.test(flowTitle.text) || !(flowTitle.pages && flowTitle.pages.length === 2) || flowTitle.jPages.length !== 2 || flowTitle.gap !== 1 || !flowTitle.step ||
    !flowTitle.row || !flowTitle.rowFix || flowTitle.scored !== 5 || flowTitle.none !== null || flowTitle.one !== null || !flowTitle.transcript) errors.push("flow title parity mismatch: " + JSON.stringify(flowTitle));
await panel.click("#srAxSection > summary"); await panel.click("#srAxBtn"); await panel.waitForTimeout(3000);
console.log("ax stats:", await panel.textContent("#srAxStats"));
const axGrp = await panel.evaluate(() => { const g = srGroupRows(srState.ax ? srState.ax.rows : []).filter((x) => x.count > 1); return g.map((x) => `${srGroupLabel(x)} ×${x.count} (${x.row.tag}.${x.row.cls})`); });
console.log("ax groups:", axGrp);
if (!axGrp.some((x) => /aegov-card · link ×3/.test(x))) errors.push("browser tree grouping mismatch");
// scan with SR rules on, then exports (Run is view-scoped: switch to the Automated tab first)
await panel.click("#tabs button[data-view='auto']");
await panel.click("#scanBtn"); await panel.waitForTimeout(4000);
console.log("scan status:", await panel.textContent("#status"));
const exp = await panel.evaluate(() => {
  const r = srResultsForExport();
  const html = srSectionHtml();
  return { keys: Object.keys(r).filter((k) => r[k]), htmlLen: html.length, ruleSet: lastReport && lastReport.ruleSet,
    violations: lastReport && lastReport.violations.map((v) => v.id).filter((id) => /mismatch|p-as-heading|fake-caption|td-has-header|focus-order/.test(id)),
    fullHtml: toHtml(lastReport, null, null).length };
});
console.log("export:", exp);
// best practices on by default: heading-order fires on the h3-before-h1 fixture and the card carries a "best practice" pill; strict WCAG rules do not
const bp = await panel.evaluate(() => {
  const ho = lastReport.violations.find((v) => v.id === "heading-order");
  const card = ho && [...document.querySelectorAll("#results details.violation")].find((d) => d.dataset.search.startsWith("heading-order "));
  const bpCards = [...document.querySelectorAll("#results details.violation")].filter((d) => d.querySelector(".pill.bp"));
  const strictWithPill = [...document.querySelectorAll("#results details.violation")].filter((d) => d.querySelector(".pill.bp") && !/best-practice/.test(d.dataset.search));
  const box = document.getElementById("filterInput"); box.value = "best-practice"; box.dispatchEvent(new Event("input"));
  const filtered = document.querySelectorAll("#results details.violation:not([hidden])").length;
  box.value = ""; box.dispatchEvent(new Event("input"));
  return { hasHeadingOrder: !!ho, tags: ho && ho.tags, pill: card && card.querySelector(".pill.bp")?.textContent, bpCards: bpCards.length, strictWithPill: strictWithPill.length, filtered,
    label: document.getElementById("scanSettingsLabel").textContent, ruleSet: lastReport.ruleSet };
});
console.log("best practice default:", JSON.stringify(bp));
if (!bp.hasHeadingOrder || !(bp.tags || []).includes("best-practice") || !bp.pill || bp.bpCards < 1 || bp.strictWithPill !== 0 || bp.filtered !== bp.bpCards || !/best practices/.test(bp.ruleSet) ||
    bp.label !== (process.argv[2] === "ar" ? "الموصى به" : "Recommended")) errors.push("best-practice default mismatch: " + JSON.stringify(bp));
// presets: Strict clears both checkboxes, Everything selects all rules, a manual tweak shows the combination, Recommended restores the default; each persists
const presets = await panel.evaluate(async () => {
  const state = () => [levelSelect.value, bestPractice.checked, srRulesChk.checked, document.getElementById("scanSettingsLabel").textContent,
    [...document.querySelectorAll("#presetRow .btn.preset")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.preset).join()].join("|");
  const out = { before: state() };
  document.getElementById("presetStrict").click(); await new Promise((r) => setTimeout(r, 50)); out.strict = state();
  document.getElementById("presetAll").click(); await new Promise((r) => setTimeout(r, 50)); out.all = state();
  bestPractice.checked = false; bestPractice.dispatchEvent(new Event("change")); out.custom = state();
  document.getElementById("presetRecommended").click(); await new Promise((r) => setTimeout(r, 50)); out.recommended = state();
  return out;
});
console.log("presets:", JSON.stringify(presets), "| persisted:", settings.level, settings.bestPractice, settings.srRules);
{
  const ar = process.argv[2] === "ar";
  const exp = { strict: "wcag22aa|false|false|" + (ar ? "WCAG فقط (صارم)" : "Strict WCAG only") + "|strict", all: "all|true|true|" + (ar ? "كل القواعد" : "Everything") + "|all",
    custom: "all|false|true|" + (ar ? "كل القواعد + قارئ الشاشة" : "All rules + SR") + "|", recommended: "wcag22aa|true|true|" + (ar ? "الموصى به" : "Recommended") + "|recommended" };
  for (const k of Object.keys(exp)) if (presets[k] !== exp[k]) errors.push(`preset ${k}: got ${presets[k]}, want ${exp[k]}`);
  if (presets.before !== exp.recommended || settings.level !== "wcag22aa" || settings.bestPractice !== true || settings.srRules !== true) errors.push("preset persistence mismatch: " + JSON.stringify(presets));
}
console.log("history srScore:", store["history:" + (await target.url())]?.runs?.map((r) => r.srScore),
  "| legend after 2nd scan:", await (async () => { await panel.click("#scanBtn"); await panel.waitForTimeout(4000); return panel.textContent("#historyLegend"); })());
if (!/🔊/.test(await panel.textContent("#historyLegend"))) errors.push("history legend lacks SR score");
// persisted per URL: reload the panel, reopen the tab → reading-order stats, logs and score come back with a "restored from" note
const srKey = Object.keys(store).find((k) => k.startsWith("sr:"));
if (srKey !== "sr:" + (await target.url()) || store["sr:unknown"] !== undefined) errors.push("persisted key must be the page URL, got " + srKey);
console.log("persisted key:", srKey, "| live:", store[srKey]?.live?.length, "| focus:", store[srKey]?.focus?.length, "| score:", store[srKey]?.score?.score);
if (!srKey || !store[srKey] || !store[srKey].order || !store[srKey].score || !(store[srKey].live.length > 0) || !(store[srKey].focus.length > 0) ||
    store[srKey].live.length > 200 || store[srKey].focus.length > 200) errors.push("persisted snapshot mismatch");
const statsBefore = await panel.textContent("#srOrderStats");
await panel.reload(); await panel.waitForTimeout(400);
await panel.click("#tabs button[data-view='sr']"); await panel.waitForTimeout(500);
const restored = await panel.evaluate(() => ({ stats: document.getElementById("srOrderStats").textContent, note: document.querySelector("#srOrderStats .sr-restored")?.textContent,
  live: srState.live.log.length, focus: srState.focus.log.length, liveRows: document.querySelectorAll("#srLiveLog .sr-log-row").length, focusRows: document.querySelectorAll("#srFocusLog .sr-row").length,
  score: document.querySelector("#srScoreCard .sr-score-num")?.firstChild.textContent, cardNote: document.querySelector("#srScoreCard .sr-restored")?.textContent,
  badge: document.querySelector("#tabs button[data-view='sr']").textContent, order: srState.order }));
console.log("restored after reload:", JSON.stringify(restored), "| before:", statsBefore);
if (!restored.note || !/\d/.test(restored.stats) || !restored.stats.startsWith(statsBefore.split(" · restored")[0].slice(0, 20)) || !restored.live || !restored.focus || !restored.liveRows || !restored.focusRows ||
    String(store[srKey].score.score) !== restored.score || !restored.cardNote || !/\d+/.test(restored.badge) || restored.order !== null) errors.push("restore after reload mismatch");
await panel.click("#resetBtn"); await panel.waitForTimeout(300);
console.log("storage after reset:", store[srKey]);
if (store[srKey]) errors.push("reset did not clear the persisted snapshot");
console.log("after reset stats empty:", (await panel.textContent("#srOrderStats")) === "", "| score card hidden:", await panel.evaluate(() => document.getElementById("srScoreCard").hidden));
// Full audit in "both" mode must run the DLS check too (regression: runDlsCheck bailed on the in-flight flag runAll had just set)
await panel.evaluate(() => { showView("overview"); modeSelect.value = "both"; modeSelect.dispatchEvent(new Event("change")); });
await panel.click("#runAllBtn"); await panel.waitForTimeout(8000);
const full = await panel.evaluate(() => ({ dlsCard: document.querySelector(".ov-card[data-audit='dls']").dataset.state, dlsScore: document.getElementById("dlsScoreLine").textContent,
  dlsExport: !!lastDlsExport, status: document.getElementById("status").textContent, modeTitle: modeSelect.title, topPills: [...document.querySelectorAll("#ovTopList .sr-weight")].map((w) => w.textContent) }));
console.log("full audit:", JSON.stringify(full));
if (full.dlsCard !== "done" || !full.dlsScore || !full.dlsExport) errors.push("full audit did not run the DLS check");
if (full.status !== (process.argv[2] === "ar" ? "اكتمل التدقيق الكامل — الملخص في تبويب النظرة العامة." : "Full audit done — summary on the Overview tab.")) errors.push("full audit status mismatch: " + full.status);
if (!full.modeTitle.includes(process.argv[2] === "ar" ? "نظام التصميم" : "DLS")) errors.push("mode select title must name the selected mode: " + full.modeTitle);
if (full.topPills.some((p) => /^[−-]\d/.test(p))) errors.push("overview top-list must not show negative penalty pills");
// DLS toolbar: filter + Highlight all gaps + Clear appear once a report exists; the old bottom "Highlight gaps" button is gone
const dlsTb = await panel.evaluate(async (q) => {
  showView("dls");
  const box = document.getElementById("dlsFilterInput");
  const all = document.querySelectorAll("#dlsReport .dls-row[data-verdict]").length;
  const vis = (id) => { const el = document.getElementById(id); return !el.hidden && el.offsetParent !== null; };
  const visible = { filter: vis("dlsFilterRow"), highlight: vis("dlsHighlightAllBtn"), clear: vis("dlsClearBtn") };
  box.value = q; box.dispatchEvent(new Event("input"));
  const shown = document.querySelectorAll("#dlsReport .dls-row[data-verdict]:not([hidden])").length;
  const count = document.getElementById("dlsFilterCount").textContent;
  box.value = "fail"; box.dispatchEvent(new Event("input"));
  const fails = document.querySelectorAll("#dlsReport .dls-row[data-verdict]:not([hidden])").length;
  const failsOk = [...document.querySelectorAll("#dlsReport .dls-row[data-verdict]:not([hidden])")].every((r) => r.dataset.verdict === "fail");
  box.value = ""; box.dispatchEvent(new Event("input"));
  const restored = document.querySelectorAll("#dlsReport .dls-row[data-verdict]:not([hidden])").length;
  document.getElementById("dlsHighlightAllBtn").click();
  await new Promise((r) => setTimeout(r, 200));
  return { all, visible, shown, count, fails, failsOk, restored, bottomBtns: [...document.querySelectorAll("#dlsReport .btn-row .btn")].map((b) => b.textContent.trim()),
    status: document.getElementById("status").textContent, label: document.getElementById("dlsHighlightAllBtn").textContent.trim() };
}, process.argv[2] === "ar" ? "خط" : "font");
console.log("dls toolbar:", JSON.stringify(dlsTb), "| dlsHighlight calls:", dlsHighlightCalls);
if (!dlsTb.all || !dlsTb.visible.filter || !dlsTb.visible.highlight || !dlsTb.visible.clear || !dlsTb.shown || dlsTb.shown >= dlsTb.all ||
    !new RegExp("\\b" + dlsTb.shown + "\\b.*\\b" + dlsTb.all + "\\b").test(dlsTb.count) || !dlsTb.fails || !dlsTb.failsOk || dlsTb.restored !== dlsTb.all ||
    dlsTb.bottomBtns.length !== 2 || dlsHighlightCalls < 1 || !/\d/.test(dlsTb.status) || !/Highlight all gaps|تظليل كل الفجوات/.test(dlsTb.label)) errors.push("dls toolbar mismatch: " + JSON.stringify(dlsTb));
// Manual tests: the filter box narrows cards by title / WCAG ref / question / finding text
await panel.click("#tabs button[data-view='manual']"); await panel.waitForTimeout(300);
const manualFilter = await panel.evaluate((q) => {
  const box = document.getElementById("manualFilterInput");
  const all = document.querySelectorAll("#manualList .mtest").length;
  box.value = "2.4.7"; box.dispatchEvent(new Event("input"));
  const byRef = document.querySelectorAll("#manualList .mtest:not([hidden])").length;
  const count = document.getElementById("manualFilterCount").textContent;
  box.value = q; box.dispatchEvent(new Event("input")); // question text (localized)
  const byQuestion = document.querySelectorAll("#manualList .mtest:not([hidden])").length;
  box.value = ""; box.dispatchEvent(new Event("input"));
  return { all, byRef, count, byQuestion, restored: document.querySelectorAll("#manualList .mtest:not([hidden])").length, placeholder: box.placeholder };
}, process.argv[2] === "ar" ? "فخ لوحة مفاتيح" : "keyboard trap");
console.log("manual filter:", JSON.stringify(manualFilter));
if (!manualFilter.all || manualFilter.byRef !== 1 || !new RegExp("\\b1\\b.*\\b" + manualFilter.all + "\\b").test(manualFilter.count) || !manualFilter.byQuestion || manualFilter.byQuestion >= manualFilter.all ||
    manualFilter.restored !== manualFilter.all || !manualFilter.placeholder) errors.push("manual filter mismatch: " + JSON.stringify(manualFilter));
console.log("help has SR topic:", (await panel.evaluate(() => { showView("help"); return document.body.innerText; })).includes(process.argv[2] === "ar" ? "تبويب قارئ الشاشة" : "Screen reader tab"));
console.log("ERRORS:", errors);
await browser.close();
if (errors.length) process.exit(1);
