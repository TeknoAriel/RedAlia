"use client";

import { useMemo, useState } from "react";
import type { NormalizedProperty } from "@/types/property";
import type { PropertyOperation } from "@/types/property";
import { PropertyCard } from "@/components/properties/PropertyCard";

type Props = {
  properties: NormalizedProperty[];
};

const operations: { value: "" | PropertyOperation; label: string }[] = [
  { value: "", label: "Todas las operaciones" },
  { value: "venta", label: "Venta" },
  { value: "arriendo", label: "Arriendo" },
  { value: "venta_y_arriendo", label: "Venta y arriendo" },
  { value: "arriendo_temporal", label: "Arriendo temporal" },
];

export function PropertiesExplorer({ properties }: Props) {
  const [q, setQ] = useState("");
  const [operation, setOperation] = useState<"" | PropertyOperation>("");
  const [typeKey, setTypeKey] = useState("");
  const [city, setCity] = useState("");
  const [currency, setCurrency] = useState<"" | "uf" | "clp">("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

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

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const minN = priceMin ? parseFloat(priceMin.replace(/\./g, "").replace(",", ".")) : null;
    const maxN = priceMax ? parseFloat(priceMax.replace(/\./g, "").replace(",", ".")) : null;

    return properties.filter((p) => {
      if (needle && !p.searchBlob.includes(needle) && !p.title.toLowerCase().includes(needle)) {
        return false;
      }
      if (operation && p.operation !== operation) return false;
      if (typeKey && p.propertyTypeKey !== typeKey) return false;
      if (city && p.city !== city) return false;
      if (currency && p.currency !== currency) return false;
      if (currency && (minN !== null || maxN !== null)) {
        if (p.priceNumeric === null) return false;
        if (minN !== null && p.priceNumeric < minN) return false;
        if (maxN !== null && p.priceNumeric > maxN) return false;
      }
      return true;
    });
  }, [properties, q, operation, typeKey, city, currency, priceMin, priceMax]);

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-brand-navy/10 bg-card p-4 shadow-sm sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Buscar</span>
            <input
              type="search"
              placeholder="Título, zona, referencia…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy placeholder:text-muted focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Operación</span>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as typeof operation)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              {operations.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Tipo</span>
            <select
              value={typeKey}
              onChange={(e) => setTypeKey(e.target.value)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="">Todos los tipos</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {properties.find((p) => p.propertyTypeKey === t)?.propertyTypeLabel ?? t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Ciudad / comuna</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="">Todas</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-4 border-t border-brand-navy/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Moneda (filtro de precio)</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as typeof currency)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="">Todas (sin filtrar por precio)</option>
              <option value="uf">UF</option>
              <option value="clp">Pesos (CLP)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Precio mín.</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ej: 1000"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-brand-navy">Precio máx.</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Ej: 500000000"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="rounded-lg border border-brand-navy/15 px-3 py-2 text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
          </label>
          <p className="flex items-end text-xs leading-snug text-muted">
            El rango numérico aplica sobre propiedades con precio visible y misma moneda seleccionada.
            Mezcla UF y CLP solo con criterio comercial.
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm text-muted">
        Mostrando{" "}
        <strong className="text-brand-navy">{filtered.length}</strong> de{" "}
        {properties.length} publicaciones.
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-navy/20 bg-brand-navy-soft/40 px-6 py-16 text-center">
          <p className="text-lg font-medium text-brand-navy">No hay resultados con estos criterios.</p>
          <p className="mt-2 text-sm text-muted">Probá ampliar la búsqueda o limpiar filtros.</p>
        </div>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <PropertyCard property={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
