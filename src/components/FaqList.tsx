import type { FaqItem } from "@/lib/site";
import { Icon } from "./Icon";

/** Accessible FAQ accordion built on native <details>/<summary> (keyboard + screen-reader friendly, no JS). */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <details key={f.q} className="group panel overflow-hidden transition open:border-blood-500/40" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-hud text-lg font-bold text-white transition hover:bg-white/[0.02] sm:px-6">
            <span>{f.q}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-blood-300 transition group-open:rotate-180 group-open:border-blood-500/50">
              <Icon name="chevron-down" className="h-4 w-4" />
            </span>
          </summary>
          <div className="border-t border-white/[0.06] px-5 py-4 leading-relaxed text-bone-300 sm:px-6">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

/** FAQPage structured data for search engines. */
export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
