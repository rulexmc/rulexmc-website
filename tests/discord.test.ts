import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { inviteCodeFromUrl } = await import("@/lib/discord");

describe("inviteCodeFromUrl", () => {
  it("parses discord.com/invite and discord.gg links", () => {
    expect(inviteCodeFromUrl("https://discord.com/invite/aBg5Wrp4U4")).toBe("aBg5Wrp4U4");
    expect(inviteCodeFromUrl("https://discord.gg/abc-123")).toBe("abc-123");
  });
  it("rejects other hosts and junk", () => {
    expect(inviteCodeFromUrl("https://evil.example/invite/abc")).toBeNull();
    expect(inviteCodeFromUrl("not a url")).toBeNull();
    expect(inviteCodeFromUrl(null)).toBeNull();
  });
});
