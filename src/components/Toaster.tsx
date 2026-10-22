"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

export type ToastTone = "success" | "error" | "info";
interface ToastItem { id: number; message: string; tone: ToastTone }

const EVENT = "rx:toast";

/** Show a short, non-blocking notification. Safe to call from any client component. */
export function toast(message: string, tone: ToastTone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Omit<ToastItem, "id">>(EVENT, { detail: { message, tone } }));
}

const TONE: Record<ToastTone, { ring: string; icon: "check" | "alert" | "info"; iconCls: string }> = {
  success: { ring: "border-emerald-400/40", icon: "check", iconCls: "text-emerald-300" },
  error: { ring: "border-blood-400/60", icon: "alert", iconCls: "text-blood-300" },
  info: { ring: "border-white/15", icon: "info", iconCls: "text-bone-200" },
};

/**
 * Single polite live region for toasts, mounted once in the root layout. The region is always in the
 * DOM so screen readers announce new messages; at most three toasts are kept, each auto-dismisses.
 */
export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const map = timers.current;
    const dismiss = (id: number) => {
      setItems((list) => list.filter((t) => t.id !== id));
      clearTimeout(map.get(id));
      map.delete(id);
    };
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<Omit<ToastItem, "id">>).detail;
      const id = nextId.current++;
      setItems((list) => [...list.filter((t) => t.message !== message), { id, message, tone }].slice(-3));
      map.set(id, setTimeout(() => dismiss(id), 3200));
    };
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {items.map((t) => {
        const tone = TONE[t.tone];
        return (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border ${tone.ring} bg-ink-900/95 px-4 py-3 text-sm text-bone-100 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] backdrop-blur`}
          >
            <Icon name={tone.icon} className={`h-4 w-4 shrink-0 ${tone.iconCls}`} />
            <span>{t.message}</span>
            <button
              type="button"
              onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))}
              className="-mr-1 ml-1 rounded p-1 text-bone-400 transition hover:text-white"
              aria-label="Dismiss notification"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
