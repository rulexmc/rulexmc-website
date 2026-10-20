"use client";

import { useEffect, useState } from "react";
import type { ServerStatus } from "@/lib/status/types";

const STATE_STYLE: Record<ServerStatus["state"], { dot: string; label: string; text: string }> = {
  online: { dot: "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]", label: "Online", text: "text-emerald-300" },
  offline: { dot: "bg-blood-500", label: "Offline", text: "text-blood-300" },
  unavailable: { dot: "bg-amber-400", label: "Status unavailable", text: "text-amber-200" },
  unconfigured: { dot: "bg-bone-400", label: "Status unavailable", text: "text-bone-300" },
};

/** Shows server-rendered status immediately, then refreshes from /api/status every 60s. */
export function StatusPanel({ initial, variant = "full" }: { initial: ServerStatus; variant?: "full" | "compact" }) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    if (initial.state === "unconfigured") return;
    const id = setInterval(async () => {
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
  const players =
    status.state === "online" && status.playersOnline !== null
      ? `${status.playersOnline.toLocaleString("en-US")}${status.playersMax ? ` / ${status.playersMax.toLocaleString("en-US")}` : ""}`
      : null;

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-2.5 font-hud text-sm font-semibold uppercase tracking-[0.14em]" role="status" data-testid="server-status">
        <span className={`h-2.5 w-2.5 rounded-sm ${s.dot} ${status.state === "online" ? "animate-pulse" : ""}`} aria-hidden />
        <span className={s.text}>{s.label}</span>
        {players ? <span className="text-bone-300">· {players} playing</span> : null}
      </div>
    );
  }

  return (
    <div className="panel grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-3" role="status" data-testid="server-status">
      <div className="bg-ink-850 p-4">
        <div className="table-head">Status</div>
        <div className={`mt-1.5 flex items-center gap-2 font-hud text-xl font-bold uppercase ${s.text}`}>
          <span className={`h-3 w-3 rounded-sm ${s.dot}`} aria-hidden />
          {s.label}
        </div>
      </div>
      <div className="bg-ink-850 p-4">
        <div className="table-head">Players</div>
        <div className="mt-1.5 font-hud text-xl font-bold text-white" data-testid="player-count">{players ?? "—"}</div>
      </div>
      <div className="col-span-2 bg-ink-850 p-4 sm:col-span-1">
        <div className="table-head">Version</div>
        <div className="mt-1.5 truncate font-hud text-xl font-bold text-white">{status.version ?? "—"}</div>
      </div>
      <div className="col-span-2 border-t border-white/5 bg-ink-900/60 px-4 py-2 text-xs text-bone-400 sm:col-span-3">
        {status.state === "unconfigured"
          ? "Server address not configured."
          : status.state === "unavailable"
            ? "Live status could not be fetched right now. It will retry automatically."
            : `Live via ${status.source === "ping" ? "direct server ping" : "mcsrvstat.us"} · updated ${new Date(status.fetchedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
      </div>
    </div>
  );
}
