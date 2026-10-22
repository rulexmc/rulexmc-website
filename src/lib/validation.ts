import { z } from "zod";

export const MC_USERNAME = /^[A-Za-z0-9_]{3,16}$/;
const UUID_RE = /^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$/;

export function normaliseUuid(uuid: string): string {
  const hex = uuid.replace(/-/g, "").toLowerCase();
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const mcUsernameSchema = z.string().trim().regex(MC_USERNAME, "3–16 characters: letters, numbers, underscore");

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email")),
    displayName: z.string().trim().min(2, "At least 2 characters").max(32, "At most 32 characters"),
    password: z.string().min(10, "At least 10 characters").max(128, "At most 128 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Enter your password").max(128),
});

export const reportSchema = z.object({
  targetName: mcUsernameSchema,
  category: z.enum(["CHEATING", "GRIEFING", "CHAT_ABUSE", "SCAM", "BUG", "OTHER"]),
  description: z.string().trim().min(20, "Please give at least 20 characters of detail").max(2000),
  evidenceUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.url({ protocol: /^https$/, message: "Must be an https:// link" }).optional()),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(5000),
  published: z.boolean(),
  pinned: z.boolean(),
});

export const contentBlockSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_.-]{2,64}$/, "lowercase key, e.g. server.rules"),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(20000),
});

const optionalHttps = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.url({ protocol: /^https$/, message: "Must be an https:// URL" }).optional());

export const storeListingSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]{2,40}$/, "lowercase letters, numbers, dashes"),
  name: z.string().trim().min(2).max(40),
  kind: z.enum(["RANK", "KIT", "PERK"]),
  tagline: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2000).default(""),
  priceCents: z.coerce.number().int().min(0).max(1_000_000),
  currency: z.string().trim().regex(/^[A-Z]{3}$/, "3-letter ISO currency").default("USD"),
  features: z.array(z.string().trim().min(1).max(80)).max(30),
  highlight: z.boolean(),
  active: z.boolean(),
  isExample: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(-1000).max(1000),
  tebexUrl: optionalHttps,
  stripePriceId: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().regex(/^price_[A-Za-z0-9]+$/, "Stripe price IDs start with price_").optional()),
});

const nonNegInt = z.number().int().min(0).max(2_000_000_000);

export const ingestPlayerSchema = z.object({
  uuid: z.string().regex(UUID_RE, "invalid uuid").transform(normaliseUuid),
  name: mcUsernameSchema,
  kills: nonNegInt.optional(),
  deaths: nonNegInt.optional(),
  playtimeSeconds: nonNegInt.optional(),
  balance: z.number().finite().min(-1e15).max(1e15).optional(),
  hearts: z.number().int().min(0).max(1000).nullable().optional(),
  level: z.number().int().min(0).max(1_000_000).nullable().optional(),
  lastSeen: z.iso.datetime({ offset: true }).optional(),
});

export const ingestStatsSchema = z.object({
  source: z.string().trim().max(40).optional(),
  players: z.array(ingestPlayerSchema).min(1).max(500),
});

export const ingestVerifySchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^RX-[A-Z0-9]{6}$/, "invalid code"),
  name: mcUsernameSchema,
  uuid: z.string().regex(UUID_RE, "invalid uuid").transform(normaliseUuid),
});

export type FieldErrors = Record<string, string[] | undefined>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

export function safeNextPath(next: unknown, fallback = "/portal"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
