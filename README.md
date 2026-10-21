# RuleXMC Website

Official website for **RuleX MC** (the RuleX Network): Lifesteal, Survival and PvP Practice for Minecraft Java + Bedrock (crossplay, 1.9 – 26.2+).
Black and deep-red "premium gaming" design, live server status, leaderboards fed by the game server,
a store with a payment provider abstraction, a player portal, and an admin dashboard.

> Default server address: `rulexmc.mcsh.io` (set in `.env` → `MC_SERVER_ADDRESS`).
> All verified server facts used in marketing copy (versions, Bedrock port, realms, FAQ, vote pages, Discord invite) live in **`src/lib/site.ts`**. Edit that file, not individual pages, and only add facts the owner has confirmed. Live numbers never go there.

---

## Contents

1. [Stack & rationale](#stack--rationale)
2. [Features](#features)
3. [Folder structure](#folder-structure)
4. [Setup & local development](#setup--local-development)
5. [Commands](#commands)
6. [Configuration (.env)](#configuration-env)
7. [Production deployment](#production-deployment)
8. [INTEGRATIONS: what needs server-side work](#integrations)
9. [Ingest API reference](#ingest-api-reference)
10. [Security notes](#security-notes)
11. [Testing checklist](#testing-checklist)
12. [Known limitations](#known-limitations)

---

## Stack & rationale

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + React 19 + TypeScript (strict) | Server components keep secrets, DB access and status checks on the server. Server actions handle forms without a separate API layer. Deploys to Vercel or plain Node/Docker. |
| Styling | **Tailwind CSS 4** + `next/font` (Orbitron, Rajdhani, Inter) | Utility CSS with a small custom theme (`src/app/globals.css`). Fonts are self-hosted at build time, so there are no runtime Google requests. |
| Database | **PostgreSQL** + **Prisma 6** | Typed queries, versioned SQL migrations, and managed Postgres is available on every host (Neon, Supabase, RDS, Railway…). |
| Validation | **zod 4** | One schema per input, shared by server actions and API routes. |
| Auth | **Built-in session auth**: Argon2id (`@node-rs/argon2`) password hashes and DB-backed sessions (random 256-bit token in an httpOnly cookie, only its SHA-256 stored) | Email/password only, so Auth.js would add weight without adding anything. Sessions can be revoked (deleting rows logs users out, which demotion does). Roles: `PLAYER` and `ADMIN`. |
| Rate limiting | Postgres fixed-window counter (single atomic upsert) | Works across several instances and on serverless without Redis. |
| Tests | **Vitest** (unit), `scripts/smoke.sh` (HTTP), `scripts/e2e.mjs` (optional Playwright) | Lean. Playwright isn't a project dependency. |

Runtime dependencies: `next`, `react`, `react-dom`, `@prisma/client`, `@node-rs/argon2`, `zod`, `server-only`. That's all.

## Features

- **Home**: "YOUR HEART. YOUR SURVIVAL." hero, copy-to-clipboard server IP (with fallback), live status chip and player count, PLAY NOW / LEADERBOARDS / STORE, realm cards (Lifesteal / Survival / PvP Practice), network features, Java + Bedrock join guide, top-5 kills teaser, latest announcements, Discord call-to-action (real member/online counts from Discord's public invite API, hidden on failure), vote links, FAQ preview.
- **Server** (`/server`): connection & compatibility facts (Java IP, Bedrock IP + port 19132, versions, Paper 26.2, cracked + premium via AuthMe, region, owner), live status, live MOTD (or the official MOTD when the lookup fails), step-by-step join guide for both editions, realm details, Lifesteal mechanics, rules block, network features and a full FAQ (with FAQPage JSON-LD). The Lifesteal / rules blocks, plus optional `server.join` / `server.faq` extras, are editable in the admin dashboard.
- **`/discord`**: short redirect to the Discord invite.
- **Leaderboards** (`/leaderboards`): kills, deaths, balance and playtime. Ascending/descending sort, pagination, name search, and mc-heads.net avatars. The data comes from a `StatsProvider`. Sample data always carries a **"SAMPLE DATA — NOT LIVE"** badge and a notice.
- **Store** (`/store`): "store not open yet" notice, rank cards, an auto-generated feature comparison table, kits and perks, and info blocks. Listings flagged **Example** (`isExample`, toggle in `/admin/store`; the seeded ones are examples) carry an "Example" badge and "example price" label. Purchase buttons go through the payment abstraction. When nothing is configured they're disabled and read **"Payments not configured"**.
- **Player portal** (`/portal`): register, log in, link a Minecraft username, verify ownership with an in-game code, skin render, stats with leaderboard rank, K/D, hearts, balance and playtime (when reported), recent activity, and player reports (`/portal/reports`).
- **Admin** (`/admin`, ADMIN only, checked on the server in the layout, every page and every action): overview (live status, stats summary, integration checklist, recent accounts with promote/demote), CRUD for announcements, editable content blocks, a report review queue, store listings, and a paginated **audit log**. There's deliberately **no console, RCON or server power control**.
- **Status**: fetched on the server from mcsrvstat.us (Next data cache, 60 s) or a built-in Java **Server List Ping** (`STATUS_SOURCE=ping`, cached in memory). The client refreshes `/api/status` every 60 s. On failure it shows **"Status unavailable"**. It never shows hardcoded numbers.
- **SEO & social**: per-page titles, descriptions and canonical URLs (`src/lib/seo.ts`), Open Graph + Twitter `summary_large_image` tags, a generated OG image (`src/app/opengraph-image.tsx`), SVG favicon + generated Apple touch icon, web manifest, Organization/WebSite JSON-LD, `robots.txt` and `sitemap.xml`. Metadata is always rendered in the initial `<head>` (`htmlLimitedBots`).
- **Quality**: mobile menu with focus trap, Esc to close and scroll lock, active-page nav state, loading skeletons, error and global-error boundaries, a custom 404, empty states, `prefers-reduced-motion` support (particles off, no animation), a skip link, labelled fields with `aria-invalid`, security headers, rate limits, `robots.txt` and `sitemap.xml`.

## Folder structure

```
rulexmc-website/
├─ prisma/
│  ├─ schema.prisma            # data model (users, sessions, stats, store, reports, audit, rate limits…)
│  ├─ migrations/              # SQL migrations (prisma migrate deploy)
│  └─ seed.ts                  # idempotent: example store listings + welcome announcement
├─ scripts/
│  ├─ create-admin.ts          # create/promote the first ADMIN (args or env)
│  ├─ sync-vanilla-stats.mjs   # example: vanilla world stats → POST /api/ingest/stats
│  ├─ smoke.sh                 # HTTP smoke test against a running instance
│  └─ e2e.mjs                  # optional Playwright browser flow
├─ src/
│  ├─ middleware.ts            # fast signed-out redirect for /portal & /admin (not the security boundary)
│  ├─ app/
│  │  ├─ page.tsx              # home
│  │  ├─ server/ leaderboards/ store/
│  │  ├─ (auth)/login, (auth)/register, (auth)/actions.ts
│  │  ├─ portal/               # player portal + reports + server actions
│  │  ├─ admin/                # dashboard pages + actions.ts (each action calls requireAdmin)
│  │  ├─ api/status            # GET live status JSON
│  │  ├─ api/health            # GET db health
│  │  ├─ api/ingest/stats      # POST stats from game server (shared secret)
│  │  ├─ api/ingest/verify     # POST in-game /verify codes
│  │  ├─ api/ingest/purchases  # GET undelivered paid purchases / POST mark delivered
│  │  ├─ api/checkout          # POST → Stripe Checkout Session
│  │  ├─ api/webhooks/stripe   # Stripe webhook (signature verified)
│  │  ├─ not-found.tsx error.tsx global-error.tsx robots.ts sitemap.ts icon.svg
│  ├─ components/              # Logo, ParticleCanvas, CopyAddress, StatusPanel, forms, …
│  └─ lib/
│     ├─ config.ts             # ALL env-driven config (server address, providers, links)
│     ├─ db.ts  audit.ts  rate-limit.ts  validation.ts  request.ts  content.ts  avatar.ts
│     ├─ auth/                 # password (argon2id), session, tokens
│     ├─ status/               # mcsrvstat client, SLP ping implementation
│     ├─ stats/                # StatsProvider interface + database & sample providers
│     └─ payments/             # provider abstraction, Stripe checkout & signature verification
├─ tests/                      # vitest unit tests
├─ Dockerfile  docker-compose.yml  .env.example
```

## Setup & local development

Requirements: Node.js ≥ 20.9 and PostgreSQL ≥ 14.

```bash
cp .env.example .env
# edit DATABASE_URL, and set INGEST_SECRET=$(openssl rand -hex 32)

npm install                 # also runs prisma generate
npm run db:deploy           # apply migrations (use db:migrate while changing the schema)
npm run db:seed             # example store listings + welcome announcement (idempotent)
npm run admin:create -- --email you@example.com --password 'a-long-admin-password' --name Owner
npm run dev                 # http://localhost:3000
```

No database handy? Run `docker run -d --name rx-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_USER=rulexmc -e POSTGRES_DB=rulexmc -p 5432:5432 postgres:17-alpine`
and set `DATABASE_URL="postgresql://rulexmc:dev@localhost:5432/rulexmc?schema=public"`.

To preview the leaderboards without a game server, set `STATS_PROVIDER=sample`. The pages are then badged **SAMPLE DATA**.

For local `next start` over plain http, set `INSECURE_COOKIES=1`. Otherwise production builds mark the session cookie `Secure`, and browsers drop it on http://localhost.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` / `npm start` | Production build / start (`next start`, port via `-p` or `PORT`) |
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm run lint` | ESLint (next/core-web-vitals and next/typescript) |
| `npm test` | Vitest unit tests |
| `npm run smoke` | HTTP smoke test (`BASE_URL`, optional `INGEST_SECRET`) |
| `npm run db:migrate` / `db:deploy` / `db:seed` | Prisma migrate dev / deploy / seed |
| `npm run admin:create -- --email … --password … [--name …] [--reset-password]` | Create or promote an admin |
| `npm run stats:sync -- --server /path/to/mc [--world world] [--dry-run]` | Example vanilla stats sync |
| `node scripts/e2e.mjs` | Optional browser test (needs `playwright-core` and Chrome; see the file header) |

## Configuration (.env)

Every variable is documented in [`.env.example`](./.env.example). The main ones:

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL URL (required) |
| `SITE_URL` | Vercel production domain, else `http://localhost:3000` | Public canonical URL (production: `https://rulexmc-website.vercel.app`), used for metadata, canonical/OG URLs, the sitemap and Stripe redirects |
| `MC_SERVER_ADDRESS` | `rulexmc.mcsh.io` | `host` or `host:port`. **Empty string** = "Server address not configured" and no status checks |
| `MC_VERSION_LABEL` | `1.9 – 26.2+` | Supported client range shown on the site. Empty = the verified default |
| `STATUS_SOURCE` | `mcsrvstat` | or `ping` (direct SLP from the web server; needs outbound TCP to the MC port) |
| `STATS_PROVIDER` | `database` | or `sample` (dev only, always badged) |
| `INGEST_SECRET` | — | ≥ 32 chars. Ingest endpoints return 503 until it's set |
| `PAYMENT_PROVIDER` | `none` | `tebex` or `stripe` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | — | Server-side only |
| `DISCORD_URL` | official invite | Unset = `https://discord.com/invite/aBg5Wrp4U4`; empty string = hide Discord everywhere |
| `YOUTUBE_URL`, `TIKTOK_URL`, `X_URL`, `VOTE_URL` | — | Footer links. Unset = hidden. `VOTE_URL` is added before the built-in vote pages |
| `RATE_LIMIT_STORE` | `postgres` | `memory` = single-instance only |

## Production deployment

### Option A: Vercel + managed Postgres

1. Create a Postgres database (Neon, Supabase, Vercel Postgres, Railway…). If the provider offers a pooled URL (e.g. Neon `-pooler`), use it for `DATABASE_URL`.
2. Import the repo into Vercel and add the env vars from `.env.example`. Set `SITE_URL=https://your-domain` and **don't** set `INSECURE_COOKIES`.
3. Build command: `npx prisma migrate deploy && npm run build` (install runs `prisma generate` via `postinstall`).
4. After the first deploy, run this once from your machine against the production DB:
   `DATABASE_URL=… npm run db:seed && DATABASE_URL=… npm run admin:create -- --email … --password …`
5. Stripe only: add a webhook endpoint at `https://your-domain/api/webhooks/stripe` for the `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired` events, then copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

### Option B: self-hosted Docker (web + Postgres)

```bash
cp .env.example .env     # set POSTGRES_PASSWORD, INGEST_SECRET, SITE_URL, …
docker compose up -d --build              # migrations run automatically on container start
docker compose run --rm tools db:seed
docker compose run --rm tools admin:create -- --email you@example.com --password 'long-password'
```

Put a TLS reverse proxy (Caddy, Nginx or Traefik) in front of port 3000 and make sure it sets `X-Forwarded-For`, because rate limiting keys on it.
The image is a Next.js **standalone** build (`NEXT_OUTPUT=standalone`) running as a non-root user.

### Option C: plain Node (systemd / pm2)

```bash
npm ci && npx prisma migrate deploy && npm run build
PORT=3000 npm start      # behind a TLS reverse proxy
```

## INTEGRATIONS

What each feature needs on the **Minecraft (Paper) server side**. Everything else works with the website alone.

| Feature | Server-side requirement | Status without it |
|---|---|---|
| **Server status and player count** | **None.** Uses mcsrvstat.us (or direct SLP). The server only needs `enable-status=true` (the default) and must be publicly reachable. | — |
| Version shown | None. It's whatever the server reports in its ping. Override with `MC_VERSION_LABEL` (handy for ViaVersion-style "1.9–26.x" ranges). | — |
| **Leaderboards: kills, deaths, playtime** | Push data to `POST /api/ingest/stats`. Two ways: **(a)** the bundled `scripts/sync-vanilla-stats.mjs`, run by cron on the MC host. It reads vanilla stat files, `world/stats/*.json` (or `world/players/stats/*.json` on newer layouts) plus `usercache.json`, giving `player_kills`, `deaths` and `play_time`. **(b)** A small plugin or Skript that POSTs on quit and every few minutes. | Empty state: "No stats yet" |
| **Balance** | Needs an economy plugin. Vanilla has no money. **Vault** (or VaultUnlocked) plus an economy provider such as **EssentialsX Economy**. Read `Economy#getBalance(player)` in a plugin, or the `%vault_eco_balance%` placeholder via **PlaceholderAPI**, and send `balance`. | Shows "—"; the balance board lists only players with a reported balance |
| **Hearts** | A Lifesteal plugin, e.g. **LifeStealZ** (it exposes PlaceholderAPI placeholders and an API; check the plugin docs for the exact placeholder name). Send `hearts` (integer). | Hearts are hidden |
| Kills/deaths from a plugin | Optional. If you'd rather use a stats plugin (e.g. LifeStealZ kill counters, PlaceholderAPI `%statistic_player_kills%` / `%statistic_deaths%` from the Statistic expansion, or Plan), send those instead of vanilla values. Fields are merged individually, so different sources can send different fields. | — |
| **Account ownership verification** | A `/verify <code>` command (plugin, Skript or command handler) that POSTs `{code, name, uuid}` to `/api/ingest/verify` with the shared secret, then shows the returned `message` to the player. | Usernames can be linked but stay **"Unverified"** |
| **Payments: Tebex** | A Tebex webstore with packages. Paste each package's checkout URL into the listing (`/admin/store`) and set `PAYMENT_PROVIDER=tebex`. **Delivery is handled by the Tebex plugin** on the server. | Buttons disabled: "Payments not configured" |
| **Payments: Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and a Stripe Price ID per listing. **In-game delivery needs a plugin/script** that polls `GET /api/ingest/purchases` (PAID, undelivered), grants the rank (e.g. `lp user <name> parent add vip` with **LuckPerms**), then `POST`s `{delivered:[ids]}`. | Buttons disabled |
| Announcements, content, store listings, reports | None (website DB) | — |
| Shop / auction house info | None. These are text blocks describing your in-game `/shop` and `/ah` plugins (e.g. a GUI shop and an AuctionHouse plugin); edit them in the admin dashboard. | — |

**PlaceholderAPI tip:** a single small plugin that resolves a list of placeholders for each online player and POSTs them is the most flexible approach. Map placeholders to the `kills`, `deaths`, `balance`, `playtimeSeconds` and `hearts` fields.

## Ingest API reference

All `/api/ingest/*` calls need `Authorization: Bearer $INGEST_SECRET`. They're rate limited to 120 requests/min per IP and return `401` for a bad secret and `503` when no secret is set.

**POST `/api/ingest/stats`**: up to 500 players per request. Fields you leave out are left unchanged.

```bash
curl -X POST "$SITE_URL/api/ingest/stats" \
  -H "Authorization: Bearer $INGEST_SECRET" -H "Content-Type: application/json" \
  -d '{"source":"lifesteal-plugin","players":[
        {"uuid":"069a79f4-44e9-4726-a5be-fca90e38aaf5","name":"Notch",
         "kills":12,"deaths":3,"playtimeSeconds":86400,"balance":1520.75,"hearts":13,
         "lastSeen":"2026-10-20T10:00:00+05:30"}]}'
# → {"ok":true,"upserted":1}     422 on validation errors (details in "issues")
```

**POST `/api/ingest/verify`**: `{"code":"RX-ABC234","name":"Notch","uuid":"…"}` → `200 {ok:true,message}`, `404` for an invalid or expired code, `409` for a name mismatch or an account that's already linked.
Codes expire after 15 minutes and work once.

**GET `/api/ingest/purchases`** → `{purchases:[{id,mcUsername,listing:{slug,name,kind},createdAt}]}`
**POST `/api/ingest/purchases`** `{"delivered":["<id>",…]}` → marks them delivered.

## Security notes

- Passwords are hashed with Argon2id (19 MiB, t=2). Logins for unknown emails still run a dummy hash, so response timing doesn't reveal which emails exist.
- Session tokens are 256-bit random values in an `httpOnly` `SameSite=Lax` cookie (`Secure` in production). Only their SHA-256 hash is stored, and sessions expire after 30 days.
- Server actions get Next.js's built-in Origin check. `/api/checkout` checks Origin too. Login redirects only accept same-site paths (`safeNextPath`).
- Admin authorization happens on the server in the admin layout, in every admin page, and in **every** admin action (`requireAdmin`). The middleware redirect is only a convenience.
- Rate limits: login 10 per 15 min per IP, register 5 per hour per IP, reports 5 per hour per user, verification codes 6 per hour per user, checkout 20 per hour per IP, ingest 120 per minute per IP.
- Headers: CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, and HSTS in production. `X-Powered-By` is removed.
- The ingest secret is compared in constant time. Stripe webhooks are HMAC-verified with a 5-minute tolerance.
- Admin-editable text is rendered as React text nodes, never as HTML, so there's no XSS path. Report evidence links must be `https://`.
- Sensitive actions are audit-logged: admin logins, every admin CRUD action, role changes, account verification, purchases, and CLI admin creation.

## Testing checklist

Automated:

- [x] `npm run typecheck`: no errors
- [x] `npm run lint`: no warnings
- [x] `npm test`: 56 unit tests (config/address parsing, SLP VarInt and a real TCP ping against a fake server, mcsrvstat mapping, rate limiter, zod schemas including open-redirect and https-only checks, sample provider sort/search/pagination, payment state, Stripe signature verification, content parser, tokens, argon2)
- [x] `npm run build`
- [x] `BASE_URL=… INGEST_SECRET=… npm run smoke`: 31 HTTP checks (pages, 404, auth redirects, headers, status, health, ingest auth/validation/upsert, leaderboard shows ingested data, checkout origin check)
- [x] `node scripts/e2e.mjs`: browser flow (copy button and clipboard, register validation, link and verify via the ingest API, report, player denied /admin, admin login with a wrong and then a correct password, announcement shows on home, report resolved, audit entries, no console errors)

Manual before launch:

- [ ] Status shows Online and a player count with your real address; set `MC_SERVER_ADDRESS=""` and confirm "Server address not configured"
- [ ] Mobile menu opens and closes (Esc works too); the layout holds at 360 px wide
- [ ] With "reduce motion" turned on in the OS, particles and animations stop
- [ ] Copy IP works on iOS Safari and Android Chrome
- [ ] Store shows "Payments not configured" with `PAYMENT_PROVIDER=none`; with Tebex links set, the buttons open Tebex
- [ ] Stripe test mode: checkout redirect → webhook marks the purchase PAID → it appears in `GET /api/ingest/purchases`
- [ ] Run the stats sync / plugin once and confirm the leaderboards show "Live server data"
- [ ] Create the admin, edit rules/FAQ, and check the Server page updates
- [ ] Remove or replace the example store listings and prices

## Known limitations

- **Paid purchases aren't delivered in-game automatically with Stripe.** You need the polling plugin/script described above. Tebex handles its own delivery.
- The `/verify` command and the stats push are documented contracts. No Paper plugin jar ships with this repo.
- The Docker image and compose file haven't been build-tested on this machine (no Docker). The Next.js standalone build they rely on was built and run locally.
- `STATUS_SOURCE=ping` caches in memory per instance, and on serverless each cold start pings again. mcsrvstat.us has its own cache of a few minutes.
- No password reset by email (no mail provider in scope). Admins can reset passwords with `npm run admin:create -- … --reset-password` for admin accounts.
- Avatars are looked up by username on mc-heads.net. Servers in offline mode, or players with non-premium names, get a default skin.
