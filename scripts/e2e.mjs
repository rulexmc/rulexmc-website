#!/usr/bin/env node
/**
 * Optional browser end-to-end test (Playwright). Not a project dependency — run with:
 *   npm i -g playwright-core   (or: npx -p playwright-core node scripts/e2e.mjs)
 *   BASE_URL=http://localhost:3000 INGEST_SECRET=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   CHROME_PATH=/usr/bin/google-chrome node scripts/e2e.mjs
 * Creates a throwaway player account (e2e-<timestamp>@example.test), links a name,
 * verifies it through the ingest API, files a report, then signs in as admin to
 * publish an announcement and resolve the report. Also covers keyboard skip link, copy feedback,
 * leaderboard tabs/search/ordering and player profiles (200 / 308 canonical / 404, verified badge).
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE_PATH || "playwright-core");

const BASE = process.env.BASE_URL || "http://localhost:3000";
const secret = process.env.INGEST_SECRET;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
let failures = 0;
const check = (cond, msg) => { console.log(`  ${cond ? "✓" : "✗"} ${msg}`); if (!cond) failures++; };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ["--no-sandbox"] });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const consoleErrors = [];
// The intentional 404 page visit logs a "Failed to load resource: 404" console error; ignore that one.
page.on("console", (m) => { if (m.type() === "error" && !/status of 404/.test(m.text())) consoleErrors.push(m.text()); });

const stamp = Date.now().toString(36);
const email = `e2e-${stamp}@example.test`;
const mcName = `E2E_${stamp}`.slice(0, 16);

console.log("Home");
await page.goto(BASE + "/");
await page.keyboard.press("Tab");
check(/skip to content/i.test(await page.evaluate(() => document.activeElement?.textContent || "")), "first Tab stop is the skip link");
check((await page.locator("h1").innerText()).toUpperCase().includes("YOUR HEART"), "hero heading");
// Scope to <main>: the footer has its own copy button that renders before the streamed hero.
const heroAddress = page.locator("main").getByTestId("server-address").first();
await heroAddress.waitFor();
check(await heroAddress.isVisible(), "server address visible");
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
const copyBtn = page.locator("main").getByRole("button", { name: /copy server address/i }).first();
await copyBtn.click();
check(await page.locator('button[data-state="copied"]').first().waitFor({ timeout: 3000 }).then(() => true, () => false), "copy button switches to copied state");
check(await page.getByRole("status").getByText(/Copied .* paste it into Minecraft/).waitFor({ timeout: 3000 }).then(() => true, () => false), "copy toast announced");
check(await copyBtn.evaluate((el) => el === document.activeElement), "copy button keeps focus after feedback");
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
check(clip.length > 0 && clip === (await heroAddress.innerText()), `clipboard contains address (${clip})`);

console.log("Register");
await page.goto(BASE + "/register");
await page.fill("#displayName", "E2E Tester");
await page.fill("#email", email);
await page.fill("#password", "short");
await page.fill("#confirm", "short");
await page.click("main button[type=submit]");
await page.waitForSelector(".field-error");
check(true, "validation error shown for short password");
await page.fill("#password", "e2e-password-123");
await page.fill("#confirm", "e2e-password-123");
await Promise.all([page.waitForURL((u) => u.pathname === "/portal"), page.click("main button[type=submit]")]);
check(page.url().includes("/portal"), "registered and redirected to portal");

console.log("Link + verify");
await page.fill("#mcUsername", mcName);
await page.getByRole("button", { name: /^link$/i }).click();
await page.getByText(/Linked .* Verify it in-game/).waitFor();
check(true, "username linked");
await page.getByRole("button", { name: /generate verification code/i }).click();
const codeEl = page.locator("code", { hasText: "/verify RX-" });
await codeEl.waitFor();
const code = (await codeEl.innerText()).replace("/verify ", "").trim();
check(/^RX-[A-Z0-9]{6}$/.test(code), `verification code shown (${code})`);
const mcUuid = `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`;
if (secret) {
  const res = await fetch(BASE + "/api/ingest/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ code, name: mcName, uuid: mcUuid }),
  });
  check(res.ok, `ingest verify accepted (${res.status})`);
  await page.reload();
  check(await page.getByText("✓ Verified").waitFor({ timeout: 5000 }).then(() => true, () => false), "portal shows Verified");

  console.log("Player profile");
  const pr = await page.goto(`${BASE}/player/${mcName}`);
  check(pr?.status() === 200, `verified player without stats has a profile (${pr?.status()})`);
  check(await page.getByTestId("verified-badge").isVisible(), "profile shows Verified badge");
  check(await page.getByText(/hasn.t sent any stats/).isVisible(), "honest empty state before any stats");
  const ing = await fetch(BASE + "/api/ingest/stats", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ source: "e2e", players: [{ uuid: mcUuid, name: mcName, kills: 9, deaths: 3, playtimeSeconds: 5400, level: 7 }] }),
  });
  check(ing.ok, `stats ingested for e2e player (${ing.status})`);
  await page.goto(`${BASE}/player/${mcName.toLowerCase()}`);
  check(new URL(page.url()).pathname === `/player/${mcName}`, "lower-case profile URL redirects to canonical name");
  check(await page.getByTestId("verified-badge").isVisible(), "verified badge kept once stats exist");
  check(await page.getByText("3.00").first().isVisible().catch(() => false), "K/D derived from real kills/deaths (9/3)");
}
const nf = await page.goto(BASE + "/player/NoSuchPlayer_zq9");
check(nf?.status() === 404, `unknown player → 404 (${nf?.status()})`);

console.log("Leaderboards");
await page.goto(BASE + "/leaderboards");
await page.getByRole("navigation", { name: "Leaderboard metric" }).getByRole("link", { name: /hearts/i }).click();
await page.waitForURL((u) => u.searchParams.get("metric") === "hearts", { waitUntil: "commit", timeout: 10000 });
check(await page.getByRole("navigation", { name: "Leaderboard metric" }).locator('[aria-current="page"]').innerText().then((t) => /hearts/i.test(t)), "Hearts tab active after click");
await page.getByRole("searchbox", { name: /search players/i }).or(page.getByPlaceholder("Search player…")).first().fill("SmokeTest");
await page.waitForURL((u) => u.searchParams.get("q") === "SmokeTest", { waitUntil: "commit", timeout: 5000 }).catch(() => {});
check(new URL(page.url()).searchParams.get("q") === "SmokeTest" && new URL(page.url()).searchParams.get("metric") === "hearts", "search updates the URL and keeps the metric");
const rowLink = page.locator('main a[href^="/player/SmokeTest"]').first();
if (await rowLink.count()) {
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith("/player/")), rowLink.click()]);
  check(await page.locator("h1").textContent().then((t) => (t || "").includes("SmokeTest")), "leaderboard row opens the player profile");
} else {
  console.log("  • no SmokeTest players on this instance (run scripts/smoke.sh with INGEST_SECRET first) — skipping row click");
}

console.log("Report");
await page.goto(BASE + "/portal/reports");
await page.fill("#targetName", "SmokeTestA");
await page.fill("#description", "Flying and kill aura near spawn around 21:00, multiple witnesses.");
await page.click("main button[type=submit]");
await page.getByText("Report submitted").waitFor();
check(await page.getByText("SmokeTestA").first().isVisible(), "report listed for reporter");

console.log("Access control");
await page.goto(BASE + "/admin");
await page.waitForURL((u) => u.pathname === "/portal", { timeout: 5000 }).catch(() => {});
check(page.url().includes("/portal") && (await page.getByText("You don't have access").waitFor({ timeout: 5000 }).then(() => true, () => false)), "player is denied /admin");

if (adminEmail && adminPassword) {
  console.log("Admin");
  await ctx.clearCookies();
  await page.goto(BASE + "/login?next=/admin");
  await page.fill("#email", adminEmail);
  await page.fill("#password", "wrong-password");
  await page.click("main button[type=submit]");
  await page.getByText("Incorrect email or password").waitFor();
  check(true, "wrong password rejected");
  await page.fill("#password", adminPassword);
  await Promise.all([page.waitForURL((u) => u.pathname === "/admin"), page.click("main button[type=submit]")]);
  check(await page.getByText("Control room").waitFor({ timeout: 5000 }).then(() => true, () => false), "admin dashboard loads");

  await page.goto(BASE + "/admin/announcements");
  const title = `E2E update ${stamp}`;
  await page.fill("#t-new", title);
  await page.fill("#b-new", "Season reset this Friday. Bring your hearts.");
  await page.getByRole("button", { name: "Publish" }).click();
  await page.getByText("Announcement created").waitFor();
  check(true, "announcement created");
  await page.goto(BASE + "/");
  check(await page.getByText(title).waitFor({ timeout: 5000 }).then(() => true, () => false), "announcement visible on home page");

  await page.goto(BASE + "/admin/reports");
  const card = page.locator("li", { hasText: "Flying and kill aura" }).first();
  await card.locator("select[name=status]").selectOption("RESOLVED");
  await card.locator("input[name=adminNote]").fill("Banned. Thanks!");
  await card.getByRole("button", { name: "Update" }).click();
  await page.getByText("Report updated").waitFor();
  check(true, "report resolved");

  await page.goto(BASE + "/admin/audit");
  check(await page.getByText("report.update").first().waitFor({ timeout: 5000 }).then(() => true, () => false), "audit log records report.update");
  check(await page.getByText("announcement.create").first().waitFor({ timeout: 5000 }).then(() => true, () => false), "audit log records announcement.create");
}

check(consoleErrors.length === 0, `no browser console errors${consoleErrors.length ? `: ${consoleErrors.slice(0, 3).join(" | ")}` : ""}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll e2e checks passed");
process.exit(failures ? 1 : 0);
