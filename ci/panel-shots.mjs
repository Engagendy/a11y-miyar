// Screenshots of the panel in typical states, for visual review (9 states):
//   1-initial (Overview first-run hero), 2-after-scan (Automated), 3-sr-empty, 4-sr-order,
//   5-manual, 6-dls (report), 8-overview (after everything ran), 9-export-menu (open Export menu),
//   7-narrow (700px, Automated), 14-scan-settings (presets popover open over the Automated tab), 16-sr-ntc (non-text contrast rows), 17-sr-group-label (form group labelling rows).
//   cd ci && node panel-shots.mjs [en|ar] [light|dark] [outDir]
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

let settings = { level: "wcag22aa", bestPractice: true, flowInterval: 4, lang: process.argv[2] || "en", framework: "html", mode: "a11y", dlsContrast: false, srRules: true };
const store = {};
const highlightAllCalls = []; // item counts sent by the ×N badge (must cover every instance)
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
  dlsCheck: () => inPage(() => dlsCheckInPage(DLS_DATA)), dlsComponents: () => inPage(() => dlsComponentAuditInPage(DLS_DATA)), dlsHighlight: async () => 0,
  srApply: (m) => target.evaluate(([s, p]) => srApplyInPage(s, p), [m.selector, m.patch]), srUndo: (m) => target.evaluate((s) => srUndoInPage(s), m.selector),
  highlight: async () => true, highlightAll: async (m) => { highlightAllCalls.push((m.items || []).length); return true; }, clearHighlights: async () => true, staleInstall: async () => true, staleCheck: async () => false, domCount: async () => 50,
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
      setTimeout(() => { fakeSynth.speaking = false; u.onend && u.onend({}); }, 20); },
    cancel() { fakeSynth.speaking = false; },
    getVoices() { return [{ name: "Fake EN", lang: "en-US", default: true, localService: true }, { name: "Fake AR", lang: "ar-SA", default: false, localService: true }]; },
    addEventListener() {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: fakeSynth, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; this.lang = ""; this.rate = 1; this.voice = null; } };
}, target.url());
const variant = process.argv[3] || "light"; // light | dark
const outDir = process.argv[4] || "/tmp";
if (variant === "dark") await panel.emulateMedia({ colorScheme: "dark" });
await panel.goto("file://" + root + "/panel.html");
await panel.setViewportSize({ width: 1100, height: 700 });
const shot = (name) => panel.screenshot({ path: `${outDir}/ui-${name}-${settings.lang}-${variant}.png`, fullPage: false });
await panel.waitForTimeout(400);
await shot("1-initial");
await panel.click("#tabs button[data-view='auto']"); await panel.waitForTimeout(200);
await panel.click("#scanBtn"); await panel.waitForTimeout(4000);
await shot("2-after-scan");
// scan presets: open the Scan settings popover (Recommended pressed, "best practice" pills visible on the cards behind)
await panel.evaluate(() => { document.getElementById("scanSettings").open = true; }); await panel.waitForTimeout(150);
await shot("14-scan-settings");
await panel.evaluate(() => { document.getElementById("scanSettings").open = false; });
await panel.click("#tabs button[data-view='sr']"); await panel.waitForTimeout(300);
await shot("3-sr-empty");
await panel.click("#srBuildBtn"); await panel.waitForTimeout(1500);
await shot("4-sr-order");
// missing state on custom controls: reading-order rows filtered to the new codes, first fix open
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = "state-missing"; b.dispatchEvent(new Event("input"));
  const row = [...document.querySelectorAll("#srOrderList .sr-row:not([hidden])")].find((r) => r.dataset.srSel === "#tabB"); const d = row && row.querySelector("details"); if (d) d.open = true; row && row.scrollIntoView(); });
await panel.waitForTimeout(200);
await shot("11-sr-state-order");
// link behaviour: new-tab / download / external / href="#" rows, the breadcrumb "current" fix open
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = "link-"; b.dispatchEvent(new Event("input"));
  const row = [...document.querySelectorAll("#srOrderList .sr-row:not([hidden])")].find((r) => r.dataset.srSel === "#crumbCurrent"); const d = row && row.querySelector("details"); if (d) d.open = true; row && row.scrollIntoView(); });
await panel.waitForTimeout(200);
await shot("13-sr-link-order");
// form group labelling: unlabelled checkbox group, question + Yes/No, label not linked — the group fix open
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = "-label"; b.dispatchEvent(new Event("input"));
  const row = [...document.querySelectorAll("#srOrderList .sr-row:not([hidden])")].find((r) => r.dataset.srSel === "#filterGroup"); const d = row && row.querySelector("details"); if (d) d.open = true; row && row.scrollIntoView(); });
await panel.waitForTimeout(200);
await shot("17-sr-group-label");
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = ""; b.dispatchEvent(new Event("input")); window.scrollTo(0, 0); });
// live monitor + SPA route-change rows: silent "Services" route, announced "Contact" route
await panel.evaluate(() => { document.getElementById("srOrderSection").open = false; document.getElementById("srLiveSection").open = true; });
await panel.click("#srLiveBtn"); await panel.waitForTimeout(1800);
await target.click("#spaBad"); await panel.waitForTimeout(2600);
await target.click("#spaGood"); await panel.waitForTimeout(2600);
await panel.evaluate(() => { document.getElementById("srLiveSection").scrollIntoView(); });
await shot("10-sr-live-route");
// state-not-announced: card toggling .selected, tab strip moving "active", expander revealing its sibling
await target.click("#teamCard"); await target.click("#tabB"); await target.click("#expander"); await panel.waitForTimeout(2500);
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = "state-not-announced"; b.dispatchEvent(new Event("input"));
  const row = document.querySelector("#srLiveLog .sr-log-row:not([hidden])"); const d = row && row.querySelector("details"); if (d) d.open = true; document.getElementById("srLiveSection").scrollIntoView(); });
await panel.waitForTimeout(200);
await shot("12-sr-state-live");
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = ""; b.dispatchEvent(new Event("input")); });
await panel.click("#srLiveBtn"); await panel.waitForTimeout(300);
// focus trace: focus-ring contrast / thickness / clipping rows with the ring badge and the first fix open
await panel.evaluate(() => { document.getElementById("srLiveSection").open = false; document.getElementById("srFocusSection").open = true; });
await panel.click("#srFocusBtn"); await panel.waitForTimeout(300);
await target.keyboard.press("Shift");
for (const id of ["ringFaint", "ringClipped"]) { await target.evaluate((i) => document.getElementById(i).focus(), id); await target.waitForTimeout(150); }
await panel.waitForTimeout(1200);
await panel.evaluate(() => { const row = [...document.querySelectorAll("#srFocusLog .sr-row")].find((r) => r.dataset.srSel === "#ringFaint"); const d = row && row.querySelector("details"); if (d) d.open = true; document.getElementById("srFocusSection").scrollIntoView(); });
await shot("15-sr-focus-ring");
// custom widget keyboard probe: auto-walk, then the widget-* rows with the roving-tabindex fix open
await panel.click("#srWalkBtn"); await panel.waitForTimeout(3000);
for (let i = 0; i < 100 && await panel.evaluate(() => document.getElementById("srWalkBtn").disabled); i++) await panel.waitForTimeout(250);
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = "widget-"; b.dispatchEvent(new Event("input"));
  const row = [...document.querySelectorAll("#srFocusLog .sr-row:not([hidden])")].find((r) => r.dataset.srSel === "#kbdBadTab1"); const d = row && row.querySelector("details"); if (d) d.open = true; document.getElementById("srWalkSummary").scrollIntoView(); });
await panel.waitForTimeout(200);
await shot("18-sr-widget-probe");
await panel.evaluate(() => { const b = document.getElementById("srFilterInput"); b.value = ""; b.dispatchEvent(new Event("input")); });
await panel.click("#srFocusBtn"); await panel.waitForTimeout(300);
// non-text contrast: the three failing fixtures with swatches, the first fix open
await panel.evaluate(() => { document.getElementById("srFocusSection").open = false; document.getElementById("srNtcSection").open = true; });
await panel.click("#srNtcBtn"); await panel.waitForTimeout(800);
await panel.evaluate(() => { const d = document.querySelector("#srNtcList .sr-row details"); if (d) d.open = true; document.getElementById("srNtcSection").scrollIntoView(); });
await shot("16-sr-ntc");
await panel.click("#tabs button[data-view='manual']"); await panel.waitForTimeout(300);
await shot("5-manual");
await panel.click("#tabs button[data-view='dls']"); await panel.click("#dlsBtn"); await panel.waitForTimeout(1500);
await shot("6-dls");
await panel.click("#tabs button[data-view='overview']"); await panel.waitForTimeout(300);
await shot("8-overview");
await panel.evaluate(() => { document.getElementById("exportGroup").open = true; });
await panel.waitForTimeout(150);
await shot("9-export-menu");
await panel.evaluate(() => { document.getElementById("exportGroup").open = false; });
await panel.setViewportSize({ width: 700, height: 600 });
await panel.click("#tabs button[data-view='auto']"); await panel.waitForTimeout(300);
await shot("7-narrow");
await browser.close();
