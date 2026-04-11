"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NormalizedProperty } from "@/types/property";
import { labelForOperation } from "@/lib/operation-labels";

type Props = {
  open: boolean;
  onClose: () => void;
  properties: NormalizedProperty[];
  onRemove: (id: string) => void;
};

function fmtBool(v: boolean | null): string {
  if (v === true) return "Sí";
  if (v === false) return "No";
  return "—";
}

function cell(p: NormalizedProperty, key: string): ReactNode {
  switch (key) {
    case "title":
      return (
        <Link href={`/propiedades/${p.id}`} className="font-medium text-brand-navy hover:underline">
          {p.title}
        </Link>
      );
    case "operation":
      return labelForOperation(p.operation);
    case "type":
      return p.propertyTypeLabel;
    case "price":
      return p.priceDisplay ?? "Consultar";
    case "location":
      return [p.city, p.zone, p.address].filter(Boolean).join(" · ") || "—";
    case "surface":
      return p.surfaceM2 != null ? `${p.surfaceM2.toLocaleString("es-CL")} m²` : "—";
    case "covered":
      return p.coveredM2 != null ? `${p.coveredM2.toLocaleString("es-CL")} m²` : "—";
    case "terrain":
      return p.terrainM2 != null ? `${p.terrainM2.toLocaleString("es-CL")} m²` : "—";
    case "bedrooms":
      return p.bedrooms != null ? String(p.bedrooms) : "—";
    case "bathrooms":
      return p.bathrooms != null ? String(p.bathrooms) : "—";
    case "rooms":
      return p.totalRooms != null ? String(p.totalRooms) : "—";
    case "parkings":
      return p.parkings != null ? String(p.parkings) : "—";
    case "credit":
      return fmtBool(p.fitForCredit);
    case "barter":
      return fmtBool(p.acceptBarter);
    case "new":
      return fmtBool(p.isNewConstruction);
    case "advertiser":
      return p.advertiser?.name ?? "—";
    case "agents":
      return p.associatedAgentsLabel ?? "—";
    case "master_agency":
      return p.masterAgency?.name ?? "—";
    case "agency":
      return p.agency?.name ?? "—";
    case "ref":
      return p.referenceCode;
    default:
      return "—";
  }
}

const rows: { key: string; label: string }[] = [
  { key: "title", label: "Propiedad" },
  { key: "operation", label: "Operación" },
  { key: "type", label: "Tipo" },
  { key: "price", label: "Precio" },
  { key: "location", label: "Ubicación" },
  { key: "surface", label: "m² totales" },
  { key: "covered", label: "m² cubiertos" },
  { key: "terrain", label: "m² terreno" },
  { key: "bedrooms", label: "Dormitorios" },
  { key: "bathrooms", label: "Baños" },
  { key: "rooms", label: "Ambientes" },
  { key: "parkings", label: "Estacionamientos" },
  { key: "credit", label: "Apto crédito" },
  { key: "barter", label: "Acepta permuta" },
  { key: "new", label: "Nuevo / a estrenar" },
  { key: "advertiser", label: "Socio (anunciante)" },
  { key: "master_agency", label: "Agencia matriz (red)" },
  { key: "agency", label: "Inmobiliaria / agencia" },
  { key: "agents", label: "Agentes asociados" },
  { key: "ref", label: "Referencia" },
];

export function PropertyCompareModal({ open, onClose, properties, onRemove }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm"
        aria-label="Cerrar comparación"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-[min(96rem,100%)] flex-col overflow-hidden rounded-2xl border border-brand-navy/15 bg-card shadow-2xl tech-panel-glow">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-brand-navy/10 px-5 py-4 sm:px-6">
          <div>
            <h2 id="compare-modal-title" className="text-lg font-bold text-brand-navy">
              Comparar propiedades
            </h2>
            <p className="mt-1 text-sm text-muted">
              Hasta 5 fichas lado a lado. Los datos provienen del feed de la red.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-navy/70 transition hover:bg-brand-navy-soft hover:text-brand-navy"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-3 py-4 sm:px-5">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card px-2 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Dato
                  </th>
                  {properties.map((p) => (
                    <th
                      key={p.id}
                      className="min-w-[160px] border-l border-brand-navy/10 px-2 py-3 align-top"
                    >
                      <div className="relative mb-2 aspect-[16/10] w-full overflow-hidden rounded-lg bg-brand-navy-soft">
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        ) : (
                          <div className="flex h-full min-h-[72px] items-center justify-center text-xs text-brand-navy/40">
                            Sin foto
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        className="text-xs font-medium text-brand-gold-deep hover:underline"
                      >
                        Quitar
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key} className="border-t border-brand-navy/10">
                    <th className="sticky left-0 z-10 bg-card px-2 py-2.5 text-xs font-medium text-brand-navy/80">
                      {row.label}
                    </th>
                    {properties.map((p) => (
                      <td
                        key={`${p.id}-${row.key}`}
                        className="border-l border-brand-navy/10 px-2 py-2.5 text-brand-navy"
                      >
                        <div className="max-w-[220px] text-sm leading-snug">{cell(p, row.key)}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
