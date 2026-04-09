import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { extractPartnerAgencies } from "@/lib/agencies";
import { getProperties } from "@/lib/get-properties";

export const metadata: Metadata = {
  title: "Miembros y socios",
  description:
    "Corredoras y agencias de la red Redalia, unificadas desde agency, anunciante, agent y sub_agent del feed KiteProp.",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function SociosPage() {
  const result = await getProperties();
  const partners = result.ok ? extractPartnerAgencies(result.properties) : [];

  return (
    <div className="bg-background">
      <section className="border-b border-brand-navy/10 bg-brand-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Redalia</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Miembros y socios
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/88">
            Listado de corredoras que aparecen en el catálogo. En KiteProp suele verse como{" "}
            <strong className="font-semibold text-white">agencia</strong>; en el JSON también pueden venir como{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">anunciante</code>,{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">agent</code> o{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">sub_agent</code>: los unificamos para que
            coincidan con la ficha de cada propiedad.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <SectionHeader
          title="Qué significa ser socio"
          description="Ser miembro implica acceder a una estructura de alto valor: circulación de oferta con foco en resultados reales, criterios de difusión y herramientas alineadas a la plataforma líder en Latinoamérica para el sector inmobiliario."
        />
        <div className="prose prose-slate mt-8 max-w-none text-muted">
          <p>
            Redalia es la red líder en tecnología y resultados reales para quienes ejecutan en terreno. Las fichas
            muestran la misma corredora que ves acá, en línea con{" "}
            <strong className="text-brand-navy">KiteProp</strong>.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-[linear-gradient(180deg,#f1f5f9_0%,#fff_45%,#f8fafc_100%)] py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Corredoras en el feed"
            title="Empresas anunciantes"
            description={
              result.ok && partners.length > 0
                ? "Nombre y logo según el JSON de difusión. Desde cada tarjeta podés abrir solo las publicaciones de esa corredora."
                : "Cuando el feed traiga agency, anunciante, agent o sub_agent con nombre, aparecerán automáticamente en esta grilla."
            }
          />

          {!result.ok && (
            <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted">
              No se pudieron cargar propiedades ({result.error}). Revisá la URL del feed o el JSON de muestra.
            </p>
          )}

          {result.ok && partners.length === 0 && (
            <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted">
              Aún no hay corredoras identificables en el catálogo. Verificá que cada ítem traiga al menos uno de:{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">agency</code>,{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">advertiser</code> /{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">anunciante</code>,{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">agent</code> o{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">sub_agent</code>.
            </p>
          )}

          {partners.length > 0 && (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {partners.map((p) => (
                <li
                  key={p.key}
                  className="flex flex-col rounded-2xl border border-brand-navy/10 bg-white p-5 text-center shadow-sm tech-panel-glow transition hover:border-brand-gold/30"
                >
                  <div className="mx-auto flex h-[4.5rem] w-full max-w-[7rem] items-center justify-center overflow-hidden rounded-xl border border-brand-navy/10 bg-white">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoUrl}
                        alt=""
                        className="h-full w-full object-contain p-2"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-lg font-bold tracking-tight text-brand-navy/45" aria-hidden>
                        {initials(p.name)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 min-h-[2.75rem] text-sm font-semibold leading-snug text-brand-navy sm:text-base">
                    {p.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted">
                    {p.propertyCount}{" "}
                    {p.propertyCount === 1 ? "publicación" : "publicaciones"}
                  </p>
                  <Link
                    href={`/propiedades?socio=${encodeURIComponent(p.key)}`}
                    className="mt-4 inline-flex items-center justify-center text-sm font-semibold text-brand-navy-mid underline-offset-2 transition hover:text-brand-gold-deep hover:underline"
                  >
                    Ver propiedades
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-18">
        <CTASection
          title="¿Te interesa sumarte como socio?"
          description="Conversemos sobre tu corredora u operación y cómo encaja en la red líder en tecnología y resultados reales, en línea con KiteProp."
          primaryHref="/unete"
          primaryLabel="Completar postulación"
          secondaryHref="/contacto"
          secondaryLabel="Contacto directo"
        />
      </section>
    </div>
  );
}
