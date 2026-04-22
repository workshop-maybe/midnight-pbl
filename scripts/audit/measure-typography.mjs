// Typography measurement for the marketing/dashboard a11y audit (issue #16).
//
// Visits each page at three viewports, captures computed font-size / line-height
// on the first H1, H2, H3, and <p> inside <main>, plus the measure (ch) of
// that <p>. Emits a Markdown table to stdout.
//
// Usage:
//   BASE_URL=https://midnight-pbl.io node scripts/audit/measure-typography.mjs
//   BASE_URL=http://localhost:4321 STORAGE_STATE=scripts/audit/.auth/user.json \
//     node scripts/audit/measure-typography.mjs
//
// Env:
//   BASE_URL        Origin to measure. Defaults to https://midnight-pbl.io.
//   STORAGE_STATE   Optional path to a Playwright storageState.json (from
//                   save-auth.mjs). If absent, auth-gated pages are skipped.

import { chromium } from "playwright";
import { existsSync } from "node:fs";

const VIEWPORTS = [
  { label: "375px",  width: 375,  height: 812  },
  { label: "768px",  width: 768,  height: 1024 },
  { label: "1440px", width: 1440, height: 900  },
];

// Each page declares:
//   titleSelector   — selector for the layout-level page title (H1 fallback to H2).
//   contentSelector — the primary prose/body container. H2/H3/P are measured
//                     as the FIRST visible instance INSIDE this container.
//
// Defaults are deliberately narrow to match "what a reader perceives as the
// main content". Tune per page when the DOM shape varies.
const PAGES = [
  {
    path: "/",
    label: "landing",
    needsAuth: false,
    titleSelector: "main h1, main h2",
    contentSelector: "main",
  },
  {
    path: "/dashboard",
    label: "dashboard",
    needsAuth: true,
    titleSelector: "main h1",
    contentSelector: "main",
  },
  {
    path: "/learn/101/assignment",
    label: "assignment",
    needsAuth: true,
    titleSelector: "main h1",
    contentSelector: "main",
  },
  {
    path: "/learn/101/1",
    label: "lesson (reference)",
    needsAuth: false,
    titleSelector: "main h1",
    contentSelector: ".prose-midnight",
  },
];

async function measure(page, titleSelector, contentSelector) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(
    ({ titleSelector, contentSelector }) => {
      function isVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const s = getComputedStyle(el);
        return s.visibility !== "hidden" && s.display !== "none";
      }

      function firstVisible(root, selector) {
        for (const el of root.querySelectorAll(selector)) {
          if (isVisible(el)) return el;
        }
        return null;
      }

      function measureEl(el) {
        if (!el) return null;
        const s = getComputedStyle(el);
        const fontSize = parseFloat(s.fontSize);
        const lineHeight = parseFloat(s.lineHeight) || fontSize * 1.2;
        return {
          text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50),
          fontSizePx: +fontSize.toFixed(2),
          lineHeightPx: +lineHeight.toFixed(2),
          lineHeightRatio: +(lineHeight / fontSize).toFixed(2),
        };
      }

      function measureCh(el) {
        if (!el) return null;
        const s = getComputedStyle(el);
        const probe = document.createElement("span");
        probe.style.cssText =
          `position:absolute;visibility:hidden;white-space:pre;` +
          `font:${s.font};letter-spacing:${s.letterSpacing};`;
        probe.textContent = "0";
        el.appendChild(probe);
        const chWidth = probe.getBoundingClientRect().width;
        probe.remove();
        if (!chWidth) return null;
        const w = el.getBoundingClientRect().width;
        if (!w) return null;
        return +(w / chWidth).toFixed(1);
      }

      const docRoot = document.documentElement;
      const content = document.querySelector(contentSelector) || document.querySelector("main") || document.body;
      const title = firstVisible(document, titleSelector);
      const h2 = firstVisible(content, "h2");
      const h3 = firstVisible(content, "h3");
      const p  = firstVisible(content, "p");

      return {
        rootFontSizePx: parseFloat(getComputedStyle(docRoot).fontSize),
        container: {
          selector: contentSelector,
          tag: content.tagName.toLowerCase(),
          widthPx: Math.round(content.getBoundingClientRect().width),
        },
        titleSelector,
        h1: measureEl(title),
        h2: measureEl(h2),
        h3: measureEl(h3),
        p:  measureEl(p),
        measureCh: measureCh(p),
      };
    },
    { titleSelector, contentSelector }
  );
}

function renderMarkdown(results, baseUrl) {
  const lines = [];
  lines.push(`# Typography measurements — ${baseUrl}`);
  lines.push(`_Captured ${new Date().toISOString()} via \`scripts/audit/measure-typography.mjs\`._`);
  for (const [pageLabel, rows] of Object.entries(results)) {
    lines.push("");
    lines.push(`## ${pageLabel}`);
    lines.push("");
    lines.push(
      "| Viewport | Container (px) | body `<p>` px / LH (ratio) | measure (ch) | H1 px / LH | H2 px / LH | H3 px / LH |"
    );
    lines.push("|---|---|---|---|---|---|---|");
    for (const r of rows) {
      if (r.error) {
        lines.push(`| ${r.viewport} | — | **ERROR:** ${r.error} | — | — | — | — |`);
        continue;
      }
      const m = r.metrics;
      const fmt = (h) => h ? `${h.fontSizePx} / ${h.lineHeightPx} (${h.lineHeightRatio})` : "—";
      const ch = m.measureCh == null ? "—" : `~${m.measureCh}`;
      lines.push(
        `| ${r.viewport} | ${m.container.widthPx} | ${fmt(m.p)} | ${ch} | ${fmt(m.h1)} | ${fmt(m.h2)} | ${fmt(m.h3)} |`
      );
    }
    lines.push("");
    const first = rows.find((r) => r.metrics);
    if (first) {
      const m = first.metrics;
      lines.push(
        `_Root font-size: ${m.rootFontSizePx}px · container: \`${m.container.selector}\` (${m.container.tag}) · title selector: \`${m.titleSelector}\`_`
      );
      lines.push("");
      lines.push(`<details><summary>Matched text (1440px)</summary>`);
      const widest = rows.find((r) => r.viewport === "1440px" && r.metrics) || first;
      const wm = widest.metrics;
      lines.push("");
      lines.push(`- **H1/title:** ${wm.h1 ? `"${wm.h1.text}"` : "_(none found)_"}`);
      lines.push(`- **H2:** ${wm.h2 ? `"${wm.h2.text}"` : "_(none found)_"}`);
      lines.push(`- **H3:** ${wm.h3 ? `"${wm.h3.text}"` : "_(none found)_"}`);
      lines.push(`- **P:** ${wm.p ? `"${wm.p.text}"` : "_(none found)_"}`);
      lines.push("");
      lines.push(`</details>`);
    }
  }
  return lines.join("\n");
}

async function main() {
  const baseUrl = (process.env.BASE_URL || "https://midnight-pbl.io").replace(/\/$/, "");
  const storageState = process.env.STORAGE_STATE;

  if (storageState && !existsSync(storageState)) {
    console.error(`[error] STORAGE_STATE=${storageState} does not exist. Run save-auth.mjs first.`);
    process.exit(2);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext(storageState ? { storageState } : {});
  const page = await context.newPage();

  const toRun = PAGES.filter((p) => !p.needsAuth || storageState);
  const skipped = PAGES.filter((p) => p.needsAuth && !storageState);
  if (skipped.length) {
    console.error(
      `[info] Skipping ${skipped.map((p) => p.path).join(", ")} — no STORAGE_STATE set.`
    );
  }

  const results = {};
  for (const pageDef of toRun) {
    results[pageDef.label] = [];
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const url = baseUrl + pageDef.path;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
        const metrics = await measure(page, pageDef.titleSelector, pageDef.contentSelector);
        results[pageDef.label].push({ viewport: viewport.label, metrics });
        console.error(`[ok]  ${pageDef.label.padEnd(22)} ${viewport.label}`);
      } catch (err) {
        results[pageDef.label].push({ viewport: viewport.label, error: err.message });
        console.error(`[err] ${pageDef.label.padEnd(22)} ${viewport.label}: ${err.message}`);
      }
    }
  }

  await browser.close();
  process.stdout.write(renderMarkdown(results, baseUrl) + "\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
