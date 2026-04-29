import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { getPropertyListingSnapshot } from "@/lib/catalog-read-model/read-model-store";
import { labelForOperation } from "@/lib/operation-labels";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 86400;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getPropertyListingSnapshot();
  const p = snapshot?.items.find((item) => item.id === id || item.slug === id) ?? null;
  if (!p) return { title: "Propiedad" };
  return {
    title: p.title.slice(0, 60),
    description: `${p.propertyTypeLabel} en ${p.city ?? p.region ?? "Chile"}`,
    openGraph: {
      title: p.title,
      description: `${p.propertyTypeLabel} en ${p.city ?? p.region ?? "Chile"}`,
      images: p.mainImageUrl ? [p.mainImageUrl] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = await getPropertyListingSnapshot();
  const p = snapshot?.items.find((item) => item.id === id || item.slug === id) ?? null;
  if (!p) notFound();

  const op = labelForOperation(p.operation);
  const locationLabel = [p.city, p.zone, p.zoneSecondary].filter(Boolean).join(" · ") || "Ubicación a confirmar";
  const imageList = p.mainImageUrl ? [p.mainImageUrl] : [];

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
            {locationLabel}
          </p>
          <p className="mt-4 text-2xl font-semibold text-brand-navy">{p.priceDisplay ?? "Consultar"}</p>
        </header>

        <PropertyGallery images={imageList} title={p.title} />

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-brand-navy">Resumen</h2>
            <div className="prose prose-slate mt-3 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-brand-navy/90">
              {`${p.propertyTypeLabel} en ${locationLabel}. ${
                p.surfaceM2 != null ? `Superficie ${p.surfaceM2.toLocaleString("es-CL")} m². ` : ""
              }${p.bedrooms != null ? `${p.bedrooms} dormitorios. ` : ""}${
                p.bathrooms != null ? `${p.bathrooms} baños.` : ""
              }`}
            </div>
          </div>
          <aside className="tech-panel-glow rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm ring-1 ring-brand-navy/5">
            <div className="mb-6 space-y-3 border-b border-brand-navy/10 pb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gold-deep">Publica</h2>
              <p className="text-sm font-semibold text-brand-navy">{p.partnerName ?? "Redalia"}</p>
              {p.partnerName && (
                <Link
                  href={`/propiedades?socio=${encodeURIComponent(p.partnerName)}`}
                  className="inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                >
                  Ver más de este socio
                </Link>
              )}
            </div>
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
                <dd className="max-w-[55%] text-right font-medium text-brand-navy">{p.address ?? locationLabel}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-brand-navy/10 pb-2">
                <dt className="text-muted">Región</dt>
                <dd className="font-medium text-brand-navy">{p.region ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-8 space-y-3">
              <a
                href={`mailto:${encodeURIComponent(siteConfig.contact.email)}?subject=Consulta%20${encodeURIComponent(p.referenceCode)}`}
                className="flex w-full items-center justify-center rounded-full bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-mid"
              >
                Consultar por esta propiedad
              </a>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
