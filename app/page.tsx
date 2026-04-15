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
import { getProperties } from "@/lib/get-properties";
import { buildPublicDirectorySnapshot } from "@/lib/public-data";

const heroImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=82";

const trustSignals = [
  {
    title: "Estructura comercial",
    text: "Reglas de colaboración y canje acordadas entre socios, con respaldo del equipo de la red.",
  },
  {
    title: "Incorporación por perfil",
    text: "Conversación previa sobre zona, operación y expectativas antes de sumar oferta al ecosistema.",
  },
  {
    title: "Foco en cierres",
    text: "Prioridad a visitas, propuestas y negocios concretos, no a volumen de reuniones sin resultado.",
  },
];

const benefits = [
  {
    title: "Canje y cartera en circulación",
    text: "Ampliás lo que podés ofrecer al cliente y otros socios profesionalizan la difusión de tus publicaciones.",
  },
  {
    title: "Visibilidad dentro de la red",
    text: "Tu marca en un entorno de corredores; menos ruido que en portales abiertos y más intención comercial.",
  },
  {
    title: "Coordinación con respaldo",
    text: "Criterios compartidos para seguimiento y difusión, con acompañamiento según tu plan de participación.",
  },
  {
    title: "Capacitación aplicable",
    text: "Formación en práctica comercial y herramientas para usar el día siguiente en visitas y negociación.",
  },
  {
    title: "Alineación a tu escala",
    text: "Corredoras y agentes reciben orientación acorde a tamaño de equipo, territorio y tipo de operación.",
  },
  {
    title: "Tu criterio, tu cliente",
    text: "La red potencia canales y colaboración; la relación directa con el comprador o arrendatario sigue siendo tuya.",
  },
];

export default async function HomePage() {
  const catalog = await getProperties();
  const listingCount = catalog.ok ? catalog.properties.length : 0;
  const directorySnapshot =
    catalog.ok ? buildPublicDirectorySnapshot(catalog.properties, { featuredMax: 8 }) : null;

  return (
    <>
      <PageHero
        variant="navy-image"
        imageSrc={heroImage}
        imageAlt=""
        prepend={<SectionLogoMark size="lg" align="start" className="mb-2" />}
        eyebrow="Red inmobiliaria colaborativa · Chile"
        title="Redalia: más negocios para tu corredora, con canje y colaboración profesional"
        lead="Unimos corredoras y agentes para que compartan oportunidades con criterio, ordenen la operación y ganen exposición dentro de una red seria —sin sustituir tu marca ni tu relación con el cliente."
        footnote="Incorporación conversada · Estándares entre socios · Catálogo y formación alineados a la operación de la red"
        contentClassName="py-20 sm:py-24 lg:py-28"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold text-brand-navy shadow-lg transition hover:bg-[#d4b82e]"
          >
            Pedir reunión comercial
          </Link>
          <Link
            href="/unete"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Postular a la red
          </Link>
          <Link
            href="/propiedades"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-white/95 transition hover:bg-white/10"
          >
            Ver oportunidades publicadas
          </Link>
        </div>
      </PageHero>

      <ListingPulseStrip listingCount={listingCount} feedOk={catalog.ok} />

      <PartnerDirectoryPreview feedOk={catalog.ok} snapshot={directorySnapshot} />

      <section className="border-b border-brand-navy/10 bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-brand-navy/55">
            Por qué la red se siente distinta
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {trustSignals.map((t) => (
              <li
                key={t.title}
                className="card-elevated rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/50 px-5 py-6 text-center"
              >
                <h3 className="text-sm font-semibold text-brand-navy">{t.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{t.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

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
            <span className="img-tech-wrap relative block h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=82"
                alt="Equipo profesional en entorno corporativo moderno"
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
            eyebrow="Valor para socios"
            title="Lo que la red pone sobre la mesa"
            description="Beneficios tangibles para quienes viven el corretaje: colaboración, visibilidad, formación y respaldo comercial."
            titleVariant="display"
          />
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="card-elevated relative overflow-hidden rounded-2xl border border-brand-navy/10 bg-white p-6 transition hover:border-brand-gold/35"
              >
                <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-deep" />
                <h3 className="text-lg font-semibold text-brand-navy">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <Link
              href="/colaboracion"
              className="inline-flex rounded-full border border-brand-navy/20 bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-sm transition hover:border-brand-gold/40"
            >
              Profundizar: colaboración y canje
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="section-tech-panel mb-10 px-6 py-10 sm:px-10 sm:py-12">
          <SectionLogoMark size="md" className="relative z-[1] mb-5" />
          <div className="relative z-[1] mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold-deep">Formación</p>
            <h2 className="font-display mt-3 text-2xl font-bold leading-tight tracking-tight text-brand-navy sm:text-[1.75rem] lg:text-[2rem]">
              Capacitación al servicio del negocio
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
              Instancias continuas en práctica comercial, herramientas y actualización del rubro, para desempeñar con más
              seguridad frente a clientes y socios.
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
            <span className="img-tech-wrap relative block h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82"
                alt="Reunión estratégica y networking profesional"
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

      <section className="bg-brand-navy-soft/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionLogoMark size="sm" className="mb-5" />
          <SectionHeader
            align="center"
            eyebrow="Audiencias"
            title="Corredoras y agentes en el mismo marco"
            description="Una sola red con recorridos distintos según rol: escala, marca y forma de captar negocios."
            titleVariant="display"
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-navy">Para corredoras</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Coordinación entre equipos, más canales para tu oferta y estructura de canje que respete tu independencia
                frente al mercado.
              </p>
              <Link href="/planes" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Ver niveles de membresía →
              </Link>
            </div>
            <div className="card-elevated rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-navy">Para agentes inmobiliarios</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Más propiedades para ofrecer, red de colegas con foco en cierre y respaldo para ordenar tu pipeline.
              </p>
              <Link href="/unete" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Iniciar postulación →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionLogoMark size="sm" className="mb-8" />
        <CTASection
          title="¿Tu corredora está lista para más colaboración seria?"
          description="Agendá una reunión comercial sin compromiso: revisamos canje, visibilidad y el nivel de participación que mejor calce con tu operación."
          primaryHref="/contacto"
          primaryLabel="Coordinar reunión"
          secondaryHref="/unete"
          secondaryLabel="Completar postulación"
          tertiaryHref="/propiedades"
          tertiaryLabel="Explorar catálogo"
          footnote="Te respondemos por el canal que indiques, en días hábiles, con propuesta clara de próximos pasos."
        />
      </section>
    </>
  );
}
