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
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-brand-navy px-6 py-14 text-center shadow-lg sm:px-10">
      <div className="bg-mesh pointer-events-none absolute inset-0 opacity-90" aria-hidden />
      <div className="relative mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        <p className="mt-4 text-base leading-relaxed text-white/85">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href={primaryHref}
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy shadow-lg transition hover:bg-[#d4b82e]"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          )}
          {tertiaryHref && tertiaryLabel && (
            <Link
              href={tertiaryHref}
              className="inline-flex min-w-[200px] items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/5"
            >
              {tertiaryLabel}
            </Link>
          )}
        </div>
        {footnote && <p className="mt-6 text-xs leading-relaxed text-white/55">{footnote}</p>}
      </div>
    </section>
  );
}
