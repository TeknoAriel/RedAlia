import Image from "next/image";
import Link from "next/link";
import type { NormalizedProperty } from "@/types/property";
import { labelForOperation } from "@/lib/operation-labels";

type Props = {
  property: NormalizedProperty;
};

/**
 * Tarjeta liviana para bloque “Propiedades relacionadas”: sin bloques de agencia ni resumen largo.
 */
export function RelatedPropertyCard({ property }: Props) {
  const img = property.images[0];
  const opLabel = labelForOperation(property.operation);
  const location = [property.city, property.region].filter(Boolean).join(" · ") || "Ubicación a confirmar";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-navy/10 bg-card shadow-sm transition hover:border-brand-gold/40 hover:shadow-md">
      <div className="relative aspect-[16/10] min-h-[10rem] overflow-hidden bg-brand-navy-soft">
        <Link href={`/propiedades/${property.id}`} className="absolute inset-0 z-0 block" aria-label={`Ver ${property.title}`}>
          <span className="img-tech-wrap relative block h-full w-full">
            {img ? (
              <Image
                src={img}
                alt=""
                fill
                loading="lazy"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <div className="flex h-full min-h-[160px] items-center justify-center text-xs font-medium text-brand-navy/35">
                Sin imagen
              </div>
            )}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/20 via-transparent to-brand-navy/10" />
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
      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-2 text-base font-semibold leading-snug text-brand-navy">
          <Link href={`/propiedades/${property.id}`} className="hover:text-brand-navy-mid">
            {property.title}
          </Link>
        </p>
        <p className="mt-1 text-sm text-muted">{location}</p>
        <p className="mt-3 text-lg font-semibold text-brand-navy">{property.priceDisplay ?? "Consultar"}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-brand-navy/10 pt-3 text-xs text-muted">
          <div>
            <dt className="sr-only">Dormitorios</dt>
            <dd>{property.bedrooms != null ? `${property.bedrooms} dorm.` : "—"}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Baños</dt>
            <dd>{property.bathrooms != null ? `${property.bathrooms} baños` : "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="sr-only">Superficie</dt>
            <dd>
              {property.surfaceM2 != null
                ? `${property.surfaceM2.toLocaleString("es-CL")} m²`
                : "Superficie —"}
            </dd>
          </div>
        </dl>
        <Link
          href={`/propiedades/${property.id}`}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-brand-gold/60 bg-transparent px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-gold/15"
        >
          Ver propiedad
        </Link>
      </div>
    </article>
  );
}
