import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { sociosCardRoleLabelEs, sociosGridLinkLabel } from "@/lib/agencies";
import { PartnerContactLinks } from "@/components/socios/PartnerContactLinks";
import { getProperties } from "@/lib/get-properties";
import { buildPublicPartnerDirectoryFromFeed } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Socios",
  description:
    "Pertenencia a Redalia: criterios de admisión, visibilidad profesional y colaboración seria entre corredoras y agentes en Chile.",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const perfilCards = [
  {
    title: "Corredoras y estudios",
    text: "Equipos que buscan ampliar canales de difusión, ordenar la colaboración entre oficinas y acceder a oportunidades fuera de su cartera inmediata.",
  },
  {
    title: "Agentes y ejecutivos",
    text: "Profesionales que necesitan más stock para ofrecer, respaldo institucional y una red seria con la que coordinar visitas y cierres.",
  },
  {
    title: "Operaciones con varias marcas",
    text: "Estructuras que valoran la independencia comercial y, a la vez, un marco común para canje, estándares y formación.",
  },
];

const estandares = [
  {
    title: "Admisión conversada",
    text: "El ingreso implica alinear perfil comercial, zona y expectativas con el equipo de Redalia —no es un alta automática masiva.",
  },
  {
    title: "Visibilidad profesional",
    text: "Los socios exponen marca y contacto en un directorio pensado para generar negocio entre pares, no para exposición superficial.",
  },
  {
    title: "Colaboración con trazabilidad",
    text: "Canje y referencias de propiedades se apoyan en criterios de la red y en el trabajo directo entre corredores.",
  },
  {
    title: "Pertenencia con prestigio",
    text: "Formar parte de Redalia comunica que tu operación se mueve en un circuito serio, actual y orientado a resultados.",
  },
];

export default async function SociosPage() {
  const result = await getProperties();
  const partners = result.ok ? buildPublicPartnerDirectoryFromFeed(result.properties) : [];
  const listingCount = result.ok ? result.properties.length : 0;

  return (
    <div className="bg-background">
      <PageHero
        variant="navy-solid"
        eyebrow="Pertenencia · Redalia"
        title="Socios: prestigio de pertenencia y colaboración seria"
        lead="La red agrupa corredoras y agentes que trabajan con reglas claras de canje y cooperación. Acá encontrás marcas y contactos vinculados a las publicaciones activas —y el marco de valor que respalda cada incorporación."
      >
        {result.ok && listingCount > 0 ? (
          <div className="flex flex-wrap gap-4 border-t border-white/15 pt-8">
            <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
              <p className="text-2xl font-bold tracking-tight text-brand-gold">
                {listingCount.toLocaleString("es-CL")}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                {listingCount === 1 ? "Oportunidad en catálogo" : "Oportunidades en catálogo"}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
              <p className="text-2xl font-bold tracking-tight text-brand-gold">{partners.length}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                {partners.length === 1 ? "Socio en directorio" : "Socios en directorio"}
              </p>
            </div>
          </div>
        ) : null}
      </PageHero>

      <section className="strip-navy border-b border-white/10 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Marco de pertenencia</p>
          <h2 className="mx-auto mt-2 max-w-3xl text-2xl font-bold tracking-tight sm:text-3xl">
            Por qué importa ser socio de Redalia
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            No es solo aparecer en un listado: es acceder a una comunidad que negocia junta, con estándares y
            visibilidad profesional.
          </p>
          <ul className="mt-10 grid gap-6 text-left sm:grid-cols-2">
            {estandares.map((e) => (
              <li
                key={e.title}
                className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 backdrop-blur-sm"
              >
                <div className="mb-3 h-1 w-10 rounded-full bg-brand-gold" />
                <h3 className="text-base font-semibold text-white">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/78">{e.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <SectionHeader
          title="Perfiles que conviven en la red"
          description="Diferentes escalas, mismo estándar de seriedad comercial y disposición a colaborar con criterio."
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {perfilCards.map((c) => (
            <li
              key={c.title}
              className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-deep" />
              <h3 className="text-base font-semibold text-brand-navy">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted">
          El ingreso se coordina con el equipo de Redalia. Si querés el detalle del proceso comercial, visitá{" "}
          <Link href="/unete" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
            Únete
          </Link>{" "}
          o{" "}
          <Link href="/planes" className="font-medium text-brand-gold-deep underline-offset-2 hover:underline">
            Planes
          </Link>
          .
        </p>
      </section>

      <section className="border-y border-brand-navy/10 bg-[linear-gradient(180deg,#f1f5f9_0%,#fff_45%,#f8fafc_100%)] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Directorio"
            title="Inmobiliarias y anunciantes"
            description="Fichas vinculadas a publicaciones activas: contacto, marca y acceso directo al catálogo filtrado por socio."
          />

          {!result.ok && (
            <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-brand-navy/15 bg-white px-6 py-8 text-center shadow-sm">
              <p className="font-medium text-brand-navy">Directorio no disponible por ahora</p>
              <p className="mt-2 text-sm text-muted">
                Volvé a intentar más tarde o escribinos y te orientamos sobre socios y publicaciones.
              </p>
              <Link
                href="/contacto"
                className="mt-5 inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-navy-mid"
              >
                Contacto
              </Link>
            </div>
          )}

          {result.ok && partners.length === 0 && (
            <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-lg">
              <div className="border-b border-brand-navy/10 bg-brand-navy px-6 py-4 text-center text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Directorio</p>
                <p className="mt-1 text-sm text-white/85">Categoría institucional en actualización</p>
              </div>
              <div className="px-8 py-12 text-center">
                <p className="text-lg font-semibold text-brand-navy">Tu marca en un espacio de alto estándar</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Las fichas públicas de socios se publican cuando la operación y los datos lo permiten. Mientras tanto,
                  la red sigue activa en colaboración y catálogo: podés explorar oportunidades y conversar con el equipo
                  para anticipar tu incorporación al directorio.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/contacto"
                    className="inline-flex rounded-full bg-brand-gold px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-[#d4b82e]"
                  >
                    Reservar lugar en la red
                  </Link>
                  <Link
                    href="/propiedades"
                    className="inline-flex rounded-full border border-brand-navy/20 px-6 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-navy-soft"
                  >
                    Ver catálogo
                  </Link>
                </div>
              </div>
            </div>
          )}

          {partners.length > 0 && (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {partners.map((p) => (
                <li
                  key={p.partnerKey}
                  className="card-elevated flex flex-col rounded-2xl border border-brand-navy/10 bg-white p-5 text-center transition hover:border-brand-gold/35"
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
                        {initials(p.displayName)}
                      </span>
                    )}
                  </div>
                  <span className="mt-3 inline-flex rounded-full bg-brand-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-navy/75">
                    {sociosCardRoleLabelEs[p.scope]}
                  </span>
                  <h3 className="mt-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-brand-navy sm:text-base">
                    {p.displayName}
                  </h3>
                  <p className="mt-2 text-xs text-muted">
                    {p.propertyCount} {p.propertyCount === 1 ? "publicación" : "publicaciones"}
                  </p>
                  {p.coverageLabels.length > 0 && (
                    <p className="mt-1.5 text-[11px] leading-snug text-muted">
                      Cobertura en catálogo: {p.coverageLabels.join(" · ")}
                    </p>
                  )}
                  <PartnerContactLinks
                    email={p.email}
                    phone={p.phone}
                    mobile={p.mobile}
                    whatsapp={p.whatsapp}
                    webUrl={p.webUrl}
                    className="mt-3 border-t border-brand-navy/10 pt-3"
                  />
                  <Link
                    href={`/propiedades?socio=${encodeURIComponent(p.partnerKey)}`}
                    className="mt-4 inline-flex items-center justify-center text-sm font-semibold text-brand-navy-mid underline-offset-2 transition hover:text-brand-gold-deep hover:underline"
                  >
                    {sociosGridLinkLabel(p.scope)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <CTASection
          title="¿Querés sumar tu corredora al directorio y a la colaboración?"
          description="Coordinamos una reunión para revisar admisión, visibilidad y plan de participación —sin compromiso."
          primaryHref="/contacto"
          primaryLabel="Hablar con el equipo"
          secondaryHref="/unete"
          secondaryLabel="Enviar postulación"
          footnote="Si ya operás con la red, el equipo te indicará los pasos para visibilidad pública cuando corresponda."
        />
      </section>
    </div>
  );
}
