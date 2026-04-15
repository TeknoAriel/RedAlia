import Link from "next/link";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";
import { PartnerContactLinks } from "@/components/socios/PartnerContactLinks";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  entry: PublicPartnerDirectoryEntry;
  /** Variante visual: `default` (tarjeta directorio), `compact` (preview home). */
  variant?: "default" | "compact";
};

export function PartnerDirectoryCard({ entry, variant = "default" }: Props) {
  const compact = variant === "compact";
  const listingHref = `/propiedades?socio=${encodeURIComponent(entry.partnerKey)}`;

  return (
    <article
      className={`flex flex-col rounded-2xl border border-brand-navy/10 bg-white text-center transition hover:border-brand-gold/35 ${
        compact ? "card-elevated p-4 shadow-sm" : "card-elevated p-5"
      }`}
    >
      <div
        className={`mx-auto flex w-full items-center justify-center overflow-hidden rounded-xl border border-brand-navy/10 bg-white ${
          compact ? "h-14 max-w-[5.5rem]" : "h-[4.5rem] max-w-[7rem]"
        }`}
      >
        {entry.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.logoUrl}
            alt={entry.displayName}
            className="h-full w-full object-contain p-2"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span
            className={`font-bold tracking-tight text-brand-navy/45 ${compact ? "text-sm" : "text-lg"}`}
            aria-hidden
          >
            {initials(entry.displayName)}
          </span>
        )}
      </div>
      <span className="mt-3 inline-flex rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/75">
        {entry.roleLabel}
      </span>
      <h3
        className={`mt-2 min-h-[2.25rem] font-semibold leading-snug text-brand-navy ${
          compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"
        }`}
      >
        {entry.displayName}
      </h3>
      <p className="mt-2 text-xs text-muted">
        {entry.propertyCount} {entry.propertyCount === 1 ? "publicación" : "publicaciones"}
      </p>
      {entry.coverageLabels.length > 0 && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted">
          Presencia en catálogo: {entry.coverageLabels.join(" · ")}
        </p>
      )}
      <PartnerContactLinks
        email={entry.email}
        phone={entry.phone}
        mobile={entry.mobile}
        whatsapp={entry.whatsapp}
        webUrl={entry.webUrl}
        className="mt-3 border-t border-brand-navy/10 pt-3"
      />
      <Link
        href={listingHref}
        className={`mt-4 inline-flex items-center justify-center font-semibold text-brand-navy-mid underline-offset-2 transition hover:text-brand-gold-deep hover:underline ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {entry.listingCtaLabel}
      </Link>
    </article>
  );
}
