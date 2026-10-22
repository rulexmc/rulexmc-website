#!/usr/bin/env node
/**
 * Optional headless accessibility pass. Not a project dependency — run with e.g.
 *   npm i --no-save playwright-core axe-core
 *   CHROME_PATH=/usr/bin/google-chrome node scripts/a11y.mjs http://localhost:3000 / /server /leaderboards /store /login
 * For each path at 360px and 1440px it runs axe-core (WCAG 2.1 A/AA + best practices), checks there is
 * exactly one <h1> with no skipped heading levels, that the first Tab stop is the skip link, and that
 * the first 60 Tab stops all show a visible focus style. Exits non-zero on any problem.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");
const axeSrc = fs.readFileSync(require.resolve(process.env.AXE_CORE_PATH || "axe-core/axe.min.js"), "utf8");
const [base = "http://localhost:3000", ...argPaths] = process.argv.slice(2);
const paths = argPaths.length ? argPaths : ["/", "/server", "/leaderboards", "/store", "/login", "/register", "/this-page-does-not-exist"];
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
let problems = 0;
for (const w of [360, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  for (const path of paths) {
    await p.goto(base + path, { waitUntil: "networkidle" });
    await p.addScriptTag({ content: axeSrc });
    const r = await p.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] } });
      return res.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ") + " :: " + (n.failureSummary || "").split("\n")[1]) }));
    });
    const headings = await p.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter((h) => h.getClientRects().length || h.classList.contains("sr-only")).map((h) => +h.tagName[1]));
    const h1s = headings.filter((x) => x === 1).length;
    const jumps = headings.filter((x, i) => i > 0 && x - headings[i - 1] > 1).length;
    // Keyboard: tab through up to 60 stops, ensure each focused element shows an outline/ring/box-shadow change.
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.keyboard.press("Tab");
    const first = await p.evaluate(() => document.activeElement?.textContent?.trim());
    let invisible = [];
    for (let i = 0; i < 60; i++) {
      const info = await p.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const visible = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== "none";
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, txt: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30), visible, w: r.width, h: r.height };
      });
      if (info && !info.visible && info.tag !== "NEXTJS-PORTAL") invisible.push(`${info.tag}:${info.txt}`);
      await p.keyboard.press("Tab");
    }
    const line = `${w} ${path}: axe=${r.length ? r.map((v) => `${v.id}(${v.impact},${v.n})`).join(",") : "0"} h1=${h1s} headingJumps=${jumps} skipLinkFirst=${/skip/i.test(first || "")} focusNotVisible=${invisible.length}`;
    console.log(line);
    for (const v of r) for (const s of v.sample) console.log("    ", v.id, s);
    if (invisible.length) console.log("     no-focus-style:", [...new Set(invisible)].slice(0, 6).join(" | "));
    problems += r.length + (/skip/i.test(first || "") ? 0 : 1) + (h1s !== 1 ? 1 : 0) + jumps + invisible.length;
  }
  await ctx.close();
}
await b.close();
console.log(problems ? `\n${problems} problem(s)` : "\nNo accessibility problems found");
process.exit(problems ? 1 : 0);
