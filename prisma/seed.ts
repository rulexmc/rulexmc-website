/**
 * Idempotent seed: example announcement + example store listings.
 * Run: npm run db:seed   (safe to run multiple times; never overwrites admin edits)
 * Listings are EXAMPLES — edit names/prices/features in /admin/store before launch.
 */
import { PrismaClient, type ListingKind } from "@prisma/client";

const prisma = new PrismaClient();

const LISTINGS: Array<{
  slug: string; name: string; kind: ListingKind; tagline: string; description: string;
  priceCents: number; features: string[]; highlight?: boolean; sortOrder: number;
}> = [
  {
    slug: "vip", name: "VIP", kind: "RANK", sortOrder: 1, priceCents: 499,
    tagline: "Stand out from the crowd",
    description: "A starter rank with quality-of-life perks.",
    features: ["Coloured chat prefix", "2 extra homes", "VIP kit (weekly)", "/hat"],
  },
  {
    slug: "mvp", name: "MVP", kind: "RANK", sortOrder: 2, priceCents: 999, highlight: true,
    tagline: "For dedicated survivors",
    description: "Everything in VIP plus better kits and cosmetics.",
    features: ["Coloured chat prefix", "2 extra homes", "VIP kit (weekly)", "/hat", "MVP kit (weekly)", "/craft & /enderchest", "Particle trail"],
  },
  {
    slug: "legend", name: "Legend", kind: "RANK", sortOrder: 3, priceCents: 1999,
    tagline: "The ultimate RuleXMC rank",
    description: "Every perk, maximum flex. Still no hearts for sale — earn them.",
    features: ["Coloured chat prefix", "2 extra homes", "VIP kit (weekly)", "/hat", "MVP kit (weekly)", "/craft & /enderchest", "Particle trail", "Legend kit (weekly)", "Priority queue", "/nick"],
  },
  {
    slug: "crate-keys-5", name: "5× Rare crate keys", kind: "KIT", sortOrder: 10, priceCents: 299,
    tagline: "Open rare crates at spawn", description: "Five rare crate keys delivered in-game.", features: [],
  },
  {
    slug: "cosmetic-trail", name: "Ember trail", kind: "PERK", sortOrder: 20, priceCents: 199,
    tagline: "Leave a crimson trail", description: "Permanent cosmetic particle trail. No gameplay advantage.", features: [],
  },
];

async function main() {
  const listingCount = await prisma.storeListing.count();
  if (listingCount === 0) {
    for (const l of LISTINGS) {
      await prisma.storeListing.create({ data: { ...l, currency: process.env.STORE_CURRENCY || "USD", highlight: l.highlight ?? false } });
    }
    console.log(`Seeded ${LISTINGS.length} example store listings.`);
  } else {
    console.log(`Store already has ${listingCount} listings — skipped.`);
  }

  const annCount = await prisma.announcement.count();
  if (annCount === 0) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to the new RuleXMC website",
        body: "Create an account, link your Minecraft name and climb the leaderboards. Edit or remove this post in the admin dashboard.",
        pinned: true,
      },
    });
    console.log("Seeded welcome announcement.");
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log("ADMIN_EMAIL is set — run `npm run admin:create` to create/promote the admin account.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
