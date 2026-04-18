import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { SectionLogoMark } from "@/components/brand/SectionLogoMark";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";
import { EvidenceSection } from "@/components/sections/EvidenceSection";
import { ListingPulseStrip } from "@/components/sections/ListingPulseStrip";
import { PartnerLogosStrip } from "@/components/sections/PartnerLogosStrip";
import { TangibleValueForBrokers } from "@/components/sections/TangibleValueForBrokers";
import { PartnerDirectoryPreview } from "@/components/sections/PartnerDirectoryPreview";
import { getProperties, getPartnerDirectoryExtraDrafts } from "@/lib/get-properties";
import { loadPublicMcpNetworkOverlay } from "@/lib/kiteprop-mcp";
import { buildPublicDirectorySnapshot } from "@/lib/public-data";
import { NetworkMcpSignalsSection } from "@/components/sections/NetworkMcpSignalsSection";
import { siteConfig } from "@/lib/site-config";

const heroImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=82";

/** Pilares explícitos de la propuesta institucional (copy breve por ítem). */
const pilaresRedalia = [
  { title: "Negocios reales", text: "Prioridad a visitas, ofertas y cierres concretos —no a ruido ni volumen vacío." },
  { title: "Comunidad profesional", text: "Corredoras y agentes que comparten estándar de rigurosidad comercial." },
  { title: "Canje y colaboración eficiente", text: "Oportunidades que circulan con reglas claras y seguimiento serio." },
  { title: "Honestidad y transparencia", text: "Roles y acuerdos que se entienden desde el inicio, sin letra chica escondida." },
  { title: "Profesionalismo", text: "Respeto por tu marca y por la relación directa con comprador o arrendatario." },
  { title: "Capacitación continua", text: "Formación aplicable al terreno: negociación, operación y buenas prácticas." },
  { title: "Tecnología al servicio de la comunidad", text: "Herramientas que ordenan difusión y gestión sin sustituir el criterio del corredor." },
  { title: "Más y mejores cierres", text: "Meta explícita de la red: ejecutar mejor entre socios, no solo exponer más." },
];

const benefits = [
  {
    title: "Canje y cartera en circulación",
    text: "Más alternativas concretas para el cliente y socios que mueven tu oferta con el mismo estándar profesional.",
  },
  {
    title: "Visibilidad dentro de la comunidad",
    text: "Tu marca entre pares que negocian; menos dispersión que en portales abiertos y más intención de cierre.",
  },
  {
    title: "Coordinación con respaldo",
    text: "Criterios compartidos para difusión y seguimiento, con acompañamiento según tu plan de membresía.",
  },
  {
    title: "Capacitación aplicable",
    text: "Instancias pensadas para el día siguiente en terreno: visitas, propuestas y negociación con rigor.",
  },
  {
    title: "Alineación a tu escala",
    text: "Orientación según tamaño de equipo, territorio y tipo de operación —sin receta única forzada.",
  },
  {
    title: "Tu criterio, tu cliente",
    text: "La comunidad potencia canales y colaboración; la relación con la contraparte sigue siendo tuya.",
  },
];

export default async function HomePage() {
  const catalog = await getProperties();
  const listingCount = catalog.ok ? catalog.properties.length : 0;
  const directorySnapshot =
    catalog.ok
      ? buildPublicDirectorySnapshot(catalog.properties, {
          featuredMax: 8,
          extraDirectoryDrafts: getPartnerDirectoryExtraDrafts(catalog),
        })
      : null;
  const mcpOverlay = await loadPublicMcpNetworkOverlay();

  return (
    <>
      <PageHero
        variant="navy-image"
        imageSrc={heroImage}
        imageAlt=""
        prepend={
          <>
            <SectionLogoMark size="lg" align="start" className="mb-4" />
            <p className="redalia-eyebrow redalia-eyebrow--onNavy redalia-eyebrow--compact max-w-xl">
              {siteConfig.brandLockup}
            </p>
            <p className="redalia-hero-tagline mt-2">{siteConfig.tagline}</p>
          </>
        }
        title="Redalia: negocios reales, canje y colaboración profesional para tu corredora"
        lead="Corredoras y agentes en Chile comparten oportunidades con criterio, ordenan la operación y fortalecen su marca dentro de una comunidad seria —sin sustituir tu relación directa con el cliente."
        footnote="Incorporación conversada · Estándares entre socios · Membresía con acompañamiento · Capacitación y catálogo alineados a la operación"
        contentClassName="py-20 sm:py-24 lg:py-28"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link href="/contacto" className="btn-redalia-gold-solid px-8 py-3.5">
            Coordinar conversación comercial
          </Link>
          <Link href="/unete" className="btn-redalia-outline-on-navy px-8 py-3.5">
            Postular como socio
          </Link>
          <Link href="/propiedades" className="btn-redalia-ghost-on-navy px-8 py-3.5">
            Ver catálogo
          </Link>
        </div>
      </PageHero>

      <section className="border-b border-brand-navy/10 bg-gradient-to-b from-brand-navy-soft via-white to-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Propuesta institucional"
            title="Pilares de Redalia"
            description="Criterios explícitos que ordenan la relación entre socios y el trato con el mercado: negocio antes que volumen, y comunidad antes que exposición vacía."
            titleVariant="display"
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pilaresRedalia.map((t, index) => (
              <li
                key={t.title}
                className="card-elevated relative rounded-2xl border border-brand-navy/10 border-l-[3px] border-l-brand-gold bg-white py-6 pl-5 pr-4 shadow-sm sm:py-7 sm:pl-6 sm:pr-5"
              >
                <span
                  className="font-display text-2xl font-bold tabular-nums text-brand-gold-deep/90"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-base font-semibold leading-snug text-brand-navy">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ListingPulseStrip listingCount={listingCount} feedOk={catalog.ok} />

      {mcpOverlay ? <NetworkMcpSignalsSection overlay={mcpOverlay} /> : null}

      <PartnerDirectoryPreview feedOk={catalog.ok} snapshot={directorySnapshot} />

      <TangibleValueForBrokers />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLogoMark size="md" className="mb-6" />
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeader
              eyebrow="Qué es Redalia"
              title="Una red para ejecutar negocios, no para acumular tarjetas"
              description="Somos una comunidad de corredoras y agentes en Chile orientada al negocio compartido: canje, visitas coordinadas y estándares que dan previsibilidad entre socios y hacia el mercado."
              titleVariant="display"
            />
            <p className="mt-6 text-base leading-relaxed text-muted">
              La tecnología ordena publicaciones y seguimiento; el valor está en la colaboración concreta entre
              profesionales que quieren cerrar más —no en el discurso de «networking» sin operación detrás.
            </p>
            <Link
              href="/que-es"
              className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline"
            >
              Leer posicionamiento completo →
            </Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl ring-1 ring-brand-navy/10">
            <span className="img-editorial relative block h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=82"
                alt="Equipo de corretaje en reunión de trabajo"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </span>
            <div className="pointer-events-none absolute inset-0 z-[2] ring-1 ring-inset ring-brand-navy/10" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <EvidenceSection />
      </section>

      <PartnerLogosStrip />

      <section className="border-y border-brand-navy/10 bg-brand-navy-soft/50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            align="center"
            eyebrow="Pertenencia y valor"
            title="Lo que la comunidad pone sobre la mesa"
            description="Beneficios concretos para quien vive el corretaje: canje, colaboración, visibilidad entre pares, capacitación y respaldo para cerrar mejor."
            titleVariant="display"
          />
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="card-elevated relative overflow-hidden rounded-2xl border border-brand-navy/10 bg-white p-6 transition hover:border-brand-gold/35"
              >
                <div className="redalia-card-accent" />
                <h3 className="text-lg font-semibold text-brand-navy">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link href="/colaboracion" className="btn-redalia-outline-on-light px-6 py-3">
              Canje y colaboración
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="section-institutional-panel mb-10 py-10 pl-6 pr-6 sm:py-12 sm:pl-8 sm:pr-10">
          <SectionLogoMark size="md" className="relative z-[1] mb-5" />
          <div className="relative z-[1] mx-auto max-w-2xl text-center">
            <p className="redalia-eyebrow redalia-eyebrow--onLight">Formación</p>
            <h2 className="redalia-h2-section mt-1 max-w-none text-center sm:text-[1.35rem] lg:text-[1.4rem]">
              Capacitación continua al servicio del cierre
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Instancias regulares en práctica comercial y actualización del rubro, para negociar con más seguridad
              frente a clientes y con rigor frente a socios de la red.
            </p>
            <Link
              href="/capacitacion"
              className="mt-5 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline"
            >
              Ver enfoque de capacitación →
            </Link>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-brand-navy/10 lg:order-2">
            <span className="img-editorial relative block h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82"
                alt="Coordinación entre equipos de corretaje"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </span>
          </div>
          <div className="lg:order-1">
            <SectionHeader
              eyebrow="Negocio compartido"
              title="De la charla informal a la red que cierra"
              description="Redalia ordena la colaboración: criterios para compartir oportunidades, coordinación de visitas y marco para comisiones cuando la operación lo requiere —todo con foco en ejecutar."
              titleVariant="display"
            />
            <ul className="mt-6 space-y-4 text-muted">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Circulación de oferta</strong> con socios que comparten el mismo
                  estándar de seriedad comercial.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Cooperación entre profesionales</strong> que cuidan la reputación
                  de cada marca en cada paso.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Operación sostenible</strong> con difusión y seguimiento alineados
                  a la realidad del corretaje en Chile.
                </span>
              </li>
            </ul>
            <Link
              href="/servicios"
              className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline"
            >
              Servicios de acompañamiento →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-navy/10 bg-brand-navy-soft/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            align="center"
            eyebrow="Recorridos según rol"
            title="Corredoras y agentes en la misma comunidad"
            description="Un solo marco de pertenencia, con recorridos distintos según rol: escala, marca y forma de captar negocios reales."
            titleVariant="display"
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm ring-1 ring-brand-navy/[0.04]">
              <h3 className="font-display text-xl font-bold text-brand-navy">Para corredoras</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Coordinación entre equipos, más canales para tu oferta y estructura de canje que respete tu independencia
                frente al mercado.
              </p>
              <Link href="/planes" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Ver membresía →
              </Link>
            </div>
            <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm ring-1 ring-brand-navy/[0.04]">
              <h3 className="font-display text-xl font-bold text-brand-navy">Para agentes inmobiliarios</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Más oportunidades para ofrecer, colegas con foco en cierre y respaldo institucional para ordenar tu
                pipeline comercial.
              </p>
              <Link href="/unete" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Postular como socio →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <p className="redalia-eyebrow redalia-eyebrow--muted mx-auto !mb-0 max-w-xl text-center">
          Pertenencia a la comunidad
        </p>
        <SectionLogoMark size="sm" className="mb-6 mt-3" />
        <CTASection
          title="¿Tu corredora quiere sumarse a Redalia?"
          description="Coordinamos una conversación sin compromiso: canje, transparencia en la colaboración y membresía con acompañamiento, según la escala de tu operación en Chile."
          primaryHref="/contacto"
          primaryLabel="Coordinar conversación comercial"
          secondaryHref="/unete"
          secondaryLabel="Postular como socio"
          tertiaryHref="/propiedades"
          tertiaryLabel="Ver catálogo"
          footnote="Respuesta en días hábiles, por el canal que indiques, con claridad y sin presión indebida."
        />
      </section>
    </>
  );
}
