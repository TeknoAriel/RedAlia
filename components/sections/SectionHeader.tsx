type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl";
  return (
    <div className={`mb-10 sm:mb-12 ${alignClass}`}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{title}</h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{description}</p>
      )}
    </div>
  );
}
