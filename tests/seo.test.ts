import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, pageMetadata, siteJsonLd } from "@/lib/seo";

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
