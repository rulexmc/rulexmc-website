import { prisma } from "@/lib/db";

/** Default copy, used when a block has not been created/edited in the admin dashboard yet. */
export const DEFAULT_BLOCKS: Record<string, { title: string; body: string }> = {
  "home.about": {
    title: "One network. Three ways to play.",
    body:
      "RuleX MC (the RuleX Network) is a crossplay Minecraft network for Java and Bedrock players, run by UHD Gaming and hosted in the India / Singapore region.\n\nSpawn into the hub, pick a portal and drop into Lifesteal, Survival or PvP Practice. Earn custom Aurora XP as you play and level up your profile.",
  },
  "server.lifesteal": {
    title: "How Lifesteal works",
    body:
      "Lifesteal is the flagship RuleX MC realm: a high-stakes SMP where hearts are everything.\n\n- Kill another player and you steal one of their hearts.\n- Die to a player and they take one of yours.\n- Lose all your hearts and you face the consequences.\n- The world is 20,000 × 20,000 blocks, so there is room to build, hide and hunt.",
  },
  "server.rules": {
    title: "Server rules",
    body:
      "The full RuleX MC rulebook will be published on this page. Until then, play fair, respect other players, and ask the team on Discord if you are unsure whether something is allowed.",
  },
  "server.faq": {
    title: "More questions",
    body: "",
  },
  "server.join": {
    title: "Good to know",
    body: "",
  },
  "store.shop": {
    title: "In-game economy",
    body:
      "Survival has a player-driven economy. Your balance is shown on the in-game HUD scoreboard, and the richest players appear on the leaderboards.",
  },
  "store.auction": {
    title: "Questions?",
    body: "Questions about ranks, the store or your account? Ask the team on the RuleX MC Discord.",
  },
  "store.kits": {
    title: "Store status",
    body:
      "The store is not open yet. Packages shown on this page are examples only and cannot be bought. Official packages and prices will be announced on Discord when the store launches.",
  },
};

export async function getBlock(key: string): Promise<{ title: string; body: string }> {
  const fallback = DEFAULT_BLOCKS[key] ?? { title: key, body: "" };
  try {
    const b = await prisma.contentBlock.findUnique({ where: { key } });
    return b ? { title: b.title, body: b.body } : fallback;
  } catch {
    return fallback;
  }
}

/** Only the block an admin actually saved (null when it has never been edited or the DB is unreachable). */
export async function getStoredBlock(key: string): Promise<{ title: string; body: string } | null> {
  try {
    const b = await prisma.contentBlock.findUnique({ where: { key } });
    return b && b.body.trim() ? { title: b.title, body: b.body } : null;
  } catch {
    return null;
  }
}

export type ContentNode =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "faq"; q: string; a: string[] };

/** Tiny safe renderer for admin-editable text: "- " list items, "## " FAQ questions, blank-line paragraphs. */
export function parseContent(body: string): ContentNode[] {
  const nodes: ContentNode[] = [];
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let faqOpen = false;
  const flush = () => {
    if (para.length) nodes.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    const last = nodes[nodes.length - 1];
    if (!line) {
      flush();
      if (last && last.type === "faq" && last.a.length > 0) faqOpen = false;
      continue;
    }
    if (line.startsWith("## ")) { flush(); nodes.push({ type: "faq", q: line.slice(3), a: [] }); faqOpen = true; continue; }
    if (line.startsWith("- ")) {
      flush();
      faqOpen = false;
      if (last && last.type === "ul") last.items.push(line.slice(2));
      else nodes.push({ type: "ul", items: [line.slice(2)] });
      continue;
    }
    if (faqOpen && last && last.type === "faq" && para.length === 0) { last.a.push(line); continue; }
    para.push(line);
  }
  flush();
  return nodes;
}
