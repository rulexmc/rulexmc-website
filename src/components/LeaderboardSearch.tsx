"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "./Icon";

const CLEAN = /[^A-Za-z0-9_]/g;

/**
 * Player search for the leaderboards. Works as a plain GET form without JavaScript; with JS it
 * filters as you type (debounced), keeps the current metric/order, and shows a pending state.
 */
export function LeaderboardSearch({ initial, metric, order }: { initial: string; metric: string; order: "asc" | "desc" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const last = useRef(initial);

  // Keep in sync when the URL changes elsewhere (tabs, back button).
  useEffect(() => { setValue(initial); last.current = initial; }, [initial]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const go = (q: string) => {
    if (q === last.current) return;
    last.current = q;
    const next = new URLSearchParams(params.toString());
    next.delete("page");
    if (q) next.set("q", q); else next.delete("q");
    const qs = next.toString();
    startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }));
  };

  const onChange = (raw: string) => {
    const q = raw.replace(CLEAN, "").slice(0, 16);
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => go(q), 300);
  };

  return (
    <form
      method="get"
      action="/leaderboards"
      role="search"
      aria-label="Search players"
      className="flex w-full gap-2 lg:w-auto"
      onSubmit={(e) => { e.preventDefault(); if (timer.current) clearTimeout(timer.current); go(value); }}
    >
      <input type="hidden" name="metric" value={metric} />
      {order === "asc" ? <input type="hidden" name="order" value="asc" /> : null}
      <label htmlFor="q" className="sr-only">Search player name</label>
      <div className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-400" />
        <input
          id="q"
          name="q"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape" && value) { e.preventDefault(); onChange(""); } }}
          placeholder="Search player…"
          maxLength={16}
          pattern="[A-Za-z0-9_]*"
          title="Letters, numbers and underscores"
          className="field pl-9 pr-9"
          autoComplete="off"
          spellCheck={false}
          aria-describedby="q-status"
        />
        <span
          aria-hidden
          className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-blood-400/30 border-t-blood-400 transition-opacity ${pending ? "opacity-100 motion-safe:animate-spin" : "opacity-0"}`}
        />
      </div>
      <button type="submit" className="btn-ghost btn-sm">Search</button>
      <span id="q-status" className="sr-only" aria-live="polite">{pending ? "Searching…" : ""}</span>
    </form>
  );
}
