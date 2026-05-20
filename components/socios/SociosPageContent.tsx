import "server-only";

import Link from "next/link";
import { PartnerDirectoryCard } from "@/components/public-directory/PartnerDirectoryCard";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { loadSociosPageData } from "@/lib/public-data/load-socios-page-data";
import { getSociosPageSize } from "@/lib/public-data/socios-config";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

/**
 * Bloque async de `/socios`: catálogo + directorio. Streamea tras el hero estático.
 */
export async function SociosPageContent({ searchParams }: Props) {
  const rawPage = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;

  let result;
  let stable;
  try {
    const loaded = await loadSociosPageData({ featuredMax: 8 });
    result = loaded.result;
    stable = loaded.stable;
  } catch {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-brand-navy/15 bg-white px-6 py-10 text-center shadow-sm">
        <p className="font-display text-lg font-semibold text-brand-navy">Directorio temporalmente no disponible</p>
        <p className="mt-2 text-sm text-muted">
          El servidor no alcanzó a preparar la lista. Recargá la página en unos segundos o explorá el catálogo.
        </p>
        <Link
          href="/propiedades"
          className="mt-6 inline-flex rounded-full bg-brand-navy px-6 py-3 text-sm font-semibold text-white"
        >
          Ver propiedades
        </Link>
      </div>
    );
  }

  const snapshot = stable.snapshot;
  const entries = snapshot?.entries ?? [];
  const SOCIOS_PAGE_SIZE = getSociosPageSize();
  const totalPages = Math.max(1, Math.ceil(entries.length / SOCIOS_PAGE_SIZE));
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, totalPages) : 1;
  const pageStart = (safePage - 1) * SOCIOS_PAGE_SIZE;
  const pagedEntries = entries.slice(pageStart, pageStart + SOCIOS_PAGE_SIZE);
  const stats = snapshot?.stats;
  const listingCount = stats?.totalListings ?? 0;
  const geoCount = stats?.geographicDistinctCount ?? 0;
  const pageHref = (page: number): string => (page <= 1 ? "/socios" : `/socios?page=${page}`);

  return (
    <>
      {result.ok && listingCount > 0 ? (
        <section className="border-b border-brand-navy/10 bg-brand-navy">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
              <p className="text-2xl font-bold tracking-tight text-brand-gold">
                {listingCount.toLocaleString("es-CL")}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                {listingCount === 1 ? "Publicación en catálogo" : "Publicaciones en catálogo"}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
              <p className="text-2xl font-bold tracking-tight text-brand-gold">{entries.length}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                {entries.length === 1
                  ? "Corredora o anunciante listado"
                  : "Corredoras y anunciantes listados"}
              </p>
            </div>
            {geoCount > 0 && (
              <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
                <p className="text-2xl font-bold tracking-tight text-brand-gold">{geoCount}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                  Ubicaciones distintas en fichas
                </p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="border-y border-brand-navy/10 bg-[linear-gradient(180deg,#f1f5f9_0%,#fff_45%,#f8fafc_100%)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Directorio"
            title="Socios con presencia en el catálogo"
            description="Listado derivado de publicaciones activas: orden institucional por actividad, sin duplicar marcas y con la matriz del feed tratada según las reglas acordadas. Los contactos son los publicados en cada ficha —criterio y transparencia frente al mercado."
            titleVariant="display"
          />

          {stats && stats.geographicPresenceLabels.length > 0 && (
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-muted">
              <span className="font-semibold text-brand-navy">Presencia geográfica en fichas del catálogo:</span>{" "}
              {stats.geographicPresenceLabels.join(" · ")}
            </p>
          )}

          {stable.source === "snapshot_persisted" && entries.length > 0 && (
            <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-muted">
              Directorio estable: última sincronización guardada
              {stable.persistedSnapshotMeta
                ? ` (${new Date(stable.persistedSnapshotMeta.generatedAtMs).toLocaleString("es-CL")})`
                : ""}
              . La red respondió con intermitencia; no mostramos error al visitante.
            </p>
          )}

          {!result.ok && (
            <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-brand-navy/15 bg-white px-6 py-8 text-center shadow-sm">
              <p className="font-display text-lg font-semibold text-brand-navy">Vista del directorio en pausa</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                El listado público se restablece cuando el catálogo vuelve a estar disponible. Puedes escribirnos y
                coordinamos la información que necesites.
              </p>
              <Link
                href="/contacto"
                className="mt-6 inline-flex rounded-full bg-brand-navy px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-brand-navy-mid"
              >
                Escribir a Redalia
              </Link>
            </div>
          )}

          {result.ok && entries.length === 0 && (
            <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-lg">
              <div className="border-b border-brand-navy/10 bg-brand-navy px-6 py-4 text-center text-white">
                <p className="redalia-eyebrow redalia-eyebrow--onNavy !mb-0 text-center">Directorio</p>
                <p className="mt-1 text-sm text-white/85">Sin entradas que cumplan los criterios actuales</p>
              </div>
              <div className="px-8 py-12 text-center">
                <p className="text-lg font-semibold text-brand-navy">Tu marca en un espacio de alto estándar</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Cuando haya publicaciones que asocien corredoras o anunciantes según las reglas de la red, aparecerán
                  aquí automáticamente. Mientras tanto puedes explorar el catálogo o conversar con el equipo.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/unete" className="btn-redalia-gold-solid min-w-[200px]">
                    Postular como socio
                  </Link>
                  <Link
                    href="/propiedades"
                    className="inline-flex rounded-full border border-brand-navy/20 px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
                  >
                    Ver catálogo
                  </Link>
                </div>
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <>
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {pagedEntries.map((entry) => (
                  <li key={entry.partnerKey}>
                    <PartnerDirectoryCard entry={entry} variant="default" />
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <nav
                  className="mt-8 flex flex-col items-center gap-4 border-t border-brand-navy/10 pt-6 sm:flex-row sm:justify-between"
                  aria-label="Paginación socios"
                >
                  <p className="text-sm text-muted">
                    Página <span className="font-semibold text-brand-navy">{safePage}</span> de{" "}
                    <span className="font-semibold text-brand-navy">{totalPages}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {safePage > 1 ? (
                      <Link
                        href={pageHref(safePage - 1)}
                        className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
                      >
                        Anterior
                      </Link>
                    ) : (
                      <span className="inline-flex cursor-not-allowed items-center rounded-full border border-brand-navy/10 px-4 py-2 text-sm font-semibold text-muted opacity-50">
                        Anterior
                      </span>
                    )}
                    {safePage < totalPages ? (
                      <Link
                        href={pageHref(safePage + 1)}
                        className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
                      >
                        Siguiente
                      </Link>
                    ) : (
                      <span className="inline-flex cursor-not-allowed items-center rounded-full border border-brand-navy/10 px-4 py-2 text-sm font-semibold text-muted opacity-50">
                        Siguiente
                      </span>
                    )}
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

export function SociosPageContentFallback() {
  return (
    <>
      <section className="border-b border-brand-navy/10 bg-brand-navy/90 py-10" aria-hidden>
        <div className="mx-auto max-w-6xl animate-pulse px-4 sm:px-6 lg:px-8">
          <div className="h-16 w-64 rounded-xl bg-white/10" />
        </div>
      </section>
      <section className="border-y border-brand-navy/10 py-16" aria-hidden>
        <div className="mx-auto max-w-6xl animate-pulse px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 rounded bg-brand-navy/10" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-brand-navy-soft/60" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
