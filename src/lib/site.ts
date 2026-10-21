/**
 * Verified, static facts about the RuleX MC network. This is the single source of truth for
 * marketing copy. Only add things here that the server owner has confirmed. Never put live
 * numbers (player counts, uptime) in this file: those come from the status lookup.
 */

export const SITE = {
  name: "RuleX MC",
  network: "RuleX Network",
  owner: "UHD Gaming",
  tagline: "Your heart. Your survival.",
  description:
    "RuleX MC is a Java + Bedrock crossplay Minecraft network (1.9 – 26.2+) with Lifesteal, Survival and PvP Practice. Join at rulexmc.mcsh.io.",
  canonicalUrl: "https://rulexmc-website.vercel.app",
  motd: "RuleX MC | CROSSPLAY [1.9 - 26.2+] ONLINE - LIFESTEAL / PRACTICE / SURVIVAL",
  discordInvite: "https://discord.com/invite/aBg5Wrp4U4",
  discordInviteCode: "aBg5Wrp4U4",
} as const;

export const SERVER_FACTS = {
  javaAddress: "rulexmc.mcsh.io",
  bedrockAddress: "rulexmc.mcsh.io",
  bedrockPort: 19132,
  versions: "1.9 – 26.2+",
  software: "Paper 26.2",
  editions: "Java + Bedrock crossplay",
  accounts: "Cracked + premium (AuthMe)",
  region: "India / Singapore",
} as const;

export type RealmId = "lifesteal" | "survival" | "practice";

export interface Realm {
  id: RealmId;
  name: string;
  kicker: string;
  summary: string;
  points: string[];
}

export const REALMS: Realm[] = [
  {
    id: "lifesteal",
    name: "Lifesteal",
    kicker: "High-stakes SMP",
    summary:
      "The flagship realm. Every kill steals a heart from your opponent, and every death costs you one. Run out and you face the consequences.",
    points: ["20,000 × 20,000 block world", "Steal hearts from the players you kill", "Live leaderboards for the best fighters"],
  },
  {
    id: "survival",
    name: "Survival",
    kicker: "Build · Claim · Explore",
    summary:
      "Classic survival with land claims and a player economy. Build your base, grow your balance, and travel to the edge of the world.",
    points: ["Land claiming to protect your builds", "Player-driven economy", "Far Lands enabled"],
  },
  {
    id: "practice",
    name: "PvP Practice",
    kicker: "Duel arenas",
    summary:
      "Warm up before the real fight. Duel other players in dedicated arenas and sharpen your combat before you risk your hearts.",
    points: ["Dedicated duel arenas", "Refine your combat mechanics", "Warm up for Lifesteal fights"],
  },
];

export const NETWORK_FEATURES = [
  {
    title: "Interactive hub",
    text: "Spawn into a custom lobby with launchpads and instant server-transfer portals to every realm.",
    icon: "portal",
  },
  {
    title: "Aurora XP progression",
    text: "A custom XP and levelling system. Earn Aurora XP as you play and level up your profile.",
    icon: "spark",
  },
  {
    title: "Hologram leaderboards",
    text: "Live in-game hologram podiums show the top players on the network.",
    icon: "trophy",
  },
  {
    title: "Clean HUD scoreboard",
    text: "A sidebar scoreboard keeps your balance, combat stats and XP progress in view.",
    icon: "hud",
  },
  {
    title: "Java + Bedrock crossplay",
    text: "Play on Java Edition, or on Bedrock from your phone, tablet or Windows PC. Versions 1.9 – 26.2+.",
    icon: "devices",
  },
  {
    title: "Cracked + premium",
    text: "Premium and non-premium accounts are both welcome. AuthMe login protects every account.",
    icon: "shield",
  },
] as const;

export type FeatureIcon = (typeof NETWORK_FEATURES)[number]["icon"];

/** Public server-list pages for RuleX MC (verified to exist). Voting helps new players find the server. */
export const VOTE_SITES = [
  { name: "MinecraftServers.org", href: "https://minecraftservers.org/vote/690544" },
  { name: "Minerank", href: "https://www.minerank.com/rulex-mc/vote" },
  { name: "mc-servers.com", href: "https://mc-servers.com/server/6711" },
] as const;

export interface FaqItem {
  q: string;
  a: string;
}

/** FAQ built only from confirmed facts. */
export const FAQ: FaqItem[] = [
  {
    q: "What is the server IP?",
    a: "rulexmc.mcsh.io for both editions. Java Edition uses the default port, so the address alone is enough. Bedrock Edition players enter rulexmc.mcsh.io with port 19132.",
  },
  {
    q: "Which Minecraft versions can join?",
    a: "Java Edition 1.9 through 26.2+ can connect. The server itself runs Paper 26.2.",
  },
  {
    q: "Can I play on Bedrock Edition?",
    a: "Yes. RuleX MC is a Java + Bedrock crossplay network, so Bedrock players on phones, tablets and Windows play alongside Java players. Add a server with address rulexmc.mcsh.io and port 19132.",
  },
  {
    q: "Do I need a premium (paid) account?",
    a: "No. Cracked and premium accounts are both accepted. The first time you join, the AuthMe login system asks you to register a password in chat, and you log in with it on later visits.",
  },
  {
    q: "What game modes are there?",
    a: "Three realms: Lifesteal (a high-stakes SMP on a 20,000 × 20,000 world where you steal hearts), Survival (land claims, an economy and the Far Lands), and PvP Practice (duel arenas). Walk through the portals in the hub to switch.",
  },
  {
    q: "Where is the server hosted?",
    a: "In the India / Singapore region, so players across South and Southeast Asia get the lowest ping. You can join from anywhere.",
  },
  {
    q: "Where do I get help, news and rule questions answered?",
    a: "Join our Discord for announcements, support and any questions about the rules.",
  },
  {
    q: "Is the store open?",
    a: "Not yet. The packages on the store page are examples, and payments stay disabled until the store is officially launched.",
  },
];
