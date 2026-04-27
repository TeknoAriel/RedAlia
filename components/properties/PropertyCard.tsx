import Image from "next/image";
import Link from "next/link";
import type { PropertyListingSummary } from "@/lib/properties/read-model";
import type { NormalizedProperty } from "@/types/property";
import { labelForOperation } from "@/lib/operation-labels";

type PropertyCardProps = {
  property: PropertyListingSummary | NormalizedProperty;
  /** Listado compacto: sin resumen largo; imagen lazy para mejor LCP en grillas paginadas. */
  compactListing?: boolean;
};

export function PropertyCard({
  property,
  compactListing = false,
}: PropertyCardProps) {
  const img = "mainImageUrl" in property ? property.mainImageUrl : property.images[0] ?? null;
  const opLabel = labelForOperation(property.operation);
  const partnerName =
    "partnerName" in property
      ? property.partnerName
      : property.advertiser?.name?.trim() ||
        property.agency?.name?.trim() ||
        property.agentAgency?.name?.trim() ||
        property.subAgentAgency?.name?.trim() ||
        null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-navy/10 bg-card shadow-sm transition hover:border-brand-gold/40 hover:shadow-md">
      <div className="relative aspect-[16/10] min-h-[11rem] overflow-hidden bg-brand-navy-soft sm:min-h-[12.5rem]">
        <Link
          href={`/propiedades/${property.id}`}
          className="absolute inset-0 z-0 block"
          aria-label={`Ver ${property.title}`}
        >
          <span className="img-tech-wrap relative block h-full w-full">
            {img ? (
              <Image
                src={img}
                alt=""
                fill
                loading={compactListing ? "lazy" : undefined}
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full min-h-[200px] items-center justify-center text-sm font-medium text-brand-navy/35">
                Sin imagen
              </div>
            )}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/25 via-transparent to-brand-navy/10" />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-navy/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {opLabel}
          </span>
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-brand-navy shadow-sm">
            {property.propertyTypeLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-brand-navy">
          <Link href={`/propiedades/${property.id}`} className="hover:text-brand-navy-mid">
            {property.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-muted">
          {[property.city, property.zone].filter(Boolean).join(" · ") || "Ubicación a confirmar"}
        </p>
        {partnerName && (
          <div className="mt-3 space-y-1 rounded-lg border border-brand-navy/10 bg-brand-navy-soft/40 px-3 py-2 text-xs tech-panel-glow">
            <p className="text-brand-navy/90">
              <span className="font-medium text-brand-navy/60">Socio · </span>
              {partnerName}
            </p>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-brand-navy/10 pt-4 text-xs text-muted">
          <div>
            <dt className="sr-only">Precio</dt>
            <dd className="font-semibold text-brand-navy">
              {property.priceDisplay ?? "Consultar"}
            </dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Superficie</dt>
            <dd>
              {property.surfaceM2 != null
                ? `${property.surfaceM2.toLocaleString("es-CL")} m²`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Dormitorios</dt>
            <dd>
              {property.bedrooms != null ? `${property.bedrooms} dorm.` : "—"}
            </dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Ref.</dt>
            <dd className="font-mono text-[11px] text-brand-navy/60">{property.referenceCode}</dd>
          </div>
        </dl>
        <Link
          href={`/propiedades/${property.id}`}
          className="mt-5 inline-flex items-center justify-center rounded-full border border-brand-gold/60 bg-transparent px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-gold/15"
        >
          Ver propiedad
        </Link>
      </div>
    </article>
  );
}
