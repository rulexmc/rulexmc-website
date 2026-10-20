"use client";

import { useState } from "react";

export function CopyAddress({ address, size = "md" }: { address: string | null; size?: "md" | "lg" }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  if (!address) {
    return (
      <div className="panel inline-flex items-center gap-3 px-4 py-3 text-bone-300" role="status">
        <span className="font-hud font-semibold uppercase tracking-[0.12em]">Server address not configured</span>
      </div>
    );
  }

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(address);
      } else {
        const ta = document.createElement("textarea");
        ta.value = address;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("copy failed");
      }
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2200);
  };

  return (
    <div className={`panel-glow scanlines inline-flex max-w-full items-stretch overflow-hidden ${size === "lg" ? "text-lg" : ""}`}>
      <div className="flex min-w-0 flex-col justify-center px-4 py-2.5">
        <span className="font-hud text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-bone-400">Java Server IP</span>
        <code className="truncate font-hud text-lg font-bold tracking-wider text-white sm:text-xl" data-testid="server-address">
          {address}
        </code>
      </div>
      <button
        type="button"
        onClick={copy}
        className="relative shrink-0 border-l border-blood-500/30 bg-blood-500/15 px-4 font-hud text-sm font-bold uppercase tracking-[0.16em] text-blood-300 transition hover:bg-blood-500/30 hover:text-white"
        aria-label={`Copy server address ${address}`}
      >
        {state === "copied" ? "Copied!" : state === "error" ? "Press Ctrl+C" : "Copy"}
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Server address copied to clipboard" : state === "error" ? "Copy failed, select the address manually" : ""}
      </span>
    </div>
  );
}
