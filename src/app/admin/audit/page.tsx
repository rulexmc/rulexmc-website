import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

const PAGE = 50;

export default async function AdminAudit({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { actor: { select: { email: true } } } }),
    prisma.auditLog.count(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <div className="panel overflow-x-auto p-5" tabIndex={0} role="region" aria-label="Audit log table">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="mb-3 text-left font-hud text-lg font-bold uppercase tracking-wider text-white">Audit log ({total})</caption>
        <thead><tr className="table-head"><th className="py-2">Time (UTC)</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th><th>Details</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={6} className="py-6 text-center text-bone-400">No entries yet.</td></tr> : rows.map((r) => (
            <tr key={r.id} className="border-t border-white/5 align-top">
              <td className="py-2 pr-3 whitespace-nowrap text-bone-400">{r.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
              <td className="pr-3">{r.actor?.email ?? <span className="text-bone-400">system</span>}</td>
              <td className="pr-3"><code className="text-blood-300">{r.action}</code></td>
              <td className="pr-3 break-all">{r.target ?? "—"}</td>
              <td className="pr-3 text-bone-400">{r.ip ?? "—"}</td>
              <td className="max-w-xs break-all text-xs text-bone-400">{r.meta ? JSON.stringify(r.meta) : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-bone-400">Page {page} of {pages}</span>
        <span className="flex gap-2">
          {page > 1 ? <Link className="btn-ghost btn-sm" href={`/admin/audit?page=${page - 1}`}>← Newer</Link> : null}
          {page < pages ? <Link className="btn-ghost btn-sm" href={`/admin/audit?page=${page + 1}`}>Older →</Link> : null}
        </span>
      </div>
    </div>
  );
}
