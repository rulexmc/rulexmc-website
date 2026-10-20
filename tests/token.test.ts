import { describe, expect, it } from "vitest";
import { generateLinkCode, generateToken, safeEqual, sha256 } from "@/lib/auth/token";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("tokens", () => {
  it("generates unique url-safe tokens", () => {
    const a = generateToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateToken()).not.toBe(a);
  });
  it("compares in constant time correctly", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
  it("produces link codes in the expected format", () => {
    for (let i = 0; i < 50; i++) expect(generateLinkCode()).toMatch(/^RX-[A-HJ-NP-Z2-9]{6}$/);
  });
  it("hashes deterministically", () => {
    expect(sha256("x")).toHaveLength(64);
  });
});

describe("argon2 passwords", () => {
  it("hashes and verifies", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "correct horse battery")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });
});
