import Link from "next/link";
import { Suspense } from "react";
import { PropertiesExplorer } from "@/components/properties/PropertiesExplorer";
import { getPropertyListingSnapshot } from "@/lib/catalog-read-model/read-model-store";
import {
  buildCatalogFilterOptions,
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

export async function CatalogListingPage({ basePath, searchParams }: Props) {
  const snapshot = await getPropertyListingSnapshot();
  const listingModel = {
    snapshot,
    source: snapshot ? "read_model" : "none",
    syncMeta: {
      lastSyncAtMs: snapshot?.generatedAtMs ?? null,
    },
  } as const;
  const query = parseCatalogQuery(toURLSearchParams(searchParams));
  const navigationKey = serializeCatalogQuery(query).toString() || "catalog";
  const pageSize = catalogPageSize();

  if (!listingModel.snapshot || listingModel.snapshot.items.length === 0) {
    return (
      <div>
        <section className="border-b border-brand-navy/10 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <p className="redalia-eyebrow redalia-eyebrow--onLight">Catálogo</p>
            <h1 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-navy sm:text-4xl">
              Oportunidades publicadas
            </h1>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-5 py-6 text-center text-brand-navy">
            <p className="font-medium">No pudimos mostrar el catálogo en este momento</p>
            <p className="mt-2 text-sm text-muted">
              Podés volver a intentar más tarde o coordinar con nosotros por correo y te orientamos.
            </p>
            <Link
              href="/contacto"
              className="mt-4 inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
            >
              Contacto
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const filterOptions = buildCatalogFilterOptions(listingModel.snapshot.items);
  const filtered = filterPropertiesCatalog(listingModel.snapshot.items, query);
  const sorted = sortPropertiesCatalog(filtered, query.sort);
  const { slice: pageItems, total, totalPages, safePage } = paginateCatalog(sorted, query.page, pageSize);
  const hasFilters = catalogHasActiveFilters(query);

  return (
    <div>
      <section className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="redalia-eyebrow redalia-eyebrow--onLight">Catálogo</p>
          <h1 className="font-display mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-navy sm:text-4xl">
            Oportunidades publicadas
          </h1>
          <p className="mt-4 max-w-2xl text-muted">
            Listado para que corredoras y agentes compartan y cierren más operaciones. Las fichas se actualizan según
            la operación de la comunidad; si necesitás una búsqueda específica,{" "}
            <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
              escribinos
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {listingModel.snapshot.items.length === 0 && (
          <div className="mb-8 rounded-2xl border border-brand-navy/15 bg-brand-navy-soft/50 px-6 py-12 text-center text-brand-navy">
            <p className="font-medium">No hay publicaciones disponibles por ahora</p>
            <p className="mt-2 text-sm text-muted">
              Si querés conocer cómo incorporar oferta o recibir novedades de la red, dejanos un mensaje.
            </p>
            <Link
              href="/contacto"
              className="mt-4 inline-flex rounded-full border border-brand-navy/25 px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-white"
            >
              Escribir a Redalia
            </Link>
          </div>
        )}
        {listingModel.snapshot.items.length > 0 && (
          <Suspense
            key={navigationKey}
            fallback={
              <div
                className="animate-pulse rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40"
                style={{ minHeight: "12rem" }}
              />
            }
          >
            <PropertiesExplorer
              key={navigationKey}
              basePath={basePath}
              filterOptions={filterOptions}
              pageItems={pageItems}
              totalFiltered={total}
              totalCatalog={listingModel.snapshot.items.length}
              totalPages={totalPages}
              safePage={safePage}
              pageSize={pageSize}
              hasActiveFilters={hasFilters}
              readModelSource={listingModel.source}
              readModelGeneratedAtMs={listingModel.syncMeta.lastSyncAtMs}
            />
          </Suspense>
        )}
      </section>
    </div>
  );
}
