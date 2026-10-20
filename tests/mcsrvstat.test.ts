import { describe, expect, it } from "vitest";
import { mapMcsrvstat } from "@/lib/status/mcsrvstat";

describe("mapMcsrvstat", () => {
  it("maps an online response", () => {
    const s = mapMcsrvstat("play.example.com", {
      online: true, version: "Paper 1.21.4", software: "Paper",
      protocol: { version: 769, name: "1.21.4" },
      players: { online: 42, max: 500 }, motd: { clean: ["  Line one ", "", "Line two"] },
    });
    expect(s).toMatchObject({ state: "online", version: "1.21.4", playersOnline: 42, playersMax: 500, software: "Paper", motd: ["Line one", "Line two"] });
  });
  it("maps an offline response without player numbers", () => {
    const s = mapMcsrvstat("play.example.com", { online: false });
    expect(s.state).toBe("offline");
    expect(s.playersOnline).toBeNull();
  });
  it("returns unavailable for garbage", () => {
    expect(mapMcsrvstat("play.example.com", { nope: 1 }).state).toBe("unavailable");
  });
});
