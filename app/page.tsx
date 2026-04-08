import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/sections/SectionHeader";
import { CTASection } from "@/components/sections/CTASection";

const heroImage =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=82";

const benefits = [
  {
    title: "Más oportunidades",
    text: "Circulación de oferta y demanda entre profesionales que trabajan con criterio comercial.",
  },
  {
    title: "Más visibilidad",
    text: "Tu marca y tus propiedades con mayor exposición dentro de un ecosistema alineado al negocio.",
  },
  {
    title: "Networking de valor",
    text: "Encuentros y vínculos con corredoras y agentes que buscan cerrar, no solo “conectar”.",
  },
  {
    title: "Acompañamiento personalizado",
    text: "Seguimiento cercano según tu perfil: metas, zona y tipo de operación.",
  },
  {
    title: "Mejor circulación de oferta",
    text: "Canales y criterios para que lo publicado llegue a quien puede moverlo.",
  },
  {
    title: "Mayor proyección comercial",
    text: "Herramientas y criterios de posicionamiento para ordenar tu presencia en el mercado.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover opacity-40"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/80" />
        </div>
        <div className="bg-mesh relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold">Red de alianzas inmobiliarias</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Una red diseñada para acercar negocios reales a corredoras y agentes
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/90">
            Redalia combina relaciones profesionales, tecnología y visibilidad comercial para potenciar
            alianzas estratégicas —con foco en resultados concretos, no en promesas vacías.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/unete"
              className="inline-flex items-center justify-center rounded-full bg-brand-gold px-8 py-3.5 text-sm font-semibold text-brand-navy shadow-lg transition hover:bg-[#d4b82e]"
            >
              Sumarme a la red
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center rounded-full border border-white/35 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Coordinar una presentación
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeader
              eyebrow="Qué es Redalia"
              title="Una de las propuestas más sólidas para ordenar tu canal comercial"
              description="Redalia es una red de alianzas inmobiliarias: un espacio donde corredoras y agentes comparten criterio, oportunidades y herramientas. El foco está en acercar negocios y dar estructura a la relación entre oferta, demanda y profesionales que ejecutan."
            />
            <p className="mt-6 text-base leading-relaxed text-muted">
              No se trata solo de una vitrina: es una red orientada a oportunidades reales, con
              acompañamiento y tecnología al servicio del negocio —para que la colaboración se traduzca
              en gestión y visibilidad.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=82"
              alt="Equipo profesional en entorno corporativo moderno"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-brand-navy/10" />
          </div>
        </div>
      </section>

      <section className="border-y border-brand-navy/10 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Beneficios"
            title="Estructura de alto valor para quienes ejecutan en terreno"
            description="Beneficios pensados para el día a día comercial: claridad, circulación y respaldo."
          />
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <li
                key={b.title}
                className="rounded-2xl border border-brand-navy/10 bg-brand-navy-soft/40 p-6 transition hover:border-brand-gold/35"
              >
                <div className="mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-brand-gold to-brand-gold-deep" />
                <h3 className="text-lg font-semibold text-brand-navy">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:order-2">
            <Image
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=82"
              alt="Reunión estratégica y networking profesional"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="lg:order-1">
            <SectionHeader
              eyebrow="Por qué no es solo otra plataforma"
              title="Red profesional, foco en resultados"
              description="Redalia se sostiene en vínculos directos con los miembros, criterios comerciales compartidos y uso inteligente de tecnología."
            />
            <ul className="mt-6 space-y-4 text-muted">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Relación directa</strong> con la red: menos ruido,
                  más conversaciones útiles.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Propuesta premium</strong> en tono, materiales y
                  forma de trabajar las oportunidades.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-gold" />
                <span>
                  <strong className="text-brand-navy">Tecnología al servicio del negocio</strong> para
                  ordenar publicaciones, difusión y seguimiento (según integraciones disponibles).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-brand-navy-soft/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            align="center"
            eyebrow="Audiencias"
            title="Pensado para corredoras y para agentes"
            description="La misma red, con matices según tu rol: escala, marca y forma de captar negocios."
          />
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-navy">Para corredoras</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Fortalecé posicionamiento de marca, coordiná oportunidades entre equipos y sumá canales
                de difusión alineados a tu operación —con una estructura que respeta tu independencia
                comercial.
              </p>
              <Link href="/planes" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Ver niveles de participación →
              </Link>
            </div>
            <div className="rounded-2xl border border-brand-navy/10 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold text-brand-navy">Para agentes inmobiliarios</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ampliá red de contactos, accedé a circulación de propiedades y contá con respaldo para
                ordenar tu pipeline —con herramientas y acompañamiento según tu perfil.
              </p>
              <Link href="/unete" className="mt-6 inline-flex text-sm font-semibold text-brand-gold-deep hover:underline">
                Postular a la red →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <CTASection
          title="¿Querés ver si Redalia encaja con tu operación?"
          description="Coordinemos una conversación breve o una presentación de la propuesta. Sin presión: foco en claridad y próximos pasos."
          primaryHref="/contacto"
          primaryLabel="Ir a contacto"
          secondaryHref="/propiedades"
          secondaryLabel="Ver propiedades"
        />
      </section>
    </>
  );
}
