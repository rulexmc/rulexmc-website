-- Flag example/placeholder store listings so the storefront can badge them as samples.
ALTER TABLE "StoreListing" ADD COLUMN "isExample" BOOLEAN NOT NULL DEFAULT false;

-- The listings created by prisma/seed.ts are examples. Mark them (only rows that still carry the seeded
-- slugs and have no checkout configured; admins can untick "Example" in /admin/store at any time).
UPDATE "StoreListing"
SET "isExample" = true
WHERE "slug" IN ('vip', 'mvp', 'legend', 'crate-keys-5', 'cosmetic-trail')
  AND "tebexUrl" IS NULL
  AND "stripePriceId" IS NULL;
