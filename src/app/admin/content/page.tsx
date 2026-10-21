import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { DEFAULT_BLOCKS } from "@/lib/content";
import { AdminFlash, type FlashParams } from "@/components/AdminFlash";
import { SubmitButton } from "@/components/SubmitButton";
import { resetContentBlock, saveContentBlock } from "../actions";

export default async function AdminContent({ searchParams }: { searchParams: FlashParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const saved = await prisma.contentBlock.findMany();
  const byKey = new Map(saved.map((b) => [b.key, b]));
  const keys = Array.from(new Set([...Object.keys(DEFAULT_BLOCKS), ...saved.map((b) => b.key)])).sort();
  return (
    <div>
      <AdminFlash {...sp} />
      <p className="mb-6 text-sm text-bone-400">
        Formatting: blank line = new paragraph, lines starting with <code>- </code> become a list, lines starting with <code>## </code> become FAQ questions. HTML is not rendered. <code>server.faq</code> and <code>server.join</code> are optional extras: they only appear on the Server page once you save some text.
      </p>
      <div className="space-y-4">
        {keys.map((key) => {
          const b = byKey.get(key) ?? { key, ...DEFAULT_BLOCKS[key]! };
          return (
            <details key={key} className="panel p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <span><code className="text-blood-300">{key}</code> <span className="ml-2 text-white">{b.title}</span></span>
                <span className="text-xs text-bone-400">{byKey.has(key) ? "customised" : "default"}</span>
              </summary>
              <form action={saveContentBlock} className="mt-4 space-y-3">
                <input type="hidden" name="key" value={key} />
                <div><label className="label" htmlFor={`t-${key}`}>Title</label><input id={`t-${key}`} name="title" defaultValue={b.title} required maxLength={120} className="field" /></div>
                <div><label className="label" htmlFor={`b-${key}`}>Body</label><textarea id={`b-${key}`} name="body" defaultValue={b.body} rows={10} maxLength={20000} className="field font-mono text-sm" /></div>
                <SubmitButton className="btn-red btn-sm">Save block</SubmitButton>
              </form>
              {byKey.has(key) && DEFAULT_BLOCKS[key] ? (
                <form action={resetContentBlock} className="mt-2">
                  <input type="hidden" name="key" value={key} />
                  <button type="submit" className="text-sm text-bone-400 underline hover:text-white">Reset to default</button>
                </form>
              ) : null}
            </details>
          );
        })}
      </div>
    </div>
  );
}
