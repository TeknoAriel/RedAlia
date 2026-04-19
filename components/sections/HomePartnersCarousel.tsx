import Link from "next/link";
import { PartnerDirectoryCard } from "@/components/public-directory/PartnerDirectoryCard";
import type { PublicPartnerDirectoryEntry } from "@/lib/public-data/types";

type Props = {
  /** Socios destacados (mismo origen que el directorio; sin lógica nueva de datos). */
  entries: PublicPartnerDirectoryEntry[];
  maxSlides?: number;
};

/**
 * Carrusel horizontal (scroll + snap) para dar sensación de comunidad viva.
 */
export function HomePartnersCarousel({ entries, maxSlides = 10 }: Props) {
  const slides = entries.slice(0, maxSlides);
  if (slides.length === 0) return null;

  return (
    <section className="border-b border-brand-navy/10 bg-gradient-to-b from-white to-brand-navy-soft/50 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="redalia-eyebrow redalia-eyebrow--muted">Comunidad en movimiento</p>
            <h2 className="font-display mt-2 max-w-xl text-2xl font-bold leading-tight tracking-tight text-brand-navy sm:text-[1.65rem]">
              Socios que hoy publican en la red
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Un vistazo a corredoras y anunciantes con presencia vigente en el catálogo público. El directorio completo
              está en Socios.
            </p>
          </div>
          <Link
            href="/socios"
            className="inline-flex shrink-0 self-start rounded-full border border-brand-navy/20 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/40 sm:self-auto"
          >
            Ver directorio
          </Link>
        </div>

        <div className="mt-10 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 sm:gap-5">
            {slides.map((entry) => (
              <div
                key={entry.partnerKey}
                className="w-[min(100%,18rem)] shrink-0 snap-start sm:w-[17.5rem]"
              >
                <PartnerDirectoryCard entry={entry} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
