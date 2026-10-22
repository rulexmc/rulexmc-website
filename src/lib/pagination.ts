/** Page numbers to show: first, last, and a window around the current page, with gaps as null. */
export function pageWindow(page: number, pageCount: number, radius = 1): (number | null)[] {
  const set = new Set<number>([1, pageCount]);
  for (let p = page - radius; p <= page + radius; p++) if (p >= 1 && p <= pageCount) set.add(p);
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push(null);
    out.push(p);
  });
  return out;
}
