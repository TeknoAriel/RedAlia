import Link from "next/link";

type CTASectionProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  tertiaryHref?: string;
  tertiaryLabel?: string;
  /** Microcopy bajo los botones (p. ej. expectativa de respuesta). */
  footnote?: string;
};

export function CTASection({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  tertiaryHref,
  tertiaryLabel,
  footnote,
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-brand-navy px-6 py-16 text-center shadow-[0_24px_60px_-28px_rgba(15,38,92,0.4)] sm:px-10 sm:py-20">
      <div className="bg-mesh pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-4 text-base leading-relaxed text-white/85">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link href={primaryHref} className="btn-redalia-gold-solid min-w-[200px]">
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link href={secondaryHref} className="btn-redalia-outline-on-navy min-w-[200px]">
              {secondaryLabel}
            </Link>
          )}
          {tertiaryHref && tertiaryLabel && (
            <Link href={tertiaryHref} className="btn-redalia-ghost-on-navy min-w-[200px]">
              {tertiaryLabel}
            </Link>
          )}
        </div>
        {footnote && <p className="mt-6 text-xs leading-relaxed text-white/60">{footnote}</p>}
      </div>
    </section>
  );
}
