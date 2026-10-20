import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SERVER_ADDRESS, getConfig, parseServerAddress } from "@/lib/config";

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });

describe("parseServerAddress", () => {
  it("parses host only with default port", () => {
    expect(parseServerAddress("play.example.com")).toEqual({ host: "play.example.com", port: 25565, display: "play.example.com" });
  });
  it("parses host:port and keeps the port in display", () => {
    expect(parseServerAddress("mc.example.net:25570")).toEqual({ host: "mc.example.net", port: 25570, display: "mc.example.net:25570" });
  });
  it("parses bracketed IPv6", () => {
    expect(parseServerAddress("[::1]:25566")?.port).toBe(25566);
  });
  it("rejects empty / invalid values", () => {
    expect(parseServerAddress("")).toBeNull();
    expect(parseServerAddress("   ")).toBeNull();
    expect(parseServerAddress("bad host!")).toBeNull();
    expect(parseServerAddress("host:99999")).toBeNull();
  });
});

describe("getConfig", () => {
  it("defaults to the RuleXMC address when unset", () => {
    delete process.env.MC_SERVER_ADDRESS;
    expect(getConfig().server.address?.display).toBe(DEFAULT_SERVER_ADDRESS);
  });
  it("treats an explicit empty address as unconfigured", () => {
    process.env.MC_SERVER_ADDRESS = "";
    expect(getConfig().server.address).toBeNull();
  });
  it("hides community links that are unset or not http(s)", () => {
    process.env.DISCORD_URL = "https://discord.gg/abc";
    process.env.YOUTUBE_URL = "javascript:alert(1)";
    delete process.env.X_URL;
    const c = getConfig().community;
    expect(c.discord).toBe("https://discord.gg/abc");
    expect(c.youtube).toBeNull();
    expect(c.x).toBeNull();
  });
  it("falls back to safe provider defaults", () => {
    process.env.PAYMENT_PROVIDER = "paypal";
    process.env.STATS_PROVIDER = "whatever";
    const c = getConfig();
    expect(c.payments.provider).toBe("none");
    expect(c.statsProvider).toBe("database");
  });
});
