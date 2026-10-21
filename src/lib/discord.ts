import "server-only";
import { z } from "zod";

const inviteSchema = z.object({
  guild: z.object({ name: z.string() }).optional(),
  approximate_member_count: z.number().int().nonnegative().optional(),
  approximate_presence_count: z.number().int().nonnegative().optional(),
});

export interface DiscordInviteInfo {
  name: string | null;
  members: number | null;
  online: number | null;
}

/** Extract the invite code from a discord.gg / discord.com/invite URL. */
export function inviteCodeFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const parts = u.pathname.split("/").filter(Boolean);
    let code: string | undefined;
    if (host === "discord.gg") code = parts[0];
    else if ((host === "discord.com" || host === "discordapp.com") && parts[0] === "invite") code = parts[1];
    return code && /^[A-Za-z0-9-]{2,32}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

/**
 * Real member/online counts from Discord's public invite endpoint (no token needed).
 * Cached for 10 minutes. Returns null on any failure so the UI simply hides the numbers.
 */
export async function getDiscordInvite(inviteUrl: string | null): Promise<DiscordInviteInfo | null> {
  const code = inviteCodeFromUrl(inviteUrl);
  if (!code) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const parsed = inviteSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    return {
      name: parsed.data.guild?.name ?? null,
      members: parsed.data.approximate_member_count ?? null,
      online: parsed.data.approximate_presence_count ?? null,
    };
  } catch {
    return null;
  }
}
