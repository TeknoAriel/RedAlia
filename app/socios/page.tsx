import type { Metadata } from "next";
import Link from "next/link";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { PageHero } from "@/components/layout/PageHero";
import { PartnerDirectoryCard } from "@/components/public-directory/PartnerDirectoryCard";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { getPartnerDirectorySnapshot } from "@/lib/catalog-read-model/read-model-store";
import { getSociosPageSize } from "@/lib/public-data/socios-config";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Socios",
  description:
    "Directorio institucional de la comunidad Redalia: socios con publicaciones en el catálogo, criterios de pertenencia y colaboración profesional en Chile.",
};

const perfilCards = [
  {
    title: "Corredoras y estudios",
    text: "Equipos que amplían canales con criterio, ordenan la colaboración entre oficinas y acceden a oportunidades fuera de la cartera inmediata, sin perder su marca.",
  },
  {
    title: "Agentes y ejecutivos",
    text: "Profesionales con más stock para ofrecer, respaldo institucional y una red seria para coordinar visitas y cierres con transparencia frente al cliente.",
  },
  {
    title: "Operaciones con varias marcas",
    text: "Estructuras que valoran la independencia comercial y, al mismo tiempo, un marco común de canje, estándares y capacitación continua.",
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

export default async function SociosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const parsedPage = rawPage ? parseInt(rawPage, 10) : 1;
  const snapshot = await getPartnerDirectorySnapshot();
  const entries = snapshot?.entries ?? [];
  const SOCIOS_PAGE_SIZE = getSociosPageSize();
  const totalPages = Math.max(1, Math.ceil(entries.length / SOCIOS_PAGE_SIZE));
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, totalPages) : 1;
  const pageStart = (safePage - 1) * SOCIOS_PAGE_SIZE;
  const pagedEntries = entries.slice(pageStart, pageStart + SOCIOS_PAGE_SIZE);
  const stats = snapshot?.stats;
  const listingCount = stats?.totalListings ?? 0;
  const geoCount = stats?.geographicDistinctCount ?? 0;
  const pageHref = (page: number): string => (page <= 1 ? "/socios" : `/socios?page=${page}`);

  return (
    <div className="bg-background">
      <PageHero
        variant="navy-solid"
        prepend={<SectionLogoMark size="sm" className="mb-5 opacity-95" />}
        eyebrow="Socios"
        title="Comunidad con presencia verificable en Chile"
        lead="Corredoras, oficinas y anunciantes que hoy publican en el catálogo público. Cada ficha refleja operación real en la red: perfil institucional y acceso al listado filtrado. El ingreso formal siempre se conversa con el equipo comercial."
        footnote="Los datos del directorio se derivan de publicaciones activas y criterios de visibilidad de la comunidad —sin exposición superficial."
        contentClassName="py-20 sm:py-24"
      >
        {listingCount > 0 ? (
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
                  ? "Corredora o anunciante listado"
                  : "Corredoras y anunciantes listados"}
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
                <h3 className="font-display text-base font-semibold text-white">{e.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/78">{e.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeader
          eyebrow="Perfiles"
          title="Quiénes conviven en la comunidad"
          description="Distintas escalas, mismo estándar de seriedad comercial y disposición a colaborar con criterio y rigor frente al mercado."
          titleVariant="display"
        />
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {perfilCards.map((c) => (
            <li
              key={c.title}
              className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-6 shadow-sm"
            >
              <div className="redalia-card-accent" />
              <h3 className="font-display text-base font-semibold text-brand-navy">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-3xl text-sm leading-relaxed text-muted">
          El ingreso se coordina con el equipo de Redalia. Para el detalle del proceso comercial, revisá{" "}
          <Link href="/unete" className="font-semibold text-brand-gold-deep underline-offset-2 hover:underline">
            Postulación
          </Link>{" "}
          o{" "}
          <Link href="/planes" className="font-semibold text-brand-gold-deep underline-offset-2 hover:underline">
            Membresía
          </Link>
          .
        </p>
      </section>

      <section className="border-y border-brand-navy/10 bg-[linear-gradient(180deg,#f1f5f9_0%,#fff_45%,#f8fafc_100%)] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Directorio"
            title="Socios con presencia en el catálogo"
            description="Listado derivado de publicaciones activas: orden institucional por actividad, sin duplicar marcas y con la matriz del feed tratada según las reglas acordadas. Los contactos son los publicados en cada ficha —criterio y transparencia frente al mercado."
            titleVariant="display"
          />

          {stats && stats.geographicPresenceLabels.length > 0 && (
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm leading-relaxed text-muted">
              <span className="font-semibold text-brand-navy">Presencia geográfica en fichas del catálogo:</span>{" "}
              {stats.geographicPresenceLabels.join(" · ")}
            </p>
          )}

          {entries.length === 0 && (
            <div className="mx-auto mt-12 max-w-2xl overflow-hidden rounded-2xl border border-brand-gold/25 bg-white shadow-lg">
              <div className="border-b border-brand-navy/10 bg-brand-navy px-6 py-4 text-center text-white">
                <p className="redalia-eyebrow redalia-eyebrow--onNavy !mb-0 text-center">Directorio</p>
                <p className="mt-1 text-sm text-white/85">Sin entradas que cumplan los criterios actuales</p>
              </div>
              <div className="px-8 py-12 text-center">
                <p className="text-lg font-semibold text-brand-navy">Tu marca en un espacio de alto estándar</p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Cuando haya publicaciones que asocien corredoras o anunciantes según las reglas de la red, aparecerán
                  acá automáticamente. Mientras tanto podés explorar el catálogo o conversar con el equipo.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/unete" className="btn-redalia-gold-solid min-w-[200px]">
                    Postular como socio
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
            <>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {pagedEntries.map((entry) => (
                <li key={entry.partnerKey}>
                  <PartnerDirectoryCard entry={entry} variant="default" />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav
                className="mt-8 flex flex-col items-center gap-4 border-t border-brand-navy/10 pt-6 sm:flex-row sm:justify-between"
                aria-label="Paginación socios"
              >
                <p className="text-sm text-muted">
                  Página <span className="font-semibold text-brand-navy">{safePage}</span> de{" "}
                  <span className="font-semibold text-brand-navy">{totalPages}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {safePage > 1 ? (
                    <Link
                      href={pageHref(safePage - 1)}
                      className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
                    >
                      Anterior
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center rounded-full border border-brand-navy/10 px-4 py-2 text-sm font-semibold text-muted opacity-50">
                      Anterior
                    </span>
                  )}
                  {safePage < totalPages ? (
                    <Link
                      href={pageHref(safePage + 1)}
                      className="inline-flex items-center rounded-full border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40 hover:bg-brand-navy-soft/50"
                    >
                      Siguiente
                    </Link>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center rounded-full border border-brand-navy/10 px-4 py-2 text-sm font-semibold text-muted opacity-50">
                      Siguiente
                    </span>
                  )}
                </div>
              </nav>
            )}
            </>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLogoMark size="sm" className="mx-auto mb-5" />
        <CTASection
          title="¿Querés sumar tu corredora al directorio y a la comunidad?"
          description="Coordinamos una reunión para revisar admisión, visibilidad y plan de membresía —sin compromiso y con el mismo tono profesional que en el resto de la red."
          primaryHref="/planes"
          primaryLabel="Ver membresía"
          secondaryHref="/unete"
          secondaryLabel="Postular como socio"
          footnote="Si ya operás con la comunidad, el equipo te indicará los pasos para visibilidad pública cuando corresponda."
        />
      </section>
    </div>
  );
}
