import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, gameServerJsonLd, pageMetadata, siteJsonLd } from "@/lib/seo";
import { unavailableStatus, type ServerStatus } from "@/lib/status/types";

describe("structured data", () => {
  it("builds an absolute BreadcrumbList", () => {
    const d = breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Leaderboards", path: "/leaderboards" }], "https://example.com/");
    expect(d["@type"]).toBe("BreadcrumbList");
    expect(d.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://example.com" },
      { "@type": "ListItem", position: 2, name: "Leaderboards", item: "https://example.com/leaderboards" },
    ]);
  });
  it("describes the organization and website", () => {
    const d = siteJsonLd("https://example.com", "https://discord.com/invite/x");
    const types = d["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(["Organization", "WebSite"]);
    expect(d["@graph"][0]).toMatchObject({ url: "https://example.com", sameAs: ["https://discord.com/invite/x"] });
    expect(JSON.stringify(siteJsonLd("https://example.com", null))).not.toContain("sameAs");
  });
  it("marks noIndex pages", () => {
    expect(pageMetadata({ description: "d", path: "/x", noIndex: true }).robots).toEqual({ index: false, follow: false });
    expect(pageMetadata({ title: "T", description: "d", path: "/x" }).alternates).toEqual({ canonical: "/x" });
  });
});

describe("gameServerJsonLd", () => {
  const online: ServerStatus = {
    state: "online", address: "rulexmc.mcsh.io", version: "26.2", protocol: 1, software: "Paper", playersOnline: 42, playersMax: 100,
    motd: [], source: "mcsrvstat", fetchedAt: new Date(0).toISOString(),
  };
  it("includes live status and player count only when online", () => {
    const d = gameServerJsonLd("https://example.com", "rulexmc.mcsh.io", online);
    expect(d).toMatchObject({ "@type": "GameServer", serverStatus: "https://schema.org/Online", playersOnline: 42 });
    expect(d.game).toMatchObject({ "@type": "VideoGame", name: "Minecraft" });
  });
  it("never guesses when the lookup failed", () => {
    const d = gameServerJsonLd("https://example.com", "rulexmc.mcsh.io", unavailableStatus("rulexmc.mcsh.io", "mcsrvstat", "timeout"));
    expect(d).not.toHaveProperty("serverStatus");
    expect(d).not.toHaveProperty("playersOnline");
  });
  it("marks an unreachable server as temporarily offline without a count", () => {
    const d = gameServerJsonLd("https://example.com", null, { ...online, state: "offline", playersOnline: null });
    expect(d).toMatchObject({ serverStatus: "https://schema.org/OfflineTemporarily" });
    expect(d).not.toHaveProperty("playersOnline");
  });
});
