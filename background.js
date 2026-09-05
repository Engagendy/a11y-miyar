// A11y Miyar background service worker.
// DevTools panel pages cannot use EXT.scripting or EXT.storage directly —
// the panel sends {op, tabId, ...} messages here and this worker does the work.

// Works on Chromium (chrome.*) and Firefox (browser.*, promise-based).
const EXT = globalThis.browser || globalThis.chrome;
// UAE Design System (AEGov DLS) tokens, generated from @aegov/design-system@3.0.7
// (OKLCH tokens converted to sRGB hex). Do not edit by hand.
const DLS_DATA = {"version":"3.0.7","colors":{"#f9f7ed":"aegold-50","#f2eccf":"aegold-100","#e6d7a2":"aegold-200","#d7bc6d":"aegold-300","#cba344":"aegold-400","#b68a35":"aegold-500","#92722a":"aegold-600","#7c5e24":"aegold-700","#6c4527":"aegold-800","#5d3b26":"aegold-900","#361e12":"aegold-950","#fef2f2":"aered-50","#fde4e3":"aered-100","#fdcdcb":"aered-200","#faaaa7":"aered-300","#f47a75":"aered-400","#ea4f49":"aered-500","#d83731":"aered-600","#b52520":"aered-700","#95231f":"aered-800","#7c2320":"aered-900","#430e0c":"aered-950","#f3faf4":"aegreen-50","#e4f4e7":"aegreen-100","#cae8cf":"aegreen-200","#a0d5ab":"aegreen-300","#6fb97f":"aegreen-400","#4a9d5c":"aegreen-500","#3f8e50":"aegreen-600","#2f663c":"aegreen-700","#2a5133":"aegreen-800","#24432b":"aegreen-900","#0f2415":"aegreen-950","#f7f7f7":"aeblack-50","#e1e3e5":"aeblack-100","#c3c6cb":"aeblack-200","#9ea2a9":"aeblack-300","#797e86":"aeblack-400","#5f646d":"aeblack-500","#4b4f58":"aeblack-600","#3e4046":"aeblack-700","#232528":"aeblack-800","#1b1d21":"aeblack-900","#0e0f12":"aeblack-950","#ffffff":"whitely-50","#fcfcfc":"whitely-100","#f2f2f2":"whitely-300","#ededed":"whitely-400","#e8e8e8":"whitely-500","#fffbeb":"camel-50","#fdf4c8":"camel-100","#fbe68c":"camel-200","#fad44f":"camel-300","#f8c027":"camel-400","#f29f10":"camel-500","#d67907":"camel-600","#b2550a":"camel-700","#904111":"camel-800","#773610":"camel-900","#441b04":"camel-950","#f8fafc":"slate-50","#f1f5f9":"slate-100","#e2e8f0":"slate-200","#cbd5e1":"slate-300","#94a3b8":"slate-400","#64748b":"slate-500","#475569":"slate-600","#334155":"slate-700","#1e293b":"slate-800","#0f172a":"slate-900","#020617":"slate-950","#fdf4ff":"fuchsia-50","#fae8ff":"fuchsia-100","#f5d0fe":"fuchsia-200","#f0abfc":"fuchsia-300","#e879f9":"fuchsia-400","#d946ef":"fuchsia-500","#c026d3":"fuchsia-600","#a21caf":"fuchsia-700","#86198f":"fuchsia-800","#701a75":"fuchsia-900","#4a044e":"fuchsia-950","#e7f5ff":"techblue-50","#d3edff":"techblue-100","#b0dbff":"techblue-200","#81c1ff":"techblue-300","#4f98ff":"techblue-400","#296cff":"techblue-500","#043dff":"techblue-600","#003cff":"techblue-700","#002dc2":"techblue-800","#0b32a4":"techblue-900","#071c5f":"techblue-950","#effaff":"seablue-50","#def3ff":"seablue-100","#b6eaff":"seablue-200","#76dbff":"seablue-300","#2bcaff":"seablue-400","#00abeb":"seablue-500","#0190d4":"seablue-600","#0173ab":"seablue-700","#00608d":"seablue-800","#065074":"seablue-900","#04334d":"seablue-950","#fef5ee":"desert-50","#fce9d8":"desert-100","#f9cfaf":"desert-200","#f5ac7c":"desert-300","#ef8048":"desert-400","#eb5f24":"desert-500","#e54b1d":"desert-600","#b73417":"desert-700","#922b1a":"desert-800","#762518":"desert-900","#3f100b":"desert-950"},"fonts":{"en":{"body":["roboto"],"heading":["inter"]},"ar":{"body":["noto kufi arabic","notokufi"],"heading":["alexandria"]}},"components":["aegov-accordion","aegov-alert","aegov-avatar","aegov-backdrop","aegov-badge","aegov-banner","aegov-breadcrumb","aegov-btn","aegov-card","aegov-card-group","aegov-check-group","aegov-check-item","aegov-dropdown","aegov-footer","aegov-form-control","aegov-header","aegov-hero","aegov-hero-static","aegov-link","aegov-modal","aegov-modal-backdrop","aegov-modal-close","aegov-pagination","aegov-popover","aegov-quote","aegov-step","aegov-step-title","aegov-tab","aegov-toast","aegov-toggle","aegov-tooltip"],"button":{"heights":[32,40,48,52],"tolerance":2},"typo":{"headingSizes":[76,62,48,40,32,26,20],"headingWeights":[200,600,700,800],"bodyWeights":[300,400,500,600,700],"minBody":16,"minLineRatio":1.5}};

/* ---------- functions injected into the inspected page ---------- */

function runAxeInPage(runOnlyArg, rulesArg) {
  const options = { resultTypes: ["violations", "passes"] };
  if (runOnlyArg) options.runOnly = runOnlyArg;
  // Per-rule enable overrides tag filtering (axe ruleShouldRun) — used for the
  // screen-reader experimental rules that axe ships disabled by default.
  if (rulesArg && Object.keys(rulesArg).length) options.rules = rulesArg;
  return window.axe.run(document, options).then((r) => ({
    url: location.href,
    title: document.title,
    frames: document.querySelectorAll("iframe").length,
    passes: r.passes.length,
    violations: r.violations.map((v) => ({
      id: v.id,
      impact: v.impact || "minor",
      tags: (v.tags || []).filter((tg) => tg === "best-practice" || tg === "experimental"),
      help: v.help,
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.slice(0, 50).map((n) => ({
        target: n.target.map((t) => (Array.isArray(t) ? t.join(" >>> ") : String(t))),
        html: n.html.slice(0, 300),
        failureSummary: n.failureSummary || "",
      })),
      nodeTotal: v.nodes.length,
    })),
  }));
}

function highlightInPage(sel) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  document.querySelectorAll(".__a11y_lens_highlight").forEach((el) => {
    el.classList.remove("__a11y_lens_highlight");
  });
  if (!document.getElementById("__a11y_lens_style")) {
    const style = document.createElement("style");
    style.id = "__a11y_lens_style";
    style.textContent = `.__a11y_lens_highlight {
      outline: 3px solid #d32f2f !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 6px rgba(211,47,47,.25) !important;
    }`;
    document.documentElement.appendChild(style);
  }
  const el = deepQ(sel);
  if (el) {
    el.classList.add("__a11y_lens_highlight");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function highlightAllInPage(list) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const colors = { critical: "#d32f2f", serious: "#e65100", moderate: "#f9a825", minor: "#616161" };
  document.querySelectorAll("[data-a11y-lens]").forEach((el) => {
    el.removeAttribute("data-a11y-lens");
    el.style.removeProperty("outline");
    el.style.removeProperty("outline-offset");
  });
  const rank = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const best = new Map();
  for (const { sel, impact } of list) {
    if (!best.has(sel) || rank[impact] < rank[best.get(sel)]) best.set(sel, impact);
  }
  for (const [sel, impact] of best) {
    const el = deepQ(sel);
    if (el) {
      el.setAttribute("data-a11y-lens", impact);
      el.setAttribute("data-a11y-miyar-sel", sel);
      el.style.setProperty("outline", `3px solid ${colors[impact]}`, "important");
      el.style.setProperty("outline-offset", "1px", "important");
    }
  }
  // Intercept every activation path (SPA routers navigate on pointerdown/
  // mousedown before click). window-capture fires before any page handler.
  if (window.__a11yLensRevHandlers) {
    for (const [type, fn] of Object.entries(window.__a11yLensRevHandlers)) {
      window.removeEventListener(type, fn, true);
    }
  }
  window.__a11yLensRevHandlers = {};
  for (const type of ["pointerdown", "mousedown", "auxclick", "click"]) {
    const fn = (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      const hit = path.find((n) => n && n.getAttribute && n.hasAttribute("data-a11y-miyar-sel"));
      if (!hit) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // preventDefault on pointerdown suppresses the compatibility click event,
      // so record on whichever event arrives first.
      window.__a11yLensClicked = hit.getAttribute("data-a11y-miyar-sel");
    };
    window.__a11yLensRevHandlers[type] = fn;
    window.addEventListener(type, fn, true);
  }
}

function clearInPage() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_highlight").forEach((el) => {
    el.classList.remove("__a11y_lens_highlight");
  });
  document.getElementById("__a11y_lens_style")?.remove();
  document.querySelectorAll("[data-a11y-lens]").forEach((el) => {
    el.removeAttribute("data-a11y-lens");
    el.style.removeProperty("outline");
    el.style.removeProperty("outline-offset");
  });
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  document.querySelectorAll("[data-a11y-miyar-sel]").forEach((el) => el.removeAttribute("data-a11y-miyar-sel"));
  if (window.__a11yLensRevHandlers) {
    for (const [type, fn] of Object.entries(window.__a11yLensRevHandlers)) {
      window.removeEventListener(type, fn, true);
    }
    window.__a11yLensRevHandlers = null;
  }
  window.__a11yLensClicked = null;
  if (window.__a11yLensPickHandler) {
    document.removeEventListener("click", window.__a11yLensPickHandler, true);
    document.body.style.cursor = "";
    window.__a11yLensPickHandler = null;
  }
}

function staleInstallInPage() {
  window.__a11yLensDirty = false;
  window.__a11yLensObserver?.disconnect();
  const obs = new MutationObserver(() => {
    if (window.__a11yLensMuted) return;
    window.__a11yLensDirty = true;
    obs.disconnect();
  });
  obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  window.__a11yLensObserver = obs;
}

function staleCheckInPage() {
  return window.__a11yLensDirty === true;
}

function pickStartInPage() {
  window.__a11yLensPicked = null;
  if (window.__a11yLensPickHandler) {
    document.removeEventListener("click", window.__a11yLensPickHandler, true);
  }
  // same shape as srTreeInPage's cssPath (depth 6, shadow-aware) so the picked selector matches a reading-order row
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) {
        const root = cur.getRootNode && cur.getRootNode();
        if (root && root.host) return cssPath(root.host) + " >>> " + [tag, ...parts].join(" > ");
        parts.unshift(tag);
        break;
      }
      const idx = [...parent.children].indexOf(cur) + 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const h = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener("click", h, true);
    document.body.style.cursor = "";
    window.__a11yLensPickHandler = null;
    window.__a11yLensPicked = cssPath(e.target);
  };
  window.__a11yLensPickHandler = h;
  document.addEventListener("click", h, true);
  document.body.style.cursor = "crosshair";
}

function pickCheckInPage() {
  return window.__a11yLensPicked || null;
}

function applyFixInPage(selector, patch) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const el = deepQ(selector);
  if (!el) return false;
  window.__a11yLensUndo = window.__a11yLensUndo || {};
  if (!window.__a11yLensUndo[selector]) {
    const undo = { attrs: {}, styles: {} };
    for (const name of Object.keys(patch.attrs || {})) {
      undo.attrs[name] = el.hasAttribute(name) ? el.getAttribute(name) : null;
    }
    for (const prop of Object.keys(patch.styles || {})) {
      undo.styles[prop] = el.style.getPropertyValue(prop);
    }
    window.__a11yLensUndo[selector] = undo;
  }
  for (const [name, value] of Object.entries(patch.attrs || {})) {
    el.setAttribute(name, value);
  }
  for (const [prop, value] of Object.entries(patch.styles || {})) {
    el.style.setProperty(prop, value, "important");
  }
  return true;
}

function applyFixAllInPage(items) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 2000);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  window.__a11yLensUndo = window.__a11yLensUndo || {};
  let applied = 0;
  for (const { selector, patch } of items) {
    const el = deepQ(selector);
    if (!el) continue;
    if (!window.__a11yLensUndo[selector]) {
      const undo = { attrs: {}, styles: {} };
      for (const name of Object.keys(patch.attrs || {})) {
        undo.attrs[name] = el.hasAttribute(name) ? el.getAttribute(name) : null;
      }
      for (const prop of Object.keys(patch.styles || {})) {
        undo.styles[prop] = el.style.getPropertyValue(prop);
      }
      window.__a11yLensUndo[selector] = undo;
    }
    for (const [name, value] of Object.entries(patch.attrs || {})) el.setAttribute(name, value);
    for (const [prop, value] of Object.entries(patch.styles || {})) {
      el.style.setProperty(prop, value, "important");
    }
    applied++;
  }
  return applied;
}

function undoAllInPage() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 2000);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const undoMap = window.__a11yLensUndo || {};
  let restored = 0;
  for (const [selector, undo] of Object.entries(undoMap)) {
    const el = deepQ(selector);
    if (!el) continue;
    for (const [name, value] of Object.entries(undo.attrs)) {
      if (value === null) el.removeAttribute(name);
      else el.setAttribute(name, value);
    }
    for (const [prop, value] of Object.entries(undo.styles)) {
      if (value === "") el.style.removeProperty(prop);
      else el.style.setProperty(prop, value, "important");
    }
    restored++;
  }
  window.__a11yLensUndo = {};
  return restored;
}

function undoFixInPage(selector) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const el = deepQ(selector);
  const undo = window.__a11yLensUndo?.[selector];
  if (!el || !undo) return false;
  for (const [name, value] of Object.entries(undo.attrs)) {
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
  }
  for (const [prop, value] of Object.entries(undo.styles)) {
    if (value === "") el.style.removeProperty(prop);
    else el.style.setProperty(prop, value, "important");
  }
  delete window.__a11yLensUndo[selector];
  return true;
}

function helperTabStops() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const els = [...document.querySelectorAll(
    "a[href],button,input,select,textarea,summary,audio[controls],video[controls],[contenteditable=''],[contenteditable='true'],[tabindex]"
  )].filter((el) => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length &&
    getComputedStyle(el).visibility !== "hidden");
  const pos = els.filter((el) => el.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const ordered = [...pos, ...els.filter((el) => el.tabIndex === 0)];
  ordered.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = i + 1;
      let __host = document.body;
      try { __host = el.closest("dialog[open], :popover-open") || document.body; }
      catch (_) { try { __host = el.closest("dialog[open]") || document.body; } catch (__) {} }
      const __fx = __host !== document.body;
      b.style.cssText = `position:${__fx ? "fixed" : "absolute"};z-index:2147483647;left:${(__fx ? 0 : scrollX) + r.left - 6}px;top:${(__fx ? 0 : scrollY) + r.top - 6}px;` +
      "background:#7b1fa2;color:#fff;font:bold 11px/18px sans-serif;min-width:18px;height:18px;" +
      "text-align:center;border-radius:9px;padding:0 3px;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.5)";
    __host.appendChild(b);
    el.style.setProperty("outline", "2px dashed #7b1fa2", "important");
    el.setAttribute("data-a11y-lens", "tabstop");
  });
  const posWarn = pos.length ? ` ⚠ ${pos.length} element(s) use positive tabindex — usually a smell.` : "";
  return `${ordered.length} tab stops numbered in keyboard order.${posWarn}`;
}

function helperHeadings() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6,[role='heading']")]
    .filter((el) => el.getClientRects().length);
  const lines = [];
  let prev = 0, skips = 0;
  for (const h of hs.slice(0, 80)) {
    const lvl = h.matches("[role='heading']")
      ? parseInt(h.getAttribute("aria-level") || "2", 10)
      : parseInt(h.tagName[1], 10);
    if (prev && lvl > prev + 1) skips++;
    prev = lvl;
    lines.push("  ".repeat(lvl - 1) + "h" + lvl + "  " + (h.textContent.trim().slice(0, 70) || "(empty)"));
    const r = h.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = "h" + lvl;
      let __host = document.body;
      try { __host = h.closest("dialog[open], :popover-open") || document.body; }
      catch (_) { try { __host = h.closest("dialog[open]") || document.body; } catch (__) {} }
      const __fx = __host !== document.body;
      b.style.cssText = `position:${__fx ? "fixed" : "absolute"};z-index:2147483647;left:${(__fx ? 0 : scrollX) + r.left - 4}px;top:${(__fx ? 0 : scrollY) + r.top - 16}px;` +
      "background:#1976d2;color:#fff;font:bold 10px/14px sans-serif;padding:0 4px;border-radius:3px;pointer-events:none";
    __host.appendChild(b);
  }
  const h1s = hs.filter((h) => h.tagName === "H1").length;
  const notes = [];
  if (h1s !== 1) notes.push(`⚠ ${h1s} h1 elements (expected exactly 1)`);
  if (skips) notes.push(`⚠ ${skips} level skip(s)`);
  if (!hs.length) return "No headings found — that itself is a problem on most pages.";
  return (notes.length ? notes.join(" · ") + "\n\n" : "") + lines.join("\n") +
    (hs.length > 80 ? `\n…and ${hs.length - 80} more` : "");
}

function helperLandmarks() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const sel = "header,nav,main,aside,footer,form,section[aria-label],section[aria-labelledby]," +
    "[role='banner'],[role='navigation'],[role='main'],[role='complementary']," +
    "[role='contentinfo'],[role='search'],[role='form'],[role='region']";
  const found = [...document.querySelectorAll(sel)].filter((el) => el.getClientRects().length);
  const names = [];
  for (const el of found) {
    const name = el.getAttribute("role") || el.tagName.toLowerCase();
    const label = el.getAttribute("aria-label") || "";
    names.push(name + (label ? ` ("${label}")` : ""));
    const r = el.getBoundingClientRect();
    el.style.setProperty("outline", "2px solid #00838f", "important");
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = name + (label ? ": " + label : "");
      let __host = document.body;
      try { __host = el.closest("dialog[open], :popover-open") || document.body; }
      catch (_) { try { __host = el.closest("dialog[open]") || document.body; } catch (__) {} }
      const __fx = __host !== document.body;
      b.style.cssText = `position:${__fx ? "fixed" : "absolute"};z-index:2147483647;left:${(__fx ? 0 : scrollX) + r.left}px;top:${(__fx ? 0 : scrollY) + r.top}px;` +
      "background:#00838f;color:#fff;font:bold 10px/16px sans-serif;padding:0 5px;pointer-events:none";
    __host.appendChild(b);
  }
  const mains = found.filter((el) => el.tagName === "MAIN" || el.getAttribute("role") === "main").length;
  const notes = [];
  if (!found.length) return "No landmarks found — page content is not in any region. Likely a fail.";
  if (mains !== 1) notes.push(`⚠ ${mains} main landmark(s) (expected exactly 1)`);
  return (notes.length ? notes.join(" · ") + "\n" : "") + "Found: " + names.join(", ");
}

function helperAltOverlay() {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  const imgs = [...document.querySelectorAll("img,svg,[role='img']")]
    .filter((el) => el.getClientRects().length);
  let missing = 0;
  for (const el of imgs) {
    let text, bad = false;
    if (el.tagName === "IMG") {
      if (!el.hasAttribute("alt")) { text = "NO ALT ATTRIBUTE"; bad = true; missing++; }
      else if (el.alt.trim() === "") text = 'alt="" (decorative)';
      else text = "alt: " + el.alt.slice(0, 60);
    } else {
      const label = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") ||
        el.querySelector("title")?.textContent;
      if (label) text = "label: " + String(label).slice(0, 60);
      else if (el.getAttribute("aria-hidden") === "true") text = "aria-hidden (decorative)";
      else { text = "NO ACCESSIBLE NAME"; bad = true; missing++; }
    }
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = text;
      let __host = document.body;
      try { __host = el.closest("dialog[open], :popover-open") || document.body; }
      catch (_) { try { __host = el.closest("dialog[open]") || document.body; } catch (__) {} }
      const __fx = __host !== document.body;
      b.style.cssText = `position:${__fx ? "fixed" : "absolute"};z-index:2147483647;left:${(__fx ? 0 : scrollX) + r.left}px;top:${(__fx ? 0 : scrollY) + r.top}px;` +
      `max-width:${Math.max(r.width, 120)}px;background:${bad ? "#d32f2f" : "#2e7d32"};color:#fff;` +
      "font:10px/14px sans-serif;padding:1px 5px;pointer-events:none;word-break:break-word";
    __host.appendChild(b);
  }
  return `${imgs.length} image(s) labeled — ${missing} with no accessible name. ` +
    "Now judge the QUALITY of each green label against what the image shows.";
}

const HELPERS = {
  tabStops: helperTabStops,
  headings: helperHeadings,
  landmarks: helperLandmarks,
  altOverlay: helperAltOverlay,
};

function dlsCheckInPage(data) {
  const out = {};
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      const idx = parent ? [...parent.children].indexOf(cur) + 1 : 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const lang = (document.documentElement.lang || "").toLowerCase();
  const isAr = lang.startsWith("ar");
  out.lang = document.documentElement.lang || null;
  out.dir = document.documentElement.dir || "ltr";
  out.viewport = !!document.querySelector('meta[name="viewport"]');
  out.langSwitcher = !!(document.querySelector("[hreflang]") ||
    [...document.querySelectorAll("a,button")].slice(0, 400).some((el) =>
      /العربية|عربي|english/i.test(el.textContent.trim())));

  // --- aegov- class adoption ---
  const all = document.querySelectorAll("*");
  const cap = Math.min(all.length, 6000);
  const aegovClasses = new Map();
  let aegovCount = 0;
  for (let i = 0; i < cap; i++) {
    for (const c of all[i].classList) {
      if (c.startsWith("aegov-")) {
        aegovCount++;
        aegovClasses.set(c, (aegovClasses.get(c) || 0) + 1);
      }
    }
  }
  out.elementsScanned = cap;
  out.aegovCount = aegovCount;
  out.aegovClasses = [...aegovClasses.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  // --- typography ---
  const expected = data.fonts[isAr ? "ar" : "en"];
  const fam = (el) => getComputedStyle(el).fontFamily.toLowerCase();
  const hasAny = (stack, names) => names.some((n) => stack.includes(n));
  out.bodyFont = getComputedStyle(document.body).fontFamily.slice(0, 120);
  out.bodyFontOk = hasAny(fam(document.body), expected.body);
  const headings = [...document.querySelectorAll("h1,h2,h3")].slice(0, 10);
  out.headingFonts = [...new Set(headings.map((h) => fam(h).split(",")[0].trim()))].slice(0, 5);
  out.headingFontOk = headings.length === 0 || headings.every((h) => hasAny(fam(h), expected.heading));
  out.fontOffenders = headings
    .filter((h) => !hasAny(fam(h), expected.heading))
    .slice(0, 8)
    .map((h) => ({ sel: cssPath(h), tag: h.tagName.toLowerCase(), font: fam(h).split(",")[0].trim().replace(/"/g, ""), text: h.textContent.trim().slice(0, 40) }));
  out.expectedFonts = expected;

  const weights = new Set();
  for (let i = 0; i < cap; i += Math.max(1, Math.floor(cap / 400))) {
    weights.add(getComputedStyle(all[i]).fontWeight);
  }
  out.fontWeights = [...weights].sort();

  // --- color palette conformance ---
  const toHex = (rgb) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return "#" + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0")).join("");
  };
  const paletteHex = Object.keys(data.colors);
  const parse = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const nearest = (hex) => {
    const [r, g, b] = parse(hex);
    let best = null, bd = Infinity;
    for (const p of paletteHex) {
      const [pr, pg, pb] = parse(p);
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return { token: data.colors[best], hex: best, close: bd <= 900 };
  };
  const sampleEls = document.querySelectorAll(
    "a,button,input,select,h1,h2,h3,header,nav,footer,[class*='btn'],[class*='aegov']");
  const colorUse = new Map();
  const colorSels = new Map();
  for (const el of [...sampleEls].slice(0, 300)) {
    const cs = getComputedStyle(el);
    for (const c of [cs.color, cs.backgroundColor, cs.borderColor]) {
      const hex = toHex(c);
      if (!hex || hex === "#ffffff" || hex === "#000000") continue;
      colorUse.set(hex, (colorUse.get(hex) || 0) + 1);
      if (!colorSels.has(hex)) colorSels.set(hex, []);
      const sels = colorSels.get(hex);
      if (sels.length < 3) sels.push(cssPath(el));
    }
  }
  let inPal = 0, outPal = 0;
  const offenders = [];
  for (const [hex, count] of colorUse) {
    const n = nearest(hex);
    if (data.colors[hex] || n.close) inPal += count;
    else { outPal += count; offenders.push({ hex, count, nearestToken: n.token, nearestHex: n.hex, sels: colorSels.get(hex) || [] }); }
  }
  out.colorsSampled = inPal + outPal;
  out.colorsInPalette = inPal;
  out.offenders = offenders.sort((a, b) => b.count - a.count).slice(0, 6);

  // --- guideline typography checks (designsystem.gov.ae/guidelines/typography) ---
  const typo = data.typo;
  const smallBody = [], tightLines = [];
  const bodyEls = [...document.querySelectorAll("p,li,dd,td")]
    .filter((el) => el.getClientRects().length && el.textContent.trim().length > 40).slice(0, 120);
  for (const el of bodyEls) {
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight);
    if (fs < typo.minBody && smallBody.length < 6) {
      smallBody.push({ sel: cssPath(el), px: Math.round(fs) });
    }
    if (lh !== null && lh / fs < typo.minLineRatio - 0.05 && tightLines.length < 6) {
      tightLines.push({ sel: cssPath(el), ratio: Math.round((lh / fs) * 100) / 100 });
    }
  }
  out.bodySampled = bodyEls.length;
  out.smallBody = smallBody;
  out.tightLines = tightLines;

  out.headingOffScale = [];
  out.displayWeightBad = [];
  if (window.innerWidth >= 1024) {
    for (const h of [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].slice(0, 30)) {
      if (!h.getClientRects().length) continue;
      const cs = getComputedStyle(h);
      const px = Math.round(parseFloat(cs.fontSize));
      if (!typo.headingSizes.some((s) => Math.abs(px - s) <= 2) && out.headingOffScale.length < 6) {
        out.headingOffScale.push({ sel: cssPath(h), tag: h.tagName.toLowerCase(), px });
      }
      const w = parseInt(cs.fontWeight, 10) || 400;
      if (px >= 70 && w !== 200 && out.displayWeightBad.length < 4) {
        out.displayWeightBad.push({ sel: cssPath(h), px, weight: w });
      }
    }
  }

  const badWeights = out.fontWeights.filter((w) => {
    const n = parseInt(w, 10);
    return !typo.headingWeights.includes(n) && !typo.bodyWeights.includes(n);
  });
  out.disallowedWeights = badWeights;

  // --- component catalog: which known DLS components are on this page ---
  out.componentsFound = data.components.filter((c) => document.querySelector("." + c));
  out.componentsKnown = data.components.length;

  // --- button sizing vs the DLS spec (heights from @aegov/design-system dist) ---
  const btns = [...document.querySelectorAll(".aegov-btn")].filter((b) => b.getClientRects().length);
  const badBtns = [];
  for (const b of btns.slice(0, 50)) {
    const h = Math.round(b.getBoundingClientRect().height);
    const ok = data.button.heights.some((s) => Math.abs(h - s) <= data.button.tolerance);
    if (!ok) badBtns.push({ height: h, cls: b.className.split(" ").slice(0, 3).join(" "), sel: cssPath(b), text: b.textContent.trim().slice(0, 30) });
  }
  out.buttons = btns.length;
  out.buttonsOffSpec = badBtns.slice(0, 5);
  out.buttonSpec = data.button.heights;

  // --- raw controls not using DLS component classes ---
  const controls = [...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")];
  out.controls = controls.length;
  const inDls = (el) => [...el.classList].some((c) => c.startsWith("aegov-")) ||
    (el.closest("[class*='aegov-']") !== null);
  out.controlsWithAegov = controls.filter(inDls).length;
  out.rawControls = controls.filter((el) => !inDls(el)).slice(0, 10)
    .map((el) => ({ sel: cssPath(el), tag: el.tagName.toLowerCase() + (el.type ? "[" + el.type + "]" : "") }));

  return out;
}

function dlsHighlightInPage(data) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 2000);
  document.querySelectorAll(".__a11y_lens_overlay").forEach((el) => el.remove());
  let count = 0;
  const MAX = 60;
  const cssPathRev = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      const idx = parent ? [...parent.children].indexOf(cur) + 1 : 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const mark = (el, label) => {
    if (count >= MAX || !el.getClientRects().length) return;
    count++;
    el.setAttribute("data-a11y-lens", "dls");
    el.setAttribute("data-a11y-miyar-sel", "dls:" + cssPathRev(el));
    el.style.setProperty("outline", "3px dashed #b68a35", "important");
    el.style.setProperty("outline-offset", "2px", "important");
    const r = el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "__a11y_lens_overlay";
    b.textContent = label;
      let __host = document.body;
      try { __host = el.closest("dialog[open], :popover-open") || document.body; }
      catch (_) { try { __host = el.closest("dialog[open]") || document.body; } catch (__) {} }
      const __fx = __host !== document.body;
      b.style.cssText = `position:${__fx ? "fixed" : "absolute"};z-index:2147483647;left:${(__fx ? 0 : scrollX) + r.left}px;top:${(__fx ? 0 : scrollY) + r.top - 16}px;` +
      "background:#b68a35;color:#fff;font:bold 10px/15px sans-serif;padding:0 5px;border-radius:3px 3px 0 0;pointer-events:none;max-width:340px;white-space:nowrap;overflow:hidden";
    __host.appendChild(b);
  };

  // off-spec aegov-btn heights
  for (const btn of [...document.querySelectorAll(".aegov-btn")].slice(0, 80)) {
    const h = Math.round(btn.getBoundingClientRect().height);
    if (h > 0 && !data.button.heights.some((s) => Math.abs(h - s) <= data.button.tolerance)) {
      mark(btn, `DLS: ${h}px \u2260 32/40/48/52`);
    }
  }

  // wrong fonts on body-visible headings
  const lang = (document.documentElement.lang || "").toLowerCase();
  const expected = data.fonts[lang.startsWith("ar") ? "ar" : "en"];
  for (const h of [...document.querySelectorAll("h1,h2,h3")].slice(0, 30)) {
    const fam = getComputedStyle(h).fontFamily.toLowerCase();
    if (!expected.heading.some((n) => fam.includes(n))) {
      mark(h, "DLS font: " + fam.split(",")[0].trim().replace(/"/g, ""));
    }
  }

  // off-palette colors on prominent elements
  const toHex = (rgb) => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/.exec(rgb);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    return "#" + [m[1], m[2], m[3]].map((v) => (+v).toString(16).padStart(2, "0")).join("");
  };
  const paletteHex = Object.keys(data.colors);
  const parse = (x) => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)];
  const near = (hex) => {
    const [r, g, b] = parse(hex);
    let best = null, bd = Infinity;
    for (const p of paletteHex) {
      const [pr, pg, pb] = parse(p);
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    return { token: data.colors[best], close: bd <= 900 };
  };
  for (const el of [...document.querySelectorAll("a,button,h1,h2,h3,[class*='btn']")].slice(0, 200)) {
    const cs = getComputedStyle(el);
    for (const c of [cs.color, cs.backgroundColor]) {
      const hex = toHex(c);
      if (!hex || hex === "#ffffff" || hex === "#000000" || data.colors[hex]) continue;
      const n = near(hex);
      if (!n.close) { mark(el, `DLS color ${hex} \u2192 ${n.token}`); break; }
    }
  }

  // guideline typography gaps
  for (const el of [...document.querySelectorAll("p,li,dd,td")].slice(0, 150)) {
    if (count >= MAX) break;
    if (!el.getClientRects().length || el.textContent.trim().length <= 40) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? null : parseFloat(cs.lineHeight);
    if (fs < data.typo.minBody) mark(el, `DLS: ${Math.round(fs)}px < ${data.typo.minBody}px min body`);
    else if (lh !== null && lh / fs < data.typo.minLineRatio - 0.05) mark(el, `DLS: line-height ${(lh / fs).toFixed(2)} < 1.5`);
  }
  if (window.innerWidth >= 1024) {
    for (const h of [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].slice(0, 30)) {
      const px = Math.round(parseFloat(getComputedStyle(h).fontSize));
      if (!data.typo.headingSizes.some((s) => Math.abs(px - s) <= 2)) {
        mark(h, `DLS: ${px}px off the heading scale`);
      }
    }
  }

  // form controls outside DLS components
  for (const el of [...document.querySelectorAll("button,input:not([type=hidden]),select,textarea")].slice(0, 60)) {
    const inDls = [...el.classList].some((c) => c.startsWith("aegov-")) || el.closest("[class*='aegov-']");
    if (!inDls) mark(el, "DLS: not in a DLS component");
  }

  // Intercept every activation path (SPA routers navigate on pointerdown/
  // mousedown before click). window-capture fires before any page handler.
  if (window.__a11yLensRevHandlers) {
    for (const [type, fn] of Object.entries(window.__a11yLensRevHandlers)) {
      window.removeEventListener(type, fn, true);
    }
  }
  window.__a11yLensRevHandlers = {};
  for (const type of ["pointerdown", "mousedown", "auxclick", "click"]) {
    const fn = (e) => {
      const path = e.composedPath ? e.composedPath() : [e.target];
      const hit = path.find((n) => n && n.getAttribute && n.hasAttribute("data-a11y-miyar-sel"));
      if (!hit) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      // preventDefault on pointerdown suppresses the compatibility click event,
      // so record on whichever event arrives first.
      window.__a11yLensClicked = hit.getAttribute("data-a11y-miyar-sel");
    };
    window.__a11yLensRevHandlers[type] = fn;
    window.addEventListener(type, fn, true);
  }

  return count;
}

function dlsComponentAuditInPage(data) {
  const rows = [];
  const cs = (el) => getComputedStyle(el);
  const px = (v) => Math.round(parseFloat(v) || 0);
  const near = (v, want, tol) => Math.abs(v - want) <= (tol === undefined ? 2 : tol);
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 5; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      const idx = parent ? [...parent.children].indexOf(cur) + 1 : 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const add = (component, check, status, issue, els) => rows.push({
    component, check, status, issue,
    count: els ? els.length : 0,
    sels: (els || []).slice(0, 5).map(cssPath),
  });
  const vis = (el) => el.getClientRects().length > 0;
  const q = (sel) => [...document.querySelectorAll(sel)].filter(vis);
  const textOf = (el) => (el.textContent || "").trim();
  const hasIcon = (el) => !!el.querySelector("svg, img, i[class*='icon']");
  const accName = (el) => textOf(el) || el.getAttribute("aria-label") || el.getAttribute("title");

  // ---------- Button ----------
  const btns = q(".aegov-btn");
  if (btns.length) {
    const wrongTag = btns.filter((b) => !/^(BUTTON|A)$/.test(b.tagName));
    add("Button", "Invalid Tag", wrongTag.length ? "fail" : "pass",
      wrongTag.length ? "aegov-btn must be a <button> or <a> element." : "All aegov-btn use valid tags.", wrongTag);
    const noType = btns.filter((b) => b.tagName === "BUTTON" && !b.hasAttribute("type"));
    add("Button", "Missing Type Attribute", noType.length ? "fail" : "pass",
      noType.length ? "<button> elements should declare type (button/submit/reset)." : "All buttons declare a type.", noType);
    const iconOnly = btns.filter((b) => !textOf(b) && hasIcon(b) && !b.getAttribute("aria-label") && !b.getAttribute("title"));
    add("Button", "Invalid Only Icon Variant", iconOnly.length ? "fail" : "pass",
      iconOnly.length ? "Icon-only buttons need aria-label (and the btn-icon class)." : "Icon-only buttons are labelled.", iconOnly);
    const empty = btns.filter((b) => !accName(b) && !hasIcon(b));
    add("Button", "Missing Text in Button", empty.length ? "fail" : "pass",
      empty.length ? "Button has no text, icon, or accessible name." : "All buttons have content.", empty);
    const padSpec = { "btn-xs": 16, "btn-sm": 20, "btn-lg": 28 };
    const badPad = btns.filter((b) => {
      const want = Object.keys(padSpec).find((k) => b.classList.contains(k));
      const target = want ? padSpec[want] : 24;
      if (b.classList.contains("btn-icon")) return false;
      return !near(px(cs(b).paddingLeft), target, 3);
    });
    add("Button", "Invalid Horizontal Padding", badPad.length ? "warn" : "pass",
      badPad.length ? "Padding differs from the size-variant spec (16/20/24/28px)." : "Button padding matches the spec.", badPad);
  }

  // ---------- Badge ----------
  const badges = q(".aegov-badge");
  if (badges.length) {
    const wrongTag = badges.filter((b) => !/^(SPAN|A)$/.test(b.tagName));
    add("Badge", "Invalid Tag", wrongTag.length ? "fail" : "pass",
      wrongTag.length ? "aegov-badge must be a <span> or <a>." : "All badges use valid tags.", wrongTag);
    const noContent = badges.filter((b) => !accName(b) && !hasIcon(b));
    add("Badge", "Missing Badge Content", noContent.length ? "fail" : "pass",
      noContent.length ? "Badge is empty." : "All badges have content.", noContent);
    const iconOnly = badges.filter((b) => !textOf(b) && hasIcon(b) && !b.getAttribute("aria-label"));
    add("Badge", "Missing aria-label for Icon-Only Badge", iconOnly.length ? "fail" : "pass",
      iconOnly.length ? "Icon-only badges need aria-label." : "Icon-only badges are labelled.", iconOnly);
    const iconShown = badges.filter((b) => {
      const svg = b.querySelector("svg");
      return svg && textOf(b) && svg.getAttribute("aria-hidden") !== "true";
    });
    add("Badge", "Icon Not Hidden from Screen Readers", iconShown.length ? "warn" : "pass",
      iconShown.length ? "Decorative badge icons should have aria-hidden=\"true\"." : "Badge icons are hidden from AT.", iconShown);
    const badRadius = badges.filter((b) => !near(px(cs(b).borderTopLeftRadius), 4, 2));
    add("Badge", "Incorrect Border Radius", badRadius.length ? "warn" : "pass",
      badRadius.length ? "Badge radius should be 4px (0.25rem)." : "Badge radius matches the spec.", badRadius);
    const badPadX = badges.filter((b) => !near(px(cs(b).paddingLeft), 8, 2));
    add("Badge", "Invalid Horizontal Padding", badPadX.length ? "warn" : "pass",
      badPadX.length ? "Badge horizontal padding should be 8px." : "Badge padding matches the spec.", badPadX);
  }

  // ---------- Banner ----------
  const banners = q(".aegov-banner");
  if (banners.length) {
    const noContent = banners.filter((b) => !b.querySelector(".banner-content"));
    add("Banner", "Missing Banner Content Div", noContent.length ? "fail" : "pass",
      noContent.length ? "Banner needs a .banner-content wrapper." : "Banner content wrapper present.", noContent);
    const noRole = banners.filter((b) => !b.getAttribute("role") && !b.closest("[role]"));
    add("Banner", "Missing Role", noRole.length ? "fail" : "pass",
      noRole.length ? "Banner should declare a role (e.g. region/alert) for screen readers." : "Banner role present.", noRole);
    const noP = banners.filter((b) => !b.querySelector("p"));
    add("Banner", "Paragraph Not Present", noP.length ? "warn" : "pass",
      noP.length ? "Banner text should be in a <p> element." : "Banner text uses <p>.", noP);
    const badPad = banners.filter((b) => !near(px(cs(b).paddingLeft), 16, 4) || !near(px(cs(b).paddingTop), 12, 4));
    add("Banner", "Invalid Padding", badPad.length ? "warn" : "pass",
      badPad.length ? "Banner padding should be 16px inline / 12px block." : "Banner padding matches the spec.", badPad);
    const topNotSticky = banners.filter((b) =>
      b.classList.contains("banner-top") && !/(sticky|fixed)/.test(cs(b).position));
    add("Banner", "Invalid banner position", topNotSticky.length ? "fail" : "pass",
      topNotSticky.length ? "Top banners must be sticky/fixed." : "Banner positioning is correct.", topNotSticky);
  }

  // ---------- Steps ----------
  const steps = q(".aegov-step");
  if (steps.length) {
    const noList = steps.filter((s) => !s.querySelector("ol[role='list'], ol"));
    add("Steps", "Missing <ol role='list'>", noList.length ? "fail" : "pass",
      noList.length ? "Steps must be an ordered list with role=\"list\"." : "Steps use an ordered list.", noList);
    const items = steps.flatMap((s) => [...s.querySelectorAll("li")]);
    add("Steps", "No Step Items Found", items.length ? "pass" : "fail",
      items.length ? items.length + " step item(s) found." : "aegov-step has no items.", items.length ? [] : steps);
    const noBadge = items.filter((i) => !i.querySelector(".step-badge"));
    add("Steps", "Missing Badge", noBadge.length ? "warn" : "pass",
      noBadge.length ? "Each step should carry a .step-badge." : "All steps have badges.", noBadge);
    const current = items.filter((i) => i.getAttribute("aria-current") || i.querySelector("[aria-current]"));
    add("Steps", "Current Step Missing aria-current", current.length >= 1 ? "pass" : "fail",
      current.length >= 1 ? "aria-current present." : "No step declares aria-current=\"step\".", current.length ? [] : steps);
    add("Steps", "Multiple Current Steps", current.length > 1 ? "fail" : "pass",
      current.length > 1 ? current.length + " steps claim aria-current." : "At most one current step.", current.length > 1 ? current : []);
    const connectors = steps.flatMap((s) => [...s.querySelectorAll(".step-connector, [class*='connector']")]);
    const loudConnectors = connectors.filter((c) => c.getAttribute("aria-hidden") !== "true");
    add("Steps", "Connector Should Be Decorative", loudConnectors.length ? "warn" : "pass",
      loudConnectors.length ? "Step connectors should have aria-hidden=\"true\"." : "Connectors are decorative.", loudConnectors);
  }

  // ---------- Tabs ----------
  const tabs = q(".aegov-tab");
  if (tabs.length) {
    const t = tabs[0];
    const list = t.querySelector("ul, [role='tablist']");
    add("Tabs", "Missing ul list", list ? "pass" : "fail",
      list ? "Tab list present." : "aegov-tab needs a tab list (ul/tablist).", list ? [] : [t]);
    const toggles = [...t.querySelectorAll("[data-tabs-toggle], [data-tab-target], [href^='#']")];
    const links = [...t.querySelectorAll(".tab-link, [role='tab'], a, button")];
    const badRole = links.filter((l) => l.getAttribute("role") !== "tab");
    add("Tabs", "Invalid Role Attribute", badRole.length === links.length && links.length ? "fail" : badRole.length ? "warn" : "pass",
      badRole.length ? badRole.length + " tab trigger(s) missing role=\"tab\"." : "Tab triggers declare role=\"tab\".", badRole);
    const active = [...t.querySelectorAll(".tab-active, [aria-selected='true']")];
    add("Tabs", "Invalid Number of Active Tabs", active.length === 1 ? "pass" : "fail",
      active.length === 1 ? "Exactly one active tab." : active.length + " active tabs (expected 1).", active.length === 1 ? [] : (active.length ? active : [t]));
    const targets = toggles.map((x) => (x.getAttribute("data-tab-target") || x.getAttribute("href") || "").replace("#", "")).filter(Boolean);
    const missingPanels = targets.filter((id) => !document.getElementById(id));
    add("Tabs", "Mismatch Between Tab Targets and Panel IDs", missingPanels.length ? "fail" : "pass",
      missingPanels.length ? "Tab targets with no matching panel: " + missingPanels.join(", ") : "All tab targets resolve to panels.", []);
  }

  // ---------- Hyperlink ----------
  const blankLinks = q("a[target='_blank']");
  if (blankLinks.length) {
    const insecure = blankLinks.filter((a) => !/(noopener|noreferrer)/.test(a.getAttribute("rel") || ""));
    add("Hyperlink", "Hyperlink Missed Security Attributes", insecure.length ? "fail" : "pass",
      insecure.length ? "target=\"_blank\" links need rel=\"noopener noreferrer\"." : "External links carry security attributes.", insecure);
    const noNotice = blankLinks.filter((a) => !/(new (tab|window))/i.test((a.getAttribute("aria-label") || "") + (a.getAttribute("title") || "") + textOf(a)) && !a.querySelector(".sr-only"));
    add("Hyperlink", "Hyperlink Missing Screen Only Notice", noNotice.length ? "warn" : "pass",
      noNotice.length ? "Links opening new tabs should announce it (sr-only text or aria-label)." : "New-tab links announce themselves.", noNotice);
  }

  // ---------- Generic component validations (report-style) ----------
  const GENERIC = [
    ["Accordion", "aegov-accordion", ".accordion, details"],
    ["Alert", "aegov-alert", "[role='alert'], .alert"],
    ["Breadcrumb", "aegov-breadcrumb", ".breadcrumb"],
    ["Card", "aegov-card", ".card"],
    ["Checkbox", "aegov-check-item", "input[type='checkbox']"],
    ["Dropdown", "aegov-dropdown", ".dropdown"],
    ["Modal", "aegov-modal", "dialog, [role='dialog'], .modal"],
    ["Pagination", "aegov-pagination", ".pagination, nav[aria-label*='pag' i]"],
    ["Radio", "aegov-check-item", "input[type='radio']"],
    ["Select", "aegov-form-control", "select"],
    ["Toast", "aegov-toast", "[role='status'], .toast"],
    ["Toggle", "aegov-toggle", "input[type='checkbox'][role='switch'], .toggle, .switch"],
    ["Tooltip", "aegov-tooltip", "[data-tooltip], [role='tooltip']"],
    ["Header", "aegov-header", "header"],
  ];
  for (const [name, cls, nativeSel] of GENERIC) {
    const dls = q("." + cls);
    let native = [];
    try { native = q(nativeSel).filter((el) => !el.closest("." + cls)); } catch (_) {}
    if (dls.length) {
      add(name, name + " Validation", "pass", `${dls.length} ${cls} instance(s) found.`, []);
    } else if (native.length) {
      add(name, name + " Validation", "warn",
        `${name} pattern present (${native.length}) but not using the ${cls} component standard.`, native);
    } else {
      add(name, name + " Validation", "na", "Not implemented on this page.", []);
    }
  }

  return rows;
}

/* ---------- screen reader instrumentation (injected into the page) ---------- */

// Reading-order view: what a screen reader would announce, node by node, using
// axe-core's own accessible-name / role computation (axe must be injected first).
function srTreeInPage() {
  const axe = window.axe;
  if (!axe || !axe.commons) return { error: "axe-core not loaded" };
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) {
        // shadow root boundary — prefix with the host path
        const root = cur.getRootNode && cur.getRootNode();
        if (root && root.host) return cssPath(root.host) + " >>> " + [tag, ...parts].join(" > ");
        parts.unshift(tag);
        break;
      }
      const idx = [...parent.children].indexOf(cur) + 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const T = axe.commons.text, A = axe.commons.aria, D = axe.commons.dom;
  const INTERACTIVE = new Set(["link", "button", "checkbox", "radio", "textbox", "combobox", "listbox",
    "menuitem", "menuitemcheckbox", "menuitemradio", "option", "slider", "spinbutton", "switch", "tab",
    "searchbox", "treeitem", "scrollbar"]);
  const NAME_FROM_CONTENT = new Set(["link", "button", "heading", "cell", "columnheader", "rowheader",
    "gridcell", "option", "tab", "menuitem", "menuitemcheckbox", "menuitemradio", "treeitem", "tooltip",
    "switch", "checkbox", "radio"]);
  const LANDMARK = new Set(["banner", "navigation", "main", "complementary", "contentinfo", "search",
    "region", "form"]);
  const CONTAINER = new Set(["list", "table", "grid", "dialog", "alertdialog", "tablist", "menu", "menubar",
    "tree", "radiogroup", "group", "toolbar", "listbox", "combobox", "article", "figure", "alert", "status",
    "log", "marquee", "timer", "row", "rowgroup", "listitem", "separator", "img", "progressbar", "meter",
    "note", "definition", "term", "blockquote", "code", "caption", "table", "presentation", "none"]);
  const GENERIC = /^(click here|here|more|read more|learn more|details|link|button|image|icon|submit|go|see more|view more|click|»|›|→|>)$/i;
  // Live region: explicit aria-live (not "off") or an implicitly live role — used by the bilingual comparison.
  const liveOf = (el, role) => { const v = (el.getAttribute("aria-live") || "").toLowerCase(); return (!!v && v !== "off") || /^(status|alert|log|marquee|timer)$/.test(role); };
  const TEXT_ROLES = new Set([null, undefined, "generic", "paragraph", "text", "strong", "emphasis",
    "superscript", "subscript", "time", "deletion", "insertion", "mark", "suggestion"]);

  let ok = true;
  try { axe.setup(document); } catch (_) { ok = false; }
  if (!ok) return { error: "axe.setup failed" };

  const rows = [];
  const issuesTotal = { count: 0 };
  const linkNames = new Map();   // "role|name" -> [{idx, href}]
  const landmarkNames = new Map(); // role -> [{idx, name}]
  const stateOf = (el, role) => {
    const s = [];
    const a = (n) => el.getAttribute(n);
    if (a("aria-expanded")) s.push("expanded=" + a("aria-expanded"));
    if (a("aria-pressed")) s.push("pressed=" + a("aria-pressed"));
    if (a("aria-selected")) s.push("selected=" + a("aria-selected"));
    if (a("aria-current")) s.push("current=" + a("aria-current"));
    if (a("aria-haspopup")) s.push("haspopup=" + a("aria-haspopup"));
    if (a("aria-checked")) s.push("checked=" + a("aria-checked"));
    else if ("checked" in el && (el.type === "checkbox" || el.type === "radio")) s.push(el.checked ? "checked" : "not checked");
    if (el.disabled || a("aria-disabled") === "true") s.push("disabled");
    if (el.required || a("aria-required") === "true") s.push("required");
    if (a("aria-invalid") && a("aria-invalid") !== "false") s.push("invalid");
    if (el.readOnly || a("aria-readonly") === "true") s.push("readonly");
    if (role === "heading") {
      const lvl = a("aria-level") || (/^H[1-6]$/.test(el.tagName) ? el.tagName[1] : "2");
      s.push("level " + lvl);
    }
    if (a("aria-describedby")) s.push("has description");
    return s;
  };
  const visibleText = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
  // ---- custom-control state heuristics (cards/tabs/steppers that keep their state in a class only) ----
  const clsStr = (el) => (el.getAttribute && el.getAttribute("class")) || "";
  // Whole class tokens only (is-active, selected, tab--open) — not Tailwind variants (active:bg-blue-800) or design tokens (text-on-primary).
  const STATE_TOKEN_RE = /^(is-|has-)?(active|selected|checked|on|current|expanded|open)$|--(active|selected|checked|current|expanded|open)$/i;
  const stateWord = (el) => clsStr(el).split(/\s+/).find((c) => STATE_TOKEN_RE.test(c)) || "";
  const STATE_ATTRS = ["aria-pressed", "aria-selected", "aria-checked", "aria-expanded", "aria-current"];
  const hasStateAttr = (el) => STATE_ATTRS.some((n) => el.hasAttribute(n));
  // The attribute that should carry the state for this role / class vocabulary.
  const stateAttrFor = (el, role) => {
    const cls = clsStr(el);
    if (role === "tab" || role === "option") return "aria-selected";
    if (/^(checkbox|menuitemcheckbox|switch)$/.test(role)) return "aria-checked";
    const w = stateWord(el);
    if (/(expanded|open)$/i.test(w) || el.hasAttribute("aria-controls")) return "aria-expanded";
    if (/current$/i.test(w)) return "aria-current";
    return "aria-pressed";
  };
  // A single "*" (not a run like a password mask "********") or the word; text AFTER the field only counts with the word / a lone "*".
  const REQ_RE = /(?<!\*)\*(?!\*)|\brequired\b|\bmandatory\b|مطلوب|إلزامي|إجباري/i;
  const REQ_AFTER_RE = /^\*$|\brequired\b|\bmandatory\b|مطلوب|إلزامي|إجباري/i;
  const textBefore = (container, el) => { try { const r = document.createRange(); r.setStart(container, 0); r.setEndBefore(el); return r.toString().replace(/\s+/g, " ").trim(); } catch (_) { return ""; } };
  const fieldsIn = (el) => el.querySelectorAll("input:not([type='hidden']),select,textarea,[role='textbox'],[role='combobox'],[role='checkbox'],[role='radio'],[role='switch']").length;
  // Visible "*" / "required" next to a field that exposes neither required nor aria-required.
  const requiredIssue = (el, role, tag, name) => {
    const isField = /^(textbox|searchbox|combobox|spinbutton|listbox|slider)$/.test(role) || /^(input|select|textarea)$/.test(tag);
    if (!isField || el.required || el.getAttribute("aria-required") === "true") return null;
    if (tag === "input" && /^(hidden|submit|button|reset|image|checkbox|radio)$/.test(el.type || "")) return null;
    const placeholder = (el.getAttribute("placeholder") || "").trim();
    const texts = [name && name !== placeholder ? name : ""]; // a name that is just the placeholder ("********") is not a marker
    for (const l of el.labels || []) texts.push(visibleText(l));
    const sib = (n) => (n && n.nodeType === 1 ? visibleText(n) : n && n.nodeType === 3 ? n.data : "");
    texts.push(sib(el.previousSibling), sib(el.previousElementSibling));
    const after = [sib(el.nextSibling), sib(el.nextElementSibling)];
    const p = el.parentElement;
    if (p && p !== document.body && fieldsIn(p) === 1) { texts.push(textBefore(p, el)); const gp = p.parentElement; if (gp && gp !== document.body && fieldsIn(gp) === 1) texts.push(textBefore(gp, el)); }
    const hit = texts.map((x) => (x || "").trim()).find((x) => x && x.length <= 200 && REQ_RE.test(x))
      || after.map((x) => (x || "").trim()).find((x) => x && x.length <= 200 && REQ_AFTER_RE.test(x));
    if (!hit) return null;
    const m = hit.match(REQ_RE);
    return { level: "moderate", code: "required-not-exposed", msgKey: "srMsgRequired", msgArgs: [m ? m[0] : "*"], msg: `marked required visually ("${m ? m[0] : "*"}") but has neither required nor aria-required — announced as an optional field` };
  };
  // readonly / aria-readonly on a field that is part of a picker (date, time, combobox) — the user IS expected to change it.
  const readonlyIssue = (el, role, tag) => {
    if (!(el.readOnly || el.getAttribute("aria-readonly") === "true")) return null;
    if (!(tag === "input" || role === "textbox" || role === "combobox" || role === "searchbox")) return null;
    const ICON_RE = /calendar|clock|date|time|picker|schedule|event/i;
    // A real picker signal: picker class / placeholder mask / date-time input type — not an id or name that merely contains "date" (created_date is display-only).
    const own = /picker|flatpickr|daterange|pikaday|datetime/i.test(clsStr(el) + " " + (el.getAttribute("placeholder") || "")) || /^(date|time|datetime-local|month|week)$/.test(el.type || "");
    const ICON_SEL = "button,[role='button'],svg,img,i,span[class*='icon']";
    const near = [el.previousElementSibling, el.nextElementSibling, el.parentElement && el.parentElement.querySelector(ICON_SEL)];
    const iconBtn = near.some((b) => b && b.nodeType === 1 && b.matches(ICON_SEL) && (ICON_RE.test(clsStr(b) + " " + (b.getAttribute("aria-label") || "") + " " + (b.getAttribute("title") || "")) || ICON_RE.test((b.innerHTML || "").slice(0, 400))));
    if (!(el.hasAttribute("aria-haspopup") || el.hasAttribute("aria-controls") || role === "combobox" || own || iconBtn)) return null;
    return { level: "moderate", code: "readonly-misuse", msgKey: "srMsgReadonly", msg: "readonly on a picker field (date/time/combobox) — announced as \"read only\" although the user is expected to change its value; screen reader users skip it or think it is locked" };
  };
  // Stepper / wizard / progress list whose steps show state with icons or classes only (no aria-current, no hidden step text).
  const STEPPER_RE = /\b(step|steps|stepper|wizard|progress)[\w-]*/i;
  const stepperIssue = (el, tag, role) => {
    const isList = /^(ol|ul|nav)$/.test(tag) || role === "list" || role === "navigation";
    const named = STEPPER_RE.test(clsStr(el) + " " + (el.id || "") + " " + (el.getAttribute("aria-label") || ""));
    if (!named || !(isList || tag === "div")) return null;
    let items = [...el.children].filter((c) => c.nodeType === 1);
    if (items.length < 2 && items[0] && /^(ol|ul)$/i.test(items[0].tagName)) items = [...items[0].children];
    items = items.filter((i) => !/^(script|style|template)$/i.test(i.tagName));
    if (items.length < 2 || items.length > 30) return null;
    // State signal: a state class on an item, a check/tick/done icon, or icons on SOME items only (an icon on every item is decoration, as in "how it works" lists).
    const withClass = items.filter((i) => /\b(active|done|completed|complete|current|finished|visited|passed|is-active|is-done)\b/i.test(clsStr(i))).length;
    const withCheck = items.filter((i) => i.querySelector("[class*='check'],[class*='tick'],[class*='done'],[class*='complete']")).length;
    const withIcon = items.filter((i) => i.querySelector("svg,img,i,[class*='icon']")).length;
    const stateful = withClass || withCheck || (withIcon > 0 && withIcon < items.length);
    if (!stateful) return null;
    if (el.querySelector("[aria-current]")) return null;
    const hiddenText = [...el.querySelectorAll("[class*='sr-only'],[class*='visually-hidden'],[class*='visuallyhidden'],[class*='screen-reader']")].some((x) => /step|complete|done|current|خطوة|مكتمل|الحالي/i.test(x.textContent));
    if (hiddenText) return null;
    return { level: "moderate", code: "stepper-no-state", msgKey: "srMsgStepper", msgArgs: [items.length], msg: `stepper with ${items.length} steps shows progress with icons/classes only — no aria-current="step" and no hidden "Step N of ${items.length}, completed" text, so the screen reader reads a plain list` };
  };
  // ---- link behaviour: new tab / download / external without a hint; href="#" or javascript: links acting as buttons ----
  const NEW_WIN_RE = /new (tab|window)|opens in|نافذة جديدة|تبويب جديد|علامة تبويب جديدة/i;
  const EXT_RE = /external|خارجي|opens/i;
  const DL_EXT_RE = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|7z|csv)$/i;
  const HIDDEN_SEL = "[class*='sr-only'],[class*='visually-hidden'],[class*='visuallyhidden'],[class*='screen-reader']";
  // Everything a screen reader could say for the link: name, title, aria-describedby targets and visually-hidden text inside it.
  const linkHint = (el, name) => {
    const parts = [name, el.getAttribute("title") || ""];
    for (const id of (el.getAttribute("aria-describedby") || "").split(/\s+/)) { const d = id && document.getElementById(id); if (d) parts.push(d.textContent); }
    for (const h of el.querySelectorAll(HIDDEN_SEL)) parts.push(h.textContent);
    return parts.join(" ").replace(/\s+/g, " ");
  };
  const NAV_SEL = "[class*='pagination'],[class*='pager'],[class*='breadcrumb'],[aria-label*='pagination' i],[aria-label*='breadcrumb' i],[aria-label*='pages' i]";
  const linkIssues = (el, role, tag, name) => {
    const out = [];
    const isLink = role === "link", isFormBtn = role === "button" && tag === "button" && el.hasAttribute("formtarget");
    if (!isLink && !isFormBtn) return out;
    const href = (el.getAttribute("href") || "").trim();
    const target = (isFormBtn ? el.getAttribute("formtarget") : el.getAttribute("target") || "").trim().toLowerCase();
    const hint = linkHint(el, name);
    if (target === "_blank" && !NEW_WIN_RE.test(hint)) {
      out.push({ level: "moderate", code: "link-new-window", msgKey: "srMsgLinkNewWindow", msgArgs: [isFormBtn, name || role, role], msg: `opens in a new ${isFormBtn ? "window (formtarget)" : "tab"} without saying so — the screen reader announces "${name || role}, ${role}" and the user is stranded in a tab they did not expect (WCAG 3.2.5)` });
    }
    if (!isLink) return out;
    let url = null;
    try { url = new URL(href, location.href); } catch (_) { url = null; }
    let pathname = url ? url.pathname || "" : href.split(/[?#]/)[0];
    try { pathname = decodeURIComponent(pathname); } catch (_) {} // malformed %-escapes must not abort the whole scan
    const ext = (pathname.match(DL_EXT_RE) || [])[1];
    if (ext || el.hasAttribute("download")) {
      const type = (ext || (el.getAttribute("download") || "").split(".").pop() || "file").toUpperCase();
      const typeRe = new RegExp(`\\b${type}\\b|download|\\b[0-9.,]+ ?(kb|mb|gb|كيلوبايت|ميغابايت)\\b|تحميل|تنزيل`, "i");
      if (!typeRe.test(hint)) out.push({ level: "moderate", code: "link-download-hint", info: type, msgKey: "srMsgLinkDownload", msgArgs: [type, name || "link"], msg: `downloads a ${type} file but the name does not say so — announced as "${name || "link"}, link" with no file type or size (WCAG 2.4.4)` });
    }
    // Registrable domain (mohre.gov.ae, example.co.uk): eservices.mohre.gov.ae is the same site as www.mohre.gov.ae.
    const site = (h) => { const p = (h || "").toLowerCase().replace(/:\d+$/, "").split("."); if (p.length <= 2) return p.join("."); const n = p[p.length - 2].length <= 2 || /^(com|net|org|gov|edu|ac|co)$/.test(p[p.length - 2]) ? 3 : 2; return p.slice(-n).join("."); };
    if (url && /^https?:$/.test(url.protocol) && site(url.host) && site(url.host) !== site(location.host) && !EXT_RE.test(hint)) {
      out.push({ level: "minor", code: "link-external-hint", info: url.host, msgKey: "srMsgLinkExternal", msgArgs: [url.host], msg: `leaves the site for ${url.host} without a hint — nothing in the name says it is an external link` });
    }
    if (tag === "a" && el.hasAttribute("href") && (href === "" || href === "#" || /^javascript:/i.test(href))) {
      const li = el.closest("li");
      const nav = el.closest(NAV_SEL);
      const current = el.hasAttribute("aria-current") || /\b(active|current|selected)\b/i.test(clsStr(el)) || (li && /\b(active|current|selected)\b/i.test(clsStr(li)));
      // "pointer": no inline handler but a framework/toggle attribute or a button-ish class says a script runs. A bare <a href="#">Back to top</a> is a legitimate same-page link.
      const scripted = [...el.attributes].some((x) => /^(data-(bs-)?toggle|data-target|data-bs-target|data-action|data-on-?click|ng-click|@click|v-on:click|x-on:click|\(click\)|hx-(get|post|trigger))$/i.test(x.name)) ||
        /\b(btn|button|toggle|trigger|dropdown|accordion|collapse|expand|tab)\b/i.test(clsStr(el) + " " + (el.id || ""));
      const kind = nav && current ? "current" : nav ? "nav" : el.hasAttribute("onclick") || /^javascript:/i.test(href) ? "handler" : scripted ? "pointer" : "";
      if (!kind) return out;
      const crumb = nav && /breadcrumb/i.test(nav.className + " " + (nav.getAttribute("aria-label") || ""));
      const what = href === "" ? 'href=""' : href === "#" ? 'href="#"' : "javascript: href";
      const msg = kind === "current" ? `${what} on the current ${/breadcrumb/i.test(nav.className + " " + (nav.getAttribute("aria-label") || "")) ? "breadcrumb" : "pagination"} item — announced as "same page link" though it goes nowhere; the screen reader never hears "current page"`
        : kind === "nav" ? `${what} inside a ${/breadcrumb/i.test(nav.className + " " + (nav.getAttribute("aria-label") || "")) ? "breadcrumb" : "pagination"} — announced as "same page link" and Enter jumps to the top of the page instead of navigating`
        : `${what} with a click handler — announced as "same page link", not a button, and Enter scrolls to the top before the script runs`;
      out.push({ level: "serious", code: "link-as-button", info: kind, msgKey: kind === "current" ? "srMsgLinkAsBtnCurrent" : kind === "nav" ? "srMsgLinkAsBtnNav" : "srMsgLinkAsBtnHandler", msgArgs: [what, crumb], msg });
    }
    return out;
  };
  // Primary language subtag of the closest [lang] ancestor (falls back to <html lang>) — picks the speech voice in the panel.
  const primaryLang = (v) => (v || "").trim().split(/[-_]/)[0].toLowerCase();
  const pageLang = primaryLang(document.documentElement.getAttribute("lang"));
  const langOf = (el) => { const l = el.closest && el.closest("[lang]"); return (l && primaryLang(l.getAttribute("lang"))) || pageLang; };
  // Markup shape for component-level grouping in the panel: sorted class list + nearest UAE DLS (aegov-*) class of self/ancestors.
  const clsOf = (el) => [...(el.classList || [])].filter((c) => !/^__a11y_lens/.test(c)).sort().join(" ");
  const componentOf = (el) => {
    for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
      for (const c of cur.classList || []) if (c.startsWith("aegov-")) return c;
    }
    return "";
  };

  // ---- form group labelling: checkbox/radio groups without a group name, a question followed by Yes/No buttons, a visible label not linked ----
  const isSrVisible = (el) => { try { const vn = axe.utils.getNodeFromTree(el); return vn ? D.isVisibleToScreenReaders(vn) : false; } catch (_) { return false; } };
  const textOfIds = (ids) => (ids || "").split(/\s+/).map((id) => { const d = id && document.getElementById(id); return d ? visibleText(d) : ""; }).filter(Boolean).join(" ");
  // Group label: <fieldset> with a non-empty <legend>, or role=group/radiogroup with aria-label / aria-labelledby text.
  const groupName = (el) => {
    const tag = el.tagName.toLowerCase();
    const ariaName = () => (el.getAttribute("aria-label") || "").trim() || textOfIds(el.getAttribute("aria-labelledby"));
    if (tag === "fieldset") { const lg = [...el.children].find((c) => c.tagName === "LEGEND"); return (lg && visibleText(lg)) || ariaName(); }
    if (/^(group|radiogroup)$/.test(el.getAttribute("role") || "")) return ariaName();
    return "";
  };
  // Widest ancestor that contains only this control (its <label> / <li> / .form-check wrapper).
  const WRAP_STOP = /^(form|fieldset|section|article|main|dialog|table|tbody|thead|ul|ol)$/i;
  const wrapOf = (el, maxUp = 50) => { let cur = el; for (let i = 0; i < maxUp && cur.parentElement && cur.parentElement !== document.body && !WRAP_STOP.test(cur.parentElement.tagName) && fieldsIn(cur.parentElement) === 1; i++) cur = cur.parentElement; return cur; };
  const commonAncestor = (els) => { let anc = els[0]; while (anc && !els.every((e) => anc.contains(e))) anc = anc.parentElement; return anc; };
  // Map<container element, issue> — computed once before the walk, attached to the container's row.
  const groupIssues = new Map();
  try {
    const ctls = [...document.querySelectorAll("input[type='checkbox'],input[type='radio'],[role='checkbox'],[role='radio']")]
      .filter((c) => !c.closest(".__a11y_lens_overlay") && !c.closest("table,[role='grid'],[role='treegrid'],[role='menu'],[role='menubar'],[role='listbox']") && isSrVisible(c));
    const GROUP_SEL = "fieldset,[role='group'],[role='radiogroup']";
    const CTL_SEL = "input[type='checkbox'],input[type='radio'],[role='checkbox'],[role='radio']";
    const groupIdx = new Map(); // nearest fieldset/group ancestor -> stable index, so a shared name= in two separate fieldsets makes two buckets
    const buckets = new Map(); // name(+group) or container -> controls
    for (const c of ctls) {
      const nm = (c.getAttribute("name") || "").trim();
      let key;
      if (nm) {
        const g = c.closest(GROUP_SEL);
        if (g && !groupIdx.has(g)) groupIdx.set(g, groupIdx.size + 1);
        key = "name:" + nm + "@" + (g ? groupIdx.get(g) : 0);
      } else key = wrapOf(c).parentElement;
      if (!key) continue;
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(c);
    }
    const grouped = new Set([...buckets.values()].filter((m) => m.length >= 2).flat());
    // An ancestor names the group when it holds no OTHER group's controls (a text "Other: …" field inside the fieldset is fine; an outer <fieldset> around the whole form is not).
    const holdsOtherGroup = (anc, members) => [...anc.querySelectorAll(CTL_SEL)].some((x) => grouped.has(x) && !members.includes(x));
    for (const [key, members] of buckets) {
      if (members.length < 2) continue;
      const container = typeof key === "string" ? commonAncestor(members.map(wrapOf)) : key;
      if (!container || container === document.body || container === document.documentElement || groupIssues.has(container)) continue;
      // The whole group and nothing else: an outer <fieldset> around the entire form does not name this group.
      if (typeof key !== "string" && fieldsIn(container) !== members.length) continue;
      let labelled = "";
      for (let anc = container; anc && anc !== document.body; anc = anc.parentElement) {
        if (!anc.matches(GROUP_SEL)) continue;
        if (holdsOtherGroup(anc, members)) break;
        labelled = groupName(anc);
        break;
      }
      if (labelled) continue;
      const kind = /radio/i.test(members[0].getAttribute("type") || members[0].getAttribute("role") || "") ? "radio" : "checkbox";
      // Candidate group name: the text inside the container before the first control, else the previous sibling's text.
      let hint = textBefore(container, wrapOf(members[0]));
      if (!hint) { const prev = container.previousElementSibling; hint = prev ? visibleText(prev) : ""; }
      hint = hint.replace(/[:：]\s*$/, "").trim();
      if (hint.length > 80) hint = "";
      if (typeof key !== "string" && kind === "checkbox" && members.length < 3 && !hint) continue; // "Remember me" + "Subscribe" side by side: not a set
      groupIssues.set(container, { level: "serious", code: "group-no-label", info: kind, hint, msgKey: "srMsgGroupNoLabel", msgArgs: [members.length, kind, hint],
        msg: `${members.length} ${kind} controls form a group with no group name — no <fieldset>/<legend> and no role="group" with a label${hint ? ` (the visible "${hint}" is not linked)` : ""}; the screen reader announces each ${kind} by its own text only, never what the choice is about` });
    }
  } catch (_) {}
  const YESNO_RE = /^(yes|no|ok|okay|cancel|true|false|agree|disagree|نعم|لا|موافق|غير موافق|إلغاء|حسناً|حسنا)$/i;
  const BTN_SEL = "button,[role='button'],input[type='button'],input[type='submit']";
  const btnName = (b) => { try { const vn = axe.utils.getNodeFromTree(b); return vn ? T.accessibleTextVirtual(vn).replace(/\s+/g, " ").trim() : visibleText(b); } catch (_) { return visibleText(b); } };
  // Question text ("Did you find this useful?") followed within the next 2 siblings by 2+ generic Yes/No/OK/Cancel buttons with nothing tying them together.
  const questionIssue = (el, direct) => {
    if (!/\?\s*$/.test(direct || "") || direct.length > 200) return null;
    const btns = [];
    let sib = el.nextElementSibling;
    for (let i = 0; sib && i < 2; i++, sib = sib.nextElementSibling) {
      if (sib.matches(BTN_SEL)) btns.push(sib);
      else btns.push(...sib.querySelectorAll(BTN_SEL));
    }
    // visible, and sitting next to each other (a hidden modal template deeper in the next section is not the answer to this question)
    let generic = btns.filter((b) => isSrVisible(b) && YESNO_RE.test(btnName(b)));
    if (generic.length >= 2) { const byParent = new Map(); for (const b of generic) { const k = b.parentElement; byParent.set(k, (byParent.get(k) || []).concat(b)); } generic = [...byParent.values()].sort((a, b) => b.length - a.length)[0]; }
    if (generic.length < 2) return null;
    const parent = el.parentElement;
    if (!parent) return null;
    if (el.tagName === "LEGEND" || parent.tagName === "FIELDSET") return null;
    // Associated: a role=group/radiogroup ancestor named by (or with) the question, or each button describing/labelling itself by the question element.
    const qText = direct.toLowerCase();
    const ASSOC_ROLE = /^(group|radiogroup|dialog|alertdialog|region)$/;
    for (let anc = parent; anc && anc !== document.body; anc = anc.parentElement) {
      const gn = groupName(anc).toLowerCase();
      if (gn && (gn === qText || qText.includes(gn) || gn.includes(qText.replace(/\?\s*$/, "").trim()))) return null;
      const assoc = ASSOC_ROLE.test(anc.getAttribute("role") || "") || anc.tagName === "DIALOG";
      if (assoc && el.id && (anc.getAttribute("aria-labelledby") || "").split(/\s+/).includes(el.id)) return null;
      if (assoc && (anc.getAttribute("aria-label") || "").trim().toLowerCase() === qText) return null; // the question IS the dialog's name
    }
    if (el.id && generic.every((b) => ((b.getAttribute("aria-describedby") || "") + " " + (b.getAttribute("aria-labelledby") || "")).split(/\s+/).includes(el.id))) return null;
    // "tight": the parent holds only the question and the buttons, so role="group" can go straight on it.
    const kids = [...parent.children].filter((c) => !/^(script|style|template)$/i.test(c.tagName));
    const tight = kids.every((c) => c === el || generic.includes(c) || (c.querySelector(BTN_SEL) && [...c.querySelectorAll(BTN_SEL)].every((b) => generic.includes(b))));
    const names = generic.map((b) => `"${btnName(b)}"`).join(" / ");
    return { level: "moderate", code: "question-not-associated", info: tight ? "tight" : "", hint: direct.trim(), msgKey: "srMsgQuestionNotAssoc", msgArgs: [names, direct.trim()],
      msg: `${names} buttons are not associated with the question "${direct.trim()}" — in the buttons list (or when tabbing straight to them) the screen reader announces just ${names}, without what is being asked; wrap them in role="group" aria-labelledby pointing at the question` };
  };
  const LABEL_LIKE_SEL = "label,span,div,p,strong,b,td,th,dt";
  const normLbl = (s) => (s || "").toLowerCase().replace(/[:：*]+\s*$/, "").replace(/\s+/g, " ").trim();
  // Visible label text (a <label> without for, or a span/div with a "label" class or ending in ":") next to a field that it does not name.
  const labelIssue = (el, role, tag, name) => {
    const isField = /^(textbox|searchbox|combobox|spinbutton|listbox|slider|checkbox|radio|switch)$/.test(role) || /^(input|select|textarea)$/.test(tag);
    if (!isField) return null;
    if (tag === "input" && /^(hidden|submit|button|reset|image)$/.test(el.type || "")) return null;
    if (el.closest("label") || (el.labels && el.labels.length)) return null; // wrapped or <label for>: already labelled (a differing group heading is the group's concern)
    const labelLike = (n) => {
      if (!n || n.nodeType !== 1 || !n.matches(LABEL_LIKE_SEL) || n.querySelector("input,select,textarea,button,a[href]")) return "";
      const txt = visibleText(n);
      if (!txt || txt.length > 80) return "";
      if (n.tagName === "LABEL") return n.hasAttribute("for") ? "" : txt;
      return /label/i.test(clsStr(n)) || /[:：]\s*$/.test(txt) ? txt : "";
    };
    const wrap = wrapOf(el, 2); // a form row, not the whole card/section around a lone field
    const cands = [el.previousElementSibling, el.nextElementSibling];
    if (wrap !== el) { cands.push(wrap.previousElementSibling); if (!/^(checkbox|radio)$/.test(role) && wrap.parentElement && wrap.parentElement.childElementCount <= 3) cands.push(wrap.parentElement.firstElementChild); }
    let lbl = "", lblEl = null;
    for (const c of cands) { if (c === el || c === wrap) continue; lbl = labelLike(c); if (lbl) { lblEl = c; break; } }
    if (!lbl) return null;
    if (lblEl.tagName === "LABEL" && el.labels && [...el.labels].includes(lblEl)) return null;
    const want = normLbl(lbl), have = normLbl(name);
    const fromPlaceholder = !!name && name === (el.getAttribute("placeholder") || "").replace(/\s+/g, " ").trim(); // placeholder-only stays "different": it disappears while typing
    if (have && (have === want || have.includes(want) || (want.startsWith(have) && !fromPlaceholder))) return null; // "Email address" / "Name (required)" named "Email" / "Name": the label starts with the name
    return { level: "serious", code: "label-not-associated", info: lbl, hint: lbl, msgKey: "srMsgLabelNotAssoc", msgArgs: [lbl, name],
      msg: `visible label "${lbl}" is not linked to the field — announced as ${name ? `"${name}"` : "an unnamed " + role} instead; use <label for> so the text next to the field is what the screen reader (and voice control) gets` };
  };

  const walk = (vnode, depth) => {
    if (rows.length >= 900) return;
    const el = vnode.actualNode;
    if (!el || el.nodeType !== 1) return;
    const tag = el.tagName.toLowerCase();
    if (/^(script|style|noscript|template|meta|link|head)$/.test(tag)) return;
    if (el.classList && el.classList.contains("__a11y_lens_overlay")) return;

    let srVisible = true;
    try { srVisible = D.isVisibleToScreenReaders(vnode); } catch (_) {}
    if (!srVisible) {
      // aria-hidden / display:none subtree: flag anything still reachable by Tab
      if (el.getAttribute("aria-hidden") === "true") {
        const focusables = [];
        const scan = (vn) => {
          if (focusables.length >= 5) return;
          try { if (D.isInTabOrder(vn)) focusables.push(vn.actualNode); } catch (_) {}
          for (const c of vn.children || []) scan(c);
        };
        scan(vnode);
        if (focusables.length) {
          rows.push({
            sel: cssPath(el), tag, role: "aria-hidden", name: "", states: [], depth, lang: langOf(el), cls: clsOf(el), component: componentOf(el),
            html: el.outerHTML.slice(0, 160), hidden: true,
            issues: [{ level: "serious", code: "hidden-focusable", msg: `aria-hidden subtree still contains ${focusables.length} Tab-reachable element(s) — keyboard users land on something screen readers cannot see` }],
          });
          issuesTotal.count++;
        }
      }
      return;
    }

    let role = null;
    try { role = A.getRole(vnode); } catch (_) { role = el.getAttribute("role") || null; }
    let name = "";
    const meaningful = role && !TEXT_ROLES.has(role) && role !== "presentation" && role !== "none";
    if (meaningful) {
      let fullNameLen = 0;
      try { name = T.accessibleTextVirtual(vnode).replace(/\s+/g, " ").trim(); } catch (_) { name = ""; }
      fullNameLen = name.length;
      name = name.slice(0, 400); // cap what is spoken / stored / exported; the long-name check uses the real length
      const issues = [];
      const isInteractive = INTERACTIVE.has(role);
      const ariaLabel = (el.getAttribute("aria-label") || "").trim();
      const hasLabelledby = !!el.getAttribute("aria-labelledby");
      const title = (el.getAttribute("title") || "").trim();
      const placeholder = (el.getAttribute("placeholder") || "").trim();

      if (isInteractive && !name) {
        issues.push({ level: "critical", code: "no-name", msg: `${role} has no accessible name — announced as just "${role}"` });
      } else if (role === "img" && !name) {
        issues.push({ level: "serious", code: "img-no-name", msg: "image has no accessible name — announced as 'image' or the file name" });
      } else if (role === "heading" && !name) {
        issues.push({ level: "serious", code: "empty-heading", msg: "empty heading — announced as 'heading' with nothing after it" });
      } else if ((role === "link" || role === "button") && GENERIC.test(name)) {
        issues.push({ level: "serious", code: "generic-name", msg: `generic name "${name}" — meaningless out of context (screen reader users often list all links/buttons)` });
      }
      if (name && placeholder && !ariaLabel && !hasLabelledby && name === placeholder &&
          /^(textbox|searchbox|combobox|spinbutton)$/.test(role) && !el.labels?.length) {
        issues.push({ level: "serious", code: "placeholder-only", msg: "named by placeholder only — the name disappears once the user types; add a <label> or aria-label" });
      }
      if (name && title && !ariaLabel && !hasLabelledby && name === title && isInteractive &&
          !visibleText(el) && !(el.labels && el.labels.length) && !el.getAttribute("alt")) {
        issues.push({ level: "moderate", code: "title-only", msg: "named by title attribute only — unreliable on touch and in some screen readers" });
      }
      if (ariaLabel && isInteractive) {
        const vis = visibleText(el).toLowerCase();
        if (vis && vis.length <= 80 && !name.toLowerCase().includes(vis)) {
          issues.push({ level: "serious", code: "label-in-name", msg: `accessible name "${name}" does not contain the visible text "${vis}" — voice-control users cannot say what they see (WCAG 2.5.3)` });
        }
      }
      if (fullNameLen > 150 && (role === "link" || role === "button")) {
        issues.push({ level: "minor", code: "long-name", msg: `very long name (${fullNameLen} chars) — announced in full on every focus` });
      }
      if (isInteractive) {
        let inTab = false;
        try { inTab = D.isInTabOrder(vnode); } catch (_) {}
        let focusable = false;
        try { focusable = D.isFocusable(vnode); } catch (_) {}
        if (!focusable && !/^(option|menuitem|menuitemcheckbox|menuitemradio|treeitem|tab)$/.test(role)) {
          issues.push({ level: "serious", code: "not-focusable", msg: `${role} is not focusable — screen reader users cannot reach it with Tab` });
        } else if (!inTab && el.tabIndex < 0 && !/^(option|menuitem|menuitemcheckbox|menuitemradio|treeitem|tab|radio)$/.test(role)) {
          issues.push({ level: "moderate", code: "tabindex-neg", msg: `${role} has tabindex="-1" — reachable only programmatically, skipped by Tab` });
        }
      }
      if (role === "link" && !el.hasAttribute("href") && el.tagName === "A") {
        issues.push({ level: "moderate", code: "a-no-href", msg: "<a> without href — announced as a link but not keyboard-focusable" });
      }
      // State kept in a class only (team cards, "Select All", tab strips): the screen reader hears the same thing before and after
      if (role === "tab" && !el.hasAttribute("aria-selected")) {
        const w = stateWord(el);
        issues.push({ level: "serious", code: "state-missing", attr: "aria-selected", msgKey: w ? "srMsgStateMissingTabCls" : "srMsgStateMissingTab", msgArgs: [w], msg: `tab has no aria-selected${w ? ` (state is only in class "${w}")` : ""} — the screen reader cannot say which tab is open` });
      } else if (/^(button|option|menuitemcheckbox|switch|checkbox)$/.test(role) && tag !== "input" && tag !== "summary" && stateWord(el) && !hasStateAttr(el)) {
        const attr = stateAttrFor(el, role);
        issues.push({ level: "serious", code: "state-missing", attr, msgKey: "srMsgStateMissing", msgArgs: [role, stateWord(el), attr], msg: `${role} keeps its state in class "${stateWord(el)}" only — no ${attr}, so the screen reader announces it identically in both states` });
      }
      const req = requiredIssue(el, role, tag, name);
      if (req) issues.push(req);
      const ro = readonlyIssue(el, role, tag);
      if (ro) issues.push(ro);
      const stp = stepperIssue(el, tag, role);
      if (stp) issues.push(stp);
      for (const li of linkIssues(el, role, tag, name)) issues.push(li);
      const lbl = labelIssue(el, role, tag, name);
      if (lbl) issues.push(lbl);
      const grp = groupIssues.get(el);
      if (grp) issues.push(grp);
      if (!isInteractive) { const q = questionIssue(el, name || visibleText(el)); if (q) issues.push(q); }
      const idx = rows.length;
      rows.push({
        sel: cssPath(el), tag, role, name, states: stateOf(el, role), depth, lang: langOf(el), cls: clsOf(el), component: componentOf(el),
        html: el.outerHTML.slice(0, 160), issues, live: liveOf(el, role),
      });
      issuesTotal.count += issues.length;
      if (role === "link" || role === "button") {
        const key = role + "|" + name.toLowerCase();
        if (name) {
          if (!linkNames.has(key)) linkNames.set(key, []);
          linkNames.get(key).push({ idx, href: el.getAttribute("href") || el.getAttribute("formaction") || "" });
        }
      }
      if (LANDMARK.has(role)) {
        if (!landmarkNames.has(role)) landmarkNames.set(role, []);
        landmarkNames.get(role).push({ idx, name });
      }
      if (NAME_FROM_CONTENT.has(role) || role === "img" || role === "progressbar" || role === "meter" ||
          role === "separator" || role === "textbox" || role === "combobox" || role === "listbox" || role === "slider") {
        return; // the name already covers the subtree
      }
    } else {
      // Unlabelled clickable container: div/span with a click handler or tabindex but no role
      const clickable = el.hasAttribute("onclick") || (el.hasAttribute("tabindex") && !/^(a|button|input|select|textarea|summary|details|iframe|video|audio|dialog)$/.test(tag));
      let emitted = false;
      if (clickable && (tag === "div" || tag === "span" || tag === "li" || tag === "img" || tag === "svg" || tag === "i")) {
        emitted = true;
        rows.push({
          sel: cssPath(el), tag, role: role || "generic", name: visibleText(el).slice(0, 80), states: [], depth, lang: langOf(el), cls: clsOf(el), component: componentOf(el),
          html: el.outerHTML.slice(0, 160),
          issues: [{ level: "serious", code: "clickable-no-role", msg: `<${tag}> is clickable/focusable but has no role — announced as plain text, no "button" or "link"` }],
        });
        issuesTotal.count++;
      }
      if (!emitted && tag === "div") {
        const stp = stepperIssue(el, tag, role);
        if (stp) {
          emitted = true;
          rows.push({ sel: cssPath(el), tag, role: "generic", name: visibleText(el).slice(0, 80), states: [], depth, lang: langOf(el), cls: clsOf(el), component: componentOf(el), html: el.outerHTML.slice(0, 160), issues: [stp] });
          issuesTotal.count++;
        }
      }
      // Unlabelled checkbox/radio group whose container has no role: emit the container so the fix wraps the whole group
      const grp = !emitted && groupIssues.get(el);
      if (grp) {
        emitted = true;
        rows.push({ sel: cssPath(el), tag, role: "generic", name: (grp.hint || visibleText(el)).slice(0, 80), states: [], depth, lang: langOf(el), cls: clsOf(el), component: componentOf(el), html: el.outerHTML.slice(0, 160), issues: [grp] });
        issuesTotal.count++;
      }
      // Plain text run: emit a text row so reading order is complete
      let direct = "";
      for (const c of el.childNodes) if (c.nodeType === 3) direct += c.data;
      direct = direct.replace(/\s+/g, " ").trim();
      if (direct && !emitted) {
        const q = questionIssue(el, direct);
        rows.push({ sel: cssPath(el), tag, role: "text", name: direct.slice(0, 120), states: [], depth, lang: langOf(el), cls: q ? clsOf(el) : undefined, component: q ? componentOf(el) : undefined, html: q ? el.outerHTML.slice(0, 160) : "", issues: q ? [q] : [], live: liveOf(el, "") });
        if (q) issuesTotal.count++;
      } else if (!emitted && liveOf(el, "")) {
        // role-less aria-live container (e.g. <div aria-live="polite"><p>…</p></div>): keep it in the tree so the bilingual comparison can pair it
        rows.push({ sel: cssPath(el), tag, role: "generic", name: visibleText(el).slice(0, 80), states: [], depth, lang: langOf(el), cls: clsOf(el), component: componentOf(el), html: el.outerHTML.slice(0, 160), issues: [], live: true });
      }
    }
    for (const c of vnode.children || []) walk(c, depth + 1);
  };

  let rootV = null;
  try { rootV = axe.utils.getNodeFromTree(document.body); } catch (_) {}
  if (!rootV) { try { axe.teardown(); } catch (_) {} return { error: "could not build the accessibility tree" }; }
  walk(rootV, 0);

  // Duplicate link/button names that go to different places
  for (const [key, list] of linkNames) {
    if (list.length < 2) continue;
    const hrefs = new Set(list.map((x) => x.href));
    if (key.startsWith("link|") && hrefs.size < 2) continue; // same destination — fine
    for (const { idx } of list) {
      rows[idx].issues.push({ level: "moderate", code: "dup-name", msg: `same name as ${list.length - 1} other ${key.split("|")[0]}(s) ${key.startsWith("link|") ? "with different destinations" : ""} — indistinguishable when listed` });
      issuesTotal.count++;
    }
  }
  for (const [role, list] of landmarkNames) {
    if (list.length < 2) continue;
    const unnamed = list.filter((x) => !x.name);
    const dupNames = list.map((x) => x.name.toLowerCase()).filter((n, i, a) => n && a.indexOf(n) !== i);
    for (const x of list) {
      if (!x.name && unnamed.length > 1 || (x.name && dupNames.includes(x.name.toLowerCase()))) {
        rows[x.idx].issues.push({ level: "moderate", code: "dup-landmark", msg: `${list.length} "${role}" landmarks — give each a unique aria-label so they can be told apart in the landmarks list` });
        issuesTotal.count++;
      }
    }
  }
  try { axe.teardown(); } catch (_) {}
  const summary = { rows: rows.length, issues: issuesTotal.count,
    interactive: rows.filter((r) => INTERACTIVE.has(r.role)).length,
    headings: rows.filter((r) => r.role === "heading").length,
    landmarks: rows.filter((r) => LANDMARK.has(r.role)).length,
    images: rows.filter((r) => r.role === "img").length };
  return { url: location.href, rows, summary, pageLang, truncated: rows.length >= 900 };
}

// Language / voice-switching check: text whose script contradicts the declared lang.
/* ---- apply a mechanical screen reader fix in place (and undo it) ----
   Self-contained (injected). The undo stack lives on the page window, keyed by the
   selector the panel used, and keeps the element reference + its original outerHTML
   so a retag (div → button) can still be reverted after the selector stopped matching. */
function srApplyInPage(sel, patch) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const deepQ = (s) => {
    if (s.includes(" >>> ")) {
      let root = document, el = null;
      for (const part of s.split(" >>> ")) {
        el = null;
        try { el = root.querySelector(part); } catch (_) {}
        if (!el) return null;
        root = el.shadowRoot || el;
      }
      return el;
    }
    try { const el = document.querySelector(s); if (el) return el; } catch (_) { return null; }
    const walk = (root) => {
      for (const h of root.querySelectorAll("*")) {
        if (h.shadowRoot) {
          let f = null;
          try { f = h.shadowRoot.querySelector(s); } catch (_) {}
          if (f) return f;
          f = walk(h.shadowRoot);
          if (f) return f;
        }
      }
      return null;
    };
    return walk(document);
  };
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) {
        const root = cur.getRootNode && cur.getRootNode();
        if (root && root.host) return cssPath(root.host) + " >>> " + [tag, ...parts].join(" > ");
        parts.unshift(tag);
        break;
      }
      const idx = [...parent.children].indexOf(cur) + 1;
      parts.unshift(`${tag}:nth-child(${idx})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  if (!sel || !patch) return { error: "nothing to apply" };
  let el = deepQ(sel);
  if (!el) return { error: "element not found on the page (" + sel + ")" };
  if (patch.closest) {
    const anc = el.closest(patch.closest);
    if (!anc) return { error: "no ancestor matching " + patch.closest };
    el = anc;
  } else if (patch.parent) {
    // the fix belongs on the element's parent (role="group" around a question and its Yes/No buttons)
    if (!el.parentElement || el.parentElement === document.body) return { error: "the element has no parent to patch" };
    el = el.parentElement;
  }
  const stack = (window.__a11yLensUndo = window.__a11yLensUndo || {});
  const original = el.outerHTML;
  // <html> cannot be re-parsed from outerHTML; keep its attributes instead
  const attrs = el === el.ownerDocument.documentElement ? [...el.attributes].map((a) => [a.name, a.value]) : null;
  let target = el, warning = "";
  if (patch.setAttr || patch.removeAttr) {
    for (const [k, v] of Object.entries(patch.setAttr || {})) {
      if (!/^[a-zA-Z_:][-a-zA-Z0-9_:.]*$/.test(k)) return { error: "bad attribute name " + k };
      el.setAttribute(k, v == null ? "" : String(v));
    }
    for (const k of patch.removeAttr || []) el.removeAttribute(k);
  } else if (patch.appendHidden) {
    // visually-hidden hint text inside the element ("(opens in a new tab)", "(PDF)") — part of the accessible name, invisible on screen
    const text = String(patch.appendHidden).trim();
    if (!text) return { error: "no hint text" };
    const span = el.ownerDocument.createElement("span");
    span.className = "__a11y_lens_vh";
    span.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";
    span.textContent = " " + text;
    el.appendChild(span);
  } else if (patch.liveRegion) {
    el.setAttribute("role", patch.liveRegion === "alert" ? "alert" : "status");
    if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", patch.liveRegion === "alert" ? "assertive" : "polite");
    if (!el.hasAttribute("aria-atomic")) el.setAttribute("aria-atomic", "true");
  } else if (patch.retag) {
    if (!/^[a-z][a-z0-9-]*$/.test(patch.retag)) return { error: "bad tag " + patch.retag };
    const nu = document.createElement(patch.retag);
    for (const a of [...el.attributes]) {
      if (a.name === "tabindex" || a.name === "role") continue;
      if (patch.retag === "button" && (a.name === "href" || a.name === "target")) continue; // a pseudo-link's href="#" has no meaning on a button
      nu.setAttribute(a.name, a.value);
    }
    if (patch.retag === "button" && !nu.hasAttribute("type")) nu.setAttribute("type", "button");
    if (patch.retag === "button" && el.tabIndex < 0 && el.hasAttribute("tabindex")) nu.setAttribute("tabindex", "-1");
    nu.innerHTML = el.innerHTML;
    el.replaceWith(nu);
    target = nu;
    warning = "JavaScript listeners attached with addEventListener are not carried over — re-bind them (inline on* attributes were kept)";
  } else if (patch.wrapText) {
    const text = String(patch.wrapText.text || "").trim();
    if (!text) return { error: "no text to wrap" };
    const doc = el.ownerDocument;
    const walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = null, needle = text, hit = -1;
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    const find = (s) => { for (const n of nodes) { const i = n.data.indexOf(s); if (i >= 0) return [n, i]; } return null; };
    let found = find(needle);
    // the run may have been aggregated across several text nodes — shrink at word boundaries until one node contains it
    while (!found && needle.includes(" ")) { needle = needle.slice(0, needle.lastIndexOf(" ")).trim(); if (needle.length < 2) break; found = find(needle); }
    if (!found) return { error: "text run not found inside the element (it may span several elements)" };
    if (needle !== text) warning = "only the first part of the run (\"" + needle.slice(0, 40) + "…\") sits in one text node and was wrapped; wrap the rest by hand";
    [node, hit] = found;
    const after = node.splitText(hit);
    after.splitText(needle.length);
    const span = doc.createElement("span");
    if (patch.wrapText.lang) span.setAttribute("lang", patch.wrapText.lang);
    if (patch.wrapText.dir) span.setAttribute("dir", patch.wrapText.dir);
    after.parentNode.insertBefore(span, after);
    span.appendChild(after);
    target = el;
  } else {
    return { error: "unknown patch" };
  }
  (stack[sel] = stack[sel] || []).push({ el: target, html: original, attrs });
  try { target.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {}
  return { ok: true, sel: cssPath(target), html: target.outerHTML.slice(0, 200), warning, depth: stack[sel].length };
}

function srUndoInPage(sel) {
  window.__a11yLensMuted = true;
  setTimeout(() => { window.__a11yLensMuted = false; }, 1500);
  const stack = window.__a11yLensUndo || {};
  const list = stack[sel];
  if (!list || !list.length) return { error: "nothing to undo for " + sel };
  const entry = list.pop();
  const el = entry.el;
  if (!el || !el.parentNode) return { error: "the element is no longer in the page — reload to reset" };
  const parent = el.parentNode;
  // <html> cannot be replaced: copy its attributes back instead
  if (entry.attrs) {
    for (const a of [...el.attributes]) el.removeAttribute(a.name);
    for (const [k, v] of entry.attrs) el.setAttribute(k, v);
    if (!list.length) delete stack[sel];
    return { ok: true, remaining: list.length, html: el.outerHTML.slice(0, 200) };
  }
  const tpl = el.ownerDocument.createElement("template");
  tpl.innerHTML = entry.html;
  const restored = tpl.content.firstElementChild;
  if (!restored) return { error: "could not rebuild the original element" };
  const nu = el.ownerDocument.importNode(restored, true);
  parent.replaceChild(nu, el);
  // deeper entries for the same selector point at the element we just replaced; refresh them
  for (const e of list) if (e.el === el) e.el = nu;
  if (!list.length) delete stack[sel];
  return { ok: true, remaining: list.length, html: nu.outerHTML.slice(0, 200) };
}

// Non-text contrast (WCAG 1.4.11) heuristic — axe has no rule for it. For every visible form
// control, icon-only button/link and custom toggle, the "boundary" the sighted user relies on
// (border, else the control's own background where it differs from its surroundings, else the
// icon glyph) must reach 3:1 against the effective background behind it. Self-contained.
function nonTextContrastInPage() {
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      parts.unshift(`${tag}:nth-child(${[...parent.children].indexOf(cur) + 1})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const parseColor = (s) => {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(s || "");
    if (!m) return null;
    let a = m[4] == null ? 1 : parseFloat(m[4]);
    if (m[4] && /%$/.test(m[4])) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a };
  };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const up = (n) => n.parentElement || (n.getRootNode && n.getRootNode().host) || null;
  // null when a background-image / gradient sits under the control before any opaque colour: the real background is unknown, not white
  const effectiveBg = (from) => {
    let out = { r: 255, g: 255, b: 255, a: 1 };
    const layers = [];
    for (let n = from; n && n.nodeType === 1; n = up(n)) {
      const ncs = getComputedStyle(n);
      if (ncs.backgroundImage && ncs.backgroundImage !== "none") return null;
      const c = parseColor(ncs.backgroundColor);
      if (c && c.a > 0) { layers.unshift(c); if (c.a >= 1) break; }
    }
    for (const l of layers) out = blend(l, out);
    return out;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let n = el; n && n.nodeType === 1; n = up(n)) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
    }
    return true;
  };
  // rendered text (a visually-hidden label still names the control, but the user sees only the icon)
  const hasVisibleText = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.data.trim()) continue;
      const p = n.parentElement;
      if (!p) continue;
      const r = p.getBoundingClientRect();
      if (r.width > 1 && r.height > 1 && getComputedStyle(p).fontSize !== "0px") return true;
    }
    return false;
  };
  const iconOf = (el) => el.querySelector("svg, img, i, [class*='icon'], [class*='fa-']");
  const iconColor = (icon, bg) => {
    // svg: fill, else stroke — of the svg or its first drawn shape; icon fonts: the text colour
    const pick = (node) => {
      const cs = getComputedStyle(node);
      const fill = parseColor(cs.fill), stroke = parseColor(cs.stroke);
      if (cs.fill !== "none" && fill && fill.a > 0) return { c: fill, prop: "fill" };
      if (cs.stroke !== "none" && stroke && stroke.a > 0 && (parseFloat(cs.strokeWidth) || 0) > 0) return { c: stroke, prop: "stroke" };
      return null;
    };
    if (icon.tagName.toLowerCase() === "svg") {
      // the glyph is the shape with the strongest contrast — a white/brand background rect drawn first is not the icon
      let best = null;
      const shapes = [...icon.querySelectorAll("path, circle, rect, polygon, polyline, line, ellipse, use")].slice(0, 40);
      for (const shape of shapes.length ? shapes : [icon]) {
        const got = pick(shape) || (shape === icon ? null : pick(icon));
        if (!got) continue;
        const color = got.c.a < 1 ? blend(got.c, bg) : got.c;
        const ratio = contrast(color, bg);
        if (!best || ratio > best.ratio) best = { color, prop: got.prop, ratio };
      }
      if (!best) { const got = pick(icon); if (!got) return null; best = { color: got.c.a < 1 ? blend(got.c, bg) : got.c, prop: got.prop }; }
      return { color: best.color, prop: best.prop };
    }
    if (icon.tagName.toLowerCase() === "img") return null; // bitmap — cannot read its colours
    const c = parseColor(getComputedStyle(icon).color);
    return c && c.a > 0 ? { color: c.a < 1 ? blend(c, bg) : c, prop: "color" } : null;
  };
  const roleOf = (el) => (el.getAttribute("role") || "").toLowerCase();
  const disabled = (el) => el.disabled || el.getAttribute("aria-disabled") === "true" || !!el.closest("fieldset:disabled, [aria-disabled='true']");
  const clsHas = (el, re) => typeof el.className === "string" && re.test(el.className);
  const TOGGLE_RE = /(^|[\s_-])(toggle|switch)(er)?([\s_-]|$)/i;
  const nameOf = (el) => (el.getAttribute("aria-label") || (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute("title") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);

  const sel = "input:not([type=hidden]), select, textarea, button, a[href], [role=textbox], [role=combobox], [role=checkbox], [role=radio], [role=switch], [role=button], [role=slider], [role=spinbutton], .toggle, .switch, [class*=toggle], [class*=switch]";
  const issues = [];
  const failed = new Set();
  let checked = 0, count = 0;
  for (const el of document.querySelectorAll(sel)) {
    if (count++ > 3000) break;
    if (el.closest(".__a11y_lens_overlay")) continue;
    const tag = el.tagName.toLowerCase();
    const role = roleOf(el);
    const isField = (/^(input|select|textarea)$/.test(tag) && !(tag === "input" && /^(button|submit|reset|image)$/.test(el.type || ""))) || /^(textbox|combobox|checkbox|radio|switch|slider|spinbutton)$/.test(role);
    const isToggle = role === "switch" || clsHas(el, TOGGLE_RE);
    const icon = iconOf(el);
    const isIconOnly = !isField && (tag === "button" || tag === "a" || role === "button") && !!icon && !hasVisibleText(el);
    if (!isField && !isToggle && !isIconOnly) continue;
    if (isToggle && !isField && !isIconOnly && hasVisibleText(el)) continue; // a labelled "toggle" panel, not a control
    if (!visible(el) || disabled(el)) continue;
    let inFailed = false;
    for (let n = up(el); n; n = up(n)) if (failed.has(n)) { inFailed = true; break; }
    if (inFailed) continue;
    checked++;
    const cs = getComputedStyle(el);
    const parent = up(el);
    const surround = effectiveBg(parent || el);
    if (!surround) continue; // a photo / gradient behind the control: the background is unknown, not white
    // WCAG 1.4.11 needs ONE visual indicator at 3:1 — measure every candidate (each visible border side, the fill, the icon glyph) and judge the best
    const cands = [];
    const ownBg = parseColor(cs.backgroundColor);
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      const bw = parseFloat(cs["border" + side + "Width"]) || 0, bc = parseColor(cs["border" + side + "Color"]);
      if (cs["border" + side + "Style"] !== "none" && bw > 0 && bc && bc.a > 0) cands.push({ kind: "border", prop: "border-color", color: bc.a < 1 ? blend(bc, surround) : bc, bg: surround });
    }
    if (ownBg && ownBg.a > 0 && hex(ownBg.a < 1 ? blend(ownBg, surround) : ownBg) !== hex(surround)) cands.push({ kind: "background", prop: "background-color", color: ownBg.a < 1 ? blend(ownBg, surround) : ownBg, bg: surround });
    if (icon) {
      const ibg = effectiveBg(el);
      const ic = ibg && iconColor(icon, ibg);
      if (ic) cands.push({ kind: "icon", prop: ic.prop, color: ic.color, bg: ibg });
    }
    if (!cands.length) continue; // native widget painting or a bitmap icon: nothing measurable
    for (const c of cands) c.ratio = Math.round(contrast(c.color, c.bg) * 100) / 100;
    const best = cands.sort((a, b) => b.ratio - a.ratio)[0];
    if (best.ratio >= 3) continue;
    const { kind, prop, color, bg, ratio } = best;
    failed.add(el);
    const what = kind === "border" ? "border" : kind === "background" ? "control background" : "icon";
    issues.push({
      code: "nontext-contrast", level: "serious", kind, prop, sel: cssPath(el), tag, role: role || (isField ? tag : tag === "a" ? "link" : "button"),
      name: nameOf(el), html: el.outerHTML.slice(0, 300), color: hex(color), bg: hex(bg), ratio,
      msgKey: "srMsgNontextContrast", msgArgs: [ratio.toFixed(2), kind, hex(color), hex(bg)],
      msg: `Non-text contrast ${ratio.toFixed(2)}:1 — ${what} ${hex(color)} on ${hex(bg)}; a control's boundary, state indicator or icon needs 3:1 (WCAG 1.4.11)`,
    });
    if (issues.length >= 300) break;
  }
  return { url: location.href, checked, issues };
}

function langCheckInPage() {
  const AR = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
  const LAT = /[A-Za-zÀ-ɏ]/g;
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      parts.unshift(`${tag}:nth-child(${[...parent.children].indexOf(cur) + 1})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const primary = (l) => (l || "").trim().toLowerCase().split(/[-_]/)[0];
  const VALID = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;
  const htmlLang = document.documentElement.getAttribute("lang") || "";
  const htmlDir = document.documentElement.getAttribute("dir") || "";
  const issues = [];
  let totalAr = 0, totalLat = 0;
  const seen = new Map(); // parent el -> agg
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|CODE|PRE|KBD|SAMP)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest(".__a11y_lens_overlay")) return NodeFilter.FILTER_REJECT;
      return n.data.trim().length >= 3 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  let n, count = 0;
  while ((n = walker.nextNode()) && count < 20000) {
    count++;
    const p = n.parentElement;
    if (!p.getClientRects().length) continue;
    const text = n.data;
    const ar = (text.match(AR) || []).length;
    const lat = (text.match(LAT) || []).length;
    totalAr += ar; totalLat += lat;
    const langEl = p.closest("[lang]");
    const declared = langEl ? primary(langEl.getAttribute("lang")) : "";
    let agg = seen.get(p);
    if (!agg) { agg = { ar: 0, lat: 0, words: 0, text: "", declared, sel: null, el: p, arRun: "", latRun: "" }; seen.set(p, agg); }
    agg.ar += ar; agg.lat += lat;
    agg.words += (text.trim().split(/\s+/).length);
    if (agg.text.length < 100) agg.text += " " + text.trim();
    // Script runs: a sentence fragment in the "other" script inside this node.
    if (!agg.latRun) {
      const m = text.match(/(?:[A-Za-zÀ-ɏ]{2,}[\s,.'’&-]*){2,}/g);
      const best = m && m.map((x) => x.trim()).sort((a, b) => b.length - a.length)[0];
      if (best && (best.match(LAT) || []).length >= 8) agg.latRun = best;
    }
    if (!agg.arRun) {
      const m = text.match(/(?:[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]{2,}[\s،.؛:]*){1,}/g);
      const best = m && m.map((x) => x.trim()).sort((a, b) => b.length - a.length)[0];
      if (best && (best.match(AR) || []).length >= 4) agg.arRun = best;
    }
  }
  const majority = totalAr > totalLat * 1.5 ? "ar" : totalLat > totalAr * 1.5 ? "latin" : "mixed";

  if (!htmlLang) {
    issues.push({ level: "critical", type: "html-lang-missing", sel: "html", snippet: "", declared: "", detected: majority,
      msg: "<html> has no lang attribute — the screen reader guesses the voice from the user's default (WCAG 3.1.1)" });
  } else if (!VALID.test(htmlLang)) {
    issues.push({ level: "serious", type: "html-lang-invalid", sel: "html", snippet: htmlLang, declared: htmlLang, detected: majority,
      msg: `lang="${htmlLang}" is not a valid BCP 47 tag — screen readers ignore it` });
  } else if (majority === "ar" && primary(htmlLang) !== "ar") {
    issues.push({ level: "critical", type: "html-lang-mismatch", sel: "html", snippet: "", declared: htmlLang, detected: "Arabic",
      msg: `page is mostly Arabic but lang="${htmlLang}" — the whole page is read with a ${htmlLang} voice` });
  } else if (majority === "latin" && primary(htmlLang) === "ar") {
    issues.push({ level: "critical", type: "html-lang-mismatch", sel: "html", snippet: "", declared: htmlLang, detected: "Latin",
      msg: `page is mostly Latin-script text but lang="ar" — read with an Arabic voice` });
  }
  if (majority === "ar" && htmlDir !== "rtl") {
    issues.push({ level: "serious", type: "html-dir", sel: "html", snippet: "", declared: htmlDir || "(none)", detected: "Arabic",
      msg: "page is mostly Arabic but <html> has no dir=\"rtl\" — punctuation and mixed numbers render out of order" });
  }
  for (const el of document.querySelectorAll("[lang]")) {
    const v = el.getAttribute("lang");
    if (el !== document.documentElement && v && !VALID.test(v)) {
      issues.push({ level: "moderate", type: "lang-invalid", sel: cssPath(el), snippet: v, declared: v, detected: "",
        msg: `lang="${v}" is not a valid BCP 47 tag` });
    }
  }
  const pageLang = primary(htmlLang);
  let runs = 0;
  for (const agg of seen.values()) {
    if (issues.length >= 120) break;
    const declared = agg.declared || pageLang;
    if (!declared) continue; // already reported: no lang anywhere
    const isArDeclared = declared === "ar" || declared === "fa" || declared === "ur";
    if (agg.arRun && !isArDeclared) {
      runs++;
      issues.push({ level: "serious", type: "text-mismatch", sel: cssPath(agg.el), html: agg.el.outerHTML.slice(0, 200), snippet: agg.arRun.slice(0, 90),
        declared, detected: "Arabic", msg: `Arabic text inside lang="${declared}" — read letter-by-letter or with the wrong voice; wrap it in an element with lang="ar"` });
    } else if (agg.latRun && isArDeclared) {
      runs++;
      issues.push({ level: "moderate", type: "text-mismatch", sel: cssPath(agg.el), html: agg.el.outerHTML.slice(0, 200), snippet: agg.latRun.slice(0, 90),
        declared, detected: "Latin", msg: `Latin-script text inside lang="${declared}" — pronounced with an Arabic voice; wrap it in lang="en" (or the right language)` });
    }
    if (agg.ar >= 4 && agg.ar > agg.lat) {
      const dir = getComputedStyle(agg.el).direction;
      if (dir === "ltr" && !agg.el.closest("[dir='auto']") && agg.words >= 3) {
        issues.push({ level: "minor", type: "dir", sel: cssPath(agg.el), html: agg.el.outerHTML.slice(0, 200), snippet: agg.text.trim().slice(0, 90),
          declared: "ltr", detected: "Arabic", msg: "Arabic sentence rendered left-to-right — add dir=\"rtl\" (or dir=\"auto\") so numbers and punctuation order correctly" });
      }
    }
  }
  return { url: location.href, htmlLang, htmlDir, majority, totals: { arabic: totalAr, latin: totalLat }, issues, mismatchedRuns: runs };
}

// Live-region monitor: logs what would be announced and what changed silently.
function liveInstallInPage() {
  if (window.__a11yLive) { try { window.__a11yLive.obs.disconnect(); } catch (_) {} try { window.__a11yLive.cleanup && window.__a11yLive.cleanup(); } catch (_) {} }
  const LIVE_SEL = "[aria-live],[role='status'],[role='alert'],[role='log'],[role='marquee'],[role='timer'],output";
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      parts.unshift(`${tag}:nth-child(${[...parent.children].indexOf(cur) + 1})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const state = { log: [], obs: null, start: Date.now(), silentCount: 0, announcedCount: 0, mutations: 0, cleanup: null };
  const now = () => Date.now() - state.start;
  const elOf = (n) => (n.nodeType === 1 ? n : n.parentElement);
  const isOurs = (el) => !!(el && el.closest && el.closest(".__a11y_lens_overlay,#__a11y_lens_style"));
  const regionOf = (n) => { const el = elOf(n); return el && el.closest ? el.closest(LIVE_SEL) : null; };
  const politeness = (region) => {
    const v = region.getAttribute("aria-live");
    if (v) return v;
    const r = region.getAttribute("role");
    if (r === "alert") return "assertive";
    return "polite";
  };
  const textOf = (el) => ((el.innerText != null ? el.innerText : el.textContent) || "").replace(/\s+/g, " ").trim().slice(0, 160);
  const push = (e) => { e.at = Date.now(); if (e.kind === "announced" || e.kind === "focused") state.announcedCount++; state.log.push(e); if (state.log.length > 400) state.log.shift(); }; // `at`: wall clock, so the panel can merge logs into one timeline
  const visible = (el) => el.getClientRects && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";

  const obs = new MutationObserver((muts) => {
    state.mutations += muts.length;
    if (window.__a11yLensMuted) return;
    const announced = new Map();
    const inserted = [];
    const removedTexts = new Set();
    const revealed = [];
    for (const m of muts) {
      if (m.type === "childList") {
        for (const r of m.removedNodes) {
          const t = r.nodeType === 3 ? r.data : (r.textContent || "");
          removedTexts.add(t.replace(/\s+/g, " ").trim().slice(0, 160));
        }
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1 && n.nodeType !== 3) continue;
          if (n.nodeType === 1 && isOurs(n)) continue;
          if (n.nodeType === 1) {
            let live = null;
            try { live = n.matches(LIVE_SEL) ? n : n.querySelector(LIVE_SEL); } catch (_) {}
            if (live && !regionOf(n.parentNode)) {
              const txt = textOf(live);
              const isAlert = live.getAttribute("role") === "alert";
              push({ t: now(), kind: isAlert ? "announced" : "risky", politeness: politeness(live), sel: cssPath(live), text: txt, html: live.outerHTML.slice(0, 200),
                note: isAlert ? "role=alert inserted with content — announced by most screen readers" :
                  "live region inserted at the same time as its content — most screen readers only announce changes to a region that already existed; render the empty region on load, then set its text" });
              continue;
            }
          }
          const region = regionOf(n.nodeType === 3 ? m.target : n.parentNode || m.target);
          if (region) { announced.set(region, true); continue; }
          if (n.nodeType === 1) inserted.push(n);
          else if (n.data.trim().length >= 3) inserted.push(m.target);
        }
      } else if (m.type === "characterData") {
        const region = regionOf(m.target);
        if (region) announced.set(region, true);
        else if (m.target.data.trim().length >= 3 && m.target.parentElement && !isOurs(m.target.parentElement)) inserted.push(m.target.parentElement);
      } else if (m.type === "attributes") {
        const el = m.target;
        if (el.nodeType !== 1 || isOurs(el)) continue;
        const old = m.oldValue || "";
        let wasHidden = false;
        if (m.attributeName === "hidden") wasHidden = m.oldValue !== null && !el.hasAttribute("hidden");
        else if (m.attributeName === "style") wasHidden = /display\s*:\s*none|visibility\s*:\s*hidden/.test(old) && !/display\s*:\s*none|visibility\s*:\s*hidden/.test(el.getAttribute("style") || "");
        else if (m.attributeName === "class") wasHidden = /\b(hidden|d-none|invisible|is-hidden|sr-only|collapse)\b/.test(old) && !/\b(hidden|d-none|invisible|is-hidden|sr-only|collapse)\b/.test(el.className || "");
        else if (m.attributeName === "aria-live" || m.attributeName === "role") {
          if (el.matches(LIVE_SEL) && textOf(el)) {
            push({ t: now(), kind: "risky", politeness: politeness(el), sel: cssPath(el), text: textOf(el), html: el.outerHTML.slice(0, 200), code: "live-late",
              note: "aria-live/role set on an element that already has content — the existing text is not announced; set the attribute first, change the text later" });
          }
          continue;
        }
        if (wasHidden) {
          const region = regionOf(el);
          if (region) announced.set(region, true); else revealed.push(el);
        }
      }
    }
    for (const region of announced.keys()) {
      push({ t: now(), kind: "announced", politeness: politeness(region), sel: cssPath(region), text: textOf(region) || "(region emptied)",
        atomic: region.getAttribute("aria-atomic") === "true" });
    }
    // Silent changes: visible new content outside any live region.
    const seen = new Set();
    const candidates = [];
    for (const el of [...inserted, ...revealed]) { if (el && el.isConnected && !seen.has(el)) { seen.add(el); candidates.push(el); } }
    if (!candidates.length) return;
    if (candidates.length > 200) {
      // A huge batch is a re-render whatever its contents — skip the quadratic containment pass and layout reads.
      if (now() >= 1500) push({ t: now(), kind: "rerender", sel: cssPath(candidates[0]), text: `${candidates.length} nodes changed at once`, note: "large re-render — probably a route change or list refresh; a screen reader stays where it was and hears nothing" });
      return;
    }
    const tops = candidates.filter((el) => !candidates.some((o) => o !== el && o.contains(el)));
    const fresh = [];
    for (const el of tops) {
      if (fresh.length > 25) break; // enough to classify as a re-render; stop forcing layout
      if (!visible(el)) continue;
      const txt = textOf(el);
      if (txt.length < 3) continue;
      if (removedTexts.has(txt)) continue; // re-render of identical content
      fresh.push(el);
    }
    if (!fresh.length) return;
    if (now() < 1500) return; // page still settling after monitor start
    if (fresh.length > 25) {
      push({ t: now(), kind: "rerender", sel: cssPath(fresh[0]), text: `${fresh.length} nodes changed at once`, note: "large re-render — probably a route change or list refresh; a screen reader stays where it was and hears nothing" });
      return;
    }
    for (const el of fresh.slice(0, 8)) {
      const entry = { t: now(), kind: "silent", sel: cssPath(el), text: textOf(el), tag: el.tagName.toLowerCase(), html: el.outerHTML.slice(0, 200) };
      push(entry);
      state.silentCount++;
      // If focus moves into the new content shortly after, screen readers will read it — downgrade.
      setTimeout(() => {
        const ae = document.activeElement;
        let modal = null;
        try { modal = el.matches("dialog,[role='dialog'],[role='alertdialog']") ? el : el.querySelector("dialog,[role='dialog'],[role='alertdialog']"); } catch (_) {}
        if (ae && ae !== document.body && el.contains(ae)) {
          entry.kind = "focused";
          entry.note = modal ? "dialog opened and focus moved inside — announced via focus" : "focus moved into the new content — announced via focus";
        } else if (modal) {
          entry.kind = "silent";
          entry.code = "dialog-no-focus";
          entry.note = "dialog appeared but focus did not move into it — screen reader users don't know it opened";
        } else if (!el.isConnected) {
          entry.code = "transient";
          entry.note = "transient (removed again quickly) — a toast or spinner; if it matters, it needs role=status";
        }
      }, 700);
    }
  });
  obs.observe(document.body, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ["hidden", "style", "class", "aria-live", "role"], attributeOldValue: true,
  });
  state.obs = obs;

  // Custom-control state watch: a click that only toggles a state class on the control (or an
  // ancestor card/tab) or shows/hides its aria-controls / next-sibling target, while none of the
  // control's aria-* state attributes changed → "state-not-announced" (the screen reader hears the
  // same "Select all, button" before and after). Judged 400 ms after the click.
  // Whole class tokens only (same vocabulary as the static pass): "active:bg-blue-800" or "text-on-primary" are not state.
  const STATE_WORDS = /^(is-|has-)?(active|selected|checked|on|current|expanded|open|collapsed)$|--(active|selected|checked|current|expanded|open|collapsed)$/i;
  const STATE_ATTRS = ["aria-pressed", "aria-selected", "aria-checked", "aria-expanded", "aria-current"];
  const stateWords = (el) => (el.getAttribute("class") || "").split(/\s+/).filter((w) => STATE_WORDS.test(w)).map((w) => w.toLowerCase()).sort().join(" ");
  // The next-sibling fallback only applies to controls that look like a disclosure; a Search button whose results box appears is not one.
  const DISCLOSURE_RE = /toggle|dropdown|accordion|expand|collapse|menu|filter|more|show|hide|options|advanced|details|المزيد|إظهار|إخفاء|خيارات|قائمة/i;
  const looksDisclosure = (c) => c.hasAttribute("aria-haspopup") || DISCLOSURE_RE.test((c.getAttribute("class") || "") + " " + (c.id || "") + " " + textOf(c).slice(0, 80));
  const ariaSnap = (el) => STATE_ATTRS.map((n) => el.getAttribute(n)).join("|");
  const onClick = (e) => {
    if (window.__a11yLensMuted) return;
    let el = (e.composedPath && e.composedPath()[0]) || e.target;
    if (!el || el.nodeType !== 1) el = el && el.parentElement;
    if (!el || isOurs(el)) return;
    const ctl = (el.closest && el.closest("button,[role],a,[tabindex],[onclick],summary,input,label")) || el;
    if (/^(input|select|textarea|option|summary|details|label)$/i.test(ctl.tagName)) return; // native state is announced by the browser
    const chain = [];
    for (let cur = ctl, i = 0; cur && cur !== document.body && i < 4; cur = cur.parentElement, i++) chain.push({ el: cur, cls: stateWords(cur), aria: ariaSnap(cur) });
    const targets = [];
    for (const id of (ctl.getAttribute("aria-controls") || "").split(/\s+/).filter(Boolean)) { const t = document.getElementById(id); if (t) targets.push({ t, vis: visible(t) }); }
    if (!targets.length && ctl.nextElementSibling && !isOurs(ctl.nextElementSibling) && looksDisclosure(ctl)) targets.push({ t: ctl.nextElementSibling, vis: visible(ctl.nextElementSibling) });
    setTimeout(() => {
      if (!ctl.isConnected || window.__a11yLensMuted) return;
      const changed = chain.find((c) => c.el.isConnected && stateWords(c.el) !== c.cls);
      const toggled = targets.find((x) => x.t.isConnected && visible(x.t) !== x.vis);
      if (!changed && !toggled) return;
      const owner = changed ? changed.el : ctl;
      if (chain.some((c) => c.el.isConnected && ariaSnap(c.el) !== c.aria)) return; // an aria state did change — announced
      const role = owner.getAttribute("role") || ctl.getAttribute("role") || "";
      const words = changed ? changed.cls + " " + stateWords(owner) : "";
      const attr = role === "tab" || role === "option" ? "aria-selected" : /^(checkbox|menuitemcheckbox|switch)$/.test(role) ? "aria-checked" :
        toggled && !changed ? "aria-expanded" : /\b(open|expanded|collapsed)\b/.test(words) ? "aria-expanded" :
        /\bcurrent\b/.test(words) || (owner.tagName === "A" && !toggled) ? "aria-current" : toggled ? "aria-expanded" : "aria-pressed";
      const label = textOf(ctl).slice(0, 40) || ctl.tagName.toLowerCase();
      const what = changed ? `class "${changed.cls || "(none)"}" → "${stateWords(owner) || "(none)"}"${owner !== ctl ? " on " + cssPath(owner) : ""}` : `${cssPath(toggled.t)} ${toggled.vis ? "hidden" : "shown"}`;
      push({ t: now(), kind: "silent", code: "state-not-announced", attr, sel: cssPath(owner), tag: owner.tagName.toLowerCase(), html: owner.outerHTML.slice(0, 200), text: label, target: toggled ? cssPath(toggled.t) : "",
        note: `click changed ${what} but no aria state changed — a screen reader user hears "${label}, ${role || owner.tagName.toLowerCase()}" exactly the same before and after; add ${attr}` });
      state.silentCount++;
    }, 400);
  };
  document.addEventListener("click", onClick, true);

  // SPA route changes: pushState/replaceState (wrapped), popstate, hashchange and a URL poll
  // (the wrap only sees calls from this world), plus <title> mutations. 1.5 s after the URL
  // changes we judge what a screen reader user got: a new title, focus moved, an announcement.
  const ROUTE_MS = 1500;
  const h1Of = () => { let h = null; try { h = document.querySelector("main h1") || document.querySelector("h1"); } catch (_) {} return h; };
  const shortUrl = (u) => { let s = ""; try { const x = new URL(u); s = (x.pathname + x.search + x.hash) || "/"; } catch (_) { s = String(u || ""); } return s.length > 60 ? "…" + s.slice(-57) : s; };
  const focusable = () => { let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement; return a && a !== document.body && a !== document.documentElement ? a : null; };
  const route = { url: location.href, title: document.title, h1: (() => { const h = h1Of(); return h ? textOf(h) : ""; })(), lastTitleChange: null, pending: null, poll: null };
  const settle = () => {
    const p = route.pending;
    if (!p) return;
    route.pending = null;
    const urlAfter = location.href;
    const titleAfter = document.title;
    const h1El = h1Of();
    const h1After = h1El ? textOf(h1El) : "";
    const ae = focusable();
    const focusMoved = p.focusMoved || !!(ae && ae !== p.focusBefore);
    const announced = state.announcedCount > p.announcedBefore;
    const changed = state.mutations > p.mutationsBefore;
    const titleChanged = titleAfter !== p.titleBefore;
    const h1Dup = !!h1After && h1After === p.h1Before;
    // soft: only the query string changed (sort / filter / pagination) or a hash router stayed on the same path via replaceState —
    // the same title and H1 are correct there; only a completely silent change is noted, as minor.
    const soft = !!p.soft;
    const base = { t: p.t, kind: "route", via: p.via, url: urlAfter, urlBefore: p.urlBefore, text: `${shortUrl(p.urlBefore)} → ${shortUrl(urlAfter)}`,
      titleBefore: p.titleBefore, titleAfter, h1Before: p.h1Before, h1After, focusMoved, announced, soft,
      focusTo: ae ? cssPath(ae) : "", sel: h1El ? cssPath(h1El) : "", html: h1El ? h1El.outerHTML.slice(0, 200) : "", tag: h1El ? "h1" : "" };
    if (!titleChanged && !focusMoved && !announced) {
      if (soft && !changed) { route.url = urlAfter; route.title = titleAfter; route.h1 = h1After; route.lastTitleChange = null; return; } // query changed, nothing re-rendered: nothing to announce
      push({ ...base, code: "route-silent", level: soft ? "minor" : "critical", noteKey: soft ? "srRouteNoteQuerySilent" : "srRouteNoteSilent", noteArgs: [],
        note: soft ? "the query string changed and content was re-rendered, but nothing was announced — say what changed (e.g. \"Page 2 of 10\", \"12 results\") in a live region"
          : "URL changed but the title stayed the same, focus did not move and nothing was announced — a screen reader user does not know the page changed" });
    } else {
      if (!titleChanged && !soft) push({ ...base, code: "route-title-stale", level: "serious", noteKey: "srRouteNoteTitleStale", noteArgs: [titleAfter], note: `document.title is still "${titleAfter || "(empty)"}" after the URL changed — the tab title and the first thing announced on a page change never update` });
      if (!focusMoved && changed) {
        const fb = p.focusBefore;
        const stale = !fb || !fb.isConnected || !visible(fb);
        let mid = false;
        if (!stale && !soft) { const r = fb.getBoundingClientRect(); mid = r.top > 0; }
        if (stale || mid) push({ ...base, sel: fb && fb.isConnected ? cssPath(fb) : base.sel, html: fb && fb.isConnected ? fb.outerHTML.slice(0, 200) : base.html, tag: fb ? fb.tagName.toLowerCase() : "", code: "route-focus-stuck", level: "moderate",
          noteKey: stale ? "srRouteNoteFocusStale" : "srRouteNoteFocusMid", noteArgs: [],
          note: stale ? "focus stayed on an element that is gone or hidden after the route change — the screen reader cursor is stranded" : "focus stayed mid-page on the control that triggered the navigation while the content above it was replaced — move focus to the new page's heading" });
      }
      if (titleChanged && focusMoved) push({ ...base, code: "route-ok", level: "info", noteKey: "srRouteNoteOk", noteArgs: [announced], note: "title changed and focus moved — a screen reader user hears the new page" + (announced ? " (and a live announcement)" : "") });
    }
    if (h1Dup && !soft) push({ ...base, code: "route-h1-dup", level: "moderate", noteKey: "srRouteNoteH1", noteArgs: [h1After.slice(0, 60)], note: `the H1 still reads "${h1After.slice(0, 60)}" on the new URL — every page/step needs its own H1` });
    route.url = urlAfter; route.title = titleAfter; route.h1 = h1After; route.lastTitleChange = null;
  };
  // In-page anchor (skip link, "Back to top" href="#", table of contents): same path + query, and the fragment is empty or names an element.
  // A hash router (#/services) has no such element and is judged like any other route change.
  const inPageAnchor = (a, b) => {
    if (a.pathname !== b.pathname || a.search !== b.search || a.hash === b.hash) return false;
    const frag = b.hash.replace(/^#/, "");
    if (!frag || frag === "top") return true;
    let id = frag; try { id = decodeURIComponent(frag); } catch (_) {}
    try { return !!(document.getElementById(id) || document.querySelector(`a[name="${CSS.escape(id)}"]`)); } catch (_) { return false; }
  };
  const onRoute = (via) => {
    if (location.href === route.url) return;
    if (route.pending) return; // a second change inside the window: judged together at settle
    let soft = false;
    try {
      const before = new URL(route.url), after = new URL(location.href);
      if (inPageAnchor(before, after)) { route.url = location.href; return; }
      soft = before.pathname === after.pathname && before.search !== after.search;
    } catch (_) {}
    const recent = route.lastTitleChange && Date.now() - route.lastTitleChange.at < ROUTE_MS;
    route.pending = { t: now(), via, soft, urlBefore: route.url, titleBefore: recent ? route.lastTitleChange.from : route.title, h1Before: route.h1,
      focusBefore: focusable(), focusMoved: false, announcedBefore: state.announcedCount, mutationsBefore: state.mutations };
    setTimeout(settle, ROUTE_MS);
  };
  const onFocusIn = (e) => {
    const p = route.pending;
    if (!p) return;
    const el = (e.composedPath && e.composedPath()[0]) || e.target;
    if (el && el.nodeType === 1 && el !== document.body && el !== p.focusBefore) p.focusMoved = true;
  };
  const onPop = () => setTimeout(() => onRoute("popstate"), 0);
  const onHash = () => setTimeout(() => onRoute("hashchange"), 0);
  const H = window.history, origPush = H.pushState, origReplace = H.replaceState;
  try {
    H.pushState = function () { const r = origPush.apply(this, arguments); onRoute("pushState"); return r; };
    H.replaceState = function () { const r = origReplace.apply(this, arguments); onRoute("replaceState"); return r; };
  } catch (_) {}
  window.addEventListener("popstate", onPop);
  window.addEventListener("hashchange", onHash);
  document.addEventListener("focusin", onFocusIn, true);
  route.poll = setInterval(() => onRoute("poll"), 250);
  let titleObs = null;
  try {
    titleObs = new MutationObserver(() => {
      if (route.pending) return;
      if (document.title === route.title) return;
      route.lastTitleChange = { at: Date.now(), from: route.title };
      route.title = document.title;
    });
    if (document.head) titleObs.observe(document.head, { childList: true, subtree: true, characterData: true });
  } catch (_) {}
  state.cleanup = () => {
    clearInterval(route.poll);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("popstate", onPop);
    window.removeEventListener("hashchange", onHash);
    document.removeEventListener("focusin", onFocusIn, true);
    try { if (H.pushState !== origPush) H.pushState = origPush; if (H.replaceState !== origReplace) H.replaceState = origReplace; } catch (_) {}
    try { titleObs && titleObs.disconnect(); } catch (_) {}
  };

  window.__a11yLive = state;
  const regions = [...document.querySelectorAll(LIVE_SEL)].map((el) => ({
    sel: cssPath(el), politeness: politeness(el), text: textOf(el),
    atomic: el.getAttribute("aria-atomic") === "true",
    relevant: el.getAttribute("aria-relevant") || "",
    hidden: !visible(el) && !/sr-only|visually-hidden/.test(el.className || ""),
  }));
  return { regions };
}

function liveDrainInPage() {
  const s = window.__a11yLive;
  if (!s) return null;
  return s.log.splice(0);
}

function liveStopInPage() {
  const s = window.__a11yLive;
  if (s) { try { s.obs.disconnect(); } catch (_) {} try { s.cleanup && s.cleanup(); } catch (_) {} }
  window.__a11yLive = null;
  return true;
}

// Focus trace: every focus move with the role/name the screen reader would announce,
// plus focus-loss and modal-escape detection that a static scan cannot see.
function focusInstallInPage() {
  if (window.__a11yFocus) return { already: true };
  const IMPLICIT = { a: "link", button: "button", input: "textbox", select: "combobox", textarea: "textbox",
    summary: "button", h1: "heading", h2: "heading", h3: "heading", h4: "heading", h5: "heading", h6: "heading",
    img: "img", nav: "navigation", main: "main", dialog: "dialog", iframe: "iframe", video: "video", audio: "audio" };
  const INPUT_ROLE = { checkbox: "checkbox", radio: "radio", button: "button", submit: "button", reset: "button",
    image: "button", range: "slider", number: "spinbutton", search: "searchbox", email: "textbox", tel: "textbox",
    url: "textbox", password: "textbox", text: "textbox", file: "button", color: "button", date: "textbox", time: "textbox" };
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) {
        const root = cur.getRootNode && cur.getRootNode();
        if (root && root.host) return cssPath(root.host) + " >>> " + [tag, ...parts].join(" > ");
        parts.unshift(tag); break;
      }
      parts.unshift(`${tag}:nth-child(${[...parent.children].indexOf(cur) + 1})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const txt = (s) => (s || "").replace(/\s+/g, " ").trim();
  const byIds = (el, attr) => {
    const ids = (el.getAttribute(attr) || "").split(/\s+/).filter(Boolean);
    const root = el.getRootNode ? el.getRootNode() : document;
    return ids.map((id) => { const r = (root.getElementById ? root.getElementById(id) : null) || document.getElementById(id); return r ? txt(r.textContent) : ""; }).filter(Boolean).join(" ");
  };
  const accName = (el) => {
    if (window.axe && window.axe.commons) {
      try { const n = txt(window.axe.commons.text.accessibleText(el)); if (n) return n; } catch (_) {}
    }
    let n = byIds(el, "aria-labelledby"); if (n) return n;
    n = txt(el.getAttribute("aria-label")); if (n) return n;
    if (el.labels && el.labels.length) { n = txt([...el.labels].map((l) => l.textContent).join(" ")); if (n) return n; }
    const tag = el.tagName.toLowerCase();
    if (tag === "img" || tag === "area") { n = txt(el.getAttribute("alt")); if (n) return n; }
    if (tag === "input" && /^(button|submit|reset)$/.test(el.type)) { n = txt(el.value); if (n) return n; }
    if (tag === "input" && el.type === "image") { n = txt(el.alt); if (n) return n; }
    if (tag === "iframe") { n = txt(el.title); if (n) return n; }
    if (!/^(input|select|textarea)$/.test(tag)) {
      n = txt(el.innerText != null ? el.innerText : el.textContent);
      if (!n) { const imgs = el.querySelectorAll("img[alt],svg title,[aria-label]"); n = txt([...imgs].map((i) => i.getAttribute("alt") || i.getAttribute("aria-label") || i.textContent).join(" ")); }
      if (n) return n.slice(0, 160);
    }
    n = txt(el.getAttribute("title")); if (n) return n;
    if (tag === "input") { n = txt(el.getAttribute("placeholder")); if (n) return n; }
    return "";
  };
  const roleOf = (el) => {
    const r = el.getAttribute("role");
    if (r) return r.split(/\s+/)[0];
    const tag = el.tagName.toLowerCase();
    if (tag === "input") return INPUT_ROLE[el.type] || "textbox";
    if (tag === "a" && !el.hasAttribute("href")) return "generic";
    return IMPLICIT[tag] || "generic";
  };
  const state = { log: [], start: Date.now(), lastEl: null, timer: null, handler: null, seq: 0, borders: new WeakMap() };
  const now = () => Date.now() - state.start;
  // ---- focus ring: what the sighted keyboard user sees (outline → box-shadow → border change) ----
  const parseColor = (s) => {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)/.exec(s || "");
    if (!m) return null;
    let a = m[4] == null ? 1 : parseFloat(m[4]);
    if (m[4] && /%$/.test(m[4])) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a };
  };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  const effectiveBg = (from) => {
    // walk up until a non-transparent background; page default is white
    // null when a background-image / gradient is hit first: the ring sits on a photo, contrast cannot be measured
    let out = { r: 255, g: 255, b: 255, a: 1 };
    const layers = [];
    for (let n = from; n && n.nodeType === 1; n = n.parentElement || (n.getRootNode && n.getRootNode().host) || null) {
      const ncs = getComputedStyle(n);
      if (ncs.backgroundImage && ncs.backgroundImage !== "none") return null;
      const c = parseColor(ncs.backgroundColor);
      if (c && c.a > 0) { layers.unshift(c); if (c.a >= 1) break; }
    }
    for (const l of layers) out = blend(l, out);
    return out;
  };
  const borderSig = (cs) => [cs.borderTopColor, cs.borderTopWidth, cs.borderTopStyle].join("|");
  const cacheBorder = (el) => { try { if (el && el.nodeType === 1 && el.isConnected && el !== document.body) state.borders.set(el, borderSig(getComputedStyle(el))); } catch (_) {} };
  const focusRing = (el, cs) => {
    let ring = null;
    const ow = parseFloat(cs.outlineWidth) || 0;
    // outline-style:auto is the browser's own dual-tone ring (always visible, ~2px): only its clipping can be wrong
    if (cs.outlineStyle !== "none" && ow > 0) ring = { kind: "outline", color: parseColor(cs.outlineColor), width: cs.outlineStyle === "auto" ? Math.max(ow, 2) : ow, offset: parseFloat(cs.outlineOffset) || 0, auto: cs.outlineStyle === "auto" };
    if (!ring && cs.boxShadow && cs.boxShadow !== "none") {
      // computed form: "rgb(r, g, b) 0px 0px 0px 3px[, ...]" — every layer; only ring-shaped ones (no x/y offset, spread or blur) count,
      // an elevation / inset drop shadow that is always there is not the focus indicator; the most visible ring wins
      const layers = cs.boxShadow.split(/,(?![^(]*\))/).map((x) => x.trim());
      let best = null;
      for (const layer of layers) {
        const color = parseColor(layer);
        const nums = (layer.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+(?=px)/g) || []).map(Number);
        const x = nums[0] || 0, y = nums[1] || 0, blur = nums[2] || 0, spread = nums[3] || 0;
        if (x !== 0 || y !== 0) continue;
        const inset = /\binset\b/.test(layer);
        const w = spread > 0 ? spread + blur / 2 : blur / 2;
        if (!(color && color.a > 0 && w > 0)) continue;
        const cand = { kind: "box-shadow", color, width: Math.round(w * 10) / 10, offset: inset ? -w : 0 };
        const bg = effectiveBg(inset ? el : (el.parentElement || (el.getRootNode && el.getRootNode().host) || el));
        cand.score = bg ? contrast(color.a < 1 ? blend(color, bg) : color, bg) : 0;
        if (!best || cand.score > best.score) best = cand;
      }
      ring = best;
    }
    if (!ring) {
      const before = state.borders.get(el);
      const nowSig = borderSig(cs);
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (before && before !== nowSig && cs.borderTopStyle !== "none" && bw > 0) ring = { kind: "border", color: parseColor(cs.borderTopColor), width: bw, offset: -bw };
    }
    if (!ring || !ring.color || ring.color.a === 0) return null;
    // contrast: the ring sits on the parent's background (outside the box) or on the element's own (inset / border)
    const bgEl = ring.offset < 0 ? el : (el.parentElement || (el.getRootNode && el.getRootNode().host) || el);
    const bg = effectiveBg(bgEl);
    if (bg) {
      const rc = ring.color.a < 1 ? blend(ring.color, bg) : ring.color;
      ring.contrast = Math.round(contrast(rc, bg) * 100) / 100;
      ring.bg = hex(bg);
      ring.color = hex(rc);
    } else { ring.contrast = null; ring.bg = null; ring.color = hex(ring.color); } // photo / gradient behind: measure by hand
    // clipping: an overflow-clipping ancestor whose box does not contain the element box expanded by the ring
    const extent = Math.max(0, ring.width + ring.offset);
    if (extent > 0) {
      const r = el.getBoundingClientRect();
      const need = { left: r.left - extent, top: r.top - extent, right: r.right + extent, bottom: r.bottom + extent };
      for (let n = el.parentElement || (el.getRootNode && el.getRootNode().host) || null; n && n !== document.body && n !== document.documentElement; n = n.parentElement || (n.getRootNode && n.getRootNode().host) || null) {
        const ncs = getComputedStyle(n);
        const ox = ncs.overflowX, oy = ncs.overflowY;
        const clips = (v) => /^(hidden|auto|scroll|clip)$/.test(v);
        if (!clips(ox) && !clips(oy)) continue;
        const b = n.getBoundingClientRect();
        const cutX = clips(ox) && (need.left < b.left - 0.5 || need.right > b.right + 0.5);
        const cutY = clips(oy) && (need.top < b.top - 0.5 || need.bottom > b.bottom + 0.5);
        if (cutX || cutY) { ring.clippedBy = { sel: cssPath(n), overflow: clips(ox) && clips(oy) && ox === oy ? ox : `${ox} ${oy}` }; break; }
      }
    }
    return ring;
  };
  const push = (e) => { e.at = Date.now(); state.log.push(e); if (state.log.length > 400) state.log.shift(); }; // `at`: wall clock, so the panel can merge logs into one timeline
  const deepActive = () => {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  };
  const record = (el, via) => {
    if (!el || el === state.lastEl && via !== "poll") return;
    state.lastEl = el;
    if (el === document.body || el === document.documentElement) {
      push({ t: now(), seq: state.seq++, sel: "body", tag: "body", role: "document", name: "", via, issues: [
        { level: "serious", code: "focus-lost", msg: "focus fell back to <body> — the previously focused element was removed or hidden; screen reader users are dumped at the top of the page" }] });
      return;
    }
    const langEl = el.closest && el.closest("[lang]");
    const lang = ((langEl ? langEl.getAttribute("lang") : document.documentElement.getAttribute("lang")) || "").trim().split(/[-_]/)[0].toLowerCase();
    const entry = { t: now(), seq: state.seq++, sel: cssPath(el), tag: el.tagName.toLowerCase(), role: roleOf(el), name: accName(el), via, lang, issues: [], html: el.outerHTML.slice(0, 200) };
    const stillFocused = el.isConnected && deepActive() === el;
    const st = [];
    const a = (n) => el.getAttribute(n);
    if (a("aria-expanded")) st.push("expanded=" + a("aria-expanded"));
    if (a("aria-checked")) st.push("checked=" + a("aria-checked")); else if (el.type === "checkbox" || el.type === "radio") st.push(el.checked ? "checked" : "not checked");
    if (a("aria-pressed")) st.push("pressed=" + a("aria-pressed"));
    if (a("aria-selected")) st.push("selected=" + a("aria-selected"));
    if (a("aria-invalid") && a("aria-invalid") !== "false") st.push("invalid");
    if (el.required || a("aria-required") === "true") st.push("required");
    if (el.disabled || a("aria-disabled") === "true") st.push("disabled");
    entry.states = st;
    if (entry.role === "generic") {
      entry.issues.push(entry.name
        ? { level: "serious", code: "clickable-no-role", msg: `focusable <${entry.tag}> with no role — the screen reader reads the text but never says it is a control` }
        : { level: "serious", code: "clickable-no-role", msg: "focused element has neither a role nor a name — silence, then nothing to act on" });
    } else if (!entry.name) {
      entry.issues.push({ level: "critical", code: "no-name", msg: `focused ${entry.role} has no accessible name — announced as just "${entry.role}"` });
    }
    if (el.closest("[aria-hidden='true']")) entry.issues.push({ level: "critical", code: "in-aria-hidden", msg: "focused element is inside aria-hidden=\"true\" — keyboard reaches it, screen reader announces nothing" });
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!stillFocused) { push(entry); return; } // transient focus (element removed / focus moved on) — name/role only
    if (!el.getClientRects().length || cs.visibility === "hidden" || cs.opacity === "0") entry.issues.push({ level: "serious", code: "invisible", msg: "focused element is invisible (display/visibility/opacity) — sighted keyboard users lose track" });
    else if (r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) {
      const skip = entry.role === "link" && /^#/.test(el.getAttribute("href") || "");
      entry.issues.push({ level: skip ? "minor" : "moderate", code: skip ? "skip-offscreen" : "offscreen", msg: skip ? "skip link is off-screen while focused — it should become visible on focus" : "focused element is off-screen — not scrolled into view" });
    }
    if (el.tabIndex > 0) entry.issues.push({ level: "moderate", code: "positive-tabindex", msg: `tabindex="${el.tabIndex}" — positive tabindex hijacks the natural order` });
    let modal = null;
    try { modal = document.querySelector("dialog[open],[role='dialog'][aria-modal='true'],[role='alertdialog'][aria-modal='true']"); } catch (_) {}
    if (modal && modal.getClientRects().length && !modal.contains(el)) entry.issues.push({ level: "critical", code: "modal-escape", msg: "focus escaped the open modal dialog — the dialog does not trap focus" });
    if (el.matches(":focus-visible")) {
      const ring = focusRing(el, cs);
      if (!ring) entry.issues.push({ level: "moderate", code: "no-focus-style", msg: "no outline, box-shadow or border change while focus-visible — check that a visible focus style exists (WCAG 2.4.7)" });
      else {
        entry.ring = { kind: ring.kind, color: ring.color, width: ring.width, offset: ring.offset, contrast: ring.contrast, bg: ring.bg };
        if (!ring.auto && ring.contrast != null && ring.contrast < 3) entry.issues.push({ level: "serious", code: "focus-ring-low-contrast", msgKey: "srMsgFocusRingLowContrast", msgArgs: [ring.kind, ring.color, ring.contrast.toFixed(1), ring.bg], msg: `focus ring (${ring.kind} ${ring.color}) has ${ring.contrast.toFixed(1)}:1 contrast against its background ${ring.bg} — needs 3:1 (WCAG 2.4.11 / 1.4.11)` });
        if (!ring.auto && ring.width < 2) entry.issues.push({ level: "minor", code: "focus-ring-thin", msgKey: "srMsgFocusRingThin", msgArgs: [ring.width, ring.kind], msg: `focus ring is only ${ring.width}px thick (${ring.kind}) — use at least 2px so it is noticed` });
        if (ring.clippedBy) entry.issues.push({ level: "moderate", code: "focus-ring-clipped", info: ring.clippedBy.sel, msgKey: "srMsgFocusRingClipped", msgArgs: [ring.clippedBy.overflow, ring.clippedBy.sel, ring.kind, ring.width + ring.offset], msg: `focus ring is cut off by an ancestor with overflow:${ring.clippedBy.overflow} (${ring.clippedBy.sel}) — the ${ring.kind} extends ${ring.width + ring.offset}px outside the element` });
      }
    }
    if (entry.role === "textbox" && !entry.issues.length && el.getAttribute("placeholder") && !el.labels?.length && !a("aria-label") && !a("aria-labelledby")) entry.issues.push({ level: "serious", code: "placeholder-only", msg: "text field is named by its placeholder only" });
    push(entry);
  };
  state.handler = (e) => {
    const target = (e.composedPath && e.composedPath()[0]) || e.target;
    if (!target || target.nodeType !== 1) return;
    setTimeout(() => record(target, state.walkVia || "event"), 30); // let :focus styles and scroll settle
  };
  document.addEventListener("focusin", state.handler, true);
  // remember each element's un-focused border so a border-colour-only focus style is still recognised as a ring
  state.outHandler = (e) => {
    const target = (e.composedPath && e.composedPath()[0]) || e.target;
    setTimeout(() => { if (deepActive() !== target) cacheBorder(target); }, 0);
  };
  document.addEventListener("focusout", state.outHandler, true);
  state.timer = setInterval(() => {
    if (!document.hasFocus()) return;
    const ae = deepActive();
    if (ae !== state.lastEl) {
      if (state.lastEl && state.lastEl !== document.body) cacheBorder(state.lastEl);
      if (ae === document.body && state.lastEl && !state.lastEl.isConnected) record(document.body, "poll");
      else if (ae === document.body) record(document.body, "poll");
      else if (ae) record(ae, "poll");
    }
  }, 300);
  state.lastEl = deepActive();
  try { // seed the un-focused border cache for the usual Tab stops (skipping whatever is focused now)
    const seeds = document.querySelectorAll("a[href],button,input,select,textarea,summary,[tabindex]");
    for (let i = 0; i < seeds.length && i < 1500; i++) if (seeds[i] !== state.lastEl) cacheBorder(seeds[i]);
  } catch (_) {}
  window.__a11yFocus = state;
  return { already: false };
}

function focusDrainInPage() {
  const s = window.__a11yFocus;
  if (!s) return null;
  return s.log.splice(0);
}

// Keyboard auto-walk: with the trace installed, move focus through the page in real Tab order
// (positive tabindex ascending, then DOM order, shadow roots flattened) and report the stops the
// keyboard cannot reach, order jumps and trap candidates. Async: executeScript awaits the promise.
async function focusWalkInPage(maxSteps) {
  const s = window.__a11yFocus;
  if (!s) return { error: "focus trace is not running" };
  const cap = Math.max(1, Math.min(400, Number(maxSteps) || 400));
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) {
        const root = cur.getRootNode && cur.getRootNode();
        if (root && root.host) return cssPath(root.host) + " >>> " + [tag, ...parts].join(" > ");
        parts.unshift(tag); break;
      }
      parts.unshift(`${tag}:nth-child(${[...parent.children].indexOf(cur) + 1})`);
      cur = parent;
    }
    return parts.join(" > ");
  };
  const txt = (x) => (x || "").replace(/\s+/g, " ").trim();
  const IMPLICIT = { a: "link", button: "button", input: "textbox", select: "combobox", textarea: "textbox", summary: "button", iframe: "iframe", dialog: "dialog" };
  const roleOf = (el) => {
    const r = el.getAttribute("role");
    if (r) return r.split(/\s+/)[0];
    const tag = el.tagName.toLowerCase();
    if (tag === "input") return /^(checkbox|radio|button|submit|reset)$/.test(el.type) ? (el.type === "checkbox" || el.type === "radio" ? el.type : "button") : "textbox";
    if (tag === "a" && !el.hasAttribute("href")) return "generic";
    return IMPLICIT[tag] || "generic";
  };
  const nameOf = (el) => {
    let n = txt(el.getAttribute("aria-label")); if (n) return n;
    if (el.labels && el.labels.length) { n = txt([...el.labels].map((l) => l.textContent).join(" ")); if (n) return n; }
    const tag = el.tagName.toLowerCase();
    if (tag === "img") return txt(el.getAttribute("alt"));
    if (tag === "input" && /^(button|submit|reset)$/.test(el.type)) return txt(el.value);
    if (!/^(input|select|textarea)$/.test(tag)) { n = txt(el.textContent); if (n) return n.slice(0, 160); }
    return txt(el.getAttribute("title")) || txt(el.getAttribute("placeholder")) || "";
  };
  // flattened DOM walk: light children in order, shadow trees inline at their host
  const all = [];
  const visit = (el) => {
    all.push(el);
    if (el.shadowRoot) for (const c of el.shadowRoot.children) visit(c);
    for (const c of el.children) visit(c);
  };
  for (const c of document.body ? document.body.children : []) visit(c);
  const pos = new Map();
  all.forEach((el, i) => pos.set(el, i));
  const candidates = all
    .filter((el) => el.tabIndex >= 0 && !el.disabled && !/^(html|body)$/i.test(el.tagName) && (el.hasAttribute("tabindex") || el.matches("a[href],area[href],button,input:not([type=hidden]),select,textarea,summary,iframe,audio[controls],video[controls],[contenteditable]:not([contenteditable=false])")))
    .sort((a, b) => ((a.tabIndex > 0 ? a.tabIndex : Infinity) - (b.tabIndex > 0 ? b.tabIndex : Infinity)) || (pos.get(a) - pos.get(b)));
  const deepActive = () => {
    let a = document.activeElement;
    while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;
    return a;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const whyUnreachable = (el) => {
    if (el.closest("[inert]")) return "inside an inert subtree";
    const cs = getComputedStyle(el);
    if (!el.getClientRects().length) return cs.display === "none" ? "display:none" : "not rendered (no box)";
    if (cs.visibility === "hidden") return "visibility:hidden";
    if (el.closest("[aria-hidden='true']")) return "inside aria-hidden=\"true\"";
    if (el.tagName.toLowerCase() === "iframe") return "focus moved into the frame document";
    return "focus() was refused by the browser";
  };
  const entry = (el, extra) => Object.assign({ t: Date.now() - s.start, sel: cssPath(el), tag: el.tagName.toLowerCase(), role: roleOf(el), name: nameOf(el), html: el.outerHTML.slice(0, 200), tabindex: el.tabIndex }, extra);
  const result = { candidates: candidates.length, steps: Math.min(cap, candidates.length), truncated: candidates.length > cap, reached: 0, unreachable: [], jumps: [], traps: [], widgets: [], probed: 0, probeCapped: false };

  // Custom widget keyboard probe (hints only): synthetic keys reach JS handlers but never native
  // activation, so a silent result means "verify by hand", not a proven failure.
  const PROBE_CAP = 40;
  const ARROW_ROLES = "tablist|radiogroup|listbox|menu|menubar|tree|grid";
  const ARROW_SEL = "[role='tablist'],[role='radiogroup'],[role='listbox'],[role='menu'],[role='menubar'],[role='tree'],[role='grid']";
  const POPUP_SEL = "[role='listbox'],[role='menu'],[role='dialog'],[role='grid'],dialog,[aria-expanded='true']";
  const probedContainers = new Set();
  const isVisible = (n) => n && n.isConnected && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== "hidden";
  const visiblePopups = () => new Set([...document.querySelectorAll(POPUP_SEL)].filter(isVisible));
  const stateOf = (root) => {
    const out = [];
    for (const n of [root, ...root.querySelectorAll("*")]) {
      for (const a of ["aria-selected", "aria-expanded", "aria-checked", "aria-activedescendant", "aria-pressed"]) if (n.hasAttribute(a)) out.push(a + "=" + n.getAttribute(a));
    }
    return out.join("|");
  };
  const KEYS = { ArrowRight: 39, ArrowDown: 40, ArrowLeft: 37, ArrowUp: 38, Enter: 13, " ": 32, Escape: 27 };
  // Names whose real activation must not be fired mid-audit (the probe runs real handlers on div/span buttons).
  const RISKY_NAME_RE = /\b(delete|remove|logout|log out|sign out|sign in|login|submit|send|pay|checkout|accept|agree|confirm|cancel|close|reject|decline)\b|حذف|إزالة|خروج|تسجيل|إرسال|دفع|موافق|قبول|إلغاء|إغلاق|رفض/i;
  const sendKey = (el, key) => {
    const code = key === " " ? "Space" : key;
    const init = { key, code, keyCode: KEYS[key], which: KEYS[key], bubbles: true, cancelable: true, composed: true };
    el.dispatchEvent(new KeyboardEvent("keydown", init));
    if (key === "Enter" || key === " ") el.dispatchEvent(new KeyboardEvent("keypress", init));
    el.dispatchEvent(new KeyboardEvent("keyup", init));
  };
  // press one key and report what it changed within 150 ms
  const press = async (el, key, scope) => {
    const focusBefore = deepActive(), stateBefore = stateOf(scope), popupsBefore = visiblePopups();
    let mutations = 0;
    const mo = new MutationObserver((list) => { mutations += list.length; });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    sendKey(el, key);
    await wait(150);
    mo.disconnect();
    const popupsAfter = visiblePopups();
    const opened = [...popupsAfter].filter((n) => !popupsBefore.has(n) && n !== el && n !== scope);
    const expandedNow = (el.getAttribute("aria-expanded") === "true" && stateBefore.indexOf("aria-expanded=true") < 0);
    const r = { key, focus: deepActive() !== focusBefore, aria: stateOf(scope) !== stateBefore, popup: opened.length > 0 || expandedNow, popups: opened, dom: mutations > 0 };
    r.changed = r.focus || r.aria || r.popup || r.dom;
    return r;
  };
  const changedWhat = (rs) => {
    const w = [];
    if (rs.some((r) => r.focus)) w.push("focus moved");
    if (rs.some((r) => r.aria)) w.push("aria state changed");
    if (rs.some((r) => r.popup)) w.push("popup opened");
    if (rs.some((r) => r.dom)) w.push("DOM changed");
    return w.join(", ");
  };
  const probeWidget = async (el) => {
    if (result.probed >= PROBE_CAP) { result.probeCapped = true; return; }
    const tag = el.tagName.toLowerCase();
    if (/^(select|textarea)$/.test(tag) || (tag === "input" && /^(date|time|datetime-local|month|week|submit|reset|image|radio|checkbox|file|color|range)$/.test(el.type)) || el.isContentEditable) return;
    if (tag === "button" && el.type === "submit" && el.form) return;
    const container = el.closest(ARROW_SEL);
    const role = roleOf(el);
    const arrowWidget = container && new RegExp("^(" + ARROW_ROLES + ")$").test(container.getAttribute("role").split(/\s+/)[0]) && !probedContainers.has(container) && !(tag === "input");
    // Only where native activation does not exist: a native <button>/<a href>/<input> trigger gets Enter/Space → click from the browser,
    // and an <input role="combobox"> autocomplete opens on typing — synthetic keys would flag both wrongly.
    const nativeActivation = tag === "button" || tag === "input" || (tag === "a" && el.hasAttribute("href")) || tag === "summary";
    const popupWidget = !nativeActivation && (role === "combobox" || (el.hasAttribute("aria-haspopup") && el.getAttribute("aria-haspopup") !== "false") || (role === "button" && /^(div|span)$/.test(tag)));
    if (!arrowWidget && !popupWidget) return;
    const inForm = !!el.closest("form");
    const risky = RISKY_NAME_RE.test(nameOf(el)) || el.hasAttribute("href") || el.hasAttribute("data-href");
    const activate = popupWidget && !inForm && !risky; // Enter inside a form could submit it; a "Delete"/"Logout" div must not be fired for real
    if (!arrowWidget && !activate) return;
    result.probed++;
    const scope = container && arrowWidget ? container : el;
    const refocus = async () => { if (deepActive() !== el) { try { el.focus({ preventScroll: true }); } catch (_) {} await wait(30); } };
    const widgetRole = arrowWidget ? container.getAttribute("role").split(/\s+/)[0] : role;
    let openedPopup = null;
    try {
      if (arrowWidget) {
        probedContainers.add(container);
        // both directions: a non-wrapping tablist on its last item, or an RTL widget, moves on ArrowLeft/ArrowUp only
        const rs = [];
        for (const k of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
          rs.push(await press(el, k, scope));
          await refocus();
          if (rs[rs.length - 1].changed) break;
        }
        const ok = rs.some((r) => r.changed);
        result.widgets.push(entry(el, { widget: widgetRole, container: cssPath(container), check: "arrow", keys: rs.map((r) => r.key), ok, changed: changedWhat(rs) }));
      }
      if (activate) {
        const rs = [];
        const keys = role === "combobox" || el.hasAttribute("aria-haspopup") ? ["Enter", " ", "ArrowDown"] : ["Enter", " "];
        for (const k of keys) {
          const r = await press(el, k, scope);
          rs.push(r);
          if (r.popup) { openedPopup = r; break; }
          await refocus();
        }
        const ok = rs.some((r) => r.changed);
        result.widgets.push(entry(el, { widget: widgetRole, check: "activate", keys: rs.map((r) => r.key), ok, changed: changedWhat(rs), haspopup: el.getAttribute("aria-haspopup") || "" }));
        if (openedPopup) {
          // Escape goes to whatever holds focus now (APG menus/listboxes handle it on the popup), then to the popup itself, then to the trigger
          const isOpen = () => openedPopup.popups.some(isVisible) || el.getAttribute("aria-expanded") === "true";
          const escTargets = [deepActive() || el, openedPopup.popups[0], el].filter((n, i, a) => n && a.indexOf(n) === i);
          let esc = null;
          for (const tgt of escTargets) { esc = await press(tgt, "Escape", scope); if (!isOpen()) break; }
          const stillOpen = isOpen();
          result.widgets.push(entry(el, { widget: widgetRole, check: "escape", keys: ["Escape"], ok: !stillOpen, changed: changedWhat([esc]) }));
        }
      }
    } finally {
      // always restore: Escape, blur, re-focus the original stop
      try { sendKey(deepActive() || el, "Escape"); } catch (_) {}
      const a = deepActive();
      if (a && a !== document.body && a !== el) { try { a.blur(); } catch (_) {} }
      await refocus();
    }
  };
  const origin = deepActive();
  const wasMuted = window.__a11yLensMuted;
  window.__a11yLensMuted = true;
  s.walkVia = "walk";
  try {
    let prev = null;
    for (const el of candidates.slice(0, cap)) {
      if (!el.isConnected) continue;
      try { el.focus({ preventScroll: false }); } catch (_) {}
      await wait(60);
      const active = deepActive();
      if (active !== el) {
        result.unreachable.push(entry(el, { reason: whyUnreachable(el) }));
        continue;
      }
      result.reached++;
      if (el.tabIndex === 0 && prev && pos.get(el) < pos.get(prev)) result.jumps.push(entry(el, { after: cssPath(prev), afterTabindex: prev.tabIndex }));
      const trapHost = el.closest("[onkeydown]") || el.closest("[role='dialog']:not([aria-modal='true']),[role='alertdialog']:not([aria-modal='true'])");
      if (trapHost && trapHost !== el) {
        const why = trapHost.hasAttribute("onkeydown") ? "inside a container with an onkeydown handler" : "inside role=\"dialog\" without aria-modal";
        if (!result.traps.some((x) => x.container === cssPath(trapHost))) result.traps.push(entry(el, { container: cssPath(trapHost), reason: why }));
      }
      await probeWidget(el);
      prev = el;
    }
    await wait(80); // let the trace's delayed focusin record settle
    if (origin && origin !== document.body && origin.isConnected) { try { origin.focus(); } catch (_) {} }
    else { const a = deepActive(); if (a && a !== document.body) a.blur(); }
    s.lastEl = deepActive(); // synchronously, so the poll does not report the walk's own blur as focus-lost
    await wait(60);
  } finally {
    s.walkVia = null;
    window.__a11yLensMuted = wasMuted;
  }
  return result;
}

function focusStopInPage() {
  const s = window.__a11yFocus;
  if (s) {
    try { document.removeEventListener("focusin", s.handler, true); } catch (_) {}
    try { document.removeEventListener("focusout", s.outHandler, true); } catch (_) {}
    clearInterval(s.timer);
  }
  window.__a11yFocus = null;
  return true;
}

/* ---------- browser accessibility tree via the debugger protocol (Chromium, opt-in) ---------- */

const AX_CSS_PATH_FN = `function () {
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) {
        const root = cur.getRootNode && cur.getRootNode();
        if (root && root.host) return cssPath(root.host) + " >>> " + [tag, ...parts].join(" > ");
        parts.unshift(tag); break;
      }
      parts.unshift(tag + ":nth-child(" + ([...parent.children].indexOf(cur) + 1) + ")");
      cur = parent;
    }
    return parts.join(" > ");
  };
  const el = this.nodeType === 1 ? this : this.parentElement;
  if (!el) return { sel: "", tag: "", cls: "", component: "" };
  let component = "";
  for (let cur = el; cur && cur.nodeType === 1 && !component; cur = cur.parentElement) {
    for (const c of cur.classList || []) if (c.startsWith("aegov-")) { component = c; break; }
  }
  return { sel: cssPath(el), tag: el.tagName.toLowerCase(), cls: [...el.classList].sort().join(" "), component };
}`;

async function axTreeViaDebugger(tabId) {
  if (!EXT.debugger || !EXT.permissions) {
    throw new Error("The browser accessibility tree needs the debugger API — Chromium only (Chrome, Edge, Brave).");
  }
  let has = false;
  try { has = await EXT.permissions.contains({ permissions: ["debugger"] }); } catch (_) {}
  if (!has) {
    let granted = false;
    try { granted = await EXT.permissions.request({ permissions: ["debugger"] }); } catch (_) {}
    if (!granted) throw new Error("permission-needed");
  }
  const target = { tabId };
  await EXT.debugger.attach(target, "1.3");
  const send = (method, params) => EXT.debugger.sendCommand(target, method, params || {});
  try {
    await send("Accessibility.enable");
    await send("DOM.enable");
    await send("DOM.getDocument", { depth: 0 });
    const { nodes } = await send("Accessibility.getFullAXTree");
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const val = (v) => (v && v.value != null ? v.value : v && v.type === "computedString" ? v.value : "");
    const INTERACTIVE = new Set(["link", "button", "checkbox", "radio", "textbox", "combobox", "listbox",
      "menuitem", "menuitemcheckbox", "menuitemradio", "option", "slider", "spinbutton", "switch", "tab",
      "searchbox", "treeitem", "ComboBox", "Link", "Button"]);
    const GENERIC = /^(click here|here|more|read more|learn more|details|link|button|image|icon|submit|go|see more|view more|click)$/i;
    const rows = [];
    const walk = (id, depth) => {
      const n = byId.get(id);
      if (!n || rows.length >= 1500) return;
      const role = String(val(n.role) || "").toLowerCase();
      const name = String(val(n.name) || "").replace(/\s+/g, " ").trim();
      if (!n.ignored && role && role !== "none" && role !== "generic" && role !== "rootwebarea" && role !== "inlinetextbox") {
        const props = {};
        for (const p of n.properties || []) props[p.name] = val(p.value);
        const states = Object.entries(props)
          .filter(([k, v]) => ["checked", "expanded", "pressed", "selected", "disabled", "required", "invalid", "readonly", "level", "focused", "hasPopup", "busy", "modal", "multiselectable", "current"].includes(k) && v !== false && v !== "false")
          .map(([k, v]) => (v === true || v === "true" ? k : `${k}=${v}`));
        const issues = [];
        const roleL = role.toLowerCase();
        if (INTERACTIVE.has(roleL) && !name) issues.push({ level: "critical", code: "no-name", msg: `${roleL} has no accessible name in the browser tree — announced as just "${roleL}"` });
        else if ((roleL === "link" || roleL === "button") && GENERIC.test(name)) issues.push({ level: "serious", code: "generic-name", msg: `generic name "${name}"` });
        if (roleL === "image" && !name) issues.push({ level: "serious", code: "img-no-name", msg: "image exposed with no name" });
        if (roleL === "heading" && !name) issues.push({ level: "serious", code: "empty-heading", msg: "empty heading" });
        if (props.focusable === true && roleL === "generic") issues.push({ level: "serious", code: "clickable-no-role", msg: "focusable generic — no role" });
        rows.push({ role: roleL === "statictext" ? "text" : roleL, name, depth, states, issues, backendDOMNodeId: n.backendDOMNodeId, sel: "", tag: "", cls: "", component: "",
          description: String(val(n.description) || "") });
      }
      const nextDepth = n.ignored ? depth : depth + 1;
      for (const c of n.childIds || []) walk(c, nextDepth);
    };
    const root = nodes.find((n) => !n.parentId) || nodes[0];
    if (root) walk(root.nodeId, 0);
    // Resolve CSS selectors for rows the user might want to highlight (cap for speed)
    let resolved = 0;
    for (const r of rows) {
      if (resolved >= 700) break;
      if (!r.backendDOMNodeId) continue;
      try {
        const { object } = await send("DOM.resolveNode", { backendNodeId: r.backendDOMNodeId });
        if (!object || !object.objectId) continue;
        const res = await send("Runtime.callFunctionOn", { objectId: object.objectId, functionDeclaration: AX_CSS_PATH_FN, returnByValue: true });
        const v = (res && res.result && res.result.value) || "";
        if (typeof v === "string") r.sel = v;
        else { r.sel = v.sel || ""; r.tag = v.tag || ""; r.cls = v.cls || ""; r.component = v.component || ""; }
        await send("Runtime.releaseObject", { objectId: object.objectId }).catch(() => {});
        resolved++;
      } catch (_) {}
    }
    const issues = rows.reduce((a, r) => a + r.issues.length, 0);
    return { rows, summary: { rows: rows.length, issues, total: nodes.length, ignored: nodes.filter((n) => n.ignored).length }, truncated: rows.length >= 1500 };
  } finally {
    try { await send("Accessibility.disable"); } catch (_) {}
    try { await EXT.debugger.detach(target); } catch (_) {}
  }
}

/* ---------- reflow / zoom test via the debugger protocol (Chromium, opt-in) ----------
   WCAG 1.4.10 Reflow / 1.4.4 Resize text: the tab is rendered at a 320 px viewport (what 400 %
   zoom on a 1280 px screen gives) and then, back at its normal width, with 200 % text;
   REFLOW_CHECK_FN runs in the page (Runtime.evaluate of a self-contained source string — no
   closures) and lists what breaks. A first pass at the normal width supplies the "already
   broken before zooming" keys so pre-existing overlaps / cut-offs are labelled and demoted. */

const REFLOW_CHECK_FN = `(function (opts) {
  const LIMIT = opts.limit || 322;
  const suffix = opts.suffix || "";
  const baseKeys = new Set(opts.baseKeys || []);
  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;
  if (!document.body) return { scrollWidth, clientWidth, innerHeight, checked: 0, controls: 0, findings: [], keys: [] };
  const cssPath = (el) => {
    const parts = [];
    let cur = el;
    for (let depth = 0; cur && cur.nodeType === 1 && depth < 6; depth++) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      if (tag === "body" || tag === "html") { parts.unshift(tag); break; }
      const parent = cur.parentElement;
      if (!parent) { parts.unshift(tag); break; }
      parts.unshift(tag + ":nth-child(" + ([...parent.children].indexOf(cur) + 1) + ")");
      cur = parent;
    }
    return parts.join(" > ");
  };
  const short = (el) => {
    let h = "";
    try { h = el.cloneNode(false).outerHTML; } catch (_) { h = "<" + el.tagName.toLowerCase() + ">"; }
    return h.length > 160 ? h.slice(0, 157) + "…" : h;
  };
  const SKIP = /^(script|style|link|meta|noscript|template|head|title|br|wbr|path|g|circle|rect|line|polygon|use|defs|symbol|clipPath|mask|stop|tspan)$/i;
  const styles = new Map();
  const cs = (el) => { let s = styles.get(el); if (!s) { s = getComputedStyle(el); styles.set(el, s); } return s; };
  const OVF = /^(hidden|clip|auto|scroll)$/;
  const HARD = /^(hidden|clip)$/;
  const box = (L, T, R, B) => (R - L > 0 && B - T > 0 ? { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T } : null);
  // the part of a box a user can actually see right now: its own rect cut down by every ancestor that
  // clips or scrolls its overflow (a collapsed accordion, a carousel track, a table-scroll wrapper), and
  // nothing at all under a display:none / opacity:0 ancestor. Fixed boxes escape their ancestors.
  const seen = new Map();
  const visRect = (el) => {
    if (seen.has(el)) return seen.get(el);
    let out = null;
    const s = cs(el);
    if (s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0") {
      const r = el.getBoundingClientRect();
      let L = r.left, T = r.top, R = r.right, B = r.bottom;
      for (let a = el.parentElement; a && a !== document.documentElement && a !== document.body && R > L && B > T; a = a.parentElement) {
        const as = cs(a);
        if (as.display === "none" || as.opacity === "0") { R = L; break; }
        if (s.position === "fixed") continue;
        const cx = OVF.test(as.overflowX), cy = OVF.test(as.overflowY);
        if (!cx && !cy) continue;
        const ar = a.getBoundingClientRect();
        if (cx) { L = Math.max(L, ar.left); R = Math.min(R, ar.right); }
        if (cy) { T = Math.max(T, ar.top); B = Math.min(B, ar.bottom); }
      }
      out = box(L, T, R, B);
    }
    seen.set(el, out);
    return out;
  };
  const visible = (el) => !!visRect(el);
  const all = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode(); n && all.length < 4000; n = walker.nextNode()) if (!SKIP.test(n.tagName)) all.push(n);
  const findings = [];
  const keys = [];
  const item = (code, level, el, extra) => Object.assign({ code: code + suffix, level, sel: cssPath(el), tag: el.tagName.toLowerCase(), html: short(el), name: (el.getAttribute("aria-label") || el.getAttribute("alt") || (el.textContent || "")).replace(/\\s+/g, " ").trim().slice(0, 60) }, extra || {});
  // 1. horizontal scrolling at 320 px: the top-most visible boxes that stick out of the viewport.
  //    Boxes inside a wrapper that scrolls / clips within the viewport are the wrapper's business
  //    (1.4.10 lets data tables, maps and code scroll in their own box); off-canvas drawers and a
  //    row of non-wrapping siblings are reported once, as the row.
  if (opts.horizontal !== false && scrollWidth > LIMIT) {
    const flagged = new Set();
    const sticksOut = (el) => { const r = visRect(el); return !!r && r.right > LIMIT; };
    // entirely outside the viewport because it (or an ancestor) is positioned / transformed there: a closed drawer, not page content
    const offCanvas = (el, r) => {
      if (r.left < clientWidth) return false;
      for (let a = el; a && a !== document.body; a = a.parentElement) if (/^(fixed|absolute)$/.test(cs(a).position) || cs(a).transform !== "none") return true;
      return false;
    };
    let n = 0;
    for (const el of all) {
      if (n >= 30) break;
      let skip = false;
      for (let a = el.parentElement; a && !skip; a = a.parentElement) if (flagged.has(a)) skip = true;
      if (skip) continue;
      const r = visRect(el);
      if (!r) continue;
      // two or more children on one line that stick out (nav items, cards, columns): the row is the cause
      const kids = [];
      for (const k of el.children) if (!SKIP.test(k.tagName) && sticksOut(k) && !offCanvas(k, visRect(k))) kids.push(visRect(k));
      const row = kids.length >= 2 && kids.some((a, i) => kids.some((b, j) => i !== j && a.top < b.bottom && b.top < a.bottom));
      if (!row && (r.right <= LIMIT || offCanvas(el, r))) continue;
      flagged.add(el);
      n++;
      const right = Math.round(row ? Math.max(r.right, ...kids.map((k) => k.right)) : r.right);
      const width = Math.round(row ? Math.max(r.width, el.scrollWidth) : r.width);
      findings.push(item("reflow-horizontal-scroll", "serious", el, { right, width, scrollWidth, limit: 320, row, msgKey: "srReflowMsg", msgArgs: ["reflow-horizontal-scroll", { right, width, scrollWidth, row }] }));
    }
  }
  // 2. text cut off: a box with its own text, wider content than box, and a hidden/clip overflow that
  //    hides the rest — its own, or an ancestor's when the text does not wrap. Boxes that scroll in
  //    place (overflow auto/scroll: <pre>, code, data cells) are not cut off.
  let clipped = 0;
  for (const el of all) {
    if (clipped >= 30) break;
    let hasText = false;
    for (const c of el.childNodes) if (c.nodeType === 3 && c.nodeValue.trim()) { hasText = true; break; }
    if (!hasText || !visible(el)) continue;
    if (el.clientWidth <= 2 || el.clientHeight <= 2) continue; // .sr-only / visually-hidden boxes clip on purpose
    if (el.scrollWidth <= el.clientWidth + 2) continue;
    const s = cs(el);
    if (/^(auto|scroll)$/.test(s.overflowX)) continue;
    const props = [];
    let cut = HARD.test(s.overflowX);
    if (cut) props.push("overflow: " + s.overflowX);
    if (/^(nowrap|pre)$/.test(s.whiteSpace)) props.push("white-space: " + s.whiteSpace);
    if (s.textOverflow === "ellipsis") props.push("text-overflow: ellipsis");
    if (!cut) {
      if (!/^(nowrap|pre)$/.test(s.whiteSpace)) continue;
      const full = el.getBoundingClientRect();
      const rtl = s.direction === "rtl";
      for (let a = el.parentElement; a && a !== document.documentElement && a !== document.body; a = a.parentElement) {
        const as = cs(a);
        if (!HARD.test(as.overflowX)) continue;
        const ar = a.getBoundingClientRect();
        if (rtl ? full.right - el.scrollWidth < ar.left - 2 : full.left + el.scrollWidth > ar.right + 2) { cut = true; props.unshift("overflow: " + as.overflowX + " on " + cssPath(a)); }
        break;
      }
      if (!cut) continue;
    }
    clipped++;
    const key = "clip|" + cssPath(el);
    keys.push(key);
    const base = baseKeys.has(key);
    findings.push(item("reflow-clipped-text", "moderate", el, { need: el.scrollWidth, box: el.clientWidth, props: props.join("; "), info: props.join("; "), base, msgKey: "srReflowMsg", msgArgs: ["reflow-clipped-text", { need: el.scrollWidth, box: el.clientWidth, props: props.join("; "), zoom: !!suffix, base }] }));
  }
  // 3. overlapping controls: visible focusable/interactive boxes whose visible rects intersect by > 20 % of
  //    the smaller one AND where the pointer really lands on the other control at one of the two centres
  //    (elementFromPoint) — an icon button sitting on the end of its input, or a favourite button on a
  //    stretched-link card, is layering on purpose and stays clickable.
  const CTRL = "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex], [role=button], [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], [role=menuitem], [role=option], [role=combobox], [role=slider]";
  const ctrls = [];
  const clipTo = (r, c) => box(Math.max(r.left, c.left), Math.max(r.top, c.top), Math.min(r.right, c.right), Math.min(r.bottom, c.bottom));
  for (const el of document.body.querySelectorAll(CTRL)) {
    if (ctrls.length >= 300) break;
    if (SKIP.test(el.tagName)) continue;
    const clip = visRect(el);
    if (!clip) continue;
    // per-line boxes: an inline link wrapped over two lines must not "overlap" the link that follows it
    const rects = [...el.getClientRects()].map((r) => clipTo(r, clip)).filter((r) => r && r.width >= 4 && r.height >= 4);
    if (!rects.length) continue;
    ctrls.push({ el, rects, clip, r0: el.getBoundingClientRect() });
  }
  const overlapPct = (A, B) => {
    let best = 0;
    for (const a of A) for (const b of B) {
      const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w <= 0 || h <= 0) continue;
      const smaller = Math.min(a.width * a.height, b.width * b.height);
      if (smaller > 0) best = Math.max(best, (w * h) / smaller);
    }
    return best;
  };
  const sx0 = scrollX, sy0 = scrollY;
  // is control y what the pointer hits at the centre of control x? (the window is scrolled so the point is on screen)
  const coveredBy = (x, y) => {
    // the centre in the current frame: the clipped rect was measured at the original scroll, so shift it by how far the box moved since
    const pt = () => { const r1 = x.el.getBoundingClientRect(); return [x.clip.left + x.clip.width / 2 + (r1.left - x.r0.left), x.clip.top + x.clip.height / 2 + (r1.top - x.r0.top)]; };
    let [px, py] = pt();
    if (px < 0 || py < 0 || px >= clientWidth || py >= innerHeight) { scrollTo(scrollX + px - clientWidth / 2, scrollY + py - innerHeight / 2); [px, py] = pt(); }
    const hit = document.elementFromPoint(px, py);
    return !!hit && (hit === y.el || y.el.contains(hit));
  };
  let overlaps = 0;
  for (let i = 0; i < ctrls.length && overlaps < 20; i++) {
    for (let j = i + 1; j < ctrls.length && overlaps < 20; j++) {
      const a = ctrls[i], b = ctrls[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ratio = overlapPct(a.rects, b.rects);
      if (ratio <= 0.2) continue;
      if (!coveredBy(a, b) && !coveredBy(b, a)) continue;
      overlaps++;
      const pct = Math.round(ratio * 100);
      const key = "overlap|" + cssPath(a.el) + "|" + cssPath(b.el);
      keys.push(key);
      const base = baseKeys.has(key);
      findings.push(item("reflow-overlap", base ? "moderate" : "serious", a.el, { sel2: cssPath(b.el), html2: short(b.el), pct, base, info: cssPath(b.el), msgKey: "srReflowMsg", msgArgs: ["reflow-overlap", { pct, sel2: cssPath(b.el), zoom: !!suffix, base }] }));
    }
  }
  if (scrollX !== sx0 || scrollY !== sy0) scrollTo(sx0, sy0);
  // 4. fixed bars taller than a quarter of the screen (on screen, not a dialog). Sticky boxes scroll
  //    with the content and are only counted when they sit at their stuck offset (a sticky header).
  let tall = 0;
  if (opts.horizontal !== false) for (const el of all) {
    if (tall >= 10) break;
    const s = cs(el);
    if (s.position !== "fixed" && s.position !== "sticky") continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height <= innerHeight * 0.25) continue;
    if (r.right <= 0 || r.left >= clientWidth || r.bottom <= 0 || r.top >= innerHeight) continue; // off-canvas drawer
    if (el.closest("dialog, [role=dialog], [role=alertdialog], [aria-modal=true], [inert]")) continue; // a full-screen dialog is the content
    if (s.position === "sticky" && (s.top === "auto" || Math.abs(r.top - parseFloat(s.top)) > 1)) continue;
    tall++;
    const pct = Math.round(r.height / innerHeight * 100);
    findings.push(item("reflow-fixed-too-tall", "moderate", el, { height: Math.round(r.height), pct, position: s.position, info: s.position + " " + Math.round(r.height) + "px", msgKey: "srReflowMsg", msgArgs: ["reflow-fixed-too-tall", { height: Math.round(r.height), pct, position: s.position, innerHeight }] }));
  }
  return { scrollWidth, clientWidth, innerHeight, checked: all.length, controls: ctrls.length, findings, keys };
})`;

// Every protocol round trip is bounded: a page paused at a breakpoint (the panel lives inside
// DevTools) or a hung Runtime.evaluate must not leave the tab at 320 px / 200 % text with the
// debugger attached — the deadline rejects, the finally block restores and detaches.
const REFLOW_STEP_MS = 15000;
const reflowDeadline = (p, what) => new Promise((resolve, reject) => {
  const tm = setTimeout(() => reject(new Error("The reflow test timed out (" + what + ") — is the page paused at a breakpoint? The page has been restored.")), REFLOW_STEP_MS);
  Promise.resolve(p).then((v) => { clearTimeout(tm); resolve(v); }, (e) => { clearTimeout(tm); reject(e); });
});

async function reflowTestViaDebugger(tabId) {
  if (!EXT.debugger || !EXT.permissions) {
    throw new Error("The reflow test needs the debugger API — Chromium only (Chrome, Edge, Brave).");
  }
  let has = false;
  try { has = await EXT.permissions.contains({ permissions: ["debugger"] }); } catch (_) {}
  if (!has) {
    let granted = false;
    try { granted = await EXT.permissions.request({ permissions: ["debugger"] }); } catch (_) {}
    if (!granted) throw new Error("permission-needed");
  }
  const target = { tabId };
  await reflowDeadline(EXT.debugger.attach(target, "1.3"), "attach");
  const send = (method, params) => reflowDeadline(EXT.debugger.sendCommand(target, method, params || {}), method);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const evalJs = async (expression) => {
    const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, timeout: REFLOW_STEP_MS - 1000 });
    if (res && res.exceptionDetails) throw new Error((res.exceptionDetails.exception && res.exceptionDetails.exception.description) || res.exceptionDetails.text || "reflow check failed in the page");
    return res && res.result ? res.result.value : undefined;
  };
  const shot = async (width, height) => {
    try {
      const r = await send("Page.captureScreenshot", { format: "jpeg", quality: 60, clip: { x: 0, y: 0, width, height, scale: 1 }, captureBeyondViewport: false });
      return r && r.data ? "data:image/jpeg;base64," + r.data : "";
    } catch (_) { return ""; }
  };
  const check = (o) => evalJs(REFLOW_CHECK_FN + "(" + JSON.stringify(o) + ")");
  const setFont = (v) => evalJs(`(function () { document.documentElement.style.fontSize = ${JSON.stringify(v)}; return document.documentElement.style.fontSize; })()`);
  let overridden = false, fontBefore = null;
  try {
    await send("Page.enable");
    const base = await evalJs(`({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, font: document.documentElement.style.fontSize || "" })`);
    const shotBase = await shot(Math.min(base.w || 1280, 1600), Math.min(base.h || 800, 1000));
    // what is already broken at the normal width (overlaps, cut-offs) is labelled "also at the normal viewport" and demoted
    const before = await check({ limit: Math.max(base.w || 1280, 322) + 2, suffix: "-base", horizontal: false });
    const baseKeys = before.keys || [];
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 800, deviceScaleFactor: 1, mobile: false });
    overridden = true;
    await sleep(300);
    const narrow = await check({ limit: 322, suffix: "", baseKeys });
    const shot320 = await shot(320, 800);
    // 1.4.4: 200 % text at the page's own width — the 320 px override goes first
    await send("Emulation.clearDeviceMetricsOverride");
    overridden = false;
    await sleep(200);
    fontBefore = base.font;
    await setFont("200%");
    await sleep(300);
    const zoom = await check({ limit: Math.max(base.w || 1280, 322) + 2, suffix: "-200", horizontal: false, baseKeys });
    await setFont(fontBefore);
    fontBefore = null;
    const findings = [...narrow.findings, ...zoom.findings];
    const counts = {};
    for (const f of findings) counts[f.code] = (counts[f.code] || 0) + 1;
    return {
      findings,
      summary: { baseWidth: base.w, baseHeight: base.h, baseScrollWidth: base.sw, scrollWidth: narrow.scrollWidth, scrollWidth200: zoom.scrollWidth, checked: narrow.checked, controls: narrow.controls, issues: findings.length, counts, preexisting: findings.filter((f) => f.base).length },
      shots: { base: shotBase, narrow: shot320 },
    };
  } finally {
    if (fontBefore !== null) { try { await setFont(fontBefore); } catch (_) {} }
    if (overridden) { try { await send("Emulation.clearDeviceMetricsOverride"); } catch (_) {} }
    try { await send("Page.disable"); } catch (_) {}
    try { await reflowDeadline(EXT.debugger.detach(target), "detach"); } catch (_) {}
  }
}

/* ---------- message router ---------- */

// "Recommended" preset: WCAG 2.2 AA + best practices + SR rules (heading order, landmarks,
// table headers and the experimental screen-reader rules are graded out of the box).
const DEFAULT_SETTINGS = { level: "wcag22aa", bestPractice: true, flowInterval: 4, lang: "en", framework: "html", mode: "a11y", dlsContrast: false, srRules: true, srRate: 1 };

// One-time migration: best practices used to default to off. Existing users keep every other
// stored value; only bestPractice is switched on once (bpMigrated marks it done so a later
// explicit "off" is respected).
async function settingsMigrated() {
  const stored = await EXT.storage.sync.get("settings");
  const s = stored.settings || {};
  if (s.bpMigrated) return s;
  const next = { ...s, bestPractice: true, bpMigrated: true };
  await EXT.storage.sync.set({ settings: next });
  return next;
}

// Per-URL screen reader snapshots ("sr:<url>") are capped so chrome.storage.local can't fill
// up with one entry per distinct href; the newest SR_STORE_MAX (by `at`) are kept.
const SR_STORE_MAX = 20;
async function srPruneStore(keep) {
  const all = await EXT.storage.local.get(null);
  const keys = Object.keys(all).filter((k) => k.startsWith("sr:") && k !== keep)
    .sort((a, b) => ((all[b] && all[b].at) || 0) - ((all[a] && all[a].at) || 0));
  const stale = keys.slice(SR_STORE_MAX - 1);
  if (stale.length) await EXT.storage.local.remove(stale);
}

// Bilingual comparison: load the other-language URL in a hidden background tab, run the
// reading-order and language checks there, and always close the tab again. One overall
// deadline covers load + axe + tree + language check so a script-blocking page can't hang the panel.
const SR_COMPARE_DEADLINE = 45000;
async function srCompareInTab(url) {
  if (!/^https?:\/\//i.test(url || "") && !/^file:/i.test(url || "")) throw new Error("Enter an http(s) URL to compare against");
  const tab = await EXT.tabs.create({ url, active: false });
  let deadline = null;
  try {
    return await Promise.race([
      srCompareInTabBody(tab, url),
      new Promise((_, reject) => { deadline = setTimeout(() => reject(new Error("Timed out after " + SR_COMPARE_DEADLINE / 1000 + " s comparing " + url)), SR_COMPARE_DEADLINE); }),
    ]);
  } finally {
    clearTimeout(deadline);
    try { await EXT.tabs.remove(tab.id); } catch (_) {}
  }
}

async function srCompareInTabBody(tab, url) {
  await new Promise((resolve, reject) => {
    let done = false;
    const finish = (err) => { if (done) return; done = true; clearTimeout(timer); EXT.tabs.onUpdated.removeListener(onUpdated); err ? reject(err) : resolve(); };
    const timer = setTimeout(() => finish(new Error("Timed out after 20 s loading " + url)), 20000);
    const onUpdated = (id, info) => { if (id === tab.id && info.status === "complete") finish(); };
    EXT.tabs.onUpdated.addListener(onUpdated);
    // in case the load already finished before the listener was attached
    EXT.tabs.get(tab.id).then((t) => { if (t && t.status === "complete" && t.url && !/^about:/.test(t.url)) finish(); }).catch(() => {});
  });
  await new Promise((r) => setTimeout(r, 400)); // let client-side rendering settle
  await EXT.scripting.executeScript({ target: { tabId: tab.id }, files: ["vendor/axe.min.js"] });
  const order = await exec(tab.id, srTreeInPage);
  if (!order || order.error) throw new Error((order && order.error) || "could not build the reading order of " + url);
  const lang = await exec(tab.id, langCheckInPage);
  return { url, order, lang };
}

async function exec(tabId, func, args, allFrames = false) {
  const results = await EXT.scripting.executeScript({
    target: { tabId, allFrames },
    func,
    args: args || [],
  });
  return results[0]?.result;
}

EXT.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    const { op, tabId } = msg;
    switch (op) {
      case "injectAxe":
        await EXT.scripting.executeScript({
          target: { tabId, allFrames: true },
          files: ["vendor/axe.min.js"],
        });
        return { result: true };
      case "runAxe":
        return { result: await exec(tabId, runAxeInPage, [msg.runOnly ?? null, msg.rules ?? null]) };
      case "highlight":
        return { result: await exec(tabId, highlightInPage, [msg.selector]) };
      case "highlightAll":
        return { result: await exec(tabId, highlightAllInPage, [msg.items]) };
      case "clearHighlights":
        await EXT.scripting.executeScript({ target: { tabId, allFrames: true }, func: clearInPage });
        return { result: true };
      case "domCount":
        return { result: await exec(tabId, () => document.querySelectorAll("*").length) };
      case "staleInstall":
        return { result: await exec(tabId, staleInstallInPage) };
      case "staleCheck":
        return { result: await exec(tabId, staleCheckInPage) };
      case "dlsCheck":
        return { result: await exec(tabId, dlsCheckInPage, [DLS_DATA]) };
      case "captureTab": {
        const tab = await EXT.tabs.get(tabId);
        const dataUrl = await EXT.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 75 });
        return { result: dataUrl };
      }
      case "dlsComponents":
        return { result: await exec(tabId, dlsComponentAuditInPage, [DLS_DATA]) };
      case "dlsHighlight":
        return { result: await exec(tabId, dlsHighlightInPage, [DLS_DATA]) };
      case "helper":
        if (!HELPERS[msg.name]) throw new Error("unknown helper: " + msg.name);
        return { result: await exec(tabId, HELPERS[msg.name]) };
      case "pickStart":
        return { result: await exec(tabId, pickStartInPage) };
      case "clickedCheck":
        return { result: await exec(tabId, () => {
          const v = window.__a11yLensClicked || null;
          window.__a11yLensClicked = null;
          return v;
        }) };
      case "pickCheck":
        return { result: await exec(tabId, pickCheckInPage) };
      case "applyFix":
        return { result: await exec(tabId, applyFixInPage, [msg.selector, msg.patch]) };
      case "undoFix":
        return { result: await exec(tabId, undoFixInPage, [msg.selector]) };
      case "applyFixAll":
        return { result: await exec(tabId, applyFixAllInPage, [msg.items]) };
      case "undoAll":
        return { result: await exec(tabId, undoAllInPage) };
      case "aiFix": {
        const { aiKey, aiModel } = await EXT.storage.local.get(["aiKey", "aiModel"]);
        if (!aiKey) throw new Error("No API key set — add one in Options");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": aiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: aiModel || "claude-opus-4-8",
            max_tokens: 1024,
            messages: [{ role: "user", content: msg.prompt }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error?.message || res.statusText);
        }
        const json = await res.json();
        return { result: json.content.filter((b) => b.type === "text").map((b) => b.text).join("") };
      }
      case "srTree":
        return { result: await exec(tabId, srTreeInPage) };
      case "langCheck":
        return { result: await exec(tabId, langCheckInPage) };
      case "nonTextContrast":
        return { result: await exec(tabId, nonTextContrastInPage) };
      case "srCompare":
        return { result: await srCompareInTab(msg.url) };
      case "srApply":
        return { result: await exec(tabId, srApplyInPage, [msg.selector, msg.patch]) };
      case "srUndo":
        return { result: await exec(tabId, srUndoInPage, [msg.selector]) };
      case "liveStart":
        return { result: await exec(tabId, liveInstallInPage) };
      case "liveDrain":
        return { result: await exec(tabId, liveDrainInPage) };
      case "liveStop":
        return { result: await exec(tabId, liveStopInPage) };
      case "focusStart":
        return { result: await exec(tabId, focusInstallInPage) };
      case "focusDrain":
        return { result: await exec(tabId, focusDrainInPage) };
      case "focusStop":
        return { result: await exec(tabId, focusStopInPage) };
      case "focusWalk":
        return { result: await exec(tabId, focusWalkInPage, [msg.maxSteps ?? 400]) };
      case "axTree":
        return { result: await axTreeViaDebugger(tabId) };
      case "axTreeAvailable":
        return { result: !!(EXT.debugger && EXT.permissions) };
      case "debuggerGranted": {
        if (!EXT.debugger || !EXT.permissions) return { result: false };
        try { return { result: !!(await EXT.permissions.contains({ permissions: ["debugger"] })) }; } catch (_) { return { result: false }; }
      }
      case "reflowTest":
        return { result: await reflowTestViaDebugger(tabId) };
      case "storeGet":
        return { result: (await EXT.storage.local.get(msg.key))[msg.key] ?? null };
      case "storeSet":
        await EXT.storage.local.set({ [msg.key]: msg.value });
        if (String(msg.key).startsWith("sr:")) await srPruneStore(msg.key);
        return { result: true };
      case "storeRemove":
        await EXT.storage.local.remove(msg.key);
        return { result: true };
      case "settingsGet":
        return { result: { ...DEFAULT_SETTINGS, ...(await settingsMigrated()) } };
      case "settingsSet": {
        const stored = await settingsMigrated();
        await EXT.storage.sync.set({ settings: { ...stored, ...msg.value } });
        return { result: true };
      }
      default:
        throw new Error("unknown op: " + op);
    }
  })()
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err?.message || String(err) }));
  return true; // keep the message channel open for the async response
});
