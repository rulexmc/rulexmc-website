"use client";

import { useEffect, useState } from "react";
import type { ServerStatus } from "@/lib/status/types";
import { CountUp } from "./CountUp";

const STATE_STYLE: Record<ServerStatus["state"], { dot: string; label: string; text: string; ring: string }> = {
  online: { dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]", label: "Online", text: "text-emerald-300", ring: "border-emerald-400/30 bg-emerald-400/[0.07]" },
  offline: { dot: "bg-blood-500", label: "Offline", text: "text-blood-300", ring: "border-blood-500/40 bg-blood-500/10" },
  unavailable: { dot: "bg-amber-400", label: "Status unavailable", text: "text-amber-200", ring: "border-amber-400/30 bg-amber-400/[0.07]" },
  unconfigured: { dot: "bg-bone-400", label: "Status unavailable", text: "text-bone-300", ring: "border-white/10 bg-white/[0.04]" },
};

/**
 * Shows the server-rendered status immediately, then refreshes from /api/status every 60s.
 * Numbers only ever come from the live lookup; on failure it says "Status unavailable".
 */
export function StatusPanel({ initial, variant = "full" }: { initial: ServerStatus; variant?: "full" | "compact" }) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (initial.state === "unconfigured") return;
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (res.ok) setStatus((await res.json()) as ServerStatus);
      } catch {
        /* keep last known value */
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [initial.state]);

  const s = STATE_STYLE[status.state];
  const online = status.state === "online" && status.playersOnline !== null;
  const players = online ? (
    <>
      <CountUp value={status.playersOnline!} />
      {status.playersMax ? <span className="text-bone-400"> / {status.playersMax.toLocaleString("en-US")}</span> : null}
    </>
  ) : null;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 font-hud text-sm font-semibold uppercase tracking-[0.14em] backdrop-blur ${s.ring}`}
        role="status"
        aria-live="polite"
        data-testid="server-status"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${s.dot} ${status.state === "online" ? "animate-pulse" : ""}`} aria-hidden />
        <span className={s.text}>{s.label}</span>
        {online ? <span className="text-bone-200"><span aria-hidden>· </span><CountUp value={status.playersOnline!} /> playing</span> : null}
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden" role="status" aria-live="polite" data-testid="server-status">
      <div className="grid grid-cols-2 gap-px bg-white/[0.05] sm:grid-cols-3">
        <div className="bg-ink-850 p-4 sm:p-5">
          <div className="table-head">Status</div>
          <div className={`mt-1.5 flex items-center gap-2 font-hud text-xl font-bold uppercase ${s.text}`}>
            <span className={`h-3 w-3 shrink-0 rounded-full ${s.dot} ${status.state === "online" ? "animate-pulse" : ""}`} aria-hidden />
            <span className="truncate">{s.label}</span>
          </div>
        </div>
        <div className="bg-ink-850 p-4 sm:p-5">
          <div className="table-head">Players online</div>
          <div className="mt-1.5 font-hud text-xl font-bold tabular-nums text-white" data-testid="player-count">{players ?? "—"}</div>
        </div>
        <div className="col-span-2 bg-ink-850 p-4 sm:col-span-1 sm:p-5">
          <div className="table-head">Server version</div>
          <div className="mt-1.5 truncate font-hud text-xl font-bold text-white">
            {status.version ? `${status.software ? `${status.software} ` : ""}${status.version}` : "—"}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-white/5 bg-ink-900/60 px-4 py-2.5 text-xs text-bone-400 sm:px-5" suppressHydrationWarning>
        {status.state === "unconfigured"
          ? "Server address not configured."
          : status.state === "unavailable"
            ? "Live status could not be fetched right now. It will retry automatically."
            : status.state === "offline"
              ? "The server did not respond to the status check."
              : `Live via ${status.source === "ping" ? "direct server ping" : "mcsrvstat.us"} · updated ${new Date(status.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
      </div>
    </div>
  );
}
