import "server-only";

import Link from "next/link";
import { PropertiesExplorer } from "@/components/properties/PropertiesExplorer";
import { getProperties } from "@/lib/get-properties";
import {
  buildCatalogFilterOptionsCached,
  catalogHasActiveFilters,
  catalogPageSize,
  filterPropertiesCatalog,
  paginateCatalog,
  parseCatalogQuery,
  serializeCatalogQuery,
  sortPropertiesCatalog,
} from "@/lib/properties/catalog-query";

function toURLSearchParams(sp: Record<string, string | string[] | undefined>): URLSearchParams {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      if (v[0]) u.set(k, v[0]);
    } else if (v) {
      u.set(k, v);
    }
  }
  return u;
}

type Props = {
  basePath: "/propiedades" | "/catalogo";
  searchParams: Record<string, string | string[] | undefined>;
};

/**
 * Bloque async del listado: fetch de catálogo + filtrado server-side.
 * Se monta dentro de `<Suspense>` para que el hero de `CatalogListingPage`
 * se entregue antes de que termine `getProperties()`.
 */
export async function CatalogListingData({ basePath, searchParams }: Props) {
  const result = await getProperties();
  const query = parseCatalogQuery(toURLSearchParams(searchParams));
  const navigationKey = serializeCatalogQuery(query).toString() || "catalog";
  const pageSize = catalogPageSize();

  if (!result.ok) {
    return (
      <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-5 py-6 text-center text-brand-navy">
        <p className="font-medium">No pudimos mostrar el catálogo en este momento</p>
        <p className="mt-2 text-sm text-muted">
          Puedes volver a intentar más tarde o coordinar con nosotros por correo y te orientamos.
        </p>
        <Link
          href="/contacto"
          className="mt-4 inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
        >
          Contacto
        </Link>
      </div>
    );
  }

  const filterOptions = buildCatalogFilterOptionsCached(
    result.properties,
    result.ingestMeta?.completedAtMs,
  );
  const filtered = filterPropertiesCatalog(result.properties, query);
  const sorted = sortPropertiesCatalog(filtered, query.sort);
  const { slice: pageItems, total, totalPages, safePage } = paginateCatalog(sorted, query.page, pageSize);
  const hasFilters = catalogHasActiveFilters(query);

  return (
    <>
      {result.usedSampleFallback && (
        <div className="mb-6 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-5 py-4 text-sm text-brand-navy">
          <p className="font-medium">Listado referencial</p>
          <p className="mt-1 text-muted">
            Mostramos una selección de ejemplo mientras se restablece la conexión con el catálogo actualizado. Para
            publicaciones vigentes y prioridades comerciales, contacta al equipo de Redalia.
          </p>
        </div>
      )}
      {result.properties.length === 0 && (
        <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-6 py-12 text-center text-brand-navy">
          <p className="font-medium">No hay publicaciones disponibles por ahora</p>
          <p className="mt-2 text-sm text-muted">
            Si quieres conocer cómo incorporar oferta o recibir novedades de la red, déjanos un mensaje.
          </p>
          <Link
            href="/contacto"
            className="mt-4 inline-flex rounded-full border border-brand-navy/25 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-white"
          >
            Escribir a Redalia
          </Link>
        </div>
      )}
      {result.properties.length > 0 && (
        <PropertiesExplorer
          key={navigationKey}
          basePath={basePath}
          filterOptions={filterOptions}
          pageItems={pageItems}
          totalFiltered={total}
          totalCatalog={result.properties.length}
          totalPages={totalPages}
          safePage={safePage}
          pageSize={pageSize}
          hasActiveFilters={hasFilters}
        />
      )}
    </>
  );
}

export function CatalogListingDataFallback() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40"
      style={{ minHeight: "12rem" }}
      aria-hidden
    />
  );
}
