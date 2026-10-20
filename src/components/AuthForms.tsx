"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthState } from "@/app/(auth)/actions";
import { SubmitButton } from "./SubmitButton";

function Field({
  name, label, type = "text", autoComplete, state, hint, required = true,
}: { name: string; label: string; type?: string; autoComplete?: string; state: AuthState; hint?: string; required?: boolean }) {
  const err = state.fields?.[name]?.[0];
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={type === "password" ? undefined : state.values?.[name]}
        aria-invalid={err ? true : undefined}
        aria-describedby={err ? `${name}-err` : hint ? `${name}-hint` : undefined}
        className="field"
      />
      {hint && !err ? <p id={`${name}-hint`} className="mt-1 text-xs text-bone-400">{hint}</p> : null}
      {err ? <p id={`${name}-err`} className="field-error">{err}</p> : null}
    </div>
  );
}

function FormError({ state }: { state: AuthState }) {
  return state.error ? (
    <div role="alert" className="rounded-md border border-blood-500/50 bg-blood-900/40 px-4 py-3 text-sm text-blood-300">{state.error}</div>
  ) : null;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError state={state} />
      <input type="hidden" name="next" value={next} />
      <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
      <Field name="password" label="Password" type="password" autoComplete="current-password" state={state} />
      <SubmitButton pendingText="Signing in…" className="btn-red w-full">Log in</SubmitButton>
      <p className="text-center text-sm text-bone-400">
        New here? <Link href="/register" className="link">Create an account</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormError state={state} />
      <Field name="displayName" label="Display name" autoComplete="nickname" state={state} />
      <Field name="email" label="Email" type="email" autoComplete="email" state={state} />
      <Field name="password" label="Password" type="password" autoComplete="new-password" state={state} hint="At least 10 characters." />
      <Field name="confirm" label="Confirm password" type="password" autoComplete="new-password" state={state} />
      <SubmitButton pendingText="Creating account…" className="btn-red w-full">Create account</SubmitButton>
      <p className="text-center text-sm text-bone-400">
        Already have an account? <Link href="/login" className="link">Log in</Link>
      </p>
    </form>
  );
}
