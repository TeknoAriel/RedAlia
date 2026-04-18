type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /** Títulos de sección con peso editorial / institucional */
  titleVariant?: "sans" | "display";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  titleVariant = "sans",
}: SectionHeaderProps) {
  const alignClass = align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl";
  const titleClass =
    titleVariant === "display"
      ? "font-display text-2xl font-bold leading-tight tracking-tight text-brand-navy sm:text-[1.75rem] lg:text-[2rem]"
      : "text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl";
  return (
    <div className={`mb-10 sm:mb-12 ${alignClass}`}>
      {eyebrow && <p className="redalia-eyebrow redalia-eyebrow--onLight">{eyebrow}</p>}
      <h2 className={`${titleClass}${eyebrow ? " mt-2" : ""}`}>{title}</h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-muted sm:text-lg">{description}</p>
      )}
    </div>
  );
}
