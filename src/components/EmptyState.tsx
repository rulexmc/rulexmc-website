import { Icon, type IconName } from "./Icon";

/** Consistent empty / unavailable state panel. */
export function EmptyState({
  icon = "info", title, children, action, tone = "neutral", role,
}: { icon?: IconName; title: string; children?: React.ReactNode; action?: React.ReactNode; tone?: "neutral" | "error"; role?: "alert" | "status" }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-14" role={role}>
      <span className={`icon-tile ${tone === "error" ? "border-amber-400/40 from-amber-400/15 to-amber-900/20 text-amber-200" : ""}`}>
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-5 font-hud text-2xl font-bold text-white">{title}</p>
      {children ? <div className="mt-2 max-w-md text-bone-400">{children}</div> : null}
      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
