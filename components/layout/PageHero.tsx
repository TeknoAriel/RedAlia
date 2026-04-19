import Image from "next/image";
import type { ReactNode } from "react";

export type PageHeroVariant = "navy-solid" | "navy-gradient" | "navy-image" | "light";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Segundo párrafo bajo el lead (misma jerarquía visual, p. ej. cierre de promesa en Home). */
  leadSecondary?: string;
  prepend?: ReactNode;
  children?: ReactNode;
  variant?: PageHeroVariant;
  imageSrc?: string;
  imageAlt?: string;
  footnote?: string;
  contentClassName?: string;
};

export function PageHero({
  eyebrow,
  title,
  lead,
  leadSecondary,
  prepend,
  children,
  variant = "navy-solid",
  imageSrc,
  imageAlt = "",
  footnote,
  contentClassName = "",
}: PageHeroProps) {
  if (variant === "light") {
    return (
      <section className="border-b border-brand-navy/10 bg-gradient-to-b from-brand-navy-soft/90 to-background">
        <div
          className={`mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20 ${contentClassName}`}
        >
          {prepend}
          {eyebrow && <p className="redalia-eyebrow redalia-eyebrow--onLight">{eyebrow}</p>}
          <h1
            className={`font-display heading-hero max-w-3xl text-3xl font-bold leading-[1.12] text-brand-navy sm:text-4xl lg:text-[2.45rem] ${prepend && !eyebrow ? "mt-8 sm:mt-9" : "mt-3 sm:mt-4"}`}
          >
            {title}
          </h1>
          {lead && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{lead}</p>
          )}
          {leadSecondary && (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{leadSecondary}</p>
          )}
          {children ? <div className="mt-10">{children}</div> : null}
          {footnote ? (
            <p className="mt-8 max-w-2xl border-t border-brand-navy/10 pt-6 text-xs leading-relaxed text-muted">
              {footnote}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  const isImage = variant === "navy-image" && Boolean(imageSrc);
  const sectionBg =
    variant === "navy-gradient"
      ? "bg-gradient-to-br from-brand-navy via-brand-navy-mid to-brand-navy"
      : "bg-brand-navy";

  const body = (
    <div
      className={`relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 ${isImage ? "bg-mesh" : ""} ${contentClassName}`}
    >
      {prepend}
      {eyebrow && <p className="redalia-eyebrow redalia-eyebrow--onNavy">{eyebrow}</p>}
      <h1
        className={`font-display heading-hero max-w-3xl text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-[2.65rem] ${prepend && !eyebrow ? "mt-8 sm:mt-9" : "mt-3 sm:mt-4"}`}
      >
        {title}
      </h1>
      {lead && (
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">{lead}</p>
      )}
      {leadSecondary && (
        <p className="mt-5 max-w-2xl border-l-2 border-brand-gold/80 pl-5 text-base leading-relaxed text-white/88 sm:text-lg">
          {leadSecondary}
        </p>
      )}
      {children ? <div className="mt-10">{children}</div> : null}
      {footnote ? (
        <p className="mt-8 max-w-2xl border-t border-white/10 pt-6 text-xs leading-relaxed text-white/70">{footnote}</p>
      ) : null}
    </div>
  );

  if (isImage && imageSrc) {
    return (
      <section className="relative overflow-hidden border-b border-brand-navy/10 bg-brand-navy text-white">
        <div className="absolute inset-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover opacity-[0.26]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 z-[2] bg-gradient-to-br from-brand-navy via-brand-navy/[0.98] to-brand-navy/88" />
          <div className="absolute inset-0 z-[2] bg-gradient-to-t from-brand-navy via-transparent to-brand-navy/40" />
        </div>
        {body}
      </section>
    );
  }

  return (
    <section className={`relative overflow-hidden border-b border-brand-navy/10 text-white ${sectionBg}`}>
      {body}
    </section>
  );
}
