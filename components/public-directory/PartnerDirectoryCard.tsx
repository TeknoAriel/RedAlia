import Link from "next/link";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";
import { PartnerContactPrivacyGate } from "@/components/socios/PartnerContactPrivacyGate";

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
  const profileHref = `/socios/${encodeURIComponent(entry.publicSlug)}`;

  const btnPrimary =
    "inline-flex items-center justify-center rounded-full bg-brand-navy px-3 py-2 text-center text-[11px] font-semibold text-white transition hover:bg-brand-navy-mid";
  const btnSecondary =
    "inline-flex items-center justify-center rounded-full border border-brand-navy/20 bg-white px-3 py-2 text-center text-[11px] font-semibold text-brand-navy transition hover:bg-brand-navy-soft";

  return (
    <article
      className={`flex flex-col rounded-2xl border border-brand-navy/10 bg-white text-center transition hover:border-brand-gold/35 ${
        compact ? "card-elevated p-3 shadow-sm" : "card-elevated p-3.5"
      }`}
    >
      <div
        className={`mx-auto flex w-full items-center justify-center overflow-hidden rounded-xl border border-brand-navy/10 bg-white ${
          compact ? "h-16 max-w-[6.5rem]" : "h-20 max-w-[9rem]"
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
      <span className="mt-2 inline-flex rounded-full bg-brand-navy-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-navy/75">
        {entry.roleLabel}
      </span>
      <h3
        className={`mt-1.5 min-h-[2.1rem] font-semibold leading-snug text-brand-navy ${
          compact ? "text-xs sm:text-sm" : "text-sm"
        }`}
      >
        {entry.displayName}
      </h3>
      <p className="mt-1.5 text-xs text-muted">
        {entry.propertyCount > 0
          ? `${entry.propertyCount} ${entry.propertyCount === 1 ? "propiedad" : "propiedades"}`
          : "Sin propiedades publicadas"}
      </p>
      {entry.coverageLabels.length > 0 && (
        <p className="mt-1 text-[11px] leading-snug text-muted line-clamp-2">
          Presencia en catálogo: {entry.coverageLabels.join(" · ")}
        </p>
      )}
      <PartnerContactPrivacyGate
        partnerKey={entry.partnerKey}
        partnerName={entry.displayName}
        email={entry.email}
        phone={entry.phone}
        mobile={entry.mobile}
        whatsapp={entry.whatsapp}
        webUrl={entry.webUrl}
        className="mt-2.5 border-t border-brand-navy/10 pt-2.5"
      />
      <div className={`mt-3 flex w-full flex-col gap-2 ${compact ? "" : "gap-2"}`}>
        <Link href={profileHref} className={compact ? `${btnPrimary} py-2` : btnPrimary}>
          Ver ficha institucional
        </Link>
        <Link href={listingHref} className={compact ? `${btnSecondary} py-2` : btnSecondary}>
          Ver propiedades
        </Link>
      </div>
    </article>
  );
}
