import { parseContent } from "@/lib/content";

/** Renders admin-editable text safely (React escapes everything; no HTML is interpreted). */
export function Content({ body, faq = false }: { body: string; faq?: boolean }) {
  const nodes = parseContent(body);
  if (nodes.length === 0) return <p className="text-bone-400">Nothing here yet.</p>;
  return (
    <div className="space-y-4 leading-relaxed text-bone-300">
      {nodes.map((n, i) => {
        if (n.type === "p") return <p key={i}>{n.text}</p>;
        if (n.type === "ul")
          return (
            <ul key={i} className="space-y-2">
              {n.items.map((it, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 bg-blood-500 shadow-[0_0_8px_rgba(239,28,43,0.8)]" aria-hidden />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        return faq ? (
          <details key={i} className="group panel px-5 py-4 open:border-blood-500/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-hud text-lg font-bold text-white">
              {n.q}
              <span className="text-blood-400 transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <div className="mt-3 space-y-2">{n.a.map((a, j) => <p key={j}>{a}</p>)}</div>
          </details>
        ) : (
          <div key={i}>
            <h3 className="font-hud text-lg font-bold text-white">{n.q}</h3>
            {n.a.map((a, j) => <p key={j}>{a}</p>)}
          </div>
        );
      })}
    </div>
  );
}
