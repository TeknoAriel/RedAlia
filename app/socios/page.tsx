import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { PartnerDirectoryCard } from "@/components/public-directory/PartnerDirectoryCard";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { getProperties } from "@/lib/get-properties";
import { buildPublicDirectorySnapshot } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Socios",
  description:
    "Directorio institucional de la comunidad Redalia: socios con publicaciones en el catálogo, criterios de pertenencia y colaboración profesional en Chile.",
};

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
    text: "Canje y referencias de propiedades se apoyan en criterios de la comunidad y en el trabajo directo entre corredores.",
  },
  {
    title: "Pertenencia con prestigio",
    text: "Formar parte de Redalia comunica que tu operación se mueve en un circuito serio, actual y orientado a resultados.",
  },
];

export default async function SociosPage() {
  const result = await getProperties();
  const snapshot = result.ok ? buildPublicDirectorySnapshot(result.properties, { featuredMax: 8 }) : null;
  const entries = snapshot?.entries ?? [];
  const stats = snapshot?.stats;
  const listingCount = stats?.totalListings ?? 0;
  const geoCount = stats?.geographicDistinctCount ?? 0;

  return (
    <div className="bg-background">
      <PageHero
        variant="navy-solid"
        eyebrow="Socios"
        title="Socios de la comunidad inmobiliaria"
        lead="Corredoras, oficinas y anunciantes con publicaciones en el catálogo público. Cada ficha refleja presencia verificable en la comunidad: podés abrir el perfil institucional o ir al listado filtrado. El ingreso formal se coordina con el equipo comercial."
      >
        {result.ok && listingCount > 0 ? (
          <div className="flex flex-wrap gap-4 border-t border-white/15 pt-8">
            <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
              <p className="text-2xl font-bold tracking-tight text-brand-gold">
                {listingCount.toLocaleString("es-CL")}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                {listingCount === 1 ? "Publicación en catálogo" : "Publicaciones en catálogo"}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
              <p className="text-2xl font-bold tracking-tight text-brand-gold">{entries.length}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                {entries.length === 1
                  ? "Inmobiliaria o anunciante listado"
                  : "Inmobiliarias y anunciantes listados"}
              </p>
            </div>
            {geoCount > 0 && (
              <div className="rounded-xl border border-white/20 bg-white/[0.07] px-5 py-4">
                <p className="text-2xl font-bold tracking-tight text-brand-gold">{geoCount}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
                  Ubicaciones distintas en fichas
                </p>
              </div>
            )}
          </div>
        ) : null}
      </PageHero>

      <section className="strip-navy border-b border-white/10 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="redalia-eyebrow redalia-eyebrow--onNavy mx-auto max-w-xl text-center !mb-0">
            Marco de pertenencia
          </p>
          <h2 className="redalia-h2-band mx-auto mt-3 max-w-3xl text-center">
            Por qué importa ser socio de Redalia
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
            No es solo aparecer en un listado: es formar parte de una comunidad que cierra negocios con estándares,
            transparencia y visibilidad profesional entre pares.
          </p>
          <ul className="mt-10 grid gap-6 text-left sm:grid-cols-2">
            {estandares.map((e) => (
              <li
                key={e.title}
                className="rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-6 backdrop-blur-sm"
              >
                <div className="redalia-card-accent" />
                <h3 className="text-base font-semibold text-white">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/78">{e.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <SectionHeader
          title="Perfiles que conviven en la comunidad"
          description="Diferentes escalas, mismo estándar de seriedad comercial y disposición a colaborar con criterio y honestidad."
          titleVariant="display"
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {perfilCards.map((c) => (
            <li
              key={c.title}
              className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm"
            >
              <div className="redalia-card-accent" />
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
            Membresía
          </Link>
          .
        </p>
      </section>

      <section className="border-y border-brand-navy/10 bg-[linear-gradient(180deg,#f1f5f9_0%,#fff_45%,#f8fafc_100%)] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Directorio"
            title="Socios con presencia en el catálogo"
            description="Listado derivado de publicaciones activas: orden por actividad, sin duplicar marcas y excluyendo la capa matriz del feed cuando corresponde. Los contactos son los publicados en cada ficha —transparencia frente al mercado."
            titleVariant="display"
          />

          {stats && stats.geographicPresenceLabels.length > 0 && (
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-muted">
              <span className="font-semibold text-brand-navy">Presencia geográfica en fichas del catálogo:</span>{" "}
              {stats.geographicPresenceLabels.join(" · ")}
            </p>
          )}

          {!result.ok && (
            <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-brand-navy/15 bg-white px-6 py-8 text-center shadow-sm">
              <p className="font-medium text-brand-navy">Directorio no disponible por ahora</p>
              <p className="mt-2 text-sm text-muted">
                Volvé a intentar más tarde o escribinos y te orientamos sobre socios y publicaciones.
              </p>
              <Link
                href="/contacto"
                className="mt-5 inline-flex rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy-mid"
              >
                Coordinar conversación comercial
              </Link>
            </div>
          )}

          {result.ok && entries.length === 0 && (
            <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-lg">
              <div className="border-b border-brand-navy/10 bg-brand-navy px-6 py-4 text-center text-white">
                <p className="redalia-eyebrow redalia-eyebrow--onNavy !mb-0 text-center">Directorio</p>
                <p className="mt-1 text-sm text-white/85">Sin entradas que cumplan los criterios actuales</p>
              </div>
              <div className="px-8 py-12 text-center">
                <p className="text-lg font-semibold text-brand-navy">Tu marca en un espacio de alto estándar</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Cuando haya publicaciones que asocien inmobiliarias o anunciantes según las reglas de la red, aparecerán
                  acá automáticamente. Mientras tanto podés explorar el catálogo o conversar con el equipo.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/contacto" className="btn-redalia-gold-solid min-w-[200px]">
                    Coordinar conversación comercial
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

          {entries.length > 0 && (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {entries.map((entry) => (
                <li key={entry.partnerKey}>
                  <PartnerDirectoryCard entry={entry} variant="default" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <CTASection
          title="¿Querés sumar tu corredora al directorio y a la comunidad?"
          description="Coordinamos una reunión para revisar admisión, visibilidad y plan de membresía —sin compromiso y con claridad."
          primaryHref="/contacto"
          primaryLabel="Coordinar conversación comercial"
          secondaryHref="/unete"
          secondaryLabel="Postular como socio"
          footnote="Si ya operás con la comunidad, el equipo te indicará los pasos para visibilidad pública cuando corresponda."
        />
      </section>
    </div>
  );
}
