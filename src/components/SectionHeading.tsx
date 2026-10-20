export function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-display mt-2 text-2xl text-white sm:text-3xl">{title}</h2>
      {children ? <p className="mt-3 text-bone-300">{children}</p> : null}
    </div>
  );
}
