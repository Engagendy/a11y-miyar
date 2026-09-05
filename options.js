// Options page runs in a normal extension context, so EXT.storage is available directly.
// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
// Matches DEFAULT_SETTINGS in background.js ("Recommended" preset: 2.2 AA + best practices + SR rules).
const DEFAULTS = { level: "wcag22aa", bestPractice: true, flowInterval: 4, lang: "en", framework: "html", dlsContrast: false, srRules: true };

const levelEl = document.getElementById("level");
const bpEl = document.getElementById("bestPractice");
const intervalEl = document.getElementById("flowInterval");
const langEl = document.getElementById("lang");
const frameworkEl = document.getElementById("framework");
const dlsContrastEl = document.getElementById("dlsContrast");
const srRulesEl = document.getElementById("srRules");
const axGrantEl = document.getElementById("axGrant");
const axRevokeEl = document.getElementById("axRevoke");
const axHintEl = document.getElementById("axHint");
const aiKeyEl = document.getElementById("aiKey");
const aiModelEl = document.getElementById("aiModel");
const savedEl = document.getElementById("saved");

// Same one-time migration as background.js: flip bestPractice on once, then respect the stored value.
async function storedSettings() {
  const stored = await EXT.storage.sync.get("settings");
  const s = stored.settings || {};
  if (s.bpMigrated) return s;
  const next = { ...s, bestPractice: true, bpMigrated: true };
  await EXT.storage.sync.set({ settings: next });
  return next;
}

async function load() {
  const s = { ...DEFAULTS, ...(await storedSettings()) };
  levelEl.value = s.level;
  bpEl.checked = s.bestPractice;
  intervalEl.value = s.flowInterval;
  langEl.value = s.lang;
  frameworkEl.value = s.framework;
  dlsContrastEl.checked = !!s.dlsContrast;
  srRulesEl.checked = !!s.srRules;
  document.documentElement.dir = s.lang === "ar" ? "rtl" : "ltr";
  // API key stays in local storage — never sync a key across devices.
  const local = await EXT.storage.local.get(["aiKey", "aiModel"]);
  aiKeyEl.value = local.aiKey || "";
  aiModelEl.value = local.aiModel || "claude-opus-4-8";
}

function flashSaved() {
  savedEl.classList.add("show");
  setTimeout(() => savedEl.classList.remove("show"), 1500);
}

async function save() {
  // Merge over the stored object so panel-only keys (mode, compact, srRate, bpMigrated) survive.
  const settings = {
    ...(await storedSettings()),
    level: levelEl.value,
    bestPractice: bpEl.checked,
    flowInterval: Math.min(Math.max(parseInt(intervalEl.value, 10) || 4, 2), 30),
    lang: langEl.value,
    framework: frameworkEl.value,
    dlsContrast: dlsContrastEl.checked,
    srRules: srRulesEl.checked,
  };
  await EXT.storage.sync.set({ settings });
  document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
  flashSaved();
}

async function saveAi() {
  await EXT.storage.local.set({ aiKey: aiKeyEl.value.trim(), aiModel: aiModelEl.value });
  flashSaved();
}

for (const el of [levelEl, bpEl, intervalEl, langEl, frameworkEl, dlsContrastEl, srRulesEl]) el.addEventListener("change", save);

// Browser accessibility tree: the debugger permission must be requested from a user gesture
// in an extension page — the DevTools panel cannot do it, so it lives here.
async function refreshAxPermission() {
  if (!EXT.permissions || !EXT.debugger) {
    axGrantEl.disabled = true;
    axGrantEl.textContent = "Not available in this browser";
    axHintEl.textContent = "The browser accessibility tree and the reflow test use chrome.debugger, which Firefox does not provide.";
    return;
  }
  const has = await EXT.permissions.contains({ permissions: ["debugger"] });
  axGrantEl.hidden = has;
  axRevokeEl.hidden = !has;
}
axGrantEl.addEventListener("click", async () => {
  try { await EXT.permissions.request({ permissions: ["debugger"] }); } catch (_) {}
  refreshAxPermission();
});
axRevokeEl.addEventListener("click", async () => {
  try { await EXT.permissions.remove({ permissions: ["debugger"] }); } catch (_) {}
  refreshAxPermission();
});
refreshAxPermission();
for (const el of [aiKeyEl, aiModelEl]) el.addEventListener("change", saveAi);
load();
