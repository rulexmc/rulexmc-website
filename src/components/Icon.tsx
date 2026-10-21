/** Small inline SVG icon set (stroke icons, 24px grid). Decorative by default; pass `label` for meaningful icons. */
export type IconName =
  | "discord" | "copy" | "check" | "arrow-right" | "external" | "heart" | "sword" | "globe" | "shield"
  | "portal" | "spark" | "trophy" | "hud" | "devices" | "menu" | "close" | "play" | "users" | "server"
  | "star" | "chevron-down" | "map" | "coins" | "target" | "info" | "lock" | "zap";

const PATHS: Record<Exclude<IconName, "discord">, React.ReactNode> = {
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  "arrow-right": <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4 10.5 13.5" /><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" /></>,
  heart: <path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.1 3.9 4 7.2 4c2 0 3.4 1.1 4.8 2.9C13.4 5.1 14.8 4 16.8 4c3.3 0 5.6 3.1 4.4 6.6C19.5 15.4 12 20 12 20Z" />,
  sword: <><path d="M14.5 3.5H20v5.5L9.5 19.5l-5-5Z" /><path d="m4 20 3-3" /><path d="m6.5 12 5.5 5.5" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
  shield: <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6Z" /><path d="m9 12 2 2 4-4" /></>,
  portal: <><ellipse cx="12" cy="12" rx="5.5" ry="8.5" /><ellipse cx="12" cy="12" rx="2.2" ry="4.5" /><path d="M3 21h18" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m12 8 1.4 2.6L16 12l-2.6 1.4L12 16l-1.4-2.6L8 12l2.6-1.4Z" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0Z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8.5 20h7M10 17h4v3h-4Z" /></>,
  hud: <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M14 8h4M14 11h4M14 14h2" /><path d="M7 8v6" /><path d="M10 10v4" /></>,
  devices: <><rect x="2.5" y="5" width="13" height="10" rx="1.5" /><path d="M6 19h6M9 15v4" /><rect x="17" y="8" width="4.5" height="11" rx="1.2" /></>,
  menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  play: <path d="M8 5.5v13l10.5-6.5Z" />,
  users: <><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.9.7 3.1 2.6 3.5 5.2" /></>,
  server: <><rect x="3.5" y="4" width="17" height="6.5" rx="1.5" /><rect x="3.5" y="13.5" width="17" height="6.5" rx="1.5" /><path d="M7 7.25h.01M7 16.75h.01" /></>,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8Z" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  map: <><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z" /><path d="M9 4v14M15 6v14" /></>,
  coins: <><ellipse cx="9" cy="7" rx="5.5" ry="2.5" /><path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" /><path d="M9.5 16.4c.9 1.3 3.1 2.1 5.5 2.1 3 0 5.5-1.1 5.5-2.5v-4c0-1.2-1.8-2.2-4.3-2.4" /></>,
  target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  zap: <path d="M13 3 5 13.5h6L10 21l8-10.5h-6Z" />,
};

export function Icon({ name, className = "h-5 w-5", label }: { name: IconName; className?: string; label?: string }) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  if (name === "discord") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...a11y} focusable="false">
        <path d="M19.6 5.3A17.6 17.6 0 0 0 15.3 4l-.5 1.1a16.3 16.3 0 0 0-5.6 0L8.7 4a17.5 17.5 0 0 0-4.3 1.3C1.7 9.4.9 13.4 1.3 17.3a17.8 17.8 0 0 0 5.3 2.7l1.1-1.8a11.4 11.4 0 0 1-1.8-.9l.4-.3a12.6 12.6 0 0 0 11.4 0l.4.3c-.6.4-1.2.7-1.8.9l1.1 1.8a17.7 17.7 0 0 0 5.3-2.7c.5-4.5-.7-8.5-3.1-12ZM8.5 14.9c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Zm7 0c-1 0-1.9-1-1.9-2.2s.8-2.2 1.9-2.2 1.9 1 1.9 2.2-.8 2.2-1.9 2.2Z" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
      className={className} {...a11y} focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
