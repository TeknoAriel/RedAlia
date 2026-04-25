import Link from "next/link";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PartnerContactPrivacyGate } from "@/components/socios/PartnerContactPrivacyGate";
import type { PublicPartnerDetail } from "@/lib/public-data/types";
import type { NormalizedProperty } from "@/types/property";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Props = {
  detail: PublicPartnerDetail;
  propertiesPreview: NormalizedProperty[];
  totalPropertyCount: number;
};

export function PartnerProfileView({ detail, propertiesPreview, totalPropertyCount }: Props) {
  const listingHref = `/propiedades?socio=${encodeURIComponent(detail.partnerKey)}`;

  return (
    <div className="bg-background">
      <section className="border-b border-brand-navy/10 bg-gradient-to-b from-brand-navy-soft/90 to-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <nav className="text-xs font-medium text-muted">
            <Link href="/socios" className="text-brand-gold-deep hover:underline">
              Directorio de socios
            </Link>
            <span className="mx-2 text-brand-navy/35" aria-hidden>
              /
            </span>
            <span className="text-brand-navy">{detail.displayName}</span>
          </nav>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            <div className="flex shrink-0 justify-center lg:justify-start">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm sm:h-32 sm:w-32">
                {detail.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.logoUrl}
                    alt={detail.displayName}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <span className="text-2xl font-bold tracking-tight text-brand-navy/40" aria-hidden>
                    {initials(detail.displayName)}
                  </span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">
                {detail.roleLabel} · Redalia
              </p>
              <h1 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight text-brand-navy sm:text-4xl">
                {detail.displayName}
              </h1>
              <dl className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6 lg:justify-start">
                <div className="rounded-xl border border-brand-navy/10 bg-white px-5 py-3 text-center shadow-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/55">
                    Publicaciones en catálogo
                  </dt>
                  <dd className="mt-1 text-xl font-bold tabular-nums text-brand-navy">
                    {totalPropertyCount.toLocaleString("es-CL")}
                  </dd>
                </div>
                {detail.coverageLabels.length > 0 && (
                  <div className="min-w-0 max-w-md rounded-xl border border-brand-navy/10 bg-white px-5 py-3 text-left shadow-sm">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/55">
                      Cobertura en fichas
                    </dt>
                    <dd className="mt-1 text-sm leading-snug text-brand-navy">{detail.coverageLabels.join(" · ")}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <h2 className="text-lg font-semibold text-brand-navy">{detail.institutionalBlock.title}</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
              {detail.institutionalBlock.lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
          <aside className="lg:col-span-5">
            <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy">Contacto público</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Datos publicados en las fichas del listado. Si no figura un canal, podés consultar por el catálogo
                filtrado o escribir a Redalia.
              </p>
              <div className="mt-4">
                <PartnerContactPrivacyGate
                  partnerKey={detail.partnerKey}
                  partnerName={detail.displayName}
                  email={detail.email}
                  phone={detail.phone}
                  mobile={detail.mobile}
                  whatsapp={detail.whatsapp}
                  webUrl={detail.webUrl}
                  className="space-y-2 text-sm"
                />
                {!detail.email &&
                  !detail.phone &&
                  !detail.mobile &&
                  !detail.whatsapp &&
                  !detail.webUrl && (
                    <p className="text-sm text-muted">No hay contacto público en las fichas asociadas por ahora.</p>
                  )}
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-brand-navy/10 pt-6">
                <Link
                  href={listingHref}
                  className="inline-flex items-center justify-center rounded-full bg-brand-navy px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-navy-mid"
                >
                  {detail.listingCtaLabel}
                </Link>
                <Link
                  href="/socios"
                  className="inline-flex items-center justify-center rounded-full border border-brand-navy/20 px-5 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
                >
                  Volver al directorio
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-brand-navy/10 bg-brand-navy-soft/30 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">Publicaciones asociadas</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Una selección reciente del catálogo. El listado completo respeta el mismo filtro por socio.
              </p>
            </div>
            <Link
              href={listingHref}
              className="shrink-0 text-sm font-semibold text-brand-gold-deep underline-offset-2 hover:underline"
            >
              Abrir todas en propiedades →
            </Link>
          </div>

          {propertiesPreview.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-brand-navy/10 bg-white px-6 py-12 text-center text-sm text-muted">
              No hay publicaciones visibles asociadas a esta marca en el catálogo cargado. Podés volver más tarde o
              revisar el listado general.
            </div>
          ) : (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {propertiesPreview.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
