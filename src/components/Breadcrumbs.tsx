import Link from "next/link";
import { getConfig } from "@/lib/config";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { JsonLd } from "./JsonLd";
import { Icon } from "./Icon";

/** Visible breadcrumb trail plus BreadcrumbList structured data. The last crumb is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(trail, getConfig().siteUrl)} />
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-hud text-sm font-semibold uppercase tracking-[0.14em] text-bone-400">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={c.path} className="flex min-w-0 items-center gap-1.5">
                {i > 0 ? <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-bone-400/60" /> : null}
                {last ? (
                  <span aria-current="page" className="truncate text-bone-200">{c.name}</span>
                ) : (
                  <Link href={c.path} className="rounded transition-colors hover:text-white">{c.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
