export function SectionHeading({
  eyebrow, title, children, align = "left", id, as: Tag = "h2",
}: { eyebrow: string; title: string; children?: React.ReactNode; align?: "left" | "center"; id?: string; as?: "h2" | "h3" }) {
  return (
    <div className={`reveal mb-10 max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <Tag id={id} className="h-display mt-3 text-2xl leading-tight text-white sm:text-4xl">{title}</Tag>
      {children ? <p className="mt-4 text-base leading-relaxed text-bone-300 sm:text-lg">{children}</p> : null}
    </div>
  );
}
