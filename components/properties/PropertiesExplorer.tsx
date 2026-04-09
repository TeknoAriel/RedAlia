"use client";

import { useMemo, useState } from "react";
import type { NormalizedProperty } from "@/types/property";
import type { PropertyOperation } from "@/types/property";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyCompareModal } from "@/components/properties/PropertyCompareModal";

type Props = {
  properties: NormalizedProperty[];
};

const operations: { value: "" | PropertyOperation; label: string }[] = [
  { value: "", label: "Tipo de operación" },
  { value: "venta", label: "Venta" },
  { value: "arriendo", label: "Arriendo" },
  { value: "venta_y_arriendo", label: "Venta y arriendo" },
  { value: "arriendo_temporal", label: "Arriendo temporal" },
];

type SortKey = "recent" | "price_asc" | "price_desc" | "surface_desc";

const sortOptions: { value: SortKey; label: string }[] = [
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

function parsePriceInput(s: string): number | null {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function matchesMin(actual: number | null, minStr: string): boolean {
  if (!minStr) return true;
  const min = Number(minStr);
  if (actual === null) return false;
  return actual >= min;
}

function sortProperties(list: NormalizedProperty[], sort: SortKey): NormalizedProperty[] {
  const out = [...list];
  switch (sort) {
    case "recent":
      return out.sort((a, b) => {
        const am = a.lastUpdateMs ?? 0;
        const bm = b.lastUpdateMs ?? 0;
        return bm - am;
      });
    case "price_asc":
      return out.sort((a, b) => {
        const ap = a.priceNumeric ?? Infinity;
        const bp = b.priceNumeric ?? Infinity;
        return ap - bp;
      });
    case "price_desc":
      return out.sort((a, b) => {
        const ap = a.priceNumeric ?? -Infinity;
        const bp = b.priceNumeric ?? -Infinity;
        return bp - ap;
      });
    case "surface_desc":
      return out.sort((a, b) => {
        const am = a.surfaceM2 ?? -Infinity;
        const bm = b.surfaceM2 ?? -Infinity;
        return bm - am;
      });
    default:
      return out;
  }
}

export function PropertiesExplorer({ properties }: Props) {
  const [q, setQ] = useState("");
  const [operation, setOperation] = useState<"" | PropertyOperation>("");
  const [typeKey, setTypeKey] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [expand, setExpand] = useState<0 | 1 | 2>(0);

  const [bedMin, setBedMin] = useState("");
  const [bathMin, setBathMin] = useState("");
  const [roomsMin, setRoomsMin] = useState("");
  const [parkMin, setParkMin] = useState("");

  const [city, setCity] = useState("");
  const [addressNeedle, setAddressNeedle] = useState("");

  const [currency, setCurrency] = useState<"" | NormalizedProperty["currency"]>("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [m2TotalMin, setM2TotalMin] = useState("");
  const [m2CoveredMin, setM2CoveredMin] = useState("");
  const [m2TerrainMin, setM2TerrainMin] = useState("");

  const [onlyCredit, setOnlyCredit] = useState(false);
  const [onlyBarter, setOnlyBarter] = useState(false);
  const [onlyNew, setOnlyNew] = useState(false);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const typeOptions = useMemo(() => {
    const s = new Set<string>();
    properties.forEach((p) => s.add(p.propertyTypeKey));
    return Array.from(s).sort();
  }, [properties]);

  const cityOptions = useMemo(() => {
    const s = new Set<string>();
    properties.forEach((p) => {
      if (p.city) s.add(p.city);
    });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [properties]);

  const currencyOptions = useMemo(() => {
    const s = new Set<NormalizedProperty["currency"]>();
    properties.forEach((p) => s.add(p.currency));
    const order: NormalizedProperty["currency"][] = ["uf", "clp", "usd", "otro"];
    return order.filter((c) => s.has(c));
  }, [properties]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const addr = addressNeedle.trim().toLowerCase();
    const minN = priceMin ? parsePriceInput(priceMin) : null;
    const maxN = priceMax ? parsePriceInput(priceMax) : null;
    const surfMin = m2TotalMin ? parseFloat(m2TotalMin.replace(",", ".")) : null;
    const covMin = m2CoveredMin ? parseFloat(m2CoveredMin.replace(",", ".")) : null;
    const terMin = m2TerrainMin ? parseFloat(m2TerrainMin.replace(",", ".")) : null;

    return properties.filter((p) => {
      if (needle && !p.searchBlob.includes(needle) && !p.title.toLowerCase().includes(needle)) {
        return false;
      }
      if (operation && p.operation !== operation) return false;
      if (typeKey && p.propertyTypeKey !== typeKey) return false;
      if (city && p.city !== city) return false;

      if (!matchesMin(p.bedrooms, bedMin)) return false;
      if (!matchesMin(p.bathrooms, bathMin)) return false;
      if (!matchesMin(p.totalRooms, roomsMin)) return false;
      if (!matchesMin(p.parkings, parkMin)) return false;

      if (addr) {
        const hay = `${p.address ?? ""} ${p.zone ?? ""} ${p.zoneSecondary ?? ""}`.toLowerCase();
        if (!hay.includes(addr)) return false;
      }

      if (currency && p.currency !== currency) return false;
      if (currency && (minN !== null || maxN !== null)) {
        if (p.priceNumeric === null) return false;
        if (minN !== null && p.priceNumeric < minN) return false;
        if (maxN !== null && p.priceNumeric > maxN) return false;
      }

      if (surfMin !== null && Number.isFinite(surfMin)) {
        if (p.surfaceM2 === null || p.surfaceM2 < surfMin) return false;
      }
      if (covMin !== null && Number.isFinite(covMin)) {
        if (p.coveredM2 === null || p.coveredM2 < covMin) return false;
      }
      if (terMin !== null && Number.isFinite(terMin)) {
        if (p.terrainM2 === null || p.terrainM2 < terMin) return false;
      }

      if (onlyCredit && p.fitForCredit !== true) return false;
      if (onlyBarter && p.acceptBarter !== true) return false;
      if (onlyNew && p.isNewConstruction !== true) return false;

      return true;
    });
  }, [
    properties,
    q,
    operation,
    typeKey,
    city,
    currency,
    priceMin,
    priceMax,
    bedMin,
    bathMin,
    roomsMin,
    parkMin,
    addressNeedle,
    m2TotalMin,
    m2CoveredMin,
    m2TerrainMin,
    onlyCredit,
    onlyBarter,
    onlyNew,
  ]);

  const sorted = useMemo(() => sortProperties(filtered, sort), [filtered, sort]);

  const compareProperties = useMemo(() => {
    const map = new Map(properties.map((p) => [p.id, p]));
    return compareIds.map((id) => map.get(id)).filter(Boolean) as NormalizedProperty[];
  }, [properties, compareIds]);

  /** Evita setState en useEffect (regla react-hooks/set-state-in-effect): el modal solo está “abierto” si hay 2+ ítems. */
  const compareModalOpen = compareOpen && compareIds.length >= 2;

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  const inputClass =
    "rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy placeholder:text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold";
  const labelClass = "flex flex-col gap-1 text-sm";
  const sectionTitle =
    "mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-navy/55";

  return (
    <div>
      <div className="mb-8 overflow-hidden rounded-2xl border border-brand-navy/12 bg-card/95 shadow-lg backdrop-blur-sm tech-panel-glow">
        <div className="border-b border-brand-navy/10 bg-brand-navy-soft/40 px-4 py-3 sm:px-6">
          <p className="text-xs text-muted">
            Filtros ordenados por uso frecuente. La red se alimenta con datos reales del ecosistema
            KiteProp.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {/* Etapa base: búsqueda principal */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Palabras clave</span>
                <input
                  type="search"
                  placeholder="Título, zona, referencia, agencia…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Operación</span>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as typeof operation)}
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
                  value={typeKey}
                  onChange={(e) => setTypeKey(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Todos los tipos</option>
                  {typeOptions.map((t) => (
                    <option key={t} value={t}>
                      {properties.find((p) => p.propertyTypeKey === t)?.propertyTypeLabel ?? t}
                    </option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                <span className="font-medium text-brand-navy">Orden</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
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

          {/* Etapa 1: características + precio + localidad */}
          {expand >= 1 && (
            <div className="mt-8 space-y-8 border-t border-brand-navy/10 pt-8">
              <div>
                <p className={sectionTitle}>Características</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Dormitorios (mín.)</span>
                    <select value={bedMin} onChange={(e) => setBedMin(e.target.value)} className={inputClass}>
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Baños (mín.)</span>
                    <select value={bathMin} onChange={(e) => setBathMin(e.target.value)} className={inputClass}>
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any-b"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Ambientes (mín.)</span>
                    <select value={roomsMin} onChange={(e) => setRoomsMin(e.target.value)} className={inputClass}>
                      {minSelectOptions.map((o) => (
                        <option key={o.value || "any-r"} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Estacionamientos (mín.)</span>
                    <select value={parkMin} onChange={(e) => setParkMin(e.target.value)} className={inputClass}>
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
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as typeof currency)}
                      className={inputClass}
                    >
                      <option value="">Todas (sin filtrar por precio)</option>
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c === "uf"
                            ? "UF"
                            : c === "clp"
                              ? "CLP"
                              : c === "usd"
                                ? "USD"
                                : "Otra"}
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
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Precio máximo</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 500000000"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <p className="flex items-end text-xs leading-snug text-muted sm:col-span-1 lg:col-span-1">
                    El rango numérico aplica con la moneda elegida. Mezclá UF y pesos solo con criterio
                    comercial.
                  </p>
                </div>
              </div>

              <div>
                <p className={sectionTitle}>Localidad</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">Ciudad / comuna</span>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className={inputClass}>
                      <option value="">Todas</option>
                      {cityOptions.map((c) => (
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
                      value={addressNeedle}
                      onChange={(e) => setAddressNeedle(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: superficie + extras */}
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
                      value={m2TotalMin}
                      onChange={(e) => setM2TotalMin(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">m² cubiertos</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 45"
                      value={m2CoveredMin}
                      onChange={(e) => setM2CoveredMin(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className={labelClass}>
                    <span className="font-medium text-brand-navy">m² terreno</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej: 200"
                      value={m2TerrainMin}
                      onChange={(e) => setM2TerrainMin(e.target.value)}
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
                      checked={onlyCredit}
                      onChange={(e) => setOnlyCredit(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-navy/30 text-brand-navy focus:ring-brand-gold"
                    />
                    Apto crédito
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={onlyBarter}
                      onChange={(e) => setOnlyBarter(e.target.checked)}
                      className="h-4 w-4 rounded border-brand-navy/30 text-brand-navy focus:ring-brand-gold"
                    />
                    Acepta permuta
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
                    <input
                      type="checkbox"
                      checked={onlyNew}
                      onChange={(e) => setOnlyNew(e.target.checked)}
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
          Mostrando <strong className="text-brand-navy">{sorted.length}</strong> de {properties.length}{" "}
          publicaciones.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {compareIds.length > 0 && (
            <span className="text-sm text-brand-navy">
              Comparando: <strong>{compareIds.length}</strong>/5
            </span>
          )}
          <button
            type="button"
            disabled={compareIds.length < 2}
            onClick={() => setCompareOpen(true)}
            className="inline-flex items-center rounded-full border border-brand-gold/50 bg-brand-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy-mid disabled:cursor-not-allowed disabled:opacity-45"
          >
            Ver comparación
          </button>
          {compareIds.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-sm font-medium text-muted underline-offset-2 hover:text-brand-navy hover:underline"
            >
              Limpiar selección
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-navy/20 bg-brand-navy-soft/40 px-6 py-16 text-center">
          <p className="text-lg font-medium text-brand-navy">No hay resultados con estos criterios.</p>
          <p className="mt-2 text-sm text-muted">Probá ampliar la búsqueda o limpiar filtros.</p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <li key={p.id}>
              <PropertyCard
                property={p}
                compareSelected={compareIds.includes(p.id)}
                compareDisabled={!compareIds.includes(p.id) && compareIds.length >= 5}
                onToggleCompare={() => toggleCompare(p.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <PropertyCompareModal
        open={compareModalOpen}
        onClose={() => setCompareOpen(false)}
        properties={compareProperties}
        onRemove={(id) => {
          setCompareIds((prev) => prev.filter((x) => x !== id));
        }}
      />
    </div>
  );
}
