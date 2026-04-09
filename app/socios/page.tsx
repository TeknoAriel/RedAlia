import type { Metadata } from "next";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { extractPartnerAgencies } from "@/lib/agencies";
import { getProperties } from "@/lib/get-properties";

export const metadata: Metadata = {
  title: "Socios",
  description:
    "Socios de Redalia: agencias y corredoras conectadas por datos reales, alineadas a la plataforma líder en tecnología inmobiliaria en Latinoamérica, KiteProp.",
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Socios</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Profesionales y agencias unidos en torno a resultados reales
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/88">
            Los socios aparecen desde el objeto <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">agency</code> del
            feed JSON: nombre, identificador y logo cuando el origen lo publica. Buscamos, con criterio comercial,{" "}
            <strong className="font-semibold text-white">mejores resultados reales</strong> en cada publicación. La
            operación se apoya en <strong className="font-semibold text-white">KiteProp</strong>, referente
            tecnológico en la región.
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
            Redalia es la red líder en tecnología y resultados reales para quienes ejecutan en terreno: menos ruido,
            más gestión. El catálogo y los logos de agencia se integran de forma transparente con el ecosistema{" "}
            <strong className="text-brand-navy">KiteProp</strong>.
          </p>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-14 sm:py-18">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Agencias en el feed"
            title="Red de socios"
            description={
              result.ok && partners.length > 0
                ? "Agrupamos por agencia según las propiedades visibles en tu JSON de difusión. El logo se muestra cuando viene en el feed."
                : "Cuando el feed incluya el bloque agency en cada publicación, aquí verás automáticamente nombre, logo y volumen de fichas."
            }
          />

          {!result.ok && (
            <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted">
              No se pudieron cargar propiedades ({result.error}). Revisá la URL del feed o el JSON de muestra.
            </p>
          )}

          {result.ok && partners.length === 0 && (
            <p className="mx-auto mt-10 max-w-xl text-center text-sm text-muted">
              Aún no hay agencias con nombre en el catálogo actual. Verificá que cada ítem traiga{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">agency</code> con al menos{" "}
              <code className="rounded bg-brand-navy-soft px-1 text-xs">name</code> o <code className="rounded bg-brand-navy-soft px-1 text-xs">id</code>.
            </p>
          )}

          {partners.length > 0 && (
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map((p) => (
                <li
                  key={p.key}
                  className="flex flex-col rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/35 p-6 text-center shadow-sm tech-panel-glow"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-brand-navy/10 bg-white">
                    {p.logoUrl ? (
                      // Logos vienen de distintos hosts del feed; <img> evita acoplar remotePatterns por cada CDN.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.logoUrl}
                        alt=""
                        className="h-full w-full object-contain p-1"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-lg font-bold tracking-tight text-brand-navy/45" aria-hidden>
                        {initials(p.name)}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-brand-navy">{p.name}</h3>
                  <p className="mt-2 text-sm text-muted">
                    {p.propertyCount}{" "}
                    {p.propertyCount === 1 ? "publicación" : "publicaciones"} en el catálogo actual
                  </p>
                  <span className="mt-3 inline-flex justify-center rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-navy/10">
                    Socio / agencia
                  </span>
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
