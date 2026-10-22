"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { loginAction, registerAction, type AuthState } from "@/app/(auth)/actions";
import { rules, type RuleName } from "@/lib/form-rules";
import { SubmitButton } from "./SubmitButton";
import { Icon } from "./Icon";

interface FieldSpec {
  name: string;
  label: string;
  rule: RuleName;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  hint?: string;
}

/**
 * Inline validation on top of the server action: fields validate on blur, re-validate while you fix them,
 * and the first invalid field is focused on submit. Without JavaScript the form still posts and the
 * server returns the same messages.
 */
function useInlineValidation(specs: FieldSpec[], server: AuthState) {
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // A new server response replaces client errors (server messages take over until the field is edited).
  useEffect(() => { setErrors({}); setDirty({}); }, [server]);

  const values = () => {
    const fd = new FormData(formRef.current ?? undefined);
    return Object.fromEntries(specs.map((s) => [s.name, String(fd.get(s.name) ?? "")]));
  };
  const check = (name: string, all = values()) => {
    const spec = specs.find((s) => s.name === name)!;
    return rules[spec.rule](all[name] ?? "", all);
  };
  const onBlur = (name: string) => {
    if (!values()[name] && !dirty[name]) return; // don't nag on an untouched empty field
    setErrors((e) => ({ ...e, [name]: check(name) }));
  };
  const onChange = (name: string) => {
    setDirty((d) => ({ ...d, [name]: true }));
    const all = values();
    setErrors((e) => {
      const next = { ...e };
      if (e[name] !== undefined) next[name] = check(name, all);
      // Keep "confirm" in sync while the password changes.
      if (name === "password" && e.confirm !== undefined) next.confirm = check("confirm", all);
      return next;
    });
  };
  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    const all = values();
    const next = Object.fromEntries(specs.map((s) => [s.name, check(s.name, all)]));
    setErrors(next);
    setDirty(Object.fromEntries(specs.map((s) => [s.name, true])));
    const firstBad = specs.find((s) => next[s.name]);
    if (firstBad) {
      ev.preventDefault();
      formRef.current?.querySelector<HTMLInputElement>(`#${firstBad.name}`)?.focus();
    }
  };
  const errorFor = (name: string): string | undefined =>
    errors[name] !== undefined ? errors[name] ?? undefined : dirty[name] ? undefined : server.fields?.[name]?.[0];

  return { formRef, onBlur, onChange, onSubmit, errorFor };
}

function Field({
  spec, error, defaultValue, onBlur, onChange,
}: { spec: FieldSpec; error?: string; defaultValue?: string; onBlur: () => void; onChange: () => void }) {
  const [shown, setShown] = useState(false);
  const isPassword = spec.type === "password";
  const describedBy = [error ? `${spec.name}-err` : null, spec.hint ? `${spec.name}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={spec.name} className="label">{spec.label}</label>
      <div className="relative">
        <input
          id={spec.name}
          name={spec.name}
          type={isPassword && shown ? "text" : spec.type ?? "text"}
          autoComplete={spec.autoComplete}
          required
          defaultValue={isPassword ? undefined : defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
          onChange={onChange}
          className={`field ${isPassword ? "pr-12" : error ? "pr-10" : ""}`}
          spellCheck={false}
          autoCapitalize={spec.type === "email" || isPassword ? "none" : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            aria-controls={spec.name}
            aria-label={shown ? `Hide ${spec.label.toLowerCase()}` : `Show ${spec.label.toLowerCase()}`}
            className="absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded-md text-bone-400 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            {shown ? <EyeOff /> : <Eye />}
          </button>
        ) : error ? (
          <Icon name="alert" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blood-300" />
        ) : null}
      </div>
      {spec.hint ? <p id={`${spec.name}-hint`} className={`mt-1 text-xs text-bone-400 ${error ? "sr-only" : ""}`}>{spec.hint}</p> : null}
      {error ? (
        <p id={`${spec.name}-err`} className="field-error flex items-center gap-1.5 motion-safe:animate-[enter_0.2s_ease-out]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const Eye = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden focusable="false">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden focusable="false">
    <path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.5 7.6A16.6 16.6 0 0 0 2.5 12s3.5 6 9.5 6a9.3 9.3 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

function FormError({ state }: { state: AuthState }) {
  return state.error ? (
    <div role="alert" className="flex items-start gap-2.5 rounded-md border border-blood-500/50 bg-blood-900/40 px-4 py-3 text-sm text-blood-200">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{state.error}</span>
    </div>
  ) : null;
}

const LOGIN_FIELDS: FieldSpec[] = [
  { name: "email", label: "Email", type: "email", autoComplete: "email", rule: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "current-password", rule: "password" },
];

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, {});
  const v = useInlineValidation(LOGIN_FIELDS, state);
  return (
    <form ref={v.formRef} action={action} onSubmit={v.onSubmit} className="space-y-5" noValidate>
      <FormError state={state} />
      <input type="hidden" name="next" value={next} />
      {LOGIN_FIELDS.map((f) => (
        <Field key={f.name} spec={f} error={v.errorFor(f.name)} defaultValue={state.values?.[f.name]} onBlur={() => v.onBlur(f.name)} onChange={() => v.onChange(f.name)} />
      ))}
      <SubmitButton pendingText="Signing in…" className="btn-red w-full">Log in</SubmitButton>
      <p className="text-center text-sm text-bone-400">
        New here? <Link href="/register" className="link">Create an account</Link>
      </p>
    </form>
  );
}

const REGISTER_FIELDS: FieldSpec[] = [
  { name: "displayName", label: "Display name", autoComplete: "nickname", rule: "displayName", hint: "2–32 characters. Shown in your portal; not your in-game name." },
  { name: "email", label: "Email", type: "email", autoComplete: "email", rule: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", rule: "newPassword", hint: "At least 10 characters. Use a different password from your AuthMe one." },
  { name: "confirm", label: "Confirm password", type: "password", autoComplete: "new-password", rule: "confirm" },
];

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, {});
  const v = useInlineValidation(REGISTER_FIELDS, state);
  return (
    <form ref={v.formRef} action={action} onSubmit={v.onSubmit} className="space-y-5" noValidate>
      <FormError state={state} />
      {REGISTER_FIELDS.map((f) => (
        <Field key={f.name} spec={f} error={v.errorFor(f.name)} defaultValue={state.values?.[f.name]} onBlur={() => v.onBlur(f.name)} onChange={() => v.onChange(f.name)} />
      ))}
      <SubmitButton pendingText="Creating account…" className="btn-red w-full">Create account</SubmitButton>
      <p className="text-center text-sm text-bone-400">
        Already have an account? <Link href="/login" className="link">Log in</Link>
      </p>
    </form>
  );
}
