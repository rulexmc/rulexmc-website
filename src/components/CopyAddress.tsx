"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { toast } from "./Toaster";

export function CopyAddress({
  address, size = "md", label = "Server IP · Java & Bedrock", note,
}: { address: string | null; size?: "md" | "lg"; label?: string; note?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const panel = useRef<HTMLDivElement>(null);
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
      // Restart the ring flash without remounting (remounting would steal keyboard focus from the button).
      const el = panel.current;
      if (el) { el.classList.remove("copied-flash"); void el.offsetWidth; el.classList.add("copied-flash"); }
      toast(`Copied ${address} — paste it into Minecraft`, "success");
    } catch {
      setState("error");
      toast("Couldn't copy automatically. Select the address and press Ctrl+C.", "error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  };

  const lg = size === "lg";
  return (
    <div className="inline-flex max-w-full flex-col items-center gap-2">
      <div
        ref={panel}
        className={`panel-glow scanlines group inline-flex max-w-full items-stretch overflow-hidden rounded-xl ${lg ? "text-lg" : ""}`}
      >
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
          data-state={state}
        >
          <span className="relative inline-flex h-4 w-4">
            {state === "copied"
              ? <Icon key="check" name="check" className="h-4 w-4 animate-pop text-emerald-300" />
              : <Icon key="copy" name="copy" className="h-4 w-4 transition-transform motion-safe:group-hover:scale-110" />}
          </span>
          {/* Every label is stacked in one grid cell so the button never changes width. */}
          <span className="hidden min-[380px]:inline-grid">
            {(["Copy", "Copied!", "Press Ctrl+C"] as const).map((l) => {
              const on = l === (state === "copied" ? "Copied!" : state === "error" ? "Press Ctrl+C" : "Copy");
              return (
                <span key={l} aria-hidden={!on} className={`[grid-area:1/1] text-left transition-opacity duration-150 ${on ? "opacity-100" : "opacity-0"}`}>
                  {l}
                </span>
              );
            })}
          </span>
        </button>
      </div>
      {note ? <p className="text-xs text-bone-400">{note}</p> : null}
    </div>
  );
}
