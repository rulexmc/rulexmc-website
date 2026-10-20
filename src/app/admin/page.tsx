import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getServerStatus } from "@/lib/status";
import { getStatsProvider, formatPlaytime } from "@/lib/stats";
import { getConfig, secrets } from "@/lib/config";
import { StatusPanel } from "@/components/StatusPanel";
import { SampleBadge } from "@/components/SampleBadge";
import { AdminFlash, type FlashParams } from "@/components/AdminFlash";
import { setUserRole } from "./actions";

export default async function AdminOverview({ searchParams }: { searchParams: FlashParams }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const cfg = getConfig();
  const provider = getStatsProvider();
  const [status, summary, users, openReports, recentUsers, purchases] = await Promise.all([
    getServerStatus(),
    provider.getSummary(),
    prisma.user.count(),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, email: true, displayName: true, role: true, mcUsername: true, mcVerified: true } }),
    prisma.purchase.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const integrations = [
    { name: "Server status", ok: !!cfg.server.address, detail: cfg.server.address ? `${cfg.server.address.display} via ${cfg.server.statusSource}` : "MC_SERVER_ADDRESS empty" },
    { name: "Stats ingest secret", ok: (secrets.ingest()?.length ?? 0) >= 32, detail: "INGEST_SECRET (≥32 chars)" },
    { name: "Stats provider", ok: provider.live, detail: provider.label },
    { name: "Payments", ok: cfg.payments.provider !== "none" && (cfg.payments.provider !== "stripe" || !!secrets.stripeSecretKey()), detail: `PAYMENT_PROVIDER=${cfg.payments.provider}` },
    { name: "Stripe webhook", ok: cfg.payments.provider !== "stripe" || !!secrets.stripeWebhookSecret(), detail: cfg.payments.provider === "stripe" ? "STRIPE_WEBHOOK_SECRET" : "n/a" },
  ];

  return (
    <div className="space-y-8">
      <AdminFlash {...sp} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Website accounts", users.toLocaleString("en-US")],
          ["Open reports", openReports.toLocaleString("en-US")],
          ["Players with stats", summary.players.toLocaleString("en-US")],
          ["Total playtime", formatPlaytime(summary.totalPlaytimeSeconds)],
        ].map(([k, v]) => (
          <div key={k} className="panel p-5"><div className="table-head">{k}</div><div className="mt-1 font-hud text-3xl font-bold text-white">{v}</div></div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-hud text-lg font-bold uppercase tracking-wider text-white">Live server</h2>
          <StatusPanel initial={status} />
          {status.error ? <p className="mt-2 text-xs text-bone-400">Last error: {status.error}</p> : null}
        </div>
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-hud text-lg font-bold uppercase tracking-wider text-white">Stats data</h2>
            {!provider.live ? <SampleBadge /> : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <dt className="text-bone-400">Provider</dt><dd className="text-white">{provider.label}</dd>
            <dt className="text-bone-400">Total kills</dt><dd className="text-white">{summary.totalKills.toLocaleString("en-US")}</dd>
            <dt className="text-bone-400">Total deaths</dt><dd className="text-white">{summary.totalDeaths.toLocaleString("en-US")}</dd>
            <dt className="text-bone-400">Last ingest</dt><dd className="text-white">{summary.lastUpdated ? summary.lastUpdated.toISOString() : "never"}</dd>
            <dt className="text-bone-400">Purchases</dt><dd className="text-white">{purchases.length ? purchases.map((p) => `${p.status}: ${p._count._all}`).join(", ") : "none"}</dd>
          </dl>
          <p className="mt-4 text-xs text-bone-400">Read-only view. This dashboard intentionally has no console, RCON or server power controls.</p>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="font-hud text-lg font-bold uppercase tracking-wider text-white">Integrations</h2>
        <ul className="mt-3 divide-y divide-white/5">
          {integrations.map((i) => (
            <li key={i.name} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-bone-200">{i.name}</span>
              <span className="flex items-center gap-3 text-right text-bone-400">
                {i.detail}
                <span className={`badge border ${i.ok ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-200"}`}>{i.ok ? "Configured" : "Not configured"}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel overflow-x-auto p-5">
        <h2 className="font-hud text-lg font-bold uppercase tracking-wider text-white">Recent accounts</h2>
        <table className="mt-3 w-full min-w-[600px] text-left text-sm">
          <thead><tr className="table-head"><th className="py-2">User</th><th>Minecraft</th><th>Role</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="py-2.5"><div className="text-white">{u.displayName}</div><div className="text-xs text-bone-400">{u.email}</div></td>
                <td>{u.mcUsername ?? "—"} {u.mcUsername ? <span className="text-xs text-bone-400">({u.mcVerified ? "verified" : "unverified"})</span> : null}</td>
                <td>{u.role}</td>
                <td className="text-right">
                  {u.id !== admin.id ? (
                    <form action={setUserRole}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="role" value={u.role === "ADMIN" ? "PLAYER" : "ADMIN"} />
                      <button className="btn-ghost btn-sm" type="submit">{u.role === "ADMIN" ? "Demote" : "Make admin"}</button>
                    </form>
                  ) : <span className="text-xs text-bone-400">you</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
