// A11y Miyar fix suggestions. Dependency-free; runs in browser and Node (no DOM used).
// Wrapped in an IIFE: the panel loads this as a classic script sharing the global
// scope with panel.js, and top-level helpers (e.g. contrastRatio) would collide.
(function () {

function parseTag(html) {
  const m = /^<\s*([a-zA-Z][\w-]*)/.exec(html || "");
  return m ? m[1].toLowerCase() : null;
}

function parseAttrs(html) {
  const attrs = {};
  const open = /^<\s*[a-zA-Z][\w-]*([^>]*)>/.exec(html || "");
  if (!open) return attrs;
  const re = /([a-zA-Z_:][-\w:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s"'>]+))?/g;
  let m;
  while ((m = re.exec(open[1]))) {
    const raw = m[2];
    let val = "";
    if (raw != null) {
      val = m[3] != null ? m[3] : m[4] != null ? m[4] : raw;
    }
    attrs[m[1].toLowerCase()] = val;
  }
  return attrs;
}

function setAttr(html, name, value) {
  const re = new RegExp("(\\s" + name + "\\s*=\\s*)(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "i");
  if (re.test(html)) return html.replace(re, '$1"' + value + '"');
  return html.replace(/^(<\s*[a-zA-Z][\w-]*)/, '$1 ' + name + '="' + value + '"');
}

function removeAttr(html, name) {
  const re = new RegExp("\\s" + name + "\\s*=\\s*(\"[^\"]*\"|'[^']*'|[^\\s>]+)", "i");
  return html.replace(re, "");
}

function selfClose(html, framework) {
  if (framework !== "react") return html;
  // JSX requires void elements to self-close
  return html.replace(/\s*\/?>\s*$/, " />").replace(/^(<[^>]*[^/\s])\s*>$/, "$1 />");
}

function firstOpenTag(html) {
  const m = /^<[^>]*>/.exec(html || "");
  return m ? m[0] : html || "";
}

// ---------- WCAG color math ----------

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(rgb) {
  return "#" + rgb.map(function (v) {
    const s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return s.length === 1 ? "0" + s : s;
  }).join("");
}

function relLuminance(rgb) {
  const c = rgb.map(function (v) {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relLuminance(rgb1);
  const l2 = relLuminance(rgb2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl(rgb) {
  const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(hsl) {
  const h = hsl[0], s = hsl[1], l = hsl[2];
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  function hue(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3) * 255];
}

// UAE DLS color tokens (hex -> token), generated from @aegov/design-system@3.0.7.
const DLS_COLORS = {"#f9f7ed":"aegold-50","#f2eccf":"aegold-100","#e6d7a2":"aegold-200","#d7bc6d":"aegold-300","#cba344":"aegold-400","#b68a35":"aegold-500","#92722a":"aegold-600","#7c5e24":"aegold-700","#6c4527":"aegold-800","#5d3b26":"aegold-900","#361e12":"aegold-950","#fef2f2":"aered-50","#fde4e3":"aered-100","#fdcdcb":"aered-200","#faaaa7":"aered-300","#f47a75":"aered-400","#ea4f49":"aered-500","#d83731":"aered-600","#b52520":"aered-700","#95231f":"aered-800","#7c2320":"aered-900","#430e0c":"aered-950","#f3faf4":"aegreen-50","#e4f4e7":"aegreen-100","#cae8cf":"aegreen-200","#a0d5ab":"aegreen-300","#6fb97f":"aegreen-400","#4a9d5c":"aegreen-500","#3f8e50":"aegreen-600","#2f663c":"aegreen-700","#2a5133":"aegreen-800","#24432b":"aegreen-900","#0f2415":"aegreen-950","#f7f7f7":"aeblack-50","#e1e3e5":"aeblack-100","#c3c6cb":"aeblack-200","#9ea2a9":"aeblack-300","#797e86":"aeblack-400","#5f646d":"aeblack-500","#4b4f58":"aeblack-600","#3e4046":"aeblack-700","#232528":"aeblack-800","#1b1d21":"aeblack-900","#0e0f12":"aeblack-950","#ffffff":"whitely-50","#fcfcfc":"whitely-100","#f2f2f2":"whitely-300","#ededed":"whitely-400","#e8e8e8":"whitely-500","#fffbeb":"camel-50","#fdf4c8":"camel-100","#fbe68c":"camel-200","#fad44f":"camel-300","#f8c027":"camel-400","#f29f10":"camel-500","#d67907":"camel-600","#b2550a":"camel-700","#904111":"camel-800","#773610":"camel-900","#441b04":"camel-950","#f8fafc":"slate-50","#f1f5f9":"slate-100","#e2e8f0":"slate-200","#cbd5e1":"slate-300","#94a3b8":"slate-400","#64748b":"slate-500","#475569":"slate-600","#334155":"slate-700","#1e293b":"slate-800","#0f172a":"slate-900","#020617":"slate-950","#fdf4ff":"fuchsia-50","#fae8ff":"fuchsia-100","#f5d0fe":"fuchsia-200","#f0abfc":"fuchsia-300","#e879f9":"fuchsia-400","#d946ef":"fuchsia-500","#c026d3":"fuchsia-600","#a21caf":"fuchsia-700","#86198f":"fuchsia-800","#701a75":"fuchsia-900","#4a044e":"fuchsia-950","#e7f5ff":"techblue-50","#d3edff":"techblue-100","#b0dbff":"techblue-200","#81c1ff":"techblue-300","#4f98ff":"techblue-400","#296cff":"techblue-500","#043dff":"techblue-600","#003cff":"techblue-700","#002dc2":"techblue-800","#0b32a4":"techblue-900","#071c5f":"techblue-950","#effaff":"seablue-50","#def3ff":"seablue-100","#b6eaff":"seablue-200","#76dbff":"seablue-300","#2bcaff":"seablue-400","#00abeb":"seablue-500","#0190d4":"seablue-600","#0173ab":"seablue-700","#00608d":"seablue-800","#065074":"seablue-900","#04334d":"seablue-950","#fef5ee":"desert-50","#fce9d8":"desert-100","#f9cfaf":"desert-200","#f5ac7c":"desert-300","#ef8048":"desert-400","#eb5f24":"desert-500","#e54b1d":"desert-600","#b73417":"desert-700","#922b1a":"desert-800","#762518":"desert-900","#3f100b":"desert-950"};

function contrastFix(failureSummary, palette) {
  if (typeof failureSummary !== "string") return null;
  const fgM = /foreground(?:\s+color)?:\s*(#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6})/i.exec(failureSummary);
  const bgM = /background(?:\s+color)?:\s*(#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6})/i.exec(failureSummary);
  const reqM = /ratio\s+of\s+(\d+(?:\.\d+)?)\s*:\s*1/i.exec(failureSummary);
  if (!fgM || !bgM) return null;
  const required = reqM ? parseFloat(reqM[1]) : 4.5;
  const fg = hexToRgb(fgM[1]);
  const bg = hexToRgb(bgM[1]);
  if (!fg || !bg) return null;
  // Palette mode: suggest the nearest token that passes, preferring the same
  // color family (e.g. aegold-600 -> aegold-700) so fixes stay on the design system.
  if (palette) {
    const entries = Object.entries(palette);
    const dist = (a, b) => {
      const pa = hexToRgb(a), pb = hexToRgb(b);
      return (pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2 + (pa[2] - pb[2]) ** 2;
    };
    const fgHex = rgbToHex(fg);
    let nearestTok = null, nd = Infinity;
    for (const [hex, tok] of entries) {
      const d = dist(hex, fgHex);
      if (d < nd) { nd = d; nearestTok = tok; }
    }
    const family = nearestTok ? nearestTok.split("-")[0] : null;
    const passing = entries.filter(([hex]) => contrastRatio(hexToRgb(hex), bg) >= required);
    if (passing.length) {
      const inFamily = passing.filter(([, tok]) => tok.split("-")[0] === family);
      const pool = inFamily.length ? inFamily : passing;
      let best = null, bd = Infinity;
      for (const [hex, tok] of pool) {
        const d = dist(hex, fgHex);
        if (d < bd) { bd = d; best = [hex, tok]; }
      }
      return {
        from: fgHex,
        to: best[0],
        bg: rgbToHex(bg),
        ratio: Math.round(contrastRatio(hexToRgb(best[0]), bg) * 100) / 100,
        required: required,
        token: best[1],
        fromToken: nd === 0 ? nearestTok : null,
      };
    }
    // no token passes on this background — fall through to the free search
  }

  const hsl = rgbToHsl(fg);
  // Move lightness toward the extreme opposite the background's luminance
  const endL = relLuminance(bg) > 0.5 ? 0 : 1;
  const colorAt = function (t) {
    return hslToRgb([hsl[0], hsl[1], hsl[2] + (endL - hsl[2]) * t]);
  };
  let result;
  if (contrastRatio(fg, bg) >= required) {
    result = fg;
  } else if (contrastRatio(colorAt(1), bg) < required) {
    result = colorAt(1);
  } else {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (contrastRatio(colorAt(mid), bg) >= required) hi = mid;
      else lo = mid;
    }
    // Rounding to 8-bit hex can dip below the threshold; nudge until it passes
    let t = hi;
    result = colorAt(t);
    while (t < 1 && contrastRatio(hexToRgb(rgbToHex(result)), bg) < required) {
      t = Math.min(1, t + 0.01);
      result = colorAt(t);
    }
  }
  const to = rgbToHex(result);
  return {
    from: rgbToHex(fg),
    to: to,
    bg: rgbToHex(bg),
    ratio: Math.round(contrastRatio(hexToRgb(to), bg) * 100) / 100,
    required: required
  };
}

// ---------- Fix suggestions ----------

function suggestFix(ruleId, node, framework, opts) {
  framework = framework || "html";
  const dlsPalette = opts && opts.dlsPalette;
  const html = (node && node.html) || "";
  const attrs = parseAttrs(html);
  const target = (node && node.target && node.target[0]) || "";

  switch (ruleId) {
    case "image-alt": {
      const withAlt = selfClose(setAttr(firstOpenTag(html), "alt", "DESCRIBE_IMAGE"), framework);
      const empty = selfClose(setAttr(firstOpenTag(html), "alt", ""), framework);
      return {
        snippet: withAlt + "\n\n<!-- If purely decorative, use an empty alt instead: -->\n" + empty,
        note: "Add an alt attribute. Replace DESCRIBE_IMAGE with a short description of the image; use alt=\"\" only if the image is decorative."
      };
    }
    case "input-image-alt": {
      return {
        snippet: selfClose(setAttr(firstOpenTag(html), "alt", "DESCRIBE_ACTION"), framework),
        note: "Image inputs need an alt describing the action. Replace DESCRIBE_ACTION (e.g. \"Search\")."
      };
    }
    case "label": {
      const tag = firstOpenTag(html);
      const forAttr = framework === "react" ? "htmlFor" : "for";
      if (attrs.id) {
        return {
          snippet: "<label " + forAttr + '="' + attrs.id + '">LABEL_TEXT</label>\n' + selfClose(tag, framework),
          note: "Associate a visible label via " + forAttr + '="' + attrs.id + '". Replace LABEL_TEXT. Alternatively add aria-label to the control.'
        };
      }
      return {
        snippet: "<label>LABEL_TEXT " + selfClose(tag, framework) + "</label>\n\n<!-- Or without a visible label: -->\n" + selfClose(setAttr(tag, "aria-label", "LABEL_TEXT"), framework),
        note: "Wrap the control in a <label>, or add aria-label. Replace LABEL_TEXT with the field's purpose."
      };
    }
    case "button-name": {
      const tag = firstOpenTag(html);
      return {
        snippet: tag + "BUTTON_TEXT</button>\n\n<!-- Or, for icon-only buttons: -->\n" + setAttr(tag, "aria-label", "BUTTON_TEXT") + "</button>",
        note: "Give the button an accessible name: visible inner text, or aria-label for icon-only buttons. Replace BUTTON_TEXT."
      };
    }
    case "link-name": {
      const tag = firstOpenTag(html);
      return {
        snippet: tag + "LINK_TEXT</a>\n\n<!-- Or, for icon-only links: -->\n" + setAttr(tag, "aria-label", "LINK_TEXT") + "</a>",
        note: "Give the link discernible text: visible inner text, or aria-label for icon-only links. Replace LINK_TEXT with the destination."
      };
    }
    case "html-has-lang": {
      return {
        snippet: '<html lang="en">',
        note: "Declare the page language on the <html> element. Change \"en\" if the page is in another language."
      };
    }
    case "document-title": {
      return {
        snippet: "<head>\n  <title>PAGE_TITLE</title>\n</head>",
        note: "Add a descriptive <title> inside <head>. Replace PAGE_TITLE with the page's purpose."
      };
    }
    case "frame-title": {
      return {
        snippet: setAttr(firstOpenTag(html), "title", "FRAME_TITLE") + "</iframe>",
        note: "Add a title attribute describing the frame's content. Replace FRAME_TITLE."
      };
    }
    case "select-name": {
      const tag = firstOpenTag(html);
      const forAttr = framework === "react" ? "htmlFor" : "for";
      if (attrs.id) {
        return {
          snippet: "<label " + forAttr + '="' + attrs.id + '">LABEL_TEXT</label>\n' + html,
          note: "Associate a label with the select via " + forAttr + ". Replace LABEL_TEXT."
        };
      }
      return {
        snippet: setAttr(tag, "aria-label", "LABEL_TEXT") + "...</select>",
        note: "Add aria-label (or a wrapping <label>) naming the select. Replace LABEL_TEXT."
      };
    }
    case "color-contrast": {
      const fix = contrastFix(node && node.failureSummary, dlsPalette);
      if (!fix) {
        return {
          snippet: "/* Increase the contrast between text and background to meet WCAG. */",
          note: "Could not parse the exact colors; darken the text or lighten the background until the contrast ratio passes."
        };
      }
      const sel = target || "SELECTOR";
      let snippet, note;
      if (fix.token) {
        const cssLine = "color: var(--color-" + fix.token + "); /* " + fix.to + ", was " + fix.from + " */";
        if (framework === "react") {
          snippet = '/* Tailwind (DLS plugin): */\nclassName="text-' + fix.token + '"\n\n/* Or in CSS: */\n' + sel + " {\n  " + cssLine + "\n}";
        } else {
          snippet = "/* Tailwind (DLS plugin): */  class=\"text-" + fix.token + "\"\n\n" + sel + " {\n  " + cssLine + "\n}";
        }
        note = "Use the UAE DLS token " + fix.token + " (" + fix.to + ", contrast " + fix.ratio + ":1 on " + fix.bg + ", required " + fix.required + ":1)" +
          (fix.fromToken ? " — the current color is " + fix.fromToken + ", one step up the same ramp passes." : " — nearest passing token to the current color.");
      } else {
        if (framework === "react") {
          snippet = 'style={{ color: "' + fix.to + '" }}\n\n/* Or in CSS: */\n' + sel + " {\n  color: " + fix.to + "; /* was " + fix.from + " */\n}";
        } else {
          snippet = sel + " {\n  color: " + fix.to + "; /* was " + fix.from + " */\n}";
        }
        note = "Change the text color from " + fix.from + " to " + fix.to + " (contrast " + fix.ratio + ":1 on " + fix.bg + ", required " + fix.required + ":1). Same hue, adjusted lightness.";
      }
      return { snippet: snippet, note: note };
    }
    case "heading-order": {
      const tag = parseTag(html);
      const level = tag && /^h([1-6])$/.exec(tag);
      const n = level ? parseInt(level[1], 10) : null;
      return {
        snippet: html,
        note: (n ? "This <h" + n + "> skips a heading level. " : "") + "Heading levels must descend one at a time (h1 -> h2 -> h3). Change this heading to be exactly one level below the previous heading in the document, or restructure preceding headings."
      };
    }
    case "duplicate-id":
    case "duplicate-id-active": {
      if (!attrs.id) return { snippet: html, note: "Ensure every id attribute on the page is unique." };
      return {
        snippet: setAttr(firstOpenTag(html), "id", attrs.id + "-unique"),
        note: 'The id "' + attrs.id + '" is used more than once. Rename this occurrence (e.g. "' + attrs.id + '-unique") and update any for/aria-labelledby/href references.'
      };
    }
    case "area-alt": {
      return {
        snippet: selfClose(setAttr(firstOpenTag(html), "alt", "DESCRIBE_AREA"), framework),
        note: "Each <area> needs alt text describing its link target. Replace DESCRIBE_AREA."
      };
    }
    case "aria-hidden-focus": {
      const tag = firstOpenTag(html);
      return {
        snippet: setAttr(tag, "tabindex", "-1") + "\n\n<!-- Or, if the element should be visible to assistive tech: -->\n" + removeAttr(tag, "aria-hidden"),
        note: 'An aria-hidden element must not be focusable. Add tabindex="-1" (and to focusable descendants), or remove aria-hidden="true".'
      };
    }
    case "meta-viewport": {
      const content = attrs.content || "width=device-width, initial-scale=1";
      const cleaned = content
        .split(",")
        .map(function (p) { return p.trim(); })
        .filter(function (p) { return !/^user-scalable\s*=/i.test(p) && !/^maximum-scale\s*=/i.test(p); })
        .join(", ");
      return {
        snippet: selfClose('<meta name="viewport" content="' + cleaned + '">', framework),
        note: "Remove user-scalable=no and maximum-scale so users can zoom the page."
      };
    }
    default:
      return null;
  }
}

function previewPatch(ruleId, node, opts) {
  switch (ruleId) {
    case "image-alt":
    case "area-alt":
      return { attrs: { alt: "Description placeholder" }, styles: {} };
    case "label":
    case "button-name":
    case "link-name":
    case "select-name":
      return { attrs: { "aria-label": "Description placeholder" }, styles: {} };
    case "color-contrast": {
      const fix = contrastFix(node && node.failureSummary, opts && opts.dlsPalette);
      if (!fix) return null;
      return { attrs: {}, styles: { color: fix.to } };
    }
    case "aria-hidden-focus":
      return { attrs: { tabindex: "-1" }, styles: {} };
    case "html-has-lang":
      return { attrs: { lang: "en" }, styles: {} };
    default:
      return null;
  }
}

// ---------- Markdown report ----------

function issuesMarkdown(report, manualResults, opts, srResults) {
  const lines = [];
  const violations = (report && report.violations) || [];
  const counts = {};
  let total = 0;
  violations.forEach(function (v) {
    const n = v.nodeTotal || (v.nodes ? v.nodes.length : 0);
    counts[v.impact || "unknown"] = (counts[v.impact || "unknown"] || 0) + n;
    total += n;
  });

  lines.push("# Accessibility Report");
  lines.push("");
  lines.push("- **Page:** " + (report && report.url || "unknown"));
  lines.push("- **Scanned:** " + (report && report.scannedAt || "unknown"));
  lines.push("- **Rule set:** " + (report && report.ruleSet || "default"));
  lines.push("- **Violations:** " + violations.length + " rules, " + total + " elements");
  const order = ["critical", "serious", "moderate", "minor"];
  const byImpact = order
    .filter(function (k) { return counts[k]; })
    .map(function (k) { return counts[k] + " " + k; })
    .join(", ");
  if (byImpact) lines.push("- **By impact:** " + byImpact);
  lines.push("");

  violations.forEach(function (v) {
    lines.push("## " + v.id + ": " + (v.help || v.description || ""));
    lines.push("");
    lines.push("- **Impact:** " + (v.impact || "unknown"));
    if (v.helpUrl) lines.push("- **Reference:** " + v.helpUrl);
    if (v.description) lines.push("- **Description:** " + v.description);
    lines.push("");
    lines.push("### Affected elements");
    lines.push("");
    (v.nodes || []).forEach(function (node) {
      const sel = (node.target || []).join(" ");
      lines.push("`" + sel + "`");
      lines.push("");
      lines.push("```html");
      lines.push(node.html || "");
      lines.push("```");
      if (node.failureSummary) {
        lines.push("");
        lines.push("> " + node.failureSummary.replace(/\n/g, "\n> "));
      }
      lines.push("");
    });
    const first = (v.nodes || [])[0];
    const fix = first ? suggestFix(v.id, first, "html", opts) : null;
    if (fix) {
      lines.push("### Suggested fix");
      lines.push("");
      lines.push(fix.note);
      lines.push("");
      lines.push("```html");
      lines.push(fix.snippet);
      lines.push("```");
      lines.push("");
    }
    lines.push("### Checklist");
    lines.push("");
    (v.nodes || []).forEach(function (node) {
      lines.push("- [ ] Fix `" + (node.target || []).join(" ") + "`");
    });
    lines.push("");
  });

  const fails = (manualResults || []).filter(function (m) { return m.verdict === "fail"; });
  if (fails.length) {
    lines.push("## Manual check failures");
    lines.push("");
    fails.forEach(function (m) {
      lines.push("### " + m.title + (m.wcag ? " (" + m.wcag + ")" : ""));
      lines.push("");
      (m.findings || []).forEach(function (f) {
        lines.push("- [ ] " + (f.finding || "") + (f.selector ? " — `" + f.selector + "`" : "") + (f.note ? " — " + f.note : ""));
      });
      lines.push("");
    });
  }

  const srFindingsList = srFindings(srResults);
  if (srFindingsList.length) {
    lines.push("## Screen reader findings");
    lines.push("");
    lines.push("- **Findings:** " + srFindingsList.length + " (from the Screen reader tab: reading order, live regions, focus, language" + (srResults.journey ? ", journey" : "") + (srResults.bilingual ? ", bilingual comparison" : "") + ")");
    lines.push("");
    srFindingsList.forEach(function (f) {
      lines.push("### " + f.title);
      lines.push("");
      lines.push("- **Impact:** " + f.level);
      lines.push("- **Source:** " + f.sectionLabel);
      lines.push("");
      lines.push("**Problem:** " + f.msg);
      lines.push("");
      lines.push("**Element:** " + (f.sel ? "`" + f.sel + "`" : "(page)") + (f.instances > 1 ? " — " + f.instances + " identical instances" : ""));
      if (f.instances > 1 && f.selectors.length > 1) {
        lines.push("");
        f.selectors.forEach(function (sel) { lines.push("- `" + sel + "`"); });
      }
      if (f.html) {
        var htmlFence = mdFence(f.html);
        lines.push("");
        lines.push(htmlFence + "html");
        lines.push(f.html);
        lines.push(htmlFence);
      }
      if (f.fix) {
        lines.push("");
        lines.push("**Fix:**" + (f.fix.framework && f.fix.framework !== "html" ? " (" + f.fix.framework + ")" : ""));
        lines.push("");
        var fixFence = mdFence(f.fix.snippet || "");
        lines.push(fixFence + (f.fix.framework === "react" ? "jsx" : f.fix.framework === "vue" ? "vue" : "html"));
        lines.push(f.fix.snippet || "");
        lines.push(fixFence);
        if (f.fix.note) {
          lines.push("");
          lines.push(f.fix.note);
        }
      }
      lines.push("");
      lines.push("**How to verify:** " + f.verify);
      lines.push("");
      lines.push("- [ ] Fix " + (f.sel ? "`" + f.sel + "`" : f.sectionLabel));
      lines.push("");
    });
  }

  return lines.join("\n");
}

// ---------- Screen reader findings (Screen reader tab export -> tickets) ----------

// srVerifyStep(code, ctx) -> one-line manual verification step for a screen reader finding.
// ctx: { name, role, text, sel, snippet, declared, detected }
function srVerifyStep(code, ctx) {
  ctx = ctx || {};
  var role = ctx.role || "control";
  var name = ctx.name ? "'" + ctx.name + "'" : "'<name>'";
  var text = ctx.text ? "'" + String(ctx.text).slice(0, 50) + "'" : "the update";
  var snip = ctx.snippet ? "'" + String(ctx.snippet).slice(0, 40) + "'" : "the wrapped span";
  var sel = ctx.sel ? String(ctx.sel).slice(0, 80) : "";
  switch (code) {
    case "no-name":
      return "Tab to the control; expected announcement: " + name + ", " + role + ".";
    case "img-no-name":
      return "Arrow to the image with the screen reader; expected: the alt text (or nothing at all if decorative).";
    case "empty-heading":
      return "Press H to jump between headings; every stop must announce a heading with text.";
    case "generic-name":
    case "dup-name":
      return "Open the links/buttons list (VoiceOver rotor / NVDA elements list); every entry must be unique and say where it goes.";
    case "placeholder-only":
      return "Tab into the field and type; the label must still be announced and stay visible after typing.";
    case "title-only":
      return "Tab to the control; expected announcement: " + name + ", " + role + " (title tooltips are not announced reliably).";
    case "label-in-name":
      return "With voice control say 'click " + (ctx.name ? ctx.name : "<visible text>") + "'; the control must activate.";
    case "long-name":
      return "Tab to the control; the announcement must be short (under ~60 characters) with details in the description.";
    case "not-focusable":
    case "clickable-no-role":
    case "a-no-href":
      return "Tab through the page; the control must receive focus, be announced as " + (code === "a-no-href" ? "link or button" : "button") + ", and activate with Enter/Space.";
    case "tabindex-neg":
    case "positive-tabindex":
    case "order-jump":
      return "Tab through the page from the top; focus must follow the visual/DOM order with no jumps.";
    case "dup-landmark":
      return "Open the landmarks list (VoiceOver rotor / NVDA D key); each landmark must have a distinct name.";
    case "hidden-focusable":
    case "in-aria-hidden":
      return "Tab through the page; focus must never land on an element the screen reader does not announce.";
    case "focus-lost":
      return "Delete the item; focus must land on the next item or heading (never on <body>).";
    case "modal-escape":
      return "Tab from the last control in the dialog; focus must wrap inside the dialog. Escape must close it and return focus to the opener.";
    case "dialog-no-focus":
      return "Open the dialog; focus and the announcement must move to its title or first control.";
    case "no-focus-style":
      return "Tab to the control; a visible focus ring must appear.";
    case "focus-ring-low-contrast":
      return "Tab to the control; the focus ring must be clearly visible against the surrounding background (at least 3:1 — check with the contrast picker).";
    case "focus-ring-thin":
      return "Tab to the control; the focus ring must be at least 2px thick and visible on a high-DPI screen at arm's length.";
    case "focus-ring-clipped":
      return "Tab to the control; the whole focus ring must be visible on all four sides, not cut off by its container.";
    case "invisible":
    case "offscreen":
    case "skip-offscreen":
      return "Tab to the element; it must be visible on screen while focused.";
    case "unreachable":
      return "Tab through the page; the control must be reachable (or be removed from the Tab sequence if it is meant to be hidden).";
    case "possible-trap":
      return "Tab and Shift+Tab at both ends of the container and press Escape; focus must be able to leave it.";
    case "widget-no-arrow-nav":
      return "Tab into the " + (ctx.info || "widget") + " and press the arrow keys; focus (or the selection) must move between the items and the screen reader must announce each one.";
    case "widget-no-enter-space":
      return "Tab to the control and press Enter, then Space; it must activate (open the picker / menu) exactly as a mouse click does.";
    case "widget-esc-no-close":
      return "Open the popup from the keyboard and press Escape once; it must close and return focus to the control that opened it.";
    case "state-missing":
    case "state-not-announced": {
      var st = { "aria-expanded": "'expanded' / 'collapsed'", "aria-selected": "'selected'", "aria-checked": "'checked' / 'not checked'", "aria-current": "'current'", "aria-pressed": "'pressed' / 'not pressed'" }[ctx.attr] || "the new state (pressed / selected / expanded / checked)";
      return "Activate the control with a screen reader running; expect " + st + " announced on the control itself after every toggle.";
    }
    case "required-not-exposed":
      return "Tab to the field; the announcement must end with 'required' (and the asterisk must be explained once above the form).";
    case "readonly-misuse":
      return "Tab to the field; it must not be announced as 'read only', and typing a value (plus the picker button) must work.";
    case "stepper-no-state":
      return "Arrow through the stepper; expect 'Step 2 of N, current step' on the active step and 'completed' on finished ones.";
    case "group-no-label":
      return "Tab into the first option; the screen reader must announce the group name (legend / aria-label) before 'checkbox' or 'radio button'.";
    case "question-not-associated":
      return "Open the buttons list and Tab to 'Yes'/'No'; the question must be announced with the button (group name or its label/description).";
    case "label-not-associated":
      return "Tab to the field; the announcement must be the visible label text" + (ctx.info ? " ('" + String(ctx.info).replace(/[:*]+\s*$/, "") + "')" : "") + ", and clicking the label must focus the field.";
    case "link-new-window":
      return "Tab to the link; the announcement must include 'opens in a new tab' (or 'new window') before Enter is pressed.";
    case "link-download-hint":
      return "Tab to the link; the announcement must name the file type" + (ctx.info ? " ('" + ctx.info + "')" : "") + " and size, e.g. " + name + ", PDF, 2 MB, link.";
    case "link-external-hint":
      return "Tab to the link; the announcement must say 'external' (or the destination site) so the user knows they are leaving.";
    case "link-as-button":
      return ctx.info === "current" ? "Open the links list; the current breadcrumb/pagination item must not be listed as a link and must announce 'current page'."
        : "Tab to the control; it must be announced as 'button' (or as a link with a real destination), never as 'same page link', and Enter must not scroll to the top.";
    case "silent":
      return "Trigger the update with a screen reader running; expect " + text + " announced without moving focus.";
    case "risky":
    case "live-late":
      return "Reload the page, then trigger the update with NVDA and VoiceOver; " + text + " must be announced on the first try.";
    case "rerender":
      return "Trigger the refresh/route change with a screen reader running; expect a short summary announced and focus on the new heading.";
    case "route-silent":
      return "Navigate to the route with NVDA/VoiceOver running; expect the new page title (or a 'Navigated to …' status) announced and focus on the new heading.";
    case "route-title-stale":
      return "Navigate to the route; the browser tab title must change to the new page's name (Insert+T in NVDA reads it).";
    case "route-h1-dup":
      return "Navigate to the route and press H (or 1); the first heading must name this page/step, not the previous one.";
    case "route-focus-stuck":
      return "Navigate to the route, then press Tab once; focus must continue from the new page's heading, not from mid-page.";
    case "transient":
      return "Trigger the message with a screen reader running; it must be announced and stay on screen long enough to read.";
    case "quiet":
      return "Repeat the step with a screen reader running; a status must be announced within a few seconds.";
    case "html-lang-missing":
    case "html-lang-invalid":
    case "html-lang-mismatch":
      return "Reload with VoiceOver/NVDA; the page must be read with the " + (ctx.detected === "Arabic" || ctx.detected === "ar" ? "Arabic" : ctx.detected === "Latin" || ctx.detected === "latin" ? "English" : "correct") + " voice from the first line.";
    case "html-dir":
    case "dir":
      return "Read a line with numbers and punctuation; the visual order must be correct for right-to-left text.";
    case "text-mismatch":
    case "lang-invalid":
      return "Read the sentence with VoiceOver/NVDA; the voice must switch for " + snip + ".";
    case "nontext-contrast":
      return "Check the " + (ctx.info || "control's border, background or icon") + " with a contrast picker against the surrounding background; it must reach 3:1 (also in every state: hover, checked, focused).";
    case "reflow-horizontal-scroll":
      return "Zoom to 400% (Ctrl/⌘ and +) or narrow the window to 320 px — no horizontal scrollbar, no clipped text, controls do not overlap; " + (sel || "the element") + " must fit inside the viewport (a data table may scroll inside its own box only).";
    case "reflow-clipped-text":
    case "reflow-clipped-text-200":
      return "Zoom to 400% (Ctrl/⌘ and +) and set the browser's text size to 200% — every word in " + (sel || "the element") + " must be readable: nothing cut off, no ellipsis without a way to the full text, no clipped text, no horizontal scrollbar.";
    case "reflow-overlap":
    case "reflow-overlap-200":
      return "Zoom to 400% (Ctrl/⌘ and +) and set text size to 200% — no horizontal scrollbar, no clipped text, controls do not overlap: " + (sel || "the control") + " and " + (ctx.info || "the other control") + " must both be fully visible and clickable.";
    case "reflow-fixed-too-tall":
      return "Zoom to 400% (Ctrl/⌘ and +) on a laptop screen — the fixed bar " + (sel || "") + " must leave most of the screen for content and every part of the page must still scroll into view; no horizontal scrollbar, no clipped text, controls do not overlap.";
    case "cmp-missing":
      return "Open both language versions; the " + role + " must exist and be reachable on each.";
    case "cmp-live":
      return "Trigger the update on both language versions; it must be announced on each.";
    case "cmp-unnamed":
      return "Tab to the control on both language versions; each must announce a name in its own language.";
    case "cmp-landmark":
      return "Open the landmarks list on both language versions; the landmark must be named on each.";
    case "cmp-headings":
      return "Press H through both language versions; the heading structure must match.";
    case "cmp-html-lang":
    case "cmp-same-lang":
      return "Reload each language version with a screen reader; each must be read with its own language voice.";
    case "cmp-html-dir":
      return "Check the Arabic version; numbers and punctuation must be laid out right-to-left.";
    default:
      return "Re-run the Screen reader tab check after the fix; the finding must no longer appear.";
  }
}

var SR_SECTION_LABEL = { order: "Reading order", live: "Live regions", focus: "Focus trace", lang: "Language", ntc: "Non-text contrast", reflow: "Reflow & zoom", journey: "Journey", cmp: "Bilingual comparison", ax: "Browser accessibility tree" };

function srLevelOf(item) {
  if (item.level) return item.level;
  var first = item.issues && item.issues[0];
  var m = first && /^(critical|serious|moderate|minor)\s*:/.exec(first);
  return m ? m[1] : "moderate";
}

// A fence longer than any backtick run in the content, so page markup can't close the block.
function mdFence(content) {
  var longest = 0;
  String(content || "").replace(/`+/g, function (m) { if (m.length > longest) longest = m.length; return m; });
  return "`".repeat(Math.max(3, longest + 1));
}

function srShortMsg(msg) {
  msg = String(msg || "").replace(/\s+/g, " ").trim();
  var cut = msg.split(/ — |: /)[0];
  if (cut.length < 12) cut = msg;
  return cut.length > 90 ? cut.slice(0, 87) + "…" : cut;
}

function srTitle(section, item, msg) {
  var who = item.role ? item.role + (item.name ? " \"" + String(item.name).slice(0, 40) + "\"" : "") : "";
  return "[SR] " + srShortMsg(msg) + (who ? " — " + who : "") + (item.instances > 1 ? " (×" + item.instances + ")" : "");
}

// srFindings(srResults) -> flat list of ticket-ready findings from srResultsForExport():
// { section, sectionLabel, code, level, title, msg, sel, html, role, name, instances, selectors, fix, verify }
function srFindings(sr) {
  if (!sr || typeof sr !== "object") return [];
  var out = [];
  var seen = {};
  var strip = function (s) { return String(s || "").replace(/^(critical|serious|moderate|minor)\s*:\s*/, ""); };
  var add = function (section, code, item, msg) {
    var f = {
      section: section, sectionLabel: SR_SECTION_LABEL[section] || section, code: code || "finding", level: srLevelOf(item),
      msg: msg, sel: item.sel || "", html: item.html || "", role: item.role || "", name: item.name || "",
      instances: item.instances || 1, selectors: item.selectors || (item.sel ? [item.sel] : []), fix: item.fix || null,
    };
    f.title = srTitle(section, item, msg);
    f.verify = srVerifyStep(f.code, { name: item.name, role: item.role, text: item.text, sel: item.sel, snippet: item.snippet, declared: item.declared, detected: item.detected, attr: item.attr, info: item.info || (item.kind ? item.kind + " " + (item.color || "") : undefined) });
    seen[f.code + "|" + f.sel] = true;
    out.push(f);
  };
  var nodeList = function (section, items) {
    (items || []).forEach(function (x) { add(section, x.code, x, (x.issues || []).map(strip).join("; ")); });
  };
  if (sr.readingOrder) nodeList("order", sr.readingOrder.issues);
  if (sr.liveRegions) {
    (sr.liveRegions.log || []).forEach(function (e) {
      if (e.kind === "route") {
        var rl = { "route-silent": "critical", "route-title-stale": "serious", "route-h1-dup": "moderate", "route-focus-stuck": "moderate" }[e.code];
        if (rl && e.soft && e.level) rl = e.level; // query-only route change: graded minor by the monitor
        if (!rl) return;
        add("live", e.code, { level: rl, sel: e.sel, html: e.html, text: e.text, fix: e.fix, role: e.tag || "" }, "SPA navigation " + String(e.text || "").slice(0, 100) + (e.note ? " — " + e.note : ""));
        return;
      }
      if (e.kind !== "silent" && e.kind !== "risky" && e.kind !== "rerender") return;
      var isState = e.code === "state-not-announced";
      var lvl = isState ? "serious" : e.kind === "silent" ? "critical" : e.kind === "risky" ? "serious" : "moderate";
      var msg = (isState ? "state not announced (" + (e.attr || "aria state") + " missing): " : e.kind === "silent" ? "silent update: " : e.kind === "risky" ? "update may be missed: " : "large re-render not announced: ") + "\"" + String(e.text || "").slice(0, 80) + "\"" + (e.note ? " — " + e.note : "");
      add("live", e.code || e.kind, { level: lvl, sel: e.sel, html: e.html, text: e.text, fix: e.fix, role: e.tag || "", attr: e.attr }, msg);
    });
  }
  if (sr.focusTrace) nodeList("focus", sr.focusTrace.issues);
  if (sr.language) (sr.language.issues || []).forEach(function (i) { add("lang", i.type, i, i.msg || i.type); });
  if (sr.nonTextContrast) (sr.nonTextContrast.issues || []).forEach(function (i) { add("ntc", i.code || "nontext-contrast", i, i.msg || "non-text contrast below 3:1"); });
  if (sr.reflow) (sr.reflow.findings || []).forEach(function (i) { add("reflow", i.code || "reflow", i, i.msg || "does not reflow at 320 px"); });
  if (sr.bilingual) (sr.bilingual.differences || []).forEach(function (d) { add("cmp", d.code, d, d.msg || d.kind); });
  if (sr.journey) {
    (sr.journey.gaps || []).forEach(function (g) {
      if (seen[g.kind + "|" + (g.sel || "")] || (g.kind === "risky" && seen["live-late|" + (g.sel || "")])) return; // already reported from the focus trace / live log
      add("journey", g.kind, { level: g.level, sel: g.sel }, g.msg + " (step " + (g.step + 1) + ", " + (g.t / 1000).toFixed(1) + "s, " + g.page + ")");
    });
  }
  if (sr.browserTree) nodeList("ax", sr.browserTree.issues);
  return out;
}

// ---------- Framework-aware screen reader snippets ----------
// Rewrites the plain-HTML fix snippets produced by the Screen reader tab for
// React (JSX) or Vue (SFC). "html" (or unknown) returns the snippet unchanged.
// `code` is the screen reader issue code; a few codes (focus/modal/live-region
// fixes) get a framework-specific example instead of a textual rewrite.

var SR_REACT_EVENTS = { onclick: "onClick", onkeydown: "onKeyDown", onkeyup: "onKeyUp", onchange: "onChange", oninput: "onInput", onfocus: "onFocus", onblur: "onBlur", onsubmit: "onSubmit" };
var SR_VOID_TAGS = "img|input|br|hr|meta|link|area|source|col|embed|track|wbr";

function srReactEvent(name) {
  name = name.toLowerCase();
  return SR_REACT_EVENTS[name] || ("on" + name.charAt(2).toUpperCase() + name.slice(3));
}

function srToJsx(snippet) {
  return snippet
    .replace(/<!--([\s\S]*?)-->/g, function (_, c) { return "{/*" + c + "*/}"; })
    .replace(/(\s)for="/g, "$1htmlFor=\"")
    .replace(/(\s)class="/g, "$1className=\"")
    .replace(/(\s)tabindex="(-?\d+)"/g, "$1tabIndex={$2}")
    .replace(/\s(on[a-z]+)="([^"]*)"/g, function (_, ev, body) {
      var js = body.replace(/\bthis\b/g, "e.currentTarget").replace(/\bevent\b/g, "e").replace(/'/g, '"');
      return " " + srReactEvent(ev) + "={(e) => { " + js + " }}";
    })
    .replace(new RegExp("<(" + SR_VOID_TAGS + ")\\b([^>]*?)\\s*/?>", "gi"), "<$1$2 />");
}

function srToVue(snippet) {
  var out = snippet.replace(/\s(on[a-z]+)="([^"]*)"/g, function (_, ev, body) {
    var js = body.replace(/\bevent\b/g, function () { return "$event"; }).replace(/\bthis\b/g, function () { return "$event.currentTarget"; });
    return " @" + ev.slice(2).toLowerCase() + '="' + js + '"';
  });
  var hints = [];
  if (/\saria-label="/.test(out)) hints.push('<!-- dynamic text: :aria-label="labelText" -->');
  if (/\s(aria-hidden="true"|hidden|inert)\b/.test(out)) hints.push("<!-- Vue: content that must be unreachable should be removed with v-if, not hidden with v-show / aria-hidden -->");
  return hints.length ? out + "\n" + hints.join("\n") : out;
}

// href="#" / javascript: link that runs script -> <button>; current breadcrumb/pagination item -> aria-current, no href
function srLinkAsButton(fw, opts) {
  opts = opts || {};
  var label = opts.name || "LINK_TEXT";
  var click = fw === "react" ? "onClick={handleClick}" : "@click=\"handleClick\"";
  var cls = fw === "react" ? "className" : "class";
  if (opts.info === "current") {
    return (fw === "react" ? "{/* the current page is not a link: aria-current, no href */}\n" : "<!-- the current page is not a link: aria-current, no href -->\n") +
      "<span aria-current=\"page\">" + label + "</span>\n" +
      (fw === "react" ? "{/* React Router: <NavLink to=\"/visa\"> sets aria-current=\"page\" for you on the active route */}" : "<!-- Vue Router: <router-link> adds aria-current=\"page\" on the active route automatically -->");
  }
  if (opts.info === "nav") {
    return fw === "react"
      ? "// router links carry a real URL — never href=\"#\" + onClick\n<Link to={`/services?page=${n}`}>" + label + "</Link>\n\n// no URL for this state: it is a button\n<button type=\"button\" " + click + ">" + label + "</button>"
      : "<!-- router links carry a real URL — never href=\"#\" + @click -->\n<router-link :to=\"{ path: '/services', query: { page: n } }\">" + label + "</router-link>\n\n<!-- no URL for this state: it is a button -->\n<button type=\"button\" " + click + ">" + label + "</button>";
  }
  return "<button type=\"button\" " + cls + "=\"link-style\" " + click + ">" + label + "</button>\n" +
    (fw === "react" ? "// no e.preventDefault() needed: a button does not navigate" : "<!-- no .prevent needed: a button does not navigate -->");
}
// target="_blank" without a hint -> reusable component that always appends the hidden text
function srLinkNewWindow(fw, opts) {
  opts = opts || {};
  var label = opts.name || "LINK_TEXT";
  if (fw === "react") {
    return "function NewTabLink({ href, children }) {\n  return (\n    <a href={href} target=\"_blank\" rel=\"noopener noreferrer\">\n      {children}\n      <span className=\"visually-hidden\"> (opens in a new tab)</span>\n    </a>\n  );\n}\n\n<NewTabLink href=\"/feedback\">" + label + "</NewTabLink>";
  }
  return "<!-- NewTabLink.vue -->\n<template>\n  <a :href=\"href\" target=\"_blank\" rel=\"noopener noreferrer\">\n    <slot />\n    <span class=\"visually-hidden\"> (opens in a new tab)</span>\n  </a>\n</template>\n<script setup>defineProps({ href: String });</script>\n\n<NewTabLink href=\"/feedback\">" + label + "</NewTabLink>";
}

// custom widget keyboard probe: roving tabindex + arrow keys, Enter/Space activation, Escape closes the popup
function srWidgetArrows(fw, opts) {
  opts = opts || {};
  var role = opts.info || "tablist";
  var item = { tablist: "tab", radiogroup: "radio", listbox: "option", menu: "menuitem", menubar: "menuitem", tree: "treeitem", grid: "gridcell" }[role] || "tab";
  var state = item === "tab" || item === "option" ? "aria-selected" : item === "radio" ? "aria-checked" : null;
  if (fw === "react") {
    return "// roving tabindex: one Tab stop, arrows move between the items\n" +
      "const [active, setActive] = useState(0);\nconst refs = useRef([]);\n" +
      "function onKeyDown(e) {\n  const n = items.length;\n  const next = { ArrowRight: active + 1, ArrowDown: active + 1, ArrowLeft: active - 1, ArrowUp: active - 1, Home: 0, End: n - 1 }[e.key];\n" +
      "  if (next === undefined) return;\n  e.preventDefault();\n  const i = (next + n) % n;\n  setActive(i);\n  refs.current[i]?.focus();\n}\n\n" +
      "<div role=\"" + role + "\" onKeyDown={onKeyDown}>\n  {items.map((it, i) => (\n    <button key={it.id} ref={(el) => (refs.current[i] = el)} role=\"" + item + "\"" +
      (state ? " " + state + "={i === active}" : "") + " tabIndex={i === active ? 0 : -1} onClick={() => setActive(i)}>{it.label}</button>\n  ))}\n</div>";
  }
  return "<!-- roving tabindex: one Tab stop, arrows move between the items -->\n" +
    "<div role=\"" + role + "\" @keydown=\"onKeyDown\">\n  <button v-for=\"(it, i) in items\" :key=\"it.id\" ref=\"items\" role=\"" + item + "\"" +
    (state ? " :" + state + "=\"i === active\"" : "") + " :tabindex=\"i === active ? 0 : -1\" @click=\"active = i\">{{ it.label }}</button>\n</div>\n\n" +
    "onKeyDown(e) {\n  const n = this.items.length;\n  const next = { ArrowRight: this.active + 1, ArrowDown: this.active + 1, ArrowLeft: this.active - 1, ArrowUp: this.active - 1, Home: 0, End: n - 1 }[e.key];\n" +
    "  if (next === undefined) return;\n  e.preventDefault();\n  this.active = (next + n) % n;\n  this.$refs.items[this.active].focus();\n}";
}
function srWidgetActivate(fw, opts) {
  opts = opts || {};
  var label = opts.name || "LABEL";
  if (fw === "react") {
    return "{/* a real <button> gets Enter and Space for free — no key handler needed */}\n<button type=\"button\" onClick={open}>" + label + "</button>\n\n" +
      "{/* if the div must stay: handle the keys yourself */}\n<div role=\"button\" tabIndex={0} onClick={open}\n  onKeyDown={(e) => { if (e.key === \"Enter\" || e.key === \" \") { e.preventDefault(); open(); } }}>" + label + "</div>";
  }
  return "<!-- a real <button> gets Enter and Space for free — no key handler needed -->\n<button type=\"button\" @click=\"open\">" + label + "</button>\n\n" +
    "<!-- if the div must stay: handle the keys yourself -->\n<div role=\"button\" tabindex=\"0\" @click=\"open\" @keydown.enter.prevent=\"open\" @keydown.space.prevent=\"open\">" + label + "</div>";
}
function srWidgetEscape(fw, opts) {
  opts = opts || {};
  if (fw === "react") {
    return "// one Escape closes the popup and returns focus to the opener\nconst openerRef = useRef(null);\n" +
      "useEffect(() => {\n  if (!open) return;\n  const onKey = (e) => { if (e.key === \"Escape\") { e.stopPropagation(); setOpen(false); } };\n  document.addEventListener(\"keydown\", onKey);\n  return () => { document.removeEventListener(\"keydown\", onKey); openerRef.current?.focus(); };\n}, [open]);\n\n" +
      "<button ref={openerRef} aria-haspopup=\"listbox\" aria-expanded={open} onClick={() => setOpen(!open)}>…</button>";
  }
  return "<!-- one Escape closes the popup and returns focus to the opener -->\n<button ref=\"opener\" aria-haspopup=\"listbox\" :aria-expanded=\"open\" @click=\"open = !open\">…</button>\n" +
    "<div v-if=\"open\" role=\"listbox\" @keydown.esc.stop=\"close\">…</div>\n\n" +
    "close() {\n  this.open = false;\n  this.$nextTick(() => this.$refs.opener.focus());\n}";
}

var SR_FRAMEWORK_SNIPPETS = {
  react: {
    "focus-lost": function () {
      return "// decide where focus goes BEFORE the focused element unmounts\n" +
        "const headingRef = useRef(null);            // <h2 ref={headingRef} tabIndex={-1}>LIST_TITLE</h2>\n" +
        "const [items, setItems] = useState(list);\n\n" +
        "function remove(id) {\n  const idx = items.findIndex((i) => i.id === id);\n  setItems(items.filter((i) => i.id !== id));\n  setFocusIndex(Math.min(idx, items.length - 2));   // next item, else previous\n}\n\n" +
        "useEffect(() => {                              // runs after the DOM updated\n  const next = itemRefs.current[focusIndex];\n  (next ?? headingRef.current)?.focus();\n}, [items, focusIndex]);\n\n" +
        "// closing a dialog/menu: return focus to the element that opened it\nuseEffect(() => { if (!open) openerRef.current?.focus(); }, [open]);";
    },
    "modal-escape": function () {
      return "{/* native <dialog> traps focus and makes the page inert for you */}\n" +
        "const dlgRef = useRef(null);\n" +
        "useEffect(() => {\n  if (open) dlgRef.current?.showModal();   // not .show(), not display:block\n  else dlgRef.current?.close();\n}, [open]);\n\n" +
        "<dialog ref={dlgRef} onClose={() => setOpen(false)}>…</dialog>\n\n" +
        "{/* custom modal: render it through a portal outside <main> and make <main> inert while open */}\n" +
        "useEffect(() => { document.querySelector(\"main\").inert = open; return () => openerRef.current?.focus(); }, [open]);";
    },
    "dialog-no-focus": function () {
      return "const dlgRef = useRef(null);\n" +
        "useEffect(() => { if (open) dlgRef.current?.showModal(); }, [open]);   // native <dialog>: focus moves inside automatically\n<dialog ref={dlgRef}>…</dialog>\n\n" +
        "{/* custom dialog: focus the title once it is rendered */}\n" +
        "const titleRef = useRef(null);\nuseEffect(() => { if (open) titleRef.current?.focus(); }, [open]);\n<h2 ref={titleRef} tabIndex={-1}>DIALOG_TITLE</h2>";
    },
    "silent": function (opts) { return srReactStatus(opts); },
    "risky": function (opts) { return srReactStatus(opts); },
    "live-late": function (opts) { return srReactStatus(opts); },
    "route-silent": function () { return srReactRoute(true, true); },
    "route-title-stale": function () { return srReactRoute(true, false); },
    "route-h1-dup": function () { return "// React Router: one page-specific <h1> per route (the site name belongs in the title suffix)\nfunction ContactPage() {\n  return (\n    <main>\n      <h1 tabIndex={-1}>Contact</h1>          {/* not \"SITE_NAME\" on every page */}\n      …\n    </main>\n  );\n}\n\n// and keep document.title in step: useEffect(() => { document.title = \"Contact — SITE_NAME\"; }, []);"; },
    "route-focus-stuck": function () { return srReactRoute(false, true); },
    "link-as-button": function (opts) { return srLinkAsButton("react", opts); },
    "widget-no-arrow-nav": function (opts) { return srWidgetArrows("react", opts); },
    "widget-no-enter-space": function (opts) { return srWidgetActivate("react", opts); },
    "widget-esc-no-close": function (opts) { return srWidgetEscape("react", opts); },
    "link-new-window": function (opts) { return srLinkNewWindow("react", opts); },
    "rerender": function () {
      return "// after a route change or list refresh: announce a summary + move focus to the new heading\n" +
        "const h1Ref = useRef(null);\n" +
        "useEffect(() => {\n  setStatus(`${results.length} results for ${query}`);\n  h1Ref.current?.focus();\n}, [location.pathname, results]);\n\n" +
        "<h1 ref={h1Ref} tabIndex={-1}>PAGE_TITLE</h1>\n<div role=\"status\" aria-live=\"polite\">{status}</div>";
    }
  },
  vue: {
    "focus-lost": function () {
      return "<h2 ref=\"heading\" tabindex=\"-1\">LIST_TITLE</h2>\n<li v-for=\"item in items\" :key=\"item.id\" ref=\"rows\">…</li>\n\n" +
        "// after removing the focused item, move focus deliberately (next item, else the heading)\n" +
        "async remove(id) {\n  const idx = this.items.findIndex((i) => i.id === id);\n  this.items = this.items.filter((i) => i.id !== id);\n  await this.$nextTick();\n  const next = this.$refs.rows?.[Math.min(idx, this.items.length - 1)];\n  (next?.querySelector(\"button, a, input\") ?? this.$refs.heading).focus();\n}\n\n" +
        "// closing a dialog/menu: return focus to the opener\nthis.$refs.opener.focus();";
    },
    "modal-escape": function () {
      return "<!-- native <dialog> traps focus and makes the page inert for you -->\n" +
        "<dialog ref=\"dlg\" @close=\"open = false\">…</dialog>\n\n" +
        "watch: {\n  async open(v) {\n    await this.$nextTick();\n    v ? this.$refs.dlg.showModal() : this.$refs.dlg.close();   // not .show(), not v-show\n  }\n}\n\n" +
        "<!-- custom modal: <Teleport to=\"body\"> the dialog and make <main> inert while it is open; on close this.$refs.opener.focus() -->\n" +
        "document.querySelector(\"main\").inert = this.open;";
    },
    "dialog-no-focus": function () {
      return "<dialog ref=\"dlg\">…</dialog>\n" +
        "await this.$nextTick(); this.$refs.dlg.showModal();   // native <dialog>: focus moves inside automatically\n\n" +
        "<!-- custom dialog: focus the title once it is rendered (v-if, then $nextTick) -->\n" +
        "<h2 ref=\"title\" tabindex=\"-1\">DIALOG_TITLE</h2>\nawait this.$nextTick(); this.$refs.title.focus();";
    },
    "silent": function (opts) { return srVueStatus(opts); },
    "risky": function (opts) { return srVueStatus(opts); },
    "live-late": function (opts) { return srVueStatus(opts); },
    "widget-no-arrow-nav": function (opts) { return srWidgetArrows("vue", opts); },
    "widget-no-enter-space": function (opts) { return srWidgetActivate("vue", opts); },
    "widget-esc-no-close": function (opts) { return srWidgetEscape("vue", opts); },
    "route-silent": function () { return srVueRoute(true, true); },
    "route-title-stale": function () { return srVueRoute(true, false); },
    "route-h1-dup": function () { return "<!-- Vue Router: one page-specific <h1> per route view (the site name belongs in the title suffix) -->\n<template>\n  <main>\n    <h1 tabindex=\"-1\">Contact</h1>   <!-- not \"SITE_NAME\" on every page -->\n    …\n  </main>\n</template>\n\n<!-- and keep the title in step: routes: [{ path: '/contact', component: Contact, meta: { title: 'Contact' } }] -->"; },
    "route-focus-stuck": function () { return srVueRoute(false, true); },
    "link-as-button": function (opts) { return srLinkAsButton("vue", opts); },
    "link-new-window": function (opts) { return srLinkNewWindow("vue", opts); },
    "rerender": function () {
      return "<!-- after a route change or list refresh: announce a summary + move focus to the new heading -->\n" +
        "<h1 ref=\"h1\" tabindex=\"-1\">PAGE_TITLE</h1>\n<div role=\"status\" aria-live=\"polite\">{{ status }}</div>\n\n" +
        "watch(() => route.path, async () => {\n  status.value = `${results.value.length} results for ${query.value}`;\n  await nextTick();\n  h1.value.focus();\n});";
    }
  }
};

// React Router: title + focus + route announcer after every navigation.
function srReactRoute(withTitle, withFocus) {
  return "// React Router: run after EVERY navigation (App.jsx or a <RouteAnnouncer /> rendered once in the layout)\n" +
    "import { useLocation } from \"react-router-dom\";\n" +
    "const [announce, setAnnounce] = useState(\"\");\nconst location = useLocation();\n\n" +
    "useEffect(() => {\n" +
    "  const h1 = document.querySelector(\"main h1\");\n" +
    "  const pageTitle = h1 ? h1.textContent.trim() : \"PAGE_TITLE\";\n" +
    (withTitle ? "  document.title = `${pageTitle} — SITE_NAME`;              // tab title = first thing announced\n" : "") +
    (withFocus ? "  if (h1) { h1.tabIndex = -1; h1.focus(); }                 // focus lands on the new page's heading\n" : "") +
    "  setAnnounce(`Navigated to ${pageTitle}`);\n" +
    "}, [location.pathname]);\n\n" +
    "{/* rendered once in the layout, never unmounted between routes */}\n<div role=\"status\" aria-live=\"polite\" className=\"visually-hidden\">{announce}</div>";
}
// Vue Router: afterEach hook sets the title, focuses the H1 and fills a route announcer.
function srVueRoute(withTitle, withFocus) {
  return "<!-- App.vue: rendered once, never re-created between routes -->\n<div role=\"status\" aria-live=\"polite\" class=\"visually-hidden\">{{ announce }}</div>\n\n" +
    "// router.js — runs after EVERY navigation\nrouter.afterEach(async (to) => {\n" +
    "  const pageTitle = to.meta.title ?? \"PAGE_TITLE\";      // routes: [{ path: '/contact', meta: { title: 'Contact' } }]\n" +
    (withTitle ? "  document.title = `${pageTitle} — SITE_NAME`;\n" : "") +
    "  await nextTick();                                      // the new view is in the DOM now\n" +
    (withFocus ? "  const h1 = document.querySelector(\"main h1\");\n  if (h1) { h1.tabIndex = -1; h1.focus(); }\n" : "") +
    "  announce.value = `Navigated to ${pageTitle}`;\n});";
}

function srStatusText(opts) {
  return String((opts && opts.text) || "MESSAGE").slice(0, 60).replace(/"/g, "'");
}
function srReactStatus(opts) {
  return "{/* 1. keep ONE status region mounted with the page — render it empty, never conditionally */}\n" +
    "const [status, setStatus] = useState(\"\");\n<div role=\"status\" aria-live=\"polite\">{status}</div>\n\n" +
    "// 2. later, only change its text (errors that need immediate attention: role=\"alert\")\n" +
    "setStatus(\"" + srStatusText(opts) + "\");";
}
function srVueStatus(opts) {
  return "<!-- 1. keep ONE status region mounted with the page — no v-if on it -->\n" +
    "<div role=\"status\" aria-live=\"polite\">{{ status }}</div>\n\n" +
    "// 2. later, only change its text (errors that need immediate attention: role=\"alert\")\n" +
    "this.status = \"" + srStatusText(opts) + "\";";
}

// frameworkizeSnippet(snippet, framework, code?, opts?) -> snippet string
function frameworkizeSnippet(snippet, framework, code, opts) {
  snippet = snippet == null ? "" : String(snippet);
  framework = framework || "html";
  if (framework !== "react" && framework !== "vue") return snippet;
  var special = code && SR_FRAMEWORK_SNIPPETS[framework][code];
  if (special) return special(opts || {});
  if (!/<[a-zA-Z!]/.test(snippet)) return snippet; // pure JS/CSS: nothing to rewrite
  return framework === "react" ? srToJsx(snippet) : srToVue(snippet);
}

const A11yFixes = { suggestFix, contrastFix, previewPatch, issuesMarkdown, frameworkizeSnippet, srVerifyStep, srFindings, DLS_COLORS };
if (typeof module !== "undefined" && module.exports) module.exports = A11yFixes;
if (typeof globalThis !== "undefined") globalThis.A11yFixes = A11yFixes;
})();
