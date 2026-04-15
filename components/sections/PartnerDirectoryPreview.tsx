import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PartnerDirectoryCard } from "@/components/public-directory/PartnerDirectoryCard";
import type { PublicDirectorySnapshot } from "@/lib/public-data/types";

type Props = {
  feedOk: boolean;
  snapshot: PublicDirectorySnapshot | null;
};

export function PartnerDirectoryPreview({ feedOk, snapshot }: Props) {
  const hasDirectory = Boolean(snapshot && snapshot.entries.length > 0);
  const stats = snapshot?.stats;

  return (
    <section className="border-y border-brand-navy/10 bg-brand-navy-soft/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionLogoMark size="sm" className="mb-5" />
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Directorio</p>
          <h2 className="font-display mt-3 text-2xl font-bold leading-tight tracking-tight text-brand-navy sm:text-3xl">
            Inmobiliarias y anunciantes en el catálogo
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
            Marcas con publicaciones activas en la red. Los datos provienen del listado público de oportunidades; el
            detalle de contacto es el que cada socio incorporó a sus fichas.
          </p>
        </div>

        {!feedOk && (
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-brand-navy/10 bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-sm font-medium text-brand-navy">Catálogo no disponible en este momento</p>
            <p className="mt-2 text-sm text-muted">
              Cuando el listado esté en línea, acá verás un extracto del directorio institucional.
            </p>
            <Link
              href="/socios"
              className="mt-5 inline-flex rounded-full border border-brand-navy/20 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-white"
            >
              Ir a Socios
            </Link>
          </div>
        )}

        {feedOk && !hasDirectory && (
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-brand-navy/10 bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-sm font-medium text-brand-navy">Directorio en actualización</p>
            <p className="mt-2 text-sm text-muted">
              El catálogo está activo; aún no hay inmobiliarias o anunciantes visibles según los criterios de la red.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/propiedades"
                className="inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
              >
                Ver oportunidades
              </Link>
              <Link
                href="/socios"
                className="inline-flex rounded-full border border-brand-navy/20 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft/80"
              >
                Socios
              </Link>
            </div>
          </div>
        )}

        {hasDirectory && stats && snapshot && (
          <>
            <dl className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-6 text-center sm:gap-10">
              <div className="rounded-xl border border-brand-navy/10 bg-white px-6 py-4 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">
                  Publicaciones en catálogo
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">
                  {stats.totalListings.toLocaleString("es-CL")}
                </dd>
              </div>
              <div className="rounded-xl border border-brand-navy/10 bg-white px-6 py-4 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-navy/60">
                  Inmobiliarias y anunciantes listados
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-brand-navy">
                  {stats.directoryCount.toLocaleString("es-CL")}
                </dd>
              </div>
            </dl>

            {stats.geographicPresenceLabels.length > 0 && (
              <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-muted sm:text-sm">
                <span className="font-semibold text-brand-navy/80">Presencia geográfica en el catálogo (según fichas):</span>{" "}
                {stats.geographicPresenceLabels.join(" · ")}
              </p>
            )}

            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {snapshot.featured.map((entry) => (
                <li key={entry.partnerKey}>
                  <PartnerDirectoryCard entry={entry} variant="compact" />
                </li>
              ))}
            </ul>

            <div className="mt-10 text-center">
              <Link
                href="/socios"
                className="inline-flex rounded-full bg-brand-navy px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-navy-mid"
              >
                Ver directorio completo
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
