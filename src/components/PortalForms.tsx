"use client";

import { useActionState } from "react";
import { createLinkCodeAction, linkUsernameAction, submitReportAction, type FormState } from "@/app/portal/actions";
import { SubmitButton } from "./SubmitButton";

function Notice({ state }: { state: FormState }) {
  if (state.ok) return <p role="status" className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">{state.ok}</p>;
  if (state.error) return <p role="alert" className="rounded-md border border-blood-500/50 bg-blood-900/40 px-3 py-2 text-sm text-blood-200">{state.error}</p>;
  return null;
}

export function LinkUsernameForm({ current }: { current: string | null }) {
  const [state, action] = useActionState(linkUsernameAction, {});
  const err = state.fields?.mcUsername?.[0];
  return (
    <form action={action} className="space-y-3">
      <Notice state={state} />
      <label htmlFor="mcUsername" className="label">Minecraft username</label>
      <div className="flex gap-2">
        <input
          id="mcUsername" name="mcUsername" defaultValue={current ?? ""} required maxLength={16}
          pattern="[A-Za-z0-9_]{3,16}" className="field" aria-invalid={err ? true : undefined}
          aria-describedby={err ? "mc-err" : undefined} autoComplete="off" spellCheck={false}
        />
        <SubmitButton className="btn-red btn-sm shrink-0" pendingText="Saving…">{current ? "Update" : "Link"}</SubmitButton>
      </div>
      {err ? <p id="mc-err" className="field-error">{err}</p> : null}
    </form>
  );
}

export function LinkCodeForm() {
  const [state, action] = useActionState(createLinkCodeAction, {});
  return (
    <form action={action} className="space-y-3">
      <Notice state={state} />
      <SubmitButton className="btn-ghost btn-sm" pendingText="Generating…">Generate verification code</SubmitButton>
    </form>
  );
}

const CATEGORIES = [
  ["CHEATING", "Cheating / hacked client"], ["GRIEFING", "Griefing"], ["CHAT_ABUSE", "Chat abuse"],
  ["SCAM", "Scamming"], ["BUG", "Bug / exploit"], ["OTHER", "Other"],
] as const;

export function ReportForm() {
  const [state, action] = useActionState(submitReportAction, {});
  const e = (k: string) => state.fields?.[k]?.[0];
  return (
    <form action={action} className="space-y-4" key={state.ok ? "sent" : "form"}>
      <Notice state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="targetName" className="label">Player name</label>
          <input id="targetName" name="targetName" required maxLength={16} className="field" aria-invalid={e("targetName") ? true : undefined} aria-describedby={e("targetName") ? "t-err" : undefined} />
          {e("targetName") ? <p id="t-err" className="field-error">{e("targetName")}</p> : null}
        </div>
        <div>
          <label htmlFor="category" className="label">Category</label>
          <select id="category" name="category" className="field" defaultValue="CHEATING">
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="label">What happened?</label>
        <textarea id="description" name="description" required minLength={20} maxLength={2000} rows={5} className="field" aria-invalid={e("description") ? true : undefined} aria-describedby={e("description") ? "d-err" : "d-hint"} />
        {e("description") ? <p id="d-err" className="field-error">{e("description")}</p> : <p id="d-hint" className="mt-1 text-xs text-bone-400">Include when and where it happened (coordinates, time).</p>}
      </div>
      <div>
        <label htmlFor="evidenceUrl" className="label">Evidence link (optional)</label>
        <input id="evidenceUrl" name="evidenceUrl" type="url" placeholder="https://…" maxLength={500} className="field" aria-invalid={e("evidenceUrl") ? true : undefined} aria-describedby={e("evidenceUrl") ? "e-err" : undefined} />
        {e("evidenceUrl") ? <p id="e-err" className="field-error">{e("evidenceUrl")}</p> : null}
      </div>
      <SubmitButton pendingText="Submitting…">Submit report</SubmitButton>
    </form>
  );
}
