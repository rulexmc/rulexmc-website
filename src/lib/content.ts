import { prisma } from "@/lib/db";

/** Default copy, used when a block has not been created/edited in the admin dashboard yet. */
export const DEFAULT_BLOCKS: Record<string, { title: string; body: string }> = {
  "home.about": {
    title: "What is Lifesteal?",
    body:
      "Every player starts with 10 hearts. Kill another player and you steal one of their hearts. Die to a player and you lose one. Lose them all and you're eliminated until someone revives you.\n\nRuleXMC is a competitive Lifesteal SMP built for fair PvP, real economies and seasons that matter.",
  },
  "server.lifesteal": {
    title: "How Lifesteal works",
    body:
      "- You start with 10 hearts.\n- Killing a player steals one heart from them and gives it to you.\n- Dying to a player costs you one heart. Natural deaths may also cost hearts depending on season rules.\n- Hearts can be withdrawn as items and traded or used to revive eliminated players.\n- There is a maximum heart cap so nobody becomes unkillable.\n- Reach 0 hearts and you are eliminated until revived.",
  },
  "server.rules": {
    title: "Server rules",
    body:
      "- No hacked clients, x-ray, macros or unfair mods.\n- No exploiting bugs or duplication glitches — report them instead.\n- No combat logging. Logging out during combat counts as a death.\n- No hate speech, harassment or doxxing.\n- No real-money trading outside the official store.\n- Respect staff decisions; appeal through the proper channel.",
  },
  "server.faq": {
    title: "FAQ",
    body:
      "## Which Minecraft edition do I need?\nJava Edition. Check the version shown on this page for the supported range.\n\n## How do I get hearts back?\nKill players, craft heart items (if enabled this season) or trade with other players.\n\n## What happens when I reach 0 hearts?\nYou are eliminated. A teammate can revive you with a revive item.\n\n## Is combat logging allowed?\nNo. Leaving during combat counts as a death and costs a heart.\n\n## How do I report a cheater?\nCreate an account on this website, open the Player Portal and submit a report with evidence.",
  },
  "server.join": {
    title: "How to join",
    body:
      "- Open Minecraft: Java Edition and click Multiplayer.\n- Click Add Server and paste the server address shown above.\n- Click Done, then join. Use /spawn and the in-game guide to get started.",
  },
  "store.shop": {
    title: "In-game shop",
    body: "Use /shop in-game to buy and sell blocks, food and combat gear with your in-game balance. Prices are set by the server economy.",
  },
  "store.auction": {
    title: "Auction house",
    body: "Use /ah to list items for other players and bid on rare gear. Listings expire automatically; unsold items are returned to you.",
  },
  "store.kits": {
    title: "Kits & perks",
    body: "- Every player gets starter kits with /kit.\n- Ranks unlock additional kits with shorter cooldowns.\n- Perks are cosmetic or convenience items and never sell hearts directly.",
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
