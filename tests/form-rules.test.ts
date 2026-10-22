import { describe, expect, it } from "vitest";
import { rules } from "@/lib/form-rules";
import { loginSchema, registerSchema } from "@/lib/validation";

const emails = ["a@b.co", "player.one+mc@example.com", "x@sub.domain.in", "bad", "a@b", "a@@b.com", " spaced@example.com ", "a..b@example.com", ".a@example.com", ""];

describe("client form rules mirror the zod schemas", () => {
  it("email", () => {
    for (const e of emails) {
      const zodOk = loginSchema.shape.email.safeParse(e).success;
      expect(rules.email(e) === null, `email ${JSON.stringify(e)}`).toBe(zodOk);
    }
  });
  it("display name, password and confirm", () => {
    const base = { email: "a@b.co", displayName: "Alex", password: "0123456789", confirm: "0123456789" };
    const cases: Partial<typeof base>[] = [
      {}, { displayName: "A" }, { displayName: " A " }, { displayName: "x".repeat(33) }, { displayName: "x".repeat(32) },
      { password: "short", confirm: "short" }, { password: "x".repeat(129), confirm: "x".repeat(129) }, { confirm: "nope" },
    ];
    for (const c of cases) {
      const v = { ...base, ...c };
      const zodOk = registerSchema.safeParse(v).success;
      const clientOk = [rules.email(v.email), rules.displayName(v.displayName), rules.newPassword(v.password), rules.confirm(v.confirm, v)].every((x) => x === null);
      expect(clientOk, JSON.stringify(c)).toBe(zodOk);
    }
  });
  it("login password just needs to be present", () => {
    expect(rules.password("")).not.toBeNull();
    expect(rules.password("x")).toBeNull();
  });
});
