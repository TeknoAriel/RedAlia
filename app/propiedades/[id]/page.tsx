import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { PartnerContactLinks } from "@/components/socios/PartnerContactLinks";
import { getPropertyById } from "@/lib/get-properties";
import {
  kitePrimaryPartnerRecord,
  kitePrimaryScopedRow,
  partnersRoughlyEqual,
  scopedPartnerKey,
  socioScopeLabelEs,
} from "@/lib/agencies";
import { labelForOperation } from "@/lib/operation-labels";
import { siteConfig } from "@/lib/site-config";

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
  const p = await getPropertyById(id);
  if (!p) notFound();

  const op = labelForOperation(p.operation);
  const primaryRow = kitePrimaryScopedRow(p);
  const primaryFull = kitePrimaryPartnerRecord(p);
  const showAnuncianteExtra = Boolean(
    p.advertiser?.name?.trim() && primaryFull && !partnersRoughlyEqual(p.advertiser, primaryFull),
  );

  const showAgentBlock =
    p.agentAgency?.name?.trim() && !partnersRoughlyEqual(p.agentAgency, p.agency);
  const showSubAgentBlock =
    p.subAgentAgency?.name?.trim() &&
    !partnersRoughlyEqual(p.subAgentAgency, p.agency) &&
    !partnersRoughlyEqual(p.subAgentAgency, p.agentAgency);

  const showMasterBlock =
    Boolean(p.masterAgency?.name?.trim()) &&
    !partnersRoughlyEqual(p.masterAgency, p.agency) &&
    !partnersRoughlyEqual(p.masterAgency, p.agentAgency);

  const hasPublisherSection =
    showMasterBlock ||
    primaryRow ||
    showAgentBlock ||
    showSubAgentBlock ||
    showAnuncianteExtra ||
    Boolean(p.associatedAgentsLabel);

  const primaryScopeLabel =
    primaryRow?.scope === "agency" && p.masterAgency?.name?.trim()
      ? "Inmobiliaria"
      : primaryRow
        ? socioScopeLabelEs[primaryRow.scope]
        : "";

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
          </div>
          <aside className="tech-panel-glow rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm ring-1 ring-brand-navy/5">
            {hasPublisherSection && (
              <div className="mb-6 space-y-5 border-b border-brand-navy/10 pb-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-gold-deep">
                  Agencia y contacto
                </h2>

                {showMasterBlock && p.masterAgency?.name && (
                  <div className="space-y-3">
                    <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
                      Agencia matriz
                    </span>
                    <div className="flex items-start gap-3">
                      {p.masterAgency.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.masterAgency.logoUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-[10px] font-bold text-brand-navy/50">
                          {p.masterAgency.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{p.masterAgency.name}</p>
                        <PartnerContactLinks
                          email={p.masterAgency.email}
                          phone={p.masterAgency.phone}
                          mobile={p.masterAgency.mobile}
                          whatsapp={p.masterAgency.whatsapp}
                          webUrl={p.masterAgency.webUrl}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {primaryRow && (
                  <div
                    className={`space-y-3 ${showMasterBlock ? "border-t border-brand-navy/10 pt-4" : ""}`}
                  >
                    <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
                      {primaryScopeLabel}
                    </span>
                    <div className="flex items-start gap-3">
                      {primaryRow.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryRow.logoUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-xs font-bold text-brand-navy/50">
                          {primaryRow.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{primaryRow.name}</p>
                        <PartnerContactLinks
                          email={primaryRow.email}
                          phone={primaryRow.phone}
                          mobile={primaryRow.mobile}
                          whatsapp={primaryRow.whatsapp}
                          webUrl={primaryRow.webUrl}
                          className="mt-2"
                        />
                        <Link
                          href={`/propiedades?socio=${encodeURIComponent(primaryRow.key)}`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                        >
                          Ver publicaciones de este socio
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {showAgentBlock && p.agentAgency?.name && (
                  <div className="space-y-3 border-t border-brand-navy/10 pt-4">
                    <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
                      {socioScopeLabelEs.agent}
                    </span>
                    <div className="flex items-start gap-3">
                      {p.agentAgency.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.agentAgency.logoUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-[10px] font-bold text-brand-navy/50">
                          {p.agentAgency.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{p.agentAgency.name}</p>
                        <PartnerContactLinks
                          email={p.agentAgency.email}
                          phone={p.agentAgency.phone}
                          mobile={p.agentAgency.mobile}
                          whatsapp={p.agentAgency.whatsapp}
                          webUrl={p.agentAgency.webUrl}
                          className="mt-2"
                        />
                        <Link
                          href={`/propiedades?socio=${encodeURIComponent(
                            scopedPartnerKey("agent", p.agentAgency.id, p.agentAgency.name),
                          )}`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                        >
                          Ver publicaciones del agente
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {showSubAgentBlock && p.subAgentAgency?.name && (
                  <div className="space-y-3 border-t border-brand-navy/10 pt-4">
                    <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
                      {socioScopeLabelEs.sub_agent}
                    </span>
                    <div className="flex items-start gap-3">
                      {p.subAgentAgency.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.subAgentAgency.logoUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-[10px] font-bold text-brand-navy/50">
                          {p.subAgentAgency.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{p.subAgentAgency.name}</p>
                        <PartnerContactLinks
                          email={p.subAgentAgency.email}
                          phone={p.subAgentAgency.phone}
                          mobile={p.subAgentAgency.mobile}
                          whatsapp={p.subAgentAgency.whatsapp}
                          webUrl={p.subAgentAgency.webUrl}
                          className="mt-2"
                        />
                        <Link
                          href={`/propiedades?socio=${encodeURIComponent(
                            scopedPartnerKey("sub_agent", p.subAgentAgency.id, p.subAgentAgency.name),
                          )}`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                        >
                          Ver publicaciones del subagente
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {showAnuncianteExtra && p.advertiser?.name && (
                  <div className="flex items-start gap-3 border-t border-brand-navy/10 pt-4">
                    {p.advertiser.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.advertiser.logoUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-[10px] font-bold text-brand-navy/50">
                        {p.advertiser.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Anunciante</p>
                      <p className="text-sm font-semibold text-brand-navy">{p.advertiser.name}</p>
                      <PartnerContactLinks
                        email={p.advertiser.email}
                        phone={p.advertiser.phone}
                        mobile={p.advertiser.mobile}
                        whatsapp={p.advertiser.whatsapp}
                        webUrl={p.advertiser.webUrl}
                        className="mt-2"
                      />
                      <Link
                        href={`/propiedades?socio=${encodeURIComponent(
                          scopedPartnerKey("advertiser", p.advertiser.id, p.advertiser.name),
                        )}`}
                        className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                      >
                        Ver publicaciones del anunciante
                      </Link>
                    </div>
                  </div>
                )}

                {p.associatedAgentsLabel && (
                  <div className="border-t border-brand-navy/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Agentes asociados</p>
                    <p className="mt-1 text-sm leading-snug text-brand-navy/90">{p.associatedAgentsLabel}</p>
                  </div>
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
              <a
                href={`mailto:${siteConfig.contact.email}?subject=Consulta%20${encodeURIComponent(p.referenceCode)}`}
                className="flex w-full items-center justify-center rounded-full bg-brand-navy px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy-mid"
              >
                Consultar por esta propiedad
              </a>
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
    </div>
  );
}
