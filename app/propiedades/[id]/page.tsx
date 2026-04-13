import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { PartnerContactLinks } from "@/components/socios/PartnerContactLinks";
import { getPropertyById } from "@/lib/get-properties";
import { propertyFichaConsultarRow, scopedPartnerKey, socioScopeLabelEs } from "@/lib/agencies";
import {
  partnerMatchesStaticMatrizAliases,
  partnerShouldHideFromPublicaBlock,
} from "@/lib/master-agency";
import type { NormalizedProperty, PropertyPartner } from "@/types/property";
import { labelForOperation } from "@/lib/operation-labels";
import { siteConfig } from "@/lib/site-config";

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

function consultarLinkLabel(scope: string): string {
  if (scope === "agent") return "Ver publicaciones del agente";
  if (scope === "advertiser") return "Ver publicaciones del anunciante";
  if (scope === "agency") return "Ver propiedades de esta agencia";
  return "Ver publicaciones de este contacto";
}

/** Anunciante del JSON o, si no viene, agente de la publicación (`listing_agent` / `agent`). */
function fichaPublicaPartner(p: NormalizedProperty): {
  scope: "advertiser" | "agent";
  row: PropertyPartner & { name: string };
  chip: string;
} | null {
  const adv = p.advertiser;
  if (adv?.name?.trim() && !partnerShouldHideFromPublicaBlock(adv, p)) {
    return {
      scope: "advertiser",
      row: { ...adv, name: adv.name.trim() },
      chip: "Anunciante",
    };
  }
  const ag = p.agentAgency;
  if (ag?.name?.trim() && !partnerShouldHideFromPublicaBlock(ag, p)) {
    return {
      scope: "agent",
      row: { ...ag, name: ag.name.trim() },
      chip: "Agente de la publicación",
    };
  }
  return null;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const p = await getPropertyById(id);
  if (!p) notFound();

  const op = labelForOperation(p.operation);
  const consultar = propertyFichaConsultarRow(p);
  const publica = fichaPublicaPartner(p);
  const showInmobiliaria = Boolean(
    p.agency?.name?.trim() && !partnerMatchesStaticMatrizAliases(p.agency),
  );
  const showConsultarBlock = Boolean(
    consultar &&
      !(
        (consultar.scope === "advertiser" && publica?.scope === "advertiser") ||
        (consultar.scope === "agent" && publica?.scope === "agent")
      ),
  );
  const showPublisherEmpty =
    !showInmobiliaria && !publica && !showConsultarBlock && !p.associatedAgentsLabel;
  const hasPublisherSection =
    showInmobiliaria ||
    Boolean(publica) ||
    showConsultarBlock ||
    Boolean(p.associatedAgentsLabel) ||
    showPublisherEmpty;
  const consultMailto =
    consultar?.email?.trim() ??
    (showInmobiliaria ? p.agency?.email?.trim() : undefined) ??
    (publica ? publica.row.email?.trim() : undefined) ??
    siteConfig.contact.email;

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

                {showInmobiliaria && p.agency?.name && (
                  <div className="space-y-3">
                    <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
                      Inmobiliaria
                    </span>
                    <div className="flex items-start gap-3">
                      {p.agency.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.agency.logoUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-xs font-bold text-brand-navy/50">
                          {p.agency.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{p.agency.name}</p>
                        <Link
                          href={`/propiedades?socio=${encodeURIComponent(
                            scopedPartnerKey("agency", p.agency.id, p.agency.name),
                          )}`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                        >
                          Ver propiedades de esta agencia
                        </Link>
                        <PartnerContactLinks
                          email={p.agency.email}
                          phone={p.agency.phone}
                          mobile={p.agency.mobile}
                          whatsapp={p.agency.whatsapp}
                          webUrl={p.agency.webUrl}
                          className="mt-3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {publica && (
                  <div
                    className={`space-y-3 ${showInmobiliaria ? "border-t border-brand-navy/10 pt-4" : ""}`}
                  >
                    <span className="inline-block rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/80">
                      {publica.chip}
                    </span>
                    <div className="flex items-start gap-3">
                      {publica.row.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={publica.row.logoUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-xs font-bold text-brand-navy/50">
                          {publica.row.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{publica.row.name}</p>
                        <Link
                          href={`/propiedades?socio=${encodeURIComponent(
                            scopedPartnerKey(publica.scope, publica.row.id, publica.row.name),
                          )}`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                        >
                          {publica.scope === "advertiser"
                            ? "Ver publicaciones de este anunciante"
                            : "Ver publicaciones de este agente"}
                        </Link>
                        <PartnerContactLinks
                          email={publica.row.email}
                          phone={publica.row.phone}
                          mobile={publica.row.mobile}
                          whatsapp={publica.row.whatsapp}
                          webUrl={publica.row.webUrl}
                          className="mt-3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {showConsultarBlock && consultar && (
                  <div
                    className={`space-y-3 ${showInmobiliaria || publica ? "border-t border-brand-navy/10 pt-4" : ""}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-block rounded-full bg-brand-gold/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy">
                        Consultar
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
                        {socioScopeLabelEs[consultar.scope]}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      {consultar.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={consultar.logoUrl}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg border border-brand-navy/10 object-contain p-0.5"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-navy-soft text-[10px] font-bold text-brand-navy/50">
                          {consultar.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-navy">{consultar.name}</p>
                        <PartnerContactLinks
                          email={consultar.email}
                          phone={consultar.phone}
                          mobile={consultar.mobile}
                          whatsapp={consultar.whatsapp}
                          webUrl={consultar.webUrl}
                          className="mt-2"
                        />
                        <Link
                          href={`/propiedades?socio=${encodeURIComponent(consultar.key)}`}
                          className="mt-2 inline-block text-xs font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
                        >
                          {consultarLinkLabel(consultar.scope)}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {p.associatedAgentsLabel && (
                  <div className="border-t border-brand-navy/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Agentes asociados</p>
                    <p className="mt-1 text-sm leading-snug text-brand-navy/90">{p.associatedAgentsLabel}</p>
                  </div>
                )}

                {showPublisherEmpty && (
                  <p className="text-sm leading-relaxed text-muted">
                    No hay datos de inmobiliaria ni de anunciante en los campos que leemos del JSON (agency,
                    advertiser, agent, etc.). Si en tu feed usan otros nombres, conviene ampliar el adaptador en{" "}
                    <code className="rounded bg-brand-navy-soft px-1 text-xs">lib/kiteprop-adapter.ts</code>.
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
              <a
                href={`mailto:${encodeURIComponent(consultMailto)}?subject=Consulta%20${encodeURIComponent(p.referenceCode)}`}
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
