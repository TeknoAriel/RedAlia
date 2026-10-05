import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyAmenities } from "@/components/properties/PropertyAmenities";
import { PropertyConsultForm } from "@/components/properties/PropertyConsultForm";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { PropertyOrgAgentBlock } from "@/components/properties/PropertyOrgAgentBlock";
import { getProperties, getPropertyById } from "@/lib/get-properties";
import { pickRelatedProperties } from "@/lib/properties/pick-related-properties";
import { RelatedPropertyCard } from "@/components/properties/RelatedPropertyCard";
import { propertyOrgAndAgent } from "@/lib/properties/property-org-agent";
import { labelForOperation } from "@/lib/operation-labels";
import { propertyKitepropMessageTarget } from "@/lib/property-kiteprop-dispatch";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getPropertyById(id);
  if (!p) return { title: "Propiedad" };
  return {
    title: p.title.slice(0, 60),
    description: p.summary,
    openGraph: {
      title: p.title,
      description: p.summary,
      images: p.images[0] ? [p.images[0]] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const catalog = await getProperties();
  if (!catalog.ok) notFound();
  const p = catalog.properties.find((x) => x.id === id) ?? null;
  if (!p) notFound();

  const related = pickRelatedProperties(p, catalog.properties, { limit: 6 });

  const op = labelForOperation(p.operation);
  const { organization, agent } = propertyOrgAndAgent(p);
  const hasPublisherSection = Boolean(organization || agent || p.associatedAgentsLabel);
  const kpDispatch = propertyKitepropMessageTarget(p);

  return (
    <div className="pb-16">
      <div className="border-b border-brand-navy/10 bg-brand-navy-soft/40">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/propiedades"
            className="text-sm font-medium text-brand-navy/80 hover:text-brand-navy"
          >
            ← Volver al listado
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-navy px-3 py-1 text-xs font-semibold text-white">
              {op}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-navy/15">
              {p.propertyTypeLabel}
            </span>
            <span className="rounded-full bg-white px-3 py-1 font-mono text-xs text-muted ring-1 ring-brand-navy/10">
              {p.referenceCode}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-lg text-muted">
            {[p.city, p.zone, p.zoneSecondary].filter(Boolean).join(" · ") || "Ubicación a confirmar"}
          </p>
          <p className="mt-4 text-2xl font-semibold text-brand-navy">{p.priceDisplay ?? "Consultar"}</p>
        </header>

        <PropertyGallery images={p.images} title={p.title} />

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-brand-navy">Descripción</h2>
            <div className="prose prose-slate mt-3 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/90">
              {p.description || p.summary}
            </div>
            <PropertyAmenities amenities={p.amenities ?? []} />
          </div>
          <aside className="tech-panel-glow rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm ring-1 ring-brand-navy/5">
            {hasPublisherSection && (
              <div className="mb-6 space-y-5 border-b border-brand-navy/10 pb-6">
                {(organization || agent) && (
                  <PropertyOrgAgentBlock property={p} kpDispatch={kpDispatch} withContactGate />
                )}

                {p.associatedAgentsLabel && (
                  <div className={organization || agent ? "border-t border-brand-navy/10 pt-4" : ""}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Agentes asociados</p>
                    <p className="mt-1 text-sm leading-snug text-brand-navy/90">{p.associatedAgentsLabel}</p>
                  </div>
                )}

                {!organization && !agent && !p.associatedAgentsLabel && (
                  <p className="text-sm leading-relaxed text-muted">
                    Para consultas sobre la operación, usa el formulario más abajo o{" "}
                    <Link href="/contacto" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
                      escríbenos
                    </Link>
                    .
                  </p>
                )}
              </div>
            )}
            <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gold-deep">
              Datos principales
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-brand-navy/10 pb-2">
                <dt className="text-muted">Superficie</dt>
                <dd className="font-medium text-brand-navy">
                  {p.surfaceM2 != null ? `${p.surfaceM2.toLocaleString("es-CL")} m²` : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-brand-navy/10 pb-2">
                <dt className="text-muted">Dormitorios</dt>
                <dd className="font-medium text-brand-navy">{p.bedrooms ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-brand-navy/10 pb-2">
                <dt className="text-muted">Baños</dt>
                <dd className="font-medium text-brand-navy">{p.bathrooms ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-brand-navy/10 pb-2">
                <dt className="text-muted">Dirección referencial</dt>
                <dd className="max-w-[55%] text-right font-medium text-brand-navy">{p.address ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-brand-navy/10 pb-2">
                <dt className="text-muted">Región</dt>
                <dd className="font-medium text-brand-navy">{p.region ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-8 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gold-deep">
                Consulta sobre esta propiedad
              </h2>
              <p className="text-xs leading-relaxed text-muted">
                Tu mensaje se registra en KiteProp con el ID de la publicación y se despacha a la inmobiliaria y al
                asesor asignado.
              </p>
              <PropertyConsultForm
                propertyId={kpDispatch.propertyId}
                propertyCode={p.referenceCode}
                propertyTitle={p.title}
                assignedUserId={kpDispatch.assignedUserId}
                organizationId={kpDispatch.organizationId}
                assignedUserName={kpDispatch.assignedUserName}
                organizationName={kpDispatch.organizationName}
                pagePath={`/propiedades/${p.id}`}
              />
              {p.sourceUrl && (
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-full border border-brand-navy/20 px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
                >
                  Ver publicación original
                </a>
              )}
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-brand-navy/10 bg-brand-navy-soft/30 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
              Propiedades relacionadas
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Otras alternativas similares que podrían interesarte.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <RelatedPropertyCard key={item.id} property={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
