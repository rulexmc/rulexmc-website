"use client";

import { useFormStatus } from "react-dom";

/** Submit button with a pending spinner; the label width is kept so the button never jumps. */
export function SubmitButton({
  children, pendingText = "Working…", className = "btn-red", name, value,
}: { children: React.ReactNode; pendingText?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending} name={name} value={value}>
      {pending ? (
        <>
          <span aria-hidden className="h-4 w-4 shrink-0 rounded-full border-2 border-current/30 border-t-current motion-safe:animate-spin" />
          {pendingText}
        </>
      ) : children}
    </button>
  );
}
