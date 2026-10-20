#!/usr/bin/env node
/**
 * Optional browser end-to-end test (Playwright). Not a project dependency — run with:
 *   npm i -g playwright-core   (or: npx -p playwright-core node scripts/e2e.mjs)
 *   BASE_URL=http://localhost:3000 INGEST_SECRET=... ADMIN_EMAIL=... ADMIN_PASSWORD=... \
 *   CHROME_PATH=/usr/bin/google-chrome node scripts/e2e.mjs
 * Creates a throwaway player account (e2e-<timestamp>@example.test), links a name,
 * verifies it through the ingest API, files a report, then signs in as admin to
 * publish an announcement and resolve the report.
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
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

const stamp = Date.now().toString(36);
const email = `e2e-${stamp}@example.test`;
const mcName = `E2E_${stamp}`.slice(0, 16);

console.log("Home");
await page.goto(BASE + "/");
check((await page.locator("h1").innerText()).toUpperCase().includes("YOUR HEART"), "hero heading");
await page.getByTestId("server-address").first().waitFor();
check(await page.getByTestId("server-address").first().isVisible(), "server address visible");
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
await page.getByRole("button", { name: /copy server address/i }).first().click();
check(await page.getByRole("button", { name: /copy server address/i }).first().getByText("Copied!").waitFor({ timeout: 3000 }).then(() => true, () => false), "copy button feedback");
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
check(clip.length > 0 && clip === (await page.getByTestId("server-address").first().innerText()), `clipboard contains address (${clip})`);

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
if (secret) {
  const res = await fetch(BASE + "/api/ingest/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
    body: JSON.stringify({ code, name: mcName, uuid: `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}` }),
  });
  check(res.ok, `ingest verify accepted (${res.status})`);
  await page.reload();
  check(await page.getByText("✓ Verified").waitFor({ timeout: 5000 }).then(() => true, () => false), "portal shows Verified");
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
  check(await page.getByText("report.update").first().isVisible(), "audit log records report.update");
  check(await page.getByText("announcement.create").first().isVisible(), "audit log records announcement.create");
}

check(consoleErrors.length === 0, `no browser console errors${consoleErrors.length ? `: ${consoleErrors.slice(0, 3).join(" | ")}` : ""}`);
await browser.close();
console.log(failures ? `\n${failures} check(s) failed` : "\nAll e2e checks passed");
process.exit(failures ? 1 : 0);
