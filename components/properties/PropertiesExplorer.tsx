"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { PropertyOperation } from "@/types/property";
import { PropertyCard } from "@/components/properties/PropertyCard";
import {
  type CatalogFilterOptions,
  type CatalogSortKey,
  catalogHref,
  parseCatalogQuery,
} from "@/lib/properties/catalog-query";
import type { PropertyListingSummary } from "@/lib/properties/read-model";

type Props = {
  basePath: "/propiedades" | "/catalogo";
  filterOptions: CatalogFilterOptions;
  pageItems: PropertyListingSummary[];
  totalFiltered: number;
  totalCatalog: number;
  totalPages: number;
  safePage: number;
  pageSize: number;
  hasActiveFilters: boolean;
  readModelSource: string;
  readModelGeneratedAtMs: number | null;
};

const operations: { value: "" | PropertyOperation; label: string }[] = [
  { value: "", label: "Tipo de operación" },
  { value: "venta", label: "Venta" },
  { value: "arriendo", label: "Arriendo" },
  { value: "venta_y_arriendo", label: "Venta y arriendo" },
  { value: "arriendo_temporal", label: "Arriendo temporal" },
];

const sortOptions: { value: CatalogSortKey; label: string }[] = [
  { value: "recent", label: "Ordenar: más recientes" },
  { value: "price_desc", label: "Ordenar: mayor precio" },
  { value: "price_asc", label: "Ordenar: menor precio" },
  { value: "surface_desc", label: "Ordenar: más m²" },
];

const minSelectOptions = [
  { value: "", label: "Cualquiera" },
  { value: "1", label: "1 o más" },
  { value: "2", label: "2 o más" },
  { value: "3", label: "3 o más" },
  { value: "4", label: "4 o más" },
  { value: "5", label: "5 o más" },
];

export function PropertiesExplorer({
  basePath,
  filterOptions,
  pageItems,
  totalFiltered,
  totalCatalog,
  totalPages,
  safePage,
  pageSize,
  hasActiveFilters,
  readModelSource,
  readModelGeneratedAtMs,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const qs = searchParams.toString();
  const query = useMemo(() => parseCatalogQuery(new URLSearchParams(qs)), [qs]);

  const [expand, setExpand] = useState<0 | 1 | 2>(0);
  const [qDraft, setQDraft] = useState(query.q);

  useEffect(() => {
    if (qDraft === query.q) return;
    const t = setTimeout(() => {
      startTransition(() => {
        router.replace(catalogHref(basePath, query, { q: qDraft, page: 1 }));
      });
    }, 480);
    return () => clearTimeout(t);
  }, [qDraft, query, basePath, router]);

  function navigate(patch: Parameters<typeof catalogHref>[2]) {
    startTransition(() => {
      router.push(catalogHref(basePath, query, patch));
    });
  }

  const inputClass =
    "rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy placeholder:text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold";
  const labelClass = "flex flex-col gap-1 text-sm";
  const sectionTitle =
    "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy/55";

  return (
    <div>
      {query.socio && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-brand-gold/35 bg-brand-navy-soft/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-navy">
            <span className="font-medium">Filtro activo:</span> solo publicaciones vinculadas a este socio. Ver también{" "}
            <Link href="/socios" className="font-semibold text-brand-gold-deep underline-offset-2 hover:underline">
              Socios de la red
            </Link>
            .
          </p>
          <Link
            href={basePath}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-xs font-semibold text-brand-navy shadow-sm transition hover:bg-white/90"
          >
            Ver todo el catálogo
          </Link>
        </div>
      )}

      {isPending && (
        <p className="mb-3 text-xs text-muted" aria-live="polite">
          Actualizando listado…
        </p>
      )}

      <div className="mb-8 overflow-hidden rounded-2xl border border-brand-navy/12 bg-card/95 shadow-lg backdrop-blur-sm tech-panel-glow">
        <div className="border-b border-brand-navy/10 bg-brand-navy-soft/40 px-4 py-3 sm:px-6">
          <p className="text-xs text-muted">
            Refiná el listado por operación, zona y características. Los filtros se aplican en el servidor: cada
            cambio actualiza la página con hasta {pageSize} publicaciones visibles.
          </p>
          {readModelGeneratedAtMs && (
            <p className="mt-1 text-[11px] text-muted">
              Modelo de lectura: <strong>{readModelSource}</strong> · actualizado{" "}
              {new Date(readModelGeneratedAtMs).toLocaleString("es-CL")}
            </p>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Palabras clave</span>
                <input
                  type="search"
                  placeholder="Título, zona, referencia, corredora…"
                  value={qDraft}
                  onChange={(e) => setQDraft(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Operación</span>
                <select
                  value={query.operation}
                  onChange={(e) =>
                    navigate({
                      operation: e.target.value as "" | PropertyOperation,
                      page: 1,
                    })
                  }
                  className={inputClass}
                >
                  {operations.map((o) => (
                    <option key={o.value || "all"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Tipo de propiedad</span>
                <select
                  value={query.typeKey}
                  onChange={(e) => navigate({ typeKey: e.target.value, page: 1 })}
                  className={inputClass}
                >
                  <option value="">Todos los tipos</option>
                  {filterOptions.typeOptions.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Orden</span>
                <select
                  value={query.sort}
                  onChange={(e) => navigate({ sort: e.target.value as CatalogSortKey, page: 1 })}
                  className={inputClass}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setExpand((e) => (e >= 1 ? 0 : 1))}
                className="inline-flex items-center justify-center rounded-xl border border-brand-navy/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:border-brand-gold/50 hover:bg-brand-navy-soft/50"
              >
                {expand >= 1 ? "Menos filtros" : "Más filtros"}
              </button>
              {expand >= 1 && (
                <button
                  type="button"
                  onClick={() => setExpand((e) => (e >= 2 ? 1 : 2))}
                  className="inline-flex items-center justify-center rounded-xl border border-brand-navy/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:border-brand-gold/50 hover:bg-brand-navy-soft/50"
                >
                  {expand >= 2 ? "Ocultar avanzados" : "Filtros avanzados"}
                </button>
              )}
            </div>
          </div>

          {expand >= 1 && (
            <div className="mt-8 space-y-8 border-t border-brand-navy/10 pt-8">
              <div>
                <p className={sectionTitle}>Características</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Dormitorios (mín.)</span>
                    <select
                      value={query.bedMin}
                      onChange={(e) => navigate({ bedMin: e.target.value, page: 1 })}
                      className={inputClass}
                    >
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Baños (mín.)</span>
                    <select
                      value={query.bathMin}
                      onChange={(e) => navigate({ bathMin: e.target.value, page: 1 })}
                      className={inputClass}
                    >
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any-b"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Ambientes (mín.)</span>
                    <select
                      value={query.roomsMin}
                      onChange={(e) => navigate({ roomsMin: e.target.value, page: 1 })}
                      className={inputClass}
                    >
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any-r"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Estacionamientos (mín.)</span>
                    <select
                      value={query.parkMin}
                      onChange={(e) => navigate({ parkMin: e.target.value, page: 1 })}
                      className={inputClass}
                    >
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any-p"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Precio</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Moneda</span>
                    <select
                      value={query.currency}
                      onChange={(e) =>
                        navigate({
                          currency: e.target.value as typeof query.currency,
                          page: 1,
                        })
                      }
                      className={inputClass}
                    >
                      <option value="">Todas (sin filtrar por precio)</option>
                      {filterOptions.currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c === "uf" ? "UF" : c === "clp" ? "CLP" : c === "usd" ? "USD" : "Otra"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Precio mínimo</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 1000"
                      defaultValue={query.priceMin}
                      key={`priceMin-${qs}`}
                      onBlur={(e) => navigate({ priceMin: e.target.value, page: 1 })}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Precio máximo</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 500000000"
                      defaultValue={query.priceMax}
                      key={`priceMax-${qs}`}
                      onBlur={(e) => navigate({ priceMax: e.target.value, page: 1 })}
                      className={inputClass}
                    />
                  </label>
                  <p className="flex items-end text-xs leading-snug text-muted sm:col-span-1 lg:col-span-1">
                    El rango numérico aplica con la moneda elegida.
                  </p>
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Localidad</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Ciudad / comuna</span>
                    <select
                      value={query.city}
                      onChange={(e) => navigate({ city: e.target.value, page: 1 })}
                      className={inputClass}
                    >
                      <option value="">Todas</option>
                      {filterOptions.cityOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={`${labelClass} sm:col-span-2`}>
                    <span className="font-medium text-brand-navy">Dirección o zona (texto)</span>
                    <input
                      type="search"
                      placeholder="Calle, barrio, sector…"
                      defaultValue={query.addressNeedle}
                      key={`addr-${qs}`}
                      onBlur={(e) => navigate({ addressNeedle: e.target.value, page: 1 })}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {expand >= 2 && (
            <div className="mt-8 space-y-8 border-t border-brand-navy/10 pt-8">
              <div>
                <p className={sectionTitle}>Superficie mínima</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">m² totales</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 50"
                      defaultValue={query.m2TotalMin}
                      key={`m2t-${qs}`}
                      onBlur={(e) => navigate({ m2TotalMin: e.target.value, page: 1 })}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">m² cubiertos</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 45"
                      defaultValue={query.m2CoveredMin}
                      key={`m2c-${qs}`}
                      onBlur={(e) => navigate({ m2CoveredMin: e.target.value, page: 1 })}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">m² terreno</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 200"
                      defaultValue={query.m2TerrainMin}
                      key={`m2tr-${qs}`}
                      onBlur={(e) => navigate({ m2TerrainMin: e.target.value, page: 1 })}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Extras</p>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={query.onlyCredit}
                      onChange={(e) => navigate({ onlyCredit: e.target.checked, page: 1 })}
                      className="h-4 w-4 rounded border-brand-navy/30 text-brand-navy focus:ring-brand-gold"
                    />
                    Apto crédito
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={query.onlyBarter}
                      onChange={(e) => navigate({ onlyBarter: e.target.checked, page: 1 })}
                      className="h-4 w-4 rounded border-brand-navy/30 text-brand-navy focus:ring-brand-gold"
                    />
                    Acepta permuta
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={query.onlyNew}
                      onChange={(e) => navigate({ onlyNew: e.target.checked, page: 1 })}
                      className="h-4 w-4 rounded border-brand-navy/30 text-brand-navy focus:ring-brand-gold"
                    />
                    Nuevo / a estrenar
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          {totalFiltered === 0 ? (
            <>
              Sin resultados con estos criterios (sobre <strong className="text-brand-navy">{totalCatalog}</strong> en
              catálogo).
            </>
          ) : hasActiveFilters ? (
            <>
              Página <strong className="text-brand-navy">{safePage}</strong> de{" "}
              <strong className="text-brand-navy">{totalPages}</strong>
              <span className="mx-1 text-brand-navy/35">·</span>
              <strong className="text-brand-navy">{(safePage - 1) * pageSize + 1}</strong>–
              <strong className="text-brand-navy">{Math.min(safePage * pageSize, totalFiltered)}</strong> de{" "}
              <strong className="text-brand-navy">{totalFiltered}</strong> resultados
            </>
          ) : totalPages > 1 ? (
            <>
              Página <strong className="text-brand-navy">{safePage}</strong> de{" "}
              <strong className="text-brand-navy">{totalPages}</strong>
              <span className="mx-1 text-brand-navy/35">·</span>
              <strong className="text-brand-navy">{(safePage - 1) * pageSize + 1}</strong>–
              <strong className="text-brand-navy">{Math.min(safePage * pageSize, totalFiltered)}</strong> de{" "}
              <strong className="text-brand-navy">{totalCatalog}</strong> propiedades
            </>
          ) : (
            <>
              Mostrando <strong className="text-brand-navy">{totalFiltered}</strong> propiedades
            </>
          )}
        </p>
        <div />
      </div>

      {totalFiltered === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-navy/20 bg-brand-navy-soft/40 px-6 py-16 text-center">
          <p className="text-lg font-medium text-brand-navy">No hay resultados con estos criterios.</p>
          <p className="mt-2 text-sm text-muted">Probá ampliar la búsqueda o limpiar filtros.</p>
        </div>
      ) : (
        <>
          <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((p) => (
              <li key={p.id}>
                <PropertyCard
                  property={p}
                  compactListing
                />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav
              className="mt-10 flex flex-col items-center gap-4 border-t border-brand-navy/10 pt-8 sm:flex-row sm:justify-between"
              aria-label="Paginación del catálogo"
            >
              <p className="text-center text-sm text-muted sm:text-left">
                Página <span className="font-semibold text-brand-navy">{safePage}</span> de{" "}
                <span className="font-semibold text-brand-navy">{totalPages}</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {safePage > 1 ? (
                  <Link
                    href={catalogHref(basePath, query, { page: safePage - 1 })}
                    className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
                    scroll={false}
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
                    href={catalogHref(basePath, query, { page: safePage + 1 })}
                    className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
                    scroll={false}
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
  );
}
