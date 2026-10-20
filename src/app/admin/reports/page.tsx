import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminFlash } from "@/components/AdminFlash";
import { SubmitButton } from "@/components/SubmitButton";
import { updateReport } from "../actions";

const STATUSES = ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"] as const;

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = STATUSES.find((s) => s === sp.status);
  const reports = await prisma.report.findMany({
    where: filter ? { status: filter } : { status: { in: ["OPEN", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporter: { select: { displayName: true, mcUsername: true } }, handledBy: { select: { displayName: true } } },
  });
  return (
    <div>
      <AdminFlash ok={sp.ok} error={sp.error} />
      <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Filter reports">
        <Link href="/admin/reports" className={!filter ? "btn-red btn-sm" : "btn-ghost btn-sm"}>Active</Link>
        {STATUSES.map((s) => <Link key={s} href={`/admin/reports?status=${s}`} className={filter === s ? "btn-red btn-sm" : "btn-ghost btn-sm"}>{s}</Link>)}
      </nav>
      {reports.length === 0 ? <p className="panel p-6 text-bone-400">No reports in this view.</p> : (
        <ul className="space-y-4">
          {reports.map((r) => (
            <li key={r.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-hud text-lg font-bold text-white">{r.targetName} <span className="text-sm font-normal text-bone-400">· {r.category}</span></h3>
                <span className="text-xs text-bone-400">by {r.reporter.displayName}{r.reporter.mcUsername ? ` (${r.reporter.mcUsername})` : ""} · {r.createdAt.toISOString().slice(0, 16).replace("T", " ")} UTC</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-bone-200">{r.description}</p>
              {r.evidenceUrl ? <p className="mt-2 text-sm"><a className="link" href={r.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow">Evidence link ↗</a></p> : null}
              <form action={updateReport} className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                <input type="hidden" name="id" value={r.id} />
                <div><label className="label" htmlFor={`s-${r.id}`}>Status</label>
                  <select id={`s-${r.id}`} name="status" defaultValue={r.status} className="field">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
                <div><label className="label" htmlFor={`n-${r.id}`}>Note to reporter</label><input id={`n-${r.id}`} name="adminNote" defaultValue={r.adminNote ?? ""} maxLength={1000} className="field" /></div>
                <SubmitButton className="btn-red btn-sm">Update</SubmitButton>
              </form>
              {r.handledBy ? <p className="mt-2 text-xs text-bone-400">Last handled by {r.handledBy.displayName}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
