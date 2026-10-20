import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const LINKS = [
  ["/admin", "Overview"], ["/admin/announcements", "Announcements"], ["/admin/content", "Content"],
  ["/admin/reports", "Reports"], ["/admin/store", "Store"], ["/admin/audit", "Audit log"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="h-display mt-1 text-2xl text-white sm:text-3xl">Control room</h1>
        </div>
        <p className="text-sm text-bone-400">Signed in as {admin.email}</p>
      </div>
      <nav aria-label="Admin" className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {LINKS.map(([href, label]) => <Link key={href} href={href} className="btn-ghost btn-sm shrink-0">{label}</Link>)}
      </nav>
      {children}
    </div>
  );
}
