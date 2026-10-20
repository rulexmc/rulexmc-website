import net from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildHandshake, decodeVarInt, encodeVarInt, flattenMotd, pingServer } from "@/lib/status/slp";

describe("VarInt", () => {
  it.each([0, 1, 127, 128, 255, 25565, 2097151, 2147483647])("round-trips %i", (n) => {
    const enc = encodeVarInt(n);
    expect(decodeVarInt(enc)).toEqual([n, enc.length]);
  });
  it("encodes -1 as 5 bytes", () => {
    expect(encodeVarInt(-1).length).toBe(5);
  });
  it("returns null for incomplete input", () => {
    expect(decodeVarInt(Buffer.from([0x80]))).toBeNull();
  });
});

describe("handshake", () => {
  it("starts with a length-prefixed packet id 0x00 and ends with the status request", () => {
    const b = buildHandshake("localhost", 25565);
    const [len, n] = decodeVarInt(b)!;
    expect(b[n]).toBe(0x00);
    expect(b.subarray(n + len)).toEqual(Buffer.from([0x01, 0x00]));
  });
});

describe("flattenMotd", () => {
  it("flattens chat components and strips legacy colour codes", () => {
    expect(flattenMotd({ text: "§cRule", extra: [{ text: "X" }, "MC\nLifesteal"] })).toEqual(["RuleXMC", "Lifesteal"]);
  });
});

// A fake Minecraft server that answers the status request.
let server: net.Server;
let port = 0;
const STATUS = { version: { name: "Paper 1.21", protocol: 767 }, players: { online: 12, max: 100 }, description: { text: "Hello" } };

beforeAll(async () => {
  server = net.createServer((sock) => {
    sock.once("data", () => {
      const json = Buffer.from(JSON.stringify(STATUS), "utf8");
      const body = Buffer.concat([encodeVarInt(0), encodeVarInt(json.length), json]);
      // send in two chunks to exercise buffering
      const pkt = Buffer.concat([encodeVarInt(body.length), body]);
      sock.write(pkt.subarray(0, 5));
      setTimeout(() => sock.write(pkt.subarray(5)), 20);
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", () => r()));
  port = (server.address() as net.AddressInfo).port;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe("pingServer", () => {
  it("reads a status response from a server", async () => {
    const res = await pingServer("127.0.0.1", port, 2000);
    expect(res.players).toEqual({ online: 12, max: 100 });
    expect(res.version?.name).toBe("Paper 1.21");
  });
  it("rejects when nothing is listening", async () => {
    const closed = net.createServer();
    await new Promise<void>((r) => closed.listen(0, "127.0.0.1", () => r()));
    const p = (closed.address() as net.AddressInfo).port;
    await new Promise<void>((r) => closed.close(() => r()));
    await expect(pingServer("127.0.0.1", p, 1000)).rejects.toThrow();
  });
});
