import "server-only";

import Link from "next/link";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { SociosInfiniteGrid } from "@/components/socios/SociosInfiniteGrid";
import { loadSociosPageData } from "@/lib/public-data/load-socios-page-data";
import { getSociosPageSize } from "@/lib/public-data/socios-config";

/**
 * Bloque async de `/socios`: catálogo + directorio. Streamea tras el hero estático.
 * El listado usa scroll infinito en cliente (sin paginación por URL).
 */
export async function SociosPageContent() {
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
          El servidor no alcanzó a preparar la lista. Recarga la página en unos segundos o explora el catálogo.
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
  const stats = snapshot?.stats;
  const listingCount = stats?.totalListings ?? 0;
  const geoCount = stats?.geographicDistinctCount ?? 0;

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
            <SociosInfiniteGrid
              entries={entries}
              initialCount={SOCIOS_PAGE_SIZE}
              pageSize={SOCIOS_PAGE_SIZE}
            />
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
