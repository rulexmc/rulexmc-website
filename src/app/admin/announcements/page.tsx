import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminFlash, type FlashParams } from "@/components/AdminFlash";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteAnnouncement, saveAnnouncement } from "../actions";

function AnnouncementFields({ a }: { a?: { id: string; title: string; body: string; published: boolean; pinned: boolean } }) {
  const p = a?.id ?? "new";
  return (
    <>
      {a ? <input type="hidden" name="id" value={a.id} /> : null}
      <div><label className="label" htmlFor={`t-${p}`}>Title</label><input id={`t-${p}`} name="title" required minLength={3} maxLength={120} defaultValue={a?.title} className="field" /></div>
      <div><label className="label" htmlFor={`b-${p}`}>Body</label><textarea id={`b-${p}`} name="body" required rows={4} maxLength={5000} defaultValue={a?.body} className="field" /></div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={a?.published ?? true} className="accent-blood-500" /> Published</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="pinned" defaultChecked={a?.pinned ?? false} className="accent-blood-500" /> Pinned</label>
      </div>
    </>
  );
}

export default async function AdminAnnouncements({ searchParams }: { searchParams: FlashParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const items = await prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], include: { author: { select: { displayName: true } } } });
  return (
    <div>
      <AdminFlash {...sp} />
      <form action={saveAnnouncement} className="panel space-y-4 p-5">
        <h2 className="font-hud text-lg font-bold uppercase tracking-wider text-white">New announcement</h2>
        <AnnouncementFields />
        <SubmitButton className="btn-red btn-sm">Publish</SubmitButton>
      </form>
      <h2 className="mt-10 mb-3 font-hud text-lg font-bold uppercase tracking-wider text-white">All announcements ({items.length})</h2>
      {items.length === 0 ? <p className="text-bone-400">No announcements yet.</p> : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="panel p-4">
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span className="font-hud text-lg font-bold text-white">{a.title}</span>
                  <span className="flex gap-2 text-xs text-bone-400">
                    {a.pinned ? <span className="badge bg-blood-500/20 text-blood-300">Pinned</span> : null}
                    {!a.published ? <span className="badge border border-white/15">Draft</span> : null}
                    {a.createdAt.toISOString().slice(0, 10)} · {a.author?.displayName ?? "system"}
                  </span>
                </summary>
                <form action={saveAnnouncement} className="mt-4 space-y-4">
                  <AnnouncementFields a={a} />
                  <SubmitButton className="btn-red btn-sm">Save</SubmitButton>
                </form>
                <form action={deleteAnnouncement} className="mt-3">
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="text-sm text-blood-300 underline hover:text-white">Delete announcement</button>
                </form>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
