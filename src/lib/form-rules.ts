/**
 * Dependency-free client-side mirrors of the zod auth schemas in lib/validation.ts, so the login and
 * register forms can validate inline without shipping zod to the browser. The server always re-validates;
 * tests/form-rules.test.ts keeps these in step with the schemas.
 */

// Same shape zod's z.email() accepts for everyday addresses.
const EMAIL = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

export type Rule = (value: string, all: Record<string, string>) => string | null;

export const rules = {
  email: (v: string) => {
    const t = v.trim();
    if (!t) return "Enter your email";
    if (t.length > 254 || !EMAIL.test(t)) return "Enter a valid email";
    return null;
  },
  displayName: (v: string) => {
    const t = v.trim();
    if (t.length < 2) return "At least 2 characters";
    if (t.length > 32) return "At most 32 characters";
    return null;
  },
  newPassword: (v: string) => {
    if (v.length < 10) return "At least 10 characters";
    if (v.length > 128) return "At most 128 characters";
    return null;
  },
  password: (v: string) => (v.length === 0 ? "Enter your password" : v.length > 128 ? "At most 128 characters" : null),
  confirm: (v: string, all: Record<string, string>) => (v !== (all.password ?? "") ? "Passwords do not match" : null),
} satisfies Record<string, Rule>;

export type RuleName = keyof typeof rules;
