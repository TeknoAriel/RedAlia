import Image from "next/image";
import type { ReactNode } from "react";

export type PageHeroVariant = "navy-solid" | "navy-gradient" | "navy-image" | "light";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
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
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">{eyebrow}</p>
          )}
          <h1 className="font-display heading-hero mt-4 max-w-3xl text-3xl font-bold leading-[1.12] text-brand-navy sm:text-4xl lg:text-[2.45rem]">
            {title}
          </h1>
          {lead && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{lead}</p>
          )}
          {children ? <div className="mt-10">{children}</div> : null}
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
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-gold">{eyebrow}</p>
      )}
      <h1 className="font-display heading-hero mt-4 max-w-3xl text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-[2.65rem]">
        {title}
      </h1>
      {lead && (
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">{lead}</p>
      )}
      {children ? <div className="mt-10">{children}</div> : null}
      {footnote ? (
        <p className="mt-8 max-w-xl text-xs leading-relaxed text-white/55">{footnote}</p>
      ) : null}
    </div>
  );

  if (isImage && imageSrc) {
    return (
      <section className="relative overflow-hidden border-b border-brand-navy/10 bg-brand-navy text-white">
        <div className="absolute inset-0 img-tech-wrap">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover opacity-38"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 z-[2] bg-gradient-to-r from-brand-navy via-brand-navy/97 to-brand-navy/90" />
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
