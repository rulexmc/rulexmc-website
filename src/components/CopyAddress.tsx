"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export function CopyAddress({
  address, size = "md", label = "Server IP · Java & Bedrock", note,
}: { address: string | null; size?: "md" | "lg"; label?: string; note?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!address) {
    return (
      <div className="panel inline-flex items-center gap-3 px-4 py-3 text-bone-300" role="status">
        <Icon name="info" className="h-5 w-5 text-bone-400" />
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
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  };

  const lg = size === "lg";
  return (
    <div className="inline-flex max-w-full flex-col items-center gap-2">
      <div className={`panel-glow scanlines group inline-flex max-w-full items-stretch overflow-hidden rounded-xl ${lg ? "text-lg" : ""}`}>
        <div className={`flex min-w-0 flex-col justify-center text-left ${lg ? "px-5 py-3" : "px-4 py-2.5"}`}>
          <span className="font-hud text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-bone-400">{label}</span>
          <code
            className={`truncate select-all font-hud font-bold tracking-wider text-white ${lg ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}
            data-testid="server-address"
          >
            {address}
          </code>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`relative flex shrink-0 items-center gap-2 border-l border-blood-500/30 bg-blood-500/15 font-hud text-sm font-bold uppercase tracking-[0.16em] text-blood-200 transition hover:bg-blood-500/35 hover:text-white ${lg ? "px-5" : "px-4"}`}
          aria-label={`Copy server address ${address}`}
        >
          <Icon name={state === "copied" ? "check" : "copy"} className="h-4 w-4" />
          <span className="hidden min-[380px]:inline">{state === "copied" ? "Copied!" : state === "error" ? "Press Ctrl+C" : "Copy"}</span>
        </button>
      </div>
      {note ? <p className="text-xs text-bone-400">{note}</p> : null}
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Server address copied to clipboard" : state === "error" ? "Copy failed, select the address manually" : ""}
      </span>
    </div>
  );
}
