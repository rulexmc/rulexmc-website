import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ReportForm } from "@/components/PortalForms";

export const metadata: Metadata = { title: "Report a player" };
export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  OPEN: "border-amber-400/40 text-amber-200",
  REVIEWING: "border-sky-400/40 text-sky-200",
  RESOLVED: "border-emerald-400/40 text-emerald-200",
  DISMISSED: "border-white/15 text-bone-400",
};

export default async function ReportsPage() {
  const user = await requireUser("/portal/reports");
  const reports = await prisma.report.findMany({ where: { reporterId: user.id }, orderBy: { createdAt: "desc" }, take: 20 });
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <p className="eyebrow">Fair play</p>
      <h1 className="h-display mt-2 text-3xl text-white sm:text-4xl">Report a player</h1>
      <p className="mt-3 text-bone-300">Reports go straight to staff. False reports may lead to punishment.</p>
      <div className="panel mt-8 p-6"><ReportForm /></div>
      <h2 className="mt-12 font-hud text-xl font-bold uppercase tracking-wider text-white">Your reports</h2>
      {reports.length === 0 ? (
        <p className="mt-3 text-bone-400">You haven&apos;t submitted any reports.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className="panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-hud text-lg font-bold text-white">{r.targetName} <span className="text-sm text-bone-400">· {r.category.replace("_", " ").toLowerCase()}</span></span>
                <span className={`badge border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-bone-300">{r.description}</p>
              {r.adminNote ? <p className="mt-2 text-sm text-bone-200"><strong>Staff note:</strong> {r.adminNote}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
